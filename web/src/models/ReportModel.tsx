import { axiosClient } from "@/api/axiosClient"
import { loginSuccess } from "@/app/features/user/authSlice"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { CheckboxReactHookFormSingle } from "@/components/Checkbox"
import { ComboboxForm } from "@/components/Comboxbox"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

function ReportModel({ setModelTrigger, postId }) {

    const { user } = useAppSelector(data => data.user)

    const [selectedReportIndex, setSelectedReportIndex] = useState()
    const reportMessage = useRef()

    const reportTypes = [
        "Abuse", "Nudity", "Other"
    ]

    return (
        <div className='absolute top-0 right-0 w-screen z-50 sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 right-0 opacity-15  bg-black w-full h-full' onClick={() => {
                setModelTrigger(false)
            }}></div>
            <div className='flex flex-col gap-4 z-10 p-4 w-96 bg-background rounded-lg h-fit overflow-auto'>
                <div>
                    {reportTypes.map((type, i) => (
                        <div className={`p-2 cursor-pointer rounded-md ${i == selectedReportIndex && "bg-primary"}`} onClick={() => {
                            setSelectedReportIndex(i)
                        }}>
                            <span>{type}</span>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-2">
                    <span>Message</span>
                    <Textarea ref={reportMessage} placeholder="type your report message" />
                </div>

                <Button onClick={async () => {
                    console.log('hello', selectedReportIndex)
                    if (typeof selectedReportIndex == "number") {
                        console.log('hello')
                        const { data } = await axiosClient.post("posts/report", { reportData: { reportMessage: reportMessage.current.value, type: reportTypes[selectedReportIndex], userId: user?._id }, postId })
                        console.log(data)
                    }
                }}>Submit</Button>
            </div>
        </div>
    )
}

export default ReportModel


