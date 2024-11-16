import { SimpleCard } from '@/components/Card'
import { AdminDataTable } from '@/components/TestDataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import React, { useState } from 'react'
import { useCampaigns, useCampaignsActivationToggle } from '@/hooks/Campaigns/useCampaigns'


function CampaignsSection() {
  const [campaignsData, setCampaignsData] = useState(null)
  console.log(setCampaignsData)
  const { mutate } = useCampaignsActivationToggle()
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
      header: "Post",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("postId")}</div>
      ),
    },
    {
      accessorKey: "reach",
      header: "Reach",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("reach") || 0}</div>
      ),
    },
    {
      accessorKey: "active",
      header: "State",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("active") ? "active" : "disabled"}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Creation Date",
      cell: ({ row }) => {
        return <div className="capitalize">{format(row.getValue("createdAt") ?? Date.now(), 'MMM d, yyy h:mm a')}</div>
      },
    },
    {
      accessorKey: "paymentDetails",
      header: () => <div className="text-right">Total Cost</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("paymentDetails").totalAmount)

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
      cell: ({ row }) => {
        let isActive = row.getValue("active")
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 bg-background cursor-pointer rounded-md" align="end">
              <DropdownMenuItem onClick={async () => {
                console.log(row)
                let postId = row.getValue("postId")
                mutate({ postId, index: row.row.index })
              }} >{isActive ? "Disable" : "Activate"}</DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>


        )
      },
    },
  ]
  const [reverse, setReverse] = useState(false)

  const { data, refetch, isLoading } = useCampaigns(reverse)
  console.log(data)


  return (
    <main className="w-full px-8 py-4 overflow-y-scroll">
      <div className="campaign_cards-container" >
        <div className='campaign_cards'>
          <SimpleCard title={'Total Campaigns'} content={!isLoading && data[0].promotionsData?.totalCampaigns || 0} />
          <SimpleCard title={'Active Campaigns'} content={!isLoading && data[0].promotionsData?.activeCampaigns || 0} />

        </div>
        <div className='campaign_cards'>
          <SimpleCard title={'Total Reach'} content={!isLoading && data[0]?.promotionsData?.totalReach || 0} />
          <SimpleCard title={'Total Cost'} content={!isLoading && data[0]?.promotionsData?.totalCost ? !isLoading && data[0]?.promotionsData?.totalCost + " USD" : 0 + " USD"} />
        </div>


      </div>
      <AdminDataTable title={"Campaigns"} filter={true} setReverse={setReverse} refetch={refetch} reverse={reverse} columns={columns} data={!isLoading && data[0]?.promotions || []} isLoading={isLoading} />
    </main>
  )
}

export default React.memo(CampaignsSection)