'use client';

import React, { useState } from 'react';
import { SpreadsheetRow } from '@/types';

interface FollowUpPopupProps {
  row: SpreadsheetRow;
  onClose: () => void;
  onSave: (followUpData: {
    channels: string[];
    notes: string;
    createDate: Date;
  }) => void;
}

const FollowUpPopup: React.FC<FollowUpPopupProps> = ({ row, onClose, onSave }) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(row.followUpChannels || []);
  const [notes, setNotes] = useState('');

  const handleChannelChange = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSave = () => {
    if (selectedChannels.length === 0 || !notes.trim()) {
      alert('Please select at least one channel and add notes');
      return;
    }

    onSave({
      channels: selectedChannels,
      notes: notes.trim(),
      createDate: new Date()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Add Follow-up</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-[#fb8110] transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">Follow-up Channels</h3>
            <div className="grid grid-cols-2 gap-4">
              {['Email', 'Phone', 'WhatsApp', 'Meeting'].map((channel) => (
                <label key={channel} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel)}
                    onChange={() => handleChannelChange(channel)}
                    className="h-4 w-4 text-[#fb8110] focus:ring-[#fb8110] border-gray-300 rounded"
                  />
                  <span className="text-slate-700">{channel}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fb8110]"
              placeholder="Enter follow-up notes..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#fb8110] text-white rounded-md hover:bg-[#e67300] focus:outline-none focus:ring-2 focus:ring-[#fb8110]"
            >
              Save Follow-up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowUpPopup; 