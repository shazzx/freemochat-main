// @ts-ignore
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileSettings() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you're done.
                    </DialogDescription>


                </DialogHeader>
                <div className="grid gap-8 p-4 relative">
                    {/* top */}
                    <div className="flex flex-col items-center justify-center relative">
                        <div className='w-full max-h-72 roundd-md  overflow-hidden'>
                            <img className='w-full' src="https://images.pexels.com/photos/18709052/pexels-photo-18709052/free-photo-of-free-palestine-rally.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
                        </div>
                        <div className='w-28 h-28 rounded-xl absolute -bottom-16 border-primary border-2 overflow-hidden'>
                            <img className='w-full' src="https://images.pexels.com/photos/7129744/pexels-photo-7129744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-10">
                        <h2>Account Details</h2>
                        <div className="flex  gap-2">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="firstname" className="text-right">
                                    Firstname
                                </Label>
                                <Input
                                    id="firstname"
                                    defaultValue="Pedro Duarte"
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="lastname" className="text-right">
                                    Lastname
                                </Label>
                                <Input
                                    id="lastname"
                                    defaultValue="@peduarte"
                                    className="col-span-3"
                                />
                            </div>

                        </div>

                        <div className="flex">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="text-right">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    defaultValue="@peduarte"
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <div className="flex">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="country" className="text-right">
                                    Country
                                </Label>
                                <Input
                                    id="country"
                                    defaultValue="Pedro Duarte"
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="city" className="text-right">
                                    City
                                </Label>
                                <Input
                                    id="city"
                                    defaultValue="@peduarte"
                                    className="col-span-3"
                                />
                            </div>

                        </div>

                        <div className="flex">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    defaultValue="Pedro Duarte"
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">
                                    Phone
                                </Label>
                                <Input
                                    id="phone"
                                    defaultValue="@peduarte"
                                    className="col-span-3"
                                />
                            </div>

                        </div>


                    </div>
                    <div className="flex flex-col gap-2">
                        <h2>Privacy</h2>
                        <div className="flex gap-2">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="current-password" className="text-right">
                                    Current Password
                                </Label>
                                <Input
                                    type="password"
                                    id="current-password"
                                    defaultValue="Pedro Duarte"
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-password" className="text-right">
                                    New Password
                                </Label>
                                <Input
                                    type="password"
                                    id="new-password"
                                    defaultValue="@peduarte"
                                    className="col-span-3"
                                />
                            </div>

                        </div>
                    </div>

                </div>
                <DialogFooter>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
