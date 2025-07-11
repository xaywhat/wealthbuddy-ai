'use client';

import { Suspense } from 'react';
import SubscriptionsContent from './SubscriptionsContent';

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SubscriptionsContent />
    </Suspense>
  );
}
