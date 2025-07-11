'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimePeriodContextType {
  selectedPeriod: string;
  customStartDate: string;
  customEndDate: string;
  setSelectedPeriod: (period: string) => void;
  setCustomStartDate: (date: string) => void;
  setCustomEndDate: (date: string) => void;
  getDateRange: () => DateRange | null;
  getPeriodLabel: () => string;
}

const TimePeriodContext = createContext<TimePeriodContextType | undefined>(undefined);

export function useTimePeriod() {
  const context = useContext(TimePeriodContext);
  if (context === undefined) {
    throw new Error('useTimePeriod must be used within a TimePeriodProvider');
  }
  return context;
}

interface TimePeriodProviderProps {
  children: ReactNode;
}

export function TimePeriodProvider({ children }: TimePeriodProviderProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const getDateRange = (): DateRange | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedPeriod) {
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek, end: new Date(now) };
      }
      case 'last_week': {
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        return { start: lastWeekStart, end: lastWeekEnd };
      }
      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: new Date(now) };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: startOfLastMonth, end: endOfLastMonth };
      }
      case 'last_3_months': {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { start: threeMonthsAgo, end: new Date(now) };
      }
      case 'last_6_months': {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return { start: sixMonthsAgo, end: new Date(now) };
      }
      case 'this_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: new Date(now) };
      }
      case 'last_year': {
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
        return { start: startOfLastYear, end: endOfLastYear };
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          return { 
            start: new Date(customStartDate), 
            end: new Date(customEndDate + 'T23:59:59') 
          };
        }
        return null;
      }
      case 'all':
      default:
        return null;
    }
  };

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case 'this_week': return 'This Week';
      case 'last_week': return 'Last Week';
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'last_3_months': return 'Last 3 Months';
      case 'last_6_months': return 'Last 6 Months';
      case 'this_year': return 'This Year';
      case 'last_year': return 'Last Year';
      case 'custom': {
        if (customStartDate && customEndDate) {
          return `${customStartDate} to ${customEndDate}`;
        }
        return 'Custom Range';
      }
      case 'all':
      default:
        return 'All Time';
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  return (
    <TimePeriodContext.Provider
      value={{
        selectedPeriod,
        customStartDate,
        customEndDate,
        setSelectedPeriod: handlePeriodChange,
        setCustomStartDate,
        setCustomEndDate,
        getDateRange,
        getPeriodLabel,
      }}
    >
      {children}
    </TimePeriodContext.Provider>
  );
}
