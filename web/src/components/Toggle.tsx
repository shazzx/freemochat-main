// @ts-ignore
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <div className="flex gap-2" onClick={() => {
            if(theme == 'dark'){
                setTheme('light')
            }else{
                setTheme("dark")
            }
        }} >
                {theme == 'dark' &&
                <div className="flex gap-2 cursor-pointer justify-center items-center">
                <Sun size={22} />
                <span>Light</span>
                </div>
                }
                {theme == 'light' && 
                <div className="flex gap-2 cursor-pointer justify-center items-center">
                <Moon size={22} />
                <span>Dark</span>
                </div>
                }

        </div>
    )
}
