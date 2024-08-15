import { AdminDataTable } from '@/components/TestDataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { usePages, useRemovePage } from '@/hooks/Admin/usePage'
import { format } from 'date-fns'

function PagesSection() {
    const searchRef = useRef()
    const [search, setSearch] = useState()
    const queryClient = useQueryClient()

    let { data, isSuccess, fetchNextPage} = usePages(searchRef)

    const removePage = useRemovePage()

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
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <div className="flex items-center cursor-pointer select-none"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Page
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                )
            },
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "username",
            header: "Username",
            cell: ({ row }) => (
                <div>@{row.original.user[0].username}</div>
            ),
        },

        {
            accessorKey: "handle",
            header: "Handle",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("handle")}</div>
            ),
        },

        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => {
                return <div className="capitalize">{row?.original?.createdAt ? format(row.original.createdAt, 'MMM d, yyy h:mm a') : null}</div>
            },


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
                                let pageId = data.row.original?._id
                                removePage.mutate({ pageId })
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
            <AdminDataTable title={"Pages"} filter={true} columns={columns} data={data} handleSearchChange={handleSearchChange} fetchNextPage={_fetchNextPage} />
        </main>
    )
}

export default React.memo(PagesSection)