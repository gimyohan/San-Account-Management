import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { codeService } from '../api/codeService';
import { Copy, Plus, Trash2, KeyRound, Check, Clock, X } from 'lucide-react';
import { useState } from 'react';
import type { ErrorResponse } from '../api/client';

export default function CodeManagePage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: codes, isLoading } = useQuery({
    queryKey: ['codes'],
    queryFn: codeService.getAll,
    select: (res) => res.data,
  });

  const createMutation = useMutation({
    mutationFn: codeService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['codes'] }),
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
    mutationFn: ({ id, memo }: { id: number; memo: string | null }) => codeService.updateMemo(id, memo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['codes'] }),
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">액세스 코드 관리</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">일반 사용자에게 발급할 접속 코드를 관리합니다.</p>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 bg-primary text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 dark:shadow-white/10"
        >
          {createMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          새 코드 발급
        </button>
      </div>

      {/* 코드 리스트 */}
      <div className="space-y-3">
        {codes && codes.length > 0 ? (
          codes.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-primary/10 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <KeyRound size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-slate-800 dark:text-white tracking-wider">
                      {item.code}
                    </span>
                    <button
                      onClick={() => handleCopy(item.id, item.code)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="복사"
                    >
                      {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="mt-2 text-sm">
                    <input
                      type="text"
                      className="bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-primary focus:outline-none transition-colors w-full placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-600 dark:text-slate-300 py-0.5"
                      placeholder="메모를 입력하세요..."
                      defaultValue={item.memo || ''}
                      onBlur={(e) => {
                        const newMemo = e.target.value.trim() || null;
                        if (newMemo !== item.memo) {
                          updateMemoMutation.mutate({ id: item.id, memo: newMemo });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 dark:text-slate-500">
                    <Clock size={12} />
                    {item.last_accessed_at ? (
                      <span>마지막 접속: {formatDate(item.last_accessed_at)}</span>
                    ) : (
                      <span className="text-amber-500 dark:text-amber-400 font-medium">미사용</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 삭제: 2단계 확인 UI */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {confirmDeleteId === item.id ? (
                  <>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-destructive rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? '삭제 중...' : '삭제 확인'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                    title="삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <KeyRound size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">발급된 코드가 없습니다.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">위 버튼을 눌러 새 코드를 발급하세요.</p>
          </div>
        )}
      </div>

      {codes && codes.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
          총 {codes.length}개의 일반 코드가 발급되어 있습니다.
        </p>
      )}
    </div>
  );
}

