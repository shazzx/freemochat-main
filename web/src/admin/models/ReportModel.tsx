import Profile from "@/components/profile/Profile"
import { Textarea } from "@/components/ui/textarea"
import { domain } from "@/config/domain"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { Link } from "react-router-dom"

function ReportModel({ setReportModelState, reportDetails }) {
    console.log(reportDetails)

    return (
        <div className='fixed inset-0 z-50  w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center' >
            <div className='absolute top-0 right-0  backdrop-blur-[1.5px]  w-full h-full' onClick={() => {
                setReportModelState(false)
            }}></div>
            <div className='flex flex-col gap-4 z-10 p-4 w-96 bg-background rounded-lg h-fit overflow-auto border-accent border'>
                <div className="flex flex-col gap-2">
                    <span className="text-lg">Reported By</span>
                    <Link to={domain + "/user/" + reportDetails?.reportedBy[0]?.username} className="flex gap-2 items-center">
                        <div className='w-12 h-12 flex items-center justify-center  rounded-full overflow-hidden'>
                            <Avatar className="sm:flex">
                                <AvatarImage src={reportDetails.reportedBy[0]?.profile} alt="Avatar" />
                                <AvatarFallback>{reportDetails.reportedBy[0].firstname}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col" >
                            <div>{reportDetails?.reportedBy[0]?.lastname ? reportDetails?.reportedBy[0]?.firstname + " " + reportDetails?.reportedBy[0]?.lastname : reportDetails?.reportedBy[0]?.firstname} </div>
                            <div className="text-sm text-gray-200">@{reportDetails?.reportedBy[0]?.username}</div>
                        </div>
                    </Link>
                </div>
                <div>
                    <span>Type {reportDetails?.type}</span>
                </div>
                <div className="flex flex-col gap-2">
                    <span>Message</span>
                    <p>{reportDetails.reportMessage} </p>
                </div>
            </div>
        </div>
    )
}

export default ReportModel


