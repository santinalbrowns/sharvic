# Paychangu Payment Integration

## Overview
The village banking system now supports Paychangu payments for member contributions. Members can pay using:
- Cash (default)
- Mobile Money (via Paychangu)
- Card (via Paychangu)

## Setup

### Environment Variables
The following environment variables have been added to `.env`:
```
API_BASE_URL=http://localhost:4000
PAYCHANGU_SECRET_KEY=SEC-976debzgR7Gu6xzJ4WQhZEtzlfUgWiYX
PAYCHANGU_PUBLIC_KEY=PUB-rS8SGPE2EFlS354mMHZZon3isOnBVJ1W
```

### Database Changes
New fields added to the `contributions` table:
- `payment_method`: 'cash' | 'mobile_money' | 'card' (default: 'cash')
- `payment_status`: 'pending' | 'completed' | 'failed' (default: 'completed')
- `payment_tx_ref`: Transaction reference from Paychangu
- `payment_checkout_url`: Checkout URL for completing payment

## API Endpoints

### 1. Record Contribution (Enhanced)
**Endpoint:** `POST /api/savings/contribute`

**Request Body:**
```json
{
  "memberId": "member-id",
  "amount": 10000,
  "contributionMonth": "2026-11",
  "notes": "Monthly contribution",
  "paymentMethod": "mobile_money"
}
```

**Cash Payment Response:**
```json
{
  "id": "contribution-id",
  "memberId": "member-id",
  "amount": 10000,
  "paymentMethod": "cash",
  "paymentStatus": "completed",
  "receiptNo": "RCPT-XXXXXXXXXXXX"
}
```

**Mobile Money/Card Payment Response:**
```json
{
  "contribution": {
    "id": "contribution-id",
    "memberId": "member-id",
    "amount": 10000,
    "paymentMethod": "mobile_money",
    "paymentStatus": "pending",
    "paymentTxRef": "TXN-XXXXXXXXXXXXXXXX",
    "paymentCheckoutUrl": "https://checkout.paychangu.com/123456789",
    "receiptNo": "RCPT-XXXXXXXXXXXX"
  },
  "checkoutUrl": "https://checkout.paychangu.com/123456789",
  "message": "Payment initiated. Complete payment at the checkout URL."
}
```

### 2. Payment Callback (Webhook)
**Endpoint:** `POST /api/savings/payment-callback`

This endpoint is automatically called by Paychangu when a payment is completed or fails. It:
- Updates the contribution status
- Updates the savings account balance for successful payments
- Handles failed payments

### 3. Payment Return URL
**Endpoint:** `GET /api/savings/payment-return`

After payment completion, users are redirected here with success/failure message.

### 4. Verify Payment
**Endpoint:** `GET /api/savings/verify-payment/:txRef`

**Response:**
```json
{
  "verification": {
    "status": "success",
    "data": {
      "status": "successful",
      "amount": 10000,
      "currency": "MWK"
    }
  },
  "contribution": {
    "id": "contribution-id",
    "paymentStatus": "completed",
    "amount": 10000
  }
}
```

## Payment Flow

### Cash Payment
1. Client submits contribution with `paymentMethod: "cash"`
2. Contribution is recorded immediately with status "completed"
3. Savings account balance is updated instantly

### Mobile Money/Card Payment
1. Client submits contribution with `paymentMethod: "mobile_money"` or `"card"`
2. System creates Paychangu payment session
3. Contribution is recorded with status "pending"
4. Client receives `checkoutUrl` to complete payment
5. User completes payment on Paychangu checkout page
6. Paychangu calls webhook (`/payment-callback`)
7. System verifies payment and updates:
   - Contribution status to "completed"
   - Savings account balance
8. User is redirected to return URL with result

## Testing

### Test Endpoints
```bash
# Record cash contribution
curl -X POST http://localhost:4000/api/savings/contribute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "member-123",
    "amount": 10000,
    "contributionMonth": "2026-11",
    "paymentMethod": "cash"
  }'

# Record mobile money contribution
curl -X POST http://localhost:4000/api/savings/contribute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "member-123",
    "amount": 10000,
    "contributionMonth": "2026-11",
    "paymentMethod": "mobile_money"
  }'

# Verify payment
curl http://localhost:4000/api/savings/verify-payment/TXN-123456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Files Changed

1. **Database Schema**
   - `/packages/db/schema/savings.ts` - Added payment fields to contributions table

2. **Services**
   - `/apps/api/src/services/paychangu.ts` - New Paychangu payment service

3. **Routes**
   - `/apps/api/src/routes/savings.ts` - Enhanced contribution endpoint with payment support

4. **Configuration**
   - `/apps/api/.env` - Added Paychangu credentials
   - `/apps/api/.env.example` - Updated example

5. **Migrations**
   - `/packages/db/migrations/0002_wet_goliath.sql` - Database migration for payment fields

## Security Notes

- Secret keys are stored in `.env` file (never commit to version control)
- All payment operations require authentication
- Only admin, chairperson, secretary, and treasurer can record contributions
- Payment verification is performed server-side
- Webhook endpoint validates payment status before updating records

## Currency
The system uses MWK (Malawi Kwacha) as the default currency for Paychangu payments.
