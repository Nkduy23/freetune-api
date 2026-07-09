// @CurrentUser() lấy user từ request
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

// Dùng: @CurrentUser() user: { id: string; email: string } trong controller
// đã có @UseGuards(AccessTokenGuard) — user được JwtStrategy gắn vào req.user.
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user;
  },
);
