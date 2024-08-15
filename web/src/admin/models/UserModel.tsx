import Cover from "@/components/profile/Cover"
import Profile from "@/components/profile/Profile"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@radix-ui/react-dropdown-menu"
import { FC } from "react"

const UserModel: FC<any> = ({ user, setUserModelState }) => {
    const { firstname, lastname, username, email, address, profile, cover, bio, phone } = user

    return (
        <div className='absolute top-0 right-0 w-screen z-50 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 opacity-15  bg-black w-full h-full' onClick={() => {
                setUserModelState(false)
            }}></div>
            <div className='z-10 max-w-[720px] w-full bg-background rounded-lg h-full overflow-auto'>
                <div className="grid gap-8 p-1  overflow-y-auto relative">
                    <div className="flex flex-col items-center justify-center relative">
                        <div className='relative w-full max-h-64 roundd-md  overflow-hidden'>
                            <Cover cover={cover} />
                        </div>
                        <div className='absolute -bottom-16 overflow-hidden'>
                            <Profile image={profile} fallbackName={user && firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()} width={'w-28'} smWidth={'w-32'} height={'h-28'} smHeight={'h-32'} />
                        </div>
                    </div>
                    <div className="w-full p-4 flex flex-col gap-8 items-center">
                        <div className="flex flex-col w-full justify-center gap-2 mt-10">
                            <h2>Account Details</h2>
                            <div className="w-full flex gap-4">
                                <div className="w-full">
                                    <Label >
                                        Firstname
                                    </Label>
                                    <Input
                                        readOnly={true}

                                        name="firstname"
                                        placeholder="Enter your firstname"
                                        id="firstname"
                                        defaultValue={firstname}
                                        className="max-w-96 w-full"
                                    />
                                </div>
                                <div className="w-full">
                                    <Label >
                                        Lastname
                                    </Label>
                                    <Input
                                        readOnly={true}
                                        name="lastname"
                                        placeholder="Enter your lastname"
                                        id="lastname"
                                        defaultValue={lastname}
                                        className="max-w-96 w-full"
                                    />
                                </div>

                            </div>


                            <div className="w-full">
                                <div className="w-full">
                                    <Label >
                                        Bio
                                    </Label>
                                    <Textarea
                                        readOnly={true}
                                        name="bio"
                                        placeholder="Enter your bio"
                                        id="bio"
                                        defaultValue={bio}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="w-full">
                                    <Label >
                                        Username
                                    </Label>
                                    <Input
                                        readOnly={true}
                                        name="username"
                                        placeholder="Enter your username"
                                        id="username"
                                        defaultValue={username}
                                        className="max-w-96 w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col w-full">
                                <div className="flex gap-4 w-full">
                                    <div className="w-full">
                                        <Label >
                                            Country
                                        </Label>
                                        <Input
                                            readOnly={true}
                                            name="country"
                                            placeholder="Enter your country name"
                                            id="country"
                                            defaultValue={address?.country}
                                            className="max-w-96 w-full"
                                        />
                                    </div>
                                    <div className="w-full">
                                        <Label >
                                            City
                                        </Label>
                                        <Input
                                            readOnly={true}
                                            name="city"
                                            placeholder="Enter your city name"
                                            id="city"
                                            defaultValue={address?.city}
                                            className="max-w-96 w-full"
                                        />
                                    </div>
                                </div>
                                <div className="w-full">
                                    <div className="w-full">
                                        <Label >
                                            Area
                                        </Label>
                                        <Input
                                            readOnly={true}
                                            name="area"
                                            placeholder="Enter your area name"
                                            id="area"
                                            defaultValue={address?.area}
                                            className="max-w-96 w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 w-full">
                                <div className="w-full">
                                    <Label >
                                        Email
                                    </Label>
                                    <Input
                                        readOnly={true}
                                        name="email"
                                        placeholder="Enter your email"
                                        id="email"
                                        defaultValue={email}
                                        className="max-w-96 w-full"
                                    />
                                </div>
                                <div className="w-full">
                                    <Label >
                                        Phone
                                    </Label>
                                    <Input
                                        readOnly={true}
                                        name="phone"
                                        placeholder="Enter your phone number"
                                        id="phone"
                                        defaultValue={phone}
                                        className="max-w-96 w-full"
                                    />
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserModel