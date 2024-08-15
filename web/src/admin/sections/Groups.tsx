import { AdminDataTable } from '@/components/TestDataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { useGroups, useRemoveGroup } from '@/hooks/Admin/useGroup'
import { useChatGroups, useRemoveChatGroup } from '@/hooks/Admin/useChatGroup'
import { format } from 'date-fns'

function GroupsSection() {
    const searchRef = useRef()
    const [search, setSearch] = useState()
    const queryClient = useQueryClient()
    const [activeGroup, setActiveGroup] = useState<string>('community')

    const removeGroup = useRemoveGroup()
    const removeChatGroup = useRemoveChatGroup()

    const groupColumns = [
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
            header: "Name",
            cell: ({ row }) => (
                <div className="capitalize">{row.original?.name}</div>
            ),
        },
        {
            header: "Username",
            cell: ({ row }) => (
                <div>@{row.original.user[0].username}</div>
            ),
        },

        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("createdAt")  ? format(row.getValue("createdAt"), 'MMM d, yyy h:mm a'): null}</div>
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
                            <DropdownMenuItem className='p-2 bg-card cursor-pointer hover:bg-accent px-4 border border-accent' onClick={() => {
                                let groupId = data.row.original?._id
                                removeGroup.mutate({ groupId })
                            }}>Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const chatGroupColumns = [
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
            header: "Chat Group",
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
            accessorKey: "createdAt",
            header: "Created At",
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
                            <DropdownMenuItem className='p-2 bg-card cursor-pointer hover:bg-accent px-4 border border-accent' onClick={() => {
                                let groupId = data.row.original?._id
                                removeChatGroup.mutate({ groupId })
                            }}>Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const { data, isSuccess } = useGroups('')

    if (isSuccess) {
        console.log(data, isSuccess)
    }



    const debouncedSearch = debounce((value) => {
        setSearch(value)
    }, 300);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, []);


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    const _fetchNextPage = (fetchNextPage) => {
        if(fetchNextPage){
            fetchNextPage()
        }
    }

    useEffect(() => {
        searchRef.current = search
        queryClient.invalidateQueries({ queryKey: ["usersPostsAdmin"] });
    }, [search])


    return (
        <main className="w-full px-8 py-4 overflow-y-scroll">
            <Tabs defaultValue="community" className="w-full  h-full">
                <TabsList className="flex gap-2 w-56 grid-cols-2">
                    <TabsTrigger
                        onClick={() => {
                            if (activeGroup !== "community") {
                                setActiveGroup("community")
                            }
                        }} className={`${activeGroup == "community" && "bg-primary text-white"} rounded-md py-2 px-4 border-[1px] border-muted`} value="community">Community</TabsTrigger>

                    <TabsTrigger
                        onClick={() => {
                            if (activeGroup !== "chat") {
                                setActiveGroup("chat")
                            }
                        }}
                        className={`${activeGroup == "chat" && "bg-primary text-white"} rounded-md py-2 px-4 border-[1px] border-muted`} value="chat">Chat</TabsTrigger>
                </TabsList>
                <TabsContent value="community" className="h-full">
                    <AdminDataTable title={"Groups"} filter={true} columns={groupColumns} handleSearchChange={handleSearchChange} fetchNextPage={_fetchNextPage} useGroups={useGroups} search={search} />

                </TabsContent>
                <TabsContent value="chat" className="h-full">
                    <AdminDataTable title={"Chat Groups"} filter={true} columns={chatGroupColumns} handleSearchChange={handleSearchChange} fetchNextPage={_fetchNextPage} useGroups={useChatGroups} />
                </TabsContent>
            </Tabs>
        </main>
    )
}

export default GroupsSection