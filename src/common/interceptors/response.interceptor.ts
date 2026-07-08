// Bọc response theo envelope { data, meta }
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// Bọc mọi response thành công về { data, meta? } theo docs/04-api-contract.md.
// Nếu service/controller đã tự trả đúng shape { data, meta } (vd danh sách có phân trang)
// thì giữ nguyên, không bọc lồng thêm lần nữa.
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Envelope<T>> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (
          result &&
          typeof result === "object" &&
          "data" in (result as Record<string, unknown>)
        ) {
          return result as Envelope<T>;
        }
        return { data: result as T };
      }),
    );
  }
}
