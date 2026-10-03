/**
 * Product Loops Core Data Types
 */

export * from './evals';

export type Role = 'pm' | 'lead' | 'engineer';

export type SignalCategory =
  | 'feedback_digest'
  | 'deal_intel'
  | 'competitive_brief'
  | 'metric_anomaly'
  | 'onboarding_friction'
  | 'call_candidate';

export type SignalStatus = 'New' | 'Reviewed' | 'Linked' | 'Dismissed';

export type EvidenceQuality = 'High' | 'Moderate' | 'Incomplete';

export interface Signal {
  id: string; // e.g. SIG-101
  title: string;
  category: SignalCategory;
  sourceType: string; // e.g. "Intercom Ticket #4829", "HubSpot Deal Note"
  sourceTag: 'Demo data' | 'Not connected';
  originalSourceText: string;
  customerSegment: string;
  observedDate: string;
  summary: string;
  inferredExplanation: string; // explicitly separated from observation
  impact: 'High' | 'Medium' | 'Low';
  evidenceReference: string;
  evidenceQuality: EvidenceQuality;
  missingContext: string;
  linkedOpportunityId?: string;
  status: SignalStatus;
  // Specific to call candidates
  interviewValueReason?: string;
  suggestedQuestions?: string[];
  // Created from outcome review
  isOutcomeLearningSignal?: boolean;
  outcomeReleaseId?: string;
}

export interface StrategyHistoryItem {
  version: number;
  date: string;
  summary: string;
  changedBy: string;
}

export interface StrategyDoc {
  version: number;
  title: string;
  targetCustomers: string;
  currentObjectives: string[];
  successMetrics: string[];
  constraints: string[];
  explicitNonGoals: string[];
  lastUpdated: string;
  history: StrategyHistoryItem[];
}

export interface PriorityOverride {
  rank: number;
  reason: string;
  overriddenBy: string;
  timestamp: string;
}

export type StrategyAlignment = 'Strong' | 'Moderate' | 'Conflicting' | 'Neutral';
export type CheckerStatus = 'Passed' | 'Failed' | 'Pending' | 'Needs Recheck';

export interface Opportunity {
  id: string; // e.g. OPP-201
  title: string;
  problemStatement: string;
  targetSegment: string;
  linkedSignalIds: string[];
  reach: number; // estimated affected accounts / quarter
  impact: 0.5 | 1 | 2 | 3;
  confidence: number; // 0 to 1
  effort: number; // person-weeks (> 0)
  inputsAreAssumptions: boolean;
  strategyAlignment: StrategyAlignment;
  strategyAlignmentNotes: string;
  score: number; // reach * impact * confidence / effort
  rankingOverride?: PriorityOverride;
  checkerStatus: CheckerStatus;
  checkerNotes: string;
  strategyVersionUsed: number;
  owner: string;
  status: 'Backlog' | 'Exploring' | 'Decided' | 'In Delivery' | 'Shipped';
  activeSolutionConceptsCount?: number;
}

export type WireframeComponentType =
  | 'interactive_checklist'
  | 'in_context_guide'
  | 'template_gallery'
  | 'wizard_flow'
  | 'empty_state_boost';

export interface SolutionConcept {
  id: string; // e.g. SOL-301
  opportunityId: string;
  conceptNumber: number; // 1 to 5
  title: string;
  approach: string;
  userJourney: string;
  expectedBenefit: string;
  supportingEvidence: string[]; // SIG-* IDs
  assumptions: string[];
  dependencies: string[];
  effortWeeks: number;
  risks: string[];
  smallestExperiment: string;
  successMetric: string;
  guardrailMetric: string;
  wireframeType: WireframeComponentType;
  isShortlisted: boolean;
  shortlistRationale?: string;
}

export interface PerspectiveReview {
  sentiment: 'Positive' | 'Neutral' | 'Critical';
  comments: string;
  notes: string;
  alerts: string[];
}

export interface SyntheticReview {
  opportunityId: string;
  timestamp: string;
  disclaimer: string; // "Synthetic review: AI-generated hypotheses, not customer research."
  perspectives: {
    newUser: PerspectiveReview;
    experiencedUser: PerspectiveReview;
    adminBuyer: PerspectiveReview;
  };
  criteria: {
    usefulness: number;
    usability: number;
    feasibility: number;
    strategyAlignment: number;
  };
  disagreements: string[];
  evidenceGaps: string[];
  recommendedConceptIds: string[];
  recommendationReasoning: string;
}

export type DecisionStatus = 'Approved' | 'Changes Requested' | 'Deferred' | 'Rejected';

export interface AiChallengeRun {
  timestamp: string;
  plausibleFailureScenario: string;
  weakestAssumption: string;
  evidenceThatWouldChangeRecommendation: string;
  lowCostValidationStep: string;
}

export interface HumanDecision {
  id: string; // e.g. DEC-401
  opportunityId: string;
  conceptId: string;
  decisionStatus: DecisionStatus;
  rationale: string;
  decidedByRole: 'Product Lead';
  timestamp: string;
  strategyVersion: number;
  conceptVersion: number;
  evidenceReferences: string[];
  aiChallengeRun?: AiChallengeRun;
}

export interface UserStory {
  asA: string;
  iWant: string;
  soThat: string;
}

export interface AnalyticsEvent {
  eventName: string;
  trigger: string;
  properties: string;
}

export interface EngineeringAgentPanel {
  evalResults: Array<{
    check: string;
    status: 'Pass' | 'Fail' | 'Warning';
    notes: string;
  }>;
  bugTriage: Array<{
    id: string;
    severity: 'P0' | 'P1' | 'P2';
    summary: string;
    status: 'Open' | 'Resolved';
  }>;
  openBlockers: string[];
  readinessScore: number;
  requiredChecksPassed: boolean;
}

export type BoardStage = 'Ready' | 'In Progress' | 'In Review' | 'Released';

export interface DeliverySlice {
  id: string; // e.g. SLICE-501
  decisionId: string;
  conceptId: string;
  opportunityId: string;
  title: string;
  problemAndOutcome: string;
  inScope: string[];
  outOfScope: string[];
  userStories: UserStory[];
  acceptanceCriteria: string[];
  dependencies: string[];
  risks: string[];
  analyticsEvents: AnalyticsEvent[];
  successThreshold: string;
  guardrailMetrics: string[];
  rolloutRollbackApproach: string;
  version: number;
  specDriftFlag: boolean;
  specDriftDetails?: string;
  engineeringReviewStatus: 'Pending' | 'Needs Re-Review' | 'Approved';
  boardStage: BoardStage;
  engineeringAgentPanel: EngineeringAgentPanel;
  simulatedReleaseApproval?: {
    approvedByRole: 'Engineer';
    timestamp: string;
    releaseNotes: string;
  };
}

export interface MetricComparison {
  metric: string;
  baseline: string;
  target: string;
  actual: string;
  isGuardrail?: boolean;
  status: 'Exceeded' | 'Met' | 'Missed' | 'Regressed';
}

export interface HumanOutcomeReview {
  decision: 'Continue' | 'Iterate' | 'Recommend rollback' | 'Gather more evidence';
  rationale: string;
  reviewedByRole: string;
  timestamp: string;
  createdSignalId?: string;
}

export interface ReleaseOutcome {
  id: string; // e.g. REL-601
  deliverySliceId: string;
  opportunityId: string;
  releaseName: string;
  releasedAt: string;
  status: 'Active' | 'Review Completed' | 'Rolled Back';
  baselineMetrics: Record<string, string>;
  postReleaseMetrics: Record<string, string>;
  targetAndActualChange: MetricComparison[];
  comparisonWindows: string;
  sampleSizes: string;
  guardrailRegressions: string[];
  dataQualityLimitations: string;
  qualityCheckFlags: string[];
  humanOutcomeReview?: HumanOutcomeReview;
}

export type RunState =
  | 'Queued'
  | 'Running'
  | 'Checking'
  | 'Passed'
  | 'Failed'
  | 'Awaiting Human'
  | 'Completed';

export interface LoopConfig {
  id: string;
  name: string;
  stage: 'Gather' | 'Rank' | 'Explore' | 'Decide' | 'Deliver & Learn';
  trigger: {
    type: 'manual' | 'daily' | 'weekly' | 'event';
    eventName?: string;
    label: string;
  };
  skill: {
    title: string;
    promptInstructions: string;
    editable: boolean;
  };
  maker: {
    agentName: string;
    modelName: string;
    taskDescription: string;
  };
  checker: {
    agentName: string;
    modelName: string;
    explicitRules: string[];
  };
  gate: {
    rulesSummary: string;
    passThreshold: string;
  };
  state: {
    lastRunAt?: string;
    configuredNextRun?: string;
    runCount: number;
    failureCount: number;
  };
}

export interface LoopRun {
  id: string;
  loopId: string;
  targetEntityId?: string;
  startedAt: string;
  status: RunState;
  attemptNumber: number;
  makerOutput?: any;
  checkerEvaluation?: {
    passed: boolean;
    findings: string[];
    evidenceSupportScore?: number;
    strategyCheck?: string;
    consistencyCheck?: string;
    missingAssumptions?: string[];
  };
  reasons: string[];
  provenance: 'Demo Seed' | 'Live Gemini' | 'User Accepted';
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  actor: string;
  role: Role | 'Agent';
  action: string;
  targetId: string;
  targetType: 'signal' | 'opportunity' | 'concept' | 'decision' | 'slice' | 'release' | 'strategy';
  description: string;
}

export interface WorkspaceNotification {
  id: string;
  type: 'warning' | 'info' | 'drift' | 'regression';
  title: string;
  message: string;
  targetEntityId?: string;
  targetView?: string;
  timestamp: string;
  read: boolean;
}
