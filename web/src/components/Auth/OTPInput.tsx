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

export function InputOTPForm({ setOtpSent, sent, send, label, description, onSubmit, type, otpResend, data, setCode, changeData}: { label: string, description: string, onSubmit, type: string, otpResend, send?: boolean, sent?: boolean, setOtpSent?: Function, data?: boolean, setCode?: Function, changeData: MouseEventHandler}) {
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
              <FormControl onChange={(val) =>{
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
                setOtpSent(true)
                otpResend(type)
              }
            }}>{sent ? <div className="flex gap-2 items-center justify-center">
              <FaCheckCircle className="text-green-500 text-xl" />
              <span>Sent</span>
            </div> : "Send"
              }</Button>}
          {!send ? <Button type="submit">Verify</Button> : <Button disabled={data} type="button" onClick={changeData} >Change Address</Button>}
        </div>
      </form>
    </Form>
  )
}
