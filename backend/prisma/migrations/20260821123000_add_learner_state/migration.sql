-- Additive storage for lesson completion, bookmarks, preferences, recent
-- position and sync metadata. Existing enrolments and attempts are untouched.
CREATE TABLE "learner_states" (
    "user_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_states_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "learner_states"
ADD CONSTRAINT "learner_states_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
