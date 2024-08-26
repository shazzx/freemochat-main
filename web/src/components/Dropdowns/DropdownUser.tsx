import {
    EllipsisVertical,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MdDelete, MdReport, MdUpgrade } from "react-icons/md"
import { FC } from "react"
import { AlertDialogC } from "../AlertDialog"

export const DropdownUser: FC<any> = ({ deleteChat, blockUser, setReportModelState, reportModelState }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <EllipsisVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-8" >
                <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer" onClick={blockUser}>
                        <MdUpgrade className="mr-2 h-4 w-4" />
                        <span>Block</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {
                        setReportModelState(!reportModelState)
                    }} className="cursor-pointer">
                        <MdReport className="mr-2 h-4 w-4" />
                        <span>Report</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer" onClick={deleteChat}>
                        <AlertDialogC action={deleteChat} button={<Button variant="outline"><MdDelete className="mr-2 h-4 w-4" /> Delete Chat</Button>} />
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
