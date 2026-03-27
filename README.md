# CashAgent

CashAgent is a sleek, beautiful, and secure personal finance tracker built to manage your daily transactions. Set a secure PIN buffer, record your deposits and withdrawals cleanly, and monitor your total flow efficiently without any clutter.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Lucide React
- **Backend API**: Next.js API Routes, Drizzle ORM
- **Database**: Neon (Serverless PostgreSQL)
- **Security**: `bcryptjs` hashing for PIN validation alongside `sessionStorage` state-guards.

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd CashAgent
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure the Database Context**
   Create a `.env.local` file in your root environment and securely supply your Neon Connection string:
   ```env
   DATABASE_URL="postgresql://user:password@endpoint.neon.tech/dbname"
   ```
4. **Push Schema via Drizzle**
   Automatically map and initialize the `transactions` and `settings` tables:
   ```bash
   npx drizzle-kit push
   ```
   *(Or execute the `src/db/schema.ts` tables natively through the SQL editor on Neon)*
5. **Start Developer Server**
   ```bash
   npm run dev
   ```
6. **Open the App**
   Navigate locally to `http://localhost:3000`. Set your initial PIN securely, then jump right into your secure financial dashboard!

## PIN Security Concept
CashAgent utilizes server-side hashing through `bcryptjs` to encrypt your root 4-digit PIN against raw database access. Upon seamless runtime validation logic, authentication drops a time-sensitive flag locally mapped to strict `sessionStorage`. All nested dashboards enforce mounting checks automatically rejecting and redirecting guests without valid authorizations backward naturally!

## Core Folder Structure
- `src/app/page.tsx` - PIN lock screen guarding dashboard access.
- `src/app/dashboard/page.tsx` - The full dashboard, analytics cards, and input logs.
- `src/app/api/` - Complete transaction REST endpoints (GET, POST, PATCH).
- `src/db/schema.ts` - Drizzle data structures mapping our Postgres layout.
