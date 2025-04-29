export interface SpreadsheetRow {
  id: string;
  so: string;
  creationDate: Date | null;
  customer: string;
  company: string;
  contactNumber: string;
  emailAddress: string;
  uen: string;
  rpaNfye: string;
  amount: number;
  existingChargebeeSubs: string | null;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  paymentStatus: 'Paid' | '';
  pic: string;
  followUpChannels: string[];
  followUpNotes: string;
  followUpCount: number;
  lastFollowUpDate: Date;
  partner_id: [number, string];
  create_date: string;
  existing_subs_from_chargebee: string;
  x_studio_cb_subscription_id: string;
} 