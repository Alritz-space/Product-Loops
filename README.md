# Product Loops

**Product Loops** is an agent-assisted product-management web application designed to help cross-functional product teams run a closed-loop product lifecycle:

$$\text{Gather Signals} \longrightarrow \text{Prioritize Opportunities} \longrightarrow \text{Explore Solutions} \longrightarrow \text{Human Decision} \longrightarrow \text{Shape Delivery} \longrightarrow \text{Review Outcomes} \longrightarrow \text{Feed Learning}$$

The application provides a working workspace prototype with live Gemini model integration, deterministic demo runs, browser persistence, simulated external integrations, and traceable decision history.

---

## Key Personas & Roles

A demo role switcher in the top bar allows demonstration of each team persona:

- **Product Manager (PM)**: Reviews raw evidence signals, runs quantitative prioritization scoring, refines specifications, and curates solution shortlists.
- **Product Lead**: Authorizes product decisions between shortlisted concepts, challenges assumptions with AI red-team partners, and reviews post-launch outcomes.
- **Engineer**: Audits technical readiness and spec drift, inspects simulated agent evaluation panels, and explicitly approves simulated releases.

---

## Core Data Structure & Traceability

Product Loops enforces an unbroken chain of custody:
$$\text{Source Signal} \to \text{Opportunity} \to \text{Solution Concept} \to \text{Human Decision} \to \text{Delivery Slice} \to \text{Release} \to \text{Outcome Review} \to \text{New Learning Signal}$$

Clicking any entity (`SIG-*`, `OPP-*`, `SOL-*`, `DEC-*`, `SLICE-*`, `REL-*`) opens the **Evidence Trace Inspector**, displaying its upstream citations and downstream deliverables.

---

## The Six-Part Loop Architecture

Every loop in the system comprises six distinct components:

1. **Trigger**: Manual invocation, cron schedule preview, or application event.
2. **Skill**: Editable instructions defining the agent's task boundaries and rules.
3. **Maker**: AI step that produces the proposed output (e.g. cluster, score, concept).
4. **Checker**: Separate, independent AI step that audits the output against strict rules.
5. **Gate**: Pass or fail result with findings. Automated retries are bounded to a maximum of 2 attempts before requiring human intervention.
6. **State**: Saved context, prior outputs, and execution history.

### The 10 Configured Loops

1. **Feedback Digest**: Clusters support tickets and user interviews.
2. **Deal Intelligence**: Identifies CRM win/loss blockers and delight drivers.
3. **Competitive Brief**: Monitors public competitor launches and changelogs.
4. **Metric Anomaly Review**: Flags statistical regressions in activation and retention.
5. **Onboarding Friction Review**: Detects session drop-off steps and UI hesitation.
6. **Customer Call Candidates**: Recommends high-learning accounts with discovery questions.
7. **Backlog Ranking**: Quantitative RICE scoring evaluated against strategy non-goals.
8. **Solution Exploration**: Divergent solution concept generation with synthetic reviews.
9. **Spec Drift**: Audits delivery briefs for scope creep against approved decisions.
10. **Release Quality Review**: Post-launch metric analysis detecting guardrail regressions.

---

## Seeded Main Demo Journey: Flowdesk

The app comes pre-seeded with **Flowdesk** (a collaborative workspace for small teams):

- **Strategy v1**: Reduce median time to first value from 3 days to 1 day. Explicit non-goal: Avoid enterprise-only customization this quarter.
- **26 Verified Signals**: Covering all 6 categories (tickets, CRM deals, competitor moves, telemetry, drop-offs, and call candidates).
- **OPP-201 (Guided Onboarding Checklist)**: High priority score (3,570), linked to 8 signals, with 5 divergent solution concepts and interactive wireframes.
- **OPP-203 (Bespoke Enterprise SSO)**: Demonstrates an automated **Checker Failure** because it directly violates Strategy Non-Goal #1.
- **DEC-401**: Human authorization workspace with side-by-side concept comparison and red-team challenge (*"What could make this the wrong decision?"*).
- **SLICE-501**: Complete delivery brief with Gherkin acceptance criteria, telemetry events, and simulated engineering test panels.
- **REL-601 (Release 2026.09)**: Demonstrates a **Guardrail Regression** (+223% spike in invite permission tickets) that triggers an Outcome Review. Completing the review creates **SIG-127**, feeding learning back into the Signals Inbox and closing the cycle.

---

## Dual Execution Modes

- **Demo Mode (Deterministic)**: 100% reliable, zero-latency seeded outputs. No API key needed.
- **Live AI Mode (Gemini)**: Calls server-side Gemini API endpoints powered by `@google/genai` (`gemini-3.8-flash`). Automatically falls back gracefully with user-friendly retry controls if external services are unavailable.

---

## Getting Started

### Prerequisites

- Node.js v20+ or v22+
- npm

### Installation

```bash
npm install
```

### Environment Configuration

Configure `GEMINI_API_KEY` in your environment or `.env` file (optional for Demo mode, required for Live AI mode):

```env
GEMINI_API_KEY="your-gemini-api-key"
```

### Running Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

---

## Design System

- **Warm off-white background**: `#fbfaf7`
- **Dark charcoal text**: `#1f2124`
- **Lavender accents**: Agent activity and machine synthesis
- **Lime accents**: Human authorizations and binding decisions
- **Amber & Orange accents**: Attention alerts and outcome reviews
- **Predefined Interactive Wireframes**: Safe, clickable UI sandboxes without running arbitrary untrusted code.
