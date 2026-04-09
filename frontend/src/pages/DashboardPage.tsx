import { useSelection } from '../contexts/SelectionContext';
import { Layout } from 'lucide-react';

export default function DashboardPage() {
  const { selectedYear, selectedQuarter } = useSelection();

  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6">
      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-inner">
        <Layout size={48} />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Under Construction</h3>
        <p className="text-sm max-w-md mx-auto leading-relaxed">
          {selectedYear && selectedQuarter 
            ? `${selectedYear.name} ${selectedQuarter.name} 기간이 선택되었습니다. 새로운 디자인으로 대시보드를 구성할 준비가 되었습니다.`
            : "연도와 회계 기간을 선택하여 대시보드 구성을 시작하세요."
          }
        </p>
      </div>
    </div>
  );
}
