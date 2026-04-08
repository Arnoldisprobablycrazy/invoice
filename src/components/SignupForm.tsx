"use client";
import React, { useState } from "react";
import AuthButton from "./AuthButton";
import { useRouter } from "next/navigation";
import { signUp } from "@/actions/auth";
import Link from "next/link";
import type { SignupFormState, SignupResponse } from "@/lib/auth-interfaces";

const SignupForm = () => {
  const [formState, setFormState] = useState<SignupFormState>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  /**
   * Handle input field changes
   * Updates form state as user types
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Validate form inputs before submission
   * Returns error message if validation fails
   */
  const validateForm = (): string | null => {
    if (!formState.email || !formState.username || !formState.password || !formState.confirmPassword) {
      return "All fields are required";
    }

    if (formState.email.length < 5 || !formState.email.includes("@")) {
      return "Please enter a valid email address";
    }

    if (formState.username.length < 3) {
      return "Username must be at least 3 characters";
    }

    if (formState.password.length < 8) {
      return "Password must be at least 8 characters";
    }

    if (formState.password !== formState.confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  /**
   * Handle form submission
   * 1. Validate form inputs
   * 2. Call signUp server action
   * 3. Handle success/error responses
   * 4. Redirect on success
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Create FormData for server action
      const formData = new FormData();
      formData.append("email", formState.email);
      formData.append("username", formState.username);
      formData.append("password", formState.password);

      // Call sign up server action
      const result = await signUp(formData);

      if (result.status === "success") {
        // Clear form on success
        setFormState({
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
        });
        // Redirect to dashboard
        router.push("/");
      } else {
        // Show error message from server
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100">Create Account</h2>
        <p className="text-sm text-gray-400 mt-2">Join us today and get started</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-200">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formState.email}
            onChange={handleChange}
            placeholder="you@example.com"
            disabled={loading}
            className="mt-1 w-full px-4 py-2 h-10 rounded-md border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-200">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formState.username}
            onChange={handleChange}
            placeholder="johndoe"
            disabled={loading}
            className="mt-1 w-full px-4 py-2 h-10 rounded-md border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-200">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formState.password}
            onChange={handleChange}
            placeholder="••••••••"
            disabled={loading}
            className="mt-1 w-full px-4 py-2 h-10 rounded-md border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Min. 8 characters</p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formState.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            disabled={loading}
            className="mt-1 w-full px-4 py-2 h-10 rounded-md border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-2">
          <AuthButton type="Sign up" loading={loading} />
        </div>

        {/* Login Link */}
        <div className="text-center text-sm">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link href="/accounts/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
