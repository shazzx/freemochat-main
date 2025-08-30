"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const frameworks = [
  {
    value: "public",
    label: "Public",
  },
  {
    value: "private",
    label: "Private",
  },
]

export function Combobox({getSelected}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(frameworks[0].value)

  return (
    <Popover open={open} onOpenChange={setOpen} >
      <PopoverTrigger defaultChecked={true} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          onClick={() => {
    console.log(open, value)

          }}
          className="w-[120px] bg-card text-foreground border border-accent justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue)
                    getSelected(currentValue)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
