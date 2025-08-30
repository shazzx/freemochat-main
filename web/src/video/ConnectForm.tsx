import { useState } from 'react'
import logo from './../assets/react.svg'

interface ConnectFormProps {
  connectToVideo: (channelName: string) => void
}

export const ConnectForm = ({ connectToVideo } : ConnectFormProps) => {

  const [channelName, setChannelName] = useState('')
  const [invalidInputMsg, setInvalidInputMsg] = useState('')


  const handleConnect = (e: React.FormEvent<HTMLFormElement>) => {
    
    const trimmedChannelName = channelName.trim()
    
    
    if (trimmedChannelName === '') {
      e.preventDefault() 
      setInvalidInputMsg("Channel name can't be empty.") 
      setChannelName('') 
      return;
    } 
  
    connectToVideo(trimmedChannelName)
  }

  return (
    <form onSubmit={handleConnect}>
      <img src={logo} className="logo" alt="logo" />
      <div className="card">
        <input 
          id="channelName"
          type='text'
          placeholder='Channel Name'
          value={channelName}
          onChange={(e) => {
            setChannelName(e.target.value)
            setInvalidInputMsg('') 
          }}
        />
        <button>Connect</button>
        { invalidInputMsg && <p style={{color: 'red'}}> {invalidInputMsg} </p>}
      </div>
    </form>
  )
}