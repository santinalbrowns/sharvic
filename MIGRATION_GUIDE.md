# Database Migration Guide

This guide explains how to migrate your existing database to include the new features (penalties, loan schedules, and credit scores).

## What's Being Added

### New Tables
1. **penalties** - Tracks late payment penalties
2. **loan_schedules** - Monthly loan installment tracking
3. **credit_scores** - Member credit score history

### Schema Changes
No changes to existing tables - all new features use separate tables to maintain backward compatibility.

## Migration Steps

### Step 1: Backup Your Database (IMPORTANT!)

```bash
# Navigate to database directory
cd packages/db

# Create backup
cp data/sharvic.db data/sharvic.db.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup exists
ls -la data/*.backup.*
```

### Step 2: Update Dependencies

```bash
# Make sure you have latest packages
npm install
```

### Step 3: Generate Migrations

```bash
# This will create migration files for the new tables
npx drizzle-kit generate

# You should see output like:
# ✓ Generated 1 migration file
```

### Step 4: Review Migration Files

```bash
# Check the generated migration
ls -la migrations/

# Optional: Review the SQL
cat migrations/XXXX_*.sql
```

You should see SQL for creating:
- `penalties` table
- `loan_schedules` table  
- `credit_scores` table

### Step 5: Run Migrations

```bash
# Apply the migrations to your database
npx drizzle-kit migrate

# Expected output:
# ✓ Migration applied successfully
```

### Step 6: Verify Migration

```bash
# Connect to database and verify tables exist
sqlite3 data/sharvic.db

# In SQLite prompt:
.tables

# You should see:
# penalties
# loan_schedules
# credit_scores
# (plus all your existing tables)

# Exit SQLite
.quit
```

## Post-Migration Tasks

### 1. Generate Loan Schedules for Existing Loans

If you have existing disbursed loans without schedules, you need to generate them:

```bash
# Run this script to generate schedules for all disbursed loans
# (This can be run via API endpoint or create a migration script)
```

Example API call for each disbursed loan:
```bash
curl -X POST http://localhost:4000/api/loans/{loanId}/disburse \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Calculate Initial Credit Scores

Calculate credit scores for all existing members:

```bash
# For each member, call the credit score endpoint
curl -X GET http://localhost:4000/api/reports/credit-score/{memberId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Mark Overdue Schedules

Check for any overdue loan schedules:

```bash
curl -X POST http://localhost:4000/api/loans/system/mark-overdue \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Rollback Procedure (If Needed)

If something goes wrong, you can rollback:

```bash
cd packages/db

# Stop the API server first
# Then restore from backup
cp data/sharvic.db.backup.YYYYMMDD_HHMMSS data/sharvic.db

# Restart API server
cd ../../apps/api
npm run dev
```

## Migration Script (Automated)

Create this file as `packages/db/migrate-existing-data.js`:

```javascript
import { db } from './index.js';
import { loans, loanSchedules } from './schema/index.js';
import { eq } from 'drizzle-orm';

async function migrateExistingLoans() {
  console.log('Starting migration of existing loans...');
  
  // Get all disbursed loans
  const disbursedLoans = await db.query.loans.findMany({
    where: eq(loans.status, 'disbursed')
  });
  
  console.log(`Found ${disbursedLoans.length} disbursed loans`);
  
  for (const loan of disbursedLoans) {
    // Check if schedule already exists
    const existingSchedule = await db.query.loanSchedules.findFirst({
      where: eq(loanSchedules.loanId, loan.id)
    });
    
    if (existingSchedule) {
      console.log(`Schedule already exists for loan ${loan.loanNo}`);
      continue;
    }
    
    // Generate schedule
    console.log(`Generating schedule for loan ${loan.loanNo}...`);
    
    const monthlyPayment = loan.totalRepayable / loan.termMonths;
    const monthlyPrincipal = loan.principalAmount / loan.termMonths;
    const monthlyInterest = loan.interestAmount / loan.termMonths;
    const disbursementDate = loan.disbursedAt || new Date();
    
    for (let i = 1; i <= loan.termMonths; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      await db.insert(loanSchedules).values({
        loanId: loan.id,
        installmentNumber: i,
        dueDate,
        principalDue: monthlyPrincipal,
        interestDue: monthlyInterest,
        totalDue: monthlyPayment,
        status: 'pending',
      });
    }
    
    console.log(`✓ Schedule created for loan ${loan.loanNo}`);
  }
  
  console.log('Migration completed!');
}

// Run migration
migrateExistingLoans().catch(console.error);
```

Run it:
```bash
cd packages/db
node migrate-existing-data.js
```

## Verification Checklist

After migration, verify:

- [ ] All new tables exist in database
- [ ] Existing data is intact (members, loans, savings)
- [ ] API server starts without errors
- [ ] Web dashboard loads correctly
- [ ] Can view existing loans
- [ ] Can create new loans with schedules
- [ ] Can check loan eligibility
- [ ] Can view financial reports
- [ ] Mobile app connects successfully

## Testing New Features

### Test Loan Schedule Generation
1. Create a new loan application
2. Approve it
3. Disburse it
4. Check `/api/loans/{loanId}` - should include schedule array

### Test Penalty Calculation
1. Manually set a schedule item to overdue status
2. Call `/api/loans/{loanId}/calculate-penalties`
3. Verify penalty is created

### Test Credit Score
1. Call `/api/reports/credit-score/{memberId}`
2. Verify score is between 0-100
3. Check that factors are calculated correctly

### Test Financial Reports
1. Visit `/reports/balance-sheet`
2. Visit `/reports/income-statement`
3. Visit `/reports/general-ledger`
4. Verify all data displays correctly

## Common Issues and Solutions

### Issue: "Table already exists" error
**Solution:** The table was already created. This is safe to ignore, or drop the table and re-run migration.

### Issue: Foreign key constraint errors
**Solution:** Ensure all referenced tables (loans, members, users) exist and have data.

### Issue: Migration file not generated
**Solution:** 
```bash
rm -rf migrations/.snapshot.json
npx drizzle-kit generate
```

### Issue: "Cannot find module" errors
**Solution:**
```bash
npm install
cd ../..
npm install
```

## Data Integrity Checks

After migration, run these queries to verify:

```sql
-- Check penalties table
SELECT COUNT(*) FROM penalties;

-- Check loan schedules (should equal total loan months)
SELECT 
  COUNT(*) as total_schedules,
  SUM(l.termMonths) as expected_schedules
FROM loan_schedules ls
JOIN loans l ON ls.loanId = l.id;

-- Check credit scores
SELECT COUNT(*) FROM credit_scores;

-- Verify schedule consistency
SELECT 
  l.loanNo,
  l.termMonths,
  COUNT(ls.id) as schedule_count,
  SUM(ls.totalDue) as schedule_total,
  l.totalRepayable
FROM loans l
LEFT JOIN loan_schedules ls ON l.id = ls.loanId
WHERE l.status = 'disbursed'
GROUP BY l.id
HAVING schedule_count != l.termMonths OR ABS(schedule_total - l.totalRepayable) > 0.01;
```

If the last query returns any rows, schedules are inconsistent and need regeneration.

## Support

If you encounter issues during migration:
1. Restore from backup
2. Check error logs in console
3. Verify all prerequisites are met
4. Review this guide step-by-step
5. Check API logs for detailed errors

## Migration Timestamp

Record your migration details:
- Migration Date: _______________
- Database Backup: _______________
- Migration Success: [ ] Yes [ ] No
- Issues Encountered: _______________
- Resolution: _______________

---

**Remember:** Always backup before migrating!
