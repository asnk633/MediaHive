# MediaHive Mobile App — Architecture Rules

# Philosophy

The architecture of MediaHive must prioritize:

* scalability,
* maintainability,
* modularity,
* stability,
* performance,
* offline resilience,
* and long-term production readiness.

The app must NOT be built like a prototype.

Every architectural decision must support:

* future expansion,
* clean code organization,
* reusable systems,
* and predictable behavior.

---

# Core Principles

## 1. Separation of Concerns

Strictly separate:

* UI Layer
* State Management Layer
* Business Logic Layer
* Data Layer
* Networking Layer
* Local Storage Layer

Never mix responsibilities.

Examples:

* UI widgets must not contain API logic.
* Repositories must not contain UI logic.
* Services must not manipulate widgets directly.

---

# Recommended Architecture

Use a clean scalable architecture structure.

Recommended flow:

UI → Controller/ViewModel → Repository → Data Source → API/Database

---

# Folder Structure Rules

Organize code by feature-first architecture.

Recommended structure:

lib/
├── core/
├── config/
├── shared/
├── services/
├── features/
├── data/
├── domain/
├── presentation/
├── widgets/
├── theme/
├── routing/
├── storage/
├── utils/

Each feature must contain:

* models
* repositories
* providers/controllers
* screens
* widgets
* services

Avoid giant shared files.

---

# State Management Rules

Use a scalable state management solution consistently.

Recommended:

* Riverpod
* Bloc
* Cubit

Avoid mixing multiple state systems unnecessarily.

---

## State Rules

State must:

* be predictable,
* isolated,
* testable,
* and reusable.

Avoid:

* deeply nested state,
* excessive global state,
* and rebuilding entire screens unnecessarily.

---

# UI Layer Rules

UI widgets must remain:

* lightweight,
* reusable,
* and presentation-focused.

Widgets should NOT:

* call APIs directly,
* perform heavy logic,
* manage complex business rules,
* or directly access databases.

UI should only:

* render state,
* handle interactions,
* and trigger actions.

---

# Business Logic Rules

Business logic belongs in:

* controllers,
* services,
* use cases,
* or repositories.

Never inside widgets.

Business rules must be centralized and reusable.

---

# Repository Rules

Repositories act as the single source of truth between:

* app logic,
* local storage,
* and remote APIs.

Repositories must:

* abstract data sources,
* support caching,
* support offline mode,
* and normalize responses.

UI must never know where data comes from.

---

# Networking Rules

All API communication must go through centralized API clients.

Requirements:

* centralized interceptors,
* retry handling,
* auth token management,
* request logging,
* error normalization,
* timeout handling,
* and network monitoring.

Avoid scattered API calls.

---

# Offline-First Architecture

The app should function gracefully even with unstable internet.

Implement:

* local caching,
* sync queues,
* optimistic updates,
* retry mechanisms,
* and offline indicators.

The app should feel resilient.

---

# Error Handling Rules

Never expose raw backend errors to users.

Centralize:

* exception handling,
* error parsing,
* and fallback behavior.

All layers should return predictable error objects.

---

# Logging Rules

Implement centralized logging.

Separate:

* debug logs,
* analytics logs,
* crash reporting,
* and network logs.

Avoid random print statements.

Use structured logging.

---

# Dependency Injection Rules

Use dependency injection consistently.

Recommended:

* Riverpod DI
* GetIt
* Injectable

Avoid manually instantiating services throughout the app.

---

# Reusability Rules

If UI or logic is repeated more than twice:

* extract it,
* centralize it,
* and reuse it.

Avoid duplicated components and duplicated business logic.

---

# Component Architecture Rules

Shared UI components should exist for:

* buttons,
* inputs,
* cards,
* dialogs,
* loaders,
* app bars,
* sheets,
* snackbars,
* and list items.

Avoid creating slightly different versions repeatedly.

---

# Theme Architecture Rules

Theming must be centralized.

Support:

* dark theme,
* light theme,
* dynamic colors if needed,
* and consistent token usage.

Never hardcode colors inside widgets.

---

# Navigation Architecture Rules

Use centralized routing.

Recommended:

* GoRouter
* AutoRoute

Requirements:

* deep linking support,
* auth-aware routing,
* role-based access,
* predictable navigation,
* and route guards.

Avoid scattered Navigator.push logic everywhere.

---

# Authentication Rules

Authentication must be centralized.

Requirements:

* persistent session handling,
* token refresh handling,
* role-aware access,
* secure logout,
* and auth state restoration.

Never duplicate auth logic.

---

# Database & API Rules

All backend models must:

* be typed,
* validated,
* serializable,
* and version-safe.

Avoid loosely typed maps throughout the app.

Use:

* freezed
* json_serializable

where appropriate.

---

# Performance Rules

Performance is mandatory.

Optimize:

* rebuilds,
* rendering,
* memory usage,
* image loading,
* list virtualization,
* caching,
* and animation performance.

Avoid:

* unnecessary rebuilds,
* deep widget trees,
* blocking UI thread work,
* and excessive state listeners.

---

# Animation Architecture Rules

Animations must:

* be centralized where reusable,
* optimized,
* and subtle.

Avoid random animation implementations.

Create reusable animation utilities.

---

# Security Rules

Never expose:

* API keys,
* secrets,
* tokens,
* or sensitive configuration in code.

Use:

* secure storage,
* environment configs,
* and proper auth validation.

---

# Environment Rules

Support multiple environments:

* development
* staging
* production

Environment configuration must be centralized.

---

# File Naming Rules

Use consistent naming conventions.

Recommended:

* snake_case for files
* PascalCase for classes
* camelCase for variables

Avoid inconsistent naming styles.

---

# Testing Rules

Critical business logic must be testable.

Support:

* unit tests,
* widget tests,
* and integration tests.

Architecture should not make testing difficult.

---

# Scalability Rules

All systems must support future expansion.

Avoid:

* tightly coupled modules,
* giant controllers,
* giant widgets,
* giant repositories,
* and monolithic architecture.

Keep systems modular.

---

# AI Agent Rules

Before generating code, always:

1. inspect existing architecture,
2. follow existing patterns,
3. reuse existing systems,
4. avoid duplicate implementations,
5. and preserve consistency.

Never generate isolated architecture patterns that conflict with the existing codebase.

---

# Architecture Audit Rules

After major feature generation:

* audit folder structure,
* audit state consistency,
* audit duplicated logic,
* audit performance risks,
* audit scalability,
* and audit dependency flow.

Refactor if architecture quality declines.

---

# Final Engineering Standard

The codebase must feel:

* intentional,
* scalable,
* clean,
* modular,
* production-grade,
* and maintainable by a long-term engineering team.

The goal is NOT rapid code generation.

The goal is a stable long-term production application.
