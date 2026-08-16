-- Preserve existing learner-facing questions as legacy content. They remain live,
-- but any future publish or edit to a live question must meet the review gate.
ALTER TABLE "questions"
ADD COLUMN "source_url" TEXT,
ADD COLUMN "source_title" TEXT,
ADD COLUMN "source_checked_at" TIMESTAMP(3),
ADD COLUMN "curriculum_objective" TEXT,
ADD COLUMN "content_risk" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN "review_status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN "reviewed_by" TEXT,
ADD COLUMN "reviewed_at" TIMESTAMP(3),
ADD COLUMN "review_due_at" TIMESTAMP(3);

UPDATE "questions"
SET "review_status" = 'legacy'
WHERE "is_published" = true;

CREATE INDEX "questions_review_status_review_due_at_idx"
ON "questions"("review_status", "review_due_at");
