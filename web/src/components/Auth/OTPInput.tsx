"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { toast } from "@/components/ui/use-toast"
import { axiosClient } from "@/api/axiosClient"
import { FaCheckCircle } from "react-icons/fa"
import { MouseEventHandler, ReactNode } from "react"

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
})

export function InputOTPForm({ buttonTitle, setOtpSent, sent, send, label, description, onSubmit, type, otpResend, data, setCode, changeData, loader }: { label?: string, buttonTitle?: string, description: string, onSubmit, type?: string, otpResend?: Function, send?: boolean, sent?: boolean, setOtpSent?: Function, data?: boolean, setCode?: Function, changeData?: MouseEventHandler, loader?: boolean, }) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  })

  function _onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data)
    onSubmit({ ...data, type })
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form  {...form}>
      <form onSubmit={form.handleSubmit(_onSubmit)} className="w-full space-y-6">
        <FormField

          control={form.control}
          name="pin"

          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl onChange={(val) => {
                setCode(val)
              }} >
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>
                {description}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2">
          {send &&
            <Button type="button" className={sent ? "bg-card border border-accent my-2" : "my-2"} onClick={() => {
              if (!sent) {
                otpResend(type)
                setOtpSent(true)
              }
            }}>{sent ? <div className="flex gap-2 items-center justify-center">
              <FaCheckCircle className="text-green-500 text-xl" />
              <span>Sent</span>
            </div> : "Send"
              }</Button>}
          {!send ? <Button type="submit">Verify</Button> : <Button disabled={data} type="button" onClick={changeData} >{loader ?
            <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
              width="24" height="24">
              <path
                d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path
                d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" className="text-white">
              </path>
            </svg>
            : buttonTitle}</Button>}
        </div>
      </form>
    </Form>
  )
}
