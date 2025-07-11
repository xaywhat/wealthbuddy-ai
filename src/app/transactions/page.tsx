'use client';

import { Suspense } from 'react';
import TransactionsContent from './TransactionsContent';

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
