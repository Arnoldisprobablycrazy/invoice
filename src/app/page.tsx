// pages/index.tsx
"use client"
import LoginForm from '@/components/LoginForm'
import Head from 'next/head'
import Link from 'next/link'
import { useState, FormEvent, ChangeEvent } from 'react'

export default function Home() {
  const [email, setEmail] = useState<string>('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    // Here you would typically handle the email submission
    alert(`Thanks for your interest! We'll contact you at ${email}`)
    setEmail('')
  }

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gradient-brand">
      <Head>
        <title>Invoicer | Modern Invoice Management</title>
        <meta name="description" content="Streamline your invoicing process with InvoiceFlow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
          <span className="text-2xl font-bold text-brand-butns">Invoicer</span>
        </div>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-gray-600 hover:text-indigo-600">Features</a>
          <a href="#testimonials" className="text-gray-600 hover:text-indigo-600">Testimonials</a>
          <a href="#pricing" className="text-gray-600 hover:text-indigo-600">Pricing</a>
        </div>
       <Link href="/accounts/register">
  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
    Get Started
  </button>
</Link>

        <Link href="/accounts/login">
  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
    Login
  </button>
</Link>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-6">
            Streamline Your <span className="text-brand-butns">Invoicing Process</span> with Ease
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Create, send, and manage professional invoices in minutes. Get paid faster with our intuitive invoice management system.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Start Free Trial
            </button>
            <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
              Watch Demo
            </button>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="bg-white p-6 rounded-xl shadow-lg transform rotate-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">INVOICE</h3>
                <span className="text-indigo-600 font-semibold">#INV-0032</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-500 text-sm">From:</p>
                  <p className="font-medium">Your Company Name</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">To:</p>
                  <p className="font-medium">Client Company</p>
                </div>
              </div>
              <div className="border-t border-b py-3 mb-4">
                <div className="flex justify-between">
                  <span>Service Fee</span>
                  <span>$850.00</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL</span>
                <span>$850.00</span>
              </div>
            </div>
            <div className="absolute -z-20 top-2 left-2 w-full h-full bg-brand-butns rounded-xl transform -rotate-3"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to manage your invoices efficiently and get paid faster</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-brand ">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Simplify Your Invoicing?</h2>
          <p className=" mb-8 max-w-2xl mx-auto">Join thousands of businesses that use InvoiceFlow to save time and get paid faster.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto sm:max-w-lg">
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              className="flex-grow px-4 py-3 rounded-l-lg sm:rounded-r-none sm:rounded-l-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-butns"
              required
            />
            <button
              type="submit"
              className="mt-2 sm:mt-0 bg-white text-brand-butns px-6 py-3 rounded-r-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Get Started
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
              <span className="text-xl font-bold">InvoiceFlow</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white">Contact</a>
            </div>
          </div>
          <div className="text-center text-gray-400 mt-8">
            <p>© {new Date().getFullYear()} InvoiceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: "✨",
    title: "Professional Templates",
    description: "Create beautiful, customizable invoices that represent your brand professionally."
  },
  {
    icon: "⚡",
    title: "Instant Delivery",
    description: "Send invoices directly to your clients via email with just a few clicks."
  },
  {
    icon: "🔔",
    title: "Payment Reminders",
    description: "Automatically send reminders for overdue invoices to ensure you get paid on time."
  },
  {
    icon: "📊",
    title: "Financial Reports",
    description: "Generate insightful reports to track your income, expenses, and overall financial health."
  },
  {
    icon: "🌐",
    title: "Multi-Currency",
    description: "Create invoices in different currencies for your international clients with ease."
  },
  {
    icon: "🔒",
    title: "Secure & Reliable",
    description: "Your data is safe with bank-level security and regular backups for peace of mind."
  }
]