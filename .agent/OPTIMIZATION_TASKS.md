# Lab-IQ Platform Optimization Task

## Objectives
- [x] **Step 1: Core Architecture Upgrade (OOP/DI)**
    - [x] Define Interfaces (`src/core/interfaces.ts`)
    - [x] Implement Concrete Services (`src/core/services.ts`)
    - [x] Create Service Provider (`src/core/ServiceProvider.tsx`)
- [x] **Step 2: Performance & Resilience**
    - [x] Create `LoadingSpinner` component.
    - [x] Create `GlobalErrorFallback` component.
    - [x] Install `react-error-boundary`.
    - [x] Refactor `App.tsx` to use `React.lazy`, `Suspense`, and `ServiceProvider`.
- [ ] **Step 3: Migrate Components to New Services**
    - [ ] Refactor `Upload.tsx` to use `useServices`.
    - [ ] Refactor `AuthGuard.tsx` to use `authService`.
- [ ] **Step 4: Testing**
    - [ ] Setup Vitest.
    - [ ] Write integration test for Upload flow.

## Notes
- `App.tsx` is now fully lazy-loaded. This should improve initial load time significantly.
- An Error Boundary now protects the app from crashing completely.
- The `ServiceProvider` is available at the root level.
