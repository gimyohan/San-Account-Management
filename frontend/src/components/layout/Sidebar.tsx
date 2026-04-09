import { useState } from 'react';
import { 
  LayoutDashboard, ReceiptText, Tags, Users, Settings, LogOut, Landmark,
  ChevronLeft, ChevronRight, Calendar, Clock, Cog
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSelection } from '../../contexts/SelectionContext';
import { TermSettingsModal } from './TermSettingsModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', page: 'dashboard' },
  { icon: ReceiptText, label: '영수증 관리', page: 'receipts' },
  { icon: Landmark, label: '예산 관리', page: 'budget' },
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
  const { 
    selectedYear, setSelectedYear, years, 
    selectedQuarter, setSelectedQuarter, quarters, 
    isLoading 
  } = useSelection();

  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  const handlePrevYear = () => {
    if (!selectedYear || years.length <= 1) return;
    const currentIndex = years.findIndex(y => y.id === selectedYear.id);
    if (currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    }
  };

  const handleNextYear = () => {
    if (!selectedYear || years.length <= 1) return;
    const currentIndex = years.findIndex(y => y.id === selectedYear.id);
    if (currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    }
  };

  return (
    <aside className="w-64 h-screen bg-slate-50 border-r border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col transition-all duration-300 relative z-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 bg-clip-text text-transparent">
          SAM Admin
        </h1>
      </div>

      <div className="px-4 mb-6 space-y-4">
        {/* Year Selector */}
        <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm relative group/year">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Fiscal Year</span>
            <button 
              onClick={() => setIsTermModalOpen(true)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-400 transition-colors opacity-0 group-hover/year:opacity-100"
            >
              <Cog size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-1">
            <button 
              onClick={handlePrevYear}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 disabled:opacity-30"
              disabled={!selectedYear || years.indexOf(selectedYear) === years.length - 1}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 text-center">
              {isLoading ? (
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse mx-auto rounded" />
              ) : (
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {selectedYear?.name || '연도 없음'}
                </span>
              )}
            </div>
            <button 
              onClick={handleNextYear}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 disabled:opacity-30"
              disabled={!selectedYear || years.indexOf(selectedYear) === 0}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Quarter Selector */}
        {selectedYear && (
          <div className="space-y-2 group/quarter">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Period/Term</span>
              <button 
                onClick={() => setIsTermModalOpen(true)}
                className="text-[10px] font-bold text-primary hover:underline opacity-0 group-hover/quarter:opacity-100"
              >
                Manage
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {quarters.sort((a, b) => a.order - b.order).map(q => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuarter(q)}
                  className={cn(
                    "py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all border truncate",
                    selectedQuarter?.id === q.id
                      ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-primary/50"
                  )}
                  title={q.name}
                >
                  {q.name}
                </button>
              ))}
              {quarters.length === 0 && (
                <div className="col-span-2 py-2 text-center text-[10px] text-slate-400 italic">
                  기간이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
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

      {isTermModalOpen && (
        <TermSettingsModal onClose={() => setIsTermModalOpen(false)} />
      )}
    </aside>
  );
}
