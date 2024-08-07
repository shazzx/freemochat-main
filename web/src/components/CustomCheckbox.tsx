"use client"

import { Checkbox } from "@/components/ui/checkbox"

export function CustomCheckbox({message, setAgreementCondition}) {
  return (
    <div className="flex items-center space-x-2" >
      <Checkbox id="terms" onCheckedChange={setAgreementCondition} />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {message}
      </label>
    </div>
  )
}
