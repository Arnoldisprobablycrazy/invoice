"use client";

import React, { useState, useRef, useEffect } from "react";
import AuthButton from "./AuthButton";
import Link from "next/link";
import { signIn } from "@/actions/auth";
import type { LoginFormState } from "@/lib/auth-interfaces";

/**
 * LOGIN FORM COMPONENT
 *
 * Handles user authentication with email/password.
 *
 * SECURITY NOTES:
 * - Form uses method="post" so if it ever submits natively (e.g. before
 *   React hydrates), credentials go in the request body, never the URL.
 * - action="#" prevents navigation on accidental native submit.
 * - A DOM-level submit listener calls preventDefault() as a second line
 *   of defense, so native GET submission is impossible.
 * - The submit button is disabled until React has mounted, so the user
 *   can't click before handlers are attached.
 */
const LoginForm = () => {
  const [formState, setFormState] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Mark component as mounted to enable the submit button
  useEffect(() => {
    setMounted(true);
  }, []);

  // DOM-level preventDefault — belt & suspenders against native GET submit
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const blockNativeSubmit = (e: Event) => {
      e.preventDefault();
    };

    form.addEventListener("submit", blockNativeSubmit);
    return () => {
      form.removeEventListener("submit", blockNativeSubmit);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formState.email || !formState.password) {
      return "Email and password are required";
    }
    if (!formState.email.includes("@")) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (loading) return;

    setLoading(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", formState.email.trim().toLowerCase());
      formData.append("password", formState.password);

      const result = await signIn(formData);

      if (result.status === "success") {
        setFormState({ email: "", password: "" });
        // Hard navigation ensures the fresh cookie is sent on the next request
        window.location.assign("/dashboard");
      } else {
        setError(result.message || "Login failed");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100">Welcome back</h2>
        <p className="text-sm text-gray-400 mt-2">
          Sign in to your account to continue
        </p>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        method="post"
        action="#"
        noValidate
        autoComplete="on"
        className="w-full flex flex-col gap-4"
      >
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-200"
          >
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
            autoComplete="email"
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 w-full px-4 py-3 h-12 rounded-md border border-gray-300 bg-white text-base text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200"
            >
              Password
            </label>
            <Link
              href="/accounts/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={formState.password}
            onChange={handleChange}
            placeholder="••••••••"
            disabled={loading}
            autoComplete="current-password"
            className="mt-1 w-full px-4 py-3 h-12 rounded-md border border-gray-300 bg-white text-base text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-md"
          >
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-2">
          <AuthButton type="login" loading={loading} disabled={!mounted} />
        </div>

        {/* Signup Link */}
        <div className="text-center text-sm">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/accounts/auth/signup"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;