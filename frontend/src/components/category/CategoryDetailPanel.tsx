import { useMutation } from '@tanstack/react-query';
import { categoryService } from '../../api/categoryService';
import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, FolderOpen, CornerDownRight } from 'lucide-react';
import type { CategoryTree } from '../../types/category';
import type { ErrorResponse } from '../../api/client';
import { useSelection } from '../../contexts/SelectionContext';

interface CategoryDetailPanelProps {
  activeNode: CategoryTree | null;
  activeDepth: number;
  invalidate: () => void;
  onSelect: (id: number | null) => void;
}

export function CategoryDetailPanel({ activeNode, activeDepth, invalidate, onSelect }: CategoryDetailPanelProps) {
  const { selectedYear } = useSelection();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingChildId, setEditingChildId] = useState<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const childEditRef = useRef<HTMLInputElement>(null);
  const [newChildName, setNewChildName] = useState('');
  const newChildInputRef = useRef<HTMLInputElement>(null);

  // 편집 모드 진입 시 자동 포커스
  useEffect(() => {
    if (isEditingTitle) setTimeout(() => titleInputRef.current?.focus(), 50);
  }, [isEditingTitle]);

  useEffect(() => {
    if (editingChildId) setTimeout(() => childEditRef.current?.focus(), 50);
  }, [editingChildId]);

  // activeNode가 바뀌면 편집 상태 초기화
  useEffect(() => {
    setIsEditingTitle(false);
    setEditingChildId(null);
    setNewChildName('');
  }, [activeNode?.id]);

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      setNewChildName('');
      invalidate();
    },
    onError: (err: ErrorResponse) => alert(err.detail || '생성 중 오류 발생')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; amount?: number; year_id: number; sibling_order?: number; parent_id?: number | null } }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      setIsEditingTitle(false);
      setEditingChildId(null);
      invalidate();
    },
    onError: (err: ErrorResponse) => alert(err.detail || '수정 중 오류 발생')
  });

  const deleteMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      invalidate();
    },
    onError: (err: ErrorResponse) => alert(err.detail || '삭제 중 오류 발생')
  });

  // --- Handlers ---
  const handleCreateRoot = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() && selectedYear) {
      createMutation.mutate({ 
        year_id: selectedYear.id,
        name: e.currentTarget.value.trim(), 
        parent_id: null,
        amount: 0,
        sibling_order: 0
      });
      e.currentTarget.value = '';
    }
  };

  const handleCreateChild = () => {
    if (activeNode && newChildName.trim() && selectedYear) {
      createMutation.mutate({ 
        year_id: selectedYear.id,
        name: newChildName.trim(), 
        parent_id: activeNode.id,
        amount: 0,
        sibling_order: 0
      });
    }
  };

  const handleUpdateTitle = () => {
    if (activeNode && titleInputRef.current?.value.trim() && selectedYear) {
      const newName = titleInputRef.current.value.trim();
      updateMutation.mutate({ 
        id: activeNode.id, 
        data: { 
          name: newName,
          amount: activeNode.amount,
          year_id: selectedYear.id,
          parent_id: activeNode.parent_id,
          sibling_order: activeNode.sibling_order
        } 
      });
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleUpdateChildName = (child: CategoryTree) => {
    if (childEditRef.current?.value.trim() && selectedYear) {
      const newName = childEditRef.current.value.trim();
      if (newName !== child.name) {
        updateMutation.mutate({ 
          id: child.id, 
          data: { 
            name: newName,
            amount: child.amount,
            year_id: selectedYear.id,
            parent_id: activeNode!.id,
            sibling_order: child.sibling_order
          } 
        });
      } else {
        setEditingChildId(null);
      }
    } else {
      setEditingChildId(null);
    }
  };

  const handleDelete = (id: number, name: string) => {
    const confirmed = window.confirm(`'${name}' 분류를 삭제하시겠습니까?\n하위 분류가 있으면 삭제할 수 없습니다.`);
    if (confirmed) {
      if (activeNode?.id === id) {
        onSelect(null);
      }
      deleteMutation.mutate(id);
    }
  };

  // --- 비어있는 상태 ---
  if (!activeNode) {
    return (
      <div className="flex-1 bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center shadow-sm p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
              <FolderOpen size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">분류를 선택하거나 생성하세요</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                좌측 트리에서 편집할 항목을 클릭하세요.<br />
                새로운 대분류는 아래에서 바로 만들 수 있습니다.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">대분류 추가</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="분류 이름을 입력하세요"
                onKeyDown={handleCreateRoot}
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
              />
              <button
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  if (input.value.trim() && selectedYear) {
                    createMutation.mutate({ 
                      year_id: selectedYear.id,
                      name: input.value.trim(), 
                      parent_id: null,
                      amount: 0,
                      sibling_order: 0
                    });
                    input.value = '';
                  }
                }}
                className="px-4 py-3 bg-primary text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-1"
              >
                <Plus size={18} />
                추가
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 선택된 노드 표시 ---
  return (
    <div className="flex-1 flex flex-col bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
              Level {activeDepth}
            </span>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                defaultValue={activeNode.name}
                className="font-bold text-xl bg-white dark:bg-slate-950 border-2 border-primary text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-lg outline-none flex-1 min-w-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                onBlur={handleUpdateTitle}
              />
            ) : (
              <h2
                className="font-bold text-xl text-slate-800 dark:text-slate-100 cursor-pointer hover:text-primary transition-colors flex items-center gap-2 truncate"
                onClick={() => setIsEditingTitle(true)}
                title="클릭하여 수정"
              >
                {activeNode.name}
                <Edit2 size={14} className="text-slate-400 opacity-60 flex-shrink-0" />
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDelete(activeNode.id, activeNode.name)}
              className="text-sm text-destructive/60 hover:bg-destructive/10 hover:text-destructive px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 flex-shrink-0"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        </div>
      </div>

      {/* 하위 분류 목록 */}
      <div className="flex-1 overflow-y-auto p-6">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            하위 분류
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
              {activeNode.children?.length || 0}
            </span>
          </div>
        </h4>

        <div className="space-y-2">
          {activeNode.children?.map(child => (
            <div
              key={child.id}
              className="group flex items-center justify-between p-3.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onSelect(child.id)}>
                <CornerDownRight size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                {editingChildId === child.id ? (
                  <input
                    ref={childEditRef}
                    type="text"
                    defaultValue={child.name}
                    className="font-medium text-sm bg-white dark:bg-slate-900 border border-primary text-slate-800 dark:text-slate-100 px-2 py-1 rounded-lg outline-none flex-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateChildName(child);
                      if (e.key === 'Escape') setEditingChildId(null);
                    }}
                    onBlur={() => handleUpdateChildName(child)}
                  />
                ) : (
                  <span className="font-medium text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors truncate cursor-pointer">
                    {child.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingChildId(child.id); }}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                  title="이름 수정"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(child.id, child.name); }}
                  className="p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {(!activeNode.children || activeNode.children.length === 0) && (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-sm text-slate-400 dark:text-slate-500">하위 분류가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 하위 생성 폼 - 항상 하단에 고정 */}
      {activeDepth < 3 && (
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
          <div className="flex gap-2">
            <input
              ref={newChildInputRef}
              type="text"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateChild(); }}
              placeholder={`'${activeNode.name}'에 하위 분류 추가...`}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all text-sm"
            />
            <button
              onClick={handleCreateChild}
              disabled={!newChildName.trim() || createMutation.isPending}
              className="px-4 py-2.5 bg-primary text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <Plus size={16} />
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
