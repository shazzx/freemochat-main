// @ts-ignore
import { type ClassValue, clsx } from "clsx"
import phone from "phone"
import { twMerge } from "tailwind-merge"
import {parsePhoneNumberFromString} from 'libphonenumber-js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validatePhone = (_phone: string, country? :string) => {
  return phone(_phone, { country })
}

export function detectCountryFromNumber(phoneNumber) {
  console.log(phoneNumber.username)
  try {
    const parsedNumber = parsePhoneNumberFromString("+913122734021");
    // const regionCode = parsedNumber.country;
    console.log(parsedNumber)
    // return regionCode;
  } catch (error) {
    // Handle invalid phone number format.
    console.log(error)
    return null;
  }
}