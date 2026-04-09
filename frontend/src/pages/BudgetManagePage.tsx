import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../api/budgetService';
import { categoryService } from '../api/categoryService';
import type { CategoryTree } from '../types/category';
import { useSelection } from '../contexts/SelectionContext';
import { Landmark, Save, ChevronRight } from 'lucide-react';

// Flatten category tree to a flat list with depth info
interface FlatCategory {
  id: number;
  name: string;
  depth: number;
  isLeaf: boolean;
  path: string;
  amount: number;
}

function flattenTree(nodes: CategoryTree[], depth = 0, prefix = ''): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const node of nodes) {
    const path = prefix ? `${prefix} > ${node.name}` : node.name;
    const isLeaf = !node.children || node.children.length === 0;
    result.push({ id: node.id, name: node.name, depth, isLeaf, path, amount: node.amount || 0 });
    if (!isLeaf) {
      result.push(...flattenTree(node.children, depth + 1, path));
    }
  }
  return result;
}

export default function BudgetManagePage() {
  const queryClient = useQueryClient();
  const { selectedYear } = useSelection();

  // Local draft budgets: map from category_id -> amount string
  const [draftAmounts, setDraftAmounts] = useState<Record<number, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: catRes, isLoading } = useQuery({
    queryKey: ['categories', selectedYear?.id],
    queryFn: () => categoryService.getByYear(selectedYear!.id),
    enabled: !!selectedYear,
  });

  const flatCategories = useMemo(() =>
    flattenTree(catRes?.data || []).filter(c => c.isLeaf),
    [catRes]
  );

  // Sync budgets into draft when selection or categories change
  useEffect(() => {
    const draft: Record<number, string> = {};
    for (const c of flatCategories) {
      draft[c.id] = c.amount === 0 ? '' : String(c.amount);
    }
    setDraftAmounts(draft);
    setIsDirty(false);
  }, [flatCategories]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(draftAmounts).map(([id, val]) => ({
        id: parseInt(id),
        amount: parseInt(val) || 0
      }));
      return budgetService.updateBulk({ items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedYear?.id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsDirty(false);
    },
    onError: (err: any) => alert(err.detail || '저장 중 오류가 발생했습니다.')
  });

  // ── Derived values ────────────────────────────────────────────────────────
  const totalBudget = useMemo(() =>
    flatCategories.reduce((sum, c) => sum + (parseInt(draftAmounts[c.id] || '0', 10) || 0), 0),
    [draftAmounts, flatCategories]
  );

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

  if (!selectedYear) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <p className="text-lg font-medium">관리할 연도를 먼저 선택해주세요.</p>
    </div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 flex items-center gap-3">
            <Landmark size={28} className="text-primary" /> 예산 관리
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            {selectedYear.name} 카테고리 예산을 설정하고 관리합니다.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Budget</div>
          <div className="text-2xl font-black text-primary font-mono">{totalBudget.toLocaleString()}원</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-950/30">
          <h3 className="font-bold text-slate-800 dark:text-white">카테고리별 예산 설정</h3>
          {isDirty && (
            <span className="text-xs text-amber-500 font-semibold animate-bounce">저장되지 않은 변경사항이 있습니다</span>
          )}
        </div>

        {flatCategories.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">설정 가능한 카테고리가 없습니다.</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {Object.entries(groupedCategories).map(([groupName, cats]) => {
              const groupTotal = cats.reduce((s, c) => s + (parseInt(draftAmounts[c.id] || '0', 10) || 0), 0);
              
              type SubGroup = { subName: string | null; cats: FlatCategory[] };
              const subGroups: SubGroup[] = [];
              let lastSubName: string | null = undefined as unknown as null;
              for (const cat of cats) {
                const parts = cat.path.split(' > ');
                const subName = parts.length >= 3 ? parts[1] : null;
                if (subName !== lastSubName) {
                  subGroups.push({ subName, cats: [] });
                  lastSubName = subName;
                }
                subGroups[subGroups.length - 1].cats.push(cat);
              }

              return (
                <div key={groupName}>
                  <div className="flex justify-between items-center px-5 py-2.5 bg-slate-50 dark:bg-slate-800/30">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{groupName}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                      소계: {groupTotal.toLocaleString()}원
                    </span>
                  </div>

                  {subGroups.map(({ subName, cats: subCats }, si) => (
                    <div key={subName ?? `_flat_${si}`}>
                      {subName && (
                        <div className="flex items-center gap-2 px-5 py-2 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-100 dark:border-slate-800/50">
                          <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{subName}</span>
                        </div>
                      )}

                      {subCats.map(cat => {
                        const indent = subName ? 1 : 0;
                        return (
                          <div key={cat.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0" style={{ paddingLeft: `${indent * 16}px` }}>
                              {indent > 0 && <ChevronRight size={13} className="text-slate-200 dark:text-slate-700 shrink-0" />}
                              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={draftAmounts[cat.id] || ''}
                                onChange={(e) => {
                                  setDraftAmounts(prev => ({ ...prev, [cat.id]: e.target.value }));
                                  setIsDirty(true);
                                }}
                                placeholder="0"
                                className="w-36 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
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

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-950/30">
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
    </div>
  );
}
