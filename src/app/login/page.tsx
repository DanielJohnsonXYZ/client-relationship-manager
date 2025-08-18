'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to ClientTrust
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <LoginForm />

        <div className="text-center">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </button>
        </div>

        {showForgotPassword && <ForgotPasswordForm />}
      </div>
    </div>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock password reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center p-4 bg-green-50 rounded-md">
        <p className="text-sm text-green-600">
          Password reset instructions sent to {email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-md">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Reset Password</h3>
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          required
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </div>
    </form>
  );
}