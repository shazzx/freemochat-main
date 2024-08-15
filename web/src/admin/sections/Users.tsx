import { AdminDataTable } from '@/components/TestDataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useRemoveUser, useSuspendUser, useUsers } from '@/hooks/Admin/useUser'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { format } from 'date-fns'
import UserModel from '../models/UserModel'




function UsersSection() {
    const searchRef = useRef()
    const [search, setSearch] = useState()
    const queryClient = useQueryClient()
    const [users, setUsers] = useState([])

    let { data, isSuccess, fetchNextPage } = useUsers(searchRef)

    const suspendUser = useSuspendUser()
    const removeUser = useRemoveUser()

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
            header: "User",
            cell: ({ row }) => (
                <div className="capitalize">{row.original?.firstname + " " + row.original?.lastname}</div>
            ),
        },
        {
            accessorKey: "username",
            header: "Username",
            cell: ({ row }) => (
                <div>@{row.getValue("username")}</div>
            ),
        },

        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("email")}</div>
            ),
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive")
                const isSuspended = row.original?.isSuspended

                let status = isSuspended ? "suspended" : isActive ? 'Active' : 'Deactivated'
                return <div className="capitalize">{status}</div>
            }

        },


        {
            accessorKey: "createdAt",
            header: "Acount Creation Date",
            cell: ({ row }) => (
                <div className="capitalize">{format(row.getValue("createdAt"), 'MMM d, yyy h:mm a')}</div>
            ),


        },

        {
            id: "actions",
            header: "Action",
            enableHiding: false,
            cell: ({row}) => {
                const isSuspended = row.original?.isSuspended
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className='p-2 bg-card cursor-pointer hover:bg-accent px-4 border border-accent'  onClick={() => {
                                let userId = row.original?._id
                                suspendUser.mutate({ userId })
                            }}>{isSuspended ? "Activate" : "Suspend"}</DropdownMenuItem>
                            <DropdownMenuItem className='p-2 bg-card cursor-pointer hover:bg-accent px-4 border border-accent' onClick={() => {
                                let userId = row.original?._id
                                removeUser.mutate({ userId })
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


    const [userModelState, setUserModelState] = useState(false)
    const [userIndex, setUserIndex] = useState(-1)


    return (
        <main className="w-full overflow-auto px-8 py-4">
            {userModelState && userIndex >= 0 && <UserModel user={data[userIndex]} setUserModelState={setUserModelState} />}
            <AdminDataTable  filterValue={"username"} setModelState={setUserModelState} setItemIndex={setUserIndex} title={"Users"} filter={true} columns={columns} data={isSuccess && data} handleSearchChange={handleSearchChange} fetchNextPage={_fetchNextPage} />
        </main>
    )
}

export default React.memo(UsersSection)