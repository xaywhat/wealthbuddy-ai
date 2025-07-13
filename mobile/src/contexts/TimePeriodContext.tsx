import React, { createContext, useContext, useState, ReactNode } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths } from 'date-fns';

interface TimePeriodContextType {
  selectedPeriod: string;
  customStartDate: string;
  customEndDate: string;
  setSelectedPeriod: (period: string) => void;
  setCustomStartDate: (date: string) => void;
  setCustomEndDate: (date: string) => void;
  getPeriodLabel: () => string;
  getDateRange: () => { startDate: string; endDate: string };
}

const TimePeriodContext = createContext<TimePeriodContextType | undefined>(undefined);

export const useTimePeriod = () => {
  const context = useContext(TimePeriodContext);
  if (context === undefined) {
    throw new Error('useTimePeriod must be used within a TimePeriodProvider');
  }
  return context;
};

interface TimePeriodProviderProps {
  children: ReactNode;
}

export const TimePeriodProvider: React.FC<TimePeriodProviderProps> = ({ children }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case 'this_week':
        return 'This Week';
      case 'last_week':
        return 'Last Week';
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'last_3_months':
        return 'Last 3 Months';
      case 'this_year':
        return 'This Year';
      case 'all':
        return 'All Time';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(new Date(customStartDate), 'MMM d')} - ${format(new Date(customEndDate), 'MMM d')}`;
        }
        return 'Custom Range';
      default:
        return 'This Month';
    }
  };

  const getDateRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case 'this_week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'last_week':
        const lastWeek = subWeeks(today, 1);
        startDate = startOfWeek(lastWeek, { weekStartsOn: 1 });
        endDate = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case 'this_month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'last_3_months':
        startDate = startOfMonth(subMonths(today, 2));
        endDate = endOfMonth(today);
        break;
      case 'this_year':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
        }
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  };

  const value: TimePeriodContextType = {
    selectedPeriod,
    customStartDate,
    customEndDate,
    setSelectedPeriod,
    setCustomStartDate,
    setCustomEndDate,
    getPeriodLabel,
    getDateRange,
  };

  return <TimePeriodContext.Provider value={value}>{children}</TimePeriodContext.Provider>;
};
