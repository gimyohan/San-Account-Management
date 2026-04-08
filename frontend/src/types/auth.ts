export interface CodeRead {
  id: number;
  code: string;
  memo: string | null;
  access_count: number;
  last_accessed_at: string | null;
}
