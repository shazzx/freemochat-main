import { AdminDataTable } from '@/components/TestDataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { format } from 'date-fns'
import { usePosts, useRemovePost } from '@/hooks/Admin/usePost'



function PostsSection() {
    const searchRef = useRef()
    const [search, setSearch] = useState()
    const queryClient = useQueryClient()

    let { data, isSuccess, fetchNextPage, isFetchingNextPage } = usePosts(searchRef)
    console.log(data)

    const removePost = useRemovePost()


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
            accessorKey: "_id",
            header: "Post",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("_id")}</div>
            ),
        },

        {
            header: "Posted By",
            cell: ({ row }) => (
                <div>@{row.original.target[0]?.username || row.original.target[0]?.username}</div>
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                                let postId = data.row.original?._id
                                let media = data.row.original?.media
                                console.log(media, postId)
                                removePost.mutate({ postId, media })
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
        queryClient.invalidateQueries({ queryKey: ["usersPostsAdmin"] });
    }, [search])

    return (
        <main className="w-full overflow-auto px-8 py-4">
            <AdminDataTable title={"Users"} filter={true} columns={columns} data={isSuccess && data} handleSearchChange={handleSearchChange} fetchNextPage={_fetchNextPage} />
        </main>
    )
}

export default React.memo(PostsSection)