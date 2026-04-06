import { LayoutDashboard, ReceiptText, Tags, Users, Settings, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', page: 'dashboard' },
  { icon: ReceiptText, label: '영수증 관리', page: 'receipts' },
  { icon: Tags, label: '분류 관리', page: 'categories' },
  { icon: Users, label: '결제인 관리', page: 'payers' },
  { icon: Settings, label: '코드 관리', page: 'codes' },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function Sidebar({ activePage, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-slate-50 border-r border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col transition-all duration-300 relative z-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 bg-clip-text text-transparent">
          SAM Admin
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={cn(
              "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors gap-3 text-left",
              activePage === item.page
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-200 dark:border-slate-800 mt-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shadow-inner">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Admin</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Admin Mode</span>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        )}
      </div>
    </aside>
  );
}
