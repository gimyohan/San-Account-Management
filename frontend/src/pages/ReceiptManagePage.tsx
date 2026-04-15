import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptService } from '../api/receiptService';
import { categoryService } from '../api/categoryService';
import { payerService } from '../api/payerService';
import { Plus, Trash2, Edit2, X, Receipt, Calendar, User, Tag, CheckCircle2 } from 'lucide-react';
import { ReceiptForm } from '../components/receipt/ReceiptForm';
import type { ErrorResponse } from '../api/client';
import type { Receipt as ReceiptType, ReceiptCreate } from '../types/receipt';
import type { CategoryTree } from '../types/category';
import { useSelection } from '../contexts/SelectionContext';

// Recursively flatten category tree to display in mapping
const flattenCategories = (tree: CategoryTree[], prefix = ''): { id: number; name: string; path: string; isLeaf: boolean }[] => {
  let result: { id: number; name: string; path: string; isLeaf: boolean }[] = [];
  for (const node of tree) {
    const currentName = node.name;
    const path = prefix ? `${prefix} > ${currentName}` : currentName;
    const isLeaf = !node.children || node.children.length === 0;
    
    result.push({ id: node.id, name: currentName, path, isLeaf });
    if (!isLeaf) {
      result = result.concat(flattenCategories(node.children, path));
    }
  }
  return result;
};

export default function ReceiptManagePage() {
  const queryClient = useQueryClient();
  const { selectedYear, selectedQuarter } = useSelection();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Create state
  const [isCreating, setIsCreating] = useState(false);
  
  // Data Fetching
  const { data: receipts, isLoading: isReceiptsLoading } = useQuery({ 
    queryKey: ['receipts', selectedQuarter?.id], 
    queryFn: () => receiptService.list({ quarter_id: selectedQuarter!.id }), 
    enabled: !!selectedQuarter,
    select: res => res.data 
  });

  const { data: categoryTree } = useQuery({ 
    queryKey: ['categories', selectedYear?.id], 
    queryFn: () => categoryService.getByYear(selectedYear!.id), 
    enabled: !!selectedYear,
    select: res => res.data 
  });

  const { data: payers } = useQuery({ 
    queryKey: ['payers'], 
    queryFn: payerService.getAll, 
    select: res => res.data 
  });

  const categories = useMemo(() => categoryTree ? flattenCategories(categoryTree) : [], [categoryTree]);
  const payerMap = useMemo(() => new Map(payers?.map(p => [p.id, p])), [payers]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: receiptService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts', selectedQuarter?.id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsCreating(false);
    },
    onError: (err: ErrorResponse) => alert(err.detail || '영수증 추가 실패'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => receiptService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts', selectedQuarter?.id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setEditingId(null);
    },
    onError: (err: ErrorResponse) => alert(err.detail || '영수증 수정 실패'),
  });

  const deleteMutation = useMutation({
    mutationFn: receiptService.delete,
    onSuccess: () => {
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['receipts', selectedQuarter?.id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (err: ErrorResponse) => {
      setConfirmDeleteId(null);
      alert(err.detail || '영수증 삭제 실패');
    },
  });

  const calculateActualAmount = (r: ReceiptType) => r.expense - r.discount;

  const formatDateLabel = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleEditSubmit = (data: ReceiptCreate) => {
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data });
    }
  };

  if (!selectedQuarter) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <p className="text-lg font-medium">관리할 연도와 분기를 먼저 선택해주세요.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="text-primary" /> 영수증 관리
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {selectedYear?.name} {selectedQuarter?.name} 지출 및 수입 내역을 관리합니다.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
          >
            <Plus size={18} /> 새 영수증 등록
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isCreating && (
          <ReceiptForm 
            isCreating={true}
            quarter_id={selectedQuarter.id}
            categories={categoryTree || []}
            payers={payers || []}
            isLoading={createMutation.isPending}
            onCancel={() => setIsCreating(false)}
            onSubmit={(data) => createMutation.mutate(data)}
          />
        )}

        {isReceiptsLoading ? (
            <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : receipts?.length === 0 && !isCreating ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Receipt size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">기록된 영수증이 없습니다.</p>
            </div>
        ) : (
          receipts?.map(item => (
            editingId === item.id ? (
              <div key={`edit-${item.id}`}>
                <ReceiptForm 
                  initData={item}
                  isCreating={false}
                  quarter_id={selectedQuarter.id}
                  categories={categoryTree || []}
                  payers={payers || []}
                  isLoading={updateMutation.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={handleEditSubmit}
                />
              </div>
            ) : (
              <div 
                key={item.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.income > item.expense ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-primary/10 dark:bg-slate-800 text-primary'}`}>
                    <Receipt size={24} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg text-slate-800 dark:text-white truncate">
                        {item.description}
                      </span>
                      {item.is_transferred && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 size={12} /> 정산완료
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {formatDateLabel(item.transaction_at)}</span>
                      {item.income <= 0 && (
                        <>
                          <span className="flex items-center gap-1"><User size={14} /> {payerMap.get(item.payer_id || -1)?.name || '알수없음'}</span>
                          <span className="flex items-center gap-1"><Tag size={14} /> {categoryMap.get(item.category_id || -1)?.name || '미분류'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 shrink-0">
                   <div className="text-right">
                     {item.income > item.expense ? (
                       <span className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">
                         +{item.income.toLocaleString()}원
                       </span>
                     ) : (
                       <span className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                         -{calculateActualAmount(item).toLocaleString()}원
                       </span>
                     )}
                     {item.discount > 0 && <div className="text-[10px] text-amber-500">(-{item.discount.toLocaleString()}원 할인)</div>}
                   </div>
                   
                   <div className="flex items-center">
                    {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 p-1 rounded-lg">
                          <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-destructive hover:opacity-90 rounded-md"
                          >
                            삭제
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md">
                            <X size={14} />
                          </button>
                        </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button onClick={() => setEditingId(item.id)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(item.id)} className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                   </div>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
