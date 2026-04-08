"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CurrentUserResponse } from "@/lib/auth-interfaces";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/ui/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Authentication Error
            </CardTitle>
            <CardDescription>{error || "Failed to load user data"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/accounts/(auth)/login">
              <Button className="w-full" variant="default">
                Return to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen bg-gray-50">
        <AppSidebar user={{ username: user.username, email: user.email, role: user.role }} />

        <main className="flex-1 overflow-auto">
          {/* Top Bar */}
          <div className="border-b bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              </div>
              <div className="text-sm text-gray-600">
                Welcome back, <span className="font-semibold">{user.username}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user.username}!</h2>
              <p className="text-blue-100 mb-6">
                Manage your invoices, clients, and track your business performance all in one place.
              </p>
              <Link href="/invoices/new">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Invoice
                </Button>
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Invoices */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-600">
                    Total Invoices
                    <FileText className="w-4 h-4 text-gray-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">12</div>
                  <p className="text-xs text-gray-500 mt-1">+2 this month</p>
                </CardContent>
              </Card>

              {/* Pending */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-600">
                    Pending
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">3</div>
                  <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
                </CardContent>
              </Card>

              {/* Paid */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-600">
                    Paid
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">9</div>
                  <p className="text-xs text-gray-500 mt-1">Completed</p>
                </CardContent>
              </Card>

              {/* Total Clients */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-600">
                    Total Clients
                    <Users className="w-4 h-4 text-purple-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">8</div>
                  <p className="text-xs text-gray-500 mt-1">Active clients</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Get things done faster</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/invoices/new">
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <Plus className="w-4 h-4" />
                      Create Invoice
                    </Button>
                  </Link>
                  <Link href="/invoices">
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <FileText className="w-4 h-4" />
                      View All Invoices
                    </Button>
                  </Link>
                  <Link href="/clients">
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <Users className="w-4 h-4" />
                      Manage Clients
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Revenue Chart Placeholder */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>Last 30 days performance</CardDescription>
                </CardHeader>
                <CardContent className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Revenue chart coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your profile details</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Email Address</p>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Username</p>
                  <p className="text-gray-900 font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Account Type</p>
                  <p className="text-gray-900 font-medium capitalize">{user.role}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
