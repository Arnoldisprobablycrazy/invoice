import LoginForm from "@/components/LoginForm";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <section className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 sm:p-8">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="relative w-10 h-10 md:w-12 md:h-12">
              <Image
                src="/logo.svg"
                alt="Zukih Logo"
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
            Welcome Back
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Sign in to continue to your account
          </p>
        </div>

        {/* Form */}
        <LoginForm />

        {/* Extra Links */}
        <div className="mt-6 space-y-3 text-center text-sm sm:text-base">
          <p>
            Don’t have an account?
            <Link
              className="font-semibold text-amber-600 hover:underline ml-1"
              href="/accounts/register"
            >
              Sign Up
            </Link>
          </p>
          <p>
            Forgot your password?
            <Link
              className="font-semibold text-amber-600 hover:underline ml-1"
              href="/forgot-password"
            >
              Reset Password
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
