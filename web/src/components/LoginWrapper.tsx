import { Link, useNavigate } from "react-router-dom"
import { LoginUserSchema } from "@/utils/schemas/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { axiosClient } from "@/api/axiosClient"
import { useMutation } from "@tanstack/react-query"
import { setAccessToken } from "@/app/features/user/authSlice"
import { useAppDispatch } from "@/app/hooks"
import { store } from "@/app/store"
import { setUser } from "@/app/features/user/userSlice"
import { toast } from "react-toastify"
import { setVerificationStatus } from "@/app/features/user/verificationStatusSlice"
import logo from './../assets/logo.png'
import { domain } from "@/config/domain"
import BottomLinks from "./BottomLinks"
import { detectCountryFromNumber, validatePhone } from "@/lib/utils"

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LoginWrapper() {
  // const [isPhoneTabActive, setIsPhoneTabActive] = useState(false);
  // const [countries, setCountries] = useState(null);
  // const [activeTab, setActiveTab] = useState("email");
  const [loginButtonState, setLoginButtonState] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(LoginUserSchema) });
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const loginUser = async (data: any) => {
    const response = await axiosClient.post("/user/login/v2", data, { withCredentials: true });
    return response.data;
  }

  const mutation = useMutation({
    mutationFn: async (data): Promise<any> => {
      return await loginUser(data);
    },
    onError: (error: any) => {
      if (error.response.data.type == 'not verified') {
        dispatch(setVerificationStatus(error.response.data.verification));
        navigate("/auth/" + error.response.data.user.username + "?auth_id=" + error.response.data.user.auth_id);
        return;
      }

      if (error.response.data.message.startsWith('Your account')) {
        toast.error(error.response.data.message);
        return;
      }
      toast.error(error.response.data.message);
      setLoginButtonState(false);
    }
  });

  const dispatchUser = async () => {
    dispatch(setAccessToken(mutation.data.access_token));
    let response = await axiosClient.get("user", { headers: { Authorization: `Bearer ${store.getState().auth.access_token}` } });
    dispatch(setUser(response.data));
  }

  // useEffect(() => {
  //   const fetchCountries = async () => {
  //     const { data } = await axiosClient.get('/location/countries');
  //     setCountries(data);
  //   }
  //   fetchCountries();
  // }, []);

  // Update isPhoneTabActive whenever activeTab changes
  // useEffect(() => {
  //   console.log(activeTab)
  //   setIsPhoneTabActive(activeTab === "phone");
  // }, [activeTab]);

  const onSubmit = async (data) => {
    setLoginButtonState(true);

    // if (isPhoneTabActive) {
    //   let phone = validatePhone(`${data.username}`, selectedCountryIso3);

    //   if (phone.isValid) {
    //     console.log(data, phone.phoneNumber);
    //     mutation.mutate({ ...data, username: phone.phoneNumber });
    //   }
    //   return;
    // }
    mutation.mutate(data);
  }

  if (mutation.isSuccess) {
    dispatchUser();
    navigate("/");
  }

  // Handle tab change
  // const handleTabChange = (value) => {
  //   setActiveTab(value);
  // };

  return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Enter your email/username and password to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Email/Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Type your email or username"
                  {...register("username")}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link to={`${domain}/forget-password`} className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Type your password"
                  {...register("password")} required />
              </div>
              <Button disabled={loginButtonState} type="submit" className="w-full">
                {loginButtonState ?
                  <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24">
                    <path
                      d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                      stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path
                      d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                      stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    </path>
                  </svg>
                  :
                  "Login"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    // <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-md mx-auto">
    //   <TabsList className="grid gap-1 w-full grid-cols-2 bg-background">
    //     <TabsTrigger 
    //       value="email" 
    //       className="dark:bg-card bg-white data-[state=active]:bg-white border-accent border-1 data-[state=active]:border-b-4 data-[state=active]:border-primary-active data-[state=active]:px-1"
    //     >
    //       Email
    //     </TabsTrigger>
    //     <TabsTrigger
    //       value="phone" 
    //       className="dark:bg-card bg-white data-[state=active]:bg-white border-accent border-1 data-[state=active]:border-b-4 data-[state=active]:border-primary-active data-[state=active]:px-1"
    //     >
    //       Phone
    //     </TabsTrigger>
    //   </TabsList>

    //   <form onSubmit={handleSubmit(onSubmit)}>
    //     <TabsContent value="email">
    //       <Card>
    //         <CardHeader>
    //           <CardTitle className="text-2xl">Sign in with Username</CardTitle>
    //           <CardDescription>
    //             Enter your username and password to login to your account
    //           </CardDescription>
    //         </CardHeader>
    //         <CardContent>
    //           <div className="grid gap-4">
    //             <div className="grid gap-2">
    //               <Label htmlFor="username">Username</Label>
    //               <Input
    //                 id="username"
    //                 type="text"
    //                 placeholder="Type your username"
    //                 {...register("username")}
    //                 required
    //               />
    //             </div>
    //             <div className="grid gap-2">
    //               <div className="flex items-center">
    //                 <Label htmlFor="password">Password</Label>
    //                 <Link to={`${domain}/forget-password`} className="ml-auto inline-block text-sm underline">
    //                   Forgot your password?
    //                 </Link>
    //               </div>
    //               <Input
    //                 id="password"
    //                 type="password"
    //                 placeholder="Type your password"
    //                 {...register("password")} required />
    //             </div>
    //             <Button disabled={loginButtonState} type="submit" className="w-full">
    //               {loginButtonState ?
    //                 <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
    //                   width="24" height="24">
    //                   <path
    //                     d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
    //                     stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></path>
    //                   <path
    //                     d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
    //                     stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    //                   </path>
    //                 </svg>
    //                 :
    //                 "Login"}
    //             </Button>
    //           </div>
    //           <div className="mt-4 text-center text-sm">
    //             Don&apos;t have an account?{" "}
    //             <Link to="/signup" className="underline">
    //               Sign up
    //             </Link>
    //           </div>
    //         </CardContent>
    //       </Card>
    //     </TabsContent>

    //     <TabsContent value="phone">
    //       <Card>
    //         <CardHeader>
    //           <CardTitle className="text-2xl">Sign in with Phone</CardTitle>
    //           <CardDescription>
    //             Enter your phone number and password to login to your account
    //           </CardDescription>
    //         </CardHeader>
    //         <CardContent className="space-y-4">
    //           <div className="space-y-2">
    //             <Label htmlFor="phone">Phone Number</Label>
    //             <div className="flex space-x-2">
    //               <Select
    //                 value={selectedCountryIso3}
    //                 onValueChange={setSelectedCountryIso3}
    //               >
    //                 <SelectTrigger className="w-32">
    //                   <SelectValue placeholder="Code" />
    //                 </SelectTrigger>
    //                 <SelectContent className="max-h-64">
    //                   {countries?.map((country) => (
    //                     <SelectItem key={country["iso3"]} value={country["iso3"]}>
    //                       {country.name} +{country.code}
    //                     </SelectItem>
    //                   ))}
    //                 </SelectContent>
    //               </Select>
    //               <Input
    //                 id="phone"
    //                 type="tel"
    //                 placeholder="Phone number"
    //                 className="flex-1"
    //                 {...register("username")}
    //               />
    //             </div>
    //           </div>
    //           <div className="grid gap-2">
    //             <div className="flex items-center">
    //               <Label htmlFor="password">Password</Label>
    //               <Link to={`${domain}/forget-password`} className="ml-auto inline-block text-sm underline">
    //                 Forgot your password?
    //               </Link>
    //             </div>
    //             <Input
    //               id="password"
    //               type="password"
    //               placeholder="Type your password"
    //               {...register("password")} required />
    //           </div>
    //         </CardContent>
    //         <CardFooter className="flex flex-col space-y-4">
    //           <Button disabled={loginButtonState} type="submit" className="w-full">
    //             {loginButtonState ?
    //               <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
    //                 width="24" height="24">
    //                 <path
    //                   d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
    //                   stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></path>
    //                 <path
    //                   d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
    //                   stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    //                 </path>
    //               </svg>
    //               :
    //               "Login"}
    //           </Button>
    //           <div className="mt-4 text-center text-sm">
    //             Don&apos;t have an account?{" "}
    //             <Link to="/signup" className="underline">
    //               Sign up
    //             </Link>
    //           </div>
    //         </CardFooter>
    //       </Card>
    //     </TabsContent>
    //   </form>
    // </Tabs>
  );
}

export default LoginWrapper;