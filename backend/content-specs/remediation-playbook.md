# Published-question remediation

The batch tool is deliberately read-only unless `--apply` is present. It never
sets `isPublished` and every learner-facing edit is marked `in_review`.

Run it from `backend/`:

```bash
# Full inventory; no database writes
npm run questions:remediate -- --mode=audit --out=/tmp/adultedu-audit.json

# Preview only representation-safe answer normalisation
npm run questions:remediate -- --mode=normalise --track=gcse-maths

# Apply only those representation-safe changes, with a version check
npm run questions:remediate -- --mode=normalise --apply

# Ask the local model for proposals for semantic-review candidates
LLM_API_URL=http://192.168.0.165:1234 \
LLM_MODEL=qwen/qwen3.8-27b \
npm run questions:remediate -- --mode=propose --limit=25 --out=/tmp/adultedu-proposals.json

# Apply only validated proposals whose database version has not changed
npm run questions:remediate -- --mode=apply-proposals \
  --file=/tmp/adultedu-proposals.json --apply
```

Proposal mode is intentionally separate from apply. A model outage, invalid
JSON response, changed option count, duplicate options, embedded A/B/C/D list,
or changed database version causes a skip rather than a write. A human can
review the JSON proposal file before applying it.

## Batch source/objective metadata

The remaining legacy queue is mostly missing item-level source and curriculum
metadata. Generate constrained proposals in topic batches; the model can only
select a source from `legacy-source-objective-plan-2026-08-17.json` and an
outcome already linked to the question's topic:

```bash
LLM_API_URL=http://192.168.0.165:1234 \
LLM_MODEL=qwen/qwen3.8-27b \
npm run content:propose-metadata -- --limit=100 --batch-size=10 \
  --out=content-specs/question-metadata-proposals-2026-08-17.json
```

This is still a proposal report. Set `approved: true` only after checking the
question against the cited source, then apply those records explicitly:

```bash
npm run content:propose-metadata -- --apply-approved \
  --file=content-specs/question-metadata-proposals-2026-08-17.json
```

Application uses `id + version + isPublished` guards, records the checked date,
keeps the question `in_review`, and never publishes or marks a question
approved. Rows without a defensible linked outcome remain `needs_human`.

For legacy tracks with a checked subject/topic map, the deterministic pass avoids
slow model calls and still writes a review report first:

```bash
node scripts/propose-question-metadata.js \
  --input=/path/to/production-queue.json \
  --deterministic \
  --out=content-specs/topic-map-proposals.json
```

Those rows are marked `topic-map-verified` in `sourceMeta` after consistency
checking; they remain `in_review` and cannot be approved or published until the
normal factual/editorial approval is complete. The current map is
`legacy-topic-objectives-2026-08-17.json`.
