import {
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MdGroup, MdNotifications } from 'react-icons/md'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import {
  Menu,
} from "lucide-react"

import { Link, useNavigate } from "react-router-dom"
import { ModeToggle } from "./Toggle"
import React, { useEffect, useState } from "react"

import { domain } from "@/config/domain"
import { Notifications } from "./Notifications"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import FriendRequests from "@/models/FriendRequests"
import profile from './../assets/logo.png'
import { useSocket } from "@/hooks/useSocket"
import AudioCallRecepient from "./Call/Audio/AudioCallRecepient"
import Agora from "./Call/agora/AgoraRTC"
import { endCall } from "@/app/features/user/callSlice"
import AudioCall from "./Call/Audio/AudioCall"
import VideoCall from "./Call/Video/VideoCall"
import { axiosClient } from "@/api/axiosClient"
import { toast } from "react-toastify"
import VideoCallAccepted from "./Call/Video/VideoCallAccepted"

const MainHome = ({ children }: any) => {
  useSocket()
  const { user } = useAppSelector((state) => state.user)
  const navigate = useNavigate()

  const [active, setActive] = useState(location.pathname)
  const [notificationsState, setNotificationsState] = useState(false)
  const [friendRequestState, setFriendRequestState] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dispatch = useAppDispatch()
  const { callDetails, callerState, onCall, recepientState, targetDetails, type } = useAppSelector((state) => state.call)
  const data = useAppSelector((state) => state.call)
  const { notification } = useAppSelector((state) => state.notification)
  console.log(callDetails, callerState, onCall, recepientState, targetDetails, type)

  let cancelCall = async (type) => {
    try {
      if (type == "AUDIO") {
        console.log('audio call end')

        // setAudioCallCallerState(false)
        // setAudioCallState("NEUTRAL")
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStream.getTracks().forEach(track => track.stop())
      } else {
        console.log('video call end')
        // setVideoCallCallerState(false)
        // setVideoCallState("NEUTRAL")
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        mediaStream.getTracks().forEach(track => track.stop())
      }
      dispatch(endCall())
      // setCallDetails(null)
    } catch (error) {
      console.log(error)
      dispatch(endCall())
      // location.reload()
    }
  }
  // const {viewedPosts} = useAppSelector((state) => state.viewedPosts)

  // useEffect(() => {
  //   if(viewedPosts.length > 0){
  //     let viewPost = async () => {
  //       const { data } = await axiosClient.post("/posts/view/bulk", {viewedPosts})
  //   }
  //     let timeout = setTimeout(() => {
  //       viewPost()
  //     }, 10000)
  //     return () => clearInterval(timeout)
  //   }
    
  // },[viewedPosts])
  return (

    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* incoming call */}
      {onCall && type == "Audio" && recepientState == "CALLING" && callDetails?.userDetails &&
        <AudioCallRecepient recepientDetails={callDetails.userDetails} />
      }


      {/* accepted call */}
      {onCall && (recepientState == "ACCEPTED" || callerState == "ACCEPTED") && callDetails?.type == "AUDIO" && callDetails?.channel &&
        <Agora callDetails={callDetails} channel={callDetails.channel} cancelCall={cancelCall} Call={AudioCall} />
      }

      {onCall && (recepientState == "CALLING" || callerState == "CALLING") && type == "Video" &&
        <Agora callDetails={callDetails} channel={''} Call={VideoCall} cancelCall={cancelCall} />
      }


{onCall && recepientState == "ACCEPTED" && type == "Video" &&
        <Agora callDetails={callDetails} channel={''} Call={VideoCallAccepted} cancelCall={cancelCall} />
      }
      {/* {onCall && (recepientState == "ACCEPTED" || (callerState == "ACCEPTED" || callerState == "CALLING")) && callDetails?.type == "VIDEO" && callDetails?.channel &&
        <Agora callDetails={callDetails} channel={callDetails.channel} cancelCall={cancelCall} Call={VideoCall} />
      } */}

      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              {/* small screen navigation bar */}

              <nav className="grid gap-2 text-sm font-base pt-4">
                <Link
                  to={domain + "/profile"}
                  onClick={() => {
                    if (active !== '/profile') {
                      setActive('/profile')
                    }
                  }}
                  className={`flex items-center gap-[14px] rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/profile" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}              >
                  <div className='w-7 h-7 rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                    <Avatar className="sm:flex">
                      <AvatarImage src={user?.profile} alt="Avatar" />
                      <AvatarFallback>{user?.firstname[0]?.toUpperCase() + user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  Profile
                </Link>

                <Link
                  onClick={() => {
                    if (active !== '/') {
                      setActive('/')
                    }
                  }}
                  to={domain}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}              >
                  <svg width="34" height="32" viewBox="0 0 39 38" className={`fill-foreground ${active == "feed" && "fill-white"}  dark:fill-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5206 17.9867C16.5441 16.3457 17.8895 15.0323 19.5306 15.0482C21.1717 15.0641 22.4914 16.4034 22.483 18.0446C22.4747 19.6858 21.1416 21.0116 19.5004 21.0109C17.8439 20.9952 16.5118 19.6433 16.5206 17.9867V17.9867Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M6.39653 14.3514C6.05988 14.5928 5.98261 15.0613 6.22394 15.3979C6.46526 15.7346 6.93381 15.8119 7.27046 15.5705L6.39653 14.3514ZM14.3432 9.57765L14.7802 10.1872L14.781 10.1866L14.3432 9.57765ZM24.6555 9.57765L24.2177 10.1866L24.2186 10.1873L24.6555 9.57765ZM31.7299 15.5706C32.0666 15.8119 32.5351 15.7346 32.7764 15.3979C33.0177 15.0612 32.9404 14.5927 32.6037 14.3514L31.7299 15.5706ZM10.5633 17.9867C10.5633 17.5725 10.2275 17.2367 9.81333 17.2367C9.39912 17.2367 9.06333 17.5725 9.06333 17.9867H10.5633ZM9.81333 24.0367L10.5633 24.0422V24.0367H9.81333ZM11.5409 28.2963L12.0752 27.7699L11.5409 28.2963ZM15.7746 30.0866L15.7691 30.8366H15.7746V30.0866ZM23.2257 30.0866V30.8366L23.2313 30.8365L23.2257 30.0866ZM27.4594 28.2963L27.9936 28.8227L27.4594 28.2963ZM29.187 24.0367H28.437L28.437 24.0422L29.187 24.0367ZM29.937 17.9867C29.937 17.5725 29.6012 17.2367 29.187 17.2367C28.7728 17.2367 28.437 17.5725 28.437 17.9867H29.937ZM7.27046 15.5705L14.7802 10.1872L13.9063 8.96809L6.39653 14.3514L7.27046 15.5705ZM14.781 10.1866C17.6002 8.16 21.3986 8.16 24.2177 10.1866L25.0933 8.96868C21.751 6.56598 17.2477 6.56598 13.9055 8.96868L14.781 10.1866ZM24.2186 10.1873L31.7299 15.5706L32.6037 14.3514L25.0924 8.96805L24.2186 10.1873ZM9.06333 17.9867V24.0367H10.5633V17.9867H9.06333ZM9.06335 24.0311C9.05007 25.8228 9.74912 27.5464 11.0067 28.8227L12.0752 27.7699C11.0968 26.777 10.553 25.4361 10.5633 24.0422L9.06335 24.0311ZM11.0067 28.8227C12.2643 30.099 13.9774 30.8234 15.7691 30.8365L15.7801 29.3366C14.3862 29.3263 13.0535 28.7628 12.0752 27.7699L11.0067 28.8227ZM15.7746 30.8366H23.2257V29.3366H15.7746V30.8366ZM23.2313 30.8365C25.023 30.8234 26.7361 30.099 27.9936 28.8227L26.9252 27.7699C25.9468 28.7628 24.6141 29.3263 23.2202 29.3366L23.2313 30.8365ZM27.9936 28.8227C29.2512 27.5464 29.9503 25.8228 29.937 24.0311L28.437 24.0422C28.4473 25.4361 27.9035 26.777 26.9252 27.7699L27.9936 28.8227ZM29.937 24.0367V17.9867H28.437V24.0367H29.937Z" />
                  </svg>
                  Feed
                </Link>

                <Link
                  onClick={() => {
                    setActive('/messages')
                  }}
                  to={domain + "/messages"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/messages" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}              >
                  <svg width="34" height="32" viewBox="0 0 39 38" className={
                    `fill-foreground ${active == "/messages" && "fill-white"}  dark:fill-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M31.417 14.2804C31.4317 14.6944 31.7792 15.018 32.1932 15.0033C32.6071 14.9885 32.9308 14.641 32.916 14.227L31.417 14.2804ZM25.3803 7.92039V8.67039C25.3887 8.67039 25.397 8.67025 25.4054 8.66998L25.3803 7.92039ZM15.2027 7.92039L15.1776 8.66998C15.186 8.67025 15.1943 8.67039 15.2027 8.67039V7.92039ZM7.66698 14.227C7.65224 14.641 7.97586 14.9885 8.38981 15.0033C8.80377 15.018 9.15129 14.6944 9.16603 14.2804L7.66698 14.227ZM32.9165 14.2537C32.9165 13.8395 32.5807 13.5037 32.1665 13.5037C31.7523 13.5037 31.4165 13.8395 31.4165 14.2537H32.9165ZM32.1665 23.7537L32.916 23.7804C32.9163 23.7715 32.9165 23.7626 32.9165 23.7537L32.1665 23.7537ZM25.3803 30.0871L25.4054 29.3375C25.397 29.3372 25.3887 29.3371 25.3803 29.3371L25.3803 30.0871ZM15.2027 30.0871V29.3371C15.1943 29.3371 15.186 29.3372 15.1776 29.3375L15.2027 30.0871ZM8.4165 23.7537H7.6665C7.6665 23.7626 7.66666 23.7715 7.66698 23.7804L8.4165 23.7537ZM9.1665 14.2537C9.1665 13.8395 8.83072 13.5037 8.4165 13.5037C8.00229 13.5037 7.6665 13.8395 7.6665 14.2537H9.1665ZM32.5448 14.9013C32.9025 14.6924 33.023 14.2331 32.8141 13.8754C32.6052 13.5178 32.1459 13.3972 31.7882 13.6061L32.5448 14.9013ZM23.8318 19.1225L23.4535 18.4748L23.4473 18.4786L23.8318 19.1225ZM16.7512 19.1225L17.1357 18.4785L17.1295 18.4749L16.7512 19.1225ZM8.7948 13.6061C8.43714 13.3972 7.97783 13.5178 7.7689 13.8754C7.55997 14.2331 7.68054 14.6924 8.0382 14.9013L8.7948 13.6061ZM32.916 14.227C32.7724 10.1927 29.39 7.03596 25.3553 7.17081L25.4054 8.66998C28.6134 8.56275 31.3028 11.0727 31.417 14.2804L32.916 14.227ZM25.3803 7.17039H15.2027V8.67039H25.3803V7.17039ZM15.2277 7.17081C11.193 7.03596 7.81064 10.1927 7.66698 14.227L9.16603 14.2804C9.28025 11.0727 11.9696 8.56275 15.1776 8.66998L15.2277 7.17081ZM31.4165 14.2537V23.7537H32.9165V14.2537H31.4165ZM31.417 23.727C31.3028 26.9348 28.6134 29.4447 25.4054 29.3375L25.3553 30.8366C29.39 30.9715 32.7724 27.8148 32.916 23.7804L31.417 23.727ZM25.3803 29.3371H15.2027V30.8371H25.3803V29.3371ZM15.1776 29.3375C11.9696 29.4447 9.28025 26.9348 9.16603 23.727L7.66698 23.7804C7.81064 27.8148 11.193 30.9715 15.2277 30.8366L15.1776 29.3375ZM9.1665 23.7537V14.2537H7.6665V23.7537H9.1665ZM31.7882 13.6061L23.4535 18.4749L24.2101 19.7701L32.5448 14.9013L31.7882 13.6061ZM23.4473 18.4786C21.5036 19.6394 19.0795 19.6394 17.1357 18.4786L16.3666 19.7664C18.7841 21.2101 21.7989 21.2101 24.2164 19.7664L23.4473 18.4786ZM17.1295 18.4749L8.7948 13.6061L8.0382 14.9013L16.3729 19.7701L17.1295 18.4749Z" />
                  </svg>
                  Messages
                  {/* <Badge className="ml-auto flex h-6 w-6 shrink-0 bg-primary dark:bg-backgruond items-center justify-center rounded-full">
                    6
                  </Badge> */}
                </Link>
                <Link
                  onClick={() => {
                    setActive('/groups')
                  }}
                  to={domain + "/groups"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/groups" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}
                >
                  <svg width="34" height="32" viewBox="0 0 39 38" className={`stroke-foreground ${active == "/groups" && "stroke-white"} dark:stroke-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M19.4996 11.6106C19.4996 13.6507 17.8458 15.3045 15.8057 15.3045C13.7656 15.3045 12.1118 13.6507 12.1118 11.6106C12.1118 9.57048 13.7656 7.91666 15.8057 7.91666C17.8458 7.91666 19.4996 9.57048 19.4996 11.6106Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M23.1938 24.9105C23.1938 27.7605 19.8862 30.0833 15.8043 30.0833C11.7225 30.0833 8.4165 27.7669 8.4165 24.9105C8.4165 22.0542 11.7241 19.7394 15.8059 19.7394C19.8878 19.7394 23.1938 22.0542 23.1938 24.9105Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M27.3201 15.0591C27.3201 16.2833 26.3276 17.2758 25.1034 17.2758C23.8792 17.2758 22.8867 16.2833 22.8867 15.0591C22.8867 13.8349 23.8792 12.8424 25.1034 12.8424C25.6913 12.8424 26.2551 13.076 26.6708 13.4917C27.0865 13.9074 27.3201 14.4712 27.3201 15.0591Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M26.1499 28.606C28.3883 28.7898 30.361 27.1455 30.5832 24.9105C30.3602 22.6762 28.3878 21.0328 26.1499 21.2166" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                  Groups
                </Link>
                <Link
                  onClick={() => {
                    setActive('/pages')
                  }}
                  to={domain + "/pages"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/pages" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}
                >
                  <svg width="34" height="32" viewBox="0 0 39 38" className={`fill-foreground  ${active == "/pages" && "fill-white"} dark:fill-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.333 10.9599C11.333 10.5457 10.9972 10.2099 10.583 10.2099C10.1688 10.2099 9.83297 10.5457 9.83297 10.9599H11.333ZM10.583 24.3612H9.83295L9.83298 24.3659L10.583 24.3612ZM11.1914 25.8024L10.6649 26.3366H10.6649L11.1914 25.8024ZM12.6413 26.3895V25.6395L12.6349 25.6395L12.6413 26.3895ZM28.5253 26.3895L28.5317 25.6395H28.5253V26.3895ZM29.9752 25.8024L30.5017 26.3366V26.3366L29.9752 25.8024ZM30.5836 24.3612L31.3336 24.3659V24.3612H30.5836ZM30.5836 12.9834H31.3336L31.3336 12.9788L30.5836 12.9834ZM29.9752 11.5423L29.4488 12.0765L29.9752 11.5423ZM28.5253 10.9551V11.7052L28.5317 11.7051L28.5253 10.9551ZM21.2546 10.2051C20.8404 10.2051 20.5046 10.5409 20.5046 10.9551C20.5046 11.3694 20.8404 11.7051 21.2546 11.7051V10.2051ZM9.83455 10.9551C9.83455 11.3694 10.1703 11.7051 10.5845 11.7051C10.9988 11.7051 11.3345 11.3694 11.3345 10.9551H9.83455ZM10.5845 9.94498L9.83455 9.94034V9.94498H10.5845ZM11.1913 8.50553L11.7183 9.03914V9.03914L11.1913 8.50553ZM12.6381 7.91673L12.6335 8.66673H12.6381V7.91673ZM19.1995 7.91673V8.66676L19.2059 8.6667L19.1995 7.91673ZM20.6494 8.50384L21.1758 7.96962L21.1758 7.96962L20.6494 8.50384ZM21.2578 9.94498H22.0078L22.0078 9.94035L21.2578 9.94498ZM20.5078 10.9599C20.5078 11.3741 20.8436 11.7099 21.2578 11.7099C21.672 11.7099 22.0078 11.3741 22.0078 10.9599H20.5078ZM10.5877 10.2099C10.1735 10.2099 9.83772 10.5457 9.83772 10.9599C9.83772 11.3741 10.1735 11.7099 10.5877 11.7099V10.2099ZM21.2546 11.7099C21.6688 11.7099 22.0046 11.3741 22.0046 10.9599C22.0046 10.5457 21.6688 10.2099 21.2546 10.2099V11.7099ZM27.5843 26.3895C27.5843 25.9753 27.2485 25.6395 26.8343 25.6395C26.4201 25.6395 26.0843 25.9753 26.0843 26.3895H27.5843ZM26.8343 27.9728H26.0842L26.0844 27.9837L26.8343 27.9728ZM26.2446 29.4545L26.7819 29.9777H26.7819L26.2446 29.4545ZM24.7791 30.0834V30.8335L24.7882 30.8333L24.7791 30.0834ZM8.89197 30.0834L8.88402 30.8334H8.89197V30.0834ZM7.42672 29.4578L6.89058 29.9823H6.89058L7.42672 29.4578ZM6.83363 27.9791L7.58363 27.9878V27.9791H6.83363ZM6.83363 16.1786H7.58368L7.58358 16.17L6.83363 16.1786ZM7.42672 14.6999L6.89058 14.1754H6.89058L7.42672 14.6999ZM8.89197 14.0743V13.3243L8.88403 13.3244L8.89197 14.0743ZM10.583 14.8243C10.9972 14.8243 11.333 14.4885 11.333 14.0743C11.333 13.6601 10.9972 13.3243 10.583 13.3243V14.8243ZM9.83297 10.9599V24.3612H11.333V10.9599H9.83297ZM9.83298 24.3659C9.83755 25.1072 10.1369 25.8162 10.6649 26.3366L11.7178 25.2682C11.4735 25.0275 11.3351 24.6995 11.333 24.3566L9.83298 24.3659ZM10.6649 26.3366C11.193 26.8569 11.9064 27.1458 12.6477 27.1395L12.6349 25.6395C12.292 25.6424 11.962 25.5088 11.7178 25.2682L10.6649 26.3366ZM12.6413 27.1395H28.5253V25.6395H12.6413V27.1395ZM28.5189 27.1395C29.2602 27.1458 29.9736 26.8569 30.5017 26.3366L29.4488 25.2682C29.2046 25.5088 28.8746 25.6424 28.5317 25.6395L28.5189 27.1395ZM30.5017 26.3366C31.0297 25.8162 31.329 25.1072 31.3336 24.3659L29.8336 24.3566C29.8315 24.6995 29.6931 25.0275 29.4488 25.2682L30.5017 26.3366ZM31.3336 24.3612V12.9834H29.8336V24.3612H31.3336ZM31.3336 12.9788C31.329 12.2374 31.0297 11.5284 30.5017 11.008L29.4488 12.0765C29.6931 12.3172 29.8315 12.6451 29.8336 12.988L31.3336 12.9788ZM30.5017 11.008C29.9736 10.4877 29.2602 10.1988 28.5189 10.2052L28.5317 11.7051C28.8746 11.7022 29.2046 11.8358 29.4488 12.0765L30.5017 11.008ZM28.5253 10.2051H21.2546V11.7051H28.5253V10.2051ZM11.3345 10.9551V9.94498H9.83455V10.9551H11.3345ZM11.3345 9.94962C11.3367 9.60725 11.4747 9.27974 11.7183 9.03914L10.6642 7.97192C10.1376 8.49208 9.83914 9.20014 9.83456 9.94034L11.3345 9.94962ZM11.7183 9.03914C11.9619 8.79855 12.2911 8.66459 12.6335 8.66672L12.6428 7.16675C11.9026 7.16214 11.1909 7.45177 10.6642 7.97192L11.7183 9.03914ZM12.6381 8.66673H19.1995V7.16673H12.6381V8.66673ZM19.2059 8.6667C19.5488 8.66377 19.8787 8.79738 20.123 9.03806L21.1758 7.96962C20.6478 7.44928 19.9344 7.16042 19.1931 7.16676L19.2059 8.6667ZM20.123 9.03806C20.3672 9.27874 20.5057 9.60671 20.5078 9.94961L22.0078 9.94035C22.0032 9.19902 21.7039 8.48996 21.1758 7.96962L20.123 9.03806ZM20.5078 9.94498V10.9599H22.0078V9.94498H20.5078ZM10.5877 11.7099H21.2546V10.2099H10.5877V11.7099ZM26.0843 26.3895V27.9728H27.5843V26.3895H26.0843ZM26.0844 27.9837C26.0895 28.3371 25.9538 28.678 25.7073 28.9313L26.7819 29.9777C27.3065 29.439 27.5951 28.7137 27.5842 27.9619L26.0844 27.9837ZM25.7073 28.9313C25.4607 29.1845 25.1235 29.3292 24.7701 29.3335L24.7882 30.8333C25.54 30.8243 26.2574 30.5164 26.7819 29.9777L25.7073 28.9313ZM24.7791 29.3334H8.89197V30.8334H24.7791V29.3334ZM8.89991 29.3334C8.54685 29.3297 8.20976 29.1858 7.96287 28.9334L6.89058 29.9823C7.41581 30.5192 8.13294 30.8254 8.88402 30.8334L8.89991 29.3334ZM7.96287 28.9334C7.71598 28.681 7.57953 28.3408 7.58358 27.9878L6.08368 27.9705C6.07507 28.7216 6.36534 29.4453 6.89058 29.9823L7.96287 28.9334ZM7.58363 27.9791V16.1786H6.08363V27.9791H7.58363ZM7.58358 16.17C7.57953 15.8169 7.71598 15.4767 7.96287 15.2243L6.89058 14.1754C6.36534 14.7124 6.07507 15.4361 6.08368 16.1872L7.58358 16.17ZM7.96287 15.2243C8.20976 14.9719 8.54685 14.828 8.89991 14.8243L8.88403 13.3244C8.13294 13.3323 7.41581 13.6385 6.89058 14.1754L7.96287 15.2243ZM8.89197 14.8243H10.583V13.3243H8.89197V14.8243Z" />
                  </svg>
                  Pages
                </Link>
                <Link
                  onClick={() => {
                    setActive('/bookmarked')
                  }}
                  to={domain + "/bookmarked"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/bookmarked" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}
                >
                  <svg width="34" height="32" viewBox="0 0 39 38" className={`stroke-foreground ${active == "/bookmarked" && "stroke-white"} dark:stroke-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M29.0112 31.4339V9.55384C29.0183 8.70684 28.6887 7.89169 28.0949 7.28772C27.501 6.68375 26.6915 6.34045 25.8445 6.33334H13.1778C12.3308 6.34045 11.5213 6.68375 10.9275 7.28772C10.3336 7.89169 10.004 8.70684 10.0112 9.55384V31.4339C9.93589 32.0657 10.2461 32.6811 10.7987 32.9965C11.3512 33.3118 12.0389 33.2657 12.5445 32.8795L18.5612 27.6846C19.1035 27.1951 19.9283 27.1951 20.4707 27.6846L26.4778 32.8811C26.9837 33.2676 27.6718 33.3136 28.2245 32.9978C28.7773 32.6821 29.0872 32.066 29.0112 31.4339Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                  Bookmarked
                </Link>
              </nav>
              <div className="mt-auto ">
                <Link
                  onClick={() => {
                    setActive('/campaigns')
                  }}
                  to={domain + "/campaigns"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/campaigns" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}
                >
                  <svg width="34" height="32" viewBox="0 0 38 38" className={`stroke-foreground ${active == "/campaigns" && "stroke-white"} dark:stroke-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M22.9613 19.0004C22.9613 20.7493 21.5435 22.1671 19.7946 22.1671C18.0457 22.1671 16.6279 20.7493 16.6279 19.0004C16.6279 17.2515 18.0457 15.8338 19.7946 15.8338C21.5435 15.8338 22.9613 17.2515 22.9613 19.0004Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12.2992 28.6588L8.31711 20.2877C7.78297 19.4602 7.78297 18.3966 8.31711 17.5691L12.2739 9.32944C12.8795 8.43037 13.899 7.89887 14.9829 7.91711H19.7947H24.6064C25.6903 7.89887 26.7099 8.43037 27.3155 9.32944L31.2644 17.5628C31.7985 18.3903 31.7985 19.4539 31.2644 20.2814L27.2902 28.6588C26.6849 29.5672 25.6583 30.1044 24.5669 30.0838H15.0209C13.9301 30.1038 12.9042 29.5667 12.2992 28.6588Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  Campaigns
                </Link>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center gap-3 md:gap-32 justify-between">
            <div className="hidden sm:block">
              <a href="#">
                {/* logo */}
                <h1 className="text-2xl font-bold "><img className="h-12" src={profile} alt="" /></h1>
              </a>
            </div>
            <div className="w-full flex-1">
              <form onSubmit={async (e) => {
                e.preventDefault()
                navigate(`/search?query=${searchQuery}&&type=default`)
              }}>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    onChange={async (e) => {
                      setSearchQuery(e.target.value)
                    }}
                    onKeyDown={async (e) => {
                      console.log(e.key)
                      if (e.key == "Enter") {
                        // const { data } = await axiosClient.get(`/search?query=${searchQuery}&&type=default`)
                        // console.log(data)
                        // dispatch(setSearch('no maza yes maza'))
                        // dispatch(setSearch(data))
                      }
                    }}
                    type="search"
                    placeholder="Search..."
                    className="max-w-2xl appearance-none bg-background pl-8 shadow-none"
                  />
                </div>
              </form>
            </div>
          </div>

          <div className="flex items-center gap-3 md:relative">
            <MdGroup size="24px" cursor="pointer" onClick={async () => {
              if (friendRequestState == false) {
                setFriendRequestState(true)
              }
            }} />
            {friendRequestState &&
              <FriendRequests setFriendRequestState={setFriendRequestState} />
            }
            <div className="relative">
              <MdNotifications onClick={() => {
                setNotificationsState(true)
              }} size="24px" cursor="pointer" />
              {notification && <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-red-500"></span>}
            </div>

            {notificationsState && <Notifications setNotificationsState={setNotificationsState} />}
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden sm:flex">
                <Button variant="secondary" size="icon" className="rounded-full">
                  <div className='flex w-9 h-9 items-center justify-center  rounded-full overflow-hidden'>
                    <Avatar className="sm:flex">
                      <AvatarImage src={user?.profile} alt="Avatar" />
                      <AvatarFallback>{user?.firstname[0]?.toUpperCase() + user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link to="/profile">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async() => {
                  let logout = await axiosClient.post("/user/logout")
                  if(logout){
                    navigate('/login')
                    location.reload()
                    return
                  }
                }}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </header>
      </div >
      <div className="flex h-full overflow-hidden w-full">

        {/* sidebar - desktop */}
        <div className="hidden border-r py-2 w-full max-w-72 h-full bg-card md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            {/* main navigation part - desktop */}
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link
                  to={domain + "/profile"}
                  onClick={() => {
                    if (active !== '/profile') {
                      setActive('/profile')
                    }
                  }}
                  className={`flex items-center gap-[14px] rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/profile" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}              >
                  <div className='w-9 h-9 rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                    <Avatar className="sm:flex">
                      <AvatarImage src={user?.profile} alt="Avatar" />
                      <AvatarFallback className="text-foreground" >{user?.firstname[0]?.toUpperCase() + user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  Profile
                </Link>

                <Link
                  onClick={() => {
                    if (active !== '/') {
                      setActive('/')
                    }
                  }}
                  to={domain}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}              >
                  <svg width="39" height="38" viewBox="0 0 39 38" className={`fill-foreground ${active == "/" && "fill-white"}  dark:fill-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5206 17.9867C16.5441 16.3457 17.8895 15.0323 19.5306 15.0482C21.1717 15.0641 22.4914 16.4034 22.483 18.0446C22.4747 19.6858 21.1416 21.0116 19.5004 21.0109C17.8439 20.9952 16.5118 19.6433 16.5206 17.9867V17.9867Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M6.39653 14.3514C6.05988 14.5928 5.98261 15.0613 6.22394 15.3979C6.46526 15.7346 6.93381 15.8119 7.27046 15.5705L6.39653 14.3514ZM14.3432 9.57765L14.7802 10.1872L14.781 10.1866L14.3432 9.57765ZM24.6555 9.57765L24.2177 10.1866L24.2186 10.1873L24.6555 9.57765ZM31.7299 15.5706C32.0666 15.8119 32.5351 15.7346 32.7764 15.3979C33.0177 15.0612 32.9404 14.5927 32.6037 14.3514L31.7299 15.5706ZM10.5633 17.9867C10.5633 17.5725 10.2275 17.2367 9.81333 17.2367C9.39912 17.2367 9.06333 17.5725 9.06333 17.9867H10.5633ZM9.81333 24.0367L10.5633 24.0422V24.0367H9.81333ZM11.5409 28.2963L12.0752 27.7699L11.5409 28.2963ZM15.7746 30.0866L15.7691 30.8366H15.7746V30.0866ZM23.2257 30.0866V30.8366L23.2313 30.8365L23.2257 30.0866ZM27.4594 28.2963L27.9936 28.8227L27.4594 28.2963ZM29.187 24.0367H28.437L28.437 24.0422L29.187 24.0367ZM29.937 17.9867C29.937 17.5725 29.6012 17.2367 29.187 17.2367C28.7728 17.2367 28.437 17.5725 28.437 17.9867H29.937ZM7.27046 15.5705L14.7802 10.1872L13.9063 8.96809L6.39653 14.3514L7.27046 15.5705ZM14.781 10.1866C17.6002 8.16 21.3986 8.16 24.2177 10.1866L25.0933 8.96868C21.751 6.56598 17.2477 6.56598 13.9055 8.96868L14.781 10.1866ZM24.2186 10.1873L31.7299 15.5706L32.6037 14.3514L25.0924 8.96805L24.2186 10.1873ZM9.06333 17.9867V24.0367H10.5633V17.9867H9.06333ZM9.06335 24.0311C9.05007 25.8228 9.74912 27.5464 11.0067 28.8227L12.0752 27.7699C11.0968 26.777 10.553 25.4361 10.5633 24.0422L9.06335 24.0311ZM11.0067 28.8227C12.2643 30.099 13.9774 30.8234 15.7691 30.8365L15.7801 29.3366C14.3862 29.3263 13.0535 28.7628 12.0752 27.7699L11.0067 28.8227ZM15.7746 30.8366H23.2257V29.3366H15.7746V30.8366ZM23.2313 30.8365C25.023 30.8234 26.7361 30.099 27.9936 28.8227L26.9252 27.7699C25.9468 28.7628 24.6141 29.3263 23.2202 29.3366L23.2313 30.8365ZM27.9936 28.8227C29.2512 27.5464 29.9503 25.8228 29.937 24.0311L28.437 24.0422C28.4473 25.4361 27.9035 26.777 26.9252 27.7699L27.9936 28.8227ZM29.937 24.0367V17.9867H28.437V24.0367H29.937Z" />
                  </svg>
                  Feed
                </Link>

                <Link
                  onClick={() => {
                    setActive('/messages')
                  }}
                  to={domain + "/messages"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/messages" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}              >
                  <svg width="39" height="38" viewBox="0 0 39 38" className={
                    `fill-foreground ${active == "/messages" && "fill-white"}  dark:fill-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M31.417 14.2804C31.4317 14.6944 31.7792 15.018 32.1932 15.0033C32.6071 14.9885 32.9308 14.641 32.916 14.227L31.417 14.2804ZM25.3803 7.92039V8.67039C25.3887 8.67039 25.397 8.67025 25.4054 8.66998L25.3803 7.92039ZM15.2027 7.92039L15.1776 8.66998C15.186 8.67025 15.1943 8.67039 15.2027 8.67039V7.92039ZM7.66698 14.227C7.65224 14.641 7.97586 14.9885 8.38981 15.0033C8.80377 15.018 9.15129 14.6944 9.16603 14.2804L7.66698 14.227ZM32.9165 14.2537C32.9165 13.8395 32.5807 13.5037 32.1665 13.5037C31.7523 13.5037 31.4165 13.8395 31.4165 14.2537H32.9165ZM32.1665 23.7537L32.916 23.7804C32.9163 23.7715 32.9165 23.7626 32.9165 23.7537L32.1665 23.7537ZM25.3803 30.0871L25.4054 29.3375C25.397 29.3372 25.3887 29.3371 25.3803 29.3371L25.3803 30.0871ZM15.2027 30.0871V29.3371C15.1943 29.3371 15.186 29.3372 15.1776 29.3375L15.2027 30.0871ZM8.4165 23.7537H7.6665C7.6665 23.7626 7.66666 23.7715 7.66698 23.7804L8.4165 23.7537ZM9.1665 14.2537C9.1665 13.8395 8.83072 13.5037 8.4165 13.5037C8.00229 13.5037 7.6665 13.8395 7.6665 14.2537H9.1665ZM32.5448 14.9013C32.9025 14.6924 33.023 14.2331 32.8141 13.8754C32.6052 13.5178 32.1459 13.3972 31.7882 13.6061L32.5448 14.9013ZM23.8318 19.1225L23.4535 18.4748L23.4473 18.4786L23.8318 19.1225ZM16.7512 19.1225L17.1357 18.4785L17.1295 18.4749L16.7512 19.1225ZM8.7948 13.6061C8.43714 13.3972 7.97783 13.5178 7.7689 13.8754C7.55997 14.2331 7.68054 14.6924 8.0382 14.9013L8.7948 13.6061ZM32.916 14.227C32.7724 10.1927 29.39 7.03596 25.3553 7.17081L25.4054 8.66998C28.6134 8.56275 31.3028 11.0727 31.417 14.2804L32.916 14.227ZM25.3803 7.17039H15.2027V8.67039H25.3803V7.17039ZM15.2277 7.17081C11.193 7.03596 7.81064 10.1927 7.66698 14.227L9.16603 14.2804C9.28025 11.0727 11.9696 8.56275 15.1776 8.66998L15.2277 7.17081ZM31.4165 14.2537V23.7537H32.9165V14.2537H31.4165ZM31.417 23.727C31.3028 26.9348 28.6134 29.4447 25.4054 29.3375L25.3553 30.8366C29.39 30.9715 32.7724 27.8148 32.916 23.7804L31.417 23.727ZM25.3803 29.3371H15.2027V30.8371H25.3803V29.3371ZM15.1776 29.3375C11.9696 29.4447 9.28025 26.9348 9.16603 23.727L7.66698 23.7804C7.81064 27.8148 11.193 30.9715 15.2277 30.8366L15.1776 29.3375ZM9.1665 23.7537V14.2537H7.6665V23.7537H9.1665ZM31.7882 13.6061L23.4535 18.4749L24.2101 19.7701L32.5448 14.9013L31.7882 13.6061ZM23.4473 18.4786C21.5036 19.6394 19.0795 19.6394 17.1357 18.4786L16.3666 19.7664C18.7841 21.2101 21.7989 21.2101 24.2164 19.7664L23.4473 18.4786ZM17.1295 18.4749L8.7948 13.6061L8.0382 14.9013L16.3729 19.7701L17.1295 18.4749Z" />
                  </svg>
                  Messages
                  {/* <Badge className="ml-auto flex h-6 w-6 shrink-0 bg-primary dark:bg-backgruond items-center justify-center rounded-full">
                    6
                  </Badge> */}
                </Link>
                <Link
                  onClick={() => {
                    setActive('/groups')
                  }}
                  to={domain + "/groups"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/groups" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}
                >
                  <svg width="39" height="38" viewBox="0 0 39 38" className={`stroke-foreground ${active == "/groups" && "stroke-white"} dark:stroke-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M19.4996 11.6106C19.4996 13.6507 17.8458 15.3045 15.8057 15.3045C13.7656 15.3045 12.1118 13.6507 12.1118 11.6106C12.1118 9.57048 13.7656 7.91666 15.8057 7.91666C17.8458 7.91666 19.4996 9.57048 19.4996 11.6106Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M23.1938 24.9105C23.1938 27.7605 19.8862 30.0833 15.8043 30.0833C11.7225 30.0833 8.4165 27.7669 8.4165 24.9105C8.4165 22.0542 11.7241 19.7394 15.8059 19.7394C19.8878 19.7394 23.1938 22.0542 23.1938 24.9105Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M27.3201 15.0591C27.3201 16.2833 26.3276 17.2758 25.1034 17.2758C23.8792 17.2758 22.8867 16.2833 22.8867 15.0591C22.8867 13.8349 23.8792 12.8424 25.1034 12.8424C25.6913 12.8424 26.2551 13.076 26.6708 13.4917C27.0865 13.9074 27.3201 14.4712 27.3201 15.0591Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M26.1499 28.606C28.3883 28.7898 30.361 27.1455 30.5832 24.9105C30.3602 22.6762 28.3878 21.0328 26.1499 21.2166" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                  Groups
                </Link>
                <Link
                  onClick={() => {
                    setActive('/pages')
                  }}
                  to={domain + "/pages"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/pages" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}
                >
                  <svg width="39" height="38" viewBox="0 0 39 38" className={`fill-foreground  ${active == "/pages" && "fill-white"} dark:fill-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.333 10.9599C11.333 10.5457 10.9972 10.2099 10.583 10.2099C10.1688 10.2099 9.83297 10.5457 9.83297 10.9599H11.333ZM10.583 24.3612H9.83295L9.83298 24.3659L10.583 24.3612ZM11.1914 25.8024L10.6649 26.3366H10.6649L11.1914 25.8024ZM12.6413 26.3895V25.6395L12.6349 25.6395L12.6413 26.3895ZM28.5253 26.3895L28.5317 25.6395H28.5253V26.3895ZM29.9752 25.8024L30.5017 26.3366V26.3366L29.9752 25.8024ZM30.5836 24.3612L31.3336 24.3659V24.3612H30.5836ZM30.5836 12.9834H31.3336L31.3336 12.9788L30.5836 12.9834ZM29.9752 11.5423L29.4488 12.0765L29.9752 11.5423ZM28.5253 10.9551V11.7052L28.5317 11.7051L28.5253 10.9551ZM21.2546 10.2051C20.8404 10.2051 20.5046 10.5409 20.5046 10.9551C20.5046 11.3694 20.8404 11.7051 21.2546 11.7051V10.2051ZM9.83455 10.9551C9.83455 11.3694 10.1703 11.7051 10.5845 11.7051C10.9988 11.7051 11.3345 11.3694 11.3345 10.9551H9.83455ZM10.5845 9.94498L9.83455 9.94034V9.94498H10.5845ZM11.1913 8.50553L11.7183 9.03914V9.03914L11.1913 8.50553ZM12.6381 7.91673L12.6335 8.66673H12.6381V7.91673ZM19.1995 7.91673V8.66676L19.2059 8.6667L19.1995 7.91673ZM20.6494 8.50384L21.1758 7.96962L21.1758 7.96962L20.6494 8.50384ZM21.2578 9.94498H22.0078L22.0078 9.94035L21.2578 9.94498ZM20.5078 10.9599C20.5078 11.3741 20.8436 11.7099 21.2578 11.7099C21.672 11.7099 22.0078 11.3741 22.0078 10.9599H20.5078ZM10.5877 10.2099C10.1735 10.2099 9.83772 10.5457 9.83772 10.9599C9.83772 11.3741 10.1735 11.7099 10.5877 11.7099V10.2099ZM21.2546 11.7099C21.6688 11.7099 22.0046 11.3741 22.0046 10.9599C22.0046 10.5457 21.6688 10.2099 21.2546 10.2099V11.7099ZM27.5843 26.3895C27.5843 25.9753 27.2485 25.6395 26.8343 25.6395C26.4201 25.6395 26.0843 25.9753 26.0843 26.3895H27.5843ZM26.8343 27.9728H26.0842L26.0844 27.9837L26.8343 27.9728ZM26.2446 29.4545L26.7819 29.9777H26.7819L26.2446 29.4545ZM24.7791 30.0834V30.8335L24.7882 30.8333L24.7791 30.0834ZM8.89197 30.0834L8.88402 30.8334H8.89197V30.0834ZM7.42672 29.4578L6.89058 29.9823H6.89058L7.42672 29.4578ZM6.83363 27.9791L7.58363 27.9878V27.9791H6.83363ZM6.83363 16.1786H7.58368L7.58358 16.17L6.83363 16.1786ZM7.42672 14.6999L6.89058 14.1754H6.89058L7.42672 14.6999ZM8.89197 14.0743V13.3243L8.88403 13.3244L8.89197 14.0743ZM10.583 14.8243C10.9972 14.8243 11.333 14.4885 11.333 14.0743C11.333 13.6601 10.9972 13.3243 10.583 13.3243V14.8243ZM9.83297 10.9599V24.3612H11.333V10.9599H9.83297ZM9.83298 24.3659C9.83755 25.1072 10.1369 25.8162 10.6649 26.3366L11.7178 25.2682C11.4735 25.0275 11.3351 24.6995 11.333 24.3566L9.83298 24.3659ZM10.6649 26.3366C11.193 26.8569 11.9064 27.1458 12.6477 27.1395L12.6349 25.6395C12.292 25.6424 11.962 25.5088 11.7178 25.2682L10.6649 26.3366ZM12.6413 27.1395H28.5253V25.6395H12.6413V27.1395ZM28.5189 27.1395C29.2602 27.1458 29.9736 26.8569 30.5017 26.3366L29.4488 25.2682C29.2046 25.5088 28.8746 25.6424 28.5317 25.6395L28.5189 27.1395ZM30.5017 26.3366C31.0297 25.8162 31.329 25.1072 31.3336 24.3659L29.8336 24.3566C29.8315 24.6995 29.6931 25.0275 29.4488 25.2682L30.5017 26.3366ZM31.3336 24.3612V12.9834H29.8336V24.3612H31.3336ZM31.3336 12.9788C31.329 12.2374 31.0297 11.5284 30.5017 11.008L29.4488 12.0765C29.6931 12.3172 29.8315 12.6451 29.8336 12.988L31.3336 12.9788ZM30.5017 11.008C29.9736 10.4877 29.2602 10.1988 28.5189 10.2052L28.5317 11.7051C28.8746 11.7022 29.2046 11.8358 29.4488 12.0765L30.5017 11.008ZM28.5253 10.2051H21.2546V11.7051H28.5253V10.2051ZM11.3345 10.9551V9.94498H9.83455V10.9551H11.3345ZM11.3345 9.94962C11.3367 9.60725 11.4747 9.27974 11.7183 9.03914L10.6642 7.97192C10.1376 8.49208 9.83914 9.20014 9.83456 9.94034L11.3345 9.94962ZM11.7183 9.03914C11.9619 8.79855 12.2911 8.66459 12.6335 8.66672L12.6428 7.16675C11.9026 7.16214 11.1909 7.45177 10.6642 7.97192L11.7183 9.03914ZM12.6381 8.66673H19.1995V7.16673H12.6381V8.66673ZM19.2059 8.6667C19.5488 8.66377 19.8787 8.79738 20.123 9.03806L21.1758 7.96962C20.6478 7.44928 19.9344 7.16042 19.1931 7.16676L19.2059 8.6667ZM20.123 9.03806C20.3672 9.27874 20.5057 9.60671 20.5078 9.94961L22.0078 9.94035C22.0032 9.19902 21.7039 8.48996 21.1758 7.96962L20.123 9.03806ZM20.5078 9.94498V10.9599H22.0078V9.94498H20.5078ZM10.5877 11.7099H21.2546V10.2099H10.5877V11.7099ZM26.0843 26.3895V27.9728H27.5843V26.3895H26.0843ZM26.0844 27.9837C26.0895 28.3371 25.9538 28.678 25.7073 28.9313L26.7819 29.9777C27.3065 29.439 27.5951 28.7137 27.5842 27.9619L26.0844 27.9837ZM25.7073 28.9313C25.4607 29.1845 25.1235 29.3292 24.7701 29.3335L24.7882 30.8333C25.54 30.8243 26.2574 30.5164 26.7819 29.9777L25.7073 28.9313ZM24.7791 29.3334H8.89197V30.8334H24.7791V29.3334ZM8.89991 29.3334C8.54685 29.3297 8.20976 29.1858 7.96287 28.9334L6.89058 29.9823C7.41581 30.5192 8.13294 30.8254 8.88402 30.8334L8.89991 29.3334ZM7.96287 28.9334C7.71598 28.681 7.57953 28.3408 7.58358 27.9878L6.08368 27.9705C6.07507 28.7216 6.36534 29.4453 6.89058 29.9823L7.96287 28.9334ZM7.58363 27.9791V16.1786H6.08363V27.9791H7.58363ZM7.58358 16.17C7.57953 15.8169 7.71598 15.4767 7.96287 15.2243L6.89058 14.1754C6.36534 14.7124 6.07507 15.4361 6.08368 16.1872L7.58358 16.17ZM7.96287 15.2243C8.20976 14.9719 8.54685 14.828 8.89991 14.8243L8.88403 13.3244C8.13294 13.3323 7.41581 13.6385 6.89058 14.1754L7.96287 15.2243ZM8.89197 14.8243H10.583V13.3243H8.89197V14.8243Z" />
                  </svg>
                  Pages
                </Link>
                <Link
                  onClick={() => {
                    setActive('/bookmarked')
                  }}
                  to={domain + "/bookmarked"}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/bookmarked" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}
                >
                  <svg width="39" height="38" viewBox="0 0 39 38" className={`stroke-foreground ${active == "/bookmarked" && "stroke-white"} dark:stroke-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M29.0112 31.4339V9.55384C29.0183 8.70684 28.6887 7.89169 28.0949 7.28772C27.501 6.68375 26.6915 6.34045 25.8445 6.33334H13.1778C12.3308 6.34045 11.5213 6.68375 10.9275 7.28772C10.3336 7.89169 10.004 8.70684 10.0112 9.55384V31.4339C9.93589 32.0657 10.2461 32.6811 10.7987 32.9965C11.3512 33.3118 12.0389 33.2657 12.5445 32.8795L18.5612 27.6846C19.1035 27.1951 19.9283 27.1951 20.4707 27.6846L26.4778 32.8811C26.9837 33.2676 27.6718 33.3136 28.2245 32.9978C28.7773 32.6821 29.0872 32.066 29.0112 31.4339Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                  Bookmarked
                </Link>
              </nav>
            </div>
            <div className="mt-auto p-4">
              <Link
                onClick={() => {
                  setActive('/campaigns')
                }}
                to={domain + "/campaigns"}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${active == "/campaigns" && 'bg-primary-active text-primary-foreground hover:text-primary-foreground'}`}
              >
                <svg width="38" height="38" viewBox="0 0 38 38" className={`stroke-foreground ${active == "/campaigns" && "stroke-white"} dark:stroke-foreground`} fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M22.9613 19.0004C22.9613 20.7493 21.5435 22.1671 19.7946 22.1671C18.0457 22.1671 16.6279 20.7493 16.6279 19.0004C16.6279 17.2515 18.0457 15.8338 19.7946 15.8338C21.5435 15.8338 22.9613 17.2515 22.9613 19.0004Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.2992 28.6588L8.31711 20.2877C7.78297 19.4602 7.78297 18.3966 8.31711 17.5691L12.2739 9.32944C12.8795 8.43037 13.899 7.89887 14.9829 7.91711H19.7947H24.6064C25.6903 7.89887 26.7099 8.43037 27.3155 9.32944L31.2644 17.5628C31.7985 18.3903 31.7985 19.4539 31.2644 20.2814L27.2902 28.6588C26.6849 29.5672 25.6583 30.1044 24.5669 30.0838H15.0209C13.9301 30.1038 12.9042 29.5667 12.2992 28.6588Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                Campaigns
              </Link>
            </div>
          </div>
        </div>

        {/* main section */}
        {children}
      </div>

    </div >
  )
}

export default MainHome
