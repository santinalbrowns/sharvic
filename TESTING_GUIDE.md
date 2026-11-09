# Testing Guide - Sharvic Village Banking

Complete testing guide for all implemented features.

## Prerequisites

1. Database migrations applied
2. API server running (port 4000)
3. Web dashboard running (port 3000)
4. Admin user created

## Quick Test Setup

Run the automated seeding script:
```bash
node scripts/seed-test-data.js
```

This creates:
- 5 sample members
- Savings accounts with 6 months of contributions
- 3 loan applications
- 2 approved and disbursed loans
- Sample expenses

## Manual Testing Procedures

### 1. Financial Reporting Tests

#### Test Balance Sheet
**Objective:** Verify assets equal liabilities + equity

**Steps:**
1. Navigate to http://localhost:3000/reports/balance-sheet
2. Note the current date shown
3. Verify sections display:
   - Assets (Cash + Loans Receivable)
   - Liabilities (Member Savings)
   - Equity (Retained Earnings)
4. Check: Total Assets = Total Liabilities + Total Equity
5. Change date and click Refresh
6. Verify data updates correctly
7. Click Print to test print functionality

**Expected Results:**
- ✅ Balance sheet displays without errors
- ✅ All amounts are properly formatted (K #,###.##)
- ✅ Equation balances
- ✅ Print preview works

#### Test Income Statement
**Objective:** Calculate profit/loss for a period

**Steps:**
1. Navigate to http://localhost:3000/reports/income-statement
2. Set start date to beginning of year
3. Set end date to today
4. Click "Generate Report"
5. Verify sections:
   - Revenue (Interest Income + Membership Fees)
   - Expenses (Operating Expenses)
   - Net Income/Loss
6. Check profit margin calculation
7. Test different date ranges
8. Test print functionality

**Expected Results:**
- ✅ Report generates correctly
- ✅ Revenue and expenses show properly
- ✅ Net income = Revenue - Expenses
- ✅ Profit margin calculated correctly
- ✅ Color coding (green for profit, red for loss)

#### Test General Ledger
**Objective:** View all transactions with filtering

**Steps:**
1. Navigate to http://localhost:3000/reports/general-ledger
2. Note the transaction list loads
3. Test filters:
   - Select "Contributions" type
   - Set date range
   - Click "Generate Report"
4. Verify filtered results
5. Check totals at bottom (Debits + Credits)
6. Click "Clear Filters"
7. Test print functionality

**Expected Results:**
- ✅ All transactions display
- ✅ Filtering works correctly
- ✅ Debit/Credit columns accurate
- ✅ Balance column shows running balance
- ✅ Summary cards show correct totals

#### Test Cash Flow Statement
**Objective:** Analyze cash movements

**Steps:**
1. Navigate to http://localhost:3000/reports/cash-flow
2. Set period (start and end date)
3. Click "Generate Report"
4. Verify sections:
   - Operating Activities
   - Financing Activities
   - Net Cash Change
5. Check summary cards
6. Verify calculations

**Expected Results:**
- ✅ Operating and financing activities separated
- ✅ Net cash change = Operating + Financing
- ✅ Summary cards display correctly
- ✅ Color coding for positive/negative flows

### 2. Credit Score & Eligibility Tests

#### Test Credit Score Calculation
**Objective:** Verify automated scoring works

**API Test:**
```bash
curl -X GET http://localhost:4000/api/reports/credit-score/{memberId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "memberId": "...",
  "creditScore": 75
}
```

**Scoring Factors to Verify:**
- Member with completed loans: Higher score
- Member with defaults: Lower score
- Member with 6+ contributions: +20 points
- Active member 12+ months: +7-10 points

**Manual Calculation:**
1. Get member loan history
2. Count completed vs defaulted
3. Count contributions
4. Check membership duration
5. Verify score matches calculation

#### Test Loan Eligibility
**Objective:** Ensure proper eligibility checks

**Via Web Dashboard:**
1. Go to Loans → Apply for Loan
2. Select a member
3. Enter amount
4. Check eligibility result

**Via API:**
```bash
curl -X POST http://localhost:4000/api/loans/check-eligibility \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "memberId": "...",
    "requestedAmount": 500000
  }'
```

**Test Cases:**
- ✅ Eligible member: Score ≥40, <2 active loans, 3+ contributions
- ❌ New member: <3 contributions
- ❌ Overloaded: Already has 2 active loans
- ❌ Low score: Credit score <40
- ❌ Over limit: Requested amount exceeds score ÷ 100 × savings × 3
- ❌ Defaulter: Has unpaid defaulted loans

**Expected Results:**
```json
{
  "eligible": true/false,
  "reasons": ["array of reasons if not eligible"],
  "creditScore": 75,
  "savingsBalance": 100000,
  "loanToSavingsMultiplier": 3,
  "maxLoanAmount": 225000
}
```

### 3. Penalty System Tests

#### Test Penalty Calculation
**Objective:** Verify 2% per week penalty

**Setup:**
1. Create and disburse a loan
2. Wait or manually update schedule due date to past
3. Mark schedule as overdue

**Manual SQL Update (for testing):**
```sql
UPDATE loan_schedules 
SET dueDate = datetime('now', '-15 days'), 
    status = 'overdue'
WHERE loanId = 'LOAN_ID' AND installmentNumber = 1;
```

**Calculate Penalty:**
```bash
curl -X POST http://localhost:4000/api/loans/{loanId}/calculate-penalties \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
- 15 days overdue = 2 weeks
- Unpaid amount * 0.02 * 2 = penalty
- Penalty record created with status 'pending'

**Verify:**
1. Check loan details includes penalty
2. Verify penalty amount correct
3. Test penalty payment
4. Test penalty waiver

### 4. Loan Schedule Tests

#### Test Schedule Generation
**Objective:** Verify installment schedule creation

**Steps:**
1. Create a new loan application
2. Approve the loan
3. Disburse the loan
4. Fetch loan details

**API:**
```bash
curl -X GET http://localhost:4000/api/loans/{loanId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify Schedule:**
- Number of installments = termMonths
- Each installment has:
  - Principal due
  - Interest due
  - Total due
  - Due date (monthly intervals)
  - Status = 'pending'
- Sum of all installments = totalRepayable

**Example for K300,000 loan at 10% for 6 months:**
- Principal per month: K50,000
- Interest per month: K5,000
- Total per month: K55,000
- 6 installments

#### Test Payment Allocation
**Objective:** Verify payments allocate to schedule

**Steps:**
1. Get loan with schedule
2. Record payment of K55,000
3. Fetch updated loan details

**Expected:**
- First installment status = 'paid'
- principalPaid = K50,000
- interestPaid = K5,000
- totalPaid = K55,000
- paidAt timestamp set

**Test Partial Payment:**
1. Record payment of K30,000
2. Expected:
   - Installment status = 'partial'
   - Partially allocated to principal/interest
   - Remaining balance calculated

### 5. Mobile App Tests

#### Test Authentication
**Objective:** Verify member login works

**Steps:**
1. Open mobile app
2. Enter test credentials
3. Tap Login

**Expected:**
- ✅ Loading indicator shows
- ✅ Successful login navigates to dashboard
- ✅ Failed login shows error message
- ✅ Token stored securely

#### Test Dashboard
**Objective:** Verify main screen loads

**Verify:**
- ✅ Welcome message with member name
- ✅ Quick action cards display
- ✅ Navigation bar works
- ✅ Logout button works

#### Test Loan Features
**Objective:** Full loan workflow

**View Loans:**
1. Tap "Loans" tab
2. Verify loan list displays
3. Tap a loan
4. Verify details, schedule, repayments show

**Apply for Loan:**
1. Tap "Apply for Loan" tab
2. Enter amount: K500,000
3. Tap "Check Eligibility"
4. Verify credit score displays
5. If eligible:
   - Enter term: 12 months
   - Enter purpose: "Business expansion"
   - Tap "Submit"
6. Verify success message

**Expected:**
- ✅ Eligibility check shows real-time score
- ✅ Ineligible members see reasons
- ✅ Submit button disabled if not eligible
- ✅ Application submits successfully

#### Test Savings View
**Objective:** Verify savings display

**Steps:**
1. Tap "Savings" tab
2. Verify balance card shows
3. Scroll through contribution history

**Expected:**
- ✅ Total balance displayed prominently
- ✅ Account number shown
- ✅ Contribution history sorted by date
- ✅ Each contribution shows amount and receipt

#### Test Profile & Credit Score
**Objective:** Verify member info displays

**Steps:**
1. Tap "Profile" tab
2. Verify personal information
3. Check credit score card

**Expected:**
- ✅ Avatar with initials
- ✅ Full name and member number
- ✅ Credit score with color coding:
  - 80-100: Green (Excellent)
  - 60-79: Blue (Good)
  - 40-59: Orange (Fair)
  - 0-39: Red (Poor)
- ✅ Membership details correct

### 6. Integration Tests

#### Complete Loan Lifecycle
**Test full flow from application to completion**

1. **Member Creation**
   - Create new member
   - Record membership fee payment
   - Add 3+ monthly contributions

2. **Credit Building**
   - Wait or add historical contributions
   - Check credit score increases

3. **Loan Application**
   - Check eligibility (should pass)
   - Submit loan application
   - Add guarantor information

4. **Loan Processing**
   - Admin reviews application
   - Approve loan
   - Disburse loan
   - Verify schedule created

5. **Repayment Phase**
   - Record monthly payments
   - Verify schedule updates
   - Check outstanding balance decreases

6. **Late Payment**
   - Let payment go overdue
   - Calculate penalty
   - Verify penalty applied

7. **Loan Completion**
   - Complete all payments
   - Verify loan status = 'completed'
   - Verify member credit score improves

#### Financial Reporting Cycle
**Test end-to-end reporting**

1. **Setup Period**
   - Record various transactions:
     - Member contributions
     - Loan disbursements
     - Loan repayments
     - Expenses
     - Fees

2. **Generate Reports**
   - Balance Sheet
   - Income Statement
   - General Ledger
   - Cash Flow

3. **Verify Consistency**
   - All transactions in general ledger
   - Income statement reflects interest earned
   - Balance sheet balances
   - Cash flow matches net changes

## Automated Test Scripts

### API Test Suite (using curl)

```bash
#!/bin/bash
# Save as test-api.sh

TOKEN="your-token-here"
BASE_URL="http://localhost:4000/api"

echo "Testing Financial Reports..."

# Test 1: Balance Sheet
echo "1. Balance Sheet"
curl -s -X GET "$BASE_URL/reports/balance-sheet" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 2: Income Statement
echo "2. Income Statement"
curl -s -X GET "$BASE_URL/reports/income-statement?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 3: General Ledger
echo "3. General Ledger"
curl -s -X GET "$BASE_URL/reports/general-ledger" \
  -H "Authorization: Bearer $TOKEN" | jq '.totalCount'

# Test 4: Credit Score
echo "4. Credit Score"
curl -s -X GET "$BASE_URL/reports/credit-score/MEMBER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "All tests completed!"
```

## Performance Tests

### Load Testing
```bash
# Test with 100 concurrent balance sheet requests
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/reports/balance-sheet
```

**Expected:**
- 95% of requests < 500ms
- No failed requests
- No memory leaks

## Regression Test Checklist

After any code changes, verify:

- [ ] All API endpoints respond correctly
- [ ] Financial calculations still accurate
- [ ] Database migrations work
- [ ] No breaking changes to API contracts
- [ ] Mobile app still connects
- [ ] Web dashboard loads
- [ ] Reports generate correctly
- [ ] Credit scores calculate properly
- [ ] Penalties apply correctly
- [ ] Schedules generate properly

## Bug Reporting Template

```markdown
**Bug Description:**
Brief description

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Environment:**
- Component: API/Web/Mobile
- Version: 
- Browser/Device:

**Screenshots/Logs:**
[Attach if applicable]
```

## Test Data Cleanup

To reset test data:
```bash
# Backup first!
cd packages/db
cp data/sharvic.db data/sharvic.db.backup

# Delete test data (be careful!)
sqlite3 data/sharvic.db "DELETE FROM loan_schedules; DELETE FROM penalties; DELETE FROM loanRepayments; DELETE FROM loans; DELETE FROM contributions; DELETE FROM savingsAccounts; DELETE FROM members;"

# Or completely reset
rm data/sharvic.db
npx drizzle-kit migrate
node scripts/seed-test-data.js
```

## Success Criteria

All features pass when:
- ✅ All financial reports generate correctly
- ✅ Credit scoring works accurately
- ✅ Eligibility checks prevent unqualified applications
- ✅ Penalties calculate at 2% per week
- ✅ Loan schedules generate and update
- ✅ Mobile app functions fully
- ✅ No critical bugs in production scenarios
- ✅ Performance within acceptable limits
- ✅ Data integrity maintained

---

**Testing Completed:** [ ] Yes [ ] No  
**Date:** __________  
**Tester:** __________  
**Critical Issues Found:** __________
