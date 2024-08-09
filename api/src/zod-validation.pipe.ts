import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema, private parse?:boolean, private field?: string) {}
    transform(value: any, metadata: ArgumentMetadata) {

        if(this.parse){
            console.log(value)
            value = JSON.parse(value[this.field])
            console.log(value)
        }

        const result = this.schema.safeParse(value)
console.log(result.error)
        if (!result.success) {
            throw new BadRequestException(result.error)
        }
        return result.data
    }
}
