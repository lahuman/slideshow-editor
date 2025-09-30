# Phase 0: Research & Decisions

This document records the decisions made to resolve ambiguities identified in the planning phase.

## 1. Testing Framework

- **Decision**: `Vitest` will be used as the primary testing framework.
- **Rationale**: As a Vite-native testing framework, Vitest offers a fast, modern, and integrated testing experience. It shares a similar API with Jest, which lowers the learning curve, and its performance is superior in a Vite environment.
- **Alternatives considered**: `Jest`. While popular, it requires more configuration to work seamlessly with Vite.

## 2. Performance Goals

- **Decision**:
  - **UI Interaction**: All UI interactions, including dragging, resizing, and animations, must maintain a consistent 60 FPS.
  - **Project Load Time**: A standard project (e.g., 50 slides, 10MB total image assets) should load and become interactive within 500ms on a modern browser and a standard internet connection.
- **Rationale**: These goals ensure a fluid and responsive user experience, which is critical for a creative editing tool.

## 3. Technical Constraints

- **Decision**:
  - **Maximum Image Upload Size**: 10MB per image.
  - **Image Handling**: Images larger than 4K resolution (3840x2160) will be downscaled for canvas rendering to conserve memory, but the original file will be used for export if possible.
  - **Timeline Limits**: The timeline is limited to a maximum of 100 slides for the initial version.
- **Rationale**: These constraints are set to prevent performance degradation and ensure application stability while still providing ample creative freedom for most use cases.

## 4. MVP Scope Definition

- **Decision**: The Minimum Viable Product (MVP) will focus on the core user story of creating and exporting a slideshow. The scope includes:
  - **Core Features**: All functional requirements from FR-001 to FR-007 as defined in `spec.md`.
  - **Out of Scope for MVP**: 
    - **FR-008 (Project Import)**: While a logical counterpart to export, import will be deferred to a post-MVP release to simplify the initial build.
    - **Advanced Features**: Multi-select, grouping, undo/redo history, and advanced transition effects are not part of the MVP.
- **Rationale**: This tight scope allows for faster delivery of the core value proposition, enabling users to create and share slideshows, while deferring complexity to future iterations.
