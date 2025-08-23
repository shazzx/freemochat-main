// @ts-ignore

import { BellRing, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { axiosClient } from "@/api/axiosClient"
import { Link } from "react-router-dom"
import { domain } from "@/config/domain"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { useAppSelector } from "@/app/hooks"
import { useReadAllUserNotifications, useReadUserNotification, useUserDefaultMetric } from "@/hooks/User/useUser"
import { format } from "date-fns"

const getTarget = (targetType, targetId, handle, type) => {
    if (targetType == 'page') {

        let url = `${domain}/page/${handle}`
        return url
    }
    if (targetType == "group") {
        let url = `${domain}/group/${handle}`
        return url
    }

    if (type == 'post' || type == 'comment' || type == 'reply') {
        let url = `${domain}/post/${targetId}?type=${targetType}`
        return url
    }
}

export function Notifications({ setNotificationsState }) {
    const [notifications, setNotifications] = useState([])
    const { notification } = useAppSelector((state) => state.notification)
    const defaultMetric = useUserDefaultMetric()
    const readAllUserNotifications = useReadAllUserNotifications()
    const readUserNotification = useReadUserNotification()


    useEffect(() => {
        const getNotifications = async () => {
            const { data } = await axiosClient.get("notification")
            setNotifications(data?.notifications)
        }
        getNotifications()
    }, [notification])
    return (
        <div className="absolute top-0 right-0 h-full w-screen z-40">
            <div className="absolute top-0 right-0 h-screen w-screen z-10" onClick={() => {
                setNotificationsState(false)
            }}></div>
            <Card className=" p-1 w-full h-full md:w-[360px] bg-background md:h-[400px] absolute top-14 md:top-9 z-50 md:right-12 sm:border-2 sm:border-accent overflow-auto">
                <CardHeader className="p-4">
                    <div className="flex gap-2 items-center">
                        <CardTitle>Notifications </CardTitle>
                        <BellRing size={26} />
                    </div>
                    {notifications?.length > 0 &&
                        <div className="flex gap-2 items-center">
                            <Button onClick={() => {
                                readAllUserNotifications.mutate()
                            }}>Mark as Read</Button>
                        </div>
                    }
                    {/* <CardDescription>{notifications?.length > 0 ? "You have " + notifications?.length + " unread messages." : " You have no notifications"} </CardDescription> */}
                </CardHeader>
                <CardContent className="grid gap-4 p-1 ">
                    <div className="flex flex-col gap-1">
                        {notifications && notifications.length == 0 &&
                            <div className="text-center">No Notifications</div>
                        }
                        {notifications && notifications?.map((notification, index) => {
                            if (notification?.value) {
                                return (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex gap-2 p-2 hover:bg-accent rounded-md cursor-pointer active:bg-muted relative",
                                            !notification?.isRead && "bg-muted border-l-4 border-l-blue-500"
                                        )}
                                        onClick={() => {
                                            if (!notification?.isRead) {
                                                readUserNotification.mutate(notification?._id as string);
                                            }

                                        }}
                                    >
                                        <div className='w-14 h-14 flex flex-col items-center justify-center rounded-lg border-primary border-2 bg-card overflow-hidden'>
                                            {notification?.sender ? <Link onClick={() => setNotificationsState(false)} to={domain + "/user/" + notification?.sender?.username}>

                                                <Avatar>
                                                    <AvatarImage src={notification?.sender?.profile} alt="Avatar" />
                                                    <AvatarFallback className='text-xl'>{notification?.sender?.firstname[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link> :
                                                <Avatar>
                                                    <AvatarFallback className='text-xl'>{'S'}</AvatarFallback>
                                                </Avatar>
                                            }
                                        </div>
                                        <div className="max-w-[80%] space-y-1 flex  justify-center flex-col">
                                            {notification?.sender ? < Link onClick={() => setNotificationsState(false)} to={domain + "/user/" + notification?.sender?.username}>
                                                <p className="text-md flex gap-2 font-medium leading-none">
                                                    {notification?.sender?.firstname + " " + notification?.sender?.lastname}
                                                    <span className="text-sm">({notification?.sender?.username})</span>
                                                </p>
                                            </Link>
                                                :
                                                <p className="text-md flex gap-2 font-medium leading-none">
                                                    {"System"}
                                                </p>

                                            }
                                            {notification?.sender ? <Link onClick={() => setNotificationsState(false)} to={getTarget(notification.targetType, notification.targetId, notification?.handle, notification.type)}>
                                                <p className="text-sm text-wrap text-muted-foreground">
                                                    {notification?.value}
                                                </p>
                                            </Link>
                                                :
                                                <p className="text-sm text-wrap text-muted-foreground">
                                                    {notification?.value}
                                                </p>
                                            }

                                        </div>
                                        
                                        {/* Unread indicator dot */}
                                        {!notification?.isRead && (
                                            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>)
                            }

                        })}
                    </div>
                </CardContent>
            </Card>
        </div >

    )
}