"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps, CaptionProps, useNavigation } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"

export type CalendarProps = DayPickerProps

function CustomCaption(props: CaptionProps) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation()

  return (
    <div className="flex items-center justify-center gap-3 pt-1 h-10">
      <button
        type="button"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "h-7 w-7 bg-transparent border border-transparent text-slate-400 hover:bg-slate-800 hover:text-amber-400",
          !previousMonth && "opacity-50 cursor-not-allowed"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="text-sm font-medium text-slate-100 capitalize min-w-[140px] text-center">
        {format(props.calendarMonth.date, "MMMM yyyy", { locale: es })}
      </div>

      <button
        type="button"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "h-7 w-7 bg-transparent border border-transparent text-slate-400 hover:bg-slate-800 hover:text-amber-400",
          !nextMonth && "opacity-50 cursor-not-allowed"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-fit mx-auto",
        caption: "flex justify-center items-center",
        nav: "hidden", // Hide default navigation
        nav_button: "hidden", // Hide default nav buttons
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        month_grid: "border-collapse mt-4",
        weekdays: "flex",
        weekday: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem] uppercase text-center",
        week: "flex w-full mt-2",
        day_button: cn(
          "h-9 w-9 p-0 font-normal text-sm rounded-md hover:bg-slate-800 hover:text-amber-400 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        ),
        day: "h-9 w-9 text-center text-sm p-0 relative",
        selected:
          "bg-amber-500 text-slate-950 hover:bg-amber-500 hover:text-slate-950 focus:bg-amber-500 focus:text-slate-950",
        today: "bg-slate-800 text-amber-400",
        outside:
          "text-slate-600 opacity-50",
        disabled: "text-slate-700 opacity-50 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        MonthCaption: CustomCaption,
      }}
      {...props}
    />
  )
}
