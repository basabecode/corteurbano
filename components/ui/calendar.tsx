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
    <div className="flex items-center justify-center gap-3 pt-1 h-12 md:h-10">
      <button
        type="button"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className={cn(
          "inline-flex items-center justify-center rounded-lg md:rounded-md text-sm font-medium transition-all active:scale-95",
          "h-10 w-10 md:h-7 md:w-7 min-h-[40px] min-w-[40px] md:min-h-0 md:min-w-0", // Touch-friendly en móvil
          "bg-transparent border border-transparent text-slate-400 hover:bg-slate-800 hover:text-amber-400",
          !previousMonth && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
      </button>

      <div className="text-base md:text-sm font-medium text-slate-100 capitalize min-w-[160px] md:min-w-[140px] text-center">
        {format(props.calendarMonth.date, "MMMM yyyy", { locale: es })}
      </div>

      <button
        type="button"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className={cn(
          "inline-flex items-center justify-center rounded-lg md:rounded-md text-sm font-medium transition-all active:scale-95",
          "h-10 w-10 md:h-7 md:w-7 min-h-[40px] min-w-[40px] md:min-h-0 md:min-w-0", // Touch-friendly en móvil
          "bg-transparent border border-transparent text-slate-400 hover:bg-slate-800 hover:text-amber-400",
          !nextMonth && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
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
      className={cn("p-4 md:p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full md:w-fit mx-auto",
        caption: "flex justify-center items-center",
        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        month_grid: "border-collapse mt-4 w-full",
        weekdays: "flex",
        weekday: "text-slate-500 rounded-md flex-1 md:w-11 font-normal text-xs md:text-[0.8rem] uppercase text-center py-2",
        week: "flex w-full mt-2 gap-1",
        day_button: cn(
          // Mobile-first: botones más grandes y táctiles
          "h-11 w-full md:h-10 md:w-10 min-h-[44px] md:min-h-0",
          "p-0 font-normal text-base md:text-sm rounded-lg md:rounded-md",
          "hover:bg-slate-800 hover:text-amber-400 transition-all active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        ),
        day: "flex-1 md:h-10 md:w-10 text-center p-0 relative",
        selected:
          "bg-amber-500 text-slate-950 hover:bg-amber-500 hover:text-slate-950 focus:bg-amber-500 focus:text-slate-950 font-semibold",
        today: "bg-slate-800 text-amber-400 font-medium",
        outside: "text-slate-600 opacity-50",
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
