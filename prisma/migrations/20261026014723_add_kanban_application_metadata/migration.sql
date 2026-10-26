-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "compensation" VARCHAR(128),
ADD COLUMN     "contact_email" VARCHAR(255),
ADD COLUMN     "contact_name" VARCHAR(128),
ADD COLUMN     "interview_date" TIMESTAMP(3),
ADD COLUMN     "location" VARCHAR(128);

-- CreateIndex
CREATE INDEX "applications_user_id_interview_date_idx" ON "applications"("user_id", "interview_date");
