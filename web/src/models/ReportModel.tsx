import { axiosClient } from "@/api/axiosClient"
import { useAppSelector } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "react-toastify"
function ReportModel({ setModelTrigger, postId }) {

    const { user } = useAppSelector(data => data.user)

    const [selectedReportIndex, setSelectedReportIndex] = useState(-1)
    const reportMessage = useRef<HTMLTextAreaElement>()

    const reportTypes = [
        "Harassment/Bullying",
        "Hate speech",
        "Spam",
        "Inappropriate content",
        "Copyright infringement",
        "Impersonation",
        "Self-harm or suicide threats",
        "Misinformation",
        "Violence or threats",
        "Privacy violations",
        "Illegal activities",
        "Graphic content",
        "Fake news",
        "Other"
    ]

    console.log(reportTypes)

    return (
        <div className='fixed inset-0 z-50  w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center' key={postId}>
            <div className='absolute top-0 right-0 opacity-15  bg-black w-full h-full' onClick={() => {
                setModelTrigger(false)
            }}>
            </div>
            <div className='relative flex flex-col gap-4 z-10 p-4 w-96 bg-background rounded-lg h-fit overflow-auto border-accent border'>
                <div className="text-md sm:text-xl text-center">
                    Report
                </div>
                <X size={18} className="absolute text-white right-4 top-4 cursor-pointer" onClick={() => {
                    setModelTrigger(false)
                }} />
                <div className="max-h-56 overflow-auto">
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
                        if (selectedReportIndex == -1) {
                            toast.info('Please select report type')
                            return
                        }

                        if (reportMessage.current.value.length < 12) {
                            console.log('less than')
                            toast.info('Report message must be atleast 12 characters')
                            return
                        }

                        try {
                            console.log('hello')
                            const { data } = await axiosClient.post("posts/report", { reportData: { reportMessage: reportMessage.current.value, type: reportTypes[selectedReportIndex], userId: user?._id }, postId })
                            toast.success("Report has been submitted")
                            setModelTrigger(false)
                        } catch (error) {
                            toast.info("You've already reported the post")
                            setModelTrigger(false)
                        }
                    }
                }}>Submit</Button>
            </div>
        </div>
    )
}

export default ReportModel


