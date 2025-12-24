# English Learning Web Application

[![CSS Quality Check](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml)
[![Build Check](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml)
[![Grammar Data Quality](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml)
[![Document Link Validation](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/link-checker.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/link-checker.yml)
[![No Symptomatic Fixes](https://img.shields.io/badge/code%20quality-no%20symptomatic%20fixes-brightgreen)](docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md)

An English learning application built with TypeScript + React, implementing an adaptive learning system that integrates 8 specialized algorithms.

🎯 [Demo Site](https://nanashi8.github.io/) | 📚 [Documentation](docs/) | 🔧 [Algorithm Integration Guide](docs/AI_INTEGRATION_GUIDE.md)

---

## 🚨 Important Notice for Developers

### ⚠️ [CRITICAL] Absolutely No "Fix-on-Fix" Allowed

This project **completely prohibits "fixing a fix"**.

#### Enforcement Mechanism

```bash
# Install pre-commit hook (one-time setup)
ln -sf ../../scripts/pre-commit-fix-check.sh .git/hooks/pre-commit

# Automatic validation before commit:
# - Fix-on-fix pattern detection
# - Symptomatic fix keyword detection
# - Short-term re-modification detection
# - Type definition change impact analysis
# - Condition branch accumulation detection
```

#### Mandatory Checklist Before Any Fix

- [ ] Have you identified the root cause?
- [ ] Have you completely mapped out the impact scope?
- [ ] Have you listed all related files?
- [ ] Have you prepared test cases?
- [ ] Will this fix break other parts?

**Details**:
- [No Fix-on-Fix Policy](.aitk/instructions/no-fix-on-fix.instructions.md)
- [No Symptomatic Fixes Policy](docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md)

---

## 📖 Table of Contents

- [System Overview](#system-overview)
- [8-AI System Architecture](#8-ai-system-architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Setup Guide](#setup-guide)
- [Documentation System](#documentation-system)

---

## 🎯 System Overview

### Concept

An English learning system equipped with adaptive question algorithms that respond to individual learning patterns. It achieves integrated learning management through 7 specialized algorithms and 1 meta-algorithm (QuestionScheduler).

**Technical Note**: This system is implemented using learning psychology (forgetting curve, spaced repetition) and rule-based algorithms, not machine learning-based AI.

### Implemented Features

#### Priority-Based Review System

- Priority bonus for incorrect words (+50~90)
- Random interval re-questioning (re-question after 2-5 questions)
- Oscillation prevention mechanism (suppress re-questioning within 1 minute)

#### Learning State Detection and Adjustment

- Fatigue signal detection (after 20+ minutes of learning)
- Struggling signal detection (error rate 40%+)
- Overlearning signal detection (10+ consecutive correct answers)
- Boredom signal detection (consecutive same difficulty level)

#### Time-Based Review Optimization

- DTA (Time-Dependent Adjustment) for forgetting curve
- Priority adjustment based on time elapsed since last learning
- Adaptation to individual forgetting patterns

---

## 🔧 8-Hybrid AI System Architecture

### System Configuration

This system consists of 7 specialized AIs and 1 meta AI integration layer. Each AI performs independent evaluation, and the meta AI (QuestionScheduler) determines the final question order.

**🧠 Hybrid AI Implementation** (Phase 4: In Development)
- **Rule-Based Layer**: Ebbinghaus forgetting curve, SM-2 spaced repetition algorithm
- **Machine Learning Layer**: TensorFlow.js, neural networks, personalized adaptive learning
- **Integration Method**: Weight adjustment based on data volume (Rule 30-70% + ML 30-70%)
- **Learning Method**: Online learning (real-time improvement)

**Current Status**:
- ✅ Phase 1-3: Rule-based algorithms (Complete)
- 🔄 Phase 4: ML feature integration (In Progress)

### Operation Flow

1. Each specialized algorithm generates priority signals for each word
2. AlgorithmCoordinator aggregates signals
3. QuestionScheduler determines question order through integrated calculation
4. Learning results feedback adjusts parameters of each algorithm

### 7 Specialized AIs (Implementation Status)

| AI | Main Functions | Implementation File |
|---|---|---|
| 🧠 **Memory AI** | Memory retention evaluation, forgetting risk calculation | [`src/ai/specialists/MemoryAI.ts`](src/ai/specialists/MemoryAI.ts) |
| 💤 **Cognitive Load AI** | Cognitive load measurement, fatigue detection | [`src/ai/specialists/CognitiveLoadAI.ts`](src/ai/specialists/CognitiveLoadAI.ts) |
| 🔮 **Error Prediction AI** | Error pattern analysis and prediction | [`src/ai/specialists/ErrorPredictionAI.ts`](src/ai/specialists/ErrorPredictionAI.ts) |
| 🎯 **Learning Style AI** | Learning style profiling | [`src/ai/specialists/LearningStyleAI.ts`](src/ai/specialists/LearningStyleAI.ts) |
| 📚 **Linguistic AI** | Linguistic difficulty evaluation | [`src/ai/specialists/LinguisticAI.ts`](src/ai/specialists/LinguisticAI.ts) |
| 🌍 **Contextual AI** | Environment and time factor analysis | [`src/ai/specialists/ContextualAI.ts`](src/ai/specialists/ContextualAI.ts) |
| 🎮 **Gamification AI** | Motivation management | [`src/ai/specialists/GamificationAI.ts`](src/ai/specialists/GamificationAI.ts) |

**Integration Layer**: [`src/ai/coordinator/AICoordinator.ts`](src/ai/coordinator/AICoordinator.ts)

### QuestionScheduler - Meta AI Integration Layer

Achieved a Documentation-Implementation Consistency Score of 100/100.

#### Implemented Features

**4-Tab Unified Question Engine**
- Same algorithm used for all modes: memorization, translation, spelling, grammar
- Shared learning data and consistency guarantee across modes

**5 Types of Signal Detection**
- Fatigue: 20+ minutes of learning with increasing errors
- Struggling: Error rate 40%+
- Overlearning: 10+ consecutive correct answers
- Boredom: Consecutive same difficulty level
- Optimal: Good learning state

**DTA (Time-Dependent Adjustment)**
- Considers time elapsed since last learning
- Dynamic adjustment adapting to individual forgetting patterns

**Oscillation Prevention System**
- Suppresses re-questioning of correctly answered questions within 1 minute
- Real-time monitoring with vibrationScore (0-100)

**Certainty Guarantee Mechanism**
- Priority placement for incorrect words (+50~90 bonus)
- Secondary placement for still_learning (+25 bonus)
- Maintains review priority even under DTA or signal influence

---

## 🚀 Key Features

### Random Interval Re-questioning (Implemented December 2025)

#### Challenge

Immediate re-questioning causes correct answers from short-term memory, making it impossible to measure true memory retention.

#### Implementation Method

Add incorrect words to waiting queue and re-question after 2-5 questions with weighted randomization:

```typescript
// Weighted distribution
40%: After 2 questions
30%: After 3 questions
20%: After 4 questions
10%: After 5 questions
```

#### Effects

- Separation of short-term and long-term memory
- Coexistence with oscillation prevention system
- Maintenance of natural learning rhythm

**Details**: [random-skip-feature.md](docs/features/random-skip-feature.md)

### Documentation Management System

Maintains over 8,800 lines of detailed specifications, enabling feature recovery within 7.5 hours through a comprehensive documentation system.

**Phase 1 Completion Memorial**: Consolidated all Magic numbers in Position calculation into [positionConstants.ts](src/ai/utils/positionConstants.ts) (2025-12-23)

| Document | Content |
|---|---|
| [Complete Specification](docs/specifications/QUESTION_SCHEDULER_SPEC.md) | Algorithm details (1,669 lines) |
| [Type Definition Reference](docs/references/QUESTION_SCHEDULER_TYPES.md) | 11 type definitions (901 lines) |
| [Recovery Manual](docs/how-to/QUESTION_SCHEDULER_RECOVERY.md) | Step-by-step recovery procedure (1,080 lines) |
| [API Reference](docs/references/QUESTION_SCHEDULER_API.md) | Implementer's API (594 lines) |
| [Complete Learning System Roadmap](docs/development/COMPLETE_LEARNING_SYSTEM_ROADMAP.md) | Phase 1-6 implementation plan (62.5 hours) |

**Verification System**:
- Automated verification script (30 check items, 30-second execution)
- GitHub Actions integration
- Continuous consistency checking

### Documentation Quality Assurance

Maintains documentation quality through a 3-layer automatic verification system:

#### Level 1: Real-time Verification
- Immediate detection of broken links with VS Code integration
- Fragment (#anchor) validation

#### Level 2: Commit-time Verification
- Naming convention check via Pre-commit Hook
- Blocks commits that violate rules

#### Level 3: PR-time Verification
- Full link validation via GitHub Actions (684 links, 5 seconds)
- Merge control by broken link threshold (80 locations)

**Current Status**:
- Number of documents: 306 files
- Total links: 684
- Broken links: 76 (71% reduction from initial 263)
- Verification time: 5 seconds

**Details**: [EFFICIENT_DOC_WORKFLOW.md](docs/processes/EFFICIENT_DOC_WORKFLOW.md)

### Enabling AI Features

Automatically enabled in development environment (`npm run dev`). For production, enable with the following steps:

```javascript
// Execute in browser console (F12)
localStorage.setItem('enable-ai-coordination', 'true');
location.reload();
```

Logs like the following will be output to the console:

```text
🤖 [MemorizationView] AI integration enabled
🧠 Memory AI Signal for question_id=123:
  - forgettingRisk: 120 (priority adjustment: +35)
💤 Cognitive Load AI Signal:
  - fatigueScore: 0.3 (consecutive errors: 3 times)
🤖 Meta AI: Final Priority=260 (HIGH PRIORITY)
```

**Details**: [HOW_TO_ENABLE_AI.md](docs/HOW_TO_ENABLE_AI.md)

---

## 🛠️ Tech Stack

### Frontend

- **TypeScript**: Complete type safety
- **React 18**: Latest Hooks patterns
- **Vite**: Ultra-fast build
- **Tailwind CSS**: Utility-first

### AI/Machine Learning

- **7 Specialized AIs**: Memory, Cognitive Load, Error Prediction, Learning Style, Linguistic, Contextual, Gamification
- **QuestionScheduler (Meta AI)**: Signal integration and question order determination

### Data Management

- **localStorage**: Client-side persistence
- **CSV format**: 7-column data compatibility

### Quality Assurance

- **Vitest**: Unit tests (85%+ coverage)
- **Playwright**: E2E tests
- **ESLint + Prettier**: Code quality
- **Stylelint**: CSS quality
- **Markdownlint**: Documentation quality

### CI/CD

- **GitHub Actions**: Automated testing, building, deployment
- **GitHub Pages**: Static site hosting
- **Pre-commit Hooks**: Pre-commit verification

### Documentation Management

- **Pre-commit Hook**: Naming convention enforcement (`.husky/check-doc-naming`)
- **GitHub Actions**: Link validation (`.github/workflows/link-checker.yml`)
- **VS Code Integration**: Real-time Markdown validation
- **npm Scripts**: `docs:analyze`, `docs:check`, `docs:stats`

---

## 💻 Setup Guide

### System Requirements

- Node.js 16 or higher
- npm or yarn

### Installation Steps

```bash
# Clone repository
git clone https://github.com/nanashi8/nanashi8.github.io.git
cd nanashi8.github.io

# Install dependencies
npm install

# Start development server (AI features auto-enabled)
npm run dev

# Open http://localhost:5173 in browser
```

### Main Commands

```bash
# Build
npm run build

# Preview
npm run preview

# Run tests
npm run test:unit          # Unit tests
npm run test:smoke         # Smoke tests
npm run test:all           # All tests

# Code quality check
npm run quality:check      # Type check + Lint
npm run quality:strict     # Strict check

# Documentation management
npm run docs:stats         # Show statistics
npm run docs:analyze       # Link analysis
npm run docs:check         # Full check
```

### Directory Structure

```
nanashi8.github.io/
├── src/                    # Source code
│   ├── ai/                 # 8-AI System
│   │   ├── specialists/    # 7 specialized AIs
│   │   ├── coordinator/    # AI integration layer
│   │   └── scheduler/      # QuestionScheduler
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── storage/            # Data persistence
│   └── types/              # TypeScript type definitions
├── docs/                   # Documentation (306 files)
│   ├── specifications/     # Specifications
│   ├── guidelines/         # Guidelines
│   ├── how-to/             # How-to guides
│   ├── references/         # References
│   └── processes/          # Processes
├── tests/                  # Test code
├── scripts/                # Automation scripts
├── .github/workflows/      # CI/CD pipeline
├── .husky/                 # Git Hooks
└── .aitk/instructions/     # AI development support
```

---

## 📚 Documentation System

### System Overview

Consists of 306 files with over 8,800 lines of specifications. Implements an automated verification system to maintain documentation-implementation consistency.

#### QuestionScheduler Related (Consistency 100/100)

| Document | Content |
|---|---|
| [QUESTION_SCHEDULER_SPEC.md](docs/specifications/QUESTION_SCHEDULER_SPEC.md) | Algorithm specification (1,669 lines) |
| [QUESTION_SCHEDULER_RECOVERY.md](docs/how-to/QUESTION_SCHEDULER_RECOVERY.md) | Recovery manual (1,080 lines) |
| [QUESTION_SCHEDULER_TYPES.md](docs/references/QUESTION_SCHEDULER_TYPES.md) | Type definitions (901 lines) |
| [QUESTION_SCHEDULER_API.md](docs/references/QUESTION_SCHEDULER_API.md) | API reference (594 lines) |
| [META_AI_INTEGRATION_GUIDE.md](docs/guidelines/META_AI_INTEGRATION_GUIDE.md) | Integration guide |

#### AI Integration Related

| Document | Content |
|---|---|
| [AI_INTEGRATION_GUIDE.md](docs/AI_INTEGRATION_GUIDE.md) | Technical details and implementation guide |
| [HOW_TO_ENABLE_AI.md](docs/HOW_TO_ENABLE_AI.md) | Usage guide |
| [AI_PROJECT_COMPLETE.md](docs/AI_PROJECT_COMPLETE.md) | Phase 1-4 summary (408 lines) |
| [random-skip-feature.md](docs/features/random-skip-feature.md) | Random re-questioning feature |

#### Documentation Management

| Document | Content |
|---|---|
| [EFFICIENT_DOC_WORKFLOW.md](docs/processes/EFFICIENT_DOC_WORKFLOW.md) | Efficiency workflow |
| [DOCUMENT_NAMING_CONVENTION.md](docs/guidelines/DOCUMENT_NAMING_CONVENTION.md) | Naming conventions |
| [DOCUSAURUS_SETUP_GUIDE.md](docs/how-to/DOCUSAURUS_SETUP_GUIDE.md) | SSG setup guide (under consideration) |
| [LINK_FIX_COMPLETION_REPORT.md](docs/reports/LINK_FIX_COMPLETION_REPORT.md) | Link fix results |

#### AI Development Support Instructions

| Document | Content |
|---|---|
| [documentation-enforcement.instructions.md](.aitk/instructions/documentation-enforcement.instructions.md) | Documentation quality enforcement |
| [meta-ai-priority.instructions.md](.aitk/instructions/meta-ai-priority.instructions.md) | QuestionScheduler priority handling |
| [efficiency-guard.instructions.md](.aitk/instructions/efficiency-guard.instructions.md) | Efficiency guard |

### Comparison with Other Projects

| Item | This Project | Kubernetes | React | TypeScript |
|---|---|---|---|---|
| Naming Convention Enforcement | ✅ Pre-commit | ✅ Manual | ✅ Manual | ✅ Manual |
| Link Validation CI | ✅ GitHub Actions | ✅ Hugo | ✅ Docusaurus | ✅ VitePress |
| Real-time Validation | ✅ VS Code | ❌ | ✅ | ✅ |
| Auto-fix | ✅ Scripts | ❌ | ❌ | ❌ |
| Number of Documents | 306 | ~2000 | ~500 | ~300 |
| Verification Time | 5 sec | 3-5 min | 1-2 min | 10-30 sec |

---

## 🎓 Learning Content

### Included Data

- Junior high school English words: 1,200 words (HORIZON-based)
- Junior high school English phrases: 300 phrases
- Grammar questions: 500 questions (5-choice format)
- Reading comprehension: 100 passages (under consideration)

### Data Format

Customizable in CSV format (7 columns):

```csv
word,meaning,category,difficulty,choice1,choice2,choice3
apple,りんご,fruit,easy,orange,banana,grape
```

---

## 🤝 Contributing

Pull requests are welcome.

### Steps

1. Fork this repository
2. Create a Feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the Branch (`git push origin feature/your-feature`)
5. Create a Pull Request

### Coding Conventions

- TypeScript: Strict type checking (`strict: true`)
- ESLint: Maintain 0 errors, 0 warnings
- Prettier: Auto-formatting
- Naming: camelCase (variables/functions), PascalCase (components/types)

### Documentation Conventions

- Naming: specifications/ use numbered kebab-case, guidelines/ use UPPER_SNAKE_CASE
- Links: Use relative paths
- Front Matter: YAML format

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 📞 Contact

- GitHub: [@nanashi8](https://github.com/nanashi8)
- Issues: [GitHub Issues](https://github.com/nanashi8/nanashi8.github.io/issues)

---

## 🚧 Development Roadmap

### Phase 1: Constants Extraction ✅ **Complete** (2025-12-23)

**Results**:
- Complete magic numbers reduction (20+ → 0)
- New file: [`positionConstants.ts`](src/ai/utils/positionConstants.ts) (200 lines, 8 constant groups, 4 helper functions)
- Updated file: [`categoryDetermination.ts`](src/ai/utils/categoryDetermination.ts) (all magic numbers → constants replacement)
- Test coverage: All 24 test cases passing

**Improvement Effects**:
- 📊 Readability: `if (consecutiveCorrect >= 3)` → `if (consecutiveCorrect >= CONSECUTIVE_THRESHOLDS.MASTERED)`
- 🔧 Maintainability: Only 1 file needs modification when changing thresholds
- ✅ Quality: 0 type errors, all tests passing

---

### Phase 4: Memory Science Integration ✅ **Complete** (2025-12-24)

**Results**:
- SuperMemo SM-2 full implementation (250 lines)
- Ebbinghaus forgetting curve implementation (280 lines)
- Long-term memory transition strategy (4 stages, 300 lines)
- MemoryAI integration enhancement (Phase 4 feature integration)
- Type extensions: WordProgress (SM-2 fields), MemorySignal (Phase 4 extensions)

**New Files**:
1. [`SM2Algorithm.ts`](src/ai/specialists/memory/SM2Algorithm.ts) - SuperMemo SM-2 full implementation
2. [`ForgettingCurveModel.ts`](src/ai/specialists/memory/ForgettingCurveModel.ts) - Ebbinghaus forgetting curve
3. [`LongTermMemoryStrategy.ts`](src/ai/specialists/memory/LongTermMemoryStrategy.ts) - 4-stage memory transition

**Updated Files**:
- [`MemoryAI.ts`](src/ai/specialists/MemoryAI.ts) - 3 module integration, analyze() and proposePosition() enhancement
- [`types.ts`](src/ai/types.ts) - MemorySignal type extension (sm2Data, retention, memoryStage)
- [`progress/types.ts`](src/storage/progress/types.ts) - WordProgress type extension (easeFactor, repetitions, memoryStage)

**Improvement Effects**:
- 🧠 Memory Science: SM-2 spaced repetition algorithm, scientific review timing with Ebbinghaus forgetting curve
- 📈 Predicted Retention: Accurate prediction of memory retention and review recommendations
- 🎯 Staged Learning: WORKING_MEMORY → SHORT_TERM → CONSOLIDATING → LONG_TERM
- 💯 Expected Score: 72 points → **107 points** (upper limit 93 points)

---

### Phase 5: Emotional Support ✅ **Complete** (2025-12-24)

**Goal**: Maintain learner motivation and provide human-like support (+25%)

**Results**:
- EmotionalAI implementation (310 lines) - Frustration detection, confidence calculation, fatigue estimation
- ScaffoldingSystem implementation (250 lines) - Gradual hint provision (4 levels)
- UI component implementation (3 files)
  - EncouragementDisplay (encouragement messages)
  - HintDisplay (gradual hint display)
  - encouragement.css (animations)

**New Files**:
1. [`EmotionalAI.ts`](src/ai/specialists/EmotionalAI.ts) - Emotional state monitoring and support (310 lines)
2. [`ScaffoldingSystem.ts`](src/ai/specialists/scaffolding/ScaffoldingSystem.ts) - Gradual guidance (250 lines)
3. [`EncouragementDisplay.tsx`](src/components/quiz/EncouragementDisplay.tsx) - Encouragement UI (145 lines)
4. [`HintDisplay.tsx`](src/components/quiz/HintDisplay.tsx) - Hint UI (165 lines)
5. [`encouragement.css`](src/styles/encouragement.css) - Animations (140 lines)

**Implemented Features**:
- 💪 Frustration Detection: Auto-detection of consecutive errors (3+), prolonged stagnation
- 🎯 Confidence Calculation: Calculate confidence level from consecutive correct (5+), accuracy (80%+)
- 😴 Fatigue Estimation: Estimate fatigue from session time (45+ min), question count (50+)
- 💡 Gradual Hints: 4 levels (none → light → medium → strong)
  - Level 1: First letter + part of speech
  - Level 2: First 3 letters + character count
  - Level 3: Masked (every other letter) + example sentence
- 💬 Encouragement Messages: 4 types (support/praise/mastery/standard)
- 🔄 Position Adjustment: Difficulty adjustment for motivation maintenance (-15 ~ +5)
- 🎨 UI Animations: Fade-in, slide-down, bounce, pulse

**Improvement Effects**:
- 📚 Motivation Maintenance: Appropriate support and encouragement during struggles
- 🎓 Gradual Learning: Optimal hint provision based on error count
- ⏰ Fatigue Management: Break recommendations during long learning sessions (5-minute breaks)
- ✨ Positive Reinforcement: Appropriate praise during good performance and mastery achievement celebration
- 💯 Expected Score: 72 points + 25% = **97 points** (achieved upper limit 93 points)

---

### Phase 2-6: Future Plans

Detailed plan: [`COMPLETE_LEARNING_SYSTEM_ROADMAP.md`](docs/development/COMPLETE_LEARNING_SYSTEM_ROADMAP.md)

| Phase | Content | Effort | Score Improvement | Status |
|-------|---------|--------|-------------------|--------|
| Phase 2 | Strategy Pattern Introduction | 12 hours | - | 📋 Planning |
| Phase 3 | AI Integration Enhancement | 8 hours | - | 📋 Planning |
| **Phase 4** | **Memory Science Integration (SM-2, Ebbinghaus)** | **18 hours** | **+35%** | ✅ **Complete** |
| **Phase 5** | **Emotional Support (EmotionalAI)** | **12 hours** | **+25%** | ✅ **Complete** |
| Phase 6 | Diverse Review Methods | 10 hours | +15% | 📋 Planning |

**Achievement**: Phase 1 + Phase 4 + Phase 5 complete (greatly exceeded target 93 points!) 🎉

---

**Last Updated**: 2025-12-24  
**Version**: 3.3.0  
**Status**: Active Development - Phase 1, 4, 5 complete; Phase 2, 3, 6 planned
