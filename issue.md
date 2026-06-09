# User Profile Header Dropdown

This plan details the implementation of a dynamic user profile dropdown to replace the static "GA & Finance System" pill in the header. It will display the logged-in user's name and primary role, and provide an option to log out.

## Proposed Changes

### NextAuth & Components

#### [NEW] UserDropdown.tsx (src/components/layout/UserDropdown.tsx)
- Create a new Client Component to handle dropdown state and user interactions.
- Accept the `user` object from the NextAuth session as a prop.
- Render the current emerald-themed pill containing the user's name and primary role (e.g., `John Doe (Admin)`).
- Implement a simple Tailwind CSS dropdown menu that toggles on click.
- Inside the dropdown, display the user's email for extra context, followed by a "Log out" button.
- The "Log out" button will invoke `signOut({ callbackUrl: '/login' })` imported from `next-auth/react`.

#### [MODIFY] page.tsx (src/app/page.tsx)
- Import the `auth` function from `src/auth.ts`.
- Make the `AdminDashboard` component `async` if it isn't already, and call `await auth()` to retrieve the current session.
- Pass `session?.user` to the new `<UserDropdown>` component.
- Replace the existing static `<div className="... bg-emerald-50 ..."> GA & Finance System </div>` markup with the new `<UserDropdown user={session?.user} />` component.

## Verification Plan

### Automated Tests
- Create a test file `tests/components/UserDropdown.test.tsx` (or similar depending on testing framework like Jest/React Testing Library) to verify the `<UserDropdown>` component.
- The test will verify:
  - The user's name and role are rendered correctly when provided.
  - The dropdown opens when clicked, revealing the user's email.
  - Clicking the "Log out" button correctly invokes the `signOut` function with the correct arguments.

### Manual Verification
1. Open `http://localhost:3000/`.
2. Verify that the header pill now dynamically shows the logged-in user's name and role instead of "GA & Finance System".
3. Click the pill to ensure the dropdown menu opens smoothly and displays the user's email and a logout button.
4. Click the "Log out" button.
5. Verify that the application successfully logs out the user and redirects to the `/login` page.
