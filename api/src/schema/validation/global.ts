import { z } from 'zod'
import {Types} from 'mongoose'

const isoDateStringSchema = z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid ISO date string",
    })

export const Cursor = z.object({
    cursor: z.union([z.undefined(), z.null(), isoDateStringSchema])
        .optional()
        .nullable(),
})

export const Handle = z.object({
  handle: z.string().min(6, {message: "handle minimum length is 6 characters"})
  
})

export const ValidMongoId = z.string().refine(
    (val) => Types.ObjectId.isValid(val),
    {
      message: 'Invalid MongoDB ObjectId',
    }
  );

  export type CursorDTO = z.infer<typeof Cursor>
  export type HandleDTO = z.infer<typeof Handle>
