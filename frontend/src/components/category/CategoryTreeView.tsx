import { ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import { useState } from 'react';
import type { CategoryTree } from '../../types/category';

interface CategoryTreeViewProps {
  data: CategoryTree[];
  activeId: number | null;
  onSelect: (id: number | null) => void;
  draggedId: number | null;
  onDragStart: (id: number | null) => void;
  onDrop: (dragId: number, dropParentId: number | null, newOrder?: number) => void;
}

export function CategoryTreeView({ data, activeId, onSelect, draggedId, onDragStart, onDrop }: CategoryTreeViewProps) {
  const [dropTargetId, setDropTargetId] = useState<number | 'root' | null>(null);

  // 트리 전체 컴포넌트
  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div
        className={`p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors ${
          dropTargetId === 'root' ? 'bg-primary/10 dark:bg-primary/20' : 'bg-slate-50 dark:bg-slate-950/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (draggedId) setDropTargetId('root');
        }}
        onDragLeave={() => setDropTargetId(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDropTargetId(null);
          if (draggedId) {
            onDrop(draggedId, null);
            onDragStart(null);
          }
        }}
      >
        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FolderTree size={18} className="text-primary" />
          분류 계층 구조
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {data.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">
            분류가 없습니다.<br />우측 패널에서 생성해주세요.
          </div>
        ) : (
          data.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={1}
              activeId={activeId}
              onSelect={onSelect}
              draggedId={draggedId}
              onDragStart={onDragStart}
              onDrop={onDrop}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: CategoryTree;
  depth: number;
  activeId: number | null;
  onSelect: (id: number | null) => void;
  draggedId: number | null;
  onDragStart: (id: number | null) => void;
  onDrop: (dragId: number, dropParentId: number | null, newOrder?: number) => void;
}

function TreeNode({ node, depth, activeId, onSelect, draggedId, onDragStart, onDrop }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [dropType, setDropType] = useState<'above' | 'inside' | 'below' | null>(null);
  
  const isActive = activeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isDragging = draggedId === node.id;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === node.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = (e.clientY - rect.top) / rect.height;
    
    // 더 정교한 영역 구분 (25% / 50% / 25%)
    if (relativeY < 0.25) {
      setDropType('above');
    } else if (relativeY > 0.75) {
      setDropType('below');
    } else {
      setDropType('inside');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === node.id) return;

    if (dropType === 'above') {
      onDrop(draggedId, node.parent_id, node.sibling_order);
    } else if (dropType === 'below') {
      onDrop(draggedId, node.parent_id, node.sibling_order + 1);
    } else {
      onDrop(draggedId, node.id);
    }
    
    setDropType(null);
    onDragStart(null);
  };

  return (
    <div className={isDragging ? 'opacity-40' : ''}>
      <div
        draggable
        onDragStart={(e) => { e.stopPropagation(); onDragStart(node.id); }}
        onDragEnd={() => { onDragStart(null); setDropType(null); }}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropType(null)}
        onDrop={handleDrop}
        onClick={() => onSelect(node.id)}
        className={`group relative flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg cursor-pointer transition-all border ${
          isActive
            ? 'bg-primary/10 border-primary/20 text-primary'
            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        {/* 가이드 라인 개선 */}
        {dropType === 'above' && <div className="absolute top-[-2px] left-0 right-0 h-0.5 bg-primary z-10 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />}
        {dropType === 'below' && <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary z-10 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />}
        {dropType === 'inside' && <div className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg pointer-events-none" />}

        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`p-0.5 rounded transition-colors ${
            !hasChildren ? 'invisible' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span className={`text-sm truncate select-none flex-1 ${isActive ? 'font-bold text-primary' : 'font-medium'}`}>
          {node.name}
        </span>

        {hasChildren && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
            {node.children.length}
          </span>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="ml-4 pl-3 border-l border-slate-100 dark:border-slate-800 space-y-0.5 mt-0.5">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
              draggedId={draggedId}
              onDragStart={onDragStart}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
