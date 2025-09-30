# Implementation Plan: 웹 기반 슬라이드쇼 편집기

**Branch**: `001-json-ui` | **Date**: 2025년 9월 30일 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/pc00082708/DEV/slideshow-editor/specs/001-json-ui/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary
웹 기반 슬라이드쇼 편집기를 구현합니다. 사용자는 이미지를 업로드하고, 타임라인에 배치하여 순서와 시간을 조절할 수 있습니다. 각 슬라이드의 크기, 위치, 회전 등 속성을 편집하고 전환 효과를 설정할 수 있으며, 최종 결과물은 JSON 형식으로 내보내거나 불러올 수 있습니다. React, TypeScript, Vite 기반의 단일 페이지 애플리케이션으로 개발합니다.

## Technical Context
**Language/Version**: TypeScript
**Primary Dependencies**: React, Vite, @dnd-kit/core, react-draggable, react-icons
**Storage**: N/A (JSON export/import is file-based)
**Testing**: [NEEDS CLARIFICATION: Testing framework not specified, vitest is recommended for Vite projects.]
**Target Platform**: Web Browser
**Project Type**: single project (frontend only)
**Performance Goals**: [NEEDS CLARIFICATION: e.g., smooth 60fps during animations, <500ms for large project loads]
**Constraints**: [NEEDS CLARIFICATION: e.g., max image size, max number of slides]
**Scale/Scope**: [NEEDS CLARIFICATION: e.g., target number of concurrent users, complexity of projects to support]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

(No constitution defined yet, skipping check)

## Project Structure

### Documentation (this feature)
```
specs/001-json-ui/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── components/
│   ├── ImageLibrary.tsx
│   ├── Timeline.tsx
│   ├── ImageCanvas.tsx
│   ├── ControlPanel.tsx
│   └── PreviewModal.tsx
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

**Structure Decision**: The project is a single-page frontend application. The existing `src` directory structure will be used and expanded upon. New components will be added to `src/components`, and type definitions will be centralized in `src/types/index.ts`.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - Research task: Determine the best testing framework for a Vite + React + TypeScript project (e.g., Vitest vs. Jest).
   - Research task: Define performance goals (e.g., target FPS, load times).
   - Research task: Establish reasonable constraints (e.g., max image upload size, timeline length).
   - Research task: Define the scope for the initial MVP.

2. **Generate and dispatch research agents**: N/A for this workflow.

3. **Consolidate findings** in `research.md`.

**Output**: `research.md` with all NEEDS CLARIFICATION resolved.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`.
2. **Generate API contracts**: N/A for frontend-only project.
3. **Generate contract tests**: N/A.
4. **Extract test scenarios** from user stories → `quickstart.md`.
5. **Update agent file incrementally**: Run `.specify/scripts/bash/update-agent-context.sh gemini`.

**Output**: `data-model.md`, `quickstart.md`, `GEMINI.md`.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Generate tasks from Phase 1 design docs (`data-model.md`, `quickstart.md`).
- Each component in the architecture will have a creation task.
- Each type definition in the data model will have a task.
- User stories from the spec will be translated into high-level feature implementation tasks.

**Ordering Strategy**:
- Dependency order: Types -> Components -> App integration.
- Mark [P] for parallel execution (e.g., independent components).

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [X] Phase 0: Research complete (/plan command)
- [X] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [X] Initial Constitution Check: PASS (skipped)
- [X] Post-Design Constitution Check: PASS
- [X] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented