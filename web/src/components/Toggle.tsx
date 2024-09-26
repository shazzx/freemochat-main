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
        // <DropdownMenu>
        //     <DropdownMenuTrigger asChild>
        //         <Button className="bg-none outline-none rounded-full h-10 w-10" >
        //             <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        //             <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        //             <span className="sr-only">Toggle theme</span>
        //         </Button>
        //     </DropdownMenuTrigger>
        //     <DropdownMenuContent align="end">
        //         <DropdownMenuItem onClick={() => setTheme("light")}>
        //             Light
        //         </DropdownMenuItem>
        //         <DropdownMenuItem onClick={() => setTheme("dark")}>
        //             Dark
        //         </DropdownMenuItem>
        //         {/* <DropdownMenuItem onClick={() => setTheme("system")}> */}
        //             {/* System */}
        //         {/* </DropdownMenuItem> */}
        //     </DropdownMenuContent>
        // </DropdownMenu>
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
