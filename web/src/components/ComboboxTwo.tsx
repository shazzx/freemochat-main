import  { useState } from 'react'
import { Button } from './ui/button'

function CustomComboBox({getSelected}) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState('public')



  return (
    <div className='relative w-40'>
        <Button
        type="button"
        variant='ghost'
        className='p-2 w-full border border-accent'
        onClick={() => {
            setOpen(!open)
        }}
   >
            {value == "public" ? "Public" : "Private"}
        </Button>

        {open 
        &&
        <div className='w-full flex flex-col absolute bg-card rounded-md'>
            <span className={`${value == 'public' ? "bg-accent" : "" } text-sm p-2 cursor-pointer`} onClick={() => {
                setValue("public")
                getSelected("public")
                setOpen(false)
            }} >Public</span>
            <span  className={`${value == 'private' ? "bg-accent" : "" } text-sm p-2 cursor-pointer`} onClick={() => {
                setValue('private')
                getSelected("private")
                setOpen(false)
            }}>Private</span>
        </div>
        }
    </div>
  )
}

export default CustomComboBox