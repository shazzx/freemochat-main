import { AdminDataTable } from '@/components/TestDataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { format } from 'date-fns'
import { useRemoveReport, useReports } from '@/hooks/Admin/useReports'




function ReportsSection() {
    const searchRef = useRef()
    const [search, setSearch] = useState()
    const queryClient = useQueryClient()

    let { data, isSuccess, fetchNextPage} = useReports(searchRef)

    console.log(data)
    const removeReport = useRemoveReport()


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
            accessorKey: "postId",
            header: "Post Id",
            cell: ({ row }) => (
                <div className="capitalize">{row.original?.postId}</div>
            ),
        },
        {
            header: "Username",
            cell: ({ row }) => (
                <div>@{row.original.reportedBy[0].username}</div>
            ),
        },

        {
            accessorKey: "createdAt",
            header: "Reported On",
            cell: ({ row }) => (
                <div className="capitalize">{format(row.getValue("createdAt"), 'MMM d, yyy h:mm a')}</div>
            ),


        },

        {
            id: "actions",
            header: "Action",
            enableHiding: false,
            cell: (data) => {
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
                            <DropdownMenuItem onClick={() => {
                                let reportId = data.row.original?._id
                                removeReport.mutate({ reportId })
                            }}>Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]


    const debouncedSearch = debounce((value) => {
        setSearch(value)
    }, 300);
    console.log(data)

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, []);


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    const _fetchNextPage = () => {
        fetchNextPage()
    }

    useEffect(() => {
        searchRef.current = search
        queryClient.invalidateQueries({ queryKey: ["usersAdmin"] });
    }, [search])

    return (
        <main className="w-full overflow-auto px-8 py-4">
            <AdminDataTable title={"reports"} filter={true} columns={columns} data={isSuccess && data} handleSearchChange={handleSearchChange} fetchNextPage={_fetchNextPage} />
        </main>
    )
}

export default React.memo(ReportsSection)