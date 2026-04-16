import * as React from "react"

import { cn } from "@/lib/utils"

const SelectContext = React.createContext({ value: "", onValueChange: undefined })

const getOptionText = (children) => {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child)
      if (React.isValidElement(child)) return getOptionText(child.props.children)
      return ""
    })
    .join("")
}

const flattenSelectItems = (children) => {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return []

    if (child.type === SelectItem) {
      return [{ value: child.props.value, label: getOptionText(child.props.children) }]
    }

    if (child.props?.children) {
      return flattenSelectItems(child.props.children)
    }

    return []
  })
}

const Select = ({ value = "", onValueChange, children }) => {
  const items = React.useMemo(() => flattenSelectItems(children), [children])
  const trigger = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === SelectTrigger
  )

  return (
    <SelectContext.Provider value={{ value, onValueChange, items }}>
      {trigger || null}
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }) => <>{children}</>

const SelectValue = ({ placeholder }) => {
  const { value, items } = React.useContext(SelectContext)
  const selectedItem = items.find((item) => item.value === value)
  return <>{selectedItem?.label || placeholder || null}</>
}

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { value, onValueChange, items } = React.useContext(SelectContext)
  const placeholder = getOptionText(children).trim()

  return (
    <select
      ref={ref}
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring",
        className
      )}
      {...props}
    >
      {placeholder ? <option value="" disabled>{placeholder}</option> : null}
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ children }) => <>{children}</>

const SelectLabel = ({ children }) => <>{children}</>

const SelectItem = ({ children }) => <>{children}</>

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