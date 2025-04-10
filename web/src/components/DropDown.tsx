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
import { MdCopyAll, MdDelete, MdEdit, MdReport, MdUpgrade } from "react-icons/md"

export function DropdownMenuMain({ deletePost, setConfirmModelState, setReportModelState, reportModelState, postPromotion, setPostPromotion, postBy, setEditPostModelState, copyPost }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <EllipsisVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent >
                <DropdownMenuGroup>
                    {postBy && (location.pathname !==  '/' && location.pathname !==  '/groups' && location.pathname !==  '/pages') && <DropdownMenuItem className="cursor-pointer" onClick={() => {
                        setEditPostModelState(true)
                    }}>
                        <MdEdit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>}
                    {postBy &&
                        <DropdownMenuItem className="cursor-pointer" onClick={() => {
                            if (postPromotion == false) {
                                setPostPromotion(true)
                            }
                        }}>
                            <MdUpgrade className="mr-2 h-4 w-4" />
                            <span>Promote</span>
                        </DropdownMenuItem>
                    }

                    {!postBy && <DropdownMenuItem onClick={() => {
                        setReportModelState(!reportModelState)
                    }} className="cursor-pointer">
                        <MdReport className="mr-2 h-4 w-4" />
                        <span>Report</span>
                    </DropdownMenuItem>}

                    <DropdownMenuItem onClick={() => {
                        copyPost()
                    }} className="cursor-pointer">
                        <MdCopyAll className="mr-2 h-4 w-4" />
                        <span>Copy</span>
                    </DropdownMenuItem>
                    {postBy && (location.pathname !==  '/' && location.pathname !==  '/groups' && location.pathname !==  '/pages'  ) && <DropdownMenuItem className="cursor-pointer" onClick={deletePost}>
                        <MdDelete className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
