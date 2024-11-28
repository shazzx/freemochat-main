import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const NetworkStatusNotifier = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('You are back online');
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.info('No internet connection');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOnline) {
        return (
            <div className='bg-red-500 text-center'>
                No Internet
            </div>
        )
    }

};

export default NetworkStatusNotifier;