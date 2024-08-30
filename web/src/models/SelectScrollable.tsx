import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function SelectScrollable({ placeholder, selectData, setCity, setCountry, areCities, countryName, cityName, areAreas }: any) {
    let disable= true
    if(areCities && !countryName){
        disable = true
    }else if(areAreas && !cityName){
        disable = true
    }else {
        disable = false
    }

    return (
        <Select onValueChange={(value) => {
            if (areCities) {
                setCity(value)
            } else if(areAreas) {
                setCountry(value)
            }else{
                setCountry(value)
            }
        }} disabled={disable}
        >
            <SelectTrigger >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="w-[280px]">
                {selectData?.length > 0 && selectData.map((data) => {
                    return < SelectItem value={data.name}> {data.name}</SelectItem>
                })}
            </SelectContent>
        </Select >
    )
}
