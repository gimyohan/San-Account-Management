export interface Receipt {
  id: number;
  category_id: number | null;
  payer_id: number | null;
  quarter_id: number;
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
  quarter_id: number;
  category_id: number | null;
  payer_id: number | null;
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

export interface ReceiptUpdate extends ReceiptCreate {}
