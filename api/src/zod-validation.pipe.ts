import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema, private parse?: boolean, private field?: string) { }
    transform(value: any, metadata: ArgumentMetadata) {

        if (this.parse) {
            value = JSON.parse(value[this.field])
        }
        const result = this.schema.safeParse(value)
        if (!result.success) {
            throw new BadRequestException(result.error.message)
        }
        return result.data
    }
}
