import * as React from "react"
import { useState } from 'react'
import {
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import CreatePageModel from "@/models/pages/CreatePageModel"
import { Link } from "react-router-dom"
import { useCreatePage, usePages, useRemovePage, useUpdatePage } from "@/hooks/Post/usePage"
import { toast } from "react-toastify"
import CreateGroupModel from "@/models/CreateGroupModal"


export type Page = {
    id: string
    page: string,
    followers: string,
    totalPosts: number,
    email: string,
    creationDate: string,
}

export function ManagePages() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [editModelState, setEditModelState] = useState(false)
    const [editPageIndex, setEditPageIndex] = useState(undefined)
    const [editPageDetails, setEditPageDetails] = useState(undefined)

    const { mutate } = useCreatePage()
    const removePageMutation = useRemovePage()
    const updatePageMutation = useUpdatePage()

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
            accessorKey: "handle",
            header: "Page Handle",
            cell: ({ row }) => (
                <div >{"@" + row.getValue("handle")}</div>
            ),
        },
        {
            accessorKey: "totalPosts",
            header: "Total Posts",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("totalPosts") || 1}</div>
            ),
        },

        {
            id: "actions",
            header: "Action",
            enableHiding: false,
            cell: (page) => {
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
                                setEditPageIndex(page.row.index)
                                setEditPageDetails(page.row.original)
                                setEditModelState(true)

                            }}>Edit</DropdownMenuItem>
                            <Link to={"/page/" + page.row.original.handle}><DropdownMenuItem>View</DropdownMenuItem></Link>
                            <DropdownMenuItem onClick={() => removePage(page)}>Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    let { data } = usePages()
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    // console.log(data)
    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    const [modelState, setModelState] = useState(false)

    const removePage = async (_data) => {
        // console.log(_data.row.original._id, _data.row.index, _data.row.original.images)
        if (_data.row.original._id == null || _data.row.original.isUploaded == false) {
            toast.info('please wait...')
            return
        }

        removePageMutation.mutate({ pageId: _data.row.original._id, pageIndex: _data.row.index, images: _data.row.original.images })
    }

    const createPage = async (pageDetails, imageUpload, coverImageUpload) => {
        let formData = new FormData()
        let images;
        if (imageUpload) {
            images = { profile: URL.createObjectURL(imageUpload) }
        }
        if (coverImageUpload) {
            images = { ...images, cover: URL.createObjectURL(coverImageUpload) }
        }
        imageUpload && formData.append("files", imageUpload, 'profile')
        coverImageUpload && formData.append("files", coverImageUpload, 'cover')
        formData.append("pageData", JSON.stringify({ pageDetails }))
        console.log(images)

        mutate({ pageDetails, formData, images })
        setModelState(false)
    }

    const editPage = async ({ pageDetails, imageUpload, coverImageUpload }) => {
        console.log(editPageDetails, 'editpagedetails')

        if (editPageDetails.isUploaded == false || updatePageMutation.isPending || !editPageDetails._id) {
            toast.info('please wait...')
            setEditModelState(false)
            return
        }

        let images;
        if (imageUpload) {
            images = { profile: URL.createObjectURL(imageUpload) }
        }
        if (coverImageUpload) {
            images = { ...images, cover: URL.createObjectURL(coverImageUpload) }
        }
        let formData = new FormData()
        imageUpload && formData.append("files", imageUpload, 'profile')
        coverImageUpload && formData.append("files", coverImageUpload, 'cover')
        const _pageDetails = { pageDetails: { ...pageDetails }, pageId: editPageDetails._id, images: editPageDetails.images }
        formData.append("pageData", JSON.stringify(_pageDetails))
        console.log(pageDetails)

        updatePageMutation.mutate({ updatedPageDetails: pageDetails, images, formData, pageDetails: { index: editPageIndex } })
        setEditModelState(false)
    }


    return (
        <main className="w-full px-8 py-4 overflow-y-scroll">
            {modelState && <CreatePageModel setModelTrigger={setModelState} createPage={createPage} />}
            {editModelState && <CreatePageModel setModelTrigger={setEditModelState} editState={true} pageDetails={editPageDetails} editPage={editPage} />}
            <Button type="button" onClick={() => {
                setModelState(true)
            }}>New Page</Button>
            <div className="w-ful">
                <div className="flex items-center py-4">
                    <h2 className="text-lg font-medium pr-2">Pages</h2>
                    <div className="flex-1 gap-1 flex justify-end">
                        {/* <form>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search..."
                                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        table.getColumn("name")?.setFilterValue(event.target.value)
                                    } className="w-full appearance-none bg-background pl-8 shadow-none"
                                />
                            </div>
                        </form> */}
                        <div className="flex gap-2 items-center py-4">
                            <Input
                                placeholder="Filter pages..."
                                value={table.getColumn("name")?.getFilterValue() as string}
                                onChange={(event) =>
                                    table.getColumn("name")?.setFilterValue(event.target.value)
                                }
                                className="max-w-sm"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="ml-auto">
                                        Columns
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {table
                                        .getAllColumns()
                                        .filter(
                                            (column) => column.getCanHide()
                                        )
                                        .map((column) => {
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    className="capitalize"
                                                    checked={column.getIsVisible()}
                                                    onCheckedChange={(value) =>
                                                        column.toggleVisibility(!!value)
                                                    }
                                                >
                                                    {column.id}
                                                </DropdownMenuCheckboxItem>
                                            )
                                        })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {/* <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-10 gap-1">
                                        <ListFilter className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                            Filter
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem checked>
                                        Active
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem>
                                        Example
                                    </DropdownMenuCheckboxItem>

                                    <DropdownMenuCheckboxItem>
                                        Example 2
                                    </DropdownMenuCheckboxItem>

                                </DropdownMenuContent>
                            </DropdownMenu> */}
                        </div>

                    </div>
                </div>
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length}
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div> */}
            </div>
        </main>

    )
}

export default ManagePages