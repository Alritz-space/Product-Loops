import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SolutionConcept } from '../types';
import { WireframePreview } from '../components/wireframes/WireframePreview';
import {
  FlaskConical,
  Sparkles,
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Scale,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

export const SolutionLabView: React.FC = () => {
  const {
    opportunities,
    solutionConcepts,
    syntheticReviews,
    runSyntheticReview,
    updateShortlist,
    generateSolutionConcepts,
    setActiveView,
    setRole,
    openInspector,
  } = useWorkspace();

  const [selectedOppId, setSelectedOppId] = useState('OPP-201');
  const [activeConceptModal, setActiveConceptModal] = useState<SolutionConcept | null>(null);
  const [wireframeModalConcept, setWireframeModalConcept] = useState<SolutionConcept | null>(null);

  // Shortlist edit state
  const [isEditingShortlist, setIsEditingShortlist] = useState(false);
  const [selectedShortlistIds, setSelectedShortlistIds] = useState<string[]>(['SOL-301', 'SOL-302']);
  const [shortlistRationale, setShortlistRationale] = useState('');
  const [isSyntheticRunning, setIsSyntheticRunning] = useState(false);

  const selectedOpp = opportunities.find((o) => o.id === selectedOppId) || opportunities[0];
  const currentConcepts = solutionConcepts.filter((c) => c.opportunityId === selectedOppId);
  const currentSyntheticReview = syntheticReviews[selectedOppId];

  const handleGenerateConcepts = async () => {
    await generateSolutionConcepts(selectedOppId);
  };

  const handleRunSyntheticReview = async () => {
    setIsSyntheticRunning(true);
    await runSyntheticReview(selectedOppId);
    setIsSyntheticRunning(false);
  };

  const handleToggleShortlist = (id: string) => {
    if (selectedShortlistIds.includes(id)) {
      setSelectedShortlistIds(selectedShortlistIds.filter((item) => item !== id));
    } else {
      if (selectedShortlistIds.length >= 2) {
        alert('You may only select 2 concepts for the decision shortlist.');
        return;
      }
      setSelectedShortlistIds([...selectedShortlistIds, id]);
    }
  };

  const handleSaveShortlist = () => {
    if (selectedShortlistIds.length !== 2) {
      alert('Please select exactly 2 concepts for the shortlist.');
      return;
    }
    updateShortlist(
      selectedOppId,
      selectedShortlistIds,
      shortlistRationale || 'PM curated shortlist following synthetic review.'
    );
    setIsEditingShortlist(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white">
              Stage 3: Explore
            </span>
            <span className="text-xs text-stone-500">Divergent Concepts & Synthetic Personas</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Solution Lab</h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Explore 5 architecturally distinct solutions for the prioritized opportunity. Simulated personas
            stress-test feasibility, usability, and strategic fit before human authorization.
          </p>
        </div>

        {/* Opportunity Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500 font-medium">Opportunity:</label>
          <select
            value={selectedOppId}
            onChange={(e) => setSelectedOppId(e.target.value)}
            className="text-xs px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 font-semibold text-stone-800"
          >
            {opportunities
              .filter((o) => o.checkerStatus !== 'Failed')
              .map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.id}: {opp.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Selected Opportunity Context Card */}
      <div className="bg-[#fbfaf7] p-4 rounded-xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {selectedOpp.id}
            </span>
            <h2 className="font-semibold text-sm text-stone-900">{selectedOpp.title}</h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">{selectedOpp.problemStatement}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunSyntheticReview}
            disabled={isSyntheticRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{isSyntheticRunning ? 'Simulating...' : 'Run Synthetic Review'}</span>
          </button>

          <button
            onClick={() => {
              setRole('lead');
              setActiveView('decisions');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-lime-600 text-stone-900 hover:bg-lime-500 text-xs font-semibold shadow-2xs"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Proceed to Decision</span>
          </button>
        </div>
      </div>

      {/* Synthetic Review Section */}
      {currentSyntheticReview && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  Synthetic Persona Review
                </h3>
              </div>
              <div className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                {currentSyntheticReview.disclaimer}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <div>
                Usefulness: <strong className="text-stone-900">{currentSyntheticReview.criteria.usefulness}/10</strong>
              </div>
              <div>
                Usability: <strong className="text-stone-900">{currentSyntheticReview.criteria.usability}/10</strong>
              </div>
              <div>
                Strategy Fit: <strong className="text-purple-700">{currentSyntheticReview.criteria.strategyAlignment}/10</strong>
              </div>
            </div>
          </div>

          {/* 3 Explicit Simulated Perspectives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* New User */}
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">1. New User Persona</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  {currentSyntheticReview.perspectives.newUser.sentiment}
                </span>
              </div>
              <p className="text-stone-700 leading-snug">{currentSyntheticReview.perspectives.newUser.comments}</p>
              <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                Friction Alert: {currentSyntheticReview.perspectives.newUser.alerts[0]}
              </div>
            </div>

            {/* Experienced User */}
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">2. Experienced User Persona</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-semibold">
                  {currentSyntheticReview.perspectives.experiencedUser.sentiment}
                </span>
              </div>
              <p className="text-stone-700 leading-snug">{currentSyntheticReview.perspectives.experiencedUser.comments}</p>
              <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                Efficiency Note: {currentSyntheticReview.perspectives.experiencedUser.notes}
              </div>
            </div>

            {/* Admin / Buyer */}
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">3. Admin / Buyer Persona</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  {currentSyntheticReview.perspectives.adminBuyer.sentiment}
                </span>
              </div>
              <p className="text-stone-700 leading-snug">{currentSyntheticReview.perspectives.adminBuyer.comments}</p>
              <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                Cost/Security: {currentSyntheticReview.perspectives.adminBuyer.alerts[0]}
              </div>
            </div>
          </div>

          {/* Persona Disagreements & Recommended Shortlist */}
          <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-purple-950 mb-0.5">
                Recommended Shortlist: Concept 1 (Checklist) & Concept 2 (Wizard)
              </div>
              <p className="text-stone-700 leading-snug">{currentSyntheticReview.recommendationReasoning}</p>
            </div>

            <button
              onClick={() => {
                setSelectedShortlistIds(
                  currentConcepts.filter((c) => c.isShortlisted).map((c) => c.id)
                );
                setIsEditingShortlist(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-purple-300 text-purple-900 hover:bg-purple-50 font-semibold text-xs shrink-0 shadow-2xs"
            >
              Modify Shortlist (PM)
            </button>
          </div>
        </div>
      )}

      {/* 5 Solution Concept Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-600">
            5 Distinct Architectural Approaches
          </h3>
          <span className="text-[11px] text-stone-500">
            {currentConcepts.filter((c) => c.isShortlisted).length} of 2 shortlisted for Product Lead decision
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentConcepts.map((concept) => (
            <div
              key={concept.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                concept.isShortlisted
                  ? 'border-lime-500 ring-2 ring-lime-100'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-stone-700">
                    Concept #{concept.conceptNumber} ({concept.id})
                  </span>
                  {concept.isShortlisted ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-lime-100 text-lime-900 font-semibold border border-lime-300 flex items-center gap-1">
                      <Check className="w-3 h-3 text-lime-700" />
                      Shortlisted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-500">
                      Explored
                    </span>
                  )}
                </div>

                <h4 className="font-semibold text-sm text-stone-900 mb-2 leading-snug">
                  {concept.title}
                </h4>

                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs text-stone-700 leading-snug mb-3">
                  {concept.approach}
                </div>

                <div className="space-y-2 text-xs text-stone-600">
                  <div>
                    <span className="font-bold text-stone-800 block text-[11px]">User Journey:</span>
                    <span className="text-[11px] leading-tight line-clamp-3">{concept.userJourney}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-100">
                    <span>
                      Effort: <strong>{concept.effortWeeks} weeks</strong>
                    </span>
                    <span>
                      Risk: <strong className="text-amber-800">{concept.risks[0]}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setWireframeModalConcept(concept)}
                  className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-medium text-stone-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-600" />
                  <span>Preview Wireframe</span>
                </button>

                <button
                  onClick={() => setActiveConceptModal(concept)}
                  className="py-1.5 px-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg text-xs text-stone-600 border border-stone-200"
                  title="View full specs"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modify Shortlist Modal */}
      {isEditingShortlist && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 text-stone-900 text-xs">
            <h3 className="font-semibold text-sm mb-1">Modify Decision Shortlist (Select exactly 2)</h3>
            <p className="text-stone-600 text-xs mb-3">
              The Product Lead will evaluate these 2 candidates side-by-side. Record your PM curation rationale.
            </p>

            <div className="space-y-2 mb-4">
              {currentConcepts.map((c) => {
                const isSelected = selectedShortlistIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleShortlist(c.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-lime-500 bg-lime-50/60 font-semibold'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs text-stone-900">
                        {c.id}: {c.title}
                      </div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Effort: {c.effortWeeks}w • Type: {c.wireframeType}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-lime-700" />}
                  </div>
                );
              })}
            </div>

            <div className="mb-4">
              <label className="block font-medium text-stone-700 mb-1">
                PM Shortlist Selection Rationale (Required)
              </label>
              <textarea
                rows={2}
                required
                placeholder="Why are these two specific concepts being advanced to the Product Lead?"
                value={shortlistRationale}
                onChange={(e) => setShortlistRationale(e.target.value)}
                className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingShortlist(false)}
                className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShortlist}
                className="px-4 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-semibold"
              >
                Update Shortlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wireframe Interactive Preview Modal */}
      {wireframeModalConcept && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-4xl w-full p-5 text-stone-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div>
                <span className="text-[10px] font-mono text-purple-700 font-bold uppercase">
                  Interactive Clickable Wireframe Preview
                </span>
                <h3 className="font-semibold text-sm">
                  {wireframeModalConcept.id}: {wireframeModalConcept.title}
                </h3>
              </div>
              <button
                onClick={() => setWireframeModalConcept(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <WireframePreview
              wireframeType={wireframeModalConcept.wireframeType}
              conceptTitle={wireframeModalConcept.title}
            />

            <div className="flex justify-between items-center pt-3 mt-3 border-t border-stone-100 text-[11px] text-stone-500">
              <span>Built using safe, predefined UI components. Zero untrusted code execution.</span>
              <button
                onClick={() => setWireframeModalConcept(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Concept Details Modal */}
      {activeConceptModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full p-6 text-stone-900 text-xs max-h-[85vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-semibold text-sm">
                {activeConceptModal.id}: {activeConceptModal.title}
              </h3>
              <button onClick={() => setActiveConceptModal(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="font-bold text-stone-800 text-[11px] uppercase mb-1">Approach</div>
              <p className="text-stone-700">{activeConceptModal.approach}</p>
            </div>

            <div>
              <div className="font-bold text-stone-800 text-[11px] uppercase mb-1">User Journey</div>
              <p className="text-stone-700">{activeConceptModal.userJourney}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                <div className="font-bold text-stone-800 text-[10px] uppercase mb-1">Assumptions</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-stone-600">
                  {activeConceptModal.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
              <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                <div className="font-bold text-stone-800 text-[10px] uppercase mb-1">Dependencies</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-stone-600">
                  {activeConceptModal.dependencies.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-2.5 bg-purple-50 rounded border border-purple-200">
              <div className="font-bold text-purple-900 text-[10px] uppercase mb-1">Smallest Experiment</div>
              <p className="text-purple-800 text-xs">{activeConceptModal.smallestExperiment}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveConceptModal(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
