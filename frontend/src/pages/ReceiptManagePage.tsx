import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptService } from '../api/receiptService';
import { categoryService } from '../api/categoryService';
import { payerService } from '../api/payerService';
import { Plus, Trash2, Edit2, X, Check, Search, Receipt, Calendar, User, Tag, Link2, CheckCircle2 } from 'lucide-react';
import type { ErrorResponse } from '../api/client';
import type { ReceiptRead, ReceiptCreate } from '../types/receipt';
import type { CategoryTree } from '../types/category';

// Recursively flatten category tree to display in select options
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Create / Edit state
  const [isCreating, setIsCreating] = useState(false);
  
  // Data Fetching
  const { data: receipts, isLoading: isReceiptsLoading } = useQuery({ queryKey: ['receipts'], queryFn: receiptService.getAll, select: res => res.data });
  const { data: categoryTree } = useQuery({ queryKey: ['categories'], queryFn: categoryService.getTree, select: res => res.data });
  const { data: payers } = useQuery({ queryKey: ['payers'], queryFn: payerService.getAll, select: res => res.data });

  const categories = useMemo(() => categoryTree ? flattenCategories(categoryTree) : [], [categoryTree]);
  const payerMap = useMemo(() => new Map(payers?.map(p => [p.id, p])), [payers]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Form State
  const initForm = (): ReceiptCreate => ({
    category_id: null,
    payer_id: payers?.[0]?.id || 0,
    description: '',
    income: 0,
    expense: 0,
    discount: 0,
    people_count: 1,
    receipt_url: '',
    is_transferred: false,
    transaction_at: new Date().toISOString().slice(0, 16),
    transferred_at: null
  });

  const [formData, setFormData] = useState<ReceiptCreate>(initForm());

  const createMutation = useMutation({
    mutationFn: receiptService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setIsCreating(false);
      setFormData(initForm());
    },
    onError: (err: ErrorResponse) => alert(err.detail || '영수증 추가 실패'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReceiptCreate }) => receiptService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setEditingId(null);
    },
    onError: (err: ErrorResponse) => alert(err.detail || '영수증 수정 실패'),
  });

  const deleteMutation = useMutation({
    mutationFn: receiptService.delete,
    onSuccess: () => {
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
    onError: (err: ErrorResponse) => {
      setConfirmDeleteId(null);
      alert(err.detail || '영수증 삭제 실패');
    },
  });

  const openCreateForm = () => {
    setIsCreating(true);
    setEditingId(null);
    setConfirmDeleteId(null);
    setFormData(initForm());
  };

  const openEditForm = (param: ReceiptRead) => {
    setIsCreating(false);
    setEditingId(param.id);
    setConfirmDeleteId(null);
    setFormData({
      category_id: param.category_id,
      payer_id: param.payer_id,
      description: param.description,
      income: param.income,
      expense: param.expense,
      discount: param.discount,
      people_count: param.people_count,
      receipt_url: param.receipt_url,
      is_transferred: param.is_transferred,
      transaction_at: param.transaction_at.slice(0, 16),
      transferred_at: param.transferred_at ? param.transferred_at.slice(0, 16) : null
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.payer_id === 0) return;
    
    // Convert to strict schema type handling empty strings
    const reqData: ReceiptCreate = {
      ...formData,
      receipt_url: formData.receipt_url?.trim() || null,
      transferred_at: formData.is_transferred && formData.transferred_at ? formData.transferred_at : null
    };

    if (isCreating) {
      createMutation.mutate(reqData);
    } else if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: reqData });
    }
  };

  const calculateActualAmount = (r: ReceiptRead) => r.expense - r.discount;

  const formatDateLabel = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderInlineForm = () => (
    <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/5 dark:to-slate-900 ring-1 ring-primary/20 rounded-2xl shadow-lg relative animate-in fade-in zoom-in-95 duration-200 col-span-1">
      <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
        {isCreating ? <Plus size={16} /> : <Edit2 size={16} />} 
        {isCreating ? '새 영수증 등록' : '영수증 수정'}
      </h4>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Row 1: Category & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">카테고리</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData({...formData, category_id: e.target.value ? Number(e.target.value) : null})}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">(미분류)</option>
              {categories.map(c => <option key={c.id} value={c.id} disabled={!c.isLeaf}>{c.path}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">적요</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="(세부 사항)"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
        </div>

        {/* Row 2: Date & Payer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">거래 일시</label>
            <input
              type="datetime-local"
              value={formData.transaction_at}
              onChange={(e) => setFormData({...formData, transaction_at: e.target.value})}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">결제인</label>
            <select
              value={formData.payer_id || ''}
              onChange={(e) => setFormData({...formData, payer_id: Number(e.target.value)})}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              required
            >
              {payers?.map(p => <option key={p.id} value={p.id}>{p.name} {p.account ? `(${p.account})` : ''}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3: Money */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">수입액</label>
            <input type="number" min="0" value={formData.income} onChange={e => setFormData({...formData, income: Number(e.target.value)})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">지출액</label>
            <input type="number" min="0" value={formData.expense} onChange={e => setFormData({...formData, expense: Number(e.target.value)})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">할인액</label>
            <input type="number" min="0" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">인원</label>
            <input type="number" min="1" value={formData.people_count} onChange={e => setFormData({...formData, people_count: Number(e.target.value)})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        </div>

        {/* Row 4: URL & Transfer Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer pb-1 text-xs font-semibold text-slate-500 ml-1">
              <input
                type="checkbox"
                checked={formData.is_transferred}
                onChange={e => {
                  const checked = e.target.checked;
                  setFormData({...formData, is_transferred: checked, transferred_at: checked ? new Date().toISOString().slice(0, 16) : null});
                }}
                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-slate-300 pointer"
              />
              <span className="text-slate-700 dark:text-slate-300">정산 완료 여부</span>
            </label>
            {formData.is_transferred ? (
              <input
                type="datetime-local"
                value={formData.transferred_at || ''}
                onChange={(e) => setFormData({...formData, transferred_at: e.target.value})}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                required
              />
            ) : (
              <div className="w-full h-[42px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center px-3 text-sm text-slate-400 select-none">
                정산되지 않음
              </div>
            )}
           </div>
           <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">URL</label>
            <input
              type="text"
              value={formData.receipt_url || ''}
              onChange={(e) => setFormData({...formData, receipt_url: e.target.value})}
              placeholder="https://..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => { setIsCreating(false); setEditingId(null); }}
            className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 py-3 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
            disabled={createMutation.isPending || updateMutation.isPending || !formData.description || formData.payer_id === 0}
          >
            {(createMutation.isPending || updateMutation.isPending) ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="text-primary" /> 영수증 관리
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">지출 및 수입 내역을 기록하고 정산 현황을 관리합니다.</p>
        </div>
        {!isCreating && (
          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 bg-primary text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 dark:shadow-white/10"
          >
            <Plus size={18} /> 새 영수증 등록
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isCreating && renderInlineForm()}

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
              <div key={`edit-${item.id}`}>{renderInlineForm()}</div>
            ) : (
              <div 
                key={item.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all gap-4"
              >
                {/* Info Section */}
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
                      <span className="flex items-center gap-1"><User size={14} /> {payerMap.get(item.payer_id)?.name || '알수없음'}</span>
                      <span className="flex items-center gap-1"><Tag size={14} /> {categoryMap.get(item.category_id || -1)?.name || '미분류'}</span>
                      {item.people_count > 1 && <span className="font-semibold text-blue-500">({item.people_count}인 분할)</span>}
                      {item.receipt_url && <a href={item.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Link2 size={14} /> 링크</a>}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
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
                           disabled={deleteMutation.isPending}
                           className="px-3 py-1.5 text-xs font-bold text-white bg-destructive hover:opacity-90 rounded-md transition-opacity"
                         >
                           {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                         </button>
                         <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md">
                           <X size={14} />
                         </button>
                       </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button onClick={() => openEditForm(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg">
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
