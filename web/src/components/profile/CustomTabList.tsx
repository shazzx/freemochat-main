import { TabsList, TabsTrigger } from '@radix-ui/react-tabs'

function CustomTabList({list, minWidth, maxWidth}) {
    
    return (
        <div>
            <TabsList className={`p-3 text-sm flex min-w-[${minWidth}px] max-w-${maxWidth} justify-between`}>
                {list.map((item) => (
                    <TabsTrigger value={item.value} className="data-[state=active]:border-b-4 data-[state=active]:border-primary-active data-[state=active]:px-1">{item.name}</TabsTrigger>
                ))}
            </TabsList>
        </div>
    )
}

export default CustomTabList