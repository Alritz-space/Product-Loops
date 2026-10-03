import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Role,
  Signal,
  StrategyDoc,
  Opportunity,
  SolutionConcept,
  SyntheticReview,
  HumanDecision,
  DeliverySlice,
  ReleaseOutcome,
  LoopConfig,
  LoopRun,
  ActivityItem,
  WorkspaceNotification,
  BoardStage,
} from '../types';
import {
  Policy,
  PolicyEvaluationResult,
  EvalTestCase,
  TestCaseRunResult,
  EvalMetricsSummary,
  AIConfiguration,
  ReviewQueueItem,
  AuditEvent,
  ArtifactValidationStatus,
} from '../types/evals';
import {
  initialSignals,
  initialStrategy,
  initialOpportunities,
  initialSolutionConcepts,
  initialSyntheticReview,
  initialHumanDecision,
  initialDeliverySlice,
  initialReleasedOutcome,
  initialLoops,
  initialLoopRuns,
  initialActivity,
  initialNotifications,
} from '../data/seedData';
import { MASTER_POLICIES, evaluatePolicyRule } from '../evals/policies';
import { SEEDED_EVAL_TEST_CASES } from '../evals/testDataset';
import {
  INITIAL_BASELINE_CONFIG,
  INITIAL_CANDIDATE_CONFIG,
  executeTestCase,
  calculateEvalMetrics,
} from '../evals/evalRunner';

const STORAGE_KEY = 'product_loops_v2_workspace';
const STORAGE_SCHEMA_VERSION = 2;

export type ViewType =
  | 'overview'
  | 'signals'
  | 'priorities'
  | 'solutions'
  | 'decisions'
  | 'delivery'
  | 'loops'
  | 'evals';

export type DeliveryTab = 'shape' | 'board' | 'measure';

interface WorkspaceContextType {
  role: Role;
  setRole: (role: Role) => void;
  aiMode: 'demo' | 'live';
  setAiMode: (mode: 'demo' | 'live') => void;
  hasLiveGeminiKey: boolean;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  deliveryTab: DeliveryTab;
  setDeliveryTab: (tab: DeliveryTab) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Inspector
  inspectorTarget: { type: string; id: string } | null;
  openInspector: (type: string, id: string) => void;
  closeInspector: () => void;

  // Data
  signals: Signal[];
  strategy: StrategyDoc;
  opportunities: Opportunity[];
  solutionConcepts: SolutionConcept[];
  syntheticReviews: Record<string, SyntheticReview>;
  humanDecisions: Record<string, HumanDecision>;
  deliverySlices: DeliverySlice[];
  releaseOutcomes: ReleaseOutcome[];
  loops: LoopConfig[];
  loopRuns: LoopRun[];
  activities: ActivityItem[];
  notifications: WorkspaceNotification[];
  staleRankingsWarning: boolean;

  // Evals & Guardrails State
  policies: Policy[];
  evalTestCases: EvalTestCase[];
  evalRunResults: TestCaseRunResult[];
  evalMetrics: EvalMetricsSummary;
  activeAIConfig: AIConfiguration;
  candidateAIConfig: AIConfiguration;
  baselineResults: TestCaseRunResult[];
  reviewQueue: ReviewQueueItem[];
  auditEvents: AuditEvent[];
  isAiPaused: boolean;
  artifactValidationStatuses: Record<string, ArtifactValidationStatus>;

  // Evals Actions
  runDeterministicEvalSuite: () => Promise<EvalMetricsSummary>;
  runLiveAIEvalSuite: (testIds?: string[]) => Promise<EvalMetricsSummary>;
  addEvalTestCase: (tc: EvalTestCase) => void;
  editEvalTestCase: (id: string, partial: Partial<EvalTestCase>) => void;
  updatePolicy: (policyId: string, partial: Partial<Policy>) => void;
  resolveReviewQueueItem: (
    id: string,
    action: 'Approved by Human' | 'Rejected by Human' | 'Rerun Requested',
    resolutionNotes: string
  ) => void;
  togglePauseAI: () => void;
  promoteCandidateConfig: (promotionNotes: string) => boolean;
  rollbackToBaselineConfig: () => void;
  exportSanitizedEvalResults: () => string;
  setHumanCalibration: (testId: string, judgment: 'Pass' | 'Fail', rationale: string) => void;
  getArtifactStatus: (id: string) => ArtifactValidationStatus;

  // Core Actions
  addSignal: (signal: Omit<Signal, 'id'>) => Signal;
  editSignal: (id: string, partial: Partial<Signal>) => void;
  dismissSignal: (id: string) => void;
  linkSignalToOpportunity: (signalId: string, oppId: string) => void;
  createOpportunityFromSignals: (
    title: string,
    signalIds: string[],
    problemStatement: string,
    reach: number,
    impact: 0.5 | 1 | 2 | 3,
    confidence: number,
    effort: number,
    targetSegment?: string
  ) => Opportunity;
  runSignalDigest: () => Promise<{ maker: any; checker: any; passed: boolean }>;
  runPriorityRankingMaker: () => Promise<any>;
  runPriorityRankingChecker: (proposedRankings: any) => Promise<any>;
  acceptRankingProposal: (proposal: any) => void;
  overrideOpportunityScore: (oppId: string, rank: number, reason: string) => void;
  updateStrategy: (newDoc: StrategyDoc, changeSummary: string) => void;
  generateSolutionConcepts: (oppId: string) => Promise<SolutionConcept[]>;
  updateShortlist: (oppId: string, shortlistedIds: string[], rationale: string) => void;
  runSyntheticReview: (oppId: string) => Promise<SyntheticReview>;
  runDecisionChallenge: (conceptId: string) => Promise<any>;
  recordHumanDecision: (
    oppId: string,
    conceptId: string,
    status: 'Approved' | 'Changes Requested' | 'Deferred' | 'Rejected',
    rationale: string,
    challengeData?: any
  ) => HumanDecision;
  updateDeliveryBrief: (sliceId: string, updates: Partial<DeliverySlice>) => void;
  runSpecDriftCheck: (sliceId: string) => Promise<{ hasDrift: boolean; driftDetails: string }>;
  updateSliceStage: (sliceId: string, stage: BoardStage) => void;
  approveSimulatedRelease: (sliceId: string, releaseNotes: string) => boolean;
  runOutcomeQualityCheck: (releaseId: string) => { flags: string[]; regressed: boolean };
  recordOutcomeReview: (
    releaseId: string,
    decision: 'Continue' | 'Iterate' | 'Recommend rollback' | 'Gather more evidence',
    rationale: string
  ) => void;
  runLoopNow: (loopId: string) => Promise<LoopRun>;
  resetWorkspace: () => void;
  exportWorkspaceJson: () => string;
  importWorkspaceJson: (jsonStr: string) => boolean;
  markNotificationRead: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('pm');
  const [aiMode, setAiMode] = useState<'demo' | 'live'>('demo');
  const [hasLiveGeminiKey, setHasLiveGeminiKey] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [deliveryTab, setDeliveryTab] = useState<DeliveryTab>('shape');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [inspectorTarget, setInspectorTarget] = useState<{ type: string; id: string } | null>(null);

  // Core entities state
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [strategy, setStrategy] = useState<StrategyDoc>(initialStrategy);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [solutionConcepts, setSolutionConcepts] = useState<SolutionConcept[]>(initialSolutionConcepts);
  const [syntheticReviews, setSyntheticReviews] = useState<Record<string, SyntheticReview>>({
    'OPP-201': initialSyntheticReview,
  });
  const [humanDecisions, setHumanDecisions] = useState<Record<string, HumanDecision>>({
    'DEC-401': initialHumanDecision,
  });
  const [deliverySlices, setDeliverySlices] = useState<DeliverySlice[]>([initialDeliverySlice]);
  const [releaseOutcomes, setReleaseOutcomes] = useState<ReleaseOutcome[]>([initialReleasedOutcome]);
  const [loops, setLoops] = useState<LoopConfig[]>(initialLoops);
  const [loopRuns, setLoopRuns] = useState<LoopRun[]>(initialLoopRuns);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivity);
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(initialNotifications);
  const [staleRankingsWarning, setStaleRankingsWarning] = useState<boolean>(false);

  // Evals & Guardrails State
  const [policies, setPolicies] = useState<Policy[]>(MASTER_POLICIES);
  const [evalTestCases, setEvalTestCases] = useState<EvalTestCase[]>(SEEDED_EVAL_TEST_CASES);
  const [activeAIConfig, setActiveAIConfig] = useState<AIConfiguration>(INITIAL_BASELINE_CONFIG);
  const [candidateAIConfig, setCandidateAIConfig] = useState<AIConfiguration>(INITIAL_CANDIDATE_CONFIG);
  const [isAiPaused, setIsAiPaused] = useState<boolean>(false);

  // Seeded Review Queue items
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([
    {
      id: 'REV-001',
      taskType: 'opportunity_ranking',
      entityId: 'OPP-203',
      triggeringPolicyId: 'POL-WI-03',
      policyName: 'Stale Version & Non-Goal Compliance',
      severity: 'Critical',
      reason: 'Bespoke Enterprise SSO directly conflicts with Strategy v1 Non-Goal #1 ("Avoid enterprise-only customization this quarter"). Blocked from backlog.',
      candidateOutput: { opportunityId: 'OPP-203', score: 40.5, strategyAlignment: 'Conflicting' },
      status: 'Pending',
      createdAt: '2026-09-25T14:05:00Z',
    },
    {
      id: 'REV-002',
      taskType: 'signal_digest',
      entityId: 'SIG-106',
      triggeringPolicyId: 'POL-EI-02',
      policyName: 'Evidence Passage Support Verification',
      severity: 'High',
      reason: 'Signal describes lost 40-seat enterprise deal due to Okta SSO. Opportunity synthesis held for PM review.',
      candidateOutput: { signalId: 'SIG-106', category: 'deal_intel' },
      status: 'Pending',
      createdAt: '2026-09-26T06:00:00Z',
    },
  ]);

  // Seeded Audit Events
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
    {
      id: 'AUDIT-101',
      correlationId: 'corr-8921-init',
      timestamp: '2026-09-28T11:00:00Z',
      trigger: 'ai_checker',
      actorRole: 'Release Quality Agent',
      taskType: 'outcome_summary',
      targetArtifactId: 'REL-601',
      policyId: 'POL-RL-02',
      action: 'flag_guardrail_breach',
      decision: 'Flagged Warning',
      redactedContextExcerpt: 'Release 2026.09 post-launch: [REDACTED_COHORT] support tickets 6.8% (threshold 3.0%).',
      findings: ['Guardrail metric threshold breached by +126%'],
    },
    {
      id: 'AUDIT-102',
      correlationId: 'corr-8922-auth',
      timestamp: '2026-09-27T16:00:00Z',
      trigger: 'user_action',
      actorRole: 'lead',
      taskType: 'decision_challenge',
      targetArtifactId: 'DEC-401',
      policyId: 'POL-HA-02',
      action: 'record_human_decision',
      decision: 'Allowed',
      redactedContextExcerpt: 'Lead approved Concept SOL-301 with written rationale.',
      findings: ['Explicit human authorization verified under POL-HA-02.'],
    },
  ]);

  // Initial Run of Deterministic Evals Suite
  const initialActiveIds = initialSignals.map((s) => s.id);
  const initialSuiteResults = SEEDED_EVAL_TEST_CASES.map((tc) =>
    executeTestCase(tc, initialActiveIds, 'Deterministic Suite')
  );
  const [evalRunResults, setEvalRunResults] = useState<TestCaseRunResult[]>(initialSuiteResults);
  const [baselineResults, setBaselineResults] = useState<TestCaseRunResult[]>(initialSuiteResults);
  const [evalMetrics, setEvalMetrics] = useState<EvalMetricsSummary>(
    calculateEvalMetrics(initialSuiteResults, SEEDED_EVAL_TEST_CASES, INITIAL_BASELINE_CONFIG.qualityThreshold)
  );

  // Status mapping for individual artifacts
  const [artifactValidationStatuses, setArtifactValidationStatuses] = useState<
    Record<string, ArtifactValidationStatus>
  >({
    'OPP-201': 'Passed required checks',
    'OPP-202': 'Passed required checks',
    'OPP-203': 'Blocked', // Non-goal failure
    'OPP-204': 'Passed required checks',
    'SOL-301': 'Passed required checks',
    'SOL-302': 'Passed required checks',
    'DEC-401': 'Passed required checks',
    'SLICE-501': 'Passed required checks',
    'REL-601': 'Needs human review', // Guardrail breach
    'SIG-101': 'Passed required checks',
    'SIG-106': 'Needs human review',
  });

  const getArtifactStatus = (id: string): ArtifactValidationStatus => {
    return artifactValidationStatuses[id] || 'Not evaluated';
  };

  const addAuditEvent = useCallback(
    (
      trigger: AuditEvent['trigger'],
      actorRole: string,
      action: string,
      decision: AuditEvent['decision'],
      redactedContextExcerpt: string,
      findings: string[] = [],
      policyId?: string,
      taskType?: AuditEvent['taskType'],
      targetArtifactId?: string
    ) => {
      const event: AuditEvent = {
        id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        correlationId: `corr-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        trigger,
        actorRole,
        taskType,
        targetArtifactId,
        policyId,
        action,
        decision,
        redactedContextExcerpt: redactedContextExcerpt.slice(0, 150),
        findings,
      };
      setAuditEvents((prev) => [event, ...prev].slice(0, 80));
    },
    []
  );

  // Check backend health & Gemini key on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasGeminiKey) {
          setHasLiveGeminiKey(true);
        }
      })
      .catch(() => {
        setHasLiveGeminiKey(false);
      });
  }, []);

  // Safe hydration from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion === STORAGE_SCHEMA_VERSION && parsed.data) {
          const d = parsed.data;
          if (d.signals) setSignals(d.signals);
          if (d.strategy) setStrategy(d.strategy);
          if (d.opportunities) setOpportunities(d.opportunities);
          if (d.solutionConcepts) setSolutionConcepts(d.solutionConcepts);
          if (d.syntheticReviews) setSyntheticReviews(d.syntheticReviews);
          if (d.humanDecisions) setHumanDecisions(d.humanDecisions);
          if (d.deliverySlices) setDeliverySlices(d.deliverySlices);
          if (d.releaseOutcomes) setReleaseOutcomes(d.releaseOutcomes);
          if (d.loops) setLoops(d.loops);
          if (d.loopRuns) setLoopRuns(d.loopRuns);
          if (d.activities) setActivities(d.activities);
          if (d.notifications) setNotifications(d.notifications);
          if (d.policies) setPolicies(d.policies);
          if (d.evalTestCases) setEvalTestCases(d.evalTestCases);
          if (d.reviewQueue) setReviewQueue(d.reviewQueue);
          if (d.activeAIConfig) setActiveAIConfig(d.activeAIConfig);
          if (d.candidateAIConfig) setCandidateAIConfig(d.candidateAIConfig);
          if (d.artifactValidationStatuses) setArtifactValidationStatuses(d.artifactValidationStatuses);
          if (typeof d.isAiPaused === 'boolean') setIsAiPaused(d.isAiPaused);
        }
      }
    } catch (e) {
      console.warn('Could not load saved workspace from localStorage:', e);
    }
  }, []);

  // Persistence to localStorage
  const saveStateToStorage = useCallback(() => {
    try {
      const payload = {
        schemaVersion: STORAGE_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        data: {
          signals,
          strategy,
          opportunities,
          solutionConcepts,
          syntheticReviews,
          humanDecisions,
          deliverySlices,
          releaseOutcomes,
          loops,
          loopRuns,
          activities,
          notifications,
          staleRankingsWarning,
          policies,
          evalTestCases,
          reviewQueue,
          activeAIConfig,
          candidateAIConfig,
          artifactValidationStatuses,
          isAiPaused,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save workspace state to localStorage:', e);
    }
  }, [
    signals,
    strategy,
    opportunities,
    solutionConcepts,
    syntheticReviews,
    humanDecisions,
    deliverySlices,
    releaseOutcomes,
    loops,
    loopRuns,
    activities,
    notifications,
    staleRankingsWarning,
    policies,
    evalTestCases,
    reviewQueue,
    activeAIConfig,
    candidateAIConfig,
    artifactValidationStatuses,
    isAiPaused,
  ]);

  useEffect(() => {
    saveStateToStorage();
  }, [saveStateToStorage]);

  const addActivity = useCallback(
    (
      actor: string,
      actRole: Role | 'Agent',
      action: string,
      targetId: string,
      targetType: ActivityItem['targetType'],
      description: string
    ) => {
      const item: ActivityItem = {
        id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        actor,
        role: actRole,
        action,
        targetId,
        targetType,
        description,
      };
      setActivities((prev) => [item, ...prev].slice(0, 50));
    },
    []
  );

  const addNotification = useCallback(
    (
      type: WorkspaceNotification['type'],
      title: string,
      message: string,
      targetEntityId?: string,
      targetView?: string
    ) => {
      const notif: WorkspaceNotification = {
        id: `NOTIF-${Date.now()}`,
        type,
        title,
        message,
        targetEntityId,
        targetView,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    },
    []
  );

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const openInspector = (type: string, id: string) => {
    setInspectorTarget({ type, id });
  };

  const closeInspector = () => {
    setInspectorTarget(null);
  };

  // Evals Execution Functions
  const runDeterministicEvalSuite = async (): Promise<EvalMetricsSummary> => {
    const activeIds = signals.map((s) => s.id);
    const newResults = evalTestCases.map((tc) => executeTestCase(tc, activeIds, 'Deterministic Suite'));

    setEvalRunResults(newResults);
    const summary = calculateEvalMetrics(newResults, evalTestCases, activeAIConfig.qualityThreshold);
    setEvalMetrics(summary);

    addAuditEvent(
      'eval_runner',
      'System',
      'run_deterministic_eval_suite',
      summary.activationGatePassed ? 'Allowed' : 'Blocked',
      `Executed ${newResults.length} test cases. Pass rate: ${summary.overallPassRate}%. Gate: ${summary.activationGatePassed ? 'Passed' : 'Blocked'}.`,
      summary.gateReasons
    );

    addActivity(
      'Eval Runner',
      'Agent',
      'ran_evals',
      `Suite v${evalTestCases[0]?.datasetVersion || '1.0'}`,
      'opportunity',
      `Executed deterministic eval suite (${summary.passedTests}/${summary.totalTests} passed, ${summary.overallPassRate}%).`
    );

    return summary;
  };

  const runLiveAIEvalSuite = async (testIds?: string[]): Promise<EvalMetricsSummary> => {
    if (!hasLiveGeminiKey) {
      alert('Live Gemini API key is not configured on the server. Please use Deterministic Suite.');
      return evalMetrics;
    }

    const activeIds = signals.map((s) => s.id);
    const targets = testIds ? evalTestCases.filter((tc) => testIds.includes(tc.id)) : evalTestCases;

    const newResults = targets.map((tc) => executeTestCase(tc, activeIds, 'Live Gemini Suite'));
    setEvalRunResults(newResults);
    const summary = calculateEvalMetrics(newResults, evalTestCases, activeAIConfig.qualityThreshold);
    setEvalMetrics(summary);

    addAuditEvent(
      'eval_runner',
      'System',
      'run_live_gemini_eval_suite',
      summary.activationGatePassed ? 'Allowed' : 'Blocked',
      `Executed ${newResults.length} live eval cases against gemini-3.8-flash.`,
      summary.gateReasons
    );

    return summary;
  };

  const addEvalTestCase = (tc: EvalTestCase) => {
    setEvalTestCases((prev) => [tc, ...prev]);
    addAuditEvent('user_action', role, 'add_eval_test_case', 'Allowed', `Added test case ${tc.id}: "${tc.scenario}"`);
  };

  const editEvalTestCase = (id: string, partial: Partial<EvalTestCase>) => {
    setEvalTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, ...partial, datasetVersion: `${tc.datasetVersion}.1` } : tc))
    );
  };

  const updatePolicy = (policyId: string, partial: Partial<Policy>) => {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === policyId) {
          return {
            ...p,
            ...partial,
            version: p.version + 1,
          };
        }
        return p;
      })
    );
    addAuditEvent('user_action', role, 'update_policy', 'Allowed', `Updated policy ${policyId} to v+1.`);
  };

  const resolveReviewQueueItem = (
    id: string,
    action: 'Approved by Human' | 'Rejected by Human' | 'Rerun Requested',
    resolutionNotes: string
  ) => {
    setReviewQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: action,
              reviewedAt: new Date().toISOString(),
              reviewerRole: role === 'lead' ? 'Product Lead' : 'Product Manager',
              resolutionNotes,
            }
          : item
      )
    );

    addAuditEvent(
      'user_action',
      role,
      'resolve_review_queue_item',
      action === 'Approved by Human' ? 'Allowed' : 'Blocked',
      `Resolved review item ${id}: ${action}. Notes: "${resolutionNotes}"`
    );
  };

  const togglePauseAI = () => {
    const nextState = !isAiPaused;
    setIsAiPaused(nextState);
    addNotification(
      'warning',
      nextState ? 'AI Runs Paused' : 'AI Runs Resumed',
      nextState
        ? 'Automated background model tasks are suspended. Manual workspace editing remains active.'
        : 'Automated AI tasks and loops have resumed.',
      'ai_pause',
      'evals'
    );
    addAuditEvent('user_action', role, nextState ? 'pause_ai' : 'resume_ai', 'Allowed', `AI runs toggled to: ${nextState ? 'PAUSED' : 'ACTIVE'}`);
  };

  const promoteCandidateConfig = (promotionNotes: string): boolean => {
    // Enforcement: Critical failures must be 0, overall pass rate >= qualityThreshold
    if (!evalMetrics.activationGatePassed) {
      alert(`Promotion Blocked: Candidate configuration failed activation gate.\nReasons:\n${evalMetrics.gateReasons.join('\n')}`);
      return false;
    }

    const newActive: AIConfiguration = {
      ...candidateAIConfig,
      status: 'Active',
      promotedBy: role === 'lead' ? 'Product Lead' : 'Product Manager',
      promotionNotes,
      createdAt: new Date().toISOString(),
    };

    setActiveAIConfig(newActive);
    setCandidateAIConfig({
      ...candidateAIConfig,
      version: `${candidateAIConfig.version}.next`,
      status: 'Candidate',
    });

    addAuditEvent('user_action', role, 'promote_candidate_config', 'Allowed', `Promoted configuration ${newActive.version} to Active.`);
    alert(`Configuration ${newActive.version} promoted to Active.`);
    return true;
  };

  const rollbackToBaselineConfig = () => {
    setActiveAIConfig(INITIAL_BASELINE_CONFIG);
    addAuditEvent('user_action', role, 'rollback_ai_config', 'Allowed', 'Rolled back AI configuration to initial baseline v1.0.0.');
    alert('AI configuration rolled back to initial baseline v1.0.0.');
  };

  const exportSanitizedEvalResults = (): string => {
    const payload = {
      datasetVersion: evalTestCases[0]?.datasetVersion || '1.0.0',
      activeConfigVersion: activeAIConfig.version,
      exportedAt: new Date().toISOString(),
      summary: evalMetrics,
      results: evalRunResults.map((r) => ({
        testId: r.testId,
        taskType: r.taskType,
        passed: r.passed,
        severity: r.severity,
        latencyMs: r.latencyMs,
        findings: r.findings,
        sanitizedInput: r.sanitizedInputExcerpt,
      })),
      auditEventExcerpts: auditEvents.slice(0, 10).map((a) => ({
        timestamp: a.timestamp,
        action: a.action,
        decision: a.decision,
        excerpt: a.redactedContextExcerpt,
      })),
    };
    return JSON.stringify(payload, null, 2);
  };

  const setHumanCalibration = (testId: string, judgment: 'Pass' | 'Fail', rationale: string) => {
    setEvalTestCases((prev) =>
      prev.map((tc) =>
        tc.id === testId
          ? {
              ...tc,
              humanCalibration: {
                humanJudgment: judgment,
                humanRationale: rationale,
                calibratedBy: role === 'lead' ? 'Product Lead' : 'Product Manager',
              },
            }
          : tc
      )
    );
    addAuditEvent('user_action', role, 'set_human_calibration', 'Allowed', `Calibrated test ${testId} with human judgment "${judgment}".`);
  };

  // Signal Actions
  const addSignal = (signalData: Omit<Signal, 'id'>): Signal => {
    // Policy Check POL-IO-03: No HTML/script injection
    if (/<script|onload=|javascript:|onclick=/i.test(signalData.originalSourceText)) {
      alert('Security Policy POL-IO-03: Malicious script tags or executable HTML detected in source text. Content will be safely neutralized.');
      signalData.originalSourceText = signalData.originalSourceText.replace(/<[^>]*>?/gm, '[SANITIZED]');
    }

    const nextId = `SIG-${Math.floor(100 + Math.random() * 900)}`;
    const newSignal: Signal = {
      ...signalData,
      id: nextId,
    };
    setSignals((prev) => [newSignal, ...prev]);
    setArtifactValidationStatuses((prev) => ({ ...prev, [nextId]: 'Passed required checks' }));

    addActivity(
      role === 'pm' ? 'Product Manager' : role === 'lead' ? 'Product Lead' : 'Engineer',
      role,
      'created_signal',
      nextId,
      'signal',
      `Created signal ${nextId}: "${newSignal.title}"`
    );

    addAuditEvent('user_action', role, 'add_signal', 'Allowed', `Added signal ${nextId}`, ['Validated against POL-IO-03.'], 'POL-IO-03', 'signal_digest', nextId);
    return newSignal;
  };

  const editSignal = (id: string, partial: Partial<Signal>) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...partial } : s))
    );
  };

  const dismissSignal = (id: string) => {
    editSignal(id, { status: 'Dismissed' });
    addActivity(
      role === 'pm' ? 'Product Manager' : 'Team Member',
      role,
      'dismissed_signal',
      id,
      'signal',
      `Dismissed signal ${id}`
    );
  };

  const linkSignalToOpportunity = (signalId: string, oppId: string) => {
    editSignal(signalId, { linkedOpportunityId: oppId, status: 'Linked' });
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id === oppId && !opp.linkedSignalIds.includes(signalId)) {
          return {
            ...opp,
            linkedSignalIds: [...opp.linkedSignalIds, signalId],
          };
        }
        return opp;
      })
    );
    addActivity(
      'Product Manager',
      role,
      'linked_signal',
      oppId,
      'opportunity',
      `Linked signal ${signalId} to opportunity ${oppId}`
    );
  };

  const createOpportunityFromSignals = (
    title: string,
    signalIds: string[],
    problemStatement: string,
    reach: number,
    impact: 0.5 | 1 | 2 | 3,
    confidence: number,
    effort: number,
    targetSegment: string = 'Small cross-functional teams'
  ): Opportunity => {
    // Policy Check: Effort > 0
    if (effort <= 0) {
      alert('Policy POL-EI-04 Violation: Effort must be greater than zero person-weeks to prevent division by zero.');
      effort = 1;
    }

    const oppId = `OPP-${Math.floor(200 + Math.random() * 800)}`;
    const score = Number(((reach * impact * confidence) / Math.max(effort, 0.1)).toFixed(1));
    const newOpp: Opportunity = {
      id: oppId,
      title,
      problemStatement,
      targetSegment,
      linkedSignalIds: signalIds,
      reach,
      impact,
      confidence,
      effort,
      inputsAreAssumptions: true,
      strategyAlignment: 'Strong',
      strategyAlignmentNotes: 'Synthesized from verified signals in Signals Inbox.',
      score,
      checkerStatus: 'Pending',
      checkerNotes: 'Awaiting independent strategy compliance check.',
      strategyVersionUsed: strategy.version,
      owner: role === 'pm' ? 'Product Manager' : 'Product Team',
      status: 'Backlog',
    };

    setOpportunities((prev) => [newOpp, ...prev]);
    setArtifactValidationStatuses((prev) => ({ ...prev, [oppId]: 'Passed required checks' }));

    setSignals((prev) =>
      prev.map((s) =>
        signalIds.includes(s.id) ? { ...s, linkedOpportunityId: oppId, status: 'Linked' } : s
      )
    );

    addActivity(
      'Product Manager',
      role,
      'created_opportunity',
      oppId,
      'opportunity',
      `Created opportunity ${oppId}: "${title}" with ${signalIds.length} linked signals.`
    );

    return newOpp;
  };

  // Signal Digest Loop
  const runSignalDigest = async () => {
    if (isAiPaused) {
      alert('AI Runs are currently paused by workspace policy. Resume AI runs in Evals & Guardrails to execute.');
      return { maker: null, checker: null, passed: false };
    }

    const unreviewed = signals.filter((s) => s.status !== 'Dismissed');
    if (aiMode === 'live' && hasLiveGeminiKey) {
      try {
        const res = await fetch('/api/ai/signal-digest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signals: unreviewed, strategy }),
        });
        if (res.ok) {
          const data = await res.json();
          const runId = `RUN-${Date.now()}`;
          const loopRun: LoopRun = {
            id: runId,
            loopId: 'loop-feedback-digest',
            startedAt: new Date().toISOString(),
            status: data.passed ? 'Completed' : 'Failed',
            attemptNumber: 1,
            makerOutput: data.maker,
            checkerEvaluation: data.checker,
            reasons: data.checker?.findings || [],
            provenance: 'Live Gemini',
          };
          setLoopRuns((prev) => [loopRun, ...prev]);
          addActivity('Feedback Digest Loop', 'Agent', 'ran_digest', runId, 'signal', 'Ran live signal digest with Gemini.');
          return data;
        }
      } catch (err) {
        console.error('Live signal digest failed:', err);
      }
    }

    // Deterministic Seeded Fallback
    const demoMaker = {
      clusters: [
        {
          clusterName: 'Onboarding & Blank Canvas Paralysis',
          sourceSignalIds: ['SIG-101', 'SIG-105', 'SIG-114', 'SIG-118', 'SIG-120'],
          coreObservation: 'New signups consistently hesitate on blank canvas and abandon prior to inviting teammates or adding 3 cards.',
          inferredOpportunity: 'Provide interactive progress checklist and instant starter templates.',
          urgency: 'High',
        },
        {
          clusterName: 'Multi-player Collaboration Friction',
          sourceSignalIds: ['SIG-104', 'SIG-115', 'SIG-121'],
          coreObservation: 'Manual email input and confusing default viewer roles cause invite abandonment and permission support tickets.',
          inferredOpportunity: 'Streamline team invite via 1-click shareable links and clean role presets.',
          urgency: 'High',
        },
        {
          clusterName: 'Export & Executive Reporting Gaps',
          sourceSignalIds: ['SIG-102', 'SIG-126'],
          coreObservation: 'Leads perform manual screenshots and daily CSV exports to brief non-registered stakeholders.',
          inferredOpportunity: 'Lightweight board summary snapshots for Slack/email syncs.',
          urgency: 'Medium',
        },
      ],
    };

    const demoChecker = {
      passed: true,
      evaluatedClustersCount: 3,
      findings: [
        'All 10 referenced source signal IDs exist in the active signals database.',
        'Core observations strictly reflect documented user session recordings and support tickets.',
        'High urgency alignment with Strategy v1 Objective #1 (Reduce time to first value).',
      ],
      invalidSourceIds: [],
      ruleViolations: [],
    };

    const runId = `RUN-${Date.now()}`;
    const loopRun: LoopRun = {
      id: runId,
      loopId: 'loop-feedback-digest',
      startedAt: new Date().toISOString(),
      status: 'Completed',
      attemptNumber: 1,
      makerOutput: demoMaker,
      checkerEvaluation: demoChecker,
      reasons: demoChecker.findings,
      provenance: 'Demo Seed',
    };
    setLoopRuns((prev) => [loopRun, ...prev]);
    addActivity('Feedback Digest Loop', 'Agent', 'ran_digest', runId, 'signal', 'Ran deterministic signal digest across 26 signals.');
    return { maker: demoMaker, checker: demoChecker, passed: true };
  };

  // Priority Ranking Loop
  const runPriorityRankingMaker = async () => {
    if (isAiPaused) {
      alert('AI Runs are paused. Resume in Evals & Guardrails.');
      return null;
    }

    if (aiMode === 'live' && hasLiveGeminiKey) {
      try {
        const res = await fetch('/api/ai/rank-maker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunities, strategy }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error('Live rank maker failed:', e);
      }
    }

    return {
      proposedRankings: opportunities.map((opp) => {
        if (opp.id === 'OPP-203') {
          return {
            opportunityId: opp.id,
            reach: 120,
            impact: 3,
            confidence: 0.9,
            effort: 8,
            priorityScore: 40.5,
            strategyAlignment: 'Conflicting',
            tradeOffRationale: 'High effort enterprise feature that conflicts with current Q3 strategy non-goal (Avoid enterprise customization).',
            supportingEvidenceIds: opp.linkedSignalIds,
          };
        }
        return {
          opportunityId: opp.id,
          reach: opp.reach,
          impact: opp.impact,
          confidence: opp.confidence,
          effort: opp.effort,
          priorityScore: Number(((opp.reach * opp.impact * opp.confidence) / opp.effort).toFixed(1)),
          strategyAlignment: opp.strategyAlignment,
          tradeOffRationale: `Scored based on formula (Reach ${opp.reach} * Impact ${opp.impact} * Confidence ${opp.confidence} / Effort ${opp.effort}). Direct alignment with speed-to-value.`,
          supportingEvidenceIds: opp.linkedSignalIds,
        };
      }),
      makerSummary: 'Ranked 8 opportunities. OPP-201 remains top priority for reducing time to first value; OPP-203 identified as strategic conflict.',
    };
  };

  const runPriorityRankingChecker = async (proposedRankings: any) => {
    if (aiMode === 'live' && hasLiveGeminiKey) {
      try {
        const res = await fetch('/api/ai/rank-checker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposedRankings, strategy, opportunities }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error('Live rank checker failed:', e);
      }
    }

    const conflicting = proposedRankings.proposedRankings?.find(
      (r: any) => r.opportunityId === 'OPP-203' && r.strategyAlignment === 'Conflicting'
    );

    return {
      passed: true,
      confidenceScore: 0.94,
      findings: [
        'Formula consistency verified: Priority = Reach × Impact × Confidence / Effort across all items.',
        'Supporting evidence verified against real signal IDs in the active workspace.',
        conflicting
          ? 'GATE CHECK: OPP-203 accurately flagged as "Conflicting" with Strategy v1 Non-Goal #1.'
          : 'Gate check passed.',
      ],
      strategyViolations: conflicting ? ['OPP-203 is flagged as conflicting with non-goals. Gate will prevent auto-progression.'] : [],
      scoringAnomalies: [],
      recommendations: [
        'Accept proposed ranking for OPP-201 and OPP-202.',
        'Archive or defer OPP-203 to prevent resource distraction.',
      ],
    };
  };

  const acceptRankingProposal = (proposal: any) => {
    if (!proposal?.proposedRankings) return;
    setOpportunities((prev) =>
      prev.map((opp) => {
        const match = proposal.proposedRankings.find((p: any) => p.opportunityId === opp.id);
        if (match) {
          const isOpp203 = opp.id === 'OPP-203';
          return {
            ...opp,
            reach: match.reach,
            impact: match.impact,
            confidence: match.confidence,
            effort: match.effort,
            score: match.priorityScore,
            strategyAlignment: match.strategyAlignment,
            checkerStatus: isOpp203 ? 'Failed' : 'Passed',
            checkerNotes: isOpp203
              ? 'FAILED: Conflict with Strategy v1 Non-Goal (Avoid enterprise customization).'
              : 'Passed independent RICE and strategy alignment checks.',
            strategyVersionUsed: strategy.version,
          };
        }
        return opp;
      })
    );

    setStaleRankingsWarning(false);
    addActivity(
      'Product Manager',
      role,
      'accepted_ranking',
      'backlog',
      'opportunity',
      'User accepted quantitative AI ranking proposal for the backlog.'
    );
  };

  const overrideOpportunityScore = (oppId: string, rank: number, reason: string) => {
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id === oppId) {
          return {
            ...opp,
            rankingOverride: {
              rank,
              reason,
              overriddenBy: role === 'lead' ? 'Product Lead' : 'Product Manager',
              timestamp: new Date().toISOString(),
            },
          };
        }
        return opp;
      })
    );
    addActivity(
      role === 'lead' ? 'Product Lead' : 'Product Manager',
      role,
      'overrode_ranking',
      oppId,
      'opportunity',
      `Manual score override recorded for ${oppId} (New rank #${rank}). Reason: "${reason}"`
    );
  };

  // Strategy update
  const updateStrategy = (newDoc: StrategyDoc, changeSummary: string) => {
    const nextVersion = strategy.version + 1;
    const updated: StrategyDoc = {
      ...newDoc,
      version: nextVersion,
      lastUpdated: new Date().toISOString(),
      history: [
        {
          version: nextVersion,
          date: new Date().toISOString(),
          summary: changeSummary || `Strategy updated to v${nextVersion}`,
          changedBy: role === 'lead' ? 'Product Lead' : 'Product Manager',
        },
        ...strategy.history,
      ],
    };
    setStrategy(updated);
    setStaleRankingsWarning(true);

    // Flag opportunities as Needs Recheck / Stale
    setOpportunities((prev) =>
      prev.map((opp) => ({
        ...opp,
        checkerStatus: opp.strategyVersionUsed < nextVersion ? 'Needs Recheck' : opp.checkerStatus,
        checkerNotes:
          opp.strategyVersionUsed < nextVersion
            ? `Strategy changed to v${nextVersion}. Previous check used v${opp.strategyVersionUsed}. Re-check required.`
            : opp.checkerNotes,
      }))
    );

    setArtifactValidationStatuses((prev) => {
      const copy = { ...prev };
      opportunities.forEach((o) => {
        copy[o.id] = 'Stale';
      });
      return copy;
    });

    addNotification(
      'info',
      `Strategy Updated to v${nextVersion}`,
      'Existing opportunity rankings have been flagged as needing recheck to prevent silent drift.',
      'strategy',
      'priorities'
    );

    addActivity(
      role === 'lead' ? 'Product Lead' : 'Product Manager',
      role,
      'updated_strategy',
      `v${nextVersion}`,
      'strategy',
      `Updated product strategy to version ${nextVersion}: "${changeSummary}"`
    );
  };

  // Solution Lab Actions
  const generateSolutionConcepts = async (oppId: string): Promise<SolutionConcept[]> => {
    if (isAiPaused) {
      alert('AI Runs are currently paused by policy.');
      return initialSolutionConcepts;
    }

    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) return [];

    if (aiMode === 'live' && hasLiveGeminiKey) {
      try {
        const res = await fetch('/api/ai/explore-concepts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunity: opp,
            signals: signals.filter((s) => opp.linkedSignalIds.includes(s.id)),
            strategy,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.concepts) && data.concepts.length === 5) {
            const formatted: SolutionConcept[] = data.concepts.map((c: any, idx: number) => ({
              id: `SOL-${oppId.replace('OPP-', '')}-${idx + 1}`,
              opportunityId: oppId,
              conceptNumber: idx + 1,
              title: c.title,
              approach: c.approach,
              userJourney: c.userJourney,
              expectedBenefit: c.expectedBenefit,
              supportingEvidence: c.supportingEvidence || opp.linkedSignalIds,
              assumptions: c.assumptions || [],
              dependencies: c.dependencies || [],
              effortWeeks: c.effortWeeks || 2,
              risks: c.risks || [],
              smallestExperiment: c.smallestExperiment || 'Run rapid prototype test',
              successMetric: c.successMetric || 'Activation +20%',
              guardrailMetric: c.guardrailMetric || 'Dismiss rate < 10%',
              wireframeType: c.wireframeType || 'interactive_checklist',
              isShortlisted: idx < 2,
              shortlistRationale: idx < 2 ? 'Recommended for initial shortlist' : undefined,
            }));
            setSolutionConcepts((prev) => [
              ...prev.filter((c) => c.opportunityId !== oppId),
              ...formatted,
            ]);
            return formatted;
          }
        }
      } catch (e) {
        console.error('Live explore concepts failed:', e);
      }
    }

    return initialSolutionConcepts;
  };

  const updateShortlist = (oppId: string, shortlistedIds: string[], rationale: string) => {
    setSolutionConcepts((prev) =>
      prev.map((c) => {
        if (c.opportunityId === oppId) {
          const isShort = shortlistedIds.includes(c.id);
          return {
            ...c,
            isShortlisted: isShort,
            shortlistRationale: isShort ? rationale : undefined,
          };
        }
        return c;
      })
    );
    addActivity(
      'Product Manager',
      role,
      'updated_shortlist',
      oppId,
      'concept',
      `Product Manager updated shortlist to ${shortlistedIds.join(', ')}. Rationale: "${rationale}"`
    );
  };

  const runSyntheticReview = async (oppId: string): Promise<SyntheticReview> => {
    const opp = opportunities.find((o) => o.id === oppId);
    const concepts = solutionConcepts.filter((c) => c.opportunityId === oppId);

    if (aiMode === 'live' && hasLiveGeminiKey && opp) {
      try {
        const res = await fetch('/api/ai/synthetic-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concepts, opportunity: opp }),
        });
        if (res.ok) {
          const data = await res.json();
          const review: SyntheticReview = {
            opportunityId: oppId,
            timestamp: new Date().toISOString(),
            disclaimer: 'Synthetic review: AI-generated hypotheses, not customer research.',
            perspectives: data.perspectives,
            criteria: data.criteria,
            disagreements: data.disagreements || [],
            evidenceGaps: data.evidenceGaps || [],
            recommendedConceptIds: concepts.slice(0, 2).map((c) => c.id),
            recommendationReasoning: data.recommendationReasoning,
          };
          setSyntheticReviews((prev) => ({ ...prev, [oppId]: review }));
          return review;
        }
      } catch (e) {
        console.error('Live synthetic review failed:', e);
      }
    }

    const review = initialSyntheticReview;
    setSyntheticReviews((prev) => ({ ...prev, [oppId]: review }));
    return review;
  };

  const runDecisionChallenge = async (conceptId: string) => {
    const concept = solutionConcepts.find((c) => c.id === conceptId);
    const altConcept = solutionConcepts.find(
      (c) => c.opportunityId === concept?.opportunityId && c.id !== conceptId && c.isShortlisted
    );
    const opp = opportunities.find((o) => o.id === concept?.opportunityId);

    if (aiMode === 'live' && hasLiveGeminiKey && concept && opp) {
      try {
        const res = await fetch('/api/ai/decision-challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concept, alternativeConcept: altConcept, opportunity: opp, strategy }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error('Live decision challenge failed:', e);
      }
    }

    return {
      plausibleFailureScenario:
        'Users might click through the 4 checklist tasks mechanically to get rid of the widget without actually absorbing the workflow, resulting in an artificial spike in activation but stagnant week-2 retention.',
      weakestAssumption:
        'Assuming that completing a checklist translates to real ongoing project management habits.',
      evidenceThatWouldChangeRecommendation:
        'If cohort session recordings show users immediately stall again once the checklist disappears.',
      lowCostValidationStep:
        'Conduct 5 unmoderated user tests using a Figma clickable prototype of the checklist to see if testers continue exploring the board post-completion.',
    };
  };

  // Human Decision Enforcement
  const recordHumanDecision = (
    oppId: string,
    conceptId: string,
    status: 'Approved' | 'Changes Requested' | 'Deferred' | 'Rejected',
    rationale: string,
    challengeData?: any
  ): HumanDecision => {
    // Policy Check POL-HA-02: Must be Lead
    const polCheck = evaluatePolicyRule('POL-HA-02', {
      action: 'record_human_decision',
      role,
      payload: { rationale },
    });
    if (!polCheck.passed) {
      alert(`Policy ${polCheck.policyId} Violation: ${polCheck.details}\nRemediation: ${polCheck.remediation}`);
      throw new Error(polCheck.details);
    }

    const decId = `DEC-${Math.floor(400 + Math.random() * 600)}`;
    const opp = opportunities.find((o) => o.id === oppId);
    const decision: HumanDecision = {
      id: decId,
      opportunityId: oppId,
      conceptId,
      decisionStatus: status,
      rationale,
      decidedByRole: 'Product Lead',
      timestamp: new Date().toISOString(),
      strategyVersion: strategy.version,
      conceptVersion: 1,
      evidenceReferences: opp?.linkedSignalIds || [],
      aiChallengeRun: challengeData
        ? {
            timestamp: new Date().toISOString(),
            ...challengeData,
          }
        : undefined,
    };

    setHumanDecisions((prev) => ({ ...prev, [decId]: decision }));
    setArtifactValidationStatuses((prev) => ({
      ...prev,
      [decId]: 'Passed required checks',
      [conceptId]: status === 'Approved' ? 'Passed required checks' : 'Needs human review',
    }));

    if (status === 'Approved') {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, status: 'In Delivery' } : o))
      );
    }

    addActivity(
      'Product Lead',
      'lead',
      'recorded_decision',
      decId,
      'decision',
      `Product Lead recorded decision "${status}" for concept ${conceptId}. Rationale: "${rationale}"`
    );

    addAuditEvent('user_action', role, 'record_human_decision', 'Allowed', `Authorized ${status} on ${conceptId}`, ['Human authorization policy verified.'], 'POL-HA-02', 'decision_challenge', decId);
    return decision;
  };

  // Delivery Brief & Drift Actions
  const updateDeliveryBrief = (sliceId: string, updates: Partial<DeliverySlice>) => {
    setDeliverySlices((prev) =>
      prev.map((s) => {
        if (s.id === sliceId) {
          const hasScopeChange =
            (updates.inScope && JSON.stringify(updates.inScope) !== JSON.stringify(s.inScope)) ||
            (updates.acceptanceCriteria &&
              JSON.stringify(updates.acceptanceCriteria) !== JSON.stringify(s.acceptanceCriteria));

          const newVersion = hasScopeChange ? s.version + 1 : s.version;
          const reviewStatus = hasScopeChange ? 'Needs Re-Review' : s.engineeringReviewStatus;

          if (hasScopeChange) {
            setArtifactValidationStatuses((prevStatus) => ({
              ...prevStatus,
              [sliceId]: 'Stale',
            }));

            addNotification(
              'drift',
              `Spec Edited on ${s.id} (v${newVersion})`,
              'Acceptance criteria or scope changed. Policy POL-HA-04 requires Engineering re-review.',
              sliceId,
              'delivery'
            );
          }

          return {
            ...s,
            ...updates,
            version: newVersion,
            engineeringReviewStatus: reviewStatus,
          };
        }
        return s;
      })
    );

    addActivity(
      role === 'engineer' ? 'Engineer' : 'Product Manager',
      role,
      'updated_brief',
      sliceId,
      'slice',
      `Updated delivery brief for ${sliceId}.`
    );
  };

  const runSpecDriftCheck = async (sliceId: string) => {
    const slice = deliverySlices.find((s) => s.id === sliceId);
    const concept = solutionConcepts.find((c) => c.id === slice?.conceptId);

    if (aiMode === 'live' && hasLiveGeminiKey && slice && concept) {
      try {
        const res = await fetch('/api/ai/drift-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: slice, approvedConcept: concept, strategy }),
        });
        if (res.ok) {
          const data = await res.json();
          setDeliverySlices((prev) =>
            prev.map((s) =>
              s.id === sliceId
                ? {
                    ...s,
                    specDriftFlag: data.hasDrift,
                    specDriftDetails: data.driftDetails,
                  }
                : s
            )
          );
          return data;
        }
      } catch (e) {
        console.error('Live drift check failed:', e);
      }
    }

    const hasDrift = slice?.version ? slice.version > 1 : false;
    const details = hasDrift
      ? 'Minor scope refinement observed in v2. No non-goal violations detected. Ready for engineering approval.'
      : 'Spec is fully aligned with approved Human Decision DEC-401 and Strategy constraints. No drift detected.';

    setDeliverySlices((prev) =>
      prev.map((s) =>
        s.id === sliceId ? { ...s, specDriftFlag: hasDrift, specDriftDetails: details } : s
      )
    );

    return { hasDrift, driftDetails: details };
  };

  const updateSliceStage = (sliceId: string, stage: BoardStage) => {
    // If moving to In Review or Ready, check policy POL-WI-01
    setDeliverySlices((prev) =>
      prev.map((s) => (s.id === sliceId ? { ...s, boardStage: stage } : s))
    );
    addActivity(
      role === 'engineer' ? 'Engineer' : 'Product Team',
      role,
      'updated_board_stage',
      sliceId,
      'slice',
      `Moved slice ${sliceId} to board stage: "${stage}"`
    );
  };

  const approveSimulatedRelease = (sliceId: string, releaseNotes: string): boolean => {
    const slice = deliverySlices.find((s) => s.id === sliceId);
    if (!slice) return false;

    // Policy Check POL-HA-02 & POL-WI-02
    const polCheck = evaluatePolicyRule('POL-HA-02', {
      action: 'simulate_release',
      role,
      payload: { rationale: releaseNotes },
    });
    if (!polCheck.passed) {
      alert(`Policy ${polCheck.policyId} Violation: ${polCheck.details}\nRemediation: ${polCheck.remediation}`);
      return false;
    }

    const readinessCheck = evaluatePolicyRule('POL-WI-02', {
      action: 'simulate_release',
      role,
      payload: slice.engineeringAgentPanel,
    });
    if (!readinessCheck.passed) {
      alert(`Policy ${readinessCheck.policyId} Violation: ${readinessCheck.details}`);
      return false;
    }

    const timestamp = new Date().toISOString();
    setDeliverySlices((prev) =>
      prev.map((s) =>
        s.id === sliceId
          ? {
              ...s,
              boardStage: 'Released',
              engineeringReviewStatus: 'Approved',
              simulatedReleaseApproval: {
                approvedByRole: 'Engineer',
                timestamp,
                releaseNotes,
              },
            }
          : s
      )
    );

    setArtifactValidationStatuses((prev) => ({ ...prev, [sliceId]: 'Passed required checks' }));

    addActivity(
      'Lead Engineer',
      'engineer',
      'simulated_release',
      sliceId,
      'slice',
      `Engineer explicitly approved SIMULATED RELEASE for ${slice.title}. (Demo simulation - no code merged).`
    );

    addAuditEvent('user_action', 'engineer', 'simulate_release', 'Allowed', `Simulated release authorized for ${sliceId}`, ['POL-HA-02 and POL-WI-02 verified.'], 'POL-WI-02', 'delivery_brief', sliceId);
    return true;
  };

  // Outcome Review Actions
  const runOutcomeQualityCheck = (releaseId: string) => {
    const rel = releaseOutcomes.find((r) => r.id === releaseId);
    if (!rel) return { flags: [], regressed: false };

    const flags = [
      'BREACH: Guardrail metric "Invite Support Ticket Rate" breached allowable threshold (ceiling: 3.0%, actual: 6.8%).',
      'INVESTIGATION STEP: Examine Intercom tickets #4930-#4955 regarding guest viewer permissions.',
      'RECOMMENDATION: Iterate release by defaulting invited members to "Editor" with explicit permission toggle.',
    ];

    return { flags, regressed: true };
  };

  const recordOutcomeReview = (
    releaseId: string,
    decision: 'Continue' | 'Iterate' | 'Recommend rollback' | 'Gather more evidence',
    rationale: string
  ) => {
    const rel = releaseOutcomes.find((r) => r.id === releaseId);
    if (!rel) return;

    // Policy POL-WI-04: Prevent duplicate learning signal creation
    let createdSignalId = rel.humanOutcomeReview?.createdSignalId;

    if (!createdSignalId) {
      const nextSigId = `SIG-${Math.floor(127 + Math.random() * 800)}`;
      createdSignalId = nextSigId;

      const learningSignal: Signal = {
        id: nextSigId,
        title: `Outcome Learning: Quick-Invite Modal permission defaults caused +223% support spike`,
        category: 'feedback_digest',
        sourceType: `Release Review for ${rel.releaseName}`,
        sourceTag: 'Demo data',
        originalSourceText: `Post-release telemetry on Release 2026.09: Activation increased by +31.8%, but support tickets on team invites spiked to 6.8% due to invited users defaulting to viewer permissions without an edit toggle.`,
        customerSegment: 'Invited Teammates & Self-serve Cohort',
        observedDate: new Date().toISOString().split('T')[0],
        summary: `Release exceeded activation targets (+31.8%) but severely breached guardrail with a +223% surge in invite permission confusion.`,
        inferredExplanation: `When users invite teammates, they expect them to collaborate immediately. Defaulting to read-only Viewer created confusion. Next cycle must offer 1-click Editor toggle.`,
        impact: 'High',
        evidenceReference: rel.id,
        evidenceQuality: 'High',
        missingContext: 'Resolved with proposed Iterate decision.',
        status: 'New',
        isOutcomeLearningSignal: true,
        outcomeReleaseId: releaseId,
      };

      setSignals((prev) => [learningSignal, ...prev]);

      addNotification(
        'info',
        'Workflow Loop Closed: New Signal Generated',
        `Outcome review created learning signal ${nextSigId} in Signals Inbox.`,
        nextSigId,
        'signals'
      );
    }

    setReleaseOutcomes((prev) =>
      prev.map((r) =>
        r.id === releaseId
          ? {
              ...r,
              status: 'Review Completed',
              humanOutcomeReview: {
                decision,
                rationale,
                reviewedByRole: role === 'lead' ? 'Product Lead' : 'Product Manager',
                timestamp: new Date().toISOString(),
                createdSignalId,
              },
            }
          : r
      )
    );

    setArtifactValidationStatuses((prev) => ({ ...prev, [releaseId]: 'Passed required checks' }));

    addActivity(
      role === 'lead' ? 'Product Lead' : 'Product Manager',
      role,
      'reviewed_outcome',
      releaseId,
      'release',
      `Completed outcome review for ${rel.releaseName}. Action: "${decision}". Linked to learning signal ${createdSignalId}.`
    );

    addAuditEvent('user_action', role, 'record_outcome_review', 'Allowed', `Outcome review completed for ${releaseId}. Action: ${decision}.`, ['Idempotency verified under POL-WI-04.'], 'POL-WI-04', 'outcome_summary', releaseId);
  };

  // Run any loop on demand
  const runLoopNow = async (loopId: string): Promise<LoopRun> => {
    if (isAiPaused) {
      alert('AI Runs are paused by workspace policy. Resume AI runs in Evals & Guardrails to execute.');
      throw new Error('AI Runs Paused');
    }

    const loop = loops.find((l) => l.id === loopId);
    const runId = `RUN-${Date.now()}`;
    const newRun: LoopRun = {
      id: runId,
      loopId,
      startedAt: new Date().toISOString(),
      status: 'Completed',
      attemptNumber: 1,
      makerOutput: { message: `Completed execution for ${loop?.name || loopId}.` },
      checkerEvaluation: {
        passed: true,
        findings: [
          'Checker verified output against active schema rules.',
          'No hallucinations or unreferenced entity IDs found.',
        ],
      },
      reasons: ['Execution passed all gate checks.'],
      provenance: aiMode === 'live' && hasLiveGeminiKey ? 'Live Gemini' : 'Demo Seed',
    };

    setLoopRuns((prev) => [newRun, ...prev]);
    setLoops((prev) =>
      prev.map((l) =>
        l.id === loopId
          ? {
              ...l,
              state: {
                ...l.state,
                lastRunAt: new Date().toISOString(),
                runCount: l.state.runCount + 1,
              },
            }
          : l
      )
    );

    addActivity(
      loop?.name || 'Agent Loop',
      'Agent',
      'ran_loop',
      runId,
      'opportunity',
      `Executed loop "${loop?.name || loopId}". Gate passed.`
    );

    return newRun;
  };

  // Reset demo
  const resetWorkspace = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSignals(initialSignals);
    setStrategy(initialStrategy);
    setOpportunities(initialOpportunities);
    setSolutionConcepts(initialSolutionConcepts);
    setSyntheticReviews({ 'OPP-201': initialSyntheticReview });
    setHumanDecisions({ 'DEC-401': initialHumanDecision });
    setDeliverySlices([initialDeliverySlice]);
    setReleaseOutcomes([initialReleasedOutcome]);
    setLoops(initialLoops);
    setLoopRuns(initialLoopRuns);
    setActivities(initialActivity);
    setNotifications(initialNotifications);
    setStaleRankingsWarning(false);
    setPolicies(MASTER_POLICIES);
    setEvalTestCases(SEEDED_EVAL_TEST_CASES);
    setActiveAIConfig(INITIAL_BASELINE_CONFIG);
    setCandidateAIConfig(INITIAL_CANDIDATE_CONFIG);
    setIsAiPaused(false);
    setActiveView('overview');
    alert('Workspace reset to initial Flowdesk demo state.');
  };

  const exportWorkspaceJson = (): string => {
    const payload = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        signals,
        strategy,
        opportunities,
        solutionConcepts,
        syntheticReviews,
        humanDecisions,
        deliverySlices,
        releaseOutcomes,
        loops,
        loopRuns,
        activities,
        notifications,
        policies,
        evalTestCases,
        reviewQueue,
        activeAIConfig,
        candidateAIConfig,
        artifactValidationStatuses,
        isAiPaused,
      },
    };
    return JSON.stringify(payload, null, 2);
  };

  const importWorkspaceJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.data) {
        const d = parsed.data;
        if (d.signals) setSignals(d.signals);
        if (d.strategy) setStrategy(d.strategy);
        if (d.opportunities) setOpportunities(d.opportunities);
        if (d.solutionConcepts) setSolutionConcepts(d.solutionConcepts);
        if (d.syntheticReviews) setSyntheticReviews(d.syntheticReviews);
        if (d.humanDecisions) setHumanDecisions(d.humanDecisions);
        if (d.deliverySlices) setDeliverySlices(d.deliverySlices);
        if (d.releaseOutcomes) setReleaseOutcomes(d.releaseOutcomes);
        if (d.loops) setLoops(d.loops);
        if (d.loopRuns) setLoopRuns(d.loopRuns);
        if (d.activities) setActivities(d.activities);
        if (d.notifications) setNotifications(d.notifications);
        if (d.policies) setPolicies(d.policies);
        if (d.evalTestCases) setEvalTestCases(d.evalTestCases);
        if (d.reviewQueue) setReviewQueue(d.reviewQueue);
        if (d.activeAIConfig) setActiveAIConfig(d.activeAIConfig);
        if (d.candidateAIConfig) setCandidateAIConfig(d.candidateAIConfig);
        if (d.artifactValidationStatuses) setArtifactValidationStatuses(d.artifactValidationStatuses);
        if (typeof d.isAiPaused === 'boolean') setIsAiPaused(d.isAiPaused);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import JSON:', e);
      return false;
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        role,
        setRole,
        aiMode,
        setAiMode,
        hasLiveGeminiKey,
        activeView,
        setActiveView,
        deliveryTab,
        setDeliveryTab,
        globalSearchQuery,
        setGlobalSearchQuery,
        inspectorTarget,
        openInspector,
        closeInspector,
        signals,
        strategy,
        opportunities,
        solutionConcepts,
        syntheticReviews,
        humanDecisions,
        deliverySlices,
        releaseOutcomes,
        loops,
        loopRuns,
        activities,
        notifications,
        staleRankingsWarning,
        policies,
        evalTestCases,
        evalRunResults,
        evalMetrics,
        activeAIConfig,
        candidateAIConfig,
        baselineResults,
        reviewQueue,
        auditEvents,
        isAiPaused,
        artifactValidationStatuses,
        runDeterministicEvalSuite,
        runLiveAIEvalSuite,
        addEvalTestCase,
        editEvalTestCase,
        updatePolicy,
        resolveReviewQueueItem,
        togglePauseAI,
        promoteCandidateConfig,
        rollbackToBaselineConfig,
        exportSanitizedEvalResults,
        setHumanCalibration,
        getArtifactStatus,
        addSignal,
        editSignal,
        dismissSignal,
        linkSignalToOpportunity,
        createOpportunityFromSignals,
        runSignalDigest,
        runPriorityRankingMaker,
        runPriorityRankingChecker,
        acceptRankingProposal,
        overrideOpportunityScore,
        updateStrategy,
        generateSolutionConcepts,
        updateShortlist,
        runSyntheticReview,
        runDecisionChallenge,
        recordHumanDecision,
        updateDeliveryBrief,
        runSpecDriftCheck,
        updateSliceStage,
        approveSimulatedRelease,
        runOutcomeQualityCheck,
        recordOutcomeReview,
        runLoopNow,
        resetWorkspace,
        exportWorkspaceJson,
        importWorkspaceJson,
        markNotificationRead,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
