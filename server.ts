import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK with server-side User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health / status endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!apiKey,
    model: 'gemini-3.8-flash',
  });
});

// Helper for calling Gemini safely with JSON parsing
async function callGeminiJson<T>(systemInstruction: string, prompt: string): Promise<T> {
  if (!ai) {
    throw new Error('Gemini API key is not configured on the server. Please use Demo mode.');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction: `${systemInstruction}\nReturn ONLY valid JSON matching the requested structure. Do not wrap in markdown quotes if possible, or return raw JSON.`,
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  const text = response.text?.trim() || '';
  if (!text) {
    throw new Error('Received empty response from Gemini model');
  }

  try {
    return JSON.parse(text) as T;
  } catch (parseErr) {
    // Attempt markdown block cleanup if present
    const cleaned = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned) as T;
  }
}

// 1. Signal Digest Endpoint (Maker + Checker)
app.post('/api/ai/signal-digest', async (req, res) => {
  try {
    const { signals, strategy } = req.body;
    if (!signals || !Array.isArray(signals)) {
      return res.status(400).json({ error: 'signals array is required' });
    }

    // Maker call: groups signals and extracts opportunities
    const makerPrompt = `Analyze the following customer and product signals for Flowdesk:
Strategy Context: ${JSON.stringify(strategy || {})}
Signals:
${signals.map((s: any) => `ID: ${s.id} | Title: ${s.title} | Category: ${s.category} | Text: ${s.originalSourceText} | Customer: ${s.customerSegment}`).join('\n\n')}

Task: Group related signals into actionable clusters. For each cluster propose:
1. clusterName
2. sourceSignalIds (MUST only be real IDs from the input signals)
3. coreObservation (strictly factual from the signals)
4. inferredOpportunity (how Flowdesk can solve it)
5. urgency ('High' | 'Medium' | 'Low')`;

    const makerOutput = await callGeminiJson<any>(
      'You are a senior Product Operations Maker agent. You extract patterns from incoming signals. You never fabricate quotes or IDs.',
      makerPrompt
    );

    // Separate Checker call: evaluates source ID validity and evidence fidelity
    const checkerPrompt = `Evaluate this signal digest proposal:
Original Signal IDs: ${signals.map((s: any) => s.id).join(', ')}
Proposed Clusters:
${JSON.stringify(makerOutput)}

Rules:
1. Every sourceSignalId in each cluster MUST exist in the original signals list.
2. Inferred opportunity must not contradict strategy.
3. Core observations must not invent unmentioned facts.

Return JSON:
{
  "passed": boolean,
  "evaluatedClustersCount": number,
  "findings": string[],
  "invalidSourceIds": string[],
  "ruleViolations": string[]
}`;

    const checkerOutput = await callGeminiJson<any>(
      'You are an independent Gate Checker agent. You strictly audit proposals for evidence fidelity and hallucination.',
      checkerPrompt
    );

    res.json({
      maker: makerOutput,
      checker: checkerOutput,
      passed: checkerOutput.passed,
    });
  } catch (err: any) {
    console.error('Signal digest error:', err);
    res.status(500).json({
      error: err.message || 'Failed to run signal digest with Gemini',
      recoverable: true,
    });
  }
});

// 2. Priority Ranking Endpoint (Separate Maker & Checker)
app.post('/api/ai/rank-maker', async (req, res) => {
  try {
    const { opportunities, strategy } = req.body;
    const prompt = `You are a quantitative Product Manager Maker.
Current Strategy (v${strategy?.version || 1}):
Target: ${strategy?.targetCustomers || ''}
Objectives: ${JSON.stringify(strategy?.currentObjectives || [])}
Non-goals: ${JSON.stringify(strategy?.explicitNonGoals || [])}

Opportunities:
${JSON.stringify(opportunities, null, 2)}

Formula: Priority = Reach * Impact * Confidence / Effort.
Allowed inputs:
- Reach: affected accounts / quarter (integer > 0)
- Impact: 0.5 (low), 1.0 (medium), 2.0 (high), 3.0 (critical)
- Confidence: 0.0 to 1.0
- Effort: person-weeks (> 0)

Propose updated scores and rank order for these opportunities.
For each opportunity, reference supporting evidence IDs and explain trade-offs against current non-goals.
Return JSON:
{
  "proposedRankings": [
    {
      "opportunityId": string,
      "reach": number,
      "impact": number,
      "confidence": number,
      "effort": number,
      "priorityScore": number,
      "strategyAlignment": "Strong" | "Moderate" | "Conflicting" | "Neutral",
      "tradeOffRationale": string,
      "supportingEvidenceIds": string[]
    }
  ],
  "makerSummary": string
}`;

    const makerResult = await callGeminiJson<any>(
      'You propose quantitative prioritization scores based strictly on evidence and strategy alignment.',
      prompt
    );
    res.json(makerResult);
  } catch (err: any) {
    console.error('Rank maker error:', err);
    res.status(500).json({ error: err.message || 'Failed to run Rank Maker', recoverable: true });
  }
});

app.post('/api/ai/rank-checker', async (req, res) => {
  try {
    const { proposedRankings, strategy, opportunities } = req.body;
    const prompt = `You are an independent Backlog Checker agent.
Strategy:
Target: ${strategy?.targetCustomers}
Non-goals: ${JSON.stringify(strategy?.explicitNonGoals)}

Opportunities:
${JSON.stringify(opportunities)}

Proposed Rankings from Maker:
${JSON.stringify(proposedRankings)}

Rules:
1. If an opportunity promotes a non-goal (e.g. enterprise-only bespoke features), strategyAlignment MUST be "Conflicting" and it must FAIL the check.
2. Verify priority formula: Score = Reach * Impact * Confidence / Effort (allow small rounding differences).
3. Check if supportingEvidenceIds are valid.
4. Flag missing assumptions.

Return JSON:
{
  "passed": boolean,
  "confidenceScore": number,
  "findings": string[],
  "strategyViolations": string[],
  "scoringAnomalies": string[],
  "recommendations": string[]
}`;

    const checkerResult = await callGeminiJson<any>(
      'You are a strict Gate Checker evaluating proposal consistency and non-goal compliance.',
      prompt
    );
    res.json(checkerResult);
  } catch (err: any) {
    console.error('Rank checker error:', err);
    res.status(500).json({ error: err.message || 'Failed to run Rank Checker', recoverable: true });
  }
});

// 3. Solution Concept Exploration
app.post('/api/ai/explore-concepts', async (req, res) => {
  try {
    const { opportunity, signals, strategy } = req.body;
    const prompt = `Generate 5 distinct solution concepts for the following opportunity:
Opportunity: ${opportunity.title}
Problem Statement: ${opportunity.problemStatement}
Target Segment: ${opportunity.targetSegment}
Strategy Objectives: ${JSON.stringify(strategy?.currentObjectives || [])}
Supporting Signals:
${JSON.stringify(signals || [])}

Generate 5 DISTINCT architectural / UX approaches.
Each concept MUST have:
- title: string
- approach: string
- userJourney: string (step by step)
- expectedBenefit: string
- supportingEvidence: string[] (referencing signal IDs)
- assumptions: string[]
- dependencies: string[]
- effortWeeks: number
- risks: string[]
- smallestExperiment: string
- successMetric: string
- guardrailMetric: string
- wireframeType: "interactive_checklist" | "in_context_guide" | "template_gallery" | "wizard_flow" | "empty_state_boost"

Return JSON:
{
  "concepts": [ ...5 items... ]
}`;

    const result = await callGeminiJson<any>(
      'You are a senior Product Design Architect who generates varied, robust product solution concepts.',
      prompt
    );
    res.json(result);
  } catch (err: any) {
    console.error('Explore concepts error:', err);
    res.status(500).json({ error: err.message || 'Failed to explore concepts', recoverable: true });
  }
});

// 4. Synthetic Review Endpoint
app.post('/api/ai/synthetic-review', async (req, res) => {
  try {
    const { concepts, opportunity } = req.body;
    const prompt = `Conduct a synthetic review for these 5 solution concepts for: "${opportunity.title}".
Concepts:
${JSON.stringify(concepts)}

Explicit simulated perspectives:
1. New User (evaluates cognitive load, immediate clarity, self-serve friction)
2. Experienced User (evaluates power-user efficiency, clutter, shortcut disruption)
3. Administrator / Buyer (evaluates governance, seat provisioning, security, pricing impact)

Evaluate usefulness, usability, feasibility, and strategy alignment (scale 1-10).
List genuine disagreements and evidence gaps.
Recommend exactly two concepts for shortlist with clear rationale.

Return JSON:
{
  "disclaimer": "Synthetic review: AI-generated hypotheses, not customer research.",
  "perspectives": {
    "newUser": { "sentiment": "Positive" | "Neutral" | "Critical", "comments": string, "usabilityNotes": string, "frictionAlerts": string[] },
    "experiencedUser": { "sentiment": "Positive" | "Neutral" | "Critical", "comments": string, "efficiencyNotes": string, "clutterConcerns": string[] },
    "adminBuyer": { "sentiment": "Positive" | "Neutral" | "Critical", "comments": string, "governanceNotes": string, "securityOrCostNotes": string[] }
  },
  "criteria": { "usefulness": number, "usability": number, "feasibility": number, "strategyAlignment": number },
  "disagreements": string[],
  "evidenceGaps": string[],
  "recommendedConceptTitles": string[],
  "recommendationReasoning": string
}`;

    const result = await callGeminiJson<any>(
      'You are a synthetic user research simulator testing product concepts from multiple personas.',
      prompt
    );
    res.json(result);
  } catch (err: any) {
    console.error('Synthetic review error:', err);
    res.status(500).json({ error: err.message || 'Failed to run synthetic review', recoverable: true });
  }
});

// 5. Decision Challenge ("What could make this the wrong decision?")
app.post('/api/ai/decision-challenge', async (req, res) => {
  try {
    const { concept, alternativeConcept, opportunity, strategy } = req.body;
    const prompt = `You are a critical Executive Decision Thinking Partner.
The Product Lead is about to approve Concept: "${concept.title}"
Over Alternative Concept: "${alternativeConcept?.title || 'Alternative'}"
Opportunity: "${opportunity.title}"
Strategy: ${JSON.stringify(strategy)}

Challenge the proposed decision with rigor:
1. Plausible failure scenario (how this could backfire post-launch).
2. The weakest assumption being taken for granted.
3. Evidence that would change the recommendation (what data should make us reconsider).
4. Low-cost validation step (a 2-3 day test before building the full slice).

Return JSON:
{
  "plausibleFailureScenario": string,
  "weakestAssumption": string,
  "evidenceThatWouldChangeRecommendation": string,
  "lowCostValidationStep": string
}`;

    const result = await callGeminiJson<any>(
      'You are a red-team product strategist who uncovers blind spots and critical failure modes.',
      prompt
    );
    res.json(result);
  } catch (err: any) {
    console.error('Decision challenge error:', err);
    res.status(500).json({ error: err.message || 'Failed to run decision challenge', recoverable: true });
  }
});

// 6. Delivery Brief & Drift Check
app.post('/api/ai/shape-brief', async (req, res) => {
  try {
    const { concept, opportunity } = req.body;
    const prompt = `Shape an engineering delivery brief for:
Concept: ${concept.title}
Approach: ${concept.approach}
Opportunity: ${opportunity.title}

Generate structured delivery slice specifications:
- problemAndOutcome: string
- inScope: string[]
- outOfScope: string[]
- userStories: Array<{ asA: string, iWant: string, soThat: string }>
- acceptanceCriteria: string[] (clear Gherkin/verifiable statements)
- dependencies: string[]
- risks: string[]
- analyticsEvents: Array<{ eventName: string, trigger: string, properties: string }>
- successThreshold: string
- guardrailMetrics: string[]
- rolloutRollbackApproach: string

Return JSON matching these exact fields.`;

    const result = await callGeminiJson<any>(
      'You are a Technical Product Manager writing airtight, unambiguous engineering delivery briefs.',
      prompt
    );
    res.json(result);
  } catch (err: any) {
    console.error('Shape brief error:', err);
    res.status(500).json({ error: err.message || 'Failed to shape delivery brief', recoverable: true });
  }
});

app.post('/api/ai/drift-check', async (req, res) => {
  try {
    const { brief, approvedConcept, strategy } = req.body;
    const prompt = `Compare the current delivery brief against the approved concept and strategy:
Approved Concept:
${JSON.stringify(approvedConcept)}

Current Brief (Acceptance criteria & Scope):
${JSON.stringify(brief)}

Strategy Non-Goals:
${JSON.stringify(strategy?.explicitNonGoals || [])}

Evaluate whether scope creep or spec drift has occurred since the human decision.
Return JSON:
{
  "hasDrift": boolean,
  "driftSeverity": "None" | "Low" | "Moderate" | "High",
  "driftDetails": string,
  "recommendations": string[]
}`;

    const result = await callGeminiJson<any>(
      'You are an independent Spec Drift Auditor comparing delivery specs against approved decisions.',
      prompt
    );
    res.json(result);
  } catch (err: any) {
    console.error('Drift check error:', err);
    res.status(500).json({ error: err.message || 'Failed to run drift check', recoverable: true });
  }
});

// 7. Outcome Review & Learning Signal
app.post('/api/ai/outcome-review', async (req, res) => {
  try {
    const { releaseData } = req.body;
    const prompt = `Analyze this simulated release outcome for Flowdesk:
${JSON.stringify(releaseData, null, 2)}

Provide an objective synthesis:
1. Metric analysis: What changed and is there experimental attribution?
2. Guardrail analysis: Did any guardrail breach acceptable thresholds?
3. Recommended action: 'Continue' | 'Iterate' | 'Recommend rollback' | 'Gather more evidence'
4. Synthesized learning signal text: A factual observation to feed back into the Signals Inbox for the next product cycle.

Return JSON:
{
  "metricAnalysis": string,
  "guardrailAnalysis": string,
  "recommendedAction": "Continue" | "Iterate" | "Recommend rollback" | "Gather more evidence",
  "suggestedRationale": string,
  "learningSignal": {
    "title": string,
    "summary": string,
    "inferredExplanation": string,
    "customerSegment": string,
    "impact": "High" | "Medium" | "Low"
  }
}`;

    const result = await callGeminiJson<any>(
      'You are a Product Analytics Reviewer synthesizing post-launch metrics without false attribution.',
      prompt
    );
    res.json(result);
  } catch (err: any) {
    console.error('Outcome review error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze outcome', recoverable: true });
  }
});

// ==========================================
// CENTRAL POLICY & EVALS GATEWAY ENDPOINTS
// ==========================================

// 8. Workflow Transition & Policy Gate Check
app.post('/api/policy/evaluate-transition', (req, res) => {
  try {
    const { action, role, payload, strategyVersion, currentArtifactVersion } = req.body;
    const violations: any[] = [];

    // Check Human Authorization policies
    if (action === 'simulate_release') {
      if (role !== 'engineer') {
        violations.push({
          policyId: 'POL-HA-02',
          severity: 'Critical',
          enforcement: 'Block',
          details: 'Simulated release rejected: Action must be signed by an Engineer role.',
        });
      }
      if (payload?.requiredChecksPassed === false || (payload?.openBlockers && payload.openBlockers.length > 0)) {
        violations.push({
          policyId: 'POL-WI-02',
          severity: 'Critical',
          enforcement: 'Block',
          details: 'Release blocked: Automated engineering checks failed or open P0/P1 blockers remain.',
        });
      }
    }

    if (action === 'record_human_decision') {
      if (role !== 'lead') {
        violations.push({
          policyId: 'POL-HA-02',
          severity: 'Critical',
          enforcement: 'Block',
          details: 'Decision rejected: Only Product Lead can approve concept shortlist.',
        });
      }
      if (!payload?.rationale || payload.rationale.trim().length < 10) {
        violations.push({
          policyId: 'POL-HA-02',
          severity: 'High',
          enforcement: 'Block',
          details: 'Human decision rationale must be at least 10 characters explaining trade-offs.',
        });
      }
    }

    if (action === 'shape_delivery_slice') {
      if (payload?.decisionStatus !== 'Approved') {
        violations.push({
          policyId: 'POL-WI-01',
          severity: 'Critical',
          enforcement: 'Block',
          details: 'Delivery slice generation blocked: Concept has not received human Product Lead approval.',
        });
      }
    }

    if (payload?.strategyVersionUsed && strategyVersion && payload.strategyVersionUsed < strategyVersion) {
      violations.push({
        policyId: 'POL-WI-03',
        severity: 'High',
        enforcement: 'Block',
        details: `Artifact evaluated under Strategy v${payload.strategyVersionUsed}, but workspace is currently on Strategy v${strategyVersion}.`,
      });
    }

    const allowed = violations.length === 0;
    res.json({
      allowed,
      action,
      violations,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, allowed: false });
  }
});

// 9. Rubric-based Live AI Evaluation
app.post('/api/evals/rubric-eval', async (req, res) => {
  try {
    const { taskType, candidateOutput, expectedBehavior, sourceContext } = req.body;
    if (!ai) {
      return res.status(400).json({
        error: 'Gemini API key is not configured on the server for live rubric evals.',
        recoverable: true,
      });
    }

    const prompt = `You are an independent, blind AI Evaluation Judge auditing candidate output for task: ${taskType}.
Source Context:
${JSON.stringify(sourceContext || {})}

Candidate Output:
${JSON.stringify(candidateOutput || {})}

Expected Behavior Specification:
${expectedBehavior}

Evaluate strictly against this fixed rubric (scores 1-10):
1. relevance (does it answer the task without tangential filler)
2. evidenceGrounded (are all claims backed by the source context, zero hallucinated facts)
3. strategyAlignment (complies with goals and respects non-goals)
4. clarityOfUncertainty (clearly labels assumptions and missing data)

Return JSON:
{
  "scores": {
    "relevance": number,
    "evidenceGrounded": number,
    "strategyAlignment": number,
    "clarityOfUncertainty": number
  },
  "overallPassed": boolean,
  "justification": string,
  "unsupportedClaims": string[]
}`;

    const evalResult = await callGeminiJson<any>(
      'You are a rigorous, impartial Evaluation Judge who enforces evidence fidelity and checks for ungrounded claims.',
      prompt
    );
    res.json(evalResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to run rubric eval', recoverable: true });
  }
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Product Loops server active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
