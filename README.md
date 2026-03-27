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

## End-to-End Usage Manual

### 1. Initial Setup (First Launch)
When you first start the application and visit `http://localhost:3000`:
1. You will be greeted by the **CashAgent Lock Screen**.
2. **Setup Mode**: Because no PIN exists in the database yet, the app asks you to "Create a new 4-digit PIN".
3. Tap 4 numbers on the on-screen keypad.
4. **Confirm Mode**: The app will then ask you to "Confirm your new PIN". Tap the exact same 4 numbers again.
5. If they match, your secure PIN is saved, and you are immediately navigated to the **Dashboard**.

### 2. Daily Access (Verification)
Whenever you return to the app or log out:
1. The app detects a PIN is already set and enters **Verify Mode**.
2. Tap your 4-digit PIN on the keypad.
3. **Success**: You are granted access to the Dashboard.
4. **Failure**: The four dots shake visually, the input clears, and you must try again.

### 3. Managing Transactions
Once inside the Dashboard, you can track your money:
- **Deposit**: Select the green "Deposit" toggle. Enter the amount (e.g., `1500.00`), write a description (e.g., "Salary"), pick a matching category, and click **Submit Deposit**. The Total In and Current Balance instantly increase.
- **Withdraw**: Select the red "Withdraw" toggle. Enter the amount, description, and category. Click **Submit Withdrawal**. If the amount exceeds your current balance, the app safely blocks the transaction with an error. Otherwise, it processes and lowers your Current Balance.

### 4. Viewing and Voiding
- **History**: Scroll the panel on the right (or bottom on mobile) to see your transactions ordered by most recent first.
- **Voiding**: Made a mistake? Click the small trash icon next to a transaction.
- **Confirmation**: A browser prompt asks "Are you sure you want to void this transaction?". Click **OK**.
- The transaction crosses out, receives a "Voided" badge, and your Current Balance recalculates automatically as if the transaction never happened.
- *(Note: If voiding a deposit drops your balance below zero, the Current Balance safely highlights in red with a "Negative" warning badge).*

### 5. Locking the App
When you are done, click the **Lock / Logout** icon at the top right of the Header. Your active session is cleared locally, and you are safely returned to the PIN lock screen.
