import { registerC2BUrls } from './mpesa';

export async function runC2BRegistration() {
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (!callbackUrl) {
    throw new Error(
      'MPESA_CALLBACK_URL is not set. Check that .env.local exists and is being loaded.'
    );
  }

  if (!callbackUrl.startsWith('https://')) {
    throw new Error(
      `MPESA_CALLBACK_URL must be HTTPS (got "${callbackUrl}"). Daraja rejects http:// and localhost.`
    );
  }

  if (callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1')) {
    throw new Error(
      `MPESA_CALLBACK_URL points to localhost. Use your ngrok HTTPS URL instead.`
    );
  }

  if (!callbackUrl.includes('/api/payments/callback')) {
    console.warn(
      `[warning] MPESA_CALLBACK_URL doesn't contain /api/payments/callback — got "${callbackUrl}".`
    );
  }

  const base = callbackUrl.replace(/\/api\/payments\/callback.*$/, '');
  const confirmationUrl = `${base}/api/payments/c2b?kind=confirmation`;
  const validationUrl = `${base}/api/payments/c2b?kind=validation`;

  console.log('Registering C2B URLs with Daraja:');
  console.log('  Shortcode:        ', process.env.MPESA_SHORTCODE);
  console.log('  Confirmation URL: ', confirmationUrl);
  console.log('  Validation URL:   ', validationUrl);
  console.log('');

  const result = await registerC2BUrls(confirmationUrl, validationUrl);
  console.log('[C2B registration result]', result);
  return result;
}