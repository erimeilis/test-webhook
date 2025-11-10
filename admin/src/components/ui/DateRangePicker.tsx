/**
 * DateRangePicker Component
 * Date range selector using react-day-picker
 */

import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

export interface DateRangePickerProps {
  selected?: DateRange
  onSelect?: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({ selected, onSelect, className = '' }: DateRangePickerProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-3 ${className}`}>
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={onSelect}
        numberOfMonths={1}
        className="rdp-custom"
      />
    </div>
  )
}
