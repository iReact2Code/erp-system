'use client'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically load the date picker (react-day-picker heavy parts) client-side only
export const DatePickerWithRangeLazy = dynamic(
  () => import('./date-picker').then(m => ({ default: m.DatePickerWithRange })),
  {
    ssr: false,
    loading: () => (
      <div className="w-[300px] h-[42px] flex items-center justify-start">
        <Skeleton className="h-6 w-40" />
      </div>
    ),
  }
)

export default DatePickerWithRangeLazy
