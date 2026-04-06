import { ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import { useState } from 'react';
import type { CategoryTree } from '../../types/category';

interface CategoryTreeViewProps {
  data: CategoryTree[];
  activeId: number | null;
  onSelect: (id: number | null) => void;
  draggedId: number | null;
  onDragStart: (id: number | null) => void;
  onDrop: (dragId: number, dropParentId: number | null) => void;
}

export function CategoryTreeView({ data, activeId, onSelect, draggedId, onDragStart, onDrop }: CategoryTreeViewProps) {
  const [dropTargetId, setDropTargetId] = useState<number | 'root' | null>(null);

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* 헤더 - 최상위 드롭 존 */}
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
        {dropTargetId === 'root' && (
          <span className="text-xs text-primary font-semibold">최상위로 이동</span>
        )}
      </div>

      {/* 트리 바디 */}
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
              dropTargetId={dropTargetId}
              setDropTargetId={setDropTargetId}
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
  onDrop: (dragId: number, dropParentId: number | null) => void;
  dropTargetId: number | 'root' | null;
  setDropTargetId: (id: number | 'root' | null) => void;
}

function TreeNode({ node, depth, activeId, onSelect, draggedId, onDragStart, onDrop, dropTargetId, setDropTargetId }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = activeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isDropTarget = dropTargetId === node.id;
  const isDragging = draggedId === node.id;

  return (
    <div className={isDragging ? 'opacity-40' : ''}>
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(node.id);
          // 드래그 고스트를 반투명으로
          if (e.currentTarget instanceof HTMLElement) {
            e.dataTransfer.effectAllowed = 'move';
          }
        }}
        onDragEnd={() => {
          onDragStart(null);
          setDropTargetId(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedId && draggedId !== node.id) {
            setDropTargetId(node.id);
          }
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          if (dropTargetId === node.id) setDropTargetId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDropTargetId(null);
          if (draggedId && draggedId !== node.id) {
            onDrop(draggedId, node.id);
            onDragStart(null);
          }
        }}
        onClick={() => onSelect(node.id)}
        className={`group flex items-center gap-1.5 py-2 px-2.5 rounded-xl cursor-pointer transition-all border ${
          isDropTarget
            ? 'bg-primary/15 border-primary/40 dark:bg-primary/20 dark:border-primary/50 ring-1 ring-primary/30'
            : isActive
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        {/* 열림/닫힘 토글 */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`p-0.5 rounded transition-colors ${
            !hasChildren ? 'invisible' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* 노드 텍스트 */}
        <span className={`text-sm truncate select-none flex-1 ${isActive ? 'font-bold text-primary' : 'font-medium'}`}>
          {node.name}
        </span>

        {/* 자식 수 표시 */}
        {hasChildren && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
            {node.children.length}
          </span>
        )}
      </div>

      {/* 하위 자식 */}
      {isOpen && hasChildren && (
        <div className="ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800 space-y-0.5 mt-0.5">
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
              dropTargetId={dropTargetId}
              setDropTargetId={setDropTargetId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
