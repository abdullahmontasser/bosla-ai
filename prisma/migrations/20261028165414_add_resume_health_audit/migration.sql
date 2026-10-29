-- CreateEnum
CREATE TYPE "HealthCategory" AS ENUM ('IMPACT_METRICS', 'ACTION_VERBS', 'ATS_COMPLETENESS', 'CONTENT_DEPTH');

-- CreateEnum
CREATE TYPE "HealthSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "HealthTargetKind" AS ENUM ('WORK_EXPERIENCE_BULLET', 'WORK_EXPERIENCE', 'PROFILE_SUMMARY', 'PROFILE_CONTACT', 'PROFILE_SKILLS', 'PROFILE_EDUCATION', 'PROFILE_GENERAL');

-- CreateTable
CREATE TABLE "resume_health_audits" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "rule_set_version" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_health_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_health_suggestions" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "audit_id" TEXT,
    "category" "HealthCategory" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "rationale" TEXT NOT NULL,
    "target_kind" "HealthTargetKind" NOT NULL,
    "target_id" TEXT,
    "target_index" INTEGER,
    "target_field" VARCHAR(64),
    "original_text" TEXT NOT NULL,
    "proposed_text" TEXT,
    "status" "HealthSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "is_ai_stale" BOOLEAN NOT NULL DEFAULT false,
    "fingerprint" VARCHAR(64) NOT NULL,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_health_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resume_health_audits_profile_id_key" ON "resume_health_audits"("profile_id");

-- CreateIndex
CREATE INDEX "resume_health_suggestions_profile_id_status_idx" ON "resume_health_suggestions"("profile_id", "status");

-- CreateIndex
CREATE INDEX "resume_health_suggestions_audit_id_idx" ON "resume_health_suggestions"("audit_id");

-- CreateIndex
CREATE UNIQUE INDEX "resume_health_suggestions_profile_id_fingerprint_key" ON "resume_health_suggestions"("profile_id", "fingerprint");

-- AddForeignKey
ALTER TABLE "resume_health_audits" ADD CONSTRAINT "resume_health_audits_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_health_suggestions" ADD CONSTRAINT "resume_health_suggestions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_health_suggestions" ADD CONSTRAINT "resume_health_suggestions_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "resume_health_audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
