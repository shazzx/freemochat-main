import { Link } from 'react-router-dom'

function BottomLinks() {
    return (
        <div className="flex flex-col gap-2 items-center justify-center">
            <div className="flex flex-wrap max-w-72 items-center justify-center gap-2">
                <Link to={'/privacy'}>
                    <span className="text-xs cursor-pointer hover:text-primary">
                        Privacy Policy
                    </span>
                </Link>
                <Link to={'/children-privacy'}>
                    <span className="text-xs cursor-pointer hover:text-primary">
                        Children Privacy
                    </span>
                </Link>
                <Link to={'/terms'}>
                    <span className="text-xs cursor-pointer hover:text-primary">
                        Terms and Conditions
                    </span>
                </Link>
                
            </div>
            <div>
                <span className="text-xs">
                    Freedombook @ 2025
                </span>
            </div>
            <div className='text-xs'>
                <span className='mr-1'>
                    Powered by
                </span>
                <a href="https://diginotive.com" target='blank' rel="noopener noreferrer" className='hover:text-primary'>Diginotive</a>
            </div>
        </div>

    )
}

export default BottomLinks