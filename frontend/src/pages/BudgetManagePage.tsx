import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fiscalTermService } from '../api/fiscalTermService';
import { budgetService } from '../api/budgetService';
import { categoryService } from '../api/categoryService';
import type { FiscalTerm, FiscalTermCreate, Budget } from '../types/budget';
import type { CategoryTree } from '../types/category';
import {
  Landmark, Plus, Edit2, Trash2, Save, X, ChevronRight, CalendarRange
} from 'lucide-react';

// Flatten category tree to a flat list with depth info
interface FlatCategory {
  id: number;
  name: string;
  depth: number;
  isLeaf: boolean;
  path: string;
}

function flattenTree(nodes: CategoryTree[], depth = 0, prefix = ''): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const node of nodes) {
    const path = prefix ? `${prefix} > ${node.name}` : node.name;
    const isLeaf = !node.children || node.children.length === 0;
    result.push({ id: node.id, name: node.name, depth, isLeaf, path });
    if (!isLeaf) {
      result.push(...flattenTree(node.children, depth + 1, path));
    }
  }
  return result;
}

// ─── FiscalTerm Modal ─────────────────────────────────────────────────────────
interface FiscalTermModalProps {
  initData?: FiscalTerm;
  onClose: () => void;
  onSubmit: (data: FiscalTermCreate) => void;
  isLoading: boolean;
}

function FiscalTermModal({ initData, onClose, onSubmit, isLoading }: FiscalTermModalProps) {
  const [form, setForm] = useState<FiscalTermCreate>({
    name: initData?.name || '',
    start_date: initData ? initData.start_date.slice(0, 10) : '',
    end_date: initData ? initData.end_date.slice(0, 10) : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date + 'T23:59:59').toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            {initData ? '회계연도 수정' : '새 회계연도 추가'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">회계연도 이름</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="예: 2026 상반기"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">시작일</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">종료일</label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors">
              취소
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-xl transition-colors shadow-lg shadow-primary/20 disabled:opacity-50">
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BudgetManagePage() {
  const queryClient = useQueryClient();
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<FiscalTerm | undefined>(undefined);
  const [confirmDeleteTermId, setConfirmDeleteTermId] = useState<number | null>(null);

  // Local draft budgets: map from category_id -> amount string
  const [draftAmounts, setDraftAmounts] = useState<Record<number, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: termsRes } = useQuery({
    queryKey: ['fiscal-terms'],
    queryFn: fiscalTermService.getAll,
  });
  const terms: FiscalTerm[] = termsRes?.data || [];

  const { data: catRes } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getTree,
  });
  const flatCategories = useMemo(() =>
    flattenTree(catRes?.data || []).filter(c => c.isLeaf),
    [catRes]
  );

  const { data: budgetsRes } = useQuery({
    queryKey: ['budgets', selectedTermId],
    queryFn: () => budgetService.getAll(selectedTermId!),
    enabled: selectedTermId !== null,
  });
  const existingBudgets: Budget[] = budgetsRes?.data || [];

  // Auto-select first term
  useEffect(() => {
    if (terms.length > 0 && selectedTermId === null) {
      setSelectedTermId(terms[0].id);
    }
  }, [terms, selectedTermId]);

  // Sync budgets into draft when selection or budgets change
  useEffect(() => {
    const draft: Record<number, string> = {};
    for (const b of existingBudgets) {
      draft[b.category_id] = String(b.amount);
    }
    setDraftAmounts(draft);
    setIsDirty(false);
  }, [existingBudgets]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const createTermMutation = useMutation({
    mutationFn: fiscalTermService.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-terms'] });
      setSelectedTermId(res.data.id);
      setShowTermModal(false);
    },
  });

  const updateTermMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FiscalTermCreate }) =>
      fiscalTermService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-terms'] });
      setShowTermModal(false);
      setEditingTerm(undefined);
    },
  });

  const deleteTermMutation = useMutation({
    mutationFn: fiscalTermService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-terms'] });
      setSelectedTermId(null);
      setConfirmDeleteTermId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTermId) return;
      // For each leaf category with a draft amount, upsert
      const promises = flatCategories.map(async (cat) => {
        const rawAmount = draftAmounts[cat.id];
        const amount = parseInt(rawAmount || '0', 10) || 0;
        const existing = existingBudgets.find(b => b.category_id === cat.id);

        if (existing) {
          if (existing.amount !== amount) {
            if (amount === 0) {
              // Delete if set to 0
              return budgetService.delete(existing.id);
            } else {
              return budgetService.update(existing.id, {
                category_id: cat.id,
                fiscal_term_id: selectedTermId,
                amount,
              });
            }
          }
        } else if (amount > 0) {
          return budgetService.create({
            category_id: cat.id,
            fiscal_term_id: selectedTermId,
            amount,
          });
        }
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', selectedTermId] });
      setIsDirty(false);
    },
  });

  // ── Derived values ────────────────────────────────────────────────────────
  const totalBudget = useMemo(() =>
    flatCategories.reduce((sum, c) => sum + (parseInt(draftAmounts[c.id] || '0', 10) || 0), 0),
    [draftAmounts, flatCategories]
  );

  const selectedTerm = terms.find(t => t.id === selectedTermId);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });

  // Group leaf categories by their top-level parent path component
  const groupedCategories = useMemo(() => {
    const groups: Record<string, FlatCategory[]> = {};
    for (const cat of flatCategories) {
      const topLevel = cat.path.split(' > ')[0];
      if (!groups[topLevel]) groups[topLevel] = [];
      groups[topLevel].push(cat);
    }
    return groups;
  }, [flatCategories]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 flex items-center gap-3">
            <Landmark size={28} className="text-primary" /> 예산 관리
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            회계연도별 카테고리 예산을 설정하고 관리합니다.
          </p>
        </div>
        <button
          onClick={() => { setEditingTerm(undefined); setShowTermModal(true); }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> 새 회계연도
        </button>
      </div>

      {/* Fiscal Term Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {terms.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">회계연도가 없습니다. 먼저 추가해주세요.</p>
        ) : (
          terms.map(term => (
            <button
              key={term.id}
              onClick={() => setSelectedTermId(term.id)}
              className={`shrink-0 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 -mb-[1px] ${
                selectedTermId === term.id
                  ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {term.name}
            </button>
          ))
        )}
      </div>

      {/* Term Info + Actions */}
      {selectedTerm && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <CalendarRange size={20} className="text-primary" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-white text-lg">{selectedTerm.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(selectedTerm.start_date)} ~ {formatDate(selectedTerm.end_date)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <div className="text-xs text-slate-400">총 예산</div>
              <div className="text-xl font-bold text-primary font-mono">{totalBudget.toLocaleString()}원</div>
            </div>
            {confirmDeleteTermId === selectedTerm.id ? (
              <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 p-1 rounded-lg">
                <button
                  onClick={() => deleteTermMutation.mutate(selectedTerm.id)}
                  disabled={deleteTermMutation.isPending}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:opacity-90 rounded-md"
                >
                  삭제 확인
                </button>
                <button
                  onClick={() => setConfirmDeleteTermId(null)}
                  className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setEditingTerm(selectedTerm); setShowTermModal(true); }}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                  title="수정"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setConfirmDeleteTermId(selectedTerm.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Budget Table */}
      {selectedTermId !== null && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">카테고리별 예산 설정</h3>
            {isDirty && (
              <span className="text-xs text-amber-500 font-semibold animate-pulse">저장되지 않은 변경사항이 있습니다</span>
            )}
          </div>

          {flatCategories.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">설정 가능한 카테고리가 없습니다.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {Object.entries(groupedCategories).map(([groupName, cats]) => {
                const groupTotal = cats.reduce((s, c) => s + (parseInt(draftAmounts[c.id] || '0', 10) || 0), 0);

                // Build sub-groups by 2nd path segment (if exists)
                type SubGroup = { subName: string | null; cats: FlatCategory[] };
                const subGroups: SubGroup[] = [];
                let lastSubName: string | null = undefined as unknown as null;
                for (const cat of cats) {
                  const parts = cat.path.split(' > ');
                  // parts[0] = top-level (group header), parts[1] = mid-level (sub-header if 3+ levels)
                  const subName = parts.length >= 3 ? parts[1] : null;
                  if (subName !== lastSubName) {
                    subGroups.push({ subName, cats: [] });
                    lastSubName = subName;
                  }
                  subGroups[subGroups.length - 1].cats.push(cat);
                }

                return (
                  <div key={groupName}>
                    {/* Top-level group header */}
                    <div className="flex justify-between items-center px-5 py-2.5 bg-slate-50 dark:bg-slate-800/30">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{groupName}</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                        소계: {groupTotal.toLocaleString()}원
                      </span>
                    </div>

                    {subGroups.map(({ subName, cats: subCats }, si) => (
                      <div key={subName ?? `_flat_${si}`}>
                        {/* Mid-level sub-header (only when 3+ depth) */}
                        {subName && (
                          <div className="flex items-center gap-2 px-5 py-2 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-100 dark:border-slate-800/50">
                            <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 shrink-0" />
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{subName}</span>
                          </div>
                        )}

                        {/* Leaf category rows */}
                        {subCats.map(cat => {
                          // indent: 0 if top→leaf (2-level), 1 if top→mid→leaf (3-level)
                          const indent = subName ? 1 : 0;
                          return (
                            <div key={cat.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <div
                                className="flex items-center gap-1.5 flex-1 min-w-0"
                                style={{ paddingLeft: `${indent * 16}px` }}
                              >
                                {indent > 0 && <ChevronRight size={13} className="text-slate-200 dark:text-slate-700 shrink-0" />}
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={draftAmounts[cat.id] ?? ''}
                                  onChange={(e) => {
                                    setDraftAmounts(prev => ({ ...prev, [cat.id]: e.target.value }));
                                    setIsDirty(true);
                                  }}
                                  placeholder="0"
                                  className="w-36 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-xs text-slate-400 w-5">원</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Save Button */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div className="text-sm text-slate-500">
              총 <span className="font-bold text-primary font-mono">{totalBudget.toLocaleString()}원</span>의 예산이 설정되었습니다.
            </div>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !isDirty}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <Save size={16} />
              {saveMutation.isPending ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </div>
      )}

      {/* FiscalTerm Modal */}
      {showTermModal && (
        <FiscalTermModal
          initData={editingTerm}
          onClose={() => { setShowTermModal(false); setEditingTerm(undefined); }}
          onSubmit={(data) => {
            if (editingTerm) {
              updateTermMutation.mutate({ id: editingTerm.id, data });
            } else {
              createTermMutation.mutate(data);
            }
          }}
          isLoading={createTermMutation.isPending || updateTermMutation.isPending}
        />
      )}
    </div>
  );
}
