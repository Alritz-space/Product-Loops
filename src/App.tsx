import React from 'react';
import { WorkspaceProvider, useWorkspace, ViewType } from './context/WorkspaceContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { EvidenceInspectorModal } from './components/common/EvidenceInspectorModal';
import { OverviewView } from './views/OverviewView';
import { SignalsView } from './views/SignalsView';
import { PrioritiesView } from './views/PrioritiesView';
import { SolutionLabView } from './views/SolutionLabView';
import { DecisionsView } from './views/DecisionsView';
import { DeliveryOutcomesView } from './views/DeliveryOutcomesView';
import { LoopsStrategyView } from './views/LoopsStrategyView';
import { EvalsView } from './views/EvalsView';
import {
  LayoutDashboard,
  Radio,
  Sliders,
  FlaskConical,
  Scale,
  Rocket,
  Repeat,
  ShieldCheck,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeView, setActiveView } = useWorkspace();

  const mobileNavItems: Array<{ id: ViewType; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'signals', label: 'Signals', icon: <Radio className="w-4 h-4" /> },
    { id: 'priorities', label: 'Rank', icon: <Sliders className="w-4 h-4" /> },
    { id: 'solutions', label: 'Explore', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'decisions', label: 'Decide', icon: <Scale className="w-4 h-4" /> },
    { id: 'delivery', label: 'Deliver', icon: <Rocket className="w-4 h-4" /> },
    { id: 'loops', label: 'Loops', icon: <Repeat className="w-4 h-4" /> },
    { id: 'evals', label: 'Evals & Guardrails', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-900 flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* Top Header */}
      <TopBar />

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden bg-stone-100/90 border-b border-stone-200 overflow-x-auto px-3 py-1.5 flex items-center gap-1 shrink-0 z-20">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeView === item.id
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Desktop Navigation */}
        <Sidebar />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeView === 'overview' && <OverviewView />}
          {activeView === 'signals' && <SignalsView />}
          {activeView === 'priorities' && <PrioritiesView />}
          {activeView === 'solutions' && <SolutionLabView />}
          {activeView === 'decisions' && <DecisionsView />}
          {activeView === 'delivery' && <DeliveryOutcomesView />}
          {activeView === 'loops' && <LoopsStrategyView />}
          {activeView === 'evals' && <EvalsView />}
        </main>
      </div>

      {/* Evidence Trace Inspector Modal */}
      <EvidenceInspectorModal />
    </div>
  );
};

export default function App() {
  return (
    <WorkspaceProvider>
      <MainContent />
    </WorkspaceProvider>
  );
}
