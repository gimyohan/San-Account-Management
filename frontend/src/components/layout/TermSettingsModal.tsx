import { useState, useEffect, useCallback } from 'react';
import { useSelection } from '../../contexts/SelectionContext';
import { yearService } from '../../api/yearService';
import { quarterService } from '../../api/quarterService';
import { X, Plus, Edit2, Trash2, Calendar, Clock, Save } from 'lucide-react';
import type { Year, Quarter } from '../../types/yearQuarter';

interface TermSettingsModalProps {
  onClose: () => void;
}

export function TermSettingsModal({ onClose }: TermSettingsModalProps) {
  const { 
    years, refreshYears, 
    selectedYear,
    refreshQuarters: refreshGlobalQuarters
  } = useSelection();

  const [activeYearId, setActiveYearId] = useState<number | null>(selectedYear?.id || (years.length > 0 ? years[0].id : null));
  const [activeQuarters, setActiveQuarters] = useState<Quarter[]>([]);
  const [isEditingYear, setIsEditingYear] = useState<number | null>(null);
  const [isEditingQuarter, setIsEditingQuarter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Draft states
  const [yearForm, setYearForm] = useState({ year: 2026, name: '' });
  const [quarterForm, setQuarterForm] = useState({ order: 1, name: '' });

  const activeYear = years.find(y => y.id === activeYearId);

  // 로컬 기수(분기) 목록 동기화
  const fetchActiveQuarters = useCallback(async () => {
    if (!activeYearId) return;
    try {
      const res = await quarterService.getByYear(activeYearId);
      setActiveQuarters(res.data);
    } catch (error) {
      console.error('Failed to fetch quarters for year', activeYearId);
    }
  }, [activeYearId]);

  useEffect(() => {
    fetchActiveQuarters();
  }, [fetchActiveQuarters]);

  const handleCreateYear = async () => {
    try {
      setIsLoading(true);
      await yearService.create({ ...yearForm, name: yearForm.name || `${yearForm.year}년` });
      await refreshYears();
      setYearForm({ year: yearForm.year + 1, name: '' });
    } catch (error) {
      alert('연도 생성 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateYear = async (id: number) => {
    try {
      setIsLoading(true);
      await yearService.update(id, yearForm);
      await refreshYears();
      setIsEditingYear(null);
    } catch (error) {
      alert('연도 수정 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteYear = async (id: number) => {
    if (!window.confirm('연도를 삭제하시겠습니까? 관련 데이터가 모두 삭제될 수 있습니다.')) return;
    try {
      setIsLoading(true);
      await yearService.delete(id);
      await refreshYears();
      if (activeYearId === id) setActiveYearId(years.find(y => y.id !== id)?.id || null);
    } catch (error) {
      alert('연도 삭제 실패 (하위 데이터가 있을 수 있습니다)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuarter = async () => {
    if (!activeYearId) return;
    try {
      setIsLoading(true);
      await quarterService.create({ 
        year_id: activeYearId, 
        order: quarterForm.order, 
        name: quarterForm.name || `${quarterForm.order}분기` 
      });
      await fetchActiveQuarters();
      if (activeYearId === selectedYear?.id) {
        refreshGlobalQuarters();
      }
      setQuarterForm({ order: (quarterForm.order % 4) + 1, name: '' });
    } catch (error) {
      alert('기간 생성 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuarter = async (id: number) => {
    try {
      setIsLoading(true);
      await quarterService.update(id, quarterForm);
      await fetchActiveQuarters();
      if (activeYearId === selectedYear?.id) {
        refreshGlobalQuarters();
      }
      setIsEditingQuarter(null);
    } catch (error) {
      alert('기간 수정 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuarter = async (id: number) => {
    if (!window.confirm('기간을 삭제하시겠습니까?')) return;
    try {
      setIsLoading(true);
      await quarterService.delete(id);
      await fetchActiveQuarters();
      if (activeYearId === selectedYear?.id) {
        refreshGlobalQuarters();
      }
    } catch (error) {
      alert('기간 삭제 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="text-primary" size={24} /> 회계 기간 관리
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">연도 및 세부 기간(분기/반기 등) 체계를 구성합니다.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Years List */}
          <div className="w-64 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/30">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yearly Layers</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {years.map(y => (
                <div 
                  key={y.id}
                  onClick={() => setActiveYearId(y.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeYearId === y.id ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar size={14} className={activeYearId === y.id ? 'text-primary' : 'text-slate-400'} />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-bold truncate ${activeYearId === y.id ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                        {y.name || `${y.year}년`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">FY {y.year}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsEditingYear(y.id); setYearForm({ year: y.year, name: y.name || '' }); }}
                      className="p-1 hover:text-primary"
                    ><Edit2 size={12} /></button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteYear(y.id); }}
                      className="p-1 hover:text-destructive"
                    ><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
               <div className="space-y-2">
                 <input 
                    type="number" 
                    value={yearForm.year} 
                    onChange={e => setYearForm({...yearForm, year: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs font-bold"
                    placeholder="2026"
                 />
                 <input 
                    type="text" 
                    value={yearForm.name}
                    onChange={e => setYearForm({...yearForm, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs"
                    placeholder="연도 이름 (선택)"
                 />
                 <button 
                    onClick={handleCreateYear}
                    disabled={isLoading}
                    className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 flex items-center justify-center gap-1"
                 >
                   <Plus size={14} /> 연도 추가
                 </button>
               </div>
            </div>
          </div>

          {/* Quarters Detail */}
          <div className="flex-1 flex flex-col">
            {activeYear ? (
              <>
                <div className="p-6 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                   <div className="flex items-center justify-between">
                     <div>
                       <h4 className="text-lg font-bold text-slate-800 dark:text-white">{activeYear.name || `${activeYear.year}년`} 기간 구성</h4>
                       <p className="text-xs text-slate-500 mt-1">해당 연도 내의 하위 회계 기간(분기/반기 등)을 관리합니다.</p>
                     </div>
                     {isEditingYear === activeYear.id && (
                       <div className="flex gap-2">
                         <button onClick={() => setIsEditingYear(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg">취소</button>
                         <button onClick={() => handleUpdateYear(activeYear.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg flex items-center gap-1"><Save size={12}/> 저장</button>
                       </div>
                     )}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeQuarters.sort((a, b) => a.order - b.order).map(q => (
                      <div key={q.id} className="group p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                            {q.order}
                          </div>
                          {isEditingQuarter === q.id ? (
                            <div className="space-y-1">
                              <input 
                                type="text"
                                defaultValue={q.name}
                                onBlur={(e) => { setQuarterForm({ order: q.order, name: e.target.value }); }}
                                className="text-sm font-bold bg-slate-50 dark:bg-slate-800 border-none rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-bold text-slate-800 dark:text-white">{q.name}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Order {q.order}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditingQuarter === q.id ? (
                            <button onClick={() => handleUpdateQuarter(q.id)} className="p-2 text-primary hover:bg-primary/10 rounded-lg"><Save size={16}/></button>
                          ) : (
                            <button onClick={() => { setIsEditingQuarter(q.id); setQuarterForm({ order: q.order, name: q.name }); }} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Edit2 size={16}/></button>
                          )}
                          <button onClick={() => handleDeleteQuarter(q.id)} className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Quarter Placeholder */}
                  <div className="p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-4 bg-slate-50/20 dark:bg-slate-950/10">
                    <div className="flex items-center gap-4 w-full max-w-sm">
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order & Name</label>
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            min="1"
                            value={quarterForm.order}
                            onChange={e => setQuarterForm({...quarterForm, order: parseInt(e.target.value) || 1})}
                            className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                          />
                          <input 
                            type="text" 
                            placeholder="기간 이름 (예: 상반기, 1분기 등)"
                            value={quarterForm.name}
                            onChange={e => setQuarterForm({...quarterForm, name: e.target.value})}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={handleCreateQuarter}
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 flex items-center gap-2 transition-all shadow-lg"
                    >
                      <Plus size={18} /> 새 기간 추가
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600">
                  <Clock size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">연도를 선택하세요</h4>
                  <p className="text-sm text-slate-500 mt-1">좌측 목록에서 관리할 연도를 선택하면<br/>해당 연도의 기간 구성을 편집할 수 있습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/30 dark:bg-slate-950/30">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
