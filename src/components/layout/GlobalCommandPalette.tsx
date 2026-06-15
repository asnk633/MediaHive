"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { nativeNavigate } from "@/lib/utils"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    setMounted(true)
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  if (!mounted) return null


  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => nativeNavigate("/home", router))}>
            Go to Home
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => nativeNavigate("/tasks", router))}>
            Go to Tasks
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => nativeNavigate("/chat", router))}>
            Go to Chat
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => nativeNavigate("/calendar", router))}>
            Go to Calendar
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
