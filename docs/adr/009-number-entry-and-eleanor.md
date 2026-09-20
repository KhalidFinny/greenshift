# ADR 009: Number entry, field limits, and Eleanor

Status: accepted (2026-09-20, owner request).

Covers how numeric fields behave across the submission wizard, and the risk
analyst on the review step.

## 1. Number entry

1. `NumberField` (`packages/ui/src/components/form/form.tsx`) is the only numeric
   control in the product, and it now owns three behaviours rather than leaving
   them to each call site:
   - **Sanitising.** A number field takes numbers. `inputMode="numeric"` strips
     everything but digits; the decimal modes keep digits, dots and commas. Stray
     text can no longer be typed into a numeric field and then rejected later.
   - **Grouping.** On blur the entry is regrouped in the Indonesian convention:
     dots group the integer part in threes and a comma starts the decimals. The
     resolution matches `parseIdNumber` exactly, including the ambiguous case, so
     `12.500` reads as twelve thousand five hundred while `0.85` becomes `0,85`
     and both still parse to the number the user typed. Integer-only fields group
     as the user types, since a dot there is never a decimal point.
   - **Limits.** `min`/`max` pass through to the input as HTML attributes, and
     the rule sets in `lib/validators.ts` remain the enforcement: the percentage
     target is 0-100 and the tenor 1-30, both refused by the step gate with a
     message that names the range.
2. Grouping is display only. The form value stays the string the user typed, the
   payload still parses at the edge, and a resumed draft is still shown back
   through `formatField`. Nothing about the wire format changes.

## 2. Eleanor

3. The written reading of a risk assessment is attributed to Eleanor, and is a
   property of the submitted record rather than something recomputed per view.
   It is stored on `risk_assessments` (`insight`, `insight_source`) beside the
   figures it was written about, and travels with the assessment in
   `BusinessRisk.insight`.
4. **One model call per project, ever.** A read of `GET
   /api/business/projects/:id/risk` serves the stored reading when the row has
   one and composes it from the figures when it does not, so a read never waits
   on a model. When the row is empty the handler also schedules the model call
   with `executionCtx.waitUntil`, which fills the row for the next read. A
   project nobody ever looks at costs nothing, and a row that has any reading is
   never written again, so a failure is not retried on every view.
5. The submission wizard makes no model call at all. It derives its risk preview
   from the form values, and `insight` is absent there, so the review step shows
   the payload's own composed prose and Eleanor appears once the project exists.
   The endpoint that previously served the live preview
   (`POST /api/business/risk-insight`) is deleted rather than left unused.
6. Two paths write the text and the source is reported with it:
   - **Workers AI** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`), bound as `AI`
     in `wrangler.jsonc`. The prompt receives the assessment as a brief, not as
     raw JSON, so the model reasons about the figures instead of echoing field
     names back, and it is told to invent nothing.
   - **The composed analyst** (`composeInsight`), which writes the same reading
     from the same figures. It is the answer when the binding is absent or the
     provider fails, and it is also what a first read is served while the model
     call runs, so a reader never meets a spinner or an empty panel. An area is
     only described as a pressure when the scoring model actually banded it as
     one, which keeps the prose from arguing with the number beside it.
7. Model answers are cached in KV for an hour, keyed on the assessment's own
   figures, so the background write is cheap even if a project is read in
   parallel from two places.
8. Eleanor states only what the assessment holds. She is given the four area
   percentages, the band, the flagged factors and the standing mitigations, and
   the composed path cannot write a sentence that does not trace back to one of
   them.
