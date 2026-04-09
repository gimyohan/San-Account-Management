import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { yearService } from '../api/yearService';
import { quarterService } from '../api/quarterService';
import type { Year, Quarter } from '../types/yearQuarter';

interface SelectionContextType {
  selectedYear: Year | null;
  selectedQuarter: Quarter | null;
  years: Year[];
  quarters: Quarter[];
  setSelectedYear: (year: Year | null) => void;
  setSelectedQuarter: (quarter: Quarter | null) => void;
  isLoading: boolean;
  refreshYears: () => Promise<void>;
  refreshQuarters: () => Promise<void>;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);

  // 1. Years Query
  const { data: yearsRes, isLoading: isYearsLoading, refetch: refreshYears } = useQuery({
    queryKey: ['years'],
    queryFn: yearService.getAll,
    staleTime: 1000 * 60 * 10, // 10 mins cache
  });
  const years = yearsRes?.data || [];

  // 2. Quarters Query
  const { data: quartersRes, isLoading: isQuartersLoading, refetch: refreshQuarters } = useQuery({
    queryKey: ['quarters', selectedYear?.id],
    queryFn: () => quarterService.getByYear(selectedYear!.id),
    enabled: !!selectedYear,
    staleTime: 1000 * 60 * 10,
  });
  const quarters = quartersRes?.data || [];

  // --- Logic for Selection Consistency (Initial & Deletion) ---
  useEffect(() => {
    if (years.length > 0) {
      const stillExists = selectedYear ? years.find(y => y.id === selectedYear.id) : null;
      
      if (!selectedYear || !stillExists) {
        // Find saved year or fallback to latest
        const savedYearId = localStorage.getItem('selectedYearId');
        const savedFound = years.find(y => y.id === Number(savedYearId));
        
        if (savedFound) {
          setSelectedYear(savedFound);
        } else {
          const latest = [...years].sort((a, b) => b.year - a.year)[0];
          setSelectedYear(latest);
        }
      }
    } else {
      setSelectedYear(null);
    }
  }, [years, selectedYear]);

  useEffect(() => {
    if (quarters.length > 0 && !selectedQuarter && selectedYear) {
      const savedQuarterId = localStorage.getItem(`selectedQuarterId_${selectedYear.id}`);
      const found = quarters.find(q => q.id === Number(savedQuarterId));
      if (found) {
        setSelectedQuarter(found);
      } else {
        const first = [...quarters].sort((a, b) => a.order - b.order)[0];
        setSelectedQuarter(first);
      }
    } else if (quarters.length === 0) {
      setSelectedQuarter(null);
    }
  }, [quarters, selectedQuarter, selectedYear]);

  // --- Persist Selection ---
  useEffect(() => {
    if (selectedYear) {
      localStorage.setItem('selectedYearId', String(selectedYear.id));
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedQuarter && selectedYear) {
      localStorage.setItem(`selectedQuarterId_${selectedYear.id}`, String(selectedQuarter.id));
    }
  }, [selectedQuarter, selectedYear]);

  // Wrapper for refreshing (invalidating)
  const refreshYearsWrapped = async () => {
    await queryClient.invalidateQueries({ queryKey: ['years'] });
  };

  const refreshQuartersWrapped = async () => {
    await queryClient.invalidateQueries({ queryKey: ['quarters', selectedYear?.id] });
  };

  return (
    <SelectionContext.Provider value={{
      selectedYear,
      selectedQuarter,
      years,
      quarters,
      setSelectedYear,
      setSelectedQuarter,
      isLoading: isYearsLoading || isQuartersLoading,
      refreshYears: refreshYearsWrapped as any,
      refreshQuarters: refreshQuartersWrapped as any
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
