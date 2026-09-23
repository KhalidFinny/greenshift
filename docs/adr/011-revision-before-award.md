# ADR 011: A bid is awarded only once its revisions are done

Status: accepted (2026-09-23, owner request).

## Context

A tender's verdict had two ways to be given and one of them could be given too
early. `reviewBid` asked for a revision by opening a negotiation round
(`PENDING_VENDOR_RESPONSE`) and moving the bid to `revision`; `awardBid` accepted
a bid and rejected the rest, checking only that the tender was closed. Nothing
connected the two, so the company could award a bid the vendor was still
revising: the vendor's screen then showed a proposal that was `accepted` next to
a round still asking them to answer, and its "action required" count kept asking
for an answer to a tender that had already been decided.

The negotiation statuses `AGREED` and `LOCKED` existed in the schema, the vendor's
card rendered both, and no code ever wrote either. Every round therefore stayed
`PENDING_VENDOR_RESPONSE` or `SUBMITTED_BY_VENDOR` for the life of the project.

## Decision

**1. An open round holds the bid.** `awardBid` refuses while the chosen bid has a
round in `PENDING_VENDOR_RESPONSE` (`awardBid` -> `revision_open`, answered as
`409 INVALID_STATE` with the reason). The bid is mid-revision: accepting it would
take terms neither side has settled.

**2. `reviewBid` refuses a second round while one is open** (`revision_pending`),
so the vendor is never two asks behind. Rejecting a bid stays possible, because
rejecting is the company withdrawing the ask.

**3. Deciding a bid closes its rounds.** The winner's rounds become `AGREED`; the
bids turned down become `LOCKED`, and so does a bid that is rejected. Both
surfaces then read the truth: the vendor's card shows "Agreed" on the deal they
won and stops offering a response, and its action-required count drops.

**4. The business screen states the wait instead of offering a button that can
only fail.** While a bid has an open round, "Accept & award" and "Ask for a
revision" are disabled and a line names the round it is waiting on; the controls
re-enable when the vendor answers.

## Consequences

- A tender can no longer be awarded around an unfinished revision, which is what
  "not awarded or accepted until it is all done" means on both surfaces.
- The vendor's card renders a response control only on an open round inside the
  limit. An `AGREED` round shows its badge and nothing to press; a lapsed one
  says whether it lapsed by the three-round limit or because the tender was
  decided.
- Rounds stored before this change keep their old status until the bid they
  belong to is decided, at which point they close with it.
