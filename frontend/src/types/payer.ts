export interface PayerRead {
  id: number;
  name: string;
  account: string;
}

export interface PayerCreate {
  name: string;
  account?: string | null;
}
