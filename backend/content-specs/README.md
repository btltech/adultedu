# Local content rebuild blueprints

These files define bounded, source-backed draft units for the local LM Studio
workflow. They do not create database records, change live content, or grant
publication approval. Generated bundles are ignored in `backend/exports/drafts/`.

## Completed source blueprints

| Subject | Level | Units | Primary source | Draft status |
| --- | --- | ---: | --- | --- |
| Functional Skills English | Level 1 | 15 | DfE English Functional Skills subject content | 15 reviewed local drafts |
| Functional Skills Maths | Level 1 | 12 | DfE Maths Functional Skills subject content | 12 reviewed local drafts |
| Essential Digital Skills | Level 1 | 18 | DfE Essential digital skills standards: 2026 | 18 reviewed local drafts; complete |

## Rebuild order

1. Rebuild GCSE and A-level preparation tracks only after a subject-specific
   specification/source map has been checked.
2. Rebuild technical tracks from current primary documentation: Python, C++, AWS,
   Microsoft Office and introductory AI.
3. Rebuild Financial Literacy from current FCA and MoneyHelper material with dated
   sources and scheduled reviews.
4. Review Life in the UK separately against official GOV.UK material; do not use
   unverified or copied handbook questions.

Every unit follows the same rule: generation creates an unpublished local draft;
structural validation and editorial review are required before any later import or
admin approval.

## Legacy bank metadata remediation

The published bank has been processed by the guarded batch pipeline in
`../scripts/propose-question-metadata.js`. Source URLs and curriculum objectives
are now present on all 8,301 published questions in Railway; 5,306 rows carry
`topic-map-verified` provenance after consistency checking, while all rows remain
`in_review` until their normal editorial approval. The subject/topic map used for that batch is
[`legacy-topic-objectives-2026-08-17.json`](./legacy-topic-objectives-2026-08-17.json).

This metadata pass never changes `isPublished`. The full post-batch evidence is
in [`live-audit-post-metadata-2026-08-17.json`](./live-audit-post-metadata-2026-08-17.json).

## Remaining rebuild scope

The expanded, source-mapped scope is recorded in
[`expanded-rebuild-roadmap.json`](./expanded-rebuild-roadmap.json). It proposes 144
additional units across GCSE subjects, A-Level Maths, technical tracks, Financial
Literacy and Life in the UK. That is a planning estimate; each stream becomes an
approved blueprint before generation starts, so the count may change during source
mapping.

GCSE Maths now has an approved eight-unit blueprint and **8/8 validated local drafts**;
the drafts remain unpublished. GCSE English Language now has a seven-unit blueprint
and **7/7 validated local drafts**, also unpublished.
