import * as React from "react"

import { cn } from "@/lib/utils"

const Select = ({ value, onValueChange, children, ...props }) => (
  <select
    value={value}
    onChange={(event) => onValueChange?.(event.target.value)}
    {...props}
  >
    {children}
  </select>
)

const SelectGroup = ({ children }) => <>{children}</>

const SelectValue = ({ placeholder }) => <>{placeholder || null}</>

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring",
      className
    )}
    {...props}
  >
    {children}
  </select>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ children }) => <>{children}</>

const SelectLabel = ({ children }) => <>{children}</>

const SelectItem = ({ value, children }) => <option value={value}>{children}</option>

const SelectSeparator = () => null

const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}