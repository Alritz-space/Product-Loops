import React from 'react';
import { useWorkspace, ViewType } from '../../context/WorkspaceContext';
import {
  LayoutDashboard,
  Radio,
  Sliders,
  FlaskConical,
  Scale,
  Rocket,
  Repeat,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  id: ViewType;
  label: string;
  stageName: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    signals,
    opportunities,
    releaseOutcomes,
    reviewQueue,
    evalMetrics,
    isAiPaused,
  } = useWorkspace();

  const newSignalsCount = signals.filter((s) => s.status === 'New').length;
  const failedCheckCount = opportunities.filter((o) => o.checkerStatus === 'Failed').length;
  const activeRegressions = releaseOutcomes.filter((r) => r.guardrailRegressions.length > 0).length;
  const pendingReviewCount = reviewQueue.filter((r) => r.status === 'Pending').length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      stageName: 'Workflow & Queues',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'signals',
      label: 'Signals',
      stageName: '1. Gather',
      icon: <Radio className="w-4 h-4" />,
      badge: newSignalsCount > 0 ? newSignalsCount : undefined,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'priorities',
      label: 'Priorities',
      stageName: '2. Rank',
      icon: <Sliders className="w-4 h-4" />,
      badge: failedCheckCount > 0 ? '1 Failed' : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'solutions',
      label: 'Solution Lab',
      stageName: '3. Explore',
      icon: <FlaskConical className="w-4 h-4" />,
      badge: '5 Concepts',
      badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
    },
    {
      id: 'decisions',
      label: 'Decisions',
      stageName: '4. Decide',
      icon: <Scale className="w-4 h-4" />,
      badge: '1 Ready',
      badgeColor: 'bg-lime-100 text-lime-900 border-lime-300 font-semibold',
    },
    {
      id: 'delivery',
      label: 'Delivery & Outcomes',
      stageName: '5. Deliver & Learn',
      icon: <Rocket className="w-4 h-4" />,
      badge: activeRegressions > 0 ? 'Regressed' : undefined,
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200 font-semibold',
    },
    {
      id: 'loops',
      label: 'Loops & Strategy',
      stageName: 'Governance',
      icon: <Repeat className="w-4 h-4" />,
      badge: '10 Loops',
      badgeColor: 'bg-stone-100 text-stone-600',
    },
    {
      id: 'evals',
      label: 'Evals & Guardrails',
      stageName: 'Safety & Quality',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: isAiPaused
        ? 'PAUSED'
        : pendingReviewCount > 0
        ? `${pendingReviewCount} Flagged`
        : `${evalMetrics?.overallPassRate ?? 95}% Pass`,
      badgeColor: isAiPaused
        ? 'bg-red-100 text-red-800 border-red-300 font-bold'
        : pendingReviewCount > 0
        ? 'bg-amber-100 text-amber-800 border-amber-200 font-semibold'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-mono',
    },
  ];

  return (
    <aside className="w-64 border-r border-stone-200 bg-[#f7f6f0] shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-3">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-600">
          Agent-Assisted Cycle
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`${
                      isActive ? 'text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="truncate">
                    <span className="block leading-tight">{item.label}</span>
                    <span className="text-[10px] text-stone-500 block">{item.stageName}</span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-sm border shrink-0 ${
                      item.badgeColor || 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Demo Journey Banner & Help */}
      <div className="p-3 border-t border-stone-200 space-y-2">
        <div className="p-2.5 rounded-lg bg-stone-100/80 border border-stone-200 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-stone-800 text-[11px] mb-1">
            <Repeat className="w-3.5 h-3.5 text-purple-600" />
            Connected Journey Loop
          </div>
          <p className="text-[11px] text-stone-600 leading-snug">
            Signal → Opportunity → Concept → Decision → Delivery → Outcome → Learning Signal.
          </p>
        </div>

        <div className="px-2 py-1 text-[11px] text-stone-500 flex items-center justify-between">
          <span>Flowdesk Workspace v1.0</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-stone-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Local Persist
          </span>
        </div>
      </div>
    </aside>
  );
};
