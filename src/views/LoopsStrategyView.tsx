import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { LoopConfig, LoopRun } from '../types';
import {
  Repeat,
  Play,
  Clock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  FileText,
  Check,
  X,
  AlertTriangle,
  History,
} from 'lucide-react';

export const LoopsStrategyView: React.FC = () => {
  const { loops, loopRuns, runLoopNow, strategy, updateStrategy } = useWorkspace();

  const [selectedLoopId, setSelectedLoopId] = useState<string>(loops[0]?.id || 'loop-feedback-digest');
  const [runningLoopId, setRunningLoopId] = useState<string | null>(null);

  // Edit skill instructions
  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [editedSkillTitle, setEditedSkillTitle] = useState('');
  const [editedSkillPrompt, setEditedSkillPrompt] = useState('');

  // Edit trigger
  const [isEditingTrigger, setIsEditingTrigger] = useState(false);
  const [editedTriggerType, setEditedTriggerType] = useState<'manual' | 'daily' | 'weekly' | 'event'>('daily');
  const [editedTriggerLabel, setEditedTriggerLabel] = useState('');

  const activeLoop = loops.find((l) => l.id === selectedLoopId) || loops[0];
  const activeRuns = loopRuns.filter((r) => r.loopId === selectedLoopId);

  const handleRunNow = async (loopId: string) => {
    setRunningLoopId(loopId);
    await runLoopNow(loopId);
    setRunningLoopId(null);
  };

  const handleStartEditSkill = () => {
    setEditedSkillTitle(activeLoop.skill.title);
    setEditedSkillPrompt(activeLoop.skill.promptInstructions);
    setIsEditingSkill(true);
  };

  const handleSaveSkill = () => {
    activeLoop.skill.title = editedSkillTitle;
    activeLoop.skill.promptInstructions = editedSkillPrompt;
    setIsEditingSkill(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white">
              System Governance
            </span>
            <span className="text-xs text-stone-500">10 Autonomous Agent Loops</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Loops & Strategy</h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Inspect and configure each loop’s 6 fundamental parts: Trigger, Skill instructions, Maker agent,
            independent Checker gate, and execution State.
          </p>
        </div>

        <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-[11px] text-stone-600 max-w-xs">
          <strong>Notice:</strong> Scheduled execution is simulated. Use <strong>Run now</strong> to
          execute. Jobs do not run while the browser is closed.
        </div>
      </div>

      {/* Main Layout: Left Loops List & Right 6-Part Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 10 Loops Selector */}
        <div className="lg:col-span-4 space-y-2">
          <div className="px-1 text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
            Configured Loops ({loops.length})
          </div>

          <div className="space-y-1.5">
            {loops.map((loop) => {
              const isSelected = loop.id === selectedLoopId;
              const isRunning = runningLoopId === loop.id;

              return (
                <div
                  key={loop.id}
                  onClick={() => setSelectedLoopId(loop.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-white border-purple-500 ring-2 ring-purple-100 shadow-xs font-semibold'
                      : 'bg-white/80 border-stone-200 hover:bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-900 truncate">{loop.name}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 font-normal">
                      Stage: {loop.stage} • {loop.trigger.label}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunNow(loop.id);
                    }}
                    disabled={isRunning}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-xs shrink-0 transition-colors"
                    title="Execute Loop Now"
                  >
                    {isRunning ? (
                      <Clock className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Loop 6 Parts Details */}
        <div className="lg:col-span-8 space-y-5">
          {/* Loop Card Header */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {activeLoop.id}
                </span>
                <span className="text-xs text-stone-500">Stage: {activeLoop.stage}</span>
              </div>
              <h2 className="text-lg font-bold text-stone-900">{activeLoop.name}</h2>
            </div>

            <button
              onClick={() => handleRunNow(activeLoop.id)}
              disabled={runningLoopId === activeLoop.id}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 shadow-xs flex items-center gap-1.5 transition-all"
            >
              {runningLoopId === activeLoop.id ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Executing Loop...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Now</span>
                </>
              )}
            </button>
          </div>

          {/* Six Parts of the Loop Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. TRIGGER */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span className="uppercase text-[11px] tracking-wider text-stone-500">1. Trigger</span>
                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-mono">
                  {activeLoop.trigger.type}
                </span>
              </div>
              <div className="font-semibold text-stone-900">{activeLoop.trigger.label}</div>
              <p className="text-[11px] text-stone-500">
                Supports manual, scheduled, or in-app events. Repeated events never trigger duplicate runs.
              </p>
            </div>

            {/* 2. SKILL */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span className="uppercase text-[11px] tracking-wider text-purple-700">2. Skill</span>
                <button
                  onClick={handleStartEditSkill}
                  className="text-purple-700 hover:text-purple-900 text-[11px] flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit Instructions
                </button>
              </div>
              <div className="font-semibold text-stone-900">{activeLoop.skill.title}</div>
              <p className="text-[11px] text-stone-600 line-clamp-3 leading-snug">
                {activeLoop.skill.promptInstructions}
              </p>
            </div>

            {/* 3. MAKER */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span className="uppercase text-[11px] tracking-wider text-stone-500">3. Maker</span>
                <span className="text-[10px] font-mono text-purple-700">
                  {activeLoop.maker.modelName}
                </span>
              </div>
              <div className="font-semibold text-stone-900">{activeLoop.maker.agentName}</div>
              <p className="text-[11px] text-stone-600">{activeLoop.maker.taskDescription}</p>
            </div>

            {/* 4. CHECKER */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span className="uppercase text-[11px] tracking-wider text-stone-500">4. Checker</span>
                <span className="text-[10px] font-mono text-stone-500">Independent Step</span>
              </div>
              <div className="font-semibold text-stone-900">{activeLoop.checker.agentName}</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
                {activeLoop.checker.explicitRules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* 5. GATE */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span className="uppercase text-[11px] tracking-wider text-stone-500">5. Gate</span>
                <span className="text-[10px] text-emerald-700 font-bold">Strict Pass/Fail</span>
              </div>
              <div className="font-semibold text-stone-900">{activeLoop.gate.rulesSummary}</div>
              <p className="text-[11px] text-stone-600">
                Threshold: <strong>{activeLoop.gate.passThreshold}</strong>
              </p>
              <div className="text-[10px] text-stone-400">
                * Max 2 automated revision attempts before mandatory human review. No endless retries.
              </div>
            </div>

            {/* 6. STATE */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span className="uppercase text-[11px] tracking-wider text-stone-500">6. State</span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {activeLoop.state.runCount} total runs
                </span>
              </div>
              <div className="text-[11px] text-stone-700 space-y-1">
                <div>
                  Last run: <strong>{activeLoop.state.lastRunAt || 'Never'}</strong>
                </div>
                <div>
                  Next preview: <strong>{activeLoop.state.configuredNextRun || 'Simulated'}</strong>
                </div>
                <div>
                  Failure count: <strong>{activeLoop.state.failureCount}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Skill Modal */}
          {isEditingSkill && (
            <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 text-stone-900 text-xs space-y-3">
                <h3 className="font-semibold text-sm">Edit Skill Instructions: {activeLoop.name}</h3>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Skill Title</label>
                  <input
                    type="text"
                    value={editedSkillTitle}
                    onChange={(e) => setEditedSkillTitle(e.target.value)}
                    className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    System Instructions & Task Boundaries
                  </label>
                  <textarea
                    rows={5}
                    value={editedSkillPrompt}
                    onChange={(e) => setEditedSkillPrompt(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingSkill(false)}
                    className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSkill}
                    className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800"
                  >
                    Save Skill
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Run History Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 mb-3">
              Execution History for {activeLoop.name}
            </h3>

            {activeRuns.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">
                No runs recorded yet. Click "Run Now" to execute.
              </div>
            ) : (
              <div className="space-y-2">
                {activeRuns.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-stone-800">{r.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'Completed' || r.status === 'Passed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="text-stone-700 text-[11px]">
                      {r.reasons?.[0] || 'Evaluated against gate rules.'}
                    </div>

                    <div className="flex justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-200/60">
                      <span>Provenance: {r.provenance}</span>
                      <span>{new Date(r.startedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
