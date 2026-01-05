"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4 bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl group/calendar text-slate-100",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-300 hover:text-white hover:bg-white/10 transition-colors rounded-full",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-300 hover:text-white hover:bg-white/10 transition-colors rounded-full",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-9 w-full",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-9 gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-blue-500 border border-white/10 bg-slate-900/50 text-slate-200 shadow-sm rounded-md hover:bg-slate-800 transition-colors",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-slate-900 border border-white/10 text-slate-200 shadow-xl rounded-md py-1",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-bold text-lg text-white tracking-wide",
          captionLayout === "label"
            ? ""
            : "rounded-md pl-2 pr-1 flex items-center gap-1 hover:bg-white/5 transition-colors",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex mb-2", defaultClassNames.weekdays),
        weekday: cn(
          "text-slate-400 rounded-md flex-1 font-medium text-[0.8rem] uppercase tracking-wider select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-9 text-slate-500",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.7rem] select-none text-slate-600 font-mono",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center text-sm focus-within:relative focus-within:z-20 group/day aspect-square select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-blue-500/20 text-blue-100",
          defaultClassNames.range_start
        ),
        range_middle: cn("bg-blue-500/10 text-blue-200 rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-blue-500/20 text-blue-100", defaultClassNames.range_end),
        today: cn(
          "bg-white/5 text-blue-400 font-semibold border border-blue-500/30 rounded-full",
          defaultClassNames.today
        ),
        outside: cn(
          "text-slate-600 opacity-40 aria-selected:bg-slate-800/30 aria-selected:text-slate-400",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-slate-700 opacity-30",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center text-slate-500">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant={modifiers.selected ? "default" : "ghost"}
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "aspect-square p-0 font-normal aria-selected:opacity-100 transition-all duration-300 relative z-10",
        // Default Hover
        !modifiers.selected && "hover:bg-white/10 hover:text-white hover:scale-110",
        // Selected Single (Pulse & Glow)
        modifiers.selected &&
        !modifiers.range_middle &&
        "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] scale-105",
        // Range Middle
        modifiers.range_middle && "bg-blue-500/10 text-blue-200 rounded-none",
        // Range Ends
        (modifiers.range_start || modifiers.range_end) && "bg-blue-600 text-white shadow-md",

        // Today (Border & Glow)
        !modifiers.selected && modifiers.today &&
        "border border-blue-400/50 text-blue-300 bg-blue-500/5 shadow-[0_0_10px_rgba(59,130,246,0.1)]",

        // Force Rounding for single days
        (!modifiers.range_middle && !modifiers.range_start && !modifiers.range_end) && "rounded-full",

        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
