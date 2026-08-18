-- Learner feedback loop for live questions.
CREATE TABLE "question_reports" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_id" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "question_reports_status_created_at_idx"
ON "question_reports"("status", "created_at");

CREATE INDEX "question_reports_question_id_status_idx"
ON "question_reports"("question_id", "status");

CREATE INDEX "question_reports_user_id_question_id_created_at_idx"
ON "question_reports"("user_id", "question_id", "created_at");

ALTER TABLE "question_reports"
ADD CONSTRAINT "question_reports_question_id_fkey"
FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_reports"
ADD CONSTRAINT "question_reports_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
