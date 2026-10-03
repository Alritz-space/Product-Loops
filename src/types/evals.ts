/**
 * Evals & Guardrails Framework - Type Definitions
 */

export type PolicySeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type PolicyEnforcement = 'Block' | 'Require Review' | 'Warn';

export interface Policy {
  id: string; // e.g. POL-HA-01
  name: string;
  category: 'Human Approval' | 'Workflow Integrity' | 'Evidence Integrity' | 'Tool Boundaries' | 'Input & Output Safety' | 'Resource Limits';
  description: string;
  applicableActions: string[];
  severity: PolicySeverity;
  enforcement: PolicyEnforcement;
  version: number;
  deterministicCheck: string; // Description of deterministic code check
}

export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  passed: boolean;
  severity: PolicySeverity;
  enforcement: PolicyEnforcement;
  details: string;
  remediation?: string;
  timestamp: string;
}

export type ArtifactValidationStatus =
  | 'Not evaluated'
  | 'Validation incomplete'
  | 'Passed required checks'
  | 'Needs human review'
  | 'Blocked'
  | 'Stale';

export type EvalTaskType =
  | 'signal_digest'
  | 'opportunity_ranking'
  | 'independent_checking'
  | 'concept_generation'
  | 'synthetic_review'
  | 'decision_challenge'
  | 'delivery_brief'
  | 'outcome_summary';

export type EvalRiskCategory =
  | 'unauthorized_action'
  | 'evidence_hallucination'
  | 'prompt_injection'
  | 'stale_version_drift'
  | 'calculation_or_bounds'
  | 'malformed_schema'
  | 'duplicate_submission'
  | 'causal_overreach'
  | 'resource_exhaustion';

export interface DeterministicAssertion {
  id: string;
  description: string;
  assertionType:
    | 'not_contains'
    | 'contains'
    | 'equals'
    | 'valid_schema'
    | 'source_id_exists'
    | 'state_unchanged'
    | 'status_equals'
    | 'bounds_check'
    | 'no_html_tags';
  field?: string;
  expectedValue?: any;
}

export interface AssertionResult {
  assertionId: string;
  description: string;
  passed: boolean;
  actualValue?: any;
  message: string;
}

export interface EvalTestCase {
  id: string; // e.g. TC-001
  taskType: EvalTaskType;
  scenario: string;
  riskCategory: EvalRiskCategory;
  severity: PolicySeverity;
  inputFixture: {
    prompt?: string;
    sourceText?: string;
    sourceIds?: string[];
    strategyVersion?: number;
    conceptVersion?: number;
    rawPayload?: any;
  };
  expectedBehavior: string;
  prohibitedBehavior: string;
  assertions: DeterministicAssertion[];
  qualityRubric?: {
    relevanceMin: number;
    evidenceGroundedMin: number;
    clarityOfUncertaintyMin: number;
  };
  humanCalibration?: {
    humanJudgment: 'Pass' | 'Fail';
    humanRationale: string;
    calibratedBy: string;
  };
  datasetVersion: string;
}

export interface TestCaseRunResult {
  testId: string;
  taskType: EvalTaskType;
  scenario: string;
  severity: PolicySeverity;
  passed: boolean;
  executionMode: 'Deterministic Suite' | 'Live Gemini Suite';
  latencyMs: number;
  assertionResults: AssertionResult[];
  policyDecisions: PolicyEvaluationResult[];
  sanitizedInputExcerpt: string;
  candidateOutputExcerpt?: string;
  findings: string[];
  failureReason?: string;
  humanOverride?: {
    overriddenPass: boolean;
    overriddenBy: string;
    reason: string;
    originalPassed: boolean;
  };
}

export interface AIConfiguration {
  version: string; // e.g. "1.2.0"
  status: 'Active' | 'Candidate' | 'Archived';
  makerInstructionVersion: string;
  checkerInstructionVersion: string;
  modelConfig: {
    model: string;
    temperature: number;
    timeoutMs: number;
    maxRevisionAttempts: number;
  };
  schemaVersion: string;
  policyVersion: number;
  evalDatasetVersion: string;
  qualityThreshold: number; // e.g. 90
  createdAt: string;
  promotedBy?: string;
  promotionNotes?: string;
}

export interface EvalMetricsSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalFailures: number;
  overallPassRate: number; // percentage
  schemaValidityRate: { passed: number; total: number; pct: number | null };
  supportedClaimRate: { passed: number; total: number; pct: number | null };
  citationValidityRate: { passed: number; total: number; pct: number | null };
  strategyAdherenceRate: { passed: number; total: number; pct: number | null };
  correctAbstentionRate: { passed: number; total: number; pct: number | null };
  promptInjectionResistanceRate: { passed: number; total: number; pct: number | null };
  unauthorizedActionBlockRate: { passed: number; total: number; pct: number | null };
  humanGateEnforcementRate: { passed: number; total: number; pct: number | null };
  workflowTransitionCorrectnessRate: { passed: number; total: number; pct: number | null };
  duplicatePreventionRate: { passed: number; total: number; pct: number | null };
  evaluatorHumanAgreementRate: { passed: number; total: number; pct: number | null };
  perTaskResults: Record<
    EvalTaskType,
    { passed: number; total: number; passPct: number | null }
  >;
  activationGatePassed: boolean;
  gateReasons: string[];
  lastRunTimestamp: string;
}

export interface ReviewQueueItem {
  id: string; // e.g. REV-001
  taskType: EvalTaskType;
  entityId: string;
  triggeringPolicyId: string;
  policyName: string;
  severity: PolicySeverity;
  reason: string;
  candidateOutput: any;
  status: 'Pending' | 'Approved by Human' | 'Rejected by Human' | 'Rerun Requested';
  createdAt: string;
  reviewedAt?: string;
  reviewerRole?: string;
  resolutionNotes?: string;
}

export interface AuditEvent {
  id: string;
  correlationId: string;
  timestamp: string;
  trigger: 'user_action' | 'ai_maker' | 'ai_checker' | 'eval_runner' | 'policy_gate';
  actorRole: string;
  taskType?: EvalTaskType;
  targetArtifactId?: string;
  policyId?: string;
  action: string;
  decision: 'Allowed' | 'Blocked' | 'Held for Review' | 'Flagged Warning';
  redactedContextExcerpt: string;
  findings: string[];
}
