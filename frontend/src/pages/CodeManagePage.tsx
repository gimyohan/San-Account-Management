import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { codeService } from '../api/codeService';
import { Copy, Plus, Trash2, KeyRound, Check, Clock, X, ChevronDown, ListFilter, Settings2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { ErrorResponse } from '../api/client';

export default function CodeManagePage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  // 모달 및 입력 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCodeData, setNewCodeData] = useState({
    code: '',
    memo: '',
    length: 6,
    isCustom: false
  });

  // 페이징 및 정렬 상태
  const [limit, setLimit] = useState(5);
  const [sortKey, setSortKey] = useState('last_accessed_at');

  const { data: response, isLoading } = useQuery({
    queryKey: ['codes', limit, sortKey],
    queryFn: () => codeService.getAll(0, limit, sortKey),
    select: (res) => res.data,
  });

  const createMutation = useMutation({
    mutationFn: (params: { code?: string; memo?: string; length?: number }) => 
      codeService.create(params),
    onSuccess: () => {
      setIsModalOpen(false);
      setNewCodeData({ code: '', memo: '', length: 6, isCustom: false });
      queryClient.invalidateQueries({ queryKey: ['codes'] });
    },
    onError: (err: ErrorResponse) => alert(err.detail || '코드 생성 실패'),
  });

  const deleteMutation = useMutation({
    mutationFn: codeService.delete,
    onSuccess: () => {
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['codes'] });
    },
    onError: (err: ErrorResponse) => {
      setConfirmDeleteId(null);
      alert(err.detail || '코드 삭제 실패');
    },
  });

  const updateMemoMutation = useMutation({
    mutationFn: ({ id, memo }: { id: number; memo: string }) => codeService.updateMemo(id, memo),
    onSuccess: (res) => {
      console.log(`메모 수정 성공: ${res.data.prev_memo} -> ${res.data.memo}`);
      queryClient.invalidateQueries({ queryKey: ['codes'] });
    },
    onError: (err: ErrorResponse) => alert(err.detail || '메모 업데이트 실패'),
  });

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hasMore = response ? response.codes.length < response.total : false;

  if (isLoading && !response) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <KeyRound className="text-primary" />
            액세스 코드 관리
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">일반 사용자용 접속 코드를 발급하고 관리합니다.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-white/10"
        >
          <Plus size={18} />
          새 코드 발급
        </button>
      </div>

      {/* 필터 바 */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium ml-2">
          <ListFilter size={16} />
          {response && <span>총 {response.total}개</span>}
        </div>
        <select 
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
        >
          <option value="last_accessed_at">최근 접속순</option>
          <option value="access_count">접속 횟수순</option>
          <option value="code">코드 이름순</option>
        </select>
      </div>

      {/* 코드 리스트 */}
      <div className="space-y-3">
        {response && response.codes.length > 0 ? (
          response.codes.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary/30 transition-all shadow-sm gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-primary/10 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <KeyRound size={22} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xl text-slate-800 dark:text-white tracking-wider">
                      {item.code}
                    </span>
                    <button
                      onClick={() => handleCopy(item.id, item.code)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                      {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    {item.role === 'admin' && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase">Admin</span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <input
                      type="text"
                      className="bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-primary focus:outline-none transition-colors w-full placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-600 dark:text-slate-300 py-0.5"
                      placeholder="메모를 입력하세요..."
                      defaultValue={item.memo}
                      onBlur={(e) => {
                        const newMemo = e.target.value.trim();
                        if (newMemo !== item.memo) {
                          updateMemoMutation.mutate({ id: item.id, memo: newMemo });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-3 text-xs text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {item.last_accessed_at ? formatDate(item.last_accessed_at) : '미사용'}
                    </div>
                    <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-primary">{item.access_count}회 접속</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                {confirmDeleteId === item.id ? (
                  <div className="flex items-center bg-destructive/10 p-1 rounded-xl border border-destructive/20 gap-1">
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-destructive rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      확인
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    disabled={item.role === 'admin'}
                    className="p-2.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all disabled:opacity-0"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3XL">
            <KeyRound size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">발급된 코드가 없습니다</p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setLimit(prev => prev + 5)}
            className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all shadow-sm"
          >
            기록 더 보기
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      {/* 새 코드 발급 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transform animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-primary" size={20} />
                  </div>
                  <h4 className="text-xl font-bold dark:text-white">새 코드 발급</h4>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* 코드 지정 유무 */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setNewCodeData(prev => ({ ...prev, isCustom: false }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${!newCodeData.isCustom ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
                  >
                    랜덤 생성
                  </button>
                  <button 
                    onClick={() => setNewCodeData(prev => ({ ...prev, isCustom: true }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${newCodeData.isCustom ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
                  >
                    직접 지정
                  </button>
                </div>

                {newCodeData.isCustom ? (
                  <div>
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">코드 이름</label>
                    <input
                      type="text"
                      value={newCodeData.code}
                      onChange={(e) => setNewCodeData(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white font-mono uppercase tracking-widest"
                      placeholder="예: WELCOME2024"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">코드 길이 ({newCodeData.length}자)</label>
                    <input
                      type="range"
                      min="4"
                      max="12"
                      value={newCodeData.length}
                      onChange={(e) => setNewCodeData(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                      className="w-full accent-primary mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>4자</span>
                      <span>8자</span>
                      <span>12자</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">메모 (선택)</label>
                  <input
                    type="text"
                    value={newCodeData.memo}
                    onChange={(e) => setNewCodeData(prev => ({ ...prev, memo: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    placeholder="발급 대상을 입력하세요..."
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    const params: any = { memo: newCodeData.memo };
                    if (newCodeData.isCustom) {
                      if (!newCodeData.code.trim()) return alert('코드를 입력하세요');
                      params.code = newCodeData.code.trim();
                    } else {
                      params.length = newCodeData.length;
                    }
                    createMutation.mutate(params);
                  }}
                  disabled={createMutation.isPending}
                  className="flex-3 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? '발급 중...' : (
                    <>
                      <Sparkles size={18} />
                      코드 발급하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

