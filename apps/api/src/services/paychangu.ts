import crypto from 'crypto';

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

export interface MobileMoneyChargeRequest {
  amount: number;
  phone: string;
  operatorRefId: string;
  chargeId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface MobileMoneyChargeResponse {
  status: string;
  message: string;
  data?: {
    amount: number;
    charge_id: string;
    ref_id: string;
    trans_id: string | null;
    status: string;
    currency?: string;
    mode?: string;
    mobile?: string;
    [key: string]: any;
  };
}

const PAYCHANGU_BASE_URL = 'https://api.paychangu.com';
const PAYCHANGU_API_URL = `${PAYCHANGU_BASE_URL}/payment`;

/**
 * Mobile money operators supported by PayChangu in Malawi.
 * The ref IDs are the stable identifiers used by the Direct Charge API.
 */
export const MOBILE_MONEY_OPERATORS = [
  {
    code: 'airtel',
    name: 'Airtel Money',
    refId: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
  },
  {
    code: 'tnm',
    name: 'TNM Mpamba',
    refId: '27494cb5-ba9e-437f-a114-4e7a7686bcca',
  },
] as const;

export type MobileMoneyOperatorCode = (typeof MOBILE_MONEY_OPERATORS)[number]['code'];

function getSecretKey(): string {
  const key = process.env.PAYCHANGU_SECRET_KEY;
  if (!key) {
    throw new Error('PAYCHANGU_SECRET_KEY is not configured');
  }
  return key;
}

export function resolveMobileMoneyOperator(codeOrRefId: string) {
  const value = String(codeOrRefId || '').trim();
  const operator = MOBILE_MONEY_OPERATORS.find(
    (item) => item.code === value.toLowerCase() || item.refId === value
  );
  if (!operator) {
    throw new Error(`Unsupported mobile money operator: ${value}`);
  }
  return operator;
}

/**
 * Normalise a Malawian phone number to the +265XXXXXXXXX format PayChangu expects.
 */
export function normalizePhoneNumber(input: string): string {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) throw new Error('Phone number is required');

  let normalized: string;
  if (digits.startsWith('265')) {
    normalized = `+${digits}`;
  } else if (digits.startsWith('0')) {
    normalized = `+265${digits.slice(1)}`;
  } else if (digits.length === 9) {
    normalized = `+265${digits}`;
  } else {
    normalized = `+${digits}`;
  }

  if (!/^\+265\d{9}$/.test(normalized)) {
    throw new Error('Enter a valid Malawi mobile number');
  }

  return normalized;
}

/**
 * PayChangu Direct Charge expects the 9-digit local subscriber number
 * (e.g. 991234567), not the +265 international format.
 */
export function toPaychanguMobileNumber(input: string): string {
  return normalizePhoneNumber(input).slice('+265'.length);
}

export async function initiatePayment(params: PaychanguPaymentRequest): Promise<PaychanguPaymentResponse> {
  const response = await fetch(PAYCHANGU_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSecretKey()}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paychangu API error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<PaychanguPaymentResponse>;
}

export async function verifyPayment(txRef: string): Promise<any> {
  const response = await fetch(`${PAYCHANGU_BASE_URL}/verify-payment/${encodeURIComponent(txRef)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${getSecretKey()}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paychangu verification error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Turn a PayChangu error payload into a readable string. PayChangu sometimes
 * returns `message`/`errors` as objects, which would otherwise render as
 * "[object Object]" in the app.
 */
function describeApiError(payload: any, status: number, fallbackPrefix: string): string {
  const fallback = `${fallbackPrefix}: ${status}`;
  if (!payload) return fallback;

  const candidates = [payload.message, payload.error, payload.data?.message, payload.errors];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    if (candidate && typeof candidate === 'object') {
      try {
        const text = JSON.stringify(candidate);
        if (text && text !== '{}') return text;
      } catch {
        // Fall through to the next candidate.
      }
    }
  }

  return fallback;
}

/**
 * Start a mobile money charge directly on the member's phone (no redirect).
 */
export async function initiateMobileMoneyCharge(
  params: MobileMoneyChargeRequest
): Promise<MobileMoneyChargeResponse> {
  const response = await fetch(`${PAYCHANGU_BASE_URL}/mobile-money/payments/initialize`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSecretKey()}`,
    },
    body: JSON.stringify({
      mobile: toPaychanguMobileNumber(params.phone),
      mobile_money_operator_ref_id: params.operatorRefId,
      amount: String(params.amount),
      charge_id: params.chargeId,
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || payload.status === 'failed') {
    throw new Error(describeApiError(payload, response.status, 'PayChangu payment error'));
  }

  return payload as MobileMoneyChargeResponse;
}

/**
 * Verify the final status of a Direct Charge mobile money payment.
 */
export async function verifyMobileMoneyCharge(chargeId: string): Promise<MobileMoneyChargeResponse> {
  const response = await fetch(
    `${PAYCHANGU_BASE_URL}/mobile-money/payments/${encodeURIComponent(chargeId)}/verify`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${getSecretKey()}`,
      },
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload) {
    throw new Error(describeApiError(payload, response.status, 'PayChangu verification error'));
  }

  return payload as MobileMoneyChargeResponse;
}

/**
 * Validate the Signature header PayChangu sends with webhook requests.
 * When no webhook secret is configured we skip the signature check because
 * every successful webhook is re-queried against the PayChangu API before
 * any money is credited.
 */
export function isValidWebhookSignature(rawBody: Buffer | string | undefined, signature?: string): boolean {
  const secret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!rawBody || !signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
