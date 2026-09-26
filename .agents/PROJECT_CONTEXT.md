---
description: RankPulse SEO Suite workspace architecture, component structure, state management, and conventions
always_on: true
---

# RankPulse Project Context & Guidelines

## Codebase Summary
RankPulse is a React 18 + Vite 5 + TypeScript + Tailwind CSS application providing an end-to-end SEO management dashboard.

- **Main Navigation/Router**: [`src/components/dashboard/dashboard.tsx`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/components/dashboard/dashboard.tsx)
- **Global Context Providers**:
  - Auth: [`src/lib/auth-context.tsx`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/lib/auth-context.tsx)
  - Theme: [`src/components/theme-provider.tsx`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/components/theme-provider.tsx)
  - Modals: [`src/components/dashboard/modals/modal-provider.tsx`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/components/dashboard/modals/modal-provider.tsx)
- **Data Layer**: Centralized mock dataset in [`src/lib/seo-data.ts`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/lib/seo-data.ts)
- **Backend Blueprint**: [`BACKEND_SPECIFICATION.md`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/BACKEND_SPECIFICATION.md)

## Development Rules & Conventions
1. **Component Design System**: Use Radix UI primitives located in `src/components/ui/` styled with Tailwind utility classes and `cn()` from `@/lib/utils`.
2. **Icons**: Use `lucide-react` icons.
3. **Charts**: Use `recharts` responsive container wrappers with project design theme colors.
4. **Modals**: Modal state must be dispatched using `useModal()` hook from `ModalProvider`.
