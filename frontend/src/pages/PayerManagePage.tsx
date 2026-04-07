import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payerService } from '../api/payerService';
import { Plus, Trash2, Edit2, X, Check, Landmark, User, CreditCard, Users } from 'lucide-react';
import type { ErrorResponse } from '../api/client';
import type { PayerRead, PayerCreate } from '../types/payer';

export default function PayerManagePage() {
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // State for creating new payer
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAccount, setNewAccount] = useState('');

  // State for editing payer
  const [editName, setEditName] = useState('');
  const [editAccount, setEditAccount] = useState('');

  const { data: payers, isLoading } = useQuery({
    queryKey: ['payers'],
    queryFn: payerService.getAll,
    select: (res) => res.data,
  });

  const createMutation = useMutation({
    mutationFn: (data: PayerCreate) => payerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payers'] });
      setIsCreating(false);
      setNewName('');
      setNewAccount('');
    },
    onError: (err: ErrorResponse) => alert(err.detail || '결제인 추가 실패'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PayerCreate }) => payerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payers'] });
      setEditingId(null);
    },
    onError: (err: ErrorResponse) => alert(err.detail || '결제인 수정 실패'),
  });

  const deleteMutation = useMutation({
    mutationFn: payerService.delete,
    onSuccess: () => {
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['payers'] });
    },
    onError: (err: ErrorResponse) => {
      setConfirmDeleteId(null);
      alert(err.detail || '결제인 삭제 실패');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate({ 
      name: newName.trim(), 
      account: newAccount.trim() || null 
    });
  };

  const handleEditSubmit = (id: number) => {
    if (!editName.trim()) return;
    updateMutation.mutate({ 
      id, 
      data: { 
        name: editName.trim(), 
        account: editAccount.trim() || null 
      } 
    });
  };

  const startEditing = (payer: PayerRead) => {
    setEditingId(payer.id);
    setEditName(payer.name);
    setEditAccount(payer.account);
    setConfirmDeleteId(null);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">결제인 관리</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">영수증 등록 시 연결될 결제인(계좌)을 관리합니다.</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-primary text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 dark:shadow-white/10"
          >
            <Plus size={18} />
            새 결제인 추가
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-wrap">
        {/* 생성 카드 (활성화 시 보임) */}
        {isCreating && (
          <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/5 dark:to-slate-900 border border-primary/20 rounded-2xl shadow-lg ring-1 ring-primary/20 relative animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
              <Plus size={16} /> 신규 결제인 등록
            </h4>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">이름</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="결제자명"
                    disabled={createMutation.isPending}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">계좌 정보</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    placeholder="은행 및 계좌번호"
                    disabled={createMutation.isPending}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                  disabled={createMutation.isPending}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-xl transition-colors disabled:opacity-50"
                  disabled={createMutation.isPending || !newName.trim()}
                >
                  {createMutation.isPending ? '추가 중...' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 결제인 목록 */}
        {payers?.map((payer) => (
          <div
            key={payer.id}
            className={`group p-6 bg-white dark:bg-slate-900 border transition-all shadow-sm rounded-2xl relative
              ${editingId === payer.id 
                ? 'border-blue-500/50 shadow-md ring-1 ring-blue-500/20' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
          >
            {editingId === payer.id ? (
              // 편집 모드 UI
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="이름"
                      className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-primary focus:outline-none text-slate-800 dark:text-white py-1 font-semibold transition-colors disabled:opacity-50"
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Landmark size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={editAccount}
                      onChange={(e) => setEditAccount(e.target.value)}
                      placeholder="계좌 번호"
                      className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-primary focus:outline-none text-sm text-slate-600 dark:text-slate-300 py-1 transition-colors disabled:opacity-50 font-mono"
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setConfirmDeleteId(null);
                    }}
                    disabled={updateMutation.isPending}
                    className="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X size={14} /> 취소
                  </button>
                  <button
                    onClick={() => handleEditSubmit(payer.id)}
                    disabled={updateMutation.isPending || !editName.trim()}
                    className="flex-1 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm shadow-blue-500/20"
                  >
                    {updateMutation.isPending ? '저장 중...' : <><Check size={14} /> 저장</>}
                  </button>
                </div>
              </div>
            ) : (
              // 읽기 모드 UI
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-none">{payer.name}</h4>
                    </div>
                  </div>
                  
                  {/* Hover Actions / Delete Confirm */}
                  <div className="flex items-center">
                    {confirmDeleteId === payer.id ? (
                       <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 p-1 rounded-lg animate-in slide-in-from-right-2">
                         <button
                           onClick={() => deleteMutation.mutate(payer.id)}
                           disabled={deleteMutation.isPending}
                           className="px-3 py-1.5 text-xs font-bold text-white bg-destructive hover:opacity-90 rounded-md transition-opacity disabled:opacity-50"
                         >
                           {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                         </button>
                         <button
                           onClick={() => setConfirmDeleteId(null)}
                           className="p-1.5 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-colors"
                         >
                           <X size={14} />
                         </button>
                       </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => startEditing(payer)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(payer.id)}
                          className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <Landmark size={14} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-mono text-slate-600 dark:text-slate-300 truncate font-medium">
                    {payer.account}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}

        {!isLoading && payers?.length === 0 && !isCreating && (
          <div className="col-span-1 md:col-span-2 py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <Users size={28} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">등록된 결제인이 없습니다.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">새 결제인을 추가하여 결제 내역을 편하게 관리하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
