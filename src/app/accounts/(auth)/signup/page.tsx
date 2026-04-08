import SignupForm from "@/components/SignupForm";
import Link from "next/link";
import Image from "next/image";

/**
 * SIGNUP PAGE
 * 
 * Registration page for new users
 * Displays signup form with validation
 * Links to login if user already has account
 */
export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <section className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 sm:p-8">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="relative w-10 h-10 md:w-12 md:h-12">
              <Image
                src="/logo.svg"
                alt="Invoicer Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-lg md:text-xl text-gray-900">
              Invoicer
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Create Account
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Join us and start managing your invoices
          </p>
        </div>

        {/* Form */}
        <SignupForm />

        {/* Extra Links */}
        <div className="mt-6 space-y-3 text-center text-sm sm:text-base">
          <p>
            Already have an account?
            <Link
              className="font-semibold text-amber-600 hover:underline ml-1"
              href="/accounts/(auth)/login"
            >
              Sign In
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
