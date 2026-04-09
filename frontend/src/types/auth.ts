export interface CodeRead {
  id: number;
  code: string;
  role: string;
  memo: string;
  access_count: number;
  last_accessed_at: string | null;
}

export interface CodeListRead {
  total: number;
  offset: number;
  limit: number;
  sort_key: string;
  codes: CodeRead[];
}

export interface CodePrevMemoRead extends CodeRead {
  prev_memo: string;
}
