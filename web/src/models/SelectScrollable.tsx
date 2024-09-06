import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

export function SelectScrollable({ placeholder, selectData, setCity, setCountry, areCities, countryName, cityName, areAreas, setArea }: any) {
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
            let val = JSON.parse(value)
            if (areCities) {
                setCity(val.name)
            } else if(areAreas) {
                setArea(val.name)
            }else{
                setCountry({name: val.name, "iso2": val["iso2"], "iso3": val["iso3"] })
            }
        }} disabled={disable}
        >
            <SelectTrigger >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="w-[280px]">
                {selectData?.length > 0 && selectData.map((data) => {
                    return < SelectItem value={JSON.stringify(data)}> {data.name}</SelectItem>
                })}
            </SelectContent>
        </Select >
    )
}
