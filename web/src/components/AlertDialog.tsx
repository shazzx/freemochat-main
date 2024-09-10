import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { useNavigate } from "react-router-dom"

  export function AlertDialogC({action, alertDialog, setAlertDialog, setChatOpen }) {

    return (
      <AlertDialog open={alertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
            onClick={() => {
              setAlertDialog(false)
            }}
            >Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              action()
              setAlertDialog(false)
              setChatOpen(false)
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  