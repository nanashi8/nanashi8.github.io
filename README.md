# English Learning Web App

[![CSS Quality Check](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml)
[![Build Check](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml)
[![Grammar Data Quality](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml)
[![Document Link Validation](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/link-checker.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/link-checker.yml)

English learning web app built with TypeScript + React + Vite. It focuses on adaptive scheduling (spaced repetition, forgetting curve, and session signals) to decide what to ask next.

- Demo: https://nanashi8.github.io/
- Docs: [docs/](docs/)
- Japanese README: [README_JP.md](README_JP.md)

## A short tour (our work)

This repository intentionally keeps the app, learning datasets, quality gates, and AI-assisted workflow docs together. The goal is long-term maintainability: make it hard to “silently break” scheduling, UI, or data as the project grows.

- The scheduling core is a meta layer that coordinates specialist signals via a Position (0-100) model: [src/ai/scheduler/QuestionScheduler.ts](src/ai/scheduler/QuestionScheduler.ts), [src/ai/specialists/](src/ai/specialists/)
- Layout is guarded by “immutable UI specs”, responsive implementation patterns, and visual regression testing guidance: [docs/development/UI_IMMUTABLE_SPECIFICATIONS.md](docs/development/UI_IMMUTABLE_SPECIFICATIONS.md), [docs/development/RESPONSIVE_IMPLEMENTATION_GUIDE.md](docs/development/RESPONSIVE_IMPLEMENTATION_GUIDE.md), [docs/development/VISUAL_REGRESSION_TESTING.md](docs/development/VISUAL_REGRESSION_TESTING.md)
- Change quality is enforced through a single aggregated gate (typecheck/lint/doc checks) and an opt-in pre-commit guard: [package.json](package.json), [scripts/pre-commit-ai-guard.sh](scripts/pre-commit-ai-guard.sh)
- To keep AI-assisted edits consistent, the repo includes an instruction hierarchy and task-type workflows: [.aitk/instructions/README.md](.aitk/instructions/README.md), [docs/references/AI_WORKFLOW_INSTRUCTIONS.md](docs/references/AI_WORKFLOW_INSTRUCTIONS.md)

## Quick start

Requirements:

- Node.js 20 (see [.nvmrc](.nvmrc))

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Key features

- Adaptive question ordering via the meta scheduler (see [src/ai/scheduler/](src/ai/scheduler/))
- “Specialist” signals (memory / cognitive load / prediction / engagement, etc.) coordinated in [src/ai/AICoordinator.ts](src/ai/AICoordinator.ts)
- Spaced repetition + forgetting curve modeling in [src/ai/specialists/](src/ai/specialists/)
- Random short-delay re-asking after mistakes (to reduce immediate short-term recall effects)
- Local-first persistence via `localStorage`

Note: The core scheduling is primarily rule/heuristics-based. This repo also contains optional ML experiments (see [src/ai/ml/](src/ai/ml/)), but they are not required to run the app.

## AI coordination flag

In development (`npm run dev`), AI coordination is enabled automatically.

For production builds, enable it in the browser console:

```js
localStorage.setItem('enable-ai-coordination', 'true');
location.reload();
```

See [docs/HOW_TO_ENABLE_AI.md](docs/HOW_TO_ENABLE_AI.md).

## Common commands

```bash
# Unit tests (fast preset)
npm test

# Full typecheck + lint + doc checks (recommended before PR)
npm run quality:check

# Build / preview
npm run build
npm run preview
```

More scripts are in [package.json](package.json) (data validation, Playwright smoke/visual tests, etc.).

## Repository layout

- [src/](src/) - React app and adaptive scheduling logic
- [public/data/](public/data/) - learning datasets
- [docs/](docs/) - specifications, guides, and reports
- [scripts/](scripts/) - automation and validators (some require Python)
- [tests/](tests/) - unit/integration/simulation tests
- [extensions/](extensions/) - VS Code extension(s) and tooling (see [extensions/servant/](extensions/servant/))

## Contributing / quality

- Please follow the project’s quality policies (e.g., [docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md](docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md)).
- Run `npm run quality:check` before submitting changes.
- This README is maintained collaboratively by the project owner and AI assistance (GitHub Copilot / GPT-5.2), with links to concrete implementation files.

## Catalog (overview)

This repo mixes a web app, learning datasets, and tooling around them.

- **Learning app (TypeScript + React + Vite)**
  - The meta scheduler is the main entry point for deciding “what to ask next”: [src/ai/scheduler/QuestionScheduler.ts](src/ai/scheduler/QuestionScheduler.ts)
  - Multiple specialist heuristics/signals are coordinated in: [src/ai/AICoordinator.ts](src/ai/AICoordinator.ts)
  - Memory / retention algorithms (spaced repetition + forgetting curve style scoring): [src/strategies/memoryAcquisitionAlgorithm.ts](src/strategies/memoryAcquisitionAlgorithm.ts), [src/strategies/memoryRetentionAlgorithm.ts](src/strategies/memoryRetentionAlgorithm.ts)
  - Interleaving (mixing categories to avoid monotony) is handled by: [src/ai/specialists/GamificationAI.ts](src/ai/specialists/GamificationAI.ts)
  - Progress is stored locally (localStorage-based): [src/storage/progress/progressStorage.ts](src/storage/progress/progressStorage.ts)
  - Rule/heuristics-based scheduling is the default; the repo also contains optional ML experiments: [src/ai/ml/](src/ai/ml/)

- **Datasets (public/data)**
  - Vocabulary / grammar / reading-related datasets and derived files: [public/data/](public/data/)
  - Validators and conversion scripts live under: [scripts/](scripts/) and [tools/](tools/)
  - Data quality policies and references are documented under: [docs/guidelines/](docs/guidelines/)

- **Quality gates and testing**
  - A single command runs typecheck + linters + doc and rule checks: `npm run quality:check`
  - Playwright smoke/visual tests and simulation tests exist under: [tests/](tests/)

- **Advanced initiatives (examples)**
  In a repo that mixes app code, datasets, and automation, regressions can spread “quietly” across scheduling, UI, and data. This project tries to make those breakages easier to detect and harder to introduce.
  The pattern is: document constraints, add guardrails, and keep claims grounded in concrete files so AI-assisted edits stay reviewable.

  - “8 AI systems” architecture (7 specialist AIs + 1 meta integrator) for deciding “what to ask next” via coordinated signals: [src/ai/scheduler/QuestionScheduler.ts](src/ai/scheduler/QuestionScheduler.ts), [src/ai/specialists/](src/ai/specialists/), [src/ai/meta/](src/ai/meta/)
  - Optional pre-commit guard that nudges changes to start from instruction/spec checks (useful in a repo mixing app + data + tooling): [scripts/pre-commit-ai-guard.sh](scripts/pre-commit-ai-guard.sh), [scripts/ai-guard-check.mjs](scripts/ai-guard-check.mjs)
  - UI constraints and design rules are documented to keep review/AI-assisted edits consistent over time: [docs/development/UI_IMMUTABLE_SPECIFICATIONS.md](docs/development/UI_IMMUTABLE_SPECIFICATIONS.md), [docs/development/UI_DEVELOPMENT_GUIDELINES.md](docs/development/UI_DEVELOPMENT_GUIDELINES.md), [docs/development/DESIGN_SYSTEM_RULES.md](docs/development/DESIGN_SYSTEM_RULES.md)
  - Layout regression guardrails (responsive implementation patterns + visual regression testing guide/templates): [docs/development/RESPONSIVE_IMPLEMENTATION_GUIDE.md](docs/development/RESPONSIVE_IMPLEMENTATION_GUIDE.md), [docs/development/VISUAL_REGRESSION_TESTING.md](docs/development/VISUAL_REGRESSION_TESTING.md), [tests/smoke.spec.ts](tests/smoke.spec.ts)
  - Governance for AI-assisted development (instruction hierarchy + task-type workflow docs): [.aitk/instructions/README.md](.aitk/instructions/README.md), [docs/references/AI_WORKFLOW_INSTRUCTIONS.md](docs/references/AI_WORKFLOW_INSTRUCTIONS.md)
  - Automated detection of disallowed styling patterns (example checker): [scripts/check-no-dark-mode.mjs](scripts/check-no-dark-mode.mjs)

- **VS Code extension (optional)**
  - Project-local helper extension for enforcing project instructions and assisting workflow tasks: [extensions/servant/](extensions/servant/)
  - Instruction validation with diagnostics/Quick Fixes (rules are loaded from `.instructions.md` files)
  - Git hook integration (opt-in): can install `pre-commit` / `commit-msg` hooks; the generated `pre-commit` prefers the repo-local guard script ([scripts/pre-commit-ai-guard.sh](scripts/pre-commit-ai-guard.sh)) when present
  - Spec/decision workflow helpers (examples): `Servant: Review Required Instructions`, `Servant: Record Spec Check`, `Servant: Open Working Spec`, `Servant: Append Decision Log`
  - Convenience commit helper: `Servant: 🚀 Quick Fix Commit (DECISIONS追記→コミット)` appends to [docs/specifications/DECISIONS.md](docs/specifications/DECISIONS.md) and runs `git add`/`git commit`
  - See the extension README for the full command list and settings: [extensions/servant/README.md](extensions/servant/README.md)

  It is not required to run the web app.

## License

This repository does not include a top-level license file at the root.

Permission notes (summary):
- Non-commercial use (including personal and educational use as teaching/learning materials) is permitted.
- Commercial use is not permitted without prior permission (contact the repository owner to discuss terms).

The VS Code extension under [extensions/servant/](extensions/servant/) has its own license: [extensions/servant/LICENSE](extensions/servant/LICENSE).
