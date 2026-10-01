import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  X,
  Radio,
  Sliders,
  FlaskConical,
  Scale,
  Rocket,
  Activity,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const EvidenceInspectorModal: React.FC = () => {
  const {
    inspectorTarget,
    closeInspector,
    openInspector,
    signals,
    opportunities,
    solutionConcepts,
    humanDecisions,
    deliverySlices,
    releaseOutcomes,
    setActiveView,
    setDeliveryTab,
  } = useWorkspace();

  if (!inspectorTarget) return null;

  const { type, id } = inspectorTarget;

  // Resolve entity details based on type & ID
  let title = id;
  let subtitle = '';
  let entityData: any = null;
  let linkedSignal: any = null;
  let linkedOpp: any = null;
  let linkedConcept: any = null;
  let linkedDecision: any = null;
  let linkedSlice: any = null;
  let linkedRelease: any = null;
  let linkedLearningSignal: any = null;

  if (type === 'signal' || id.startsWith('SIG-')) {
    linkedSignal = signals.find((s) => s.id === id);
    entityData = linkedSignal;
    title = linkedSignal ? `${linkedSignal.id}: ${linkedSignal.title}` : id;
    subtitle = `Signal (${linkedSignal?.category || 'General'})`;

    if (linkedSignal?.linkedOpportunityId) {
      linkedOpp = opportunities.find((o) => o.id === linkedSignal.linkedOpportunityId);
    }
  } else if (type === 'opportunity' || id.startsWith('OPP-')) {
    linkedOpp = opportunities.find((o) => o.id === id);
    entityData = linkedOpp;
    title = linkedOpp ? `${linkedOpp.id}: ${linkedOpp.title}` : id;
    subtitle = 'Prioritized Opportunity';

    // Linked signals
    if (linkedOpp?.linkedSignalIds?.length) {
      linkedSignal = signals.find((s) => linkedOpp.linkedSignalIds.includes(s.id));
    }
  } else if (type === 'concept' || id.startsWith('SOL-')) {
    linkedConcept = solutionConcepts.find((c) => c.id === id);
    entityData = linkedConcept;
    title = linkedConcept ? `${linkedConcept.id}: ${linkedConcept.title}` : id;
    subtitle = 'Solution Concept';

    if (linkedConcept) {
      linkedOpp = opportunities.find((o) => o.id === linkedConcept.opportunityId);
    }
  } else if (type === 'decision' || id.startsWith('DEC-')) {
    linkedDecision = Object.values(humanDecisions).find((d) => d.id === id);
    entityData = linkedDecision;
    title = linkedDecision ? `${linkedDecision.id}: ${linkedDecision.decisionStatus}` : id;
    subtitle = 'Product Lead Human Decision';

    if (linkedDecision) {
      linkedOpp = opportunities.find((o) => o.id === linkedDecision.opportunityId);
      linkedConcept = solutionConcepts.find((c) => c.id === linkedDecision.conceptId);
    }
  } else if (type === 'slice' || id.startsWith('SLICE-')) {
    linkedSlice = deliverySlices.find((s) => s.id === id);
    entityData = linkedSlice;
    title = linkedSlice ? `${linkedSlice.id}: ${linkedSlice.title}` : id;
    subtitle = 'Delivery Slice Specification';

    if (linkedSlice) {
      linkedOpp = opportunities.find((o) => o.id === linkedSlice.opportunityId);
      linkedConcept = solutionConcepts.find((c) => c.id === linkedSlice.conceptId);
      linkedDecision = Object.values(humanDecisions).find((d) => d.id === linkedSlice.decisionId);
    }
  } else if (type === 'release' || id.startsWith('REL-')) {
    linkedRelease = releaseOutcomes.find((r) => r.id === id);
    entityData = linkedRelease;
    title = linkedRelease ? `${linkedRelease.id}: ${linkedRelease.releaseName}` : id;
    subtitle = 'Simulated Release & Post-Launch Metrics';

    if (linkedRelease) {
      linkedSlice = deliverySlices.find((s) => s.id === linkedRelease.deliverySliceId);
      linkedOpp = opportunities.find((o) => o.id === linkedRelease.opportunityId);
      if (linkedRelease.humanOutcomeReview?.createdSignalId) {
        linkedLearningSignal = signals.find(
          (s) => s.id === linkedRelease.humanOutcomeReview?.createdSignalId
        );
      }
    }
  }

  // Cross-reference cascade for full chain
  if (linkedOpp && !linkedConcept) {
    linkedConcept = solutionConcepts.find((c) => c.opportunityId === linkedOpp.id && c.isShortlisted);
  }
  if (linkedConcept && !linkedDecision) {
    linkedDecision = Object.values(humanDecisions).find((d) => d.opportunityId === linkedConcept.opportunityId);
  }
  if (linkedDecision && !linkedSlice) {
    linkedSlice = deliverySlices.find((s) => s.decisionId === linkedDecision.id);
  }
  if (linkedSlice && !linkedRelease) {
    linkedRelease = releaseOutcomes.find((r) => r.deliverySliceId === linkedSlice.id);
  }
  if (linkedRelease && !linkedLearningSignal && linkedRelease.humanOutcomeReview?.createdSignalId) {
    linkedLearningSignal = signals.find((s) => s.id === linkedRelease.humanOutcomeReview?.createdSignalId);
  }

  const steps = [
    {
      key: 'signal',
      label: 'Source Signal',
      id: linkedSignal?.id || 'SIG-101',
      active: type === 'signal' || id.startsWith('SIG-'),
      present: !!linkedSignal,
      icon: <Radio className="w-3.5 h-3.5" />,
      onClick: () => {
        if (linkedSignal) openInspector('signal', linkedSignal.id);
      },
    },
    {
      key: 'opp',
      label: 'Opportunity',
      id: linkedOpp?.id || 'OPP-201',
      active: type === 'opportunity' || id.startsWith('OPP-'),
      present: !!linkedOpp,
      icon: <Sliders className="w-3.5 h-3.5" />,
      onClick: () => {
        if (linkedOpp) openInspector('opportunity', linkedOpp.id);
      },
    },
    {
      key: 'concept',
      label: 'Concept',
      id: linkedConcept?.id || 'SOL-301',
      active: type === 'concept' || id.startsWith('SOL-'),
      present: !!linkedConcept,
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      onClick: () => {
        if (linkedConcept) openInspector('concept', linkedConcept.id);
      },
    },
    {
      key: 'decision',
      label: 'Decision',
      id: linkedDecision?.id || 'DEC-401',
      active: type === 'decision' || id.startsWith('DEC-'),
      present: !!linkedDecision,
      icon: <Scale className="w-3.5 h-3.5" />,
      onClick: () => {
        if (linkedDecision) openInspector('decision', linkedDecision.id);
      },
    },
    {
      key: 'slice',
      label: 'Delivery Slice',
      id: linkedSlice?.id || 'SLICE-501',
      active: type === 'slice' || id.startsWith('SLICE-'),
      present: !!linkedSlice,
      icon: <Rocket className="w-3.5 h-3.5" />,
      onClick: () => {
        if (linkedSlice) openInspector('slice', linkedSlice.id);
      },
    },
    {
      key: 'release',
      label: 'Release & Outcome',
      id: linkedRelease?.id || 'REL-601',
      active: type === 'release' || id.startsWith('REL-'),
      present: !!linkedRelease,
      icon: <Activity className="w-3.5 h-3.5" />,
      onClick: () => {
        if (linkedRelease) openInspector('release', linkedRelease.id);
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-stone-900 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-mono font-semibold text-[11px]">
                {id}
              </span>
              <span className="text-stone-500 text-xs font-medium">{subtitle}</span>
            </div>
            <h3 className="font-semibold text-stone-900 text-sm mt-1">{title}</h3>
          </div>
          <button
            onClick={closeInspector}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Complete Lifecycle Trace Bar */}
        <div className="px-6 py-3 border-b border-stone-200 bg-[#fbfaf7]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2">
            Connected Evidence & Delivery Chain
          </div>
          <div className="flex items-center justify-between overflow-x-auto gap-1">
            {steps.map((st, i) => (
              <React.Fragment key={st.key}>
                <button
                  onClick={st.onClick}
                  disabled={!st.present}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    st.active
                      ? 'bg-purple-600 text-white border-purple-700 font-semibold shadow-xs'
                      : st.present
                      ? 'bg-white text-stone-800 border-stone-300 hover:border-purple-300 hover:bg-stone-50'
                      : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                  }`}
                >
                  {st.icon}
                  <div className="leading-tight">
                    <span className="block text-[10px] opacity-80">{st.label}</span>
                    <span className="font-mono text-[11px] block">{st.id}</span>
                  </div>
                </button>
                {i < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Entity Body Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Signal Detail View */}
          {linkedSignal && (type === 'signal' || id.startsWith('SIG-')) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-stone-500">
                  Source: {linkedSignal.sourceType} ({linkedSignal.sourceTag})
                </span>
                <span className="text-stone-500 text-[11px]">Observed: {linkedSignal.observedDate}</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Original Source Observation (Factual)
                </div>
                <p className="text-xs text-stone-800 font-serif leading-relaxed italic">
                  "{linkedSignal.originalSourceText}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-1">
                    AI Summary & Impact
                  </div>
                  <p className="text-xs text-stone-700 leading-snug">{linkedSignal.summary}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Inferred Explanation
                  </div>
                  <p className="text-xs text-stone-700 leading-snug">{linkedSignal.inferredExplanation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-[11px]">
                <span>
                  Customer: <strong>{linkedSignal.customerSegment}</strong>
                </span>
                <span>
                  Evidence Quality:{' '}
                  <strong className="text-purple-700">{linkedSignal.evidenceQuality}</strong>
                </span>
                <span>
                  Missing Context: <em>{linkedSignal.missingContext}</em>
                </span>
              </div>

              {linkedSignal.interviewValueReason && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                  <div className="font-semibold text-xs text-amber-900 mb-1">
                    Interview Opportunity Rationale:
                  </div>
                  <p className="text-xs text-amber-800 mb-2">{linkedSignal.interviewValueReason}</p>
                  <div className="text-[11px] font-medium text-amber-900 mb-1">
                    Suggested Discovery Questions:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                    {linkedSignal.suggestedQuestions?.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Opportunity Detail View */}
          {linkedOpp && (type === 'opportunity' || id.startsWith('OPP-')) && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 mb-1">
                  Problem Statement
                </div>
                <p className="text-xs text-stone-900 leading-relaxed font-medium">
                  {linkedOpp.problemStatement}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="text-[10px] text-stone-500 uppercase">Reach</div>
                  <div className="font-bold text-sm text-stone-900">{linkedOpp.reach}</div>
                  <div className="text-[9px] text-stone-400">accs/qtr (assumed)</div>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="text-[10px] text-stone-500 uppercase">Impact</div>
                  <div className="font-bold text-sm text-stone-900">{linkedOpp.impact}x</div>
                  <div className="text-[9px] text-stone-400">scale 0.5-3</div>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="text-[10px] text-stone-500 uppercase">Confidence</div>
                  <div className="font-bold text-sm text-stone-900">
                    {Math.round(linkedOpp.confidence * 100)}%
                  </div>
                  <div className="text-[9px] text-stone-400">evidence-based</div>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="text-[10px] text-stone-500 uppercase">Effort</div>
                  <div className="font-bold text-sm text-stone-900">{linkedOpp.effort}w</div>
                  <div className="text-[9px] text-stone-400">person-weeks</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-500">
                    Calculated Priority Score
                  </div>
                  <div className="text-lg font-bold text-purple-700">{linkedOpp.score}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-stone-500">Strategy Gate</div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                      linkedOpp.checkerStatus === 'Passed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : linkedOpp.checkerStatus === 'Failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {linkedOpp.checkerStatus === 'Passed' ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {linkedOpp.checkerStatus}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 leading-snug">
                <div className="text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Checker Assessment
                </div>
                {linkedOpp.checkerNotes}
              </div>
            </div>
          )}

          {/* Solution Concept View */}
          {linkedConcept && (type === 'concept' || id.startsWith('SOL-')) && (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 mb-1">
                  Proposed Approach
                </div>
                <p className="text-xs text-stone-800 leading-relaxed">{linkedConcept.approach}</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  User Journey
                </div>
                <p className="text-xs text-stone-800 leading-relaxed">{linkedConcept.userJourney}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Smallest Experiment
                  </div>
                  <p className="text-xs text-stone-700">{linkedConcept.smallestExperiment}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Guardrail Metric
                  </div>
                  <p className="text-xs text-stone-700">{linkedConcept.guardrailMetric}</p>
                </div>
              </div>
            </div>
          )}

          {/* Decision View */}
          {linkedDecision && (type === 'decision' || id.startsWith('DEC-')) && (
            <div className="space-y-3">
              <div className="p-3 bg-lime-50/70 border border-lime-300 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-lime-900">
                    Human Authorization: {linkedDecision.decisionStatus}
                  </span>
                  <span className="text-[11px] text-lime-800">{linkedDecision.decidedByRole}</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-medium">
                  "{linkedDecision.rationale}"
                </p>
              </div>

              {linkedDecision.aiChallengeRun && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    AI Thinking Partner Challenge ("What could make this wrong?")
                  </div>
                  <div className="text-xs text-stone-800">
                    <strong>Plausible Failure:</strong>{' '}
                    {linkedDecision.aiChallengeRun.plausibleFailureScenario}
                  </div>
                  <div className="text-xs text-stone-800">
                    <strong>Weakest Assumption:</strong>{' '}
                    {linkedDecision.aiChallengeRun.weakestAssumption}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delivery Slice View */}
          {linkedSlice && (type === 'slice' || id.startsWith('SLICE-')) && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <div className="text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Problem & Intended Outcome
                </div>
                <p className="text-xs text-stone-900">{linkedSlice.problemAndOutcome}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-700 mb-1">
                    In Scope
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-stone-700">
                    {linkedSlice.inScope?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200">
                  <div className="text-[10px] font-bold uppercase text-stone-400 mb-1">
                    Out of Scope
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-stone-500">
                    {linkedSlice.outOfScope?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Release & Outcome View */}
          {linkedRelease && (type === 'release' || id.startsWith('REL-')) && (
            <div className="space-y-3">
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-orange-950">
                    {linkedRelease.releaseName}
                  </span>
                  <span className="text-[11px] text-orange-800">
                    Released: {linkedRelease.releasedAt.split('T')[0]}
                  </span>
                </div>
                <div className="text-xs text-orange-900 font-medium">
                  {linkedRelease.guardrailRegressions[0]}
                </div>
              </div>

              {linkedLearningSignal && (
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg">
                  <div className="text-[10px] font-bold uppercase text-purple-800 mb-1">
                    Loop Closed: Generated Learning Signal
                  </div>
                  <div className="text-xs font-semibold text-stone-900">
                    {linkedLearningSignal.id}: {linkedLearningSignal.title}
                  </div>
                  <p className="text-[11px] text-stone-700 mt-1">
                    {linkedLearningSignal.inferredExplanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Jump to View */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Click any node in the chain above to inspect its linked provenance.
          </span>
          <button
            onClick={() => {
              closeInspector();
              if (type === 'signal') setActiveView('signals');
              else if (type === 'opportunity') setActiveView('priorities');
              else if (type === 'concept') setActiveView('solutions');
              else if (type === 'decision') setActiveView('decisions');
              else if (type === 'slice') {
                setActiveView('delivery');
                setDeliveryTab('shape');
              } else if (type === 'release') {
                setActiveView('delivery');
                setDeliveryTab('measure');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-xs font-medium"
          >
            <span>Open in Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
