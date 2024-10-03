import dayjs from "dayjs"

export const getTime = (time?): {
    year: string,
    month: string,
    date: string,
    day: string,
    hour: string,
    minutes: string,
    meridiam: string
} => {
    let createDate = dayjs(time).format("YYYY/MMM/DD/ddd/hh/mm/a")
    let date = createDate.split('/')
    return {
        year: date[0],
        month: date[1],
        date: date[2],
        day: date[3],
        hour: date[4],
        minutes: date[5],
        meridiam: date[6]
    }
}
