// ============================================================
// Daraja API client — handles auth, STK Push, and C2B
// ============================================================

const ENV = process.env.MPESA_ENV || 'sandbox';

const BASE_URL =
  ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const SHORTCODE = process.env.MPESA_SHORTCODE!;
const PASSKEY = process.env.MPESA_PASSKEY!;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;

function assertConfig() {
  const missing: string[] = [];
  if (!CONSUMER_KEY) missing.push('MPESA_CONSUMER_KEY');
  if (!CONSUMER_SECRET) missing.push('MPESA_CONSUMER_SECRET');
  if (!SHORTCODE) missing.push('MPESA_SHORTCODE');
  if (!PASSKEY) missing.push('MPESA_PASSKEY');
  if (!CALLBACK_URL) missing.push('MPESA_CALLBACK_URL');
  if (missing.length) {
    throw new Error(`[mpesa] Missing env vars: ${missing.join(', ')}`);
  }
}

// ---- OAuth token cache (in-memory) ----
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  assertConfig();

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[mpesa] OAuth failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000,
  };
  return cachedToken.value;
}

// ---- Helpers ----
function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/\s+/g, '').replace(/^\+/, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

// ---- STK Push ----
export interface STKPushResult {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function stkPush(params: {
  phone: string;
  amount: number;
  accountReference: string;
  description: string;
}): Promise<STKPushResult> {
  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString('base64');

  const body = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(params.amount),
    PartyA: normalizePhone(params.phone),
    PartyB: SHORTCODE,
    PhoneNumber: normalizePhone(params.phone),
    CallBackURL: CALLBACK_URL,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.description.slice(0, 13),
  };

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[mpesa] STK Push failed ${res.status}: ${text}`);
  }

  return res.json();
}

// ---- Register C2B URLs (run once) ----
export async function registerC2BUrls(confirmationUrl: string, validationUrl: string) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/mpesa/c2b/v1/registerurl`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ShortCode: SHORTCODE,
      ResponseType: 'Completed',
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[mpesa] Register C2B failed ${res.status}: ${text}`);
  }
  return res.json();
}

// ---- Query STK Push status ----
export async function querySTKStatus(checkoutRequestId: string) {
  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString('base64');

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: 'no-store',
  });

  return res.json();
}