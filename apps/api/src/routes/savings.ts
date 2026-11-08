import { Router } from 'express';
import { db, contributions, savingsAccounts, members } from '@sharvic/db';
import { eq } from 'drizzle-orm';
import { authenticate, authorize } from '../middleware/auth';
import { nanoid } from 'nanoid';
import { initiatePayment, verifyPayment } from '../services/paychangu';

const router = Router();

router.get('/accounts', authenticate, async (req, res) => {
  const accounts = await db.query.savingsAccounts.findMany();
  res.json(accounts);
});

router.post('/account', authenticate, authorize('admin', 'chairperson', 'secretary', 'treasurer'), async (req, res) => {
  try {
    const { memberId } = req.body;
    const existing = await db.query.savingsAccounts.findFirst({
      where: eq(savingsAccounts.memberId, memberId),
    });
    if (existing) return res.json(existing);

    const [account] = await db.insert(savingsAccounts).values({
      memberId,
      accountNo: `ACC-${nanoid(10).toUpperCase()}`,
      balance: 0,
    }).returning();
    res.json(account);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create savings account' });
  }
});

router.post('/contribute', authenticate, authorize('admin', 'chairperson', 'secretary', 'treasurer'), async (req: any, res) => {
  try {
    const { memberId, amount, contributionMonth, notes, paymentMethod = 'cash' } = req.body;
    
    const account = await db.query.savingsAccounts.findFirst({ where: eq(savingsAccounts.memberId, memberId) });
    if (!account) return res.status(404).json({ error: 'Savings account not found' });

    const member = await db.query.members.findFirst({ where: eq(members.id, memberId) });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const receiptNo = `RCPT-${nanoid(12).toUpperCase()}`;
    const txRef = `TXN-${nanoid(16).toUpperCase()}`;

    if (paymentMethod === 'cash') {
      const [contribution] = await db.insert(contributions).values({
        memberId,
        savingsAccountId: account.id,
        amount,
        contributionMonth,
        receiptNo,
        notes,
        receivedBy: req.user.id,
        paymentMethod: 'cash',
        paymentStatus: 'completed',
      }).returning();

      await db.update(savingsAccounts).set({
        balance: account.balance + amount,
        updatedAt: new Date(),
      }).where(eq(savingsAccounts.id, account.id));

      return res.json(contribution);
    }

    if (paymentMethod === 'mobile_money' || paymentMethod === 'card') {
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
      
      const paymentResponse = await initiatePayment({
        amount: amount,
        currency: 'MWK',
        first_name: member.firstName,
        last_name: member.lastName,
        callback_url: `${baseUrl}/api/savings/payment-callback`,
        return_url: `${baseUrl}/api/savings/payment-return`,
        tx_ref: txRef,
        customization: {
          title: 'Contribution Payment',
          description: `Contribution for ${contributionMonth} - ${member.firstName} ${member.lastName}`,
        },
        meta: {
          memberId,
          contributionMonth,
          receiptNo,
          notes: notes || '',
        },
      });

      const [contribution] = await db.insert(contributions).values({
        memberId,
        savingsAccountId: account.id,
        amount,
        contributionMonth,
        receiptNo,
        notes,
        receivedBy: req.user.id,
        paymentMethod,
        paymentStatus: 'pending',
        paymentTxRef: txRef,
        paymentCheckoutUrl: paymentResponse.data.checkout_url,
      }).returning();

      return res.json({
        contribution,
        checkoutUrl: paymentResponse.data.checkout_url,
        message: 'Payment initiated. Complete payment at the checkout URL.',
      });
    }

    return res.status(400).json({ error: 'Invalid payment method' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to record contribution' });
  }
});

router.get('/member/:memberId', authenticate, async (req, res) => {
  const memberId = String(req.params.memberId);
  const account = await db.query.savingsAccounts.findFirst({ where: eq(savingsAccounts.memberId, memberId) });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const contribs = await db.query.contributions.findMany({
    where: eq(contributions.memberId, memberId),
    orderBy: (contributions, { desc }) => [desc(contributions.receivedAt)],
  });
  res.json({ account, contributions: contribs });
});

router.get('/contributions/:memberId', authenticate, async (req, res) => {
  const contribs = await db.query.contributions.findMany({
    where: eq(contributions.memberId, String(req.params.memberId)),
    orderBy: (contributions, { desc }) => [desc(contributions.receivedAt)],
  });
  res.json(contribs);
});

router.post('/payment-callback', async (req, res) => {
  try {
    const { tx_ref, status, transaction_id } = req.body;

    if (status === 'successful' || status === 'success') {
      const verification = await verifyPayment(tx_ref);

      if (verification.status === 'success' && verification.data.status === 'successful') {
        const contribution = await db.query.contributions.findFirst({
          where: eq(contributions.paymentTxRef, tx_ref),
        });

        if (contribution) {
          await db.update(contributions).set({
            paymentStatus: 'completed',
          }).where(eq(contributions.id, contribution.id));

          const account = await db.query.savingsAccounts.findFirst({
            where: eq(savingsAccounts.id, contribution.savingsAccountId),
          });

          if (account) {
            await db.update(savingsAccounts).set({
              balance: account.balance + contribution.amount,
              updatedAt: new Date(),
            }).where(eq(savingsAccounts.id, account.id));
          }
        }
      }
    } else {
      await db.update(contributions).set({
        paymentStatus: 'failed',
      }).where(eq(contributions.paymentTxRef, tx_ref));
    }

    res.json({ message: 'Callback processed' });
  } catch (e) {
    console.error('Payment callback error:', e);
    res.status(500).json({ error: 'Failed to process callback' });
  }
});

router.get('/payment-return', async (req, res) => {
  const { tx_ref, status } = req.query;
  
  if (status === 'successful' || status === 'success') {
    res.send(`
      <html>
        <body>
          <h1>Payment Successful</h1>
          <p>Your contribution has been recorded successfully.</p>
          <p>Transaction Reference: ${tx_ref}</p>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <body>
          <h1>Payment Failed</h1>
          <p>Your payment could not be processed. Please try again.</p>
          <p>Transaction Reference: ${tx_ref}</p>
        </body>
      </html>
    `);
  }
});

router.get('/verify-payment/:txRef', authenticate, async (req, res) => {
  try {
    const txRef = String(req.params.txRef);
    const verification = await verifyPayment(txRef);
    
    const contribution = await db.query.contributions.findFirst({
      where: eq(contributions.paymentTxRef, txRef),
    });

    res.json({
      verification,
      contribution,
    });
  } catch (e) {
    console.error('Payment verification error:', e);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;
