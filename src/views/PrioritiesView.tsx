import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Opportunity, StrategyDoc } from '../types';
import {
  Sliders,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Check,
  X,
  Edit2,
  FileText,
  RotateCcw,
} from 'lucide-react';

export const PrioritiesView: React.FC = () => {
  const {
    opportunities,
    strategy,
    updateStrategy,
    staleRankingsWarning,
    runPriorityRankingMaker,
    runPriorityRankingChecker,
    acceptRankingProposal,
    overrideOpportunityScore,
    openInspector,
    setActiveView,
    role,
  } = useWorkspace();

  const [sortField, setSortField] = useState<'score' | 'reach' | 'effort' | 'confidence'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  // Strategy Modal
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyDoc>({ ...strategy });
  const [strategyChangeSummary, setStrategyChangeSummary] = useState('');

  // AI Rank Modal
  const [showRankModal, setShowRankModal] = useState(false);
  const [rankRunning, setRankRunning] = useState(false);
  const [rankProposal, setRankProposal] = useState<any>(null);
  const [checkerFindings, setCheckerFindings] = useState<any>(null);

  // Override Modal
  const [overrideOpp, setOverrideOpp] = useState<Opportunity | null>(null);
  const [overrideRank, setOverrideRank] = useState(1);
  const [overrideReason, setOverrideReason] = useState('');

  const handleSort = (field: 'score' | 'reach' | 'effort' | 'confidence') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    let diff = 0;
    if (sortField === 'score') diff = b.score - a.score;
    else if (sortField === 'reach') diff = b.reach - a.reach;
    else if (sortField === 'effort') diff = a.effort - b.effort;
    else if (sortField === 'confidence') diff = b.confidence - a.confidence;
    return sortAsc ? -diff : diff;
  });

  const handleRunRankAI = async () => {
    setShowRankModal(true);
    setRankRunning(true);
    try {
      const makerOutput = await runPriorityRankingMaker();
      setRankProposal(makerOutput);
      const checkerOutput = await runPriorityRankingChecker(makerOutput);
      setCheckerFindings(checkerOutput);
    } finally {
      setRankRunning(false);
    }
  };

  const handleAcceptProposal = () => {
    if (!rankProposal) return;
    acceptRankingProposal(rankProposal);
    setShowRankModal(false);
  };

  const handleSaveStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    updateStrategy(editingStrategy, strategyChangeSummary || 'Refined strategy objectives & non-goals.');
    setShowStrategyModal(false);
    setStrategyChangeSummary('');
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideOpp || !overrideReason.trim()) return;
    overrideOpportunityScore(overrideOpp.id, overrideRank, overrideReason);
    setOverrideOpp(null);
    setOverrideReason('');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white">
              Stage 2: Rank
            </span>
            <span className="text-xs text-stone-500">Quantitative RICE Backlog</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-800 border border-purple-200">
              Strategy v{strategy.version}
            </span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Priorities Backlog</h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Explainable prioritization formula evaluated against verified evidence and current Strategy
            constraints. Non-goal violations fail the automated gate and block progression.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingStrategy({ ...strategy });
              setShowStrategyModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all border border-stone-200"
          >
            <FileText className="w-4 h-4 text-stone-600" />
            <span>Strategy v{strategy.version} Doc</span>
          </button>

          <button
            onClick={handleRunRankAI}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-semibold shadow-2xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Rank with AI (Maker & Checker)</span>
          </button>
        </div>
      </div>

      {/* Stale Rankings Alert Banner */}
      {staleRankingsWarning && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Strategy updated:</strong> Existing priority scores were generated under Strategy v
              {strategy.version - 1}. Rankings are flagged as "Needs Recheck".
            </span>
          </div>
          <button
            onClick={handleRunRankAI}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            Recheck with AI
          </button>
        </div>
      )}

      {/* Formula & Explainability Callout */}
      <div className="bg-[#fbfaf7] p-3.5 rounded-xl border border-stone-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono px-2 py-1 bg-white border border-stone-300 rounded font-semibold text-stone-900">
            Score = (Reach × Impact × Confidence) / Effort
          </span>
          <span className="text-stone-500 hidden lg:inline">
            • Reach: affected accounts/qtr • Impact: 0.5 - 3x • Confidence: 0-1 • Effort: person-weeks (&gt;0)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
          <Info className="w-3.5 h-3.5 text-purple-600" />
          <span>All quantitative inputs are marked assumptions, grounded in source signals.</span>
        </div>
      </div>

      {/* Backlog Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Opportunity</th>
                <th className="py-3 px-3">Evidence</th>
                <th
                  onClick={() => handleSort('reach')}
                  className="py-3 px-3 cursor-pointer hover:text-stone-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Reach</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th className="py-3 px-2">Impact</th>
                <th
                  onClick={() => handleSort('confidence')}
                  className="py-3 px-2 cursor-pointer hover:text-stone-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Conf.</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('effort')}
                  className="py-3 px-3 cursor-pointer hover:text-stone-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Effort</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('score')}
                  className="py-3 px-3 cursor-pointer hover:text-stone-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Gate Check</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {sortedOpportunities.map((opp, idx) => {
                const isFailed = opp.checkerStatus === 'Failed';
                const isNeedsRecheck = opp.checkerStatus === 'Needs Recheck';

                return (
                  <tr
                    key={opp.id}
                    className={`hover:bg-stone-50/60 transition-colors ${
                      isFailed ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-stone-700">
                          {opp.id}
                        </span>
                        {opp.rankingOverride && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] bg-lime-100 text-lime-900 font-semibold border border-lime-300"
                            title={`Overridden to #${opp.rankingOverride.rank} by ${opp.rankingOverride.overriddenBy}: "${opp.rankingOverride.reason}"`}
                          >
                            Overridden #{opp.rankingOverride.rank}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-stone-900 mt-0.5">{opp.title}</div>
                      <div className="text-[11px] text-stone-500 truncate" title={opp.problemStatement}>
                        {opp.problemStatement}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        onClick={() => openInspector('opportunity', opp.id)}
                        className="text-purple-700 hover:text-purple-900 font-medium underline"
                      >
                        {opp.linkedSignalIds.length} signals
                      </button>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span>{opp.reach}</span>
                      <span className="text-[10px] text-stone-400 block">accs</span>
                    </td>

                    <td className="py-3 px-2 font-mono font-medium">{opp.impact}x</td>

                    <td className="py-3 px-2 font-mono text-stone-600">
                      {Math.round(opp.confidence * 100)}%
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span>{opp.effort}w</span>
                      <span className="text-[10px] text-stone-400 block">weeks</span>
                    </td>

                    <td className="py-3 px-3 font-bold text-sm text-purple-700 font-mono">
                      {opp.score}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          opp.checkerStatus === 'Passed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : isFailed
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : isNeedsRecheck
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                        title={opp.checkerNotes}
                      >
                        {opp.checkerStatus === 'Passed' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        <span>{opp.checkerStatus}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700 border border-stone-200">
                        {opp.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setOverrideOpp(opp);
                            setOverrideRank(idx + 1);
                          }}
                          className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium"
                          title="Override ranking with recorded reason"
                        >
                          Override
                        </button>

                        <button
                          onClick={() => {
                            if (opp.id === 'OPP-201') {
                              setActiveView('solutions');
                            } else {
                              openInspector('opportunity', opp.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-medium"
                        >
                          {opp.id === 'OPP-201' ? 'Explore Solutions' : 'Inspect'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal */}
      {overrideOpp && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-5 text-stone-900 text-xs">
            <h3 className="font-semibold text-sm mb-1">
              Manual Ranking Override for {overrideOpp.id}
            </h3>
            <p className="text-stone-600 text-xs mb-3">
              Overrides require an explicit rationale to maintain accountability and trace history.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Target Rank Position</label>
                <input
                  type="number"
                  min="1"
                  max={opportunities.length}
                  value={overrideRank}
                  onChange={(e) => setOverrideRank(parseInt(e.target.value, 10))}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Required Rationale (Explain why human judgment overrides the quantitative score)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="E.g. Critical prerequisite for upcoming major marketing launch..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideOpp(null)}
                  className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium"
                >
                  Record Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Strategy Doc Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full p-6 text-stone-900 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div>
                <span className="text-[10px] font-mono text-purple-700 font-bold uppercase">
                  Versioned Strategy Document
                </span>
                <h3 className="font-semibold text-sm">{editingStrategy.title}</h3>
              </div>
              <button
                onClick={() => setShowStrategyModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStrategy} className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Target Customers</label>
                <textarea
                  rows={2}
                  value={editingStrategy.targetCustomers}
                  onChange={(e) =>
                    setEditingStrategy({ ...editingStrategy, targetCustomers: e.target.value })
                  }
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Current Objectives (one per line)
                </label>
                <textarea
                  rows={3}
                  value={editingStrategy.currentObjectives.join('\n')}
                  onChange={(e) =>
                    setEditingStrategy({
                      ...editingStrategy,
                      currentObjectives: e.target.value.split('\n').filter((l) => l.trim()),
                    })
                  }
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-red-800 mb-1 font-semibold">
                  Explicit Non-Goals (Gate checks enforce these strictly!)
                </label>
                <textarea
                  rows={3}
                  value={editingStrategy.explicitNonGoals.join('\n')}
                  onChange={(e) =>
                    setEditingStrategy({
                      ...editingStrategy,
                      explicitNonGoals: e.target.value.split('\n').filter((l) => l.trim()),
                    })
                  }
                  className="w-full text-xs p-2 border border-red-200 rounded-lg bg-red-50/30 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Change Summary</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Clarified enterprise customization non-goals for Q4"
                  value={strategyChangeSummary}
                  onChange={(e) => setStrategyChangeSummary(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-snug">
                <strong>Notice:</strong> Saving changes will increment strategy to v
                {strategy.version + 1} and flag all existing opportunity scores as "Needs Recheck".
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStrategyModal(false)}
                  className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium"
                >
                  Save as Version {strategy.version + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Rank Proposal Side-by-Side Modal */}
      {showRankModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-4xl w-full p-6 text-stone-900 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-sm">
                  AI Prioritization Run: Maker Proposal & Independent Checker Findings
                </h3>
              </div>
              <button onClick={() => setShowRankModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {rankRunning ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-xs text-stone-600 font-medium">
                  Running Maker proposal and independent Strategy Gate Checker...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Maker Column */}
                  <div className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-200 space-y-3">
                    <div className="font-bold text-xs text-purple-900 flex items-center justify-between">
                      <span>Maker Proposed Scores</span>
                      <span className="text-[10px] text-purple-700 font-mono">Formula Checked</span>
                    </div>

                    <p className="text-[11px] text-stone-600">
                      {rankProposal?.makerSummary || 'Proposed quantitative RICE scores for backlog.'}
                    </p>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {rankProposal?.proposedRankings?.map((r: any) => (
                        <div key={r.opportunityId} className="p-2 bg-white rounded border border-purple-100 text-[11px]">
                          <div className="flex justify-between font-semibold text-stone-900">
                            <span>{r.opportunityId}</span>
                            <span className="text-purple-700">Score {r.priorityScore}</span>
                          </div>
                          <div className="text-stone-600 mt-0.5">{r.tradeOffRationale}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checker Column */}
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
                      <span>Checker Gate Audit</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          checkerFindings?.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {checkerFindings?.passed ? 'Passed Gate' : 'Gate Failed'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-stone-700">
                      {checkerFindings?.findings?.map((f: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    {checkerFindings?.strategyViolations?.length > 0 && (
                      <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-800 text-[11px]">
                        <strong>Detected Strategy Violations:</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          {checkerFindings.strategyViolations.map((v: string, i: number) => (
                            <li key={i}>{v}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-stone-100/70 border border-stone-200 rounded-xl text-stone-600 text-[11px]">
                  <strong>User Acceptance Required:</strong> The backlog will not be modified until you
                  explicitly click "Accept Proposal".
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => setShowRankModal(false)}
                    className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                  >
                    Reject Proposal
                  </button>
                  <button
                    onClick={handleAcceptProposal}
                    className="px-4 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-semibold"
                  >
                    Accept & Apply AI Rankings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
