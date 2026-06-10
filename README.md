# Asset Tracker

A comprehensive application for tracking physical assets including office appliances and vehicles. 

## Features
- Complete tracking of assets, locations, and cost centers.
- Detailed management of specific asset types like Office Appliances and Vehicles.
- Role-based Access Control (RBAC) and NextAuth authentication.
- Asset status change approval workflow (HRGA & Finance approvals).
- Discrepancy and Odometer logging.

## Tech Stack
- **Framework**: Next.js, React
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (using `@electric-sql/pglite` for tests)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js
- **Storage**: `@vercel/blob` for file uploads
- **Testing**: Node Test Runner, Playwright
- **Other**: `qrcode` for QR code generation, `sonner` for toast notifications.

## Directory Structure
```
asset-tracker/
├── .env.example          # Example environment variables
├── .env.local            # Local environment variables
├── drizzle.config.ts     # Drizzle ORM configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and scripts
├── playwright.config.ts  # Playwright E2E test configuration
├── public/               # Static public assets
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   └── db/               # Database schema, migrations, and seed scripts
└── tests/                # Test files
```

## Database Schema
The database uses a relational model with the following core entities:
- **Core Entities**: `locations`, `cost_centers`, `assets`
- **Asset Subtypes**: `office_appliances`, `vehicles`
- **Logs**: `odometer_logs`, `discrepancy_logs`
- **Authentication & RBAC**: `users`, `accounts`, `sessions`, `roles`, `permissions`, `role_permissions`, `user_roles`
- **Workflows**: `status_change_requests` (approval workflow for asset status changes)

## Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL Database

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables by copying `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required database and authentication credentials.

3. Seed the database with initial data (optional but recommended for development):
   ```bash
   npm run db:seed
   ```

### Running the App
Start the Next.js development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Building for Production
Create an optimized production build:
```bash
npm run build
npm start
```

## Testing
The application uses the Node.js test runner for unit/integration tests and is configured for isolated database testing.

Run the test suite:
```bash
npm test
```
