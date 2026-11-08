interface PaychanguPaymentRequest {
  amount: number;
  currency: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  callback_url: string;
  return_url: string;
  tx_ref: string;
  customization?: {
    title: string;
    description: string;
  };
  meta?: Record<string, any>;
}

interface PaychanguPaymentResponse {
  message: string;
  status: string;
  data: {
    event: string;
    checkout_url: string;
    data: {
      tx_ref: string;
      currency: string;
      amount: number;
      mode: string;
      status: string;
    };
  };
}

const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY || 'SEC-976debzgR7Gu6xzJ4WQhZEtzlfUgWiYX';
const PAYCHANGU_API_URL = 'https://api.paychangu.com/payment';

export async function initiatePayment(params: PaychanguPaymentRequest): Promise<PaychanguPaymentResponse> {
  const response = await fetch(PAYCHANGU_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paychangu API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function verifyPayment(txRef: string): Promise<any> {
  const response = await fetch(`https://api.paychangu.com/verify-payment/${txRef}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paychangu verification error: ${response.status} - ${error}`);
  }

  return response.json();
}
