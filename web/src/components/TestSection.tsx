import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Button } from "./ui/button"
import { MoreHorizontal } from "lucide-react"
import { Checkbox } from "@radix-ui/react-checkbox"
import { AdminDataTable } from "./TestDataTable"

const data: Payment[] = [
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
    {
        id: "bhqecj4p",
        post: "say no to genocide...",
        amount: 721,
        status: "failed",
        creationDate: "30 April - 2024",
        reach: '12,213'
    },
]

type Payment = {
    id: string
    post: string,
    status: "pending" | "processing" | "success" | "failed"
    reach: string,
    creationDate: string,
    amount: number,

}

const columns = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "post",
        header: "Users",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("post")}</div>
        ),
    },
    {
        accessorKey: "reach",
        header: "Reach",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("reach")}</div>
        ),
    },
    {
        accessorKey: "creationDate",
        header: "Creation Date",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("creationDate")}</div>
        ),

    },

    {
        accessorKey: "amount",
        header: () => <div className="text-right">Total Cost</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))

            // Format the amount as a dollar amount
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="text-right font-medium">{formatted}</div>
        },
    },

    {
        id: "actions",
        enableHiding: false,
        cell: () => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Example</DropdownMenuItem>
                        <DropdownMenuItem>Example 2</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

function TestSection() {
    console.log(columns, data)
    return (
        <div>
            <AdminDataTable columns={columns} data={data} />
        </div>
    )
}

export default TestSection