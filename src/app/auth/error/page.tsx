'use client';

import { useSearchParams } from 'next/navigation';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700 mb-4">Error: {error}</p>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(searchParams.toString(), null, 2)}
        </pre>
      </div>
    </div>
  );
} 