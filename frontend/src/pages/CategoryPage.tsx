import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../api/categoryService';
import { useState, useCallback } from 'react';
import type { CategoryTree } from '../types/category';
import { CategoryTreeView } from '../components/category/CategoryTreeView';
import { CategoryDetailPanel } from '../components/category/CategoryDetailPanel';
import { useSelection } from '../contexts/SelectionContext';

export default function CategoryPage() {
  const queryClient = useQueryClient();
  const { selectedYear } = useSelection();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const { data: treeData, isLoading } = useQuery({
    queryKey: ['categories', selectedYear?.id],
    queryFn: () => categoryService.getByYear(selectedYear!.id),
    enabled: !!selectedYear,
    select: (res) => res.data,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['categories', selectedYear?.id] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  }, [queryClient, selectedYear?.id]);

  // 트리를 순회하여 특정 ID의 노드를 찾는 헬퍼
  const findNode = useCallback((nodes: CategoryTree[], id: number): CategoryTree | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // 트리에서 특정 노드의 깊이(level)를 계산
  const getDepth = useCallback((nodes: CategoryTree[], id: number, currentDepth: number = 1): number => {
    for (const node of nodes) {
      if (node.id === id) return currentDepth;
      if (node.children && node.children.length > 0) {
        const found = getDepth(node.children, id, currentDepth + 1);
        if (found > 0) return found;
      }
    }
    return 0;
  }, []);

  // Move mutation (부모 변경)
  const moveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      categoryService.update(id, data),
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.detail || '이동 중 오류가 발생했습니다.')
  });

  // Reorder mutation (동일 부모 내 순서 변경)
  const reorderMutation = useMutation({
    mutationFn: ({ id, order }: { id: number; order: number }) =>
      categoryService.reorder(id, order),
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.detail || '순서 변경 중 오류가 발생했습니다.')
  });

  const handleMove = useCallback((dragId: number, dropParentId: number | null, newOrder?: number) => {
    if (!treeData || !selectedYear) return;
    const draggedNode = findNode(treeData, dragId);
    if (!draggedNode) return;
    
    // 자기 자신에게 드랍하거나, 변경사항이 없는 경우 무시
    if (dragId === dropParentId) return;

    // 만약 부모가 동일하고 newOrder가 지정되었다면 -> Reorder API 호출
    if (draggedNode.parent_id === dropParentId && newOrder !== undefined) {
      // 제자리 드랍 방지 (현재 순서와 동일한 경우)
      if (draggedNode.sibling_order === newOrder) return;
      
      reorderMutation.mutate({ id: dragId, order: newOrder });
      return;
    }

    // 부모를 변경하는 경우 -> Update API 호출
    if (draggedNode.parent_id !== dropParentId) {
      moveMutation.mutate({
        id: dragId,
        data: { 
          name: draggedNode.name, 
          amount: draggedNode.amount,
          year_id: selectedYear.id,
          sibling_order: newOrder !== undefined ? newOrder : 0, 
          parent_id: dropParentId 
        }
      });
    }
  }, [treeData, findNode, moveMutation, reorderMutation, selectedYear]);

  const activeNode = activeCategoryId && treeData
    ? findNode(treeData, activeCategoryId)
    : null;

  const activeDepth = activeCategoryId && treeData
    ? getDepth(treeData, activeCategoryId)
    : 0;

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
    <div className="h-full flex gap-6">
      <CategoryTreeView
        data={treeData || []}
        activeId={activeCategoryId}
        onSelect={setActiveCategoryId}
        draggedId={draggedId}
        onDragStart={setDraggedId}
        onDrop={handleMove}
      />
      <CategoryDetailPanel
        activeNode={activeNode}
        activeDepth={activeDepth}
        invalidate={invalidate}
        onSelect={setActiveCategoryId}
      />
    </div>
  );
}
