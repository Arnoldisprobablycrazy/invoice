"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { CurrentUserResponse } from "@/lib/auth-interfaces";

/**
 * DASHBOARD COMPONENT
 * 
 * Displays user information and dashboard overview
 * - Fetches current user from JWT token
 * - Shows welcome message
 * - Provides navigation and logout
 */
export default function Dashboard() {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    /**
     * Fetch current user info from JWT token
     */
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // Send cookies
        });

        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push("/accounts/(auth)/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        router.push("/accounts/(auth)/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/accounts/(auth)/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load user"}</p>
          <Link href="/accounts/(auth)/login">
            <button className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700">
              Return to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.svg"
                alt="Invoicer Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invoicer</h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.username}! 👋
          </h2>
          <p className="text-gray-600">
            Here&apos;s your invoice management dashboard. Get started by creating your first invoice.
          </p>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Email Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Email</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {user.email}
                </p>
              </div>
              <div className="text-3xl">✉️</div>
            </div>
          </div>

          {/* Role Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Account Type</p>
                <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                  {user.role}
                </p>
              </div>
              <div className="text-3xl">
                {user.role === "admin" ? "👑" : "👤"}
              </div>
            </div>
          </div>

          {/* User ID Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">User ID</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  #{user.userId}
                </p>
              </div>
              <div className="text-3xl">🆔</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/invoices/new">
              <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                <span>➕</span>
                Create Invoice
              </button>
            </Link>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              <span>👁️</span>
              View Invoices
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              <span>👥</span>
              Manage Clients
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              <span>⚙️</span>
              Settings
            </button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <p className="text-blue-600 text-sm font-medium">Total Invoices</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">0</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <p className="text-green-600 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-green-900 mt-2">$0.00</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <p className="text-orange-600 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-orange-900 mt-2">0</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <p className="text-purple-600 text-sm font-medium">Total Clients</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
