"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = DayPickerProps

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
        month_caption: "flex justify-center pt-1 relative items-center h-10 w-full",
        caption_label: "text-sm font-medium text-slate-100",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "h-8 w-8 bg-slate-800 border border-slate-700 text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 z-50 shadow-sm"
        ),
        nav_button_previous: "absolute left-0 top-1/2 -translate-y-1/2",
        nav_button_next: "absolute right-0 top-1/2 -translate-y-1/2",
        button_previous: cn(
          "absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "h-8 w-8 bg-slate-800 border border-slate-700 text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 z-50 shadow-sm"
        ),
        button_next: cn(
          "absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "h-8 w-8 bg-slate-800 border border-slate-700 text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 z-50 shadow-sm"
        ),
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
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
