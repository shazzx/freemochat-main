import { SimpleCard } from '@/components/Card'
import { AdminDataTable } from '@/components/TestDataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useDashboardData } from '@/hooks/Admin/useAdmin'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

const users: User[] = [
  {
    id: 'asdfewer',
    username: 'shazz',
    fullname: "shahzad ali",
    email: "shazz@gmail.com",
    accountStatus: "terminated" || "deactivated" || "active",
    accountCreationDate: "12 april 2024"
  },
  {
    id: 'asdfewer',
    username: 'shazz',
    fullname: "shahzad ali",
    email: "shazz@gmail.com",
    accountStatus: "terminated" || "deactivated" || "active",
    accountCreationDate: "12 april 2024"
  },
  {
    id: 'asdfewer',
    username: 'shazz',
    fullname: "shahzad ali",
    email: "shazz@gmail.com",
    accountStatus: "terminated" || "deactivated" || "active",
    accountCreationDate: "12 april 2024"
  },
]

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
    accessorKey: "username",
    header: "User",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("username")}</div>
    ),
  },
  {
    accessorKey: "fullname",
    header: "Full Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("fullname")}</div>
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
    accessorKey: "accountCreationDate",
    header: "Acount Creation Date",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("accountCreationDate")}</div>
    ),

  },

  {
    id: "actions",
    header: "Action",
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

function DashboardSection() {
  const { data, isSuccess, isError, isFetched } = useDashboardData()
  console.log(data)

  return (
    <main className="w-full px-8 py-4 overflow-y-scroll">
      <h4 className='text-sm'>testing data</h4>
      <div className="campaign_cards-container" >
        <div className='campaign_cards'>
          <SimpleCard title={'Total Users'} content={'15,242'} />
          <SimpleCard title={'Total Reports'} content={'1,231'} />

        </div>
        <div className='campaign_cards'>
          <SimpleCard title={'Total Campaigns'} content={'3,242'} />
          <SimpleCard title={'Total Revenue'} content={'7242$'} />

        </div>


      </div>
      <AdminDataTable title={"Recent Campaigns"} filter={false} columns={columns} data={users} />
      <AdminDataTable title={"Recent Reports"} filter={false} columns={columns} data={users} />
    </main>
  )
}

export default DashboardSection