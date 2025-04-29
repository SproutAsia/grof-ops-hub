"use client";
import React, { useEffect, useState } from 'react';
import { fetchOdooData } from '@/services/odooService';
import { SpreadsheetRow } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface RenewalCollectionData {
  data: {
    totalPaid: number[];
    totalUnpaid: number[];
    renewalPaid: number[];
    renewalUnpaid: number[];
    newLeadPaid: number[];
    newLeadUnpaid: number[];
  };
  weeks: {
    end: string;
  }[];
}

const RenewalCollectionPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RenewalCollectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/renewal-collection');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Loading Data</p>
          <p className="text-sm text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-red-600">{error}</div></div>;
  }
  if (!data) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Renewal & Collection Dashboard</h1>
      </div>
        <div className="max-w-full">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
              <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                    {data.weeks.map((week, index) => (
                      <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {formatDate(week.end)}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              <tr>
                    <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">Total Paid</td>
                    {data.data.totalPaid.map((amount, index) => (
                      <td key={index} className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                        {formatAmount(amount)}
                      </td>
                    ))}
              </tr>
              <tr>
                    <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">Total Unpaid</td>
                    {data.data.totalUnpaid.map((amount, index) => (
                      <td key={index} className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                        {formatAmount(amount)}
                      </td>
                    ))}
              </tr>
              <tr>
                    <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">Renewal Paid</td>
                    {data.data.renewalPaid.map((amount, index) => (
                      <td key={index} className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                        {formatAmount(amount)}
                      </td>
                    ))}
              </tr>
              <tr>
                    <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">Renewal Unpaid</td>
                    {data.data.renewalUnpaid.map((amount, index) => (
                      <td key={index} className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                        {formatAmount(amount)}
                      </td>
                    ))}
              </tr>
              <tr>
                    <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">New Lead Paid</td>
                    {data.data.newLeadPaid.map((amount, index) => (
                      <td key={index} className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                        {formatAmount(amount)}
                      </td>
                    ))}
              </tr>
              <tr>
                    <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">New Lead Unpaid</td>
                    {data.data.newLeadUnpaid.map((amount, index) => (
                      <td key={index} className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                        {formatAmount(amount)}
                      </td>
                    ))}
              </tr>
            </tbody>
          </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalCollectionPage; 