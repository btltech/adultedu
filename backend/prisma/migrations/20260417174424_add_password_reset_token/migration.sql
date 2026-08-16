/*
  Warnings:

  - A unique constraint covering the columns `[password_reset_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_expiry" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" TEXT;

-- CreateTable
CREATE TABLE "definitions" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "pos" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "examples" TEXT,
    "ipa" TEXT,
    "etymology" TEXT,
    "synonyms" TEXT,
    "antonyms" TEXT,
    "tags" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "definitions_word_key" ON "definitions"("word");

-- CreateIndex
CREATE INDEX "definitions_word_idx" ON "definitions"("word");

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");
