import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Role } from '../../types';
import {
  RotateCcw,
  Download,
  Upload,
  Search,
  Sparkles,
  Bot,
  UserCheck,
  Code2,
  Briefcase,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    role,
    setRole,
    aiMode,
    setAiMode,
    hasLiveGeminiKey,
    globalSearchQuery,
    setGlobalSearchQuery,
    notifications,
    markNotificationRead,
    setActiveView,
    resetWorkspace,
    exportWorkspaceJson,
    importWorkspaceJson,
    isAiPaused,
    reviewQueue,
  } = useWorkspace();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingReviewCount = reviewQueue.filter((r) => r.status === 'Pending').length;

  const handleExport = () => {
    const jsonStr = exportWorkspaceJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowdesk-product-loops-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const ok = importWorkspaceJson(importText);
    if (ok) {
      alert('Workspace imported successfully!');
      setShowImportModal(false);
      setImportText('');
    } else {
      alert('Failed to parse workspace JSON. Please check formatting.');
    }
  };

  const roleLabels: Record<Role, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
    pm: {
      label: 'Product Manager',
      desc: 'Shapes evidence, runs scoring, refines specs',
      icon: <Briefcase className="w-3.5 h-3.5" />,
      color: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    lead: {
      label: 'Product Lead',
      desc: 'Authorizes solutions, decides trade-offs, reviews outcomes',
      icon: <UserCheck className="w-3.5 h-3.5" />,
      color: 'bg-lime-100 text-lime-900 border-lime-300 font-medium',
    },
    engineer: {
      label: 'Engineer',
      desc: 'Validates delivery readiness, approves simulated releases',
      icon: <Code2 className="w-3.5 h-3.5" />,
      color: 'bg-stone-100 text-stone-800 border-stone-300',
    },
  };

  return (
    <header className="h-16 border-b border-stone-200 bg-[#fdfcf9] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Workspace */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
            PL
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-900 tracking-tight text-sm">Flowdesk</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono border border-stone-200">
                Product Loops
              </span>
            </div>
            <div className="text-[11px] text-stone-500 hidden sm:block">
              Loop-driven agent-assisted product workspace
            </div>
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search signals, opportunities, specs..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-md bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Role, AI Mode, Notifications & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
          <span className="text-[11px] font-medium text-stone-500 px-1.5 hidden lg:inline">Role:</span>
          {(['pm', 'lead', 'engineer'] as Role[]).map((r) => {
            const isActive = role === r;
            const info = roleLabels[r];
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                title={info.desc}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all ${
                  isActive
                    ? `${info.color} shadow-xs font-semibold border`
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {info.icon}
                <span className="hidden sm:inline">{info.label}</span>
                <span className="sm:hidden">{r.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* AI Mode Selector */}
        <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
          <button
            onClick={() => setAiMode('demo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all ${
              aiMode === 'demo'
                ? 'bg-white text-stone-900 shadow-xs font-medium border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Deterministic pre-seeded analysis (100% reliable, zero external API latency)"
          >
            <Bot className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Demo</span>
          </button>
          <button
            onClick={() => setAiMode('live')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all ${
              aiMode === 'live'
                ? 'bg-purple-600 text-white shadow-xs font-medium'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title={
              hasLiveGeminiKey
                ? 'Server-side Live Gemini (gemini-3.8-flash) enabled'
                : 'Gemini API key configured via server. Fallback to demo output on error.'
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span className="hidden sm:inline">Live AI</span>
            {aiMode === 'live' && hasLiveGeminiKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-lime-300 animate-pulse" />
            )}
          </button>
        </div>

        {/* Circuit Breaker Kill-Switch Status */}
        {isAiPaused && (
          <button
            onClick={() => setActiveView('evals')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs animate-pulse shadow-xs transition-all"
            title="AI Circuit Breaker Active: Automated AI actions paused. Click to review in Evals & Guardrails."
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI PAUSED (Circuit Breaker)</span>
            <span className="md:hidden">PAUSED</span>
          </button>
        )}

        {/* Flagged Review Queue pill */}
        {pendingReviewCount > 0 && !isAiPaused && (
          <button
            onClick={() => setActiveView('evals')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-medium transition-all"
            title={`${pendingReviewCount} artifact(s) flagged for human review. Click to open Evals queue.`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingReviewCount} Flagged for Review</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
            title="Workspace Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <span className="font-semibold text-xs text-stone-900">Workspace Alerts</span>
                <span className="text-[11px] text-stone-500">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-500">No active alerts.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.targetView) setActiveView(n.targetView as any);
                        setShowNotifications(false);
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-stone-50 transition-colors ${
                        !n.read ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'regression' && (
                          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        )}
                        {n.type === 'warning' && (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        {n.type === 'drift' && (
                          <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        )}
                        {n.type === 'info' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-stone-900">{n.title}</div>
                          <div className="text-stone-600 text-[11px] mt-0.5 leading-relaxed">
                            {n.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Workspace Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-100 text-xs font-medium transition-colors"
          >
            <span>Workspace</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-stone-200 z-50 py-1 text-xs">
              <button
                onClick={handleExport}
                className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                Export Workspace JSON
              </button>
              <button
                onClick={() => {
                  setShowImportModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                Import Workspace JSON
              </button>
              <div className="my-1 border-t border-stone-100" />
              <button
                onClick={() => {
                  if (confirm('Reset workspace to initial demo state? All local edits will be reset.')) {
                    resetWorkspace();
                    setShowMenu(false);
                  }
                }}
                className="w-full px-3 py-2 text-left text-red-700 hover:bg-red-50 flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                Reset Demo Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-lg w-full p-5 text-stone-900">
            <h3 className="font-semibold text-sm mb-2">Import Workspace JSON</h3>
            <p className="text-xs text-stone-600 mb-3">
              Paste a previously exported Flowdesk workspace JSON string below to restore all signals,
              opportunities, and decision logs.
            </p>
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste JSON here..."
              className="w-full font-mono text-xs p-2.5 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-400"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 text-xs bg-stone-900 text-white rounded-lg hover:bg-stone-800 font-medium"
              >
                Import Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
