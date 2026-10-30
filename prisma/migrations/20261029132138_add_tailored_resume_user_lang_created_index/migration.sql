-- CreateIndex
CREATE INDEX "tailored_resumes_user_id_language_created_at_idx" ON "tailored_resumes"("user_id", "language", "created_at" DESC);
