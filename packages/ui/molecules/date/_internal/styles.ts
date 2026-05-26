import { cn } from '../../../lib/utils'

export const calendarClassNames = {
  root: 'p-3',
  chevron: 'w-5 h-5 fill-current',
  months: 'flex gap-6 relative',
  month: 'space-y-3',
  month_caption: 'flex justify-center items-center gap-2 h-8 relative',
  caption_label: 'text-sm font-semibold text-gray-900 flex items-center gap-1',
  nav: 'flex absolute inset-x-0 top-0 h-8 items-center justify-between z-10 pointer-events-none',
  button_previous: cn(
    'h-8 w-8 rounded-md flex items-center justify-center pointer-events-auto',
    'text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors',
    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent',
  ),
  button_next: cn(
    'h-8 w-8 rounded-md flex items-center justify-center pointer-events-auto',
    'text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors',
    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent',
  ),
  month_grid: 'w-full',
  weekdays: 'flex',
  weekday: 'w-9 h-7 text-xs text-gray-400 font-normal flex items-center justify-center',
  weeks: '',
  week: 'flex w-full mt-1',
  // day (td): group marker + range background
  day: 'group/day relative w-9 h-9 text-center text-sm p-0',
  day_button: cn(
    'w-9 h-9 text-sm font-normal rounded-md transition-colors',
    'hover:bg-gray-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0',
    // selected (single mode + range start/end)
    'group-data-[selected=true]/day:bg-blue-600 group-data-[selected=true]/day:text-white',
    'group-data-[selected=true]/day:hover:bg-blue-700',
    // range_middle overrides selected (range_middle days don't have data-selected)
    'group-data-[range-middle=true]/day:bg-blue-100 group-data-[range-middle=true]/day:text-blue-900',
    'group-data-[range-middle=true]/day:rounded-none group-data-[range-middle=true]/day:hover:bg-blue-200',
    // today
    'group-data-[today=true]/day:font-semibold',
    // disabled
    'group-data-[disabled=true]/day:opacity-30 group-data-[disabled=true]/day:cursor-not-allowed',
    'group-data-[disabled=true]/day:hover:bg-transparent',
    // outside
    'group-data-[outside=true]/day:opacity-30',
  ),
  // range strip on td (background connecting the selected range)
  range_start: 'bg-gradient-to-r from-transparent to-blue-100',
  range_middle: 'bg-blue-100',
  range_end: 'bg-gradient-to-l from-transparent to-blue-100',
  selected: '',
  today: '',
  outside: '',
  disabled: '',
  hidden: 'invisible',
  focused: '',
  // animation (disabled)
  weeks_before_enter: '',
  weeks_before_exit: '',
  weeks_after_enter: '',
  weeks_after_exit: '',
  caption_after_enter: '',
  caption_after_exit: '',
  caption_before_enter: '',
  caption_before_exit: '',
  // misc UI elements
  dropdowns: 'flex items-center gap-1',
  dropdown: 'absolute inset-0 opacity-0 cursor-pointer',
  dropdown_root: 'relative inline-flex items-center',
  footer: '',
  months_dropdown: '',
  week_number: 'w-9 h-9 text-xs text-gray-400 flex items-center justify-center',
  week_number_header: 'w-9 h-7 text-xs text-gray-400 flex items-center justify-center',
  years_dropdown: '',
}
