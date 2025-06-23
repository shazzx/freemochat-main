import { ValidMongoId } from "./global";
import { z } from 'zod'

export const ReadNotificationSchema = z.object({
    notificationId: ValidMongoId
});

export type ReadNotificationDTO = z.infer<typeof ReadNotificationSchema>



