'use client';

import React, { useState, useEffect } from 'react';
import { SpreadsheetRow } from '@/types';
import { getPaymentStatus } from '@/services/stripeService';
import { fetchOdooData } from '@/services/odooService';
import FollowUpPopup from './FollowUpPopup';
import { getPriorityEmoji } from '@/utils/helpers';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CustomerDetailsPopupProps {
  row: SpreadsheetRow;
  onClose: () => void;
  followUpLogs: FollowUpLog[];
  onDeleteFollowUpLog: (logId: string) => void;
}

const hasMissingFields = (row: SpreadsheetRow) => {
  return !row.uen || row.uen === 'N/A' || !row.contactNumber || 
         (row.existing_subs_from_chargebee === 'Yes' && (!row.x_studio_cb_subscription_id || row.x_studio_cb_subscription_id === 'N/A'));
};

const MissingFieldAlert = ({ field, partnerId, isTable = false, rowId }: { field: string, partnerId: number, isTable?: boolean, rowId?: string }) => {
  const getUrl = () => {
    if (field === 'CB Subs ID' && rowId) {
      return `https://business.grof.co/odoo/sales/${rowId}`;
    }
    return `https://business.grof.co/odoo/contacts/${partnerId}`;
  };

  if (isTable) {
    return (
      <span className="inline-flex items-center text-red-600 ml-2" title={`Missing ${field}`}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </span>
    );
  }

  return (
    <a
      href={getUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center bg-red-50 text-red-600 hover:text-red-800 hover:bg-red-100 px-2 py-1 rounded-md ml-2 transition-colors duration-200"
      title={`Missing ${field}. Click to update in Odoo.`}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <span className="ml-1 text-sm font-medium">Update in Odoo</span>
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
};

const CustomerDetailsPopup: React.FC<CustomerDetailsPopupProps> = ({ row, onClose, followUpLogs, onDeleteFollowUpLog }) => {
  const { data: session } = useSession();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Customer Details</h2>
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
          {/* Customer Information Section */}
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Customer Name</h3>
                <p className="text-base text-slate-900">{row.partner_id?.[1] || 'N/A'}</p>
            </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Creation Date</h3>
                <p className="text-base text-slate-900">
                {row.create_date ? new Date(row.create_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Type</h3>
                <p className="text-base text-slate-900">{row.type || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Priority</h3>
                <p className="text-base text-slate-900 flex items-center gap-2">
                  <span className="text-lg">{getPriorityEmoji(row.priority)}</span>
                  {row.priority || 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">UEN</h3>
              <div className="flex items-center">
                  <p className="text-base text-slate-900">{row.uen || 'N/A'}</p>
                {(!row.uen || row.uen === 'N/A') && row.partner_id?.[0] && (
                  <MissingFieldAlert field="UEN" partnerId={row.partner_id[0]} />
                )}
              </div>
            </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Email</h3>
                <p className="text-base text-slate-900">{row.emailAddress || 'N/A'}</p>
            </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Phone</h3>
                <div className="flex items-center">
                  <p className="text-base text-slate-900">{row.contactNumber || 'N/A'}</p>
                  {!row.contactNumber && row.partner_id?.[0] && (
                    <MissingFieldAlert field="phone number" partnerId={row.partner_id[0]} />
                  )}
            </div>
            </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Existing Subscriptions</h3>
                <p className="text-base text-slate-900">{row.existing_subs_from_chargebee || 'N/A'}</p>
          </div>
              {row.existing_subs_from_chargebee === 'Yes' && (
                <div className="p-4 rounded-lg bg-slate-100/50">
                  <h3 className="text-sm font-medium text-slate-600 mb-1">CB Subs ID</h3>
                <div className="flex items-center">
                    <p className="text-base text-slate-900">{row.x_studio_cb_subscription_id || 'N/A'}</p>
                    {(!row.x_studio_cb_subscription_id || row.x_studio_cb_subscription_id === 'N/A') && row.partner_id?.[0] && (
                      <MissingFieldAlert field="CB Subs ID" partnerId={row.partner_id[0]} rowId={row.id} />
                  )}
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Follow-up Information Section */}
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">Follow-up Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">PIC</h3>
                <p className="text-base text-slate-900">{row.pic || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Follow-up Count</h3>
                <p className="text-base text-slate-900">{row.followUpCount || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Last Follow-up Date</h3>
                <p className="text-base text-slate-900">
                  {row.followUpCount > 0 && row.lastFollowUpDate 
                    ? new Date(row.lastFollowUpDate).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100/50">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Follow-up Channels</h3>
                <p className="text-base text-slate-900">{row.followUpChannels?.join(', ') || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {followUpLogs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Follow-up History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Added By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Channels</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {followUpLogs.map((log, index) => (
                    <tr key={log.id || index}>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {new Date(log.createDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div className="relative group">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                            {log.userEmail.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            {session?.user?.name || 'Unknown User'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {log.channels.join(', ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {log.notes}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <button
                          onClick={() => onDeleteFollowUpLog(log.id)}
                          className="text-red-600 hover:text-red-800 focus:outline-none"
                          title="Delete follow-up"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CustomerDetails {
  email: string;
  phone: string;
}

interface FollowUpLog {
  id: string;
  createDate: Date;
  channels: string[];
  notes: string;
  userId: string;
  userEmail: string;
}

interface FollowUp {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const Spreadsheet: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);
  const [filters, setFilters] = useState<{
    priority: string | null;
    type: string | null;
    paymentStatus: string | null;
    pic: string | null;
  }>({
    priority: null,
    type: null,
    paymentStatus: null,
    pic: null
  });
  const [selectedCustomer, setSelectedCustomer] = useState<SpreadsheetRow | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const currentDate = new Date();
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  });
  const [followUpLogs, setFollowUpLogs] = useState<{ [key: string]: FollowUpLog[] }>({});
  const [showFollowUpPopup, setShowFollowUpPopup] = useState<SpreadsheetRow | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  const columnToPropertyMap: { [key: string]: keyof SpreadsheetRow } = {
    'SO': 'so',
    'Creation Date': 'creationDate',
    'Customer': 'customer',
    'Contact Number': 'contactNumber',
    'Email Address': 'emailAddress',
    'UEN': 'uen',
    'RPA NFYE': 'rpaNfye',
    'Amount': 'amount',
    'Existing Subs From Chargebee?': 'existingChargebeeSubs',
    'Type': 'type',
    'Priority': 'priority',
    'Payment Status': 'paymentStatus',
    'PIC': 'pic',
    'Follow-up Channels': 'followUpChannels',
    'Last Follow Up Note': 'followUpNotes',
    'Follow-Up Count': 'followUpCount',
    'Last Follow-up Date': 'lastFollowUpDate'
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin');
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, selectedMonth, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchOdooData(selectedMonth);
      setRows(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    'SO',
    'Customer',
    'Contact Number',
    'Email Address',
    'Amount',
    'Payment Status',
    'PIC'
  ];

  const handleCellClick = (rowId: string, column: string, value: any) => {
    setEditingCell({ rowId, column });
    setEditValue(value?.toString() || '');
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = () => {
    if (!editingCell) return;

    const { rowId, column } = editingCell;
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row };
        switch (column) {
          case 'SO':
            updatedRow.so = editValue;
            break;
          case 'Creation Date':
            updatedRow.creationDate = editValue ? new Date(editValue) : null;
            break;
          case 'Customer':
            updatedRow.customer = editValue;
            break;
          case 'Contact Number':
            updatedRow.contactNumber = editValue;
            break;
          case 'Email Address':
            updatedRow.emailAddress = editValue;
            break;
          case 'UEN':
            updatedRow.uen = editValue;
            break;
          case 'RPA NFYE':
            updatedRow.rpaNfye = editValue;
            break;
          case 'Amount':
            updatedRow.amount = Number(editValue);
            break;
          case 'Existing Subs From Chargebee?':
            updatedRow.existingChargebeeSubs = editValue;
            break;
          case 'Type':
            updatedRow.type = editValue;
            break;
          case 'Priority':
            updatedRow.priority = editValue as 'High' | 'Medium' | 'Low';
            break;
          case 'Payment Status':
            updatedRow.paymentStatus = editValue as 'Paid' | '';
            break;
          case 'PIC':
            updatedRow.pic = editValue;
            break;
          case 'Follow-up Channels':
            updatedRow.followUpChannels = editValue.split(',').map(channel => channel.trim());
            break;
          case 'Last Follow Up Note':
            updatedRow.followUpNotes = editValue;
            break;
          case 'Follow-Up Count':
            updatedRow.followUpCount = Number(editValue);
            break;
          case 'Last Follow-up Date':
            updatedRow.lastFollowUpDate = new Date(editValue);
            break;
        }
        return updatedRow;
      }
      return row;
    }));
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const createEmptyRow = (): SpreadsheetRow => ({
    id: crypto.randomUUID(),
    so: '',
    creationDate: null,
    customer: '',
    company: '',
    contactNumber: '',
    emailAddress: '',
    uen: '',
    rpaNfye: '',
    amount: 0,
    existingChargebeeSubs: null,
    type: '',
    priority: 'Low',
    paymentStatus: '',
    pic: '',
    followUpChannels: [],
    followUpNotes: '',
    followUpCount: 0,
    lastFollowUpDate: new Date(),
    partner_id: [0, ''],
    create_date: new Date().toISOString(),
    existing_subs_from_chargebee: '',
    x_studio_cb_subscription_id: ''
  });

  const handleAddRow = () => {
    const newRow = createEmptyRow();
    setRows([...rows, newRow]);
  };

  const handleSort = (column: string) => {
    const property = columnToPropertyMap[column];
    if (!property) return;

    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === property && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: property, direction });
  };

  const getSortedRows = (rows: SpreadsheetRow[]) => {
    if (!sortConfig) return rows;

    return [...rows].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof SpreadsheetRow];
      const bValue = b[sortConfig.key as keyof SpreadsheetRow];

      // Handle null values
      if (aValue === null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue === null) return sortConfig.direction === 'ascending' ? 1 : -1;

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'ascending'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending'
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle arrays (for followUpChannels)
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        return sortConfig.direction === 'ascending'
          ? aValue.join(', ').localeCompare(bValue.join(', '))
          : bValue.join(', ').localeCompare(aValue.join(', '));
      }

      return 0;
    });
  };

  const handleFilterChange = (column: keyof typeof filters, value: string | null) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const getFilteredRows = (rows: SpreadsheetRow[]) => {
    return rows.filter(row => {
      if (filters.priority && row.priority !== filters.priority) return false;
      if (filters.type && row.type !== filters.type) return false;
      if (filters.paymentStatus && row.paymentStatus !== filters.paymentStatus) return false;
      if (filters.pic && row.pic !== filters.pic) return false;
      return true;
    });
  };

  // Generate month options for the dropdown
  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Generate options for the past 12 months and next 12 months
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      const startMonth = year === currentYear - 1 ? 0 : 
                        year === currentYear ? 0 : 
                        currentMonth;
      const endMonth = year === currentYear - 1 ? 11 : 
                       year === currentYear ? currentMonth : 
                       11;
      
      for (let month = startMonth; month <= endMonth; month++) {
        const monthValue = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
        options.push({ value: monthValue, label: monthName });
      }
    }
    
    return options;
  };

  const handleDateChange = (rowId: string, date: Date | null) => {
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId 
          ? { ...row, followUpDate: date } 
          : row
      )
    );
  };

  const handleLastFollowUpDateChange = (rowId: string, date: Date | null) => {
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId 
          ? { ...row, lastFollowUpDate: date || new Date() } 
          : row
      )
    );
  };

  const handleSaveFollowUp = async (rowId: string, followUpData: {
    channels: string[];
    notes: string;
    createDate: Date;
  }) => {
    try {
      const response = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: rowId,
          channels: followUpData.channels,
          notes: followUpData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save follow-up');
      }

      const newFollowUp = await response.json();
      console.log('New follow-up created:', newFollowUp);

      // Update the follow-up logs
      setFollowUpLogs(prev => {
        const currentLogs = prev[rowId] || [];
        return {
          ...prev,
          [rowId]: [newFollowUp, ...currentLogs],
        };
      });

      // Update the row with the new follow-up data
      setRows(prevRows => 
        prevRows.map(row => {
          if (row.id === rowId) {
            return {
              ...row,
              followUpChannels: newFollowUp.channels,
              followUpNotes: newFollowUp.notes,
              followUpCount: (row.followUpCount || 0) + 1,
              lastFollowUpDate: new Date(newFollowUp.createDate),
            };
          }
          return row;
        })
      );

      setShowFollowUpPopup(null);
    } catch (error) {
      console.error('Error saving follow-up:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const handleDeleteFollowUpLog = async (rowId: string, logId: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${logId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete follow-up');
      }

      // Refresh the follow-up logs
      const followUpsResponse = await fetch(`/api/follow-ups?saleId=${rowId}`);
      if (!followUpsResponse.ok) {
        throw new Error('Failed to fetch follow-ups');
      }

      const followUps = await followUpsResponse.json();
      setFollowUpLogs(prev => ({
        ...prev,
        [rowId]: followUps,
      }));

      // Update the row with the latest follow-up data
      setRows(prevRows => 
        prevRows.map(row => {
          if (row.id === rowId) {
            const lastFollowUp = followUps[0];
            return {
              ...row,
              followUpChannels: lastFollowUp?.channels || [],
              followUpNotes: lastFollowUp?.notes || '',
              followUpCount: followUps.length,
              lastFollowUpDate: lastFollowUp ? new Date(lastFollowUp.createDate) : new Date(),
            };
          }
          return row;
        })
      );
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  // Load follow-up logs when component mounts
  useEffect(() => {
    const loadFollowUpLogs = async () => {
      const logs: { [key: string]: FollowUpLog[] } = {};
      for (const row of rows) {
        try {
          const response = await fetch(`/api/follow-ups?saleId=${row.id}`);
          if (response.ok) {
            const followUps = await response.json();
            logs[row.id] = followUps;
          }
        } catch (error) {
          console.error(`Error loading follow-ups for row ${row.id}:`, error);
        }
      }
      setFollowUpLogs(logs);
    };

    if (rows.length > 0) {
      loadFollowUpLogs();
    }
  }, [rows]);

  const getWeekRanges = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weeks = [];
    
    let currentDate = new Date(firstDay);
    while (currentDate <= lastDay) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > lastDay) weekEnd.setDate(lastDay.getDate());
      
      weeks.push({
        start: weekStart,
        end: weekEnd
      });
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks.map(week => 
      `${week.start.getDate()} ${week.start.toLocaleString('default', { month: 'short' })} - ${week.end.getDate()} ${week.end.toLocaleString('default', { month: 'short' })}`
    );
  };

  const getWeeklyAmount = (paymentStatus: 'Paid' | 'Not Paid', weekRange: string, type?: 'Renewal' | 'New Lead') => {
    const [startDate, endDate] = weekRange.split(' - ').map(date => {
      const [day, month] = date.split(' ');
      const year = new Date().getFullYear();
      return new Date(`${month} ${day}, ${year}`);
    });

    return rows
      .filter(row => {
        const rowDate = new Date(row.create_date);
        const isInWeek = rowDate >= startDate && rowDate <= endDate;
        const matchesPaymentStatus = paymentStatus === 'Paid' ? row.paymentStatus === 'Paid' : row.paymentStatus !== 'Paid';
        const matchesType = type ? row.type === type : true;
        return isInWeek && matchesPaymentStatus && matchesType;
      })
      .reduce((sum, row) => sum + (row.amount || 0), 0)
      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Loading Large Dataset</p>
          <p className="text-sm text-gray-500">This may take a few moments, please be patient...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // This will be handled by the redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Loading Large Dataset</p>
          <p className="text-sm text-gray-500">This may take a few moments, please be patient...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Summary Table */}
      <div className="bg-slate-50 p-4 mb-6 rounded-lg shadow-md">
        <h2 className="text-base font-semibold text-slate-800 mb-3">Summary</h2>
        <table className="min-w-full divide-y divide-slate-200 bg-white rounded-lg shadow-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Category</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Count</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            <tr>
              <td className="px-4 py-2 text-sm text-slate-900">Total Paid</td>
              <td className="px-4 py-2 text-sm text-slate-900">{rows.filter(row => row.paymentStatus === 'Paid').length}</td>
              <td className="px-4 py-2 text-sm text-slate-900">${rows.filter(row => row.paymentStatus === 'Paid').reduce((sum, row) => sum + (row.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-slate-900">Total Unpaid</td>
              <td className="px-4 py-2 text-sm text-slate-900">{rows.filter(row => row.paymentStatus !== 'Paid').length}</td>
              <td className="px-4 py-2 text-sm text-slate-900">${rows.filter(row => row.paymentStatus !== 'Paid').reduce((sum, row) => sum + (row.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-slate-900">Total Renewal (Paid)</td>
              <td className="px-4 py-2 text-sm text-slate-900">{rows.filter(row => row.paymentStatus === 'Paid' && row.type === 'Renewal').length}</td>
              <td className="px-4 py-2 text-sm text-slate-900">${rows.filter(row => row.paymentStatus === 'Paid' && row.type === 'Renewal').reduce((sum, row) => sum + (row.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-slate-900">Total Renewal (Unpaid)</td>
              <td className="px-4 py-2 text-sm text-slate-900">{rows.filter(row => row.paymentStatus !== 'Paid' && row.type === 'Renewal').length}</td>
              <td className="px-4 py-2 text-sm text-slate-900">${rows.filter(row => row.paymentStatus !== 'Paid' && row.type === 'Renewal').reduce((sum, row) => sum + (row.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-slate-900">Total New Lead (Paid)</td>
              <td className="px-4 py-2 text-sm text-slate-900">{rows.filter(row => row.paymentStatus === 'Paid' && row.type === 'New Lead').length}</td>
              <td className="px-4 py-2 text-sm text-slate-900">${rows.filter(row => row.paymentStatus === 'Paid' && row.type === 'New Lead').reduce((sum, row) => sum + (row.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-slate-900">Total New Lead (Unpaid)</td>
              <td className="px-4 py-2 text-sm text-slate-900">{rows.filter(row => row.paymentStatus !== 'Paid' && row.type === 'New Lead').length}</td>
              <td className="px-4 py-2 text-sm text-slate-900">${rows.filter(row => row.paymentStatus !== 'Paid' && row.type === 'New Lead').reduce((sum, row) => sum + (row.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Main Table */}
      <div className="bg-white shadow-lg">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fb8110]"
            >
              {getMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <span className="text-lg">🌳</span>
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">🌱</span>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">🫘</span>
                <span>Low</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[#fb8110] text-white rounded-md hover:bg-[#e6740e] focus:outline-none focus:ring-2 focus:ring-[#fb8110] focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || null)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
              >
                <option value="">All Priorities</option>
                <option value="High">🌳 High</option>
                <option value="Medium">🌱 Medium</option>
                <option value="Low">🫘 Low</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || null)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="Renewal">Renewal</option>
                <option value="New Lead">New Lead</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
              <select
                value={filters.paymentStatus || ''}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value || null)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* PIC Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PIC</label>
              <select
                value={filters.pic || ''}
                onChange={(e) => handleFilterChange('pic', e.target.value || null)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
              >
                <option value="">All PICs</option>
                <option value="Selina">Selina</option>
                <option value="Ulysses">Ulysses</option>
                <option value="Krizza">Krizza</option>
                <option value="Emily">Emily</option>
                <option value="Jason">Jason</option>
                <option value="Jonnas">Jonnas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider border border-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center">
                          {column}
                          {sortConfig?.key === columnToPropertyMap[column] && (
                            <span className="ml-2">
                              {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider border border-slate-200 whitespace-nowrap">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider border border-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('Last Follow Up Note')}>
                      <div className="flex items-center">
                        Last Follow Up Note
                        {sortConfig?.key === 'followUpNotes' && (
                          <span className="ml-2">
                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider border border-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('Follow-Up Count')}>
                      <div className="flex items-center">
                        Follow-Up Count
                        {sortConfig?.key === 'followUpCount' && (
                          <span className="ml-2">
                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider border border-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('Last Follow-up Date')}>
                      <div className="flex items-center">
                        Last Follow-up Date
                        {sortConfig?.key === 'lastFollowUpDate' && (
                          <span className="ml-2">
                            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {getSortedRows(getFilteredRows(rows)).map((row) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      {columns.map((column) => {
                        let cellValue = '';

                        switch (column) {
                          case 'SO':
                            cellValue = row.so || '';
                            break;
                          case 'Customer':
                            cellValue = row.customer;
                            break;
                          case 'Contact Number':
                            cellValue = row.contactNumber;
                            break;
                          case 'Email Address':
                            cellValue = row.emailAddress;
                            break;
                          case 'Amount':
                            cellValue = row.amount.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            });
                            break;
                          case 'Payment Status':
                            cellValue = row.paymentStatus;
                            break;
                          case 'PIC':
                            cellValue = row.pic;
                            break;
                        }

                        return (
                          <td
                            key={`${row.id}-${column}`}
                            className="px-6 py-4 text-sm text-slate-900 border border-slate-200 whitespace-nowrap"
                            onClick={() => {
                              if (column === 'Customer') {
                                setSelectedCustomer(row);
                              }
                            }}
                          >
                            {column === 'SO' ? (
                              <a
                                href={`https://business.grof.co/odoo/sales/${row.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cellValue}
                              </a>
                            ) : column === 'Customer' ? (
                              <div className="flex items-center">
                                <button
                                  className="text-slate-900 hover:text-[#fb8110] focus:outline-none flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomer(row);
                                  }}
                                >
                                  <span className="text-lg">{getPriorityEmoji(row.priority)}</span>
                                  {cellValue}
                                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                {hasMissingFields(row) && row.partner_id?.[0] && (
                                  <MissingFieldAlert field="contact information" partnerId={row.partner_id[0]} isTable={true} />
                                )}
                              </div>
                            ) : (
                              <div className="min-h-[24px] flex items-center">
                                {cellValue}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-sm text-slate-900 border border-slate-200 whitespace-nowrap">
                        <button
                          onClick={() => setShowFollowUpPopup(row)}
                          className="px-3 py-1.5 text-[#fb8110] hover:text-white hover:bg-[#fb8110] rounded-md border border-[#fb8110] transition-all duration-200 ease-in-out flex items-center gap-1.5 group"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Follow-up</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 border border-slate-200 whitespace-nowrap">
                        <div className="min-h-[24px] flex items-center">
                          {row.followUpNotes}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 border border-slate-200 whitespace-nowrap">
                        <div className="min-h-[24px] flex items-center">
                          {row.followUpCount.toString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 border border-slate-200 whitespace-nowrap">
                        <div className="min-h-[24px] flex items-center">
                          {row.followUpCount > 0 && row.lastFollowUpDate 
                            ? new Date(row.lastFollowUpDate).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {selectedCustomer && (
        <CustomerDetailsPopup
          row={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          followUpLogs={followUpLogs[selectedCustomer.id] || []}
          onDeleteFollowUpLog={(logId) => handleDeleteFollowUpLog(selectedCustomer.id, logId)}
        />
      )}
      {showFollowUpPopup && (
        <FollowUpPopup
          row={showFollowUpPopup}
          onClose={() => setShowFollowUpPopup(null)}
          onSave={(followUpData) => {
            handleSaveFollowUp(showFollowUpPopup.id, followUpData);
            setShowFollowUpPopup(null);
          }}
        />
      )}
    </>
  );
};

export default Spreadsheet; 