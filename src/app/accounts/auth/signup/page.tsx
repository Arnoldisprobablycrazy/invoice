import SignupForm from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <SignupForm />
        </div>
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            By signing up you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-300">Terms</a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-gray-300">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}