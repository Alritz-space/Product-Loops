import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SolutionConcept, HumanDecision } from '../types';
import {
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Check,
  X,
  Clock,
  History,
} from 'lucide-react';

export const DecisionsView: React.FC = () => {
  const {
    role,
    setRole,
    opportunities,
    solutionConcepts,
    humanDecisions,
    recordHumanDecision,
    runDecisionChallenge,
    strategy,
    openInspector,
    setActiveView,
    setDeliveryTab,
  } = useWorkspace();

  const opp = opportunities.find((o) => o.id === 'OPP-201') || opportunities[0];
  const shortlisted = solutionConcepts.filter((c) => c.opportunityId === opp.id && c.isShortlisted);
  const conceptA = shortlisted[0] || solutionConcepts[0];
  const conceptB = shortlisted[1] || solutionConcepts[1];

  // Active decision state
  const existingDecision = Object.values(humanDecisions).find((d) => d.opportunityId === opp.id);
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    existingDecision?.conceptId || conceptA?.id || 'SOL-301'
  );
  const [rationale, setRationale] = useState<string>(existingDecision?.rationale || '');
  const [isChallenging, setIsChallenging] = useState(false);
  const [challengeData, setChallengeData] = useState<any>(existingDecision?.aiChallengeRun || null);
  const [decisionSuccess, setDecisionSuccess] = useState(false);

  const isProductLead = role === 'lead';

  const handleRunChallenge = async () => {
    setIsChallenging(true);
    const result = await runDecisionChallenge(selectedConceptId);
    setChallengeData(result);
    setIsChallenging(false);
  };

  const handleDecisionAction = (status: 'Approved' | 'Changes Requested' | 'Deferred' | 'Rejected') => {
    if (!isProductLead) {
      alert('Only a Product Lead may authorize product decisions. Switch your demo role to Product Lead.');
      return;
    }

    if (!rationale.trim()) {
      alert('A human decision requires an explicit written rationale.');
      return;
    }

    recordHumanDecision(opp.id, selectedConceptId, status, rationale, challengeData);
    setDecisionSuccess(true);
    setTimeout(() => setDecisionSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-lime-100 text-lime-900 border border-lime-300 font-semibold">
              Stage 4: Decide
            </span>
            <span className="text-xs text-stone-500">Human Authorization Workspace</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Decisions & Trade-offs</h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Product Leads evaluate the 2 shortlisted concepts side-by-side, challenge underlying assumptions
            with red-team scenarios, and record binding rationale. AI never approves on human behalf.
          </p>
        </div>

        {/* Role Enforcement Callout */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 px-3 rounded-xl border text-xs flex items-center gap-2 ${
              isProductLead
                ? 'bg-lime-50 text-lime-900 border-lime-300 font-semibold'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-lime-700" />
            <span>Active Role: {isProductLead ? 'Product Lead (Authorized)' : 'Observer'}</span>
            {!isProductLead && (
              <button
                onClick={() => setRole('lead')}
                className="underline font-semibold text-purple-700 hover:text-purple-900 ml-1"
              >
                Switch to Lead
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Opportunity Grounding Bar */}
      <div className="bg-[#fbfaf7] p-4 rounded-xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono font-bold text-purple-700">{opp.id}</span>
            <span className="font-semibold text-stone-900">{opp.title}</span>
            <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200 text-[10px]">
              {opp.linkedSignalIds.length} Verified Evidence Signals
            </span>
          </div>
          <p className="text-stone-600 leading-snug">{opp.problemStatement}</p>
        </div>

        <button
          onClick={() => openInspector('opportunity', opp.id)}
          className="text-purple-700 hover:text-purple-900 font-semibold underline shrink-0"
        >
          Inspect Evidence Trace
        </button>
      </div>

      {/* Side-by-Side Shortlisted Concepts Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Concept A */}
        {conceptA && (
          <div
            onClick={() => setSelectedConceptId(conceptA.id)}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
              selectedConceptId === conceptA.id
                ? 'border-lime-500 ring-2 ring-lime-200'
                : 'border-stone-200 hover:border-stone-300 opacity-90'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-stone-700">
                  Concept #1: {conceptA.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedConceptId === conceptA.id
                      ? 'bg-lime-100 text-lime-900 border border-lime-300'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {selectedConceptId === conceptA.id ? 'Selected Candidate' : 'Select'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-stone-900 mb-2">{conceptA.title}</h3>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs text-stone-700 leading-relaxed mb-3">
                {conceptA.approach}
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-stone-800 text-[11px] block">User Journey:</span>
                  <p className="text-stone-600 text-[11px] leading-snug">{conceptA.userJourney}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px]">
                  <div>
                    <span className="text-stone-400 block">Effort:</span>
                    <strong className="text-stone-900">{conceptA.effortWeeks} person-weeks</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Wireframe:</span>
                    <strong className="text-purple-700">{conceptA.wireframeType}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[11px]">
                  <span className="text-stone-400 block">Smallest Experiment:</span>
                  <span className="text-stone-700">{conceptA.smallestExperiment}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
              Expected Benefit: {conceptA.expectedBenefit}
            </div>
          </div>
        )}

        {/* Concept B */}
        {conceptB && (
          <div
            onClick={() => setSelectedConceptId(conceptB.id)}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
              selectedConceptId === conceptB.id
                ? 'border-lime-500 ring-2 ring-lime-200'
                : 'border-stone-200 hover:border-stone-300 opacity-90'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-stone-700">
                  Concept #2: {conceptB.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedConceptId === conceptB.id
                      ? 'bg-lime-100 text-lime-900 border border-lime-300'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {selectedConceptId === conceptB.id ? 'Selected Candidate' : 'Select'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-stone-900 mb-2">{conceptB.title}</h3>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs text-stone-700 leading-relaxed mb-3">
                {conceptB.approach}
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-stone-800 text-[11px] block">User Journey:</span>
                  <p className="text-stone-600 text-[11px] leading-snug">{conceptB.userJourney}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px]">
                  <div>
                    <span className="text-stone-400 block">Effort:</span>
                    <strong className="text-stone-900">{conceptB.effortWeeks} person-weeks</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Wireframe:</span>
                    <strong className="text-purple-700">{conceptB.wireframeType}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[11px]">
                  <span className="text-stone-400 block">Smallest Experiment:</span>
                  <span className="text-stone-700">{conceptB.smallestExperiment}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
              Expected Benefit: {conceptB.expectedBenefit}
            </div>
          </div>
        )}
      </div>

      {/* AI Thinking Partner Red-Team Challenge */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                AI Decision Thinking Partner
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Red-team challenge: "What could make approving {selectedConceptId} the wrong decision?"
            </p>
          </div>

          <button
            onClick={handleRunChallenge}
            disabled={isChallenging}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold shadow-2xs"
          >
            {isChallenging ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Challenging Decision...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Run Decision Challenge</span>
              </>
            )}
          </button>
        </div>

        {challengeData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-red-50/50 rounded-xl border border-red-200 space-y-1">
              <div className="font-bold text-red-950 text-[11px] uppercase tracking-wider">
                Plausible Failure Scenario
              </div>
              <p className="text-red-900 leading-snug">{challengeData.plausibleFailureScenario}</p>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1">
              <div className="font-bold text-amber-950 text-[11px] uppercase tracking-wider">
                Weakest Underlying Assumption
              </div>
              <p className="text-amber-900 leading-snug">{challengeData.weakestAssumption}</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                Evidence That Would Change Recommendation
              </div>
              <p className="text-stone-700 leading-snug">
                {challengeData.evidenceThatWouldChangeRecommendation}
              </p>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 space-y-1">
              <div className="font-bold text-purple-950 text-[11px] uppercase tracking-wider">
                Low-Cost Validation Step
              </div>
              <p className="text-purple-900 leading-snug">{challengeData.lowCostValidationStep}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            Click "Run Decision Challenge" to red-team potential failure modes before authorizing.
          </div>
        )}
      </div>

      {/* Human Decision Execution Panel */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-sm text-stone-900">
              Record Binding Human Authorization
            </h3>
            <p className="text-xs text-stone-500">
              Selected Concept: <strong className="text-stone-900">{selectedConceptId}</strong> under
              Strategy v{strategy.version}
            </p>
          </div>
          {existingDecision && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-lime-100 text-lime-900 border border-lime-300">
              Status: {existingDecision.decisionStatus}
            </span>
          )}
        </div>

        <div>
          <label className="block font-semibold text-xs text-stone-800 mb-1">
            Product Lead Rationale (Mandatory: explain why this candidate was chosen and address trade-offs)
          </label>
          <textarea
            rows={3}
            required
            placeholder="E.g. Approving Concept 1 because it delivers the fastest time-to-first-value with lowest cognitive load..."
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className="w-full text-xs p-3 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-lime-500 text-stone-900"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-stone-500">
            Recorded with timestamp, role (Product Lead), concept version, and linked evidence IDs.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDecisionAction('Deferred')}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium"
            >
              Defer Decision
            </button>
            <button
              onClick={() => handleDecisionAction('Changes Requested')}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium"
            >
              Request Changes
            </button>
            <button
              onClick={() => handleDecisionAction('Approved')}
              className="px-5 py-2 bg-lime-600 hover:bg-lime-500 text-stone-900 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-stone-900" />
              <span>Approve {selectedConceptId}</span>
            </button>
          </div>
        </div>

        {decisionSuccess && (
          <div className="p-3 bg-lime-100 border border-lime-300 text-lime-900 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>
              Decision authorized and recorded into workspace history. Ready to shape delivery slice.
            </span>
            <button
              onClick={() => {
                setActiveView('delivery');
                setDeliveryTab('shape');
              }}
              className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800"
            >
              Proceed to Delivery Slice →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
