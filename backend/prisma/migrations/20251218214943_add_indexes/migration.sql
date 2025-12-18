-- CreateIndex
CREATE INDEX "attempts_user_id_question_id_idx" ON "attempts"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "attempts_user_id_created_at_idx" ON "attempts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "attempts_question_id_created_at_idx" ON "attempts"("question_id", "created_at");

-- CreateIndex
CREATE INDEX "questions_topic_id_is_published_created_at_idx" ON "questions"("topic_id", "is_published", "created_at");

-- CreateIndex
CREATE INDEX "review_items_user_id_due_date_idx" ON "review_items"("user_id", "due_date");

-- CreateIndex
CREATE INDEX "topics_track_id_sort_order_idx" ON "topics"("track_id", "sort_order");
