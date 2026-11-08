/**
 * Seed Test Data Script
 * Populates the database with sample data for testing
 * 
 * Usage: node scripts/seed-test-data.js
 */

const baseUrl = 'http://localhost:4000/api';
let adminToken = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken && { 'Authorization': `Bearer ${adminToken}` })
    },
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API call failed: ${error}`);
  }
  return await response.json();
}

// Step 1: Create admin user
async function createAdmin() {
  console.log('📝 Creating admin user...');
  try {
    const result = await apiCall('POST', '/auth/register', {
      fullName: 'System Administrator',
      email: 'admin@sharvic.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Admin user created');
    return result;
  } catch (error) {
    console.log('ℹ️  Admin user may already exist');
  }
}

// Step 2: Login as admin
async function loginAdmin() {
  console.log('🔐 Logging in as admin...');
  const result = await apiCall('POST', '/auth/login', {
    email: 'admin@sharvic.com',
    password: 'admin123'
  });
  adminToken = result.token;
  console.log('✅ Logged in successfully');
  return result;
}

// Step 3: Create sample members
async function createMembers() {
  console.log('👥 Creating sample members...');
  
  const members = [
    {
      firstName: 'John',
      lastName: 'Banda',
      phone: '+260971234567',
      nationalId: 'NRC123456/78/1',
      gender: 'male',
      memberType: 'member',
      address: 'Lusaka, Zambia'
    },
    {
      firstName: 'Mary',
      lastName: 'Mwansa',
      phone: '+260977654321',
      nationalId: 'NRC234567/89/1',
      gender: 'female',
      memberType: 'member',
      address: 'Ndola, Zambia'
    },
    {
      firstName: 'Peter',
      lastName: 'Phiri',
      phone: '+260965432198',
      nationalId: 'NRC345678/90/1',
      gender: 'male',
      memberType: 'non_member',
      address: 'Kitwe, Zambia'
    },
    {
      firstName: 'Grace',
      lastName: 'Tembo',
      phone: '+260978123456',
      nationalId: 'NRC456789/01/1',
      gender: 'female',
      memberType: 'member',
      address: 'Livingstone, Zambia'
    },
    {
      firstName: 'James',
      lastName: 'Zulu',
      phone: '+260963456789',
      nationalId: 'NRC567890/12/1',
      gender: 'male',
      memberType: 'member',
      address: 'Kabwe, Zambia'
    }
  ];

  const createdMembers = [];
  for (const member of members) {
    try {
      const result = await apiCall('POST', '/members', member);
      createdMembers.push(result);
      console.log(`  ✅ Created: ${member.firstName} ${member.lastName}`);
    } catch (error) {
      console.log(`  ⚠️  Failed to create ${member.firstName}: ${error.message}`);
    }
  }
  
  return createdMembers;
}

// Step 4: Create savings accounts and contributions
async function createSavings(members) {
  console.log('💰 Creating savings accounts and contributions...');
  
  for (const member of members) {
    try {
      // Create savings account
      const account = await apiCall('POST', '/savings/account', {
        memberId: member.id
      });
      
      // Add 6 months of contributions for better credit score
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        
        await apiCall('POST', '/savings/contribute', {
          memberId: member.id,
          savingsAccountId: account.id,
          amount: 45000,
          contributionMonth: month
        });
      }
      
      console.log(`  ✅ Created savings for ${member.firstName} (K270,000 total)`);
    } catch (error) {
      console.log(`  ⚠️  Failed to create savings for ${member.firstName}: ${error.message}`);
    }
  }
}

// Step 5: Create sample loan applications
async function createLoans(members) {
  console.log('💳 Creating sample loan applications...');
  
  const loanApplications = [
    {
      member: members[0],
      principalAmount: 500000,
      termMonths: 12,
      purpose: 'Small business expansion - retail shop',
      guarantors: [
        {
          guarantorName: members[1].firstName + ' ' + members[1].lastName,
          guarantorPhone: members[1].phone,
          guarantorNationalId: members[1].nationalId,
          relationship: 'Friend'
        }
      ]
    },
    {
      member: members[1],
      principalAmount: 300000,
      termMonths: 6,
      purpose: 'Agricultural inputs purchase',
      guarantors: [
        {
          guarantorName: members[0].firstName + ' ' + members[0].lastName,
          guarantorPhone: members[0].phone,
          guarantorNationalId: members[0].nationalId,
          relationship: 'Colleague'
        }
      ]
    },
    {
      member: members[3],
      principalAmount: 750000,
      termMonths: 18,
      purpose: 'Equipment purchase for salon business',
      guarantors: []
    }
  ];

  const createdLoans = [];
  for (const app of loanApplications) {
    try {
      const loan = await apiCall('POST', '/loans/apply', {
        memberId: app.member.id,
        principalAmount: app.principalAmount,
        termMonths: app.termMonths,
        purpose: app.purpose,
        guarantors: app.guarantors
      });
      createdLoans.push(loan);
      console.log(`  ✅ Created loan application for ${app.member.firstName} - K${app.principalAmount.toLocaleString()}`);
    } catch (error) {
      console.log(`  ⚠️  Failed to create loan for ${app.member.firstName}: ${error.message}`);
    }
  }
  
  return createdLoans;
}

// Step 6: Approve and disburse some loans
async function processLoans(loans) {
  console.log('✓ Processing loan approvals and disbursements...');
  
  for (let i = 0; i < Math.min(2, loans.length); i++) {
    const loan = loans[i];
    try {
      // Approve loan
      await apiCall('POST', `/loans/${loan.id}/approve`, {});
      console.log(`  ✅ Approved loan ${loan.loanNo}`);
      
      // Disburse loan
      await apiCall('POST', `/loans/${loan.id}/disburse`, {});
      console.log(`  ✅ Disbursed loan ${loan.loanNo} (schedule created)`);
    } catch (error) {
      console.log(`  ⚠️  Failed to process loan ${loan.loanNo}: ${error.message}`);
    }
  }
}

// Step 7: Record some repayments
async function recordRepayments(loans) {
  console.log('💵 Recording sample repayments...');
  
  for (let i = 0; i < Math.min(2, loans.length); i++) {
    const loan = loans[i];
    try {
      // Record partial repayment
      await apiCall('POST', `/loans/${loan.id}/repay`, {
        amount: 50000,
        paymentMethod: 'cash',
        notes: 'Test payment'
      });
      console.log(`  ✅ Recorded repayment for loan ${loan.loanNo}`);
    } catch (error) {
      console.log(`  ⚠️  Failed to record repayment: ${error.message}`);
    }
  }
}

// Step 8: Create sample expenses
async function createExpenses() {
  console.log('📊 Creating sample expenses...');
  
  const expenses = [
    {
      category: 'Office Supplies',
      description: 'Stationery and office materials',
      amount: 15000,
      requestedBy: 'admin'
    },
    {
      category: 'Bank Charges',
      description: 'Monthly bank transaction fees',
      amount: 5000,
      requestedBy: 'admin'
    },
    {
      category: 'Transport',
      description: 'Field visit transportation',
      amount: 8000,
      requestedBy: 'admin'
    }
  ];

  for (const expense of expenses) {
    try {
      await apiCall('POST', '/expenses', expense);
      console.log(`  ✅ Created expense: ${expense.description}`);
    } catch (error) {
      console.log(`  ⚠️  Failed to create expense: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting test data seeding...\n');
  
  try {
    // Create and login admin
    await createAdmin();
    await loginAdmin();
    
    // Create test data
    const members = await createMembers();
    await createSavings(members);
    const loans = await createLoans(members);
    await processLoans(loans);
    await recordRepayments(loans);
    await createExpenses();
    
    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Members created: ${members.length}`);
    console.log(`   Loans created: ${loans.length}`);
    console.log(`   Total savings: K${members.length * 270000}`);
    console.log('\n🔑 Admin Credentials:');
    console.log('   Email: admin@sharvic.com');
    console.log('   Password: admin123');
    console.log('\n🌐 Access the system:');
    console.log('   Web: http://localhost:3000/login');
    console.log('   API: http://localhost:4000');
    
  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
