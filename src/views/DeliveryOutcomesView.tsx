import React, { useState } from 'react';
import { useWorkspace, DeliveryTab } from '../context/WorkspaceContext';
import { DeliverySlice, ReleaseOutcome, BoardStage } from '../types';
import {
  Rocket,
  FileCode2,
  Kanban,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Code2,
  Edit2,
  Sparkles,
  RefreshCw,
  Plus,
  ExternalLink,
  Info,
  Check,
  X,
} from 'lucide-react';

export const DeliveryOutcomesView: React.FC = () => {
  const {
    role,
    setRole,
    deliveryTab,
    setDeliveryTab,
    deliverySlices,
    releaseOutcomes,
    updateDeliveryBrief,
    runSpecDriftCheck,
    updateSliceStage,
    approveSimulatedRelease,
    runOutcomeQualityCheck,
    recordOutcomeReview,
    openInspector,
    setActiveView,
  } = useWorkspace();

  const slice = deliverySlices[0];
  const release = releaseOutcomes[0];

  // Tab A: Spec Edit State
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [editedInScope, setEditedInScope] = useState(slice?.inScope?.join('\n') || '');
  const [editedCriteria, setEditedCriteria] = useState(slice?.acceptanceCriteria?.join('\n') || '');
  const [driftRunning, setDriftRunning] = useState(false);

  // Tab B: Simulate Release Modal
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('Release candidate verified. Canary rollout to 10% traffic.');

  // Tab C: Outcome Review Modal
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcomeDecision, setOutcomeDecision] = useState<
    'Continue' | 'Iterate' | 'Recommend rollback' | 'Gather more evidence'
  >('Iterate');
  const [outcomeRationale, setOutcomeRationale] = useState(
    'Iterate release: Maintain the high activation gains (+31.8%), but fix the critical guardrail regression by adding a 1-click "Editor / Can Edit" toggle to the quick-invite modal to eliminate member permission confusion.'
  );

  const isEngineer = role === 'engineer';

  const handleSaveBrief = () => {
    updateDeliveryBrief(slice.id, {
      inScope: editedInScope.split('\n').filter((l) => l.trim()),
      acceptanceCriteria: editedCriteria.split('\n').filter((l) => l.trim()),
    });
    setIsEditingBrief(false);
  };

  const handleRunDriftCheck = async () => {
    setDriftRunning(true);
    await runSpecDriftCheck(slice.id);
    setDriftRunning(false);
  };

  const handleSimulateReleaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = approveSimulatedRelease(slice.id, releaseNotes);
    if (ok) {
      setShowReleaseModal(false);
    }
  };

  const handleCompleteOutcomeReview = () => {
    if (!outcomeRationale.trim()) {
      alert('Rationale is required to complete an outcome review.');
      return;
    }
    recordOutcomeReview(release.id, outcomeDecision, outcomeRationale);
    setShowOutcomeModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-900 border border-orange-200 font-semibold">
              Stage 5: Deliver & Learn
            </span>
            <span className="text-xs text-stone-500">Connected Engineering & Learning Loop</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Delivery & Outcomes</h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Shape unambiguous delivery briefs, audit spec drift, track release readiness, simulate releases
            with engineer sign-off, and review post-launch metrics to feed learning signals back into the cycle.
          </p>
        </div>

        {/* 3 Connected Tabs Selector */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
          <button
            onClick={() => setDeliveryTab('shape')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium ${
              deliveryTab === 'shape'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Tab A: Shape the Slice</span>
          </button>

          <button
            onClick={() => setDeliveryTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium ${
              deliveryTab === 'board'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Tab B: Build & Ship</span>
          </button>

          <button
            onClick={() => setDeliveryTab('measure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium ${
              deliveryTab === 'measure'
                ? 'bg-orange-600 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Tab C: Measure ({releaseOutcomes.filter((r) => r.guardrailRegressions.length).length} Alert)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB A: SHAPE THE SLICE
         ========================================================================= */}
      {deliveryTab === 'shape' && (
        <div className="space-y-5">
          {/* Slice Header with Drift & Versioning */}
          <div className="bg-[#fbfaf7] p-4 rounded-xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {slice.id} (v{slice.version})
                </span>
                <span className="font-semibold text-stone-900 text-sm">{slice.title}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    slice.engineeringReviewStatus === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  Eng Review: {slice.engineeringReviewStatus}
                </span>
              </div>
              <p className="text-stone-600">
                Derived from approved Concept {slice.conceptId} & Decision {slice.decisionId}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunDriftCheck}
                disabled={driftRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-purple-300 text-stone-800 text-xs font-medium shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{driftRunning ? 'Checking...' : 'Check Spec Drift'}</span>
              </button>

              <button
                onClick={() => setIsEditingBrief(!isEditingBrief)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-xs font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingBrief ? 'Cancel Edit' : 'Edit Brief'}</span>
              </button>
            </div>
          </div>

          {/* Spec Drift Alert if Flagged */}
          {slice.specDriftDetails && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                slice.specDriftFlag
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              {slice.specDriftFlag ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong>Spec Drift Check Result:</strong> {slice.specDriftDetails}
              </div>
            </div>
          )}

          {/* Delivery Brief Form / Display */}
          {isEditingBrief ? (
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4 text-xs">
              <h3 className="font-semibold text-sm text-stone-900">Edit Delivery Scope & Criteria</h3>
              <p className="text-stone-500">
                Notice: Changing acceptance criteria or in-scope items will bump the spec version and
                require Engineering re-review.
              </p>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  In Scope (one item per line)
                </label>
                <textarea
                  rows={4}
                  value={editedInScope}
                  onChange={(e) => setEditedInScope(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Acceptance Criteria (one item per line)
                </label>
                <textarea
                  rows={5}
                  value={editedCriteria}
                  onChange={(e) => setEditedCriteria(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditingBrief(false)}
                  className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBrief}
                  className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800"
                >
                  Save Specification
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 Cols: Structured Brief */}
              <div className="lg:col-span-2 space-y-4">
                {/* Problem & Scope */}
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
                  <div className="font-bold text-xs uppercase text-stone-600 tracking-wider">
                    Problem & Intended Outcome
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed font-medium">
                    {slice.problemAndOutcome}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs">
                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                      <div className="font-bold text-emerald-900 text-[11px] uppercase mb-1">
                        In Scope
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-stone-800">
                        {slice.inScope.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="font-bold text-stone-500 text-[11px] uppercase mb-1">
                        Out of Scope
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-stone-600">
                        {slice.outOfScope.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* User Stories & Acceptance Criteria */}
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
                  <div className="font-bold text-xs uppercase text-stone-600 tracking-wider">
                    Acceptance Criteria & Gherkin Verification
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {slice.acceptanceCriteria.map((ac, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-stone-50 rounded border border-stone-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-stone-800 leading-snug">{ac}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-stone-100">
                    <div className="font-bold text-xs uppercase text-stone-600 tracking-wider mb-2">
                      User Stories
                    </div>
                    <div className="space-y-2 text-xs">
                      {slice.userStories.map((story, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-purple-50/40 border border-purple-100 text-stone-800">
                          As a <strong>{story.asA}</strong>, I want <strong>{story.iWant}</strong> so that{' '}
                          <em>{story.soThat}</em>.
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Telemetry Events & Thresholds */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-3 text-xs">
                  <div className="font-bold uppercase tracking-wider text-stone-600 text-[11px]">
                    Success Threshold
                  </div>
                  <div className="p-2.5 bg-lime-50 border border-lime-200 rounded-lg text-lime-900 font-semibold">
                    {slice.successThreshold}
                  </div>

                  <div className="font-bold uppercase tracking-wider text-stone-600 text-[11px] pt-2 border-t border-stone-100">
                    Guardrail Metrics
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-stone-700">
                    {slice.guardrailMetrics.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>

                  <div className="font-bold uppercase tracking-wider text-stone-600 text-[11px] pt-2 border-t border-stone-100">
                    Rollout & Rollback Flag
                  </div>
                  <div className="p-2 bg-stone-50 rounded border border-stone-200 font-mono text-[11px] text-stone-800">
                    {slice.rolloutRollbackApproach}
                  </div>
                </div>

                {/* Analytics Events */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-2 text-xs">
                  <div className="font-bold uppercase tracking-wider text-stone-600 text-[11px]">
                    Instrumented Telemetry Events
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {slice.analyticsEvents.map((evt, idx) => (
                      <div key={idx} className="p-2 rounded bg-stone-50 border border-stone-100 text-[11px]">
                        <div className="font-mono font-bold text-purple-700">{evt.eventName}</div>
                        <div className="text-stone-600">Trigger: {evt.trigger}</div>
                        <div className="text-stone-400 font-mono text-[10px]">Props: {evt.properties}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB B: BUILD & SHIP (BOARD + SIMULATED RELEASE)
         ========================================================================= */}
      {deliveryTab === 'board' && (
        <div className="space-y-5">
          {/* Engineering Role Enforcement Banner */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-stone-800" />
              <span>
                Simulated Release Gate: Requires explicit approval by an <strong>Engineer</strong> with
                readiness checks passing.
              </span>
            </div>

            {!isEngineer && (
              <button
                onClick={() => setRole('engineer')}
                className="px-3 py-1 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 text-xs shrink-0"
              >
                Switch Role to Engineer
              </button>
            )}
          </div>

          {/* 4-Stage Kanban Board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['Ready', 'In Progress', 'In Review', 'Released'] as BoardStage[]).map((stage) => {
              const itemsInStage = deliverySlices.filter((s) => s.boardStage === stage);

              return (
                <div key={stage} className="bg-stone-100/60 rounded-xl border border-stone-200 p-3 flex flex-col">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
                    <span className="font-bold text-xs text-stone-800">{stage}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white font-mono text-stone-600 border border-stone-200">
                      {itemsInStage.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {itemsInStage.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white rounded-lg border border-stone-200 p-3 shadow-xs space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-purple-700 font-bold text-[11px]">{s.id}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                            v{s.version}
                          </span>
                        </div>

                        <div className="font-semibold text-stone-900 leading-snug">{s.title}</div>

                        <div className="text-[11px] text-stone-500">
                          {s.acceptanceCriteria.length} acceptance criteria • {s.analyticsEvents.length} events
                        </div>

                        {/* Stage Progression Buttons */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1 text-[11px]">
                          {stage === 'Ready' && (
                            <button
                              onClick={() => updateSliceStage(s.id, 'In Progress')}
                              className="w-full py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium text-center"
                            >
                              Start Work →
                            </button>
                          )}
                          {stage === 'In Progress' && (
                            <button
                              onClick={() => updateSliceStage(s.id, 'In Review')}
                              className="w-full py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium text-center"
                            >
                              Submit for Review →
                            </button>
                          )}
                          {stage === 'In Review' && (
                            <button
                              onClick={() => setShowReleaseModal(true)}
                              className="w-full py-1.5 bg-lime-600 hover:bg-lime-500 text-stone-900 font-bold rounded shadow-2xs text-center flex items-center justify-center gap-1"
                            >
                              <Rocket className="w-3.5 h-3.5" />
                              <span>Simulate Release</span>
                            </button>
                          )}
                          {stage === 'Released' && (
                            <span className="w-full text-center text-emerald-700 font-bold py-1 bg-emerald-50 rounded">
                              ✓ Released in Demo
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simulated Engineering Agent Panel */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Simulated Engineering Agent Panel
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span>
                  Readiness Score: <strong className="text-emerald-700">{slice.engineeringAgentPanel.readinessScore}%</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                  All Gates Passed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Eval Results */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                <div className="font-bold text-stone-800 text-[11px] uppercase">
                  Continuous Automated Checks
                </div>
                <div className="space-y-1.5">
                  {slice.engineeringAgentPanel.evalResults.map((ev, i) => (
                    <div key={i} className="flex items-start justify-between p-1.5 bg-white rounded border border-stone-100">
                      <div>
                        <div className="font-semibold text-stone-900">{ev.check}</div>
                        <div className="text-[10px] text-stone-500">{ev.notes}</div>
                      </div>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bug Triage & Blockers */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                <div className="font-bold text-stone-800 text-[11px] uppercase">
                  Bug Triage & Open Blockers
                </div>
                <div className="space-y-1.5">
                  {slice.engineeringAgentPanel.bugTriage.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-1.5 bg-white rounded border border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-stone-600">{b.id}</span>
                        <span className="text-stone-800">{b.summary}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[10px] font-semibold">
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                  ✓ Zero P0/P1 blockers outstanding. Release approved for simulation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB C: MEASURE & HUMAN OUTCOME REVIEW
         ========================================================================= */}
      {deliveryTab === 'measure' && (
        <div className="space-y-5">
          {/* Release Headline */}
          <div className="bg-[#fbfaf7] p-5 rounded-xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-xs bg-orange-100 text-orange-950 px-2 py-0.5 rounded border border-orange-200">
                  {release.id}
                </span>
                <h2 className="font-bold text-sm text-stone-900">{release.releaseName}</h2>
                <span className="text-stone-500">Released: {release.releasedAt.split('T')[0]}</span>
              </div>
              <p className="text-stone-600">
                Comparison: {release.comparisonWindows} • Sample: {release.sampleSizes}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const check = runOutcomeQualityCheck(release.id);
                  alert(check.flags.join('\n\n'));
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-orange-300 font-medium text-stone-800 shadow-2xs"
              >
                Run Quality Check
              </button>

              <button
                onClick={() => setShowOutcomeModal(true)}
                className="px-4 py-1.5 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 shadow-2xs"
              >
                Perform Outcome Review
              </button>
            </div>
          </div>

          {/* Guardrail Breach Alert Banner */}
          {release.guardrailRegressions.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-300 rounded-xl space-y-1.5 text-xs text-orange-950 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-orange-950">
                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                <span>GUARDRAIL THRESHOLD BREACH DETECTED</span>
              </div>
              <p className="text-orange-900 leading-relaxed font-medium">
                {release.guardrailRegressions[0]}
              </p>
              <div className="text-[11px] text-orange-800 leading-snug">
                {release.guardrailRegressions[1]}
              </div>
            </div>
          )}

          {/* Metric Comparison Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                Controlled Metric Movements & Attribution
              </h3>
              <span className="text-[11px] text-stone-500">
                Attribution restricted to verified 50/50 A/B cohort telemetry
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Metric</th>
                    <th className="py-3 px-3">Baseline</th>
                    <th className="py-3 px-3">Target</th>
                    <th className="py-3 px-3">Post-Launch Actual</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Guardrail Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {release.targetAndActualChange.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.status === 'Regressed' ? 'bg-orange-50/50' : 'hover:bg-stone-50'}
                    >
                      <td className="py-3 px-4 font-semibold text-stone-900">{row.metric}</td>
                      <td className="py-3 px-3 font-mono text-stone-600">{row.baseline}</td>
                      <td className="py-3 px-3 font-mono text-stone-600">{row.target}</td>
                      <td className="py-3 px-3 font-mono font-bold text-stone-900">{row.actual}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'Regressed'
                              ? 'bg-orange-100 text-orange-900 border border-orange-300'
                              : row.status === 'Exceeded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-stone-500">
                        {row.isGuardrail ? (
                          <span className="font-semibold text-orange-800">Critical Guardrail</span>
                        ) : (
                          'Primary Objective'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Data Quality Limitation: {release.dataQualityLimitations}</span>
              <span>Controlled randomized workspace cohort split</span>
            </div>
          </div>

          {/* Outcome Review Completed Callout & Linked Learning Signal */}
          {release.humanOutcomeReview && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="font-bold text-xs text-stone-900">
                  Recorded Outcome Review ({release.humanOutcomeReview.reviewedByRole})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-900 border border-orange-200">
                  Decision: {release.humanOutcomeReview.decision}
                </span>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                "{release.humanOutcomeReview.rationale}"
              </p>

              {release.humanOutcomeReview.createdSignalId && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-950">
                      Closed Loop: Synthesized Learning Signal{' '}
                      <strong className="underline cursor-pointer" onClick={() => openInspector('signal', release.humanOutcomeReview!.createdSignalId!)}>
                        {release.humanOutcomeReview.createdSignalId}
                      </strong>{' '}
                      added to Signals Inbox.
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveView('signals')}
                    className="px-3 py-1 bg-white border border-purple-300 rounded text-xs font-medium text-purple-900 hover:bg-purple-100"
                  >
                    View in Signals Inbox →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Simulate Release Modal (Engineer Role) */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 text-stone-900 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-3">
              <h3 className="font-semibold text-sm">Simulate Release (Engineer Authorization)</h3>
              <button onClick={() => setShowReleaseModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-stone-600 text-xs mb-3">
              This action marks the slice as "Released" in the demo environment. No real code or external
              production systems will be modified.
            </p>

            <form onSubmit={handleSimulateReleaseSubmit} className="space-y-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Release Verification Notes</label>
                <textarea
                  rows={3}
                  required
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded text-[11px] text-stone-600">
                Signing as: <strong>Lead Engineer</strong> • All 4 automated readiness checks passed.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(false)}
                  className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800"
                >
                  Simulate Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Perform Outcome Review Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 text-stone-900 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-semibold text-sm">Human Outcome Review: {release.releaseName}</h3>
              <button onClick={() => setShowOutcomeModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1.5">Actionable Decision</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Continue', 'Iterate', 'Recommend rollback', 'Gather more evidence'] as const).map(
                  (dec) => (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => setOutcomeDecision(dec)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        outcomeDecision === dec
                          ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {dec}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">
                Executive Rationale & Synthesis
              </label>
              <textarea
                rows={4}
                required
                value={outcomeRationale}
                onChange={(e) => setOutcomeRationale(e.target.value)}
                placeholder="Explain the trade-offs and next iteration steps..."
                className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
              />
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-[11px] leading-snug">
              <strong>Closing the Cycle:</strong> Saving this review will generate exactly ONE linked
              learning signal in the Signals Inbox, feeding the insight into the next prioritization cycle.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowOutcomeModal(false)}
                className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteOutcomeReview}
                className="px-4 py-1.5 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700"
              >
                Complete Outcome Review & Close Loop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
