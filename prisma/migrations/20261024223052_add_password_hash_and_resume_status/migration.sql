-- CreateEnum
CREATE TYPE "ResumeGenerationStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "tailored_resumes" ADD COLUMN     "status" "ResumeGenerationStatus" NOT NULL DEFAULT 'GENERATING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_hash" TEXT;
