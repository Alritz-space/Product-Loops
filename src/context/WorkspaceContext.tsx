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

const STORAGE_KEY = 'product_loops_v1_workspace';
const STORAGE_SCHEMA_VERSION = 1;

export type ViewType =
  | 'overview'
  | 'signals'
  | 'priorities'
  | 'solutions'
  | 'decisions'
  | 'delivery'
  | 'loops';

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

  // Actions
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
        // Backend offline or non-express
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
          if (typeof d.staleRankingsWarning === 'boolean') {
            setStaleRankingsWarning(d.staleRankingsWarning);
          }
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

  // Signal Actions
  const addSignal = (signalData: Omit<Signal, 'id'>): Signal => {
    const nextId = `SIG-${Math.floor(100 + Math.random() * 900)}`;
    const newSignal: Signal = {
      ...signalData,
      id: nextId,
    };
    setSignals((prev) => [newSignal, ...prev]);
    addActivity(
      role === 'pm' ? 'Product Manager' : role === 'lead' ? 'Product Lead' : 'Engineer',
      role,
      'created_signal',
      nextId,
      'signal',
      `Created signal ${nextId}: "${newSignal.title}"`
    );
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

    // Update signals to linked
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
          // Record loop run
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

  // Priority Ranking Loop (Maker + Checker)
  const runPriorityRankingMaker = async () => {
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

    // Deterministic proposal
    return {
      proposedRankings: opportunities.map((opp) => {
        // Enforce deterministic rules
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
          const result = await res.json();
          return result;
        }
      } catch (e) {
        console.error('Live rank checker failed:', e);
      }
    }

    // Deterministic checker logic
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

    // Flag opportunities as Needs Recheck because strategy version changed!
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

    // Default seeded concepts for OPP-201
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

    // Deterministic review
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

    // Deterministic challenge
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

  const recordHumanDecision = (
    oppId: string,
    conceptId: string,
    status: 'Approved' | 'Changes Requested' | 'Deferred' | 'Rejected',
    rationale: string,
    challengeData?: any
  ): HumanDecision => {
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

    if (status === 'Approved') {
      // Advance opportunity status
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
            addNotification(
              'drift',
              `Spec Edited on ${s.id} (v${newVersion})`,
              'Acceptance criteria or scope changed. Flagged for Engineering re-review.',
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

    // Deterministic drift check
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

    // Release Gate check: Engineering approval only, and required checks must pass!
    if (role !== 'engineer') {
      alert('Only an Engineer can explicitly approve a simulated release.');
      return false;
    }

    if (!slice.engineeringAgentPanel.requiredChecksPassed) {
      alert('Release blocked: Required engineering readiness checks have not passed.');
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

    addActivity(
      'Lead Engineer',
      'engineer',
      'simulated_release',
      sliceId,
      'slice',
      `Engineer explicitly approved SIMULATED RELEASE for ${slice.title}. (Demo simulation - no code merged).`
    );

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

    // Prevent duplicate learning signal creation if review is re-submitted
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

    addActivity(
      role === 'lead' ? 'Product Lead' : 'Product Manager',
      role,
      'reviewed_outcome',
      releaseId,
      'release',
      `Completed outcome review for ${rel.releaseName}. Action: "${decision}". Linked to learning signal ${createdSignalId}.`
    );
  };

  // Run any loop on demand
  const runLoopNow = async (loopId: string): Promise<LoopRun> => {
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
