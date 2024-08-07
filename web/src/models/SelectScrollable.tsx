import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function SelectScrollable({ placeholder, selectData, setCity, setCountry, areCities, countryName, cityName, areAreas }: any) {
    console.log(areAreas, cityName)
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
                setCity(value.toLowerCase())
            } else if(areAreas) {
                setCountry(value.toLowerCase())
            }else{
                setCountry(value.toLowerCase())
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
