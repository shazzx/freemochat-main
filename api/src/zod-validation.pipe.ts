import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) {
        console.log(schema)
    }
    transform(value: any, metadata: ArgumentMetadata) {
        const result = this.schema.safeParse(value)
        console.log(result)
        if (!result.success) {
            throw new BadRequestException(result.error)
        }
        return result.data
    }
}
