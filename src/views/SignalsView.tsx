import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Signal, SignalCategory, SignalStatus } from '../types';
import {
  Radio,
  Plus,
  Filter,
  Search,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  Trash2,
  ExternalLink,
  MessageSquare,
  TrendingDown,
  Building,
  UserCheck,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  Check,
  X,
} from 'lucide-react';

export const SignalsView: React.FC = () => {
  const {
    signals,
    opportunities,
    addSignal,
    editSignal,
    dismissSignal,
    linkSignalToOpportunity,
    createOpportunityFromSignals,
    runSignalDigest,
    openInspector,
  } = useWorkspace();

  const [activeCategory, setActiveCategory] = useState<SignalCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateOppModal, setShowCreateOppModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetOppId, setTargetOppId] = useState(opportunities[0]?.id || '');
  const [digestRunning, setDigestRunning] = useState(false);
  const [digestResult, setDigestResult] = useState<any>(null);

  // Add signal form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SignalCategory>('feedback_digest');
  const [newSourceType, setNewSourceType] = useState('Intercom Support Ticket');
  const [newCustomerSegment, setNewCustomerSegment] = useState('');
  const [newSourceText, setNewSourceText] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newInferred, setNewInferred] = useState('');
  const [newImpact, setNewImpact] = useState<'High' | 'Medium' | 'Low'>('High');

  // Create Opp from Selected form
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppProblem, setNewOppProblem] = useState('');
  const [newOppReach, setNewOppReach] = useState(2500);
  const [newOppImpact, setNewOppImpact] = useState<0.5 | 1 | 2 | 3>(2);
  const [newOppConfidence, setNewOppConfidence] = useState(0.8);
  const [newOppEffort, setNewOppEffort] = useState(2);

  const categories: Array<{ id: SignalCategory | 'all'; label: string; count: number }> = [
    { id: 'all', label: 'All Signals', count: signals.length },
    {
      id: 'feedback_digest',
      label: 'Feedback Digest',
      count: signals.filter((s) => s.category === 'feedback_digest').length,
    },
    {
      id: 'deal_intel',
      label: 'Deal Intel',
      count: signals.filter((s) => s.category === 'deal_intel').length,
    },
    {
      id: 'competitive_brief',
      label: 'Competitive Brief',
      count: signals.filter((s) => s.category === 'competitive_brief').length,
    },
    {
      id: 'metric_anomaly',
      label: 'Metric Anomalies',
      count: signals.filter((s) => s.category === 'metric_anomaly').length,
    },
    {
      id: 'onboarding_friction',
      label: 'Onboarding Friction',
      count: signals.filter((s) => s.category === 'onboarding_friction').length,
    },
    {
      id: 'call_candidate',
      label: 'Customer Call Candidates',
      count: signals.filter((s) => s.category === 'call_candidate').length,
    },
  ];

  const filteredSignals = signals.filter((s) => {
    if (activeCategory !== 'all' && s.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.customerSegment.toLowerCase().includes(q) ||
        s.originalSourceText.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelectSignal = (id: string) => {
    setSelectedSignalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSignalIds.length === filteredSignals.length) {
      setSelectedSignalIds([]);
    } else {
      setSelectedSignalIds(filteredSignals.map((s) => s.id));
    }
  };

  const handleAddSignalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSourceText.trim()) return;

    addSignal({
      title: newTitle,
      category: newCategory,
      sourceType: newSourceType,
      sourceTag: 'Demo data',
      originalSourceText: newSourceText,
      customerSegment: newCustomerSegment || 'Self-serve workspace',
      observedDate: new Date().toISOString().split('T')[0],
      summary: newSummary || newTitle,
      inferredExplanation: newInferred || 'Observed directly from customer interaction.',
      impact: newImpact,
      evidenceReference: `Manual-${Date.now().toString().slice(-4)}`,
      evidenceQuality: 'High',
      missingContext: 'Recently submitted entry.',
      status: 'New',
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewSourceText('');
    setNewSummary('');
    setNewInferred('');
    setNewCustomerSegment('');
  };

  const handleCreateOppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppTitle.trim()) return;

    createOpportunityFromSignals(
      newOppTitle,
      selectedSignalIds,
      newOppProblem || 'Problem identified from selected signals.',
      newOppReach,
      newOppImpact,
      newOppConfidence,
      newOppEffort
    );

    setSelectedSignalIds([]);
    setShowCreateOppModal(false);
    setNewOppTitle('');
    setNewOppProblem('');
  };

  const handleLinkSubmit = () => {
    if (!targetOppId) return;
    selectedSignalIds.forEach((id) => {
      linkSignalToOpportunity(id, targetOppId);
    });
    setSelectedSignalIds([]);
    setShowLinkModal(false);
  };

  const handleRunDigest = async () => {
    setDigestRunning(true);
    const res = await runSignalDigest();
    setDigestResult(res);
    setDigestRunning(false);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Stage 1: Gather
            </span>
            <span className="text-xs text-stone-500">6 Continuous Signal Inboxes</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Signals Inbox</h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Ingest raw customer tickets, deal win/loss notes, competitor releases, metric anomalies,
            and behavioral outliers. Grounding is strictly separated between observations and inferences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunDigest}
            disabled={digestRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold shadow-2xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{digestRunning ? 'Clustering...' : 'Run Signal Digest'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Signal</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-stone-900 text-white shadow-xs font-semibold'
                : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === cat.id ? 'bg-stone-700 text-stone-200' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Batch Action Bar */}
      <div className="bg-white p-3 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search signals, quotes, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {/* Batch operations */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedSignalIds.length > 0 && selectedSignalIds.length === filteredSignals.length}
              onChange={handleSelectAll}
              className="rounded text-purple-600 focus:ring-purple-400"
            />
            <span>Select All ({selectedSignalIds.length})</span>
          </label>

          {selectedSignalIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-medium"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Link ({selectedSignalIds.length})</span>
              </button>

              <button
                onClick={() => setShowCreateOppModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-xs font-medium shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Opportunity</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Signals List / Cards */}
      <div className="space-y-3">
        {filteredSignals.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-xs text-stone-500">
            No signals found matching your filter or query.
          </div>
        ) : (
          filteredSignals.map((signal) => {
            const isSelected = selectedSignalIds.includes(signal.id);
            const isCallCandidate = signal.category === 'call_candidate';

            return (
              <div
                key={signal.id}
                className={`bg-white rounded-xl border transition-all p-4 shadow-2xs ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-100'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectSignal(signal.id)}
                      className="mt-1 rounded text-purple-600 focus:ring-purple-400 cursor-pointer"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-stone-800">
                          {signal.id}
                        </span>
                        <h3 className="font-semibold text-stone-900 text-sm">{signal.title}</h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600 border border-stone-200">
                          {signal.sourceType}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                          {signal.sourceTag}
                        </span>
                        {signal.isOutcomeLearningSignal && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-900 font-semibold border border-orange-200">
                            Learning Signal
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-3">
                        <span>Segment: <strong>{signal.customerSegment}</strong></span>
                        <span>Observed: {signal.observedDate}</span>
                        <span>Impact: <strong className="text-purple-700">{signal.impact}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openInspector('signal', signal.id)}
                      className="p-1 text-stone-400 hover:text-purple-700 hover:bg-stone-50 rounded"
                      title="Inspect Connected Evidence Chain"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    {signal.status !== 'Dismissed' && (
                      <button
                        onClick={() => dismissSignal(signal.id)}
                        className="p-1 text-stone-400 hover:text-red-600 hover:bg-stone-50 rounded"
                        title="Dismiss Signal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Factual Observation text */}
                <div className="bg-[#fcfbf7] p-3 rounded-lg border border-stone-200 text-xs font-serif text-stone-800 italic leading-relaxed mb-3">
                  "{signal.originalSourceText}"
                </div>

                {/* Grounding Split: Factual Observation vs Inferred Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Factual Summary
                    </div>
                    <div className="text-stone-800 leading-snug">{signal.summary}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 mb-1">
                      Inferred Explanation (Hypothesis)
                    </div>
                    <div className="text-stone-800 leading-snug">{signal.inferredExplanation}</div>
                  </div>
                </div>

                {/* Call Candidate Details */}
                {isCallCandidate && signal.interviewValueReason && (
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs mb-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                      <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                      <span>Why a Conversation Would Help (Do not contact automatically):</span>
                    </div>
                    <p className="text-amber-800">{signal.interviewValueReason}</p>

                    {signal.suggestedQuestions && (
                      <div>
                        <span className="text-[11px] font-bold text-amber-900">
                          Suggested Interview Discovery Questions:
                        </span>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-amber-800">
                          {signal.suggestedQuestions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer linking info */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <span>
                      Evidence Quality: <strong>{signal.evidenceQuality}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Missing Context: <em>{signal.missingContext}</em>
                    </span>
                  </div>

                  {signal.linkedOpportunityId ? (
                    <button
                      onClick={() => openInspector('opportunity', signal.linkedOpportunityId!)}
                      className="text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1"
                    >
                      <span>Linked to {signal.linkedOpportunityId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-stone-400">Not linked to opportunity</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Signal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-5 text-stone-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-semibold text-sm">Add New Signal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSignalSubmit} className="space-y-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Signal Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Users asking for CSV board export"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SignalCategory)}
                    className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50"
                  >
                    <option value="feedback_digest">Feedback Digest</option>
                    <option value="deal_intel">Deal Intelligence</option>
                    <option value="competitive_brief">Competitive Brief</option>
                    <option value="metric_anomaly">Metric Anomaly</option>
                    <option value="onboarding_friction">Onboarding Friction</option>
                    <option value="call_candidate">Customer Call Candidate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Source Type</label>
                  <input
                    type="text"
                    placeholder="E.g. Intercom #5102"
                    value={newSourceType}
                    onChange={(e) => setNewSourceType(e.target.value)}
                    className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Customer / Segment</label>
                <input
                  type="text"
                  placeholder="E.g. Acme Agency (8 seats)"
                  value={newCustomerSegment}
                  onChange={(e) => setNewCustomerSegment(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Original Source Text or Raw Metric Observation
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Paste raw customer quote or exact metrics..."
                  value={newSourceText}
                  onChange={(e) => setNewSourceText(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white font-serif"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Inferred Explanation (Hypothesis)
                </label>
                <textarea
                  rows={2}
                  placeholder="Why is this happening and what opportunity does it indicate?"
                  value={newInferred}
                  onChange={(e) => setNewInferred(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium"
                >
                  Save Signal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link to Opportunity Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-5 text-stone-900 text-xs">
            <h3 className="font-semibold text-sm mb-2">
              Link {selectedSignalIds.length} Signals to Opportunity
            </h3>
            <p className="text-stone-600 text-xs mb-3">
              Select an existing opportunity to attach these supporting evidence signals to:
            </p>
            <select
              value={targetOppId}
              onChange={(e) => setTargetOppId(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-stone-50 mb-4"
            >
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.id}: {opp.title} (Score: {opp.score})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkSubmit}
                className="px-4 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium"
              >
                Link Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Opportunity From Selected Signals Modal */}
      {showCreateOppModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-5 text-stone-900 text-xs">
            <h3 className="font-semibold text-sm mb-2">
              Create Opportunity from {selectedSignalIds.length} Signals
            </h3>
            <p className="text-stone-600 text-xs mb-3">
              Synthesize these signals into a prioritized problem statement:
            </p>

            <form onSubmit={handleCreateOppSubmit} className="space-y-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Opportunity Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. In-app Export & Executive Snapshots"
                  value={newOppTitle}
                  onChange={(e) => setNewOppTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Problem Statement</label>
                <textarea
                  rows={2}
                  required
                  placeholder="What friction do users experience and what value is lost?"
                  value={newOppProblem}
                  onChange={(e) => setNewOppProblem(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-medium text-stone-700 mb-1 text-[10px]">Reach (accs/qtr)</label>
                  <input
                    type="number"
                    value={newOppReach}
                    onChange={(e) => setNewOppReach(parseInt(e.target.value, 10))}
                    className="w-full text-xs p-1.5 border border-stone-200 rounded bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1 text-[10px]">Impact (0.5 - 3)</label>
                  <select
                    value={newOppImpact}
                    onChange={(e) => setNewOppImpact(parseFloat(e.target.value) as any)}
                    className="w-full text-xs p-1.5 border border-stone-200 rounded bg-stone-50"
                  >
                    <option value="0.5">0.5 (Low)</option>
                    <option value="1">1.0 (Med)</option>
                    <option value="2">2.0 (High)</option>
                    <option value="3">3.0 (Crit)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1 text-[10px]">Confidence (0-1)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1"
                    value={newOppConfidence}
                    onChange={(e) => setNewOppConfidence(parseFloat(e.target.value))}
                    className="w-full text-xs p-1.5 border border-stone-200 rounded bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1 text-[10px]">Effort (weeks)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newOppEffort}
                    onChange={(e) => setNewOppEffort(parseFloat(e.target.value))}
                    className="w-full text-xs p-1.5 border border-stone-200 rounded bg-stone-50"
                  />
                </div>
              </div>

              <div className="p-2 rounded bg-purple-50 text-purple-900 border border-purple-200 text-center font-semibold">
                Priority Score = ({newOppReach} × {newOppImpact} × {newOppConfidence}) / {newOppEffort} ={' '}
                {((newOppReach * newOppImpact * newOppConfidence) / Math.max(newOppEffort, 0.1)).toFixed(1)}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOppModal(false)}
                  className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium"
                >
                  Save Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signal Digest Result Modal */}
      {digestResult && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full p-6 text-stone-900 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-sm">Signal Digest Output & Checker Gate</h3>
              </div>
              <button onClick={() => setDigestResult(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Maker Column */}
              <div className="space-y-3 p-3 bg-purple-50/40 rounded-xl border border-purple-200">
                <div className="font-bold text-purple-900 text-xs">
                  Maker: Clustered Observations ({digestResult.maker?.clusters?.length || 3} clusters)
                </div>
                {digestResult.maker?.clusters?.map((c: any, i: number) => (
                  <div key={i} className="p-2.5 bg-white rounded-lg border border-purple-100 text-xs">
                    <div className="font-semibold text-purple-950 mb-1">{c.clusterName}</div>
                    <div className="text-[11px] text-stone-700 mb-1">{c.coreObservation}</div>
                    <div className="text-[10px] text-purple-700 font-mono">
                      IDs: {c.sourceSignalIds?.join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Checker Column */}
              <div className="space-y-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between font-bold text-stone-900 text-xs">
                  <span>Checker Evaluation</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Passed Gate
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-stone-700">
                  {digestResult.checker?.findings?.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setDigestResult(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-medium"
              >
                Close Digest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
