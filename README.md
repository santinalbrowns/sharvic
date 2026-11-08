# Sharvic Village Banking System

**100% Complete Implementation** ✅

Web and Mobile application for Sharvic Micro-Finance Group to manage members, savings, loans, repayments, expenses and comprehensive financial reports.

## Tech Stack
- **Database:** SQLite (via better-sqlite3 + Drizzle ORM)
- **Backend/API:** Node.js + Express + TypeScript
- **Web App:** Next.js 15 + TypeScript + Tailwind CSS
- **Mobile App:** Flutter (Complete implementation)

## Project Structure
```
sharvic-village-banking/
├── apps/
│   ├── api/         # REST API (http://localhost:4000)
│   ├── web/         # Next.js Admin Dashboard (http://localhost:3000)
│   └── mobile/      # Flutter Member App (Complete)
└── packages/
    ├── db/          # Drizzle schema & SQLite connection
    ├── types/
    ├── utils/
    └── config/
```

## Quick Start

### 1) Install dependencies
```bash
cd sharvic-village-banking
npm install
```

### 2) Setup database
```bash
cd packages/db
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3) Run API
```bash
cd apps/api
cp .env.example .env
npm install
npm run dev
```

### 4) Run Web App
```bash
cd apps/web
npm install
npm run dev
```

### 5) Create first admin user (via API)
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Admin User","email":"admin@sharvic.com","password":"admin123","role":"admin"}'
```

Login at http://localhost:3000/login with those credentials.

## Features

### Core Banking Operations
- ✅ Member registration (Members & Non-Members), membership fees (K50,000)
- ✅ Monthly contributions (K45,000) & savings tracking
- ✅ Loan applications with guarantors (Member 10% / Non-Member 20%)
- ✅ Loan disbursement & repayment tracking
- ✅ Expenses tracking with approvals
- ✅ Role-based access control (Admin, Chairperson, Treasurer, Loan Officer, Secretary)
- ✅ Comprehensive audit logging

### Advanced Features (NEW ✨)
- ✅ **Credit Score Calculation** (0-100 scale with 5 factors)
- ✅ **Loan Eligibility Checking** (automated pre-approval assessment)
- ✅ **Penalty Management** (2% per week for late payments)
- ✅ **Loan Repayment Schedules** (installment-based tracking)
- ✅ **Balance Sheet** (Assets, Liabilities, Equity)
- ✅ **Income Statement** (Profit & Loss analysis)
- ✅ **General Ledger** (Complete transaction history)
- ✅ **Cash Flow Statement** (Operating & Financing activities)

### Mobile Application (NEW ✨)
- ✅ **Member Authentication** (Secure login with JWT)
- ✅ **Loan Management** (View, Apply, Track repayments)
- ✅ **Eligibility Checker** (Real-time credit assessment)
- ✅ **Savings Tracker** (Balance & contribution history)
- ✅ **Credit Score Display** (Visual credit health indicator)
- ✅ **Member Profile** (Personal info & membership status)

### 5) Run Mobile App (NEW)
```bash
cd apps/mobile
flutter pub get
# Update API URL in lib/services/api_service.dart
flutter run
```

## Financial Reports

### Access Reports
- Balance Sheet: http://localhost:3000/reports/balance-sheet
- Income Statement: http://localhost:3000/reports/income-statement
- General Ledger: http://localhost:3000/reports/general-ledger

### Credit Scoring System
Members are scored on a 0-100 scale based on:
- **Repayment History** (40 points) - Completed vs defaulted loans
- **Outstanding Loans** (20 points) - Number of active loans
- **Savings Consistency** (20 points) - Regular contributions
- **Membership Duration** (10 points) - Length of membership
- **Guarantor History** (10 points) - History as guarantor

### Loan Eligibility Criteria
- ✅ Active member status
- ✅ Maximum 2 active loans
- ✅ Credit score ≥ 40
- ✅ No defaulted loans
- ✅ Minimum 3 months contributions

## Implementation Status

**Project Completion: 100%** ✅

All requirements from the project proposal have been implemented:
- ✅ Member & loan management
- ✅ Savings & expense tracking
- ✅ Financial reports (Balance Sheet, Income Statement, General Ledger)
- ✅ Penalty & eligibility logic with credit scoring
- ✅ Complete Flutter mobile application
- ✅ Role-based access control & audit logging

See [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) for detailed implementation report.

## Notes
- All financial calculations (interest, penalties, credit scores) are handled server-side
- Automated penalty calculation: 2% per week for overdue payments
- Real-time eligibility checking prevents unqualified loan applications
- Complete transaction audit trail in general ledger
- Mobile app provides member self-service capabilities
