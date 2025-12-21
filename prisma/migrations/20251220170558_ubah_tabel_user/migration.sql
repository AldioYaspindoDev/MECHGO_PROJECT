/*
  Warnings:

  - You are about to drop the column `verification_email` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "verification_email",
ADD COLUMN     "verification_token" VARCHAR(255);
