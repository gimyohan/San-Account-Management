import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../api/categoryService';
import { useState, useCallback } from 'react';
import type { CategoryTree } from '../types/category';
import { CategoryTreeView } from '../components/category/CategoryTreeView';
import { CategoryDetailPanel } from '../components/category/CategoryDetailPanel';

export default function CategoryPage() {
  const queryClient = useQueryClient();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const { data: treeData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getTree,
    select: (res) => res.data, // SuccessResponse에서 data 추출
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);

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

  // Move mutation (드래그 앤 드롭)
  const moveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; parent_id: number | null } }) =>
      categoryService.update(id, data),
    onSuccess: () => invalidate(),
    onError: (err: any) => alert(err.detail || '이동 중 오류가 발생했습니다.')
  });

  const handleMove = useCallback((dragId: number, dropParentId: number | null) => {
    if (!treeData) return;
    const draggedNode = findNode(treeData, dragId);
    if (!draggedNode) return;
    if (draggedNode.parent_id === dropParentId) return;
    if (dragId === dropParentId) return;

    moveMutation.mutate({
      id: dragId,
      data: { name: draggedNode.name, parent_id: dropParentId }
    });
  }, [treeData, findNode, moveMutation]);

  const activeNode = activeCategoryId && treeData
    ? findNode(treeData, activeCategoryId)
    : null;

  const activeDepth = activeCategoryId && treeData
    ? getDepth(treeData, activeCategoryId)
    : 0;

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
