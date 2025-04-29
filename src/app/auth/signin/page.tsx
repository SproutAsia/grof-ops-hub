'use client';

import React from 'react';
import { SignInButton } from '@/components/SignInButton';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-16 relative">
              <Image
                src="/gro-black.svg"
                alt="Grof Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Grof Operation Hub
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access our Dashboard
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="flex justify-center">
              <SignInButton />
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Secure Microsoft Authentication
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Need help? Contact{' '}
              <a href="mailto:support@grof.co" className="font-medium text-[#fb8110] hover:text-[#e6740e]">
                support@grof.co
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 