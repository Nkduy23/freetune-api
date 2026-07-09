// Query Prisma cho User + RefreshToken
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

// Chỉ chứa query Prisma thuần cho User + RefreshToken — không có logic nghiệp vụ ở đây.
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // FINDS
  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  // MUTATIONS
  createUser(data: { email: string; passwordHash: string; name?: string }) {
    return this.prisma.user.create({ data });
  }

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  revokeRefreshToken(id: string, replacedByTokenId?: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedByTokenId },
    });
  }

  revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
