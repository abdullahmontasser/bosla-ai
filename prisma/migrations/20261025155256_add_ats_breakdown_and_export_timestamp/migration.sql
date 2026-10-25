/*
  Warnings:

  - You are about to drop the column `pdf_export_path` on the `tailored_resumes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tailored_resumes" DROP COLUMN "pdf_export_path",
ADD COLUMN     "ats_breakdown" JSONB,
ADD COLUMN     "last_exported_at" TIMESTAMP(3);
