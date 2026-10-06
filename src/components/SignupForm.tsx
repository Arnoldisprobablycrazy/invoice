'use client';

import React, { useState, useRef, useEffect } from 'react';
import AuthButton from './AuthButton';
import Link from 'next/link';
import { signUp } from '@/actions/auth';

interface SignupFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupForm = () => {
  const [formState, setFormState] = useState<SignupFormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const block = (e: Event) => e.preventDefault();
    form.addEventListener('submit', block);
    return () => form.removeEventListener('submit', block);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!formState.username || !formState.email || !formState.password) {
      return 'All fields are required';
    }
    if (formState.username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (!formState.email.includes('@')) {
      return 'Please enter a valid email';
    }
    if (formState.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (formState.password !== formState.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', formState.username.trim());
      formData.append('email', formState.email.trim().toLowerCase());
      formData.append('password', formState.password);

      const result = await signUp(formData);

      if (result.status === 'success') {
        window.location.assign('/dashboard');
      } else {
        setError(result.message || 'Signup failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100">Create your account</h2>
        <p className="text-sm text-gray-400 mt-2">
          Start invoicing in under a minute
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
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-200">
            Business or Your Name
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formState.username}
            onChange={handleChange}
            placeholder="Kamau Hardware"
            disabled={loading}
            autoComplete="organization"
            className="mt-1 w-full px-4 py-3 h-12 rounded-md border border-gray-300 bg-white text-base text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

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
            autoComplete="email"
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 w-full px-4 py-3 h-12 rounded-md border border-gray-300 bg-white text-base text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

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
            placeholder="At least 8 characters"
            disabled={loading}
            autoComplete="new-password"
            className="mt-1 w-full px-4 py-3 h-12 rounded-md border border-gray-300 bg-white text-base text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

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
            placeholder="Re-enter password"
            disabled={loading}
            autoComplete="new-password"
            className="mt-1 w-full px-4 py-3 h-12 rounded-md border border-gray-300 bg-white text-base text-gray-700 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-2">
          <AuthButton type="Sign up" loading={loading} disabled={!mounted} />
        </div>

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Already have an account?{' '}
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