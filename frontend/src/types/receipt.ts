export interface ReceiptRead {
  id: number;
  category_id: number | null;
  payer_id: number;
  description: string;
  income: number;
  expense: number;
  discount: number;
  people_count: number;
  receipt_url: string | null;
  is_transferred: boolean;
  transaction_at: string;
  transferred_at: string | null;
}

export interface ReceiptCreate {
  category_id: number | null;
  payer_id: number;
  description: string;
  income?: number;
  expense?: number;
  discount?: number;
  people_count?: number;
  receipt_url?: string | null;
  is_transferred?: boolean;
  transaction_at: string;
  transferred_at?: string | null;
}
