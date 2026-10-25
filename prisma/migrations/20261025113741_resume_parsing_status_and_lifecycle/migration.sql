/*
  Warnings:

  - Added the required column `updated_at` to the `parsed_resumes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ParsingStatus" AS ENUM ('PROCESSING', 'REVIEWING', 'APPLIED', 'FAILED');

-- AlterTable
ALTER TABLE "parsed_resumes" ADD COLUMN     "error_code" VARCHAR(64),
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "status" "ParsingStatus" NOT NULL DEFAULT 'PROCESSING',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "raw_text" DROP NOT NULL,
ALTER COLUMN "parsed_payload" DROP NOT NULL;
