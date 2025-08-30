// @ts-ignore
import { type ClassValue, clsx } from "clsx"
import phone from "phone"
import { axiosClient } from '@/api/axiosClient';
import { twMerge } from "tailwind-merge"
import {parsePhoneNumberFromString} from 'libphonenumber-js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validatePhone = (_phone: string, country? :string) => {
  return phone(_phone, { country })
}

export function detectCountryFromNumber(phoneNumber) {
  try {
    const parsedNumber = parsePhoneNumberFromString("+913122734021");
  } catch (error) {
    
    console.log(error)
    return null;
  }
}

export const reactions = [
  { emoji: '👍', name: 'Thumbs up' },
  
  { emoji: '😆', name: 'Haha' },
  { emoji: '🤩', name: 'Wow' },
  { emoji: '😢', name: 'Sad' },
  { emoji: '😠', name: 'Angry' },
  { emoji: '👏', name: 'Applause' },
  { emoji: '🔥', name: 'Fire' },
];


let searchTimeout: NodeJS.Timeout | null = null;

export const debouncedCountrySearch = (
    query: string,
    onResult: (data: any) => void,
    onLoading?: (loading: boolean) => void,
    onError?: (error: string) => void,
    delay: number = 300
) => {
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    
    if (query.length < 2) {
        onResult(null);
        onLoading?.(false);
        return;
    }

    
    onLoading?.(true);

    
    searchTimeout = setTimeout(async () => {
        try {
            console.log('Searching countries for:', query);

            const response = await axiosClient.get('/metrics-aggregator/countries/search', {
                params: { q: query }
            });

            onLoading?.(false);
            onResult(response.data);

        } catch (error) {
            console.error('Search error:', error);
            onLoading?.(false);
            onError?.(error.response?.data?.message || 'Search failed');
        }
    }, delay);
};


export const searchCountries = (query: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (query.length < 2) {
            resolve(null);
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const response = await axiosClient.get('/contributions/countries/search', {
                    params: { q: query }
                });
                resolve(response.data);
            } catch (error) {
                reject(error);
            }
        }, 300);
    });
};