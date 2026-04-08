import React from "react";
import LoginForm from "@/components/LoginForm";

/**
 * LOGIN PAGE
 * 
 * Route: /accounts/auth/login
 * 
 * This page handles user authentication:
 * 1. Display login form
 * 2. Collect user email and password
 * 3. Submit to signIn server action
 * 4. Verify credentials against database
 * 5. Issue JWT token on success
 * 6. Redirect to dashboard
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Login Form Container */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <LoginForm />
        </div>

        {/* Footer Text */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Protected by secure JWT authentication and bcryptjs password hashing.
          </p>
        </div>
      </div>
    </div>
  );
}
