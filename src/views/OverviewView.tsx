import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Radio,
  Sliders,
  FlaskConical,
  Scale,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const {
    signals,
    opportunities,
    solutionConcepts,
    humanDecisions,
    deliverySlices,
    releaseOutcomes,
    loopRuns,
    activities,
    setActiveView,
    setDeliveryTab,
    openInspector,
    runSignalDigest,
    role,
    setRole,
    reviewQueue,
    evalMetrics,
    isAiPaused,
  } = useWorkspace();

  const [isDigestRunning, setIsDigestRunning] = useState(false);
  const [digestSuccess, setDigestSuccess] = useState(false);

  // Counts & items needing attention
  const newSignals = signals.filter((s) => s.status === 'New');
  const failedChecks = opportunities.filter((o) => o.checkerStatus === 'Failed');
  const pendingDecisions = opportunities.filter(
    (o) => o.status === 'Exploring' && o.activeSolutionConceptsCount
  );
  const regressedReleases = releaseOutcomes.filter((r) => r.guardrailRegressions.length > 0);
  const activeSlices = deliverySlices.filter((s) => s.boardStage !== 'Released');
  const pendingReviews = reviewQueue.filter((r) => r.status === 'Pending');

  const handleRunDigest = async () => {
    setIsDigestRunning(true);
    await runSignalDigest();
    setIsDigestRunning(false);
    setDigestSuccess(true);
    setTimeout(() => setDigestSuccess(false), 3000);
  };

  const workflowStages = [
    {
      step: '1',
      id: 'signals',
      title: 'Gather',
      desc: 'Signals & Insights',
      count: signals.length,
      badge: `${newSignals.length} new`,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <Radio className="w-4 h-4 text-purple-600" />,
      actionLabel: 'Review Signals',
      onAction: () => setActiveView('signals'),
    },
    {
      step: '2',
      id: 'priorities',
      title: 'Rank',
      desc: 'Quantitative Backlog',
      count: opportunities.length,
      badge: failedChecks.length > 0 ? `${failedChecks.length} failed check` : 'Checked',
      badgeColor: failedChecks.length > 0 ? 'bg-amber-100 text-amber-800 border-amber-200 font-semibold' : 'bg-stone-100 text-stone-600',
      icon: <Sliders className="w-4 h-4 text-stone-700" />,
      actionLabel: 'Inspect Backlog',
      onAction: () => setActiveView('priorities'),
    },
    {
      step: '3',
      id: 'solutions',
      title: 'Explore',
      desc: 'Solution Lab & Personas',
      count: solutionConcepts.length,
      badge: '5 Concepts',
      badgeColor: 'bg-stone-100 text-stone-700',
      icon: <FlaskConical className="w-4 h-4 text-stone-700" />,
      actionLabel: 'Explore Solutions',
      onAction: () => setActiveView('solutions'),
    },
    {
      step: '4',
      id: 'decisions',
      title: 'Decide',
      desc: 'Product Lead Authorization',
      count: Object.keys(humanDecisions).length,
      badge: '1 Pending',
      badgeColor: 'bg-lime-100 text-lime-900 border-lime-300 font-semibold',
      icon: <Scale className="w-4 h-4 text-lime-700" />,
      actionLabel: 'Make Decision',
      onAction: () => {
        setRole('lead');
        setActiveView('decisions');
      },
    },
    {
      step: '5',
      id: 'delivery',
      title: 'Deliver & Learn',
      desc: 'Slices & Outcomes',
      count: deliverySlices.length,
      badge: regressedReleases.length > 0 ? '1 Regression' : 'Stable',
      badgeColor: regressedReleases.length > 0 ? 'bg-orange-100 text-orange-800 border-orange-200 font-semibold' : 'bg-stone-100 text-stone-600',
      icon: <Rocket className="w-4 h-4 text-orange-600" />,
      actionLabel: 'Review Outcomes',
      onAction: () => {
        setActiveView('delivery');
        setDeliveryTab('measure');
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Attention Items & Demo Journey Action */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                Workspace Active
              </span>
              <span className="text-xs text-stone-500">Flowdesk Q3/Q4 Strategy Cycle</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Product Loops Overview
            </h1>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Continuous agent-assisted cycle: raw feedback digests into prioritized opportunities,
              divergent solutions undergo synthetic review, humans authorize trade-offs, and post-release
              regressions feed new learning signals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunDigest}
              disabled={isDigestRunning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold shadow-2xs transition-all"
            >
              {isDigestRunning ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-purple-600" />
                  <span>Clustering Signals...</span>
                </>
              ) : digestSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Digest Completed!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Run Signal Digest</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('priorities');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-xs transition-all"
            >
              <span>Continue Demo Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Guided Journey Spotlight Card */}
        <div className="mt-5 p-4 rounded-xl bg-[#fbfaf7] border border-stone-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-pulse" />
              <span className="font-semibold text-xs text-stone-900">
                Primary Demo Journey: "Guided Onboarding Checklist"
              </span>
            </div>
            <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              OPP-201
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed mb-3">
            Track the end-to-end chain from blank canvas tickets (SIG-101/105) → RICE prioritization score (3,570) →
            5 divergent solution concepts → synthetic review → Product Lead decision on SOL-301 → delivery brief →
            simulated release → and the outcome review on REL-601 with a guardrail regression that closes the loop.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => openInspector('opportunity', 'OPP-201')}
              className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-purple-300 font-medium text-stone-800 shadow-2xs"
            >
              Inspect Full OPP-201 Chain
            </button>
            <button
              onClick={() => {
                setRole('lead');
                setActiveView('decisions');
              }}
              className="px-2.5 py-1 rounded-lg bg-lime-100 border border-lime-300 hover:bg-lime-200 font-semibold text-lime-900"
            >
              Act as Product Lead (Pending Decision)
            </button>
            <button
              onClick={() => {
                setActiveView('delivery');
                setDeliveryTab('measure');
              }}
              className="px-2.5 py-1 rounded-lg bg-orange-100 border border-orange-200 hover:bg-orange-200 font-semibold text-orange-900"
            >
              Review Regressed Release (REL-601)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 5-Stage Workflow Bar */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Interactive Five-Stage Workflow
          </h2>
          <span className="text-[11px] text-stone-500">Click any stage to enter its workspace queue</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {workflowStages.map((stage) => (
            <div
              key={stage.id}
              onClick={stage.onAction}
              className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-[11px]">
                    {stage.step}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${stage.badgeColor}`}>
                    {stage.badge}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-sm text-stone-900 mb-0.5">
                  {stage.icon}
                  <span>{stage.title}</span>
                </div>
                <div className="text-[11px] text-stone-500 leading-tight mb-3">{stage.desc}</div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 text-sm">{stage.count} items</span>
                <span className="text-purple-700 font-medium text-[11px] flex items-center gap-0.5">
                  Queue <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attention Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Failed Checks Alert */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Failed Strategy Checks ({failedChecks.length})
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono border border-amber-200">
                Blocked
              </span>
            </div>
            <p className="text-xs text-stone-600 mb-3">
              Automated gate blocked opportunity progression due to direct conflict with active strategy non-goals.
            </p>

            {failedChecks.map((opp) => (
              <div
                key={opp.id}
                onClick={() => openInspector('opportunity', opp.id)}
                className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs cursor-pointer hover:bg-amber-100/60 transition-colors"
              >
                <div className="font-semibold text-amber-950 flex justify-between">
                  <span>{opp.id}: {opp.title}</span>
                  <span className="text-[10px] text-amber-800">Score {opp.score}</span>
                </div>
                <div className="text-[11px] text-amber-800 mt-1 line-clamp-2">
                  {opp.checkerNotes}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveView('priorities')}
            className="mt-3 w-full py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 text-center"
          >
            Review in Backlog
          </button>
        </div>

        {/* 2. Decisions Awaiting Product Lead */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-lime-950">
                <Scale className="w-4 h-4 text-lime-600" />
                Awaiting Product Lead Decision ({pendingDecisions.length})
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime-50 text-lime-900 font-mono border border-lime-300 font-semibold">
                Action Ready
              </span>
            </div>
            <p className="text-xs text-stone-600 mb-3">
              Solution concepts generated & synthetic review complete. Human authorization required.
            </p>

            {pendingDecisions.map((opp) => (
              <div
                key={opp.id}
                onClick={() => {
                  setRole('lead');
                  setActiveView('decisions');
                }}
                className="p-2.5 rounded-lg bg-lime-50/60 border border-lime-300 text-xs cursor-pointer hover:bg-lime-100/60 transition-colors"
              >
                <div className="font-semibold text-lime-950 flex justify-between">
                  <span>{opp.id}: {opp.title}</span>
                  <span className="text-[10px] text-lime-800">2 Shortlisted</span>
                </div>
                <div className="text-[11px] text-stone-700 mt-1">
                  Ready for Product Lead approval on SOL-301 vs SOL-302.
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setRole('lead');
              setActiveView('decisions');
            }}
            className="mt-3 w-full py-1.5 bg-lime-600 hover:bg-lime-500 text-stone-900 rounded-lg text-xs font-semibold shadow-2xs text-center"
          >
            Switch to Product Lead & Decide
          </button>
        </div>

        {/* 3. Releases Awaiting Outcome Review (Regressions) */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-950">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Outcome Review Required ({regressedReleases.length})
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 font-mono border border-orange-200 font-semibold">
                Breach
              </span>
            </div>
            <p className="text-xs text-stone-600 mb-3">
              Post-release metrics collected. Guardrail threshold breached on Release 2026.09.
            </p>

            {regressedReleases.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  setActiveView('delivery');
                  setDeliveryTab('measure');
                }}
                className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-200 text-xs cursor-pointer hover:bg-orange-100/60 transition-colors"
              >
                <div className="font-semibold text-orange-950 flex justify-between">
                  <span>{rel.releaseName}</span>
                  <span className="text-[10px] text-orange-800">+223% Tickets</span>
                </div>
                <div className="text-[11px] text-orange-900 mt-1">
                  Invite support tickets surged to 6.8% (ceiling 3.0%).
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setActiveView('delivery');
              setDeliveryTab('measure');
            }}
            className="mt-3 w-full py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 text-center"
          >
            Open Measure Tab & Review Outcome
          </button>
        </div>

        {/* 4. Safety & Policy Review Queue */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-950">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Policy & Review Queue ({pendingReviews.length})
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                  isAiPaused
                    ? 'bg-red-50 text-red-800 border-red-300 font-bold'
                    : pendingReviews.length > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {isAiPaused ? 'PAUSED' : pendingReviews.length > 0 ? 'Review Needed' : 'Compliant'}
              </span>
            </div>
            <p className="text-xs text-stone-600 mb-3">
              Enforced by Central Policy Engine. Deterministic tests and policy guards filter AI proposals.
            </p>

            {pendingReviews.map((rev) => (
              <div
                key={rev.id}
                onClick={() => setActiveView('evals')}
                className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 text-xs cursor-pointer hover:bg-purple-100/60 transition-colors mb-1.5"
              >
                <div className="font-semibold text-purple-950 flex justify-between">
                  <span>
                    {rev.id}: {rev.entityId}
                  </span>
                  <span className="text-[10px] text-purple-800 font-mono">{rev.severity}</span>
                </div>
                <div className="text-[11px] text-purple-900 mt-1 line-clamp-2">{rev.reason}</div>
              </div>
            ))}
            {pendingReviews.length === 0 && (
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
                All 20 test cases passing ({evalMetrics?.overallPassRate ?? 95}%). Zero ungrounded claims detected.
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveView('evals')}
            className="mt-3 w-full py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold text-purple-900 text-center"
          >
            Open Evals & Guardrails Suite
          </button>
        </div>
      </div>

      {/* Split Section: Recent Activity Feed & Latest Loop Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <h3 className="font-semibold text-xs text-stone-900">Workspace Activity Feed</h3>
            <span className="text-[11px] text-stone-500">{activities.length} logged events</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {activities.map((act) => (
              <div
                key={act.id}
                onClick={() => openInspector(act.targetType, act.targetId)}
                className="p-2.5 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-stone-50/60 transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.2 rounded font-medium text-[10px] ${
                        act.role === 'Agent'
                          ? 'bg-purple-100 text-purple-800'
                          : act.role === 'lead'
                          ? 'bg-lime-100 text-lime-900 font-semibold'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {act.actor}
                    </span>
                    <span className="font-mono text-stone-400">{act.targetId}</span>
                  </div>
                  <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-stone-800 leading-snug">{act.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Loop Runs */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <h3 className="font-semibold text-xs text-stone-900">Latest Loop Runs & Gate Results</h3>
            <button
              onClick={() => setActiveView('loops')}
              className="text-[11px] text-purple-700 hover:text-purple-900 font-medium"
            >
              Configure 10 Loops →
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {loopRuns.map((run) => (
              <div
                key={run.id}
                className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/50 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-stone-900">{run.loopId}</span>
                    <span className="text-[10px] font-mono text-stone-500">{run.id}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      run.status === 'Completed' || run.status === 'Passed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : run.status === 'Failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {run.status}
                  </span>
                </div>

                <div className="text-[11px] text-stone-600">
                  {run.reasons?.[0] || 'Evaluated against gate rules.'}
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                  <span>Provenance: {run.provenance}</span>
                  <span>{new Date(run.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
