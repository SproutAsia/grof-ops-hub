import React from 'react';
import Spreadsheet from '@/components/Spreadsheet';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Odoo Renewal Dashboard</h1>
        </div>
        <div className="max-w-full">
          <Spreadsheet />
        </div>
      </div>
    </main>
  );
} 