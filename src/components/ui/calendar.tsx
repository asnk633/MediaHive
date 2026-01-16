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
        "p-4 bg-surface backdrop-blur-xl shadow-2xl rounded-2xl group/calendar text-foreground",
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
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-muted hover:text-foreground hover:bg-surface transition-colors rounded-full",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 text-muted hover:text-foreground hover:bg-surface transition-colors rounded-full",
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
          "relative has-focus:border-primary border-none bg-surface/50 text-foreground shadow-sm rounded-md hover:bg-surface transition-colors",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-card text-foreground shadow-xl rounded-md py-1",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-bold text-lg text-foreground tracking-wide",
          captionLayout === "label"
            ? ""
            : "rounded-md pl-2 pr-1 flex items-center gap-1 hover:bg-surface transition-colors",
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
          "rounded-l-md bg-primary/20 text-primary",
          defaultClassNames.range_start
        ),
        range_middle: cn("bg-primary/10 text-primary-foreground/70 rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-primary/20 text-primary", defaultClassNames.range_end),
        today: cn(
          "bg-primary/5 text-primary font-semibold rounded-full shadow-sm",
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
        !modifiers.selected && "hover:bg-surface hover:text-foreground hover:scale-110",
        // Selected Single (Pulse & Glow)
        modifiers.selected &&
        !modifiers.range_middle &&
        "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 scale-105",
        // Range Middle
        modifiers.range_middle && "bg-primary/10 text-primary-foreground/70 rounded-none",
        // Range Ends
        (modifiers.range_start || modifiers.range_end) && "bg-primary text-primary-foreground shadow-md",

        // Today (Border & Glow)
        !modifiers.selected && modifiers.today &&
        "text-primary bg-primary/5 shadow-sm",

        // Force Rounding for single days
        (!modifiers.range_middle && !modifiers.range_start && !modifiers.range_end) && "rounded-full",

        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
