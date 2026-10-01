import React, { useState } from 'react';
import { WireframeComponentType } from '../../types';
import {
  CheckCircle2,
  Circle,
  Minimize2,
  Maximize2,
  Sparkles,
  Users,
  Copy,
  Check,
  Layout,
  Plus,
  ArrowRight,
  HelpCircle,
  FileText,
  Star,
} from 'lucide-react';

interface WireframePreviewProps {
  wireframeType: WireframeComponentType;
  conceptTitle: string;
}

export const WireframePreview: React.FC<WireframePreviewProps> = ({
  wireframeType,
  conceptTitle,
}) => {
  // 1. Checklist interactive state
  const [checklistTasks, setChecklistTasks] = useState([
    { id: 1, title: 'Name your board & select project goal', completed: true },
    { id: 2, title: 'Create first 3 tasks on canvas', completed: true },
    { id: 3, title: 'Generate & share teammate invite link', completed: false },
    { id: 4, title: 'Move any task to "Done" column', completed: false },
  ]);
  const [checklistMinimized, setChecklistMinimized] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 2. Wizard interactive state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState('Product & Design');
  const [selectedTemplate, setSelectedTemplate] = useState('Scrum Sprint & Backlog');

  // 3. Prompt interactive state
  const [promptText, setPromptText] = useState('Mobile app redesign sprint');
  const [generatedCards, setGeneratedCards] = useState<string[]>([
    'Design user login wireframes',
    'Audit checkout friction points',
    'Setup staging test environment',
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Checklist completion calculation
  const completedCount = checklistTasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / checklistTasks.length) * 100);

  const toggleTask = (id: number) => {
    setChecklistTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    // Auto complete task 3
    setChecklistTasks((prev) =>
      prev.map((t) => (t.id === 3 ? { ...t, completed: true } : t))
    );
  };

  const handleSimulateGeneration = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedCards([
        `Map onboarding user flows for "${promptText}"`,
        `Draft core screen UI components`,
        `Run usability testing with 3 testers`,
        `Review performance benchmark metrics`,
      ]);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="bg-stone-900/5 rounded-xl border border-stone-200 overflow-hidden text-stone-900 text-xs">
      {/* Wireframe simulated browser header */}
      <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          </div>
          <span className="text-[11px] font-mono text-stone-500 pl-2">
            app.flowdesk.internal / board / q4-sprint
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
          Interactive Wireframe Preview
        </span>
      </div>

      {/* Simulated Flowdesk Canvas Workspace */}
      <div className="relative min-h-[360px] bg-[#fbfaf7] p-4 flex flex-col justify-between overflow-hidden">
        {/* Mock Top Canvas Toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-stone-800 text-sm">Sprint Board #14</div>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600 border border-stone-200">
              Active Sprint
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[10px] font-bold border border-white">
                AL
              </span>
              <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-[10px] font-bold border border-white">
                DC
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium transition-colors"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Wireframe Content based on concept type */}

        {/* 1. Checklist Wireframe */}
        {wireframeType === 'interactive_checklist' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Mock Canvas Columns */}
            <div className="grid grid-cols-3 gap-3 opacity-90">
              <div className="bg-stone-100/70 p-2.5 rounded-lg border border-stone-200/60">
                <div className="font-medium text-stone-700 mb-2 flex justify-between text-[11px]">
                  <span>To Do</span>
                  <span className="text-stone-400">2</span>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-white p-2 rounded border border-stone-200 shadow-2xs text-[11px]">
                    Draft user interviews guide
                  </div>
                  <div className="bg-white p-2 rounded border border-stone-200 shadow-2xs text-[11px]">
                    Review analytics funnel drop
                  </div>
                </div>
              </div>

              <div className="bg-stone-100/70 p-2.5 rounded-lg border border-stone-200/60">
                <div className="font-medium text-stone-700 mb-2 flex justify-between text-[11px]">
                  <span>In Progress</span>
                  <span className="text-stone-400">1</span>
                </div>
                <div className="bg-white p-2 rounded border border-stone-200 shadow-2xs text-[11px]">
                  Design interactive checklist component
                </div>
              </div>

              <div className="bg-stone-100/70 p-2.5 rounded-lg border border-stone-200/60">
                <div className="font-medium text-stone-700 mb-2 flex justify-between text-[11px]">
                  <span>Done</span>
                  <span className="text-stone-400">1</span>
                </div>
                <div className="bg-white p-2 rounded border border-stone-200 shadow-2xs text-[11px] line-through text-stone-400">
                  Setup initial project repository
                </div>
              </div>
            </div>

            {/* Interactive Floating Checklist Widget */}
            <div className="flex justify-end mt-4">
              <div
                className={`bg-white rounded-xl shadow-xl border border-stone-300 w-80 transition-all ${
                  checklistMinimized ? 'p-2.5' : 'p-4'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                    <span className="font-semibold text-stone-900 text-xs">
                      Getting Started with Flowdesk
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      {progressPercent}%
                    </span>
                    <button
                      onClick={() => setChecklistMinimized(!checklistMinimized)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded"
                      title={checklistMinimized ? 'Expand' : 'Minimize'}
                    >
                      {checklistMinimized ? (
                        <Maximize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Minimize2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {!checklistMinimized && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-stone-500">
                      Complete these 4 quick milestones to unlock your team’s full workspace.
                    </p>

                    <div className="space-y-1.5">
                      {checklistTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                            task.completed
                              ? 'bg-emerald-50/60 text-stone-500'
                              : 'hover:bg-stone-50 text-stone-800'
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-stone-300 shrink-0 mt-0.5 hover:text-stone-400" />
                          )}
                          <span
                            className={`text-xs leading-snug ${
                              task.completed ? 'line-through text-stone-400' : 'font-medium'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {progressPercent === 100 && (
                      <div className="mt-3 p-2 bg-emerald-100 text-emerald-800 rounded-lg text-center text-xs font-semibold animate-bounce">
                        🎉 All milestones completed! Day-1 Value reached!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Wizard Wireframe */}
        {wireframeType === 'wizard_flow' && (
          <div className="flex-1 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl shadow-xl border border-stone-300 max-w-md w-full p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                <span className="font-semibold text-stone-900 text-xs">
                  Setup Your Workspace (Step {wizardStep} of 3)
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <span
                      key={s}
                      className={`w-2 h-2 rounded-full ${
                        s <= wizardStep ? 'bg-purple-600' : 'bg-stone-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div className="font-medium text-stone-800 text-xs">
                    What is your team’s primary discipline?
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Product & Design', 'Engineering', 'Marketing & GTM', 'Agency / Client Work'].map(
                      (r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedRole(r)}
                          className={`p-2 rounded-lg border text-left text-xs transition-all ${
                            selectedRole === r
                              ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                              : 'border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {r}
                        </button>
                      )
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      Next: Template <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="font-medium text-stone-800 text-xs">
                    Choose a starter template for {selectedRole}:
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Scrum Sprint & Backlog', desc: 'Columns for Ready, In Flight, Review, and Done.' },
                      { name: 'Kanban Flow with WIP Limits', desc: 'Continuous delivery board for fast iterations.' },
                      { name: 'Weekly Roadmap & Milestones', desc: 'Timeline view for cross-functional alignment.' },
                    ].map((tpl) => (
                      <div
                        key={tpl.name}
                        onClick={() => setSelectedTemplate(tpl.name)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          selectedTemplate === tpl.name
                            ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-xs">{tpl.name}</div>
                        <div className="text-[11px] text-stone-500 font-normal">{tpl.desc}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded text-xs"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      Next: Invite <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div className="font-medium text-stone-800 text-xs">
                    Invite colleagues (Free 14-day trial, no credit card required)
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="colleague@company.com"
                      className="flex-1 text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg bg-stone-50"
                    />
                    <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium">
                      Invite
                    </button>
                  </div>
                  <div className="p-2 rounded bg-stone-100 text-[11px] text-stone-600">
                    Template: <strong>{selectedTemplate}</strong> will load immediately.
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded text-xs"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => alert('Wizard completed! Canvas pre-populated.')}
                      className="px-4 py-1.5 bg-lime-600 text-stone-900 rounded-lg text-xs font-semibold shadow-xs hover:bg-lime-500"
                    >
                      Enter Board
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Empty State Boost with Prompt Generator */}
        {wireframeType === 'empty_state_boost' && (
          <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full text-center p-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-stone-900 text-sm mb-1">
              Generate Instant Board from a Prompt
            </h4>
            <p className="text-[11px] text-stone-500 mb-3">
              Describe what your team is building this sprint, and Flowdesk will scaffold initial cards.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="E.g. Mobile app redesign sprint..."
                className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white"
              />
              <button
                onClick={handleSimulateGeneration}
                disabled={isGenerating}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                {isGenerating ? 'Generating...' : 'Generate Cards'}
              </button>
            </div>

            <div className="bg-white p-3 rounded-lg border border-stone-200 text-left space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Scaffolded Sprint Tasks:
              </span>
              {generatedCards.map((c, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 bg-stone-50 rounded border border-stone-100 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Template Gallery Wireframe */}
        {wireframeType === 'template_gallery' && (
          <div className="flex-1 p-2">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-stone-900 text-xs">Verified Community Templates</div>
              <span className="text-[11px] text-stone-500">1-click clone into workspace</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: 'Sprint Retrospective', author: 'Spotify Agile Coach', stars: 4.9, uses: '3.4k' },
                { title: 'Product Launch GTM', author: 'Intercom PM Lead', stars: 4.8, uses: '2.1k' },
                { title: 'User Research Synthesis', author: 'Figma Research Hub', stars: 4.9, uses: '1.8k' },
                { title: 'Design System Sprint', author: 'Linear Design Team', stars: 5.0, uses: '4.2k' },
              ].map((tpl) => (
                <div key={tpl.title} className="p-3 bg-white rounded-lg border border-stone-200 hover:border-purple-300 transition-colors">
                  <div className="font-medium text-stone-800 text-xs mb-1">{tpl.title}</div>
                  <div className="text-[10px] text-stone-500 mb-2">By {tpl.author}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px] text-stone-600">
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {tpl.stars} ({tpl.uses})
                    </span>
                    <button
                      onClick={() => alert(`Cloned template "${tpl.title}" into board!`)}
                      className="px-2 py-0.5 bg-stone-900 text-white rounded text-[10px] font-medium hover:bg-stone-800"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. In-context Guide Wireframe */}
        {wireframeType === 'in_context_guide' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-stone-100 p-2.5 rounded-lg border border-stone-200">
                <div className="font-medium text-stone-700 mb-2 text-xs">Sprint Backlog</div>
                <div className="bg-white p-2 rounded border border-purple-400 shadow-sm relative">
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.2 bg-purple-600 text-white text-[9px] font-bold rounded-full">
                    Step 1
                  </span>
                  Drag cards between columns to change state.
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-purple-300 shadow-md max-w-sm ml-auto mt-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                  ▶
                </span>
                <span className="font-semibold text-xs text-stone-900">20s Video Tip: Canvas Shortcuts</span>
              </div>
              <p className="text-[11px] text-stone-600 mb-2">
                Press <kbd className="px-1 py-0.5 bg-stone-100 border rounded font-mono text-[10px]">C</kbd> to add cards, and <kbd className="px-1 py-0.5 bg-stone-100 border rounded font-mono text-[10px]">Space+Drag</kbd> to pan.
              </p>
              <button
                onClick={() => alert('Playing 20-second simulated video tour.')}
                className="w-full py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-xs font-medium"
              >
                Watch 20s Quick Tour
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-stone-50 px-4 py-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
        <span>Concept: {conceptTitle}</span>
        <span>Interactive UI Component Sandbox</span>
      </div>
    </div>
  );
};
