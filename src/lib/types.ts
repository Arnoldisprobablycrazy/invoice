export type InvoiceStatus =
  | 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface Business {
  id: number;
  user_id: number;
  name: string;
  kra_pin: string | null;
  vat_registered: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  mpesa_till: string | null;
  mpesa_paybill: string | null;
  bank_details: string | null;
  invoice_prefix: string;
  next_invoice_number: number;
  default_tax_rate: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  business_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  kra_pin: string | null;
  address: string | null;
  notes: string | null;
}

export interface Product {
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  unit_price: number;
  tax_rate: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: number;
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  sort_order?: number;
}

export interface Invoice {
  id: number;
  business_id: number;
  client_id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  public_token: string;
  etims_status: 'not_submitted' | 'pending' | 'submitted' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithRelations extends Invoice {
  client: Client;
  business: Business;
  items: InvoiceItem[];
}

export type PaymentMethod = 'mpesa' | 'bank' | 'cash' | 'cheque' | 'card';

export interface Payment {
  id: number;
  business_id: number;
  invoice_id: number;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string;
  notes: string | null;
  recorded_by: number | null;
}

export interface InvoiceListItem extends Invoice {
  client_name: string;
}