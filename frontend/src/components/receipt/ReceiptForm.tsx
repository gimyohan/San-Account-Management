import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import type { ReceiptCreate, ReceiptRead } from '../../types/receipt';
import type { CategoryTree } from '../../types/category';
import type { PayerRead } from '../../types/payer';

interface ReceiptFormProps {
  initData?: ReceiptRead;
  isCreating: boolean;
  categories: CategoryTree[];
  payers: PayerRead[];
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (data: ReceiptCreate) => void;
}

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

export function ReceiptForm({ initData, isCreating, categories: categoryTree, payers, isLoading, onCancel, onSubmit }: ReceiptFormProps) {
  const categories = useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const [type, setType] = useState<'expense' | 'income'>('expense');

  const initForm = (): ReceiptCreate => ({
    category_id: null,
    payer_id: payers?.[0]?.id || null,
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

  useEffect(() => {
    if (initData) {
      setType(initData.income > 0 ? 'income' : 'expense');
      setFormData({
        category_id: initData.category_id,
        payer_id: initData.payer_id,
        description: initData.description,
        income: initData.income,
        expense: initData.expense,
        discount: initData.discount,
        people_count: initData.people_count,
        receipt_url: initData.receipt_url,
        is_transferred: initData.is_transferred,
        transaction_at: initData.transaction_at.slice(0, 16),
        transferred_at: initData.transferred_at ? initData.transferred_at.slice(0, 16) : null
      });
    } else {
      setType('expense');
      setFormData(initForm());
    }
  }, [initData, payers]); // initData and payers reference change

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) return;
    if (type === 'expense' && !formData.payer_id) return;

    if (type === 'income') {
      onSubmit({
        ...formData,
        income: formData.income,
        expense: 0,
        discount: 0,
        payer_id: null,
        people_count: 1,
        is_transferred: true,
        transferred_at: new Date().toISOString().slice(0, 16),
        receipt_url: formData.receipt_url?.trim() || null
      });
    } else {
      onSubmit({
        ...formData,
        income: 0,
        expense: formData.expense,
        discount: formData.discount,
        payer_id: formData.payer_id,
        people_count: formData.people_count,
        is_transferred: formData.is_transferred,
        transferred_at: formData.is_transferred && formData.transferred_at ? formData.transferred_at : null,
        receipt_url: formData.receipt_url?.trim() || null
      });
    }
  };

  const isSubmitDisabled = isLoading || !formData.description || (type === 'expense' && !formData.payer_id);

  return (
    <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/5 dark:to-slate-900 ring-1 ring-primary/20 rounded-2xl shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
      
      {/* Type Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-primary flex items-center gap-2">
          {isCreating ? <Plus size={16} /> : <Edit2 size={16} />} 
          {isCreating ? '새 영수증 등록' : '영수증 수정'}
        </h4>

        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <TrendingDown size={14} className={type === 'expense' ? 'text-rose-500' : ''} /> 지출
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'income' ? 'bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <TrendingUp size={14} className={type === 'income' ? 'text-green-500' : ''} /> 수입
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {type === 'income' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">적요</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="(수입 내역)"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">수입액</label>
              <input 
                type="number" 
                min="0" 
                value={formData.income} 
                onChange={e => setFormData({...formData, income: Number(e.target.value)})} 
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
            </div>
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
          </div>
        ) : (
          <div className="space-y-6">
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
                  onChange={(e) => setFormData({...formData, payer_id: Number(e.target.value) || null})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="" disabled>선택하세요</option>
                  {payers?.map(p => <option key={p.id} value={p.id}>{p.name} {p.account ? `(${p.account})` : ''}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: Expense Specifics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">지출액</label>
                <input 
                  type="number" 
                  min="0" 
                  value={formData.expense} 
                  onChange={e => setFormData({...formData, expense: Number(e.target.value)})} 
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">할인액</label>
                <input 
                  type="number" 
                  min="0" 
                  max={formData.expense}
                  value={formData.discount} 
                  onChange={e => setFormData({...formData, discount: Number(e.target.value)})} 
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">인원</label>
                <input 
                  type="number" 
                  min="1" 
                  value={formData.people_count} 
                  onChange={e => setFormData({...formData, people_count: Number(e.target.value)})} 
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
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
                <label className="text-xs font-semibold text-slate-500 ml-1">URL 링크</label>
                <input
                  type="text"
                  value={formData.receipt_url || ''}
                  onChange={(e) => setFormData({...formData, receipt_url: e.target.value})}
                  placeholder="https://..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            className={`flex-1 py-3 text-sm font-bold text-white hover:opacity-90 rounded-xl transition-colors disabled:opacity-50 shadow-lg ${type === 'income' ? 'bg-green-500 shadow-green-500/20' : 'bg-primary shadow-primary/20'}`}
            disabled={isSubmitDisabled}
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
