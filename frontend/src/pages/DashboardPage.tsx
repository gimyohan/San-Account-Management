import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statsService } from '../api/statsService';
import { receiptService } from '../api/receiptService';
import { codeService } from '../api/codeService';
import { categoryService } from '../api/categoryService';
import { payerService } from '../api/payerService';
import { ReceiptForm } from '../components/receipt/ReceiptForm';

import { 
  Wallet, TrendingUp, TrendingDown, Tag, 
  Receipt, Plus, Clock, ChevronRight, X, Trash2
} from 'lucide-react';

import type { ReceiptRead, ReceiptCreate } from '../types/receipt';
import type { BalanceResponse } from '../types/stats';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthDateParams = useMemo(() => {
    if (!selectedMonth) return {};
    const [year, month] = selectedMonth.split('-');
    const firstDay = new Date(Number(year), Number(month) - 1, 1);
    const lastDay = new Date(Number(year), Number(month), 0, 23, 59, 59);
    return { 
      start_date: firstDay.toISOString(),
      end_date: lastDay.toISOString()
    };
  }, [selectedMonth]);

  // Fetch Stats (Balance)
  const { data: allBalanceRes } = useQuery({
    queryKey: ['stats', 'balance', 'all'],
    queryFn: () => statsService.getBalance()
  });
  const allBalance = allBalanceRes;

  const { data: monthBalanceRes } = useQuery({
    queryKey: ['stats', 'balance', selectedMonth],
    queryFn: () => statsService.getBalance(monthDateParams)
  });
  const monthBalance = monthBalanceRes;

  // Fetch Unsettled Receipts
  const { data: unsettledRes } = useQuery({
    queryKey: ['receipts', 'unsettled'],
    queryFn: () => receiptService.getAll({ is_transferred: false })
  });
  const unsettledReceipts = unsettledRes?.data || [];

  // Fetch Codes
  const { data: codesRes } = useQuery({
    queryKey: ['codes'],
    queryFn: codeService.getAll
  });
  const codes = codesRes?.data || [];

  // Derived Code Stats
  const recentAccessedCodes = [...codes]
    .filter(c => c.last_accessed_at)
    .sort((a, b) => new Date(b.last_accessed_at!).getTime() - new Date(a.last_accessed_at!).getTime())
    .slice(0, 5);

  // Required for ReceiptForm (Quick Add & Modal)
  const { data: catRes } = useQuery({ queryKey: ['categories'], queryFn: categoryService.getTree });
  const { data: payRes } = useQuery({ queryKey: ['payers'], queryFn: payerService.getAll });
  const categories = catRes?.data || [];
  const payers = payRes?.data || [];

  // Quick Add State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const createMutation = useMutation({
    mutationFn: receiptService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setShowQuickAdd(false);
    }
  });

  // Modal State for Unsettled Receipts
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRead | null>(null);
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReceiptCreate }) => receiptService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setSelectedReceipt(null);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: receiptService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setSelectedReceipt(null);
    }
  });

  // Modals
  const handleQuickAddSubmit = (data: ReceiptCreate) => {
    createMutation.mutate(data);
  };
  
  const handleEditSubmit = (data: ReceiptCreate) => {
    if (selectedReceipt) {
      updateMutation.mutate({ id: selectedReceipt.id, data });
    }
  };

  const handleReceiptDelete = () => {
    if (selectedReceipt && window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(selectedReceipt.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            대시보드
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">관리자님, 현재 재무 상태와 접속 통계를 확인하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> 빠른 추가
          </button>
        </div>
      </div>

      {showQuickAdd && (
        <div className="mb-6">
          <ReceiptForm 
            isCreating={true}
            categories={categories}
            payers={payers}
            isLoading={createMutation.isPending}
            onCancel={() => setShowQuickAdd(false)}
            onSubmit={handleQuickAddSubmit}
          />
        </div>
      )}

      {/* Widget 1: Balance Summary */}
      <div className="space-y-4">
        {/* All time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-primary p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-2 text-blue-100 font-medium mb-2"><Wallet size={18} /> 전체 누적 잔액</div>
            <div className="text-3xl font-bold font-mono">{(allBalance?.total_balance || 0).toLocaleString()}원</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2"><TrendingUp size={18} className="text-green-500" /> 전체 수입액</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">{(allBalance?.total_income || 0).toLocaleString()}원</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2"><TrendingDown size={18} className="text-rose-500" /> 전체 지출액</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">{(allBalance?.total_expense || 0).toLocaleString()}원</div>
          </div>
        </div>

        {/* Monthly */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center items-start">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-3">
              <Clock size={16} /> 월별 조회
            </div>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-lg text-slate-800 dark:text-white outline-none w-full"
            />
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2"><TrendingUp size={18} className="text-green-500" /> 월간 수입액</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">{(monthBalance?.total_income || 0).toLocaleString()}원</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2"><TrendingDown size={18} className="text-rose-500" /> 월간 지출액</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">{(monthBalance?.total_expense || 0).toLocaleString()}원</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget: Unsettled Receipts */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
              <Receipt className="text-amber-500" /> 미정산 영수증
            </h3>
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-full">{unsettledReceipts.length}건</span>
          </div>
          <div className="flex-1 overflow-auto max-h-[400px]">
             {unsettledReceipts.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">모든 영수증이 정산되었습니다! 🎉</div>
             ) : (
                <ul className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {unsettledReceipts.map(receipt => (
                    <li 
                      key={receipt.id} 
                      onClick={() => setSelectedReceipt(receipt)}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">{receipt.description}</div>
                        <div className="text-xs text-slate-500">{new Date(receipt.transaction_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="text-right">
                           <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{(receipt.expense - receipt.discount).toLocaleString()}원</div>
                         </div>
                         <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    </li>
                  ))}
                </ul>
             )}
          </div>
        </div>

        {/* Widget: Codes Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="text-blue-500" size={18} /> 최근 접속 코드
            </h3>
            <ul className="space-y-3">
              {recentAccessedCodes.length === 0 ? <li className="text-sm text-slate-400">데이터가 없습니다.</li> : 
               recentAccessedCodes.map(c => (
                <li key={c.id} className="flex justify-between items-center text-sm">
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-700 dark:text-slate-300">{c.code}</span>
                  <span className="text-slate-500 text-xs">{new Date(c.last_accessed_at!).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Widget intentionally empty below or can be removed if unused */}
        </div>
      </div>

      {/* Modal Overlay for Receipt Edit */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg">영수증 상세 / 수정</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleReceiptDelete} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" title="삭제">
                  <Trash2 size={18} />
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-2">
               <ReceiptForm 
                  initData={selectedReceipt}
                  isCreating={false}
                  categories={categories}
                  payers={payers}
                  isLoading={updateMutation.isPending}
                  onCancel={() => setSelectedReceipt(null)}
                  onSubmit={handleEditSubmit}
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
