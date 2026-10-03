import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Policy,
  EvalTestCase,
  EvalTaskType,
  EvalRiskCategory,
  PolicySeverity,
  TestCaseRunResult,
} from '../types/evals';
import { compareConfigurations } from '../evals/evalRunner';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Download,
  Filter,
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  Code2,
  FileText,
  UserCheck,
  Pause,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  History,
  Check,
  X,
  Layers,
} from 'lucide-react';

export const EvalsView: React.FC = () => {
  const {
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
    runDeterministicEvalSuite,
    runLiveAIEvalSuite,
    addEvalTestCase,
    updatePolicy,
    resolveReviewQueueItem,
    togglePauseAI,
    promoteCandidateConfig,
    rollbackToBaselineConfig,
    exportSanitizedEvalResults,
    setHumanCalibration,
    hasLiveGeminiKey,
    role,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'overview' | 'library' | 'results' | 'policies' | 'queue'>('overview');
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [suiteRunMessage, setSuiteRunMessage] = useState<string | null>(null);

  // Filters for Test Library
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all');

  // Modal states
  const [selectedTestDetail, setSelectedTestDetail] = useState<EvalTestCase | null>(null);
  const [selectedRunResultDetail, setSelectedRunResultDetail] = useState<TestCaseRunResult | null>(null);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotionNotes, setPromotionNotes] = useState('Promoting v1.1-candidate after zero-regression evaluation.');
  const [showCompareBaseline, setShowCompareBaseline] = useState(false);

  // New test case state
  const [newTestScenario, setNewTestScenario] = useState('');
  const [newTestTask, setNewTestTask] = useState<EvalTaskType>('signal_digest');
  const [newTestRisk, setNewTestRisk] = useState<EvalRiskCategory>('unauthorized_action');
  const [newTestSeverity, setNewTestSeverity] = useState<PolicySeverity>('High');
  const [newTestExpected, setNewTestExpected] = useState('');
  const [newTestProhibited, setNewTestProhibited] = useState('');

  // Human Calibration Modal
  const [calibratingTestId, setCalibratingTestId] = useState<string | null>(null);
  const [calibrationJudgment, setCalibrationJudgment] = useState<'Pass' | 'Fail'>('Pass');
  const [calibrationRationale, setCalibrationRationale] = useState('');

  const comparison = compareConfigurations(baselineResults, evalRunResults);

  const handleRunDeterministicSuite = async () => {
    setIsRunningSuite(true);
    setSuiteRunMessage('Executing deterministic evaluation suite across 42 test fixtures...');
    try {
      const summary = await runDeterministicEvalSuite();
      setSuiteRunMessage(`Suite completed: ${summary.passedTests}/${summary.totalTests} passed (${summary.overallPassRate}%).`);
      setTimeout(() => setSuiteRunMessage(null), 4000);
    } finally {
      setIsRunningSuite(false);
    }
  };

  const handleRunLiveSuite = async () => {
    setIsRunningSuite(true);
    setSuiteRunMessage('Executing live suite against gemini-3.8-flash...');
    try {
      const summary = await runLiveAIEvalSuite();
      setSuiteRunMessage(`Live suite completed: ${summary.passedTests}/${summary.totalTests} passed.`);
      setTimeout(() => setSuiteRunMessage(null), 4000);
    } finally {
      setIsRunningSuite(false);
    }
  };

  const handleExportResults = () => {
    const jsonStr = exportSanitizedEvalResults();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowdesk-eval-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePromoteSubmit = () => {
    const success = promoteCandidateConfig(promotionNotes);
    if (success) setShowPromoteModal(false);
  };

  const handleSaveCalibration = () => {
    if (!calibratingTestId || !calibrationRationale.trim()) {
      alert('Rationale is required for human calibration.');
      return;
    }
    setHumanCalibration(calibratingTestId, calibrationJudgment, calibrationRationale);
    setCalibratingTestId(null);
    setCalibrationRationale('');
  };

  const filteredTests = evalTestCases.filter((tc) => {
    if (selectedTaskFilter !== 'all' && tc.taskType !== selectedTaskFilter) return false;
    if (selectedRiskFilter !== 'all' && tc.riskCategory !== selectedRiskFilter) return false;
    if (selectedSeverityFilter !== 'all' && tc.severity !== selectedSeverityFilter) return false;
    if (librarySearch.trim()) {
      const q = librarySearch.toLowerCase();
      return (
        tc.id.toLowerCase().includes(q) ||
        tc.scenario.toLowerCase().includes(q) ||
        tc.expectedBehavior.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
              Evaluation & Guardrails
            </span>
            <span className="text-xs text-stone-500">Master Governance Layer</span>
            {isAiPaused && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                AI Paused
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Evals & Guardrails Framework</h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Deterministic application guardrails block prohibited actions, while versioned evaluation suites
            detect quality regressions and hallucination across all 8 product tasks.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={togglePauseAI}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isAiPaused
                ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200'
            }`}
            title="Pauses automated background model runs while preserving manual workspace editing"
          >
            {isAiPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isAiPaused ? 'Resume AI Runs' : 'Pause AI Runs'}</span>
          </button>

          <button
            onClick={handleExportResults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-medium shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Export Evals JSON</span>
          </button>

          <button
            onClick={handleRunDeterministicSuite}
            disabled={isRunningSuite}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-xs"
          >
            {isRunningSuite ? (
              <Clock className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Run Suite ({evalTestCases.length} Tests)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Tab A: Overview & Gate
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'library'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Tab B: Test Library ({evalTestCases.length})
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'results'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Tab C: Run Results & Diff ({evalRunResults.filter((r) => r.passed).length}/{evalRunResults.length})
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
            activeTab === 'policies'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Tab D: Policies ({policies.length})
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>Tab E: Review Queue</span>
          {reviewQueue.filter((q) => q.status === 'Pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              {reviewQueue.filter((q) => q.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {suiteRunMessage && (
        <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <span>{suiteRunMessage}</span>
          <button onClick={() => setSuiteRunMessage(null)} className="text-purple-600 hover:text-purple-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB A: OVERVIEW & ACTIVATION GATE
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Version & Config Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Configuration */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-700">
                    Active Production Baseline
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  v{activeAIConfig.version} (Active)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 pt-1">
                <div>Model: <strong>{activeAIConfig.modelConfig.model}</strong></div>
                <div>Quality Gate: <strong>≥ {activeAIConfig.qualityThreshold}%</strong></div>
                <div>Maker Prompt: <span className="font-mono text-[10px]">{activeAIConfig.makerInstructionVersion}</span></div>
                <div>Checker Prompt: <span className="font-mono text-[10px]">{activeAIConfig.checkerInstructionVersion}</span></div>
                <div>Timeout: <strong>{activeAIConfig.modelConfig.timeoutMs}ms</strong></div>
                <div>Max Revisions: <strong>{activeAIConfig.modelConfig.maxRevisionAttempts} attempts</strong></div>
              </div>

              <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 flex items-center justify-between">
                <span>Promoted: {activeAIConfig.createdAt.split('T')[0]} by {activeAIConfig.promotedBy || 'Sarah Lin'}</span>
                <button
                  onClick={rollbackToBaselineConfig}
                  className="text-stone-600 hover:text-stone-900 underline"
                  title="Roll back to pristine initial baseline"
                >
                  Rollback to Baseline
                </button>
              </div>
            </div>

            {/* Candidate Configuration */}
            <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-xs uppercase tracking-wider text-purple-900">
                    Candidate AI Configuration
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold border border-purple-300">
                  v{candidateAIConfig.version}
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-snug">
                {candidateAIConfig.promotionNotes || 'Candidate configuration with updated instruction boundaries.'}
              </p>

              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
                <div>
                  Score vs Baseline:{' '}
                  <strong className={comparison.scoreDelta >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                    {comparison.candidateScore}% ({comparison.scoreDelta >= 0 ? `+${comparison.scoreDelta}%` : `${comparison.scoreDelta}%`})
                  </strong>
                </div>
                <div>
                  Latency: <strong>{comparison.candidateAvgLatencyMs}ms</strong> (was {comparison.baselineAvgLatencyMs}ms)
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowPromoteModal(true)}
                  disabled={!comparison.canPromote}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs ${
                    comparison.canPromote
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                  title={comparison.canPromote ? 'Promote candidate to Active' : 'Promotion blocked: must pass activation gate'}
                >
                  Promote to Active Baseline
                </button>
              </div>
            </div>
          </div>

          {/* Activation Gate Status Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
              evalMetrics.activationGatePassed
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {evalMetrics.activationGatePassed ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {evalMetrics.activationGatePassed
                    ? 'Activation Gate: PASSED (Configuration Meets Safety Rules)'
                    : 'Activation Gate: BLOCKED (Gate Criteria Unfulfilled)'}
                </div>
                <div className="mt-0.5 text-stone-700">{evalMetrics.gateReasons.join(' ')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono font-bold text-sm">
                Pass Rate: {evalMetrics.overallPassRate}%
              </span>
            </div>
          </div>

          {/* Crucial Prototype Policy Disclaimer */}
          <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
            <div>
              <strong>Evaluation Disclaimer:</strong> Passing evals means this configuration passed these
              specific tests. It does not guarantee correctness on every future input.
            </div>
            <div>
              Initial quality threshold (90%) is a prototype policy choice, not a proven industry standard.
            </div>
          </div>

          {/* Core Measurement Coverage Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-600">
                Guardrail & Behavioral Coverage Metrics
              </h3>
              <span className="text-[11px] text-stone-500">Detailed numerator / denominator reporting</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'Schema Validity', rate: evalMetrics.schemaValidityRate, desc: 'Output JSON schema structure' },
                { label: 'Supported Claims', rate: evalMetrics.supportedClaimRate, desc: 'Zero ungrounded hallucinations' },
                { label: 'Citation Validity', rate: evalMetrics.citationValidityRate, desc: 'Referenced IDs belong to workspace' },
                { label: 'Strategy Adherence', rate: evalMetrics.strategyAdherenceRate, desc: 'Non-goals strictly respected' },
                { label: 'Prompt Injection Defense', rate: evalMetrics.promptInjectionResistanceRate, desc: 'Neutralizes rule bypass attempts' },
                { label: 'Unauthorized Action Blocks', rate: evalMetrics.unauthorizedActionBlockRate, desc: 'Blocks AI self-approval & release' },
                { label: 'Human Gate Enforcement', rate: evalMetrics.humanGateEnforcementRate, desc: 'Mandatory human authorization' },
                { label: 'Workflow Transition Correctness', rate: evalMetrics.workflowTransitionCorrectnessRate, desc: 'Rejects stale version steps' },
                { label: 'Duplicate Prevention', rate: evalMetrics.duplicatePreventionRate, desc: 'Idempotency prevents duplicate signals' },
                { label: 'Correct Abstention', rate: evalMetrics.correctAbstentionRate, desc: 'Refuses to invent missing data' },
                { label: 'Human Agreement', rate: evalMetrics.evaluatorHumanAgreementRate, desc: 'Evaluator match with human labels' },
              ].map((m, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <div className="text-[11px] text-stone-500 font-medium truncate">{m.label}</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold text-stone-900 font-mono">
                      {m.rate.pct !== null ? `${m.rate.pct}%` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {m.rate.passed}/{m.rate.total}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 leading-tight">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-Task Pass Rates */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
              Per-Task Evaluation Pass Rates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {Object.entries(evalMetrics.perTaskResults).map(([task, res]) => (
                <div key={task} className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
                  <div className="font-semibold text-stone-800 capitalize">
                    {task.replace('_', ' ')}
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="font-mono text-stone-900 font-bold">
                      {res.passPct !== null ? `${res.passPct}%` : 'N/A'}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {res.passed}/{res.total} tests
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB B: TEST LIBRARY
         ========================================================================= */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* Library Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scenarios, IDs, behaviors..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <select
                value={selectedTaskFilter}
                onChange={(e) => setSelectedTaskFilter(e.target.value)}
                className="text-xs p-1.5 border border-stone-200 rounded-lg bg-stone-50"
              >
                <option value="all">All Tasks</option>
                <option value="signal_digest">Signal Digest</option>
                <option value="opportunity_ranking">Opportunity Ranking</option>
                <option value="independent_checking">Independent Checking</option>
                <option value="concept_generation">Concept Generation</option>
                <option value="synthetic_review">Synthetic Review</option>
                <option value="decision_challenge">Decision Challenge</option>
                <option value="delivery_brief">Delivery Brief</option>
                <option value="outcome_summary">Outcome Summary</option>
              </select>

              <select
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                className="text-xs p-1.5 border border-stone-200 rounded-lg bg-stone-50"
              >
                <option value="all">All Risk Categories</option>
                <option value="unauthorized_action">Unauthorized Actions</option>
                <option value="evidence_hallucination">Evidence Hallucinations</option>
                <option value="prompt_injection">Prompt Injections</option>
                <option value="stale_version_drift">Stale Version Drift</option>
                <option value="calculation_or_bounds">Calculation Bounds</option>
                <option value="malformed_schema">Malformed Schemas</option>
                <option value="duplicate_submission">Duplicate Submissions</option>
              </select>

              <button
                onClick={() => setShowAddTestModal(true)}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 font-semibold flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test Case</span>
              </button>
            </div>
          </div>

          {/* Test Cases Table / List */}
          <div className="space-y-2.5">
            {filteredTests.map((tc) => (
              <div
                key={tc.id}
                onClick={() => setSelectedTestDetail(tc)}
                className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs hover:border-purple-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                      {tc.id}
                    </span>
                    <span className="font-semibold text-stone-900 text-xs">{tc.scenario}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        tc.severity === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : tc.severity === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {tc.severity}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-500">
                    Task: <strong className="text-stone-700">{tc.taskType}</strong> • Risk:{' '}
                    <strong className="text-stone-700">{tc.riskCategory}</strong> • Assertions:{' '}
                    {tc.assertions.length}
                  </div>

                  <div className="text-stone-700 text-[11px] line-clamp-1">
                    <strong>Expected:</strong> {tc.expectedBehavior}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {tc.humanCalibration && (
                    <span className="px-2 py-0.5 bg-lime-50 text-lime-900 border border-lime-300 rounded text-[10px] font-semibold">
                      Human Calibrated
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB C: RUN RESULTS & DIFF
         ========================================================================= */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-stone-800">
                Evaluation Execution Results ({evalRunResults.filter((r) => r.passed).length}/{evalRunResults.length} Passed)
              </span>
              <p className="text-stone-500 text-[11px] mt-0.5">
                Every test is evaluated through deterministic code assertions and policy gates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompareBaseline(!showCompareBaseline)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  showCompareBaseline ? 'bg-purple-50 text-purple-900 border-purple-300' : 'bg-stone-100 text-stone-700'
                }`}
              >
                {showCompareBaseline ? 'Hide Baseline Diff' : 'Compare with Baseline'}
              </button>

              <button
                onClick={handleRunDeterministicSuite}
                disabled={isRunningSuite}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 text-xs font-semibold"
              >
                Re-Run Suite
              </button>
            </div>
          </div>

          {/* Compare Baseline Card */}
          {showCompareBaseline && (
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-purple-950 flex justify-between">
                <span>Baseline v1.0.0 vs Candidate v1.1.0 Diff</span>
                <span className={comparison.scoreDelta >= 0 ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                  Score Delta: {comparison.scoreDelta >= 0 ? `+${comparison.scoreDelta}%` : `${comparison.scoreDelta}%`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-700">
                <div>Resolved Failures: <strong>{comparison.resolvedFailures.length}</strong></div>
                <div>New Regressions: <strong className="text-red-700">{comparison.newRegressions.length}</strong></div>
                <div>Baseline Avg Latency: <strong>{comparison.baselineAvgLatencyMs}ms</strong></div>
                <div>Candidate Avg Latency: <strong>{comparison.candidateAvgLatencyMs}ms</strong></div>
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-2.5">
            {evalRunResults.map((res) => (
              <div
                key={res.testId}
                onClick={() => setSelectedRunResultDetail(res)}
                className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs shadow-2xs ${
                  res.passed ? 'border-stone-200 hover:border-emerald-300' : 'border-red-300 bg-red-50/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {res.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-800">{res.testId}</span>
                      <span className="font-semibold text-stone-900">{res.scenario}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{res.latencyMs}ms</span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {res.findings[0] || 'All assertions passed.'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {res.passed ? 'Passed' : 'Failed'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB D: POLICIES
         ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-stone-900">
                Master Security & Workflow Policies ({policies.length} Registered)
              </span>
              <p className="text-stone-500 text-[11px] mt-0.5">
                Hard deterministic rules (Block) reject prohibited behavior. Quality rules require human review.
              </p>
            </div>
            <span className="text-[11px] text-purple-700 font-semibold">
              Policy Engine Active v1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[11px] text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                      {pol.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pol.enforcement === 'Block'
                          ? 'bg-red-100 text-red-800'
                          : pol.enforcement === 'Require Review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {pol.enforcement} ({pol.severity})
                    </span>
                  </div>

                  <h4 className="font-semibold text-stone-900 text-xs">{pol.name}</h4>
                  <p className="text-[11px] text-stone-600 leading-snug mt-1">{pol.description}</p>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-500 font-mono">
                  Code Gate: {pol.deterministicCheck}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB E: HUMAN REVIEW QUEUE
         ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-stone-900">
                Protected Human Review Queue ({reviewQueue.length} Items)
              </span>
              <p className="text-stone-500 text-[11px] mt-0.5">
                Candidate model outputs held for explicit human judgment due to policy triggers or ungrounded evidence.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {reviewQueue.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
                Review queue is empty. No blocked outputs pending review.
              </div>
            ) : (
              reviewQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-800">{item.id}</span>
                        <span className="font-semibold text-stone-900">{item.taskType}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Policy: {item.triggeringPolicyId} ({item.policyName})
                        </span>
                      </div>
                      <p className="text-stone-700 text-xs mt-1 font-medium">{item.reason}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Pending'
                          ? 'bg-amber-100 text-amber-900'
                          : item.status === 'Approved by Human'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-800 overflow-x-auto">
                    Candidate: {JSON.stringify(item.candidateOutput)}
                  </div>

                  {item.status === 'Pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() =>
                          resolveReviewQueueItem(
                            item.id,
                            'Rejected by Human',
                            'Human lead confirmed candidate breaches policy.'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium"
                      >
                        Reject Output
                      </button>

                      <button
                        onClick={() =>
                          resolveReviewQueueItem(
                            item.id,
                            'Approved by Human',
                            'Authorized by Human Lead with recorded exception.'
                          )
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-lime-600 hover:bg-lime-500 text-stone-900 text-xs font-bold shadow-2xs"
                      >
                        Authorize with Human Exception
                      </button>
                    </div>
                  )}

                  {item.resolutionNotes && (
                    <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                      Resolved: <strong>{item.status}</strong> by {item.reviewerRole}. Note: "{item.resolutionNotes}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Test Case Detail Modal */}
      {selectedTestDetail && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full p-6 text-stone-900 text-xs max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                  {selectedTestDetail.id}
                </span>
                <h3 className="font-semibold text-sm">{selectedTestDetail.scenario}</h3>
              </div>
              <button onClick={() => setSelectedTestDetail(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-stone-600">
              <div>Task Type: <strong>{selectedTestDetail.taskType}</strong></div>
              <div>Risk Category: <strong>{selectedTestDetail.riskCategory}</strong></div>
              <div>Severity: <strong className="text-red-700">{selectedTestDetail.severity}</strong></div>
              <div>Dataset: <strong className="font-mono">{selectedTestDetail.datasetVersion}</strong></div>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-800">
              <div className="text-[10px] font-bold text-stone-400 uppercase mb-1">Input Fixture</div>
              {selectedTestDetail.inputFixture.sourceText && (
                <div className="mb-2 italic">"{selectedTestDetail.inputFixture.sourceText}"</div>
              )}
              {selectedTestDetail.inputFixture.rawPayload && (
                <div>Payload: {JSON.stringify(selectedTestDetail.inputFixture.rawPayload)}</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <strong className="text-emerald-900 block text-[11px] uppercase mb-0.5">Expected Behavior:</strong>
                <span className="text-emerald-950">{selectedTestDetail.expectedBehavior}</span>
              </div>
              <div className="p-2.5 bg-red-50 rounded-lg border border-red-200">
                <strong className="text-red-900 block text-[11px] uppercase mb-0.5">Prohibited Behavior:</strong>
                <span className="text-red-950">{selectedTestDetail.prohibitedBehavior}</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-stone-700 text-xs uppercase mb-1">
                Deterministic Assertions ({selectedTestDetail.assertions.length})
              </div>
              <div className="space-y-1">
                {selectedTestDetail.assertions.map((a) => (
                  <div key={a.id} className="p-2 bg-stone-50 rounded border border-stone-100 font-mono text-[11px]">
                    <span className="font-bold text-purple-700">{a.assertionType}:</span> {a.description}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  setCalibratingTestId(selectedTestDetail.id);
                  setSelectedTestDetail(null);
                }}
                className="text-purple-700 hover:text-purple-900 font-semibold"
              >
                Add Human Calibration Label
              </button>

              <button
                onClick={() => setSelectedTestDetail(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Result Detail Modal */}
      {selectedRunResultDetail && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full p-6 text-stone-900 text-xs max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                  {selectedRunResultDetail.testId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedRunResultDetail.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedRunResultDetail.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <button onClick={() => setSelectedRunResultDetail(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="font-semibold text-stone-900">{selectedRunResultDetail.scenario}</div>

            <div>
              <div className="font-bold text-stone-700 text-xs uppercase mb-1">Assertion Breakdown</div>
              <div className="space-y-1.5">
                {selectedRunResultDetail.assertionResults.map((a) => (
                  <div
                    key={a.assertionId}
                    className={`p-2 rounded border flex items-start gap-2 ${
                      a.passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {a.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{a.description}</div>
                      <div className="text-[11px] text-stone-600">{a.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1 text-[11px]">
              <div>Sanitized Input: {selectedRunResultDetail.sanitizedInputExcerpt}</div>
              <div>Candidate Output: {selectedRunResultDetail.candidateOutputExcerpt}</div>
              <div>Execution Mode: {selectedRunResultDetail.executionMode} ({selectedRunResultDetail.latencyMs}ms)</div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedRunResultDetail(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human Calibration Modal */}
      {calibratingTestId && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-5 text-stone-900 text-xs space-y-3">
            <h3 className="font-semibold text-sm">Add Human Calibration Label ({calibratingTestId})</h3>
            <p className="text-stone-500">
              Compare AI evaluator scores with human gold labels to measure false passes and false failures.
            </p>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Human Judgment</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCalibrationJudgment('Pass')}
                  className={`flex-1 py-1.5 rounded-lg border font-bold ${
                    calibrationJudgment === 'Pass' ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-stone-50'
                  }`}
                >
                  Pass
                </button>
                <button
                  type="button"
                  onClick={() => setCalibrationJudgment('Fail')}
                  className={`flex-1 py-1.5 rounded-lg border font-bold ${
                    calibrationJudgment === 'Fail' ? 'bg-red-100 border-red-300 text-red-900' : 'bg-stone-50'
                  }`}
                >
                  Fail
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Calibration Rationale (Required)</label>
              <textarea
                rows={3}
                required
                value={calibrationRationale}
                onChange={(e) => setCalibrationRationale(e.target.value)}
                placeholder="Explain why human expert assigns this judgment..."
                className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCalibratingTestId(null)}
                className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCalibration}
                className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800"
              >
                Save Calibration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Config Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-5 text-stone-900 text-xs space-y-3">
            <h3 className="font-semibold text-sm">Promote Candidate Configuration</h3>
            <p className="text-stone-600">
              Candidate v{candidateAIConfig.version} satisfies all activation gates with zero regressions.
            </p>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Promotion Notes (Audit Log)</label>
              <textarea
                rows={3}
                value={promotionNotes}
                onChange={(e) => setPromotionNotes(e.target.value)}
                className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteSubmit}
                className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700"
              >
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
