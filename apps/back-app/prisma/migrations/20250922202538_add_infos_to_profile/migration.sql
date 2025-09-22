/*
  Warnings:

  - Added the required column `profilePictureUrl` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."Locale" AS ENUM ('EN', 'FR');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "locale" "public"."Locale" NOT NULL DEFAULT 'EN',
ADD COLUMN     "profilePictureUrl" TEXT NOT NULL,
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER';
