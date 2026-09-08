# Gateless, local-first learner architecture

## Product boundary

Ordinary learning is public: catalogue discovery, pathway and topic pages,
published lessons, ordinary topic practice, explanations, local lesson
completion, bookmarks and My Progress. An account protects and synchronises
that learning; it does not grant permission to learn.

Identity remains required for named certificates, cross-device sync, account
recovery, account dashboards, spaced-review scheduling, daily/gamification
records, saved diagnostic placement, organisation/partner reporting and admin
operations.

## Storage strategies

The learning UI uses `LocalLearnerProgressStore` for device-first writes and
`CloudLearnerProgressStore` for account persistence. Local writes complete
before a cloud sync is attempted.

IndexedDB database: `adultedu-learner`, schema version 1.

| Store | Key | Purpose |
| --- | --- | --- |
| `learner` | `id` | Non-identifying `learner_local_*` installation ID, schema metadata, and last successful backup/sync times |
| `lessonProgress` | `lessonId` | Current position, completion and curriculum context |
| `pathwayProgress` | `trackId` | Resume route, completed lesson IDs and practice count |
| `quizAttempts` | `id` | Stable, idempotent attempts and feedback |
| `bookmarks` | `itemId` | Saved learning links and deletion tombstones |
| `preferences` | `key` | Reading/display preferences |
| `activity` | `id` | Recent local learning events |
| `syncMetadata` | `key` | Last verified account sync |

The anonymous ID contains no name, email, IP address, device fingerprint or
advertising identifier. Small display-preference keys are mirrored in
`localStorage` for immediate page rendering; meaningful learner state lives in
IndexedDB.

On the server, existing `Enrollment` and `Attempt` records remain authoritative
and unchanged. The additive `LearnerState` model stores lesson completion,
bookmarks, preferences, resume state and activity for account sync. Attempts
are normalised into the existing `Attempt` table so all historical progress
calculations remain backwards-compatible.

## Transactional guest-to-account merge

1. Read and validate the local versioned export.
2. Authenticate and fetch existing cloud state and attempts.
3. Canonicalise imported curriculum IDs against server records.
4. Merge local and cloud state inside one database transaction.
5. Insert attempts using their stable IDs with duplicate skipping.
6. Upsert any required enrolments without changing existing enrolments.
7. Persist the merged non-attempt snapshot.
8. Return the verified merged cloud export.
9. Only then import the result locally and mark it synced.

Any network, authentication or database failure leaves the device record
available for retry. Account-bound local learning data is cleared only during
an explicit logout and only after a verified final cloud merge. This prevents
the next guest on a shared device from seeing the previous account's learning
record. Display preferences are retained because they describe the device, not
the learner.

Conflict policy:

- Lesson completion: completed wins over incomplete.
- Pathway completion: union stable completed-lesson IDs; retain the newest
  valid current position and the largest known curriculum total.
- Attempts: union by stable attempt ID; server rows are never overwritten.
- Bookmarks: newest record wins; removals use tombstones so deleted bookmarks
  do not reappear.
- Preferences during guest migration: an explicit account preference wins;
  authenticated preference changes use the account-preference endpoint.
- Activity: union by stable event ID.

## Resilience and public content

Previously saved progress is never reset by API failures. Public catalogue,
topic and lesson GET responses may use a seven-day service-worker runtime cache;
auth, progress and all personal/mutating endpoints remain network-only.

The learner UI reports whether progress is persistently saved in IndexedDB or
is using the in-memory fallback available when browser storage is restricted.
Successful export and cloud merge times are stored as
`lastSuccessfulBackupAt` and `lastSuccessfulSyncAt`.

Cloudflare Pages builds include `CF_PAGES_COMMIT_SHA` in the public curriculum
cache name, so each deployment stops serving earlier curriculum responses.
Other build systems must bump `VITE_CURRICULUM_CACHE_VERSION` when the public
curriculum content contract or schema changes. `cleanupOutdatedCaches` removes
obsolete Workbox precaches; old runtime caches are not selected by the new
route configuration.

The observed historical `/tracks` generic error page cannot be reproduced on
the retained production deployment. Railway history for that deployment shows
HTTP 200 for every retained `/api/v1/tracks` request, and there is no matching
backend exception. The current client now validates that a successful response
is actually an array and uses the route-local retry state rather than allowing
a malformed payload to reach rendering.
