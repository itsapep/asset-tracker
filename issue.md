# Authentication and RBAC UI Handler Implementation

This plan outlines the architecture and step-by-step implementation for handling authentication and Role-Based Access Control (RBAC) in the UI layer of the Next.js application.

This document is detailed specifically to guide a junior engineer or an AI agent to execute the implementation with zero ambiguity.

## User Review Required

> [!IMPORTANT]  
> Please review this highly detailed plan. It includes specific file paths, configuration strings, and component props to ensure the implementation is foolproof.

## Proposed Changes

### Phase 1: Configuration & Routing Protection

#### [NEW] `src/middleware.ts`
**Objective:** Protect all application routes and redirect unauthenticated users to `/login`.
**Implementation Details:**
- Import `NextAuth` and the existing configuration from `src/auth.config.ts`.
- Export the `auth` middleware from NextAuth.
- Add a Next.js `config` object with a `matcher` array that EXCLUDES specific public paths:
  - `matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"]`
- Ensure that the `login` route is explicitly excluded so unauthenticated users can actually reach the login page without entering an infinite redirect loop.

### Phase 2: Providers & Layout

#### [NEW] `src/components/providers/session-provider.tsx`
**Objective:** Provide NextAuth session context to all client components.
**Implementation Details:**
- Must include the `"use client";` directive at the top of the file.
- Import `SessionProvider` from `next-auth/react`.
- Create a wrapper component `AppSessionProvider` that accepts `children: React.ReactNode` and wraps them in `<SessionProvider>{children}</SessionProvider>`.

#### [MODIFY] `src/app/layout.tsx`
**Objective:** Integrate the `AppSessionProvider` into the application root layout.
**Implementation Details:**
- Import `AppSessionProvider` from `src/components/providers/session-provider.tsx`.
- Wrap the main application `{children}` inside the `<body>` tag with `<AppSessionProvider>`.
- Note: Keep `layout.tsx` as a Server Component.

### Phase 3: Client-Side Hooks & UI Components

#### [NEW] `src/lib/hooks/use-permissions.ts`
**Objective:** Provide a convenient client-side hook for checking permissions and roles.
**Implementation Details:**
- Must include `"use client";`.
- Use the `useSession` hook from `next-auth/react`.
- Extract `roles` and `permissions` from `session.data?.user` (Note: the types are configured in `src/types/next-auth.d.ts` and populated in `auth.config.ts`).
- Export an object containing:
  - `hasPermission(permission: string): boolean`
  - `hasAnyPermission(permissions: string[]): boolean`
  - `hasRole(role: string): boolean`
  - `isLoading: boolean` (derived from `session.status === "loading"`)

#### [NEW] `src/components/auth/RequirePermission.tsx`
**Objective:** A reusable wrapper component to conditionally hide UI elements (buttons, links, sections) from unauthorized users.
**Implementation Details:**
- Must include `"use client";`.
- **Props:**
  - `permissions: string | string[]`
  - `requireAll?: boolean` (default: false)
  - `fallback?: React.ReactNode` (default: null)
  - `children: React.ReactNode`
- **Logic:**
  - Call the `usePermissions()` hook.
  - While `isLoading` is true, either return `null` or a minimal skeleton.
  - Check if the user meets the permission requirements.
  - If authorized, return `children`.
  - If unauthorized, return the `fallback` prop.

### Phase 4: Login Page

#### [NEW] `src/app/login/page.tsx`
**Objective:** A beautiful, premium split-screen login page matching modern design aesthetics.
**Implementation Details:**
- **Layout Approach (Tailwind CSS):**
  - Use a full-screen grid: `min-h-screen grid grid-cols-1 lg:grid-cols-2`.
  - **Left Side (Branding):** 
    - A visually striking, premium background (e.g., gradient, abstract pattern, or high-quality image placeholder).
    - Display the application logo and a catchy subtitle.
    - Hidden on mobile devices (`hidden lg:flex`).
  - **Right Side (Form):**
    - A centered, sleek card-like form area.
    - Minimalist typography (Inter/Geist fonts).
- **Form Functionality:**
  - Must be a client component (`"use client";`) or utilize a client-side form component to handle state.
  - Includes standard `email` and `password` inputs with proper HTML validation and accessible labels.
  - **Submit Logic:** Prevent default form submission and call NextAuth's `signIn('credentials', { email, password, redirect: false })`.
  - Handle the response:
    - If `res?.error`, display a styled error toast or inline message (e.g., "Invalid credentials").
    - If successful, redirect the user to the dashboard `/` using Next.js `useRouter` or `window.location`.

## Verification Plan

### Automated Tests
- No new E2E tests are explicitly required for this phase unless requested, but ensure existing `dashboard.spec.ts` passes.
- (Optional) Write a unit test for `RequirePermission.tsx` mocking `useSession`.

### Manual Verification
1. Open a private browsing window.
2. Navigate to `http://localhost:3000/`.
3. Verify that the Next.js middleware intercepts the request and redirects to `http://localhost:3000/login`.
4. Enter invalid credentials and observe the error handling UI.
5. Enter valid credentials (e.g., `admin@example.com` and `password123`) and verify successful authentication and redirection back to the dashboard.
6. Verify that `RequirePermission` successfully hides and shows elements based on the current user's role.
