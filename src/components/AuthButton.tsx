"use client";

import React from "react";

interface AuthButtonProps {
  type: "login" | "Sign up" | "Reset Password" | "Forgot Password" | string;
  loading: boolean;
  disabled?: boolean;
}

const AuthButton = ({ type, loading, disabled }: AuthButtonProps) => {
  const label =
    type === "login"
      ? "Sign In"
      : type === "Sign up"
      ? "Sign Up"
      : type;

  const isDisabled = disabled || loading;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={loading}
      className={`rounded-md w-full px-12 py-3 text-sm font-medium text-white transition-colors ${
        isDisabled
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {loading ? "Loading..." : label}
    </button>
  );
};

export default AuthButton;