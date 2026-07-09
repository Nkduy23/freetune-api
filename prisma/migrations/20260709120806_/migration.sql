/*
  Warnings:

  - The values [PIXABAY] on the enum `SourceProvider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SourceProvider_new" AS ENUM ('JAMENDO');
ALTER TABLE "Track" ALTER COLUMN "sourceProvider" TYPE "SourceProvider_new" USING ("sourceProvider"::text::"SourceProvider_new");
ALTER TABLE "IngestionLog" ALTER COLUMN "provider" TYPE "SourceProvider_new" USING ("provider"::text::"SourceProvider_new");
ALTER TYPE "SourceProvider" RENAME TO "SourceProvider_old";
ALTER TYPE "SourceProvider_new" RENAME TO "SourceProvider";
DROP TYPE "SourceProvider_old";
COMMIT;
