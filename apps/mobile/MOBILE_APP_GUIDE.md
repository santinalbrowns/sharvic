# Sharvic Mobile App - User Guide

## 🎉 App is Running!

You should now see the mobile app on your emulator/device.

## First Time Setup

### Default Login Credentials

Use the demo member account:
- **Email:** `dem@sharvic.com`
- **Password:** `demo123`

The admin account (`admin@sharvic.com`) is not linked to a member profile, so
the mobile app will show an "Account Not Linked" screen for it.

### Creating a Member Login

1. Open web dashboard: http://localhost:3000
2. Go to Members → Add Member
3. Enter a **Login Email** and **Mobile App Password** (both optional)
4. Use those credentials in the mobile app

For an existing member, call `POST /api/members/:id/create-account` with
`{ "email": "...", "password": "..." }`.

## App Navigation

### 1. Login Screen 🔐
- Enter email/phone and password
- Tap "Login" button
- Loading indicator shows during authentication
- On success, navigates to Dashboard

### 2. Dashboard (Home) 🏠
**What you'll see:**
- Welcome message with member name
- 4 Quick Action Cards:
  - Apply for Loan (green)
  - View Savings (blue)
  - Loan History (orange)
  - My Profile (purple)

**Bottom Navigation:**
- Dashboard icon (house)
- Loans icon (payment)
- Savings icon (piggy bank)
- Profile icon (person)

### 3. Loans Tab 💳

**Two Sub-Tabs:**

#### A. Active Loans
- List of all your loans
- Each card shows:
  - Loan number
  - Status badge (colored)
  - Principal amount
  - Outstanding balance
  - Progress bar
- Tap any loan to see details

#### B. Apply for Loan
- Enter loan amount (K)
- Tap "Check Eligibility"
- See credit score and eligibility status
- If eligible:
  - Enter term in months (1-60)
  - Enter purpose
  - Tap "Submit Loan Application"
- If not eligible:
  - See reasons why
  - Submit button is disabled

### 4. Loan Details Screen 📊
Shows complete loan information:

**Loan Summary:**
- Loan number
- Status
- Principal amount
- Interest rate (10% member, 20% non-member)
- Interest amount
- Total repayable
- Outstanding balance (red if >0, green if paid)
- Term in months
- Purpose

**Repayment History:**
- List of all payments made
- Amount, receipt number, date

**Repayment Schedule:**
- All installments
- Due dates
- Status (Pending/Paid/Overdue)
- Color-coded icons

### 5. Savings Tab 💰

**Balance Card:**
- Large display of total savings
- Account number
- Prominently colored

**Contribution History:**
- Monthly contributions listed
- Each shows:
  - Amount
  - Receipt number
  - Month
  - Date received

### 6. Profile Tab 👤

**Profile Header:**
- Avatar with initials
- Full name
- Member number

**Credit Score Card:**
- Large score display (0-100)
- Color coded:
  - 80-100: Green (Excellent) ⭐
  - 60-79: Blue (Good) 👍
  - 40-59: Orange (Fair) ⚠️
  - 0-39: Red (Poor) ❌

**Personal Information:**
- Member type
- Status
- Phone number
- Gender
- National ID
- Join date

**Membership Section:**
- Membership fee amount
- Payment status (Paid/Pending)
- Payment date if paid

**Logout Button:**
- Top right corner
- Confirmation dialog before logout

## Key Features to Test

### ✅ Credit Score System
Your score is calculated based on:
1. **Repayment History (40 pts)** - Completed vs defaulted loans
2. **Outstanding Loans (20 pts)** - Number of active loans
3. **Savings Consistency (20 pts)** - Regular contributions
4. **Membership Duration (10 pts)** - How long you've been a member
5. **Guarantor History (10 pts)** - Times you've guaranteed others

### ✅ Loan Eligibility Checks
Before applying, the system checks:
- Active member status ✓
- Maximum 2 active loans ✓
- Credit score ≥ 40 ✓
- No defaulted loans ✓
- Minimum 3 months contributions ✓

If any check fails, you'll see specific reasons.

### ✅ Real-Time Data
- Pull down to refresh any screen
- All data syncs with backend immediately
- Changes made on web dashboard reflect in mobile

## Status Indicators

### Loan Statuses (Color Coded):
- 🟠 **PENDING** - Application submitted, awaiting review
- 🔵 **APPROVED** - Loan approved, not yet disbursed
- 🟢 **DISBURSED** - Loan active, repayments ongoing
- ⚪ **COMPLETED** - Fully paid off
- 🔴 **REJECTED** - Application denied
- 🔴 **DEFAULTED** - Payment overdue, penalties apply

### Schedule Statuses:
- ⏳ **PENDING** - Not yet due
- ✅ **PAID** - Installment paid
- 🔴 **OVERDUE** - Past due date
- 🟡 **PARTIAL** - Partially paid

## Common Actions

### Applying for a Loan
1. Tap "Loans" tab
2. Tap "Apply for Loan" sub-tab
3. Enter amount (e.g., 500000 for K500,000)
4. Tap "Check Eligibility"
5. Wait for credit score calculation
6. If eligible:
   - Enter term (e.g., 12 for 12 months)
   - Enter purpose (e.g., "Business expansion")
   - Tap "Submit Loan Application"
7. Success message appears
8. Check "Active Loans" tab to see new application

### Checking Your Credit Score
1. Tap "Profile" tab
2. Look at the credit score card
3. See your score out of 100
4. Icon indicates rating level

### Viewing Loan Schedule
1. Tap "Loans" tab
2. Tap any loan card
3. Scroll down to "Repayment Schedule"
4. See all installments with:
   - Due dates
   - Amounts
   - Payment status

## Tips & Tricks

### 💡 Improve Your Credit Score
- Make regular monthly contributions
- Repay loans on time
- Avoid defaulting on loans
- Limit active loans to 1-2
- Be active for 12+ months

### 💡 Eligibility
- New members need 3 months of contributions first
- Maximum 2 active loans at once
- Need score ≥ 40 to apply

### 💡 Interest Rates
- **Members:** 10% flat rate
- **Non-Members:** 20% flat rate
- Interest calculated on principal
- Total repayable = Principal + Interest

### 💡 Repayment Schedules
- Generated automatically on loan disbursement
- Equal monthly installments
- Principal and interest split proportionally
- Can pay early or make partial payments

## Troubleshooting

### Login Failed
- Check credentials are correct
- Ensure API is running (http://localhost:4000)
- Check API URL in app settings
- Try creating new account via web dashboard

### No Data Showing
- Pull down to refresh
- Check internet connection
- Verify API is accessible
- Check API URL configuration

### Can't Apply for Loan
- Check eligibility first
- Ensure you have 3+ contributions
- Check credit score ≥ 40
- Verify you don't have 2+ active loans

### Credit Score Shows 0
- Need at least some activity
- Make monthly contributions
- Complete a loan successfully
- Be active for several months

## Developer Info

### Hot Reload
When app is running, you can:
- Press `r` in terminal - Hot reload (quick changes)
- Press `R` in terminal - Hot restart (full restart)
- Press `q` in terminal - Quit app

### Updating API URL
1. Open `lib/services/api_service.dart`
2. Change `baseUrl` constant
3. Hot reload won't work - need hot restart (press `R`)

### Debugging
- Check terminal for error messages
- Use `print()` statements in code
- Press `w` to dump widget tree
- Press `t` to dump rendering tree

## Next Steps

1. ✅ Test all features
2. ✅ Try applying for loans
3. ✅ Check credit scores
4. ✅ View savings and contributions
5. ✅ Test on different screen sizes
6. ✅ Customize branding (colors, logo)
7. ✅ Prepare for production

## Support

If you encounter issues:
- Check error messages in terminal
- Review RUN_MOBILE_APP.md
- Check API is running properly
- Verify network connectivity

---

**Enjoy using Sharvic Mobile Banking!** 🎊

For questions or issues, refer to:
- TESTING_GUIDE.md - Full testing procedures
- IMPLEMENTATION_COMPLETE.md - Feature documentation
- RUN_MOBILE_APP.md - Setup and troubleshooting
