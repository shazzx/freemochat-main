import { z } from 'zod'

export const Search = z.object({
    query: z.string(),
    type: z.string(),
})

export type SearchDTO = z.infer<typeof Search>