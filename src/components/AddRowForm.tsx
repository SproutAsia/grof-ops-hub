'use client';

import React, { useState, useEffect } from 'react';
import { SpreadsheetRow } from '@/types';

interface AddRowFormProps {
  onAddRow: (row: SpreadsheetRow) => void;
}

const AddRowForm: React.FC<AddRowFormProps> = ({ onAddRow }) => {
  const [formData, setFormData] = useState<Partial<SpreadsheetRow>>({
    priority: 'Medium',
    paymentStatus: '',
    followUpCount: 0,
    followUpChannels: [],
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClient) return;

    const newRow: SpreadsheetRow = {
      id: crypto.randomUUID(),
      so: formData.so || '',
      creationDate: formData.creationDate || new Date(),
      customer: formData.customer || '',
      company: formData.company || '',
      contactNumber: formData.contactNumber || '',
      emailAddress: formData.emailAddress || '',
      uen: formData.uen || '',
      rpaNfye: formData.rpaNfye || '',
      amount: formData.amount || 0,
      type: formData.type || '',
      priority: formData.priority || 'Medium',
      paymentStatus: formData.paymentStatus || '',
      pic: formData.pic || '',
      followUpChannels: formData.followUpChannels || [],
      followUpNotes: formData.followUpNotes || '',
      followUpCount: formData.followUpCount || 0,
      lastFollowUpDate: formData.lastFollowUpDate || new Date(),
      partner_id: formData.partner_id || [0, ''],
      create_date: formData.create_date || '',
      existing_subs_from_chargebee: formData.existing_subs_from_chargebee || '',
      x_studio_cb_subscription_id: formData.x_studio_cb_subscription_id || '',
      existingChargebeeSubs: formData.existingChargebeeSubs || null,
    };
    onAddRow(newRow);
    setFormData({});
  };

  if (!isClient) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">SO</label>
          <input
            type="text"
            value={formData.so || ''}
            onChange={(e) => setFormData({ ...formData, so: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer</label>
          <input
            type="text"
            value={formData.customer || ''}
            onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Number</label>
          <input
            type="text"
            value={formData.contactNumber || ''}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            value={formData.emailAddress || ''}
            onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            value={formData.priority || 'Medium'}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add Row
      </button>
    </form>
  );
};

export default AddRowForm; 