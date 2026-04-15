import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Gift, 
  BarChart3, 
  PieChart as PieChartIcon,
  Layout
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { statsService } from '../api/statsService';
import { receiptService } from '../api/receiptService';
import { categoryService } from '../api/categoryService';
import { useSelection } from '../contexts/SelectionContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardPage() {
  const { selectedYear, selectedQuarter } = useSelection();

  // 1. Fetch Summary Stats
  const { data: stats, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['stats', 'balance', selectedYear?.id, selectedQuarter?.id],
    queryFn: () => statsService.getBalance({ 
      year_id: selectedYear?.id, 
      quarter_id: selectedQuarter?.id 
    }),
    enabled: !!selectedYear,
    select: res => res.data
  });

  // 2. Fetch Receipts for detailed charts
  const { data: receiptsData, isLoading: isReceiptsLoading } = useQuery({
    queryKey: ['receipts', 'list', selectedYear?.id, selectedQuarter?.id],
    queryFn: () => receiptService.list({ 
      year_id: selectedYear?.id, 
      quarter_id: selectedQuarter?.id 
    }),
    enabled: !!selectedYear,
    select: res => res.data
  });

  // 3. Fetch Categories for naming
  const { data: categoryTree } = useQuery({
    queryKey: ['categories', 'list', selectedYear?.id],
    queryFn: () => categoryService.getByYear(selectedYear!.id),
    enabled: !!selectedYear,
    select: res => res.data
  });

  // Flat categories for easier lookup
  const categoriesData = useMemo(() => {
    if (!categoryTree) return [];
    const flatten = (nodes: any[]): any[] => {
      let result: any[] = [];
      nodes.forEach(node => {
        result.push(node);
        if (node.children) result = result.concat(flatten(node.children));
      });
      return result;
    };
    return flatten(categoryTree);
  }, [categoryTree]);

  // 4. Transform Data for Charts & Summary
  const derivedStats = useMemo(() => {
    if (!receiptsData) return { income: 0, expense: 0, discount: 0, balance: 0 };
    
    let income = 0;
    let expense = 0;
    let discount = 0;
    
    receiptsData.forEach(r => {
      income += r.income;
      expense += r.expense;
      discount += r.discount;
    });
    
    return {
      income,
      expense,
      discount,
      balance: income - expense + discount
    };
  }, [receiptsData]);

  const categoryChartData = useMemo(() => {
    if (!receiptsData || !categoriesData.length) return [];

    const catMap = new Map<number, number>();
    receiptsData.forEach(r => {
      if (r.category_id && r.expense > 0) {
        catMap.set(r.category_id, (catMap.get(r.category_id) || 0) + r.expense);
      }
    });

    return Array.from(catMap.entries())
      .map(([id, value]) => ({
        name: categoriesData.find(c => c.id === id)?.name || '기타',
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [receiptsData, categoriesData]);

  const trendChartData = useMemo(() => {
    if (!receiptsData) return [];

    const dailyMap = new Map<string, { date: string, income: number, expense: number }>();
    
    receiptsData.forEach(r => {
      const date = r.transaction_at.split('T')[0];
      const entry = dailyMap.get(date) || { date, income: 0, expense: 0 };
      entry.income += r.income;
      entry.expense += r.expense;
      dailyMap.set(date, entry);
    });

    return Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [receiptsData]);

  if (!selectedYear) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-inner">
          <Layout size={48} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">준비 완료</h3>
          <p className="text-sm max-w-sm mx-auto leading-relaxed">
            측면 메뉴에서 연도를 선택하여 대시보드 구성을 시작하세요.
          </p>
        </div>
      </div>
    );
  }

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {selectedYear.name} <span className="text-primary">{selectedQuarter?.name || '전체'}</span> 현황
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            재정 상태와 소비 패턴을 실시간으로 분석합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Data
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="최종 잔액" 
          value={derivedStats.balance} 
          icon={<Wallet className="text-indigo-600 dark:text-indigo-400" size={20} />}
          gradient="from-indigo-500/10 to-blue-500/10"
          borderColor="border-indigo-500/20"
          valueColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard 
          title="총 수입" 
          value={derivedStats.income} 
          icon={<TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} />}
          gradient="from-emerald-500/10 to-teal-500/10"
          borderColor="border-emerald-500/20"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard 
          title="총 지출" 
          value={derivedStats.expense} 
          icon={<TrendingDown className="text-rose-600 dark:text-rose-400" size={20} />}
          gradient="from-rose-500/10 to-orange-500/10"
          borderColor="border-rose-500/20"
          valueColor="text-rose-600 dark:text-rose-400"
        />
        <StatCard 
          title="총 할인" 
          value={derivedStats.discount} 
          icon={<Gift className="text-amber-600 dark:text-amber-400" size={20} />}
          gradient="from-amber-500/10 to-yellow-500/10"
          borderColor="border-amber-500/20"
          valueColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-8 glass p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                <BarChart3 size={20} className="text-indigo-500" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 italic">Financial Trends</h4>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="lg:col-span-4 glass p-6 rounded-3xl space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-50 dark:bg-pink-950/30 rounded-xl">
              <PieChartIcon size={20} className="text-pink-500" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 italic">Top Categories</h4>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {categoryChartData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                데이터 없음
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {categoryChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient, 
  borderColor, 
  valueColor 
}: { 
  title: string, 
  value: number, 
  icon: React.ReactNode,
  gradient: string,
  borderColor: string,
  valueColor: string
}) {
  return (
    <div className={cn(
      "relative overflow-hidden glass p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group",
      borderColor
    )}>
      <div className={cn("absolute inset-0 bg-gradient-to-br -z-10 opacity-50", gradient)} />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className={cn("text-2xl font-black tabular-nums", valueColor)}>
            ₩{value.toLocaleString()}
          </h4>
        </div>
        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform group-hover:rotate-12">
          {icon}
        </div>
      </div>
    </div>
  );
}
