// Validate DTO bằng Zod schema
import { BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";

// Dùng: @UsePipes(new ZodValidationPipe(schema)) hoặc validate thủ công trong controller
// khi cần custom message. Đây là layer validate DUY NHẤT cho body/query/params
// theo quy ước Clean-BE (route/middleware layer) — service không tự parse lại.
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    }
    return result.data;
  }
}
