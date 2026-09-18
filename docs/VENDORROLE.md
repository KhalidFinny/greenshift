# GreenShift — Vendor Role Specification

> **Document purpose:** Define the Vendor experience, pages, user flows, business rules, and functional requirements for the GreenShift Vendor role.

---

# 1. Vendor Role Overview

The **Vendor** represents a verified Green Technology Vendor, primarily an EPC/ESCO company that provides green infrastructure installation and related services.

The Vendor uses GreenShift to:

1. Complete company verification.
2. Discover available green-energy projects.
3. Receive project recommendations.
4. Understand why a project matches their company.
5. Participate in procurement/tender processes.
6. Submit technical and commercial proposals.
7. Participate in negotiation.
8. Manage awarded projects.
9. Update project progress through milestones.
10. Submit project evidence.
11. Monitor project performance.
12. Maintain their company profile, certifications, portfolio, and performance history.

The Vendor's main objective is:

> **Manage all my tenders and active green-energy projects from one dashboard.**

The Vendor experience should therefore prioritize **tenders, proposals, negotiations, and active projects**.

---

# 2. Vendor Lifecycle

The high-level Vendor lifecycle is:

```text
Register
   ↓
Complete Company Profile
   ↓
Upload Verification Documents
   ↓
Automatic Document Verification
   ↓
Verified / Rejected
   ↓
Browse Projects
   ↓
Receive Recommendations
   ↓
Participate in Tender
   ↓
Submit Bid / Proposal
   ↓
Evaluation
   ↓
Rank 1
   ↓
Negotiation
   ↓
Deal / Agreement
   ↓
Project Activation
   ↓
Milestone-Based Project Progress
   ↓
Company Approval
   ↓
Project Completion
   ↓
Performance Data Updated
```

---

# 3. Vendor Verification

## 3.1 Registration

Vendor registration is self-service.

The Vendor can create an account directly from the authentication page.

Initial state:

```text
Unverified Vendor
```

After registration, the Vendor must complete their company information and verification documents.

---

## 3.2 Verification Information

The Vendor should provide:

### Company Information

* Company name
* Company description
* Company address
* Contact email
* Contact phone
* Website
* Company representative
* Business category / service category

### Legal Information

* NIB
* NPWP
* Business/legal registration document
* Other relevant legal documents

### Industry Certification

Examples:

* ESCO certification/license
* ISO certifications
* Other relevant green-energy certifications

### Portfolio

The Vendor must provide previous project information.

Each portfolio item should support:

* Project name
* Client/company
* Project type
* Location
* Project description
* Project value
* Project duration
* Services provided
* Energy-saving result
* Carbon-reduction result
* Completion status
* Supporting documents/images

Portfolio information becomes part of the Vendor's performance and matchmaking data.

---

# 4. Automatic Verification

There is **no Admin role required for Vendor verification**.

The system automatically evaluates uploaded documents.

Conceptual flow:

```text
Vendor uploads document
        ↓
Document validation
        ↓
Document extraction / verification
        ↓
System evaluates requirements
        ↓
 ┌───────────────┐
 │               │
Verified      Rejected
```

Possible statuses:

```text
NOT_VERIFIED
VERIFYING
VERIFIED
REJECTED
```

If rejected, the Vendor should be shown:

* Which document caused the rejection
* Reason for rejection
* Required correction
* Upload/re-submit action

The Vendor should not be able to access restricted tender actions while unverified.

---

# 5. Verification Permissions

## Unverified Vendor

Can:

* View dashboard
* View public company profile
* Browse projects
* View project information
* View matchmaking information
* View project risk information
* View tender information
* Receive recommendations

Cannot:

* Submit bids
* Submit proposals
* Enter negotiation
* Win a tender
* Start an awarded project

Primary CTA:

> Complete Verification

---

## Verified Vendor

Can:

* Participate in Open Bidding
* Participate in Closed Bidding
* Accept Direct Vendor Selection invitations
* Submit proposals
* Revise Open Bids before deadline
* Negotiate
* Upload proposal documents
* Manage awarded projects
* Update milestones
* Upload project evidence
* View performance data

---

# 6. Vendor Information Architecture

The Vendor navigation should contain:

```text
Vendor
│
├── Dashboard
│
├── Projects
│   ├── All Projects
│   ├── Recommended
│   └── Saved
│
├── Tenders
│   ├── Active Tenders
│   ├── My Proposals
│   ├── Negotiation
│   └── Completed Tenders
│
├── Active Projects
│   ├── All Projects
│   └── Project Detail
│
├── Portfolio
│
├── Performance
│
├── Notifications
│
└── Settings
    ├── Company Profile
    ├── Verification
    ├── Certifications
    ├── Documents
    └── Notification Preferences
```

---

# 7. Vendor Dashboard

The Dashboard is the Vendor's primary workspace.

The Vendor should immediately understand:

* What tenders require action?
* What projects are active?
* What deadlines are approaching?
* What proposals are being evaluated?
* What negotiations require a response?
* What milestones need updating?
* Whether the company is verified.

---

## 7.1 Dashboard Structure

Recommended sections:

```text
Welcome / Vendor Information
Verification Status

Key Metrics
- Active Tenders
- Active Projects
- Submitted Proposals
- Completed Projects

Tenders Requiring Action

Upcoming Deadlines

Recommended Projects

Active Projects

Recent Notifications
```

---

# 8. Dashboard Metrics

Recommended metrics:

### Active Tenders

Number of tenders currently available to the Vendor.

### Active Projects

Number of projects currently being executed.

### Submitted Proposals

Number of proposals currently submitted.

### Completed Projects

Number of completed projects.

### Verification Status

Example:

```text
Verified ✓
```

or:

```text
Verification Required
```

---

# 9. Tenders Requiring Action

This section should prioritize tasks.

Examples:

```text
Open Bidding
Solar Energy Efficiency Project
Ends in 02:31:42

[View Tender]
```

```text
Negotiation Request
Industrial Energy Retrofit
Revision 2 of 3

[Respond]
```

```text
Milestone Update
Factory HVAC Optimization
Milestone 03 requires update

[Update Progress]
```

---

# 10. Project Discovery

The Vendor can see **all available projects**, not only recommended projects.

Project discovery should contain:

```text
All Projects
Recommended
Saved
```

---

# 11. Project Cards

Each project card should show relevant information such as:

* Project name
* Company/client
* Project category
* Location
* Estimated project value
* Client budget
* Carbon reduction target
* Project status
* Procurement method
* Match score
* Tender deadline

Example:

```text
Solar Energy Retrofit
PT Example Industri

Technical Fit       94%
Experience           88%
Performance          91%
Price & Value        83%
Project Risk         86%

Overall Match        89%

Open Bidding
Ends in 1d 08h

[View Project]
```

---

# 12. Smart Vendor Matchmaking

GreenShift uses Vendor Matchmaking based on:

1. Technical Fit
2. Relevant Experience
3. Historical Performance
4. Price & Value
5. Project Risk

The Vendor **must be able to see why they were matched**.

Do not show only:

> Match Score: 89%

Instead provide an explanation.

Example:

```text
Why this project matches you

Technical Fit             94%
Your company has experience
with industrial solar systems.

Relevant Experience       88%
You have completed 7 similar projects.

Historical Performance    91%
Your previous projects show
strong completion performance.

Price & Value              83%
Your historical pricing is
competitive for this project type.

Project Risk               86%
Your experience reduces
implementation risk.
```

---

# 13. Project Detail Page

The Vendor can access comprehensive project information.

Recommended sections:

```text
Project Overview
Company / Client
Project Scope
Technical Requirements
Budget
Carbon Reduction Target
Project Timeline
Project Risk Assessment
Required Deliverables
Procurement Method
Tender Information
Documents
Matchmaking Analysis
```

---

# 14. Client Visibility

The Vendor can see the identity of the Company/client.

The Vendor can also access project documents made available for the tender.

There is no requirement for anonymous project participation.

---

# 15. Project Risk Assessment

The Vendor can view the Project Risk Assessment.

The Vendor must **not be able to modify it**.

Example:

```text
Project Risk

Overall Risk: Medium

Financial Risk       Low
Technical Risk       Medium
Implementation Risk  Medium
Operational Risk     Low

[View Risk Analysis]
```

---

# 16. Procurement Methods

GreenShift supports exactly three procurement methods:

```text
OPEN BIDDING
CLOSED BIDDING
DIRECT VENDOR SELECTION
```

---

# 17. Open Bidding

Open Bidding is transparent.

Competitor bid information is visible.

The Vendor can see:

* Current lowest price
* Competitor names
* Competitor current prices
* Their own current bid
* Remaining auction time

The Vendor cannot see historical bid revisions.

Example:

```text
Current Ranking

1. Vendor A      Rp 1.18B
2. Your Company  Rp 1.21B
3. Vendor C      Rp 1.25B

Time Remaining
02:14:32
```

If Vendor A changes their bid:

```text
Vendor A      Rp 1.15B
```

the Vendor sees only the **new current state**, not:

```text
Vendor A
1.18B
1.16B
1.15B
```

Historical bid revisions are not displayed.

---

# 18. Open Bidding Revision

A Vendor can revise their Open Bid while the bidding deadline has not passed.

Example:

```text
Your Current Bid
Rp 1.210.000.000

Current Lowest
Rp 1.180.000.000

[Revise Bid]
```

After the deadline:

```text
Bidding Closed
```

No further bid revisions are allowed.

---

# 19. Closed Bidding

Closed Bidding is blind.

The Vendor:

* Cannot see competitor bids
* Cannot see competitor prices
* Can see how many Vendors are participating
* Can submit only once
* Cannot revise the bid after submission

Example:

```text
Closed Bidding

Participants
7 Vendors

Your Bid
Rp 1.210.000.000

Status
Submitted ✓
```

Do not expose competitor prices.

---

# 20. Direct Vendor Selection

Direct Vendor Selection is a private 1-on-1 invitation.

The Company selects a specific Vendor.

The Vendor receives:

```text
You have been invited to a project.

[Accept Invitation]
[Reject]
```

---

## 20.1 Accept Invitation

If accepted:

```text
Invitation Accepted
       ↓
Submit Proposal
       ↓
Negotiation
       ↓
Agreement
```

The Vendor does not compete against other Vendors.

---

## 20.2 Reject Invitation

If rejected:

```text
Invitation
    ↓
Rejected
```

The project does not enter the Vendor's negotiation flow.

---

# 21. Proposal Submission

The proposal should be structured rather than relying only on a PDF.

Recommended fields:

## Executive Summary

* Proposal summary
* Proposed approach

## Technical Solution

* Proposed technology
* Technical architecture/solution
* Implementation methodology
* Equipment/material specifications
* Technical assumptions

## Project Scope

* Included scope
* Excluded scope
* Deliverables

## Timeline

* Estimated start date
* Estimated duration
* Implementation phases

## Cost

* Equipment/material cost
* Installation cost
* Labor cost
* Operational cost
* Other costs
* Total proposed price

## Impact

* Expected energy savings
* Expected carbon reduction
* Expected ROI improvement

## Warranty

* Warranty duration
* Warranty coverage
* Maintenance/support

## Supporting Document

* Proposal PDF

---

# 22. Proposal Rules

### Open Bidding

Proposal/bid can be revised before the bidding deadline.

### Closed Bidding

Proposal can only be submitted once.

No revision after submission.

### Direct Selection

Proposal cannot be freely revised after submission.

Revision is possible only when the Company explicitly requests a revision during negotiation.

---

# 23. Proposal Status

Recommended statuses:

```text
DRAFT
SUBMITTED
UNDER_EVALUATION
RANKED
SELECTED
NEGOTIATION
AGREED
REJECTED
CLOSED
```

---

# 24. Tender Evaluation

When the tender deadline is reached:

```text
OPEN
  ↓
EVALUATION
```

The system evaluates Vendor submissions.

The system determines the Rank 1 candidate(s).

---

# 25. Multiple Rank 1 Candidates

If only one Vendor becomes Rank 1:

```text
Evaluation
    ↓
One Rank 1 Vendor
    ↓
Absolute Winner
    ↓
Negotiation
```

The Vendor automatically proceeds to negotiation.

If multiple Vendors become Rank 1:

```text
Evaluation
    ↓
Multiple Rank 1 Vendors
    ↓
System informs Company
    ↓
Company manually selects one Vendor
    ↓
Selected Vendor
    ↓
Negotiation
```

The system does **not** automatically select a winner when there are multiple Rank 1 candidates.

The Vendor should see an appropriate state such as:

```text
You are one of the Rank 1 candidates.

The Company is currently making
the final Vendor selection.
```

---

# 26. Negotiation

Negotiation uses a **structured revision system**, not a generic chat interface.

The Company can request a revision.

Each Company revision request counts as one iteration.

Example:

```text
Company → Vendor
Revision Request #1

Vendor → Company
Response / Revised Proposal
```

Then:

```text
Company → Vendor
Revision Request #2

Vendor → Company
Response / Revised Proposal
```

Then:

```text
Company → Vendor
Revision Request #3

Vendor → Company
Final Response
```

After the third revision:

```text
LOCKED
```

No additional revision requests are allowed.

---

# 27. Negotiable Fields

Recommended negotiable fields:

* Price
* Technical specification
* Scope
* Timeline
* Warranty
* Maintenance/support
* Payment terms
* Expected ROI
* Expected energy savings
* Expected carbon reduction

The Company should explicitly identify which fields require revision.

---

# 28. Negotiation UI

Example:

```text
Negotiation — Revision 2 / 3

Company Request

☑ Reduce total project cost
☑ Extend warranty
☐ Change implementation timeline

Current Proposal
Rp 1.200.000.000

Requested
Rp 1.150.000.000

Vendor Response

Price
Rp 1.165.000.000

Warranty
5 years → 7 years

[Submit Revision]
```

After submission:

```text
Revision 2 submitted ✓
Waiting for Company response
```

---

# 29. Negotiation Completion

When both parties agree:

```text
Negotiation
    ↓
Agreed
    ↓
Next Project Process
```

The proposal becomes locked.

The Vendor cannot modify the agreed proposal.

---

# 30. Contract / Agreement

The Vendor role does not handle:

* Bond issuance
* Investor sales
* Securities distribution
* Escrow management

Those processes are handled by external parties.

The Vendor workflow only needs to represent the transition:

```text
Negotiation Agreed
       ↓
Agreement / Contract
       ↓
Project Active
```

If a contract/agreement screen is required, it should focus on:

* Agreement status
* Project scope
* Agreed price
* Timeline
* Warranty
* Deliverables
* Parties
* Supporting documents

---

# 31. Active Projects

Once a Vendor has been selected and the agreement is completed, the project becomes active.

Each project should display:

* Project name
* Company
* Overall progress
* Current milestone
* Deadline
* Project status
* Latest update
* Outstanding actions

---

# 32. Milestone-Based Progress

Project progress is milestone-based.

Milestones should be determined **jointly by Company and Vendor** based on the agreed project scope and implementation plan.

Recommended process:

```text
Proposal / Scope
      ↓
Company + Vendor define milestones
      ↓
Milestones confirmed
      ↓
Project begins
      ↓
Vendor updates milestones
      ↓
Company reviews
```

The Vendor cannot unilaterally redefine the project's agreed milestones.

---

# 33. Example Milestones

For an energy retrofit project:

```text
01 — Site Assessment
02 — Equipment Procurement
03 — Installation
04 — Testing & Commissioning
05 — Performance Verification
06 — Project Completion
```

Different projects can have different milestones.

---

# 34. Milestone Progress

Each milestone contains:

* Milestone name
* Description
* Start date
* Due date
* Completion percentage
* Status
* Evidence
* Vendor notes
* Company review status

Statuses:

```text
NOT_STARTED
IN_PROGRESS
SUBMITTED_FOR_REVIEW
APPROVED
REVISION_REQUIRED
COMPLETED
```

---

# 35. Milestone Evidence

The Vendor should be able to submit:

* Photos
* Videos
* Documents
* Inspection reports
* Completion reports
* Energy data
* Relevant certificates
* Notes

Each milestone can contain multiple evidence files.

---

# 36. Milestone Approval

The Company reviews Vendor milestone submissions.

Flow:

```text
Vendor updates milestone
       ↓
Vendor submits evidence
       ↓
SUBMITTED_FOR_REVIEW
       ↓
Company reviews
       ↓
 ┌────────────────────┐
 │                    │
Approved          Revision Required
 │                    │
 ↓                    ↓
Next Milestone    Vendor updates
```

The Vendor cannot approve their own milestone.

---

# 37. Active Project Progress

Example:

```text
Solar Energy Retrofit
PT Example Industri

Overall Progress
████████████░░░░ 72%

Current Milestone
Installation

Due
September 18, 2026

Milestones

✓ Site Assessment
✓ Procurement
✓ Installation
○ Testing
○ Verification
○ Completion

[Update Progress]
```

---

# 38. Post-Project Performance

The Vendor can view project performance after implementation.

Relevant metrics:

* Expected energy savings
* Actual energy savings
* Expected carbon reduction
* Actual carbon reduction
* Expected ROI
* Actual/projected ROI
* Project completion performance

Example:

```text
Project Performance

Energy Savings
Expected     20%
Actual       22%

Carbon Reduction
Expected     120 tCO₂e
Actual       128 tCO₂e

Project Completion
On Time ✓
```

---

# 39. Vendor Performance

Vendor performance is continuously updated.

Initial performance data comes from the Vendor's uploaded portfolio.

New actual project data can also be incorporated after projects are completed.

Therefore:

```text
Initial Portfolio
       +
Actual GreenShift Projects
       ↓
Updated Vendor Performance
       ↓
Future Matchmaking
```

This allows the matchmaking system to become more representative over time.

---

# 40. Vendor Performance Metrics

Recommended metrics:

* Project completion rate
* On-time completion rate
* Technical performance
* Energy-saving achievement
* Carbon-reduction achievement
* Average project value
* Relevant project experience
* Client approval rate
* Historical project performance

The Vendor can view their own performance.

---

# 41. Vendor Public Profile

Recommended Vendor profile:

## Company Overview

* Company name
* Verification badge
* Description
* Location
* Website
* Services

## Certifications

* ESCO certification
* ISO
* Other certifications

## Experience

* Years of experience
* Number of completed projects
* Relevant project categories

## Portfolio

Project information such as:

* Project name
* Client
* Project type
* Project value
* Energy impact
* Carbon impact
* Completion status

## Performance

Selected verified performance indicators.

---

# 42. Vendor Profile Editing

Vendor-editable:

* Company description
* Contact information
* Website
* Services
* Company representative
* Certifications
* Portfolio
* Supporting documents

System-derived fields should not be manually editable:

* Verification status
* Matchmaking score
* Performance score
* Completed project statistics
* GreenShift project results

---

# 43. Notifications

Vendor notifications should cover:

### Verification

* Verification started
* Verification successful
* Verification rejected
* Document requires correction

### Projects

* New recommended project
* New available project
* Project deadline approaching

### Tenders

* Tender invitation
* Open bidding started
* Bid ranking changed
* Tender deadline approaching
* Tender closed
* Evaluation completed

### Proposal

* Proposal submitted
* Proposal accepted
* Proposal rejected
* Proposal selected

### Negotiation

* New revision request
* Revision deadline
* Revision submitted
* Negotiation completed
* Negotiation locked

### Projects

* Project awarded
* Contract/agreement update
* Milestone deadline
* Milestone approved
* Milestone revision requested
* Project completed

---

# 44. Notification Center

Notifications should support:

```text
All
Unread
Tenders
Projects
Negotiation
System
```

Each notification should navigate directly to the relevant page.

---

# 45. Vendor Settings

Settings should include:

```text
Company Profile
Verification
Certifications
Portfolio
Documents
Notification Preferences
Security
Account
Logout
```

Security may include:

* Change password
* Active sessions
* OAuth connection if enabled

---

# 46. Vendor Restrictions

The Vendor must **never** be able to:

* Edit Company/client project information
* Edit Project Risk Assessment
* Edit Green Project Blueprint
* Access investor/private financial information
* Access private competitor proposals
* Access historical competitor bid revisions
* Modify system-generated matchmaking scores
* Modify system-generated performance scores
* Approve their own milestone
* Modify agreed proposal after negotiation lock
* Manage SCF escrow
* Manage investor money
* Issue bonds
* Sell bonds to investors
* Perform LVV GRK verification
* Perform overclaim verification
* Access Admin functions

---

# 47. Broker Role Boundary

The previous Investor role should be replaced by a **Broker** role.

The Broker is responsible for activities related to:

* Requesting required Company documents
* Preparing/handling bond issuance requirements
* Receiving periodic project reports
* Using those reports for their own investor-facing process

GreenShift itself does **not** handle the sale of bonds to investors.

The Vendor should therefore have no Investor-related workflow.

The Vendor only needs to provide project execution data and reports that become part of the project's reporting pipeline.

---

# 48. Monthly Reporting

Vendor project data should support monthly reporting.

The Vendor may contribute:

* Project progress
* Milestone completion
* Energy consumption data
* Energy-saving data
* Carbon reduction data
* Supporting evidence
* Project status
* Relevant project performance data

These reports can later be provided to the Broker.

The Vendor does not directly manage investor communication.

---

# 49. Vendor Page / Route Overview

The Vendor experience should contain the following main pages:

```text
Dashboard

Projects
├── All Projects
├── Recommended
└── Saved

Tenders
├── Active Tenders
├── My Proposals
├── Negotiation
└── Completed Tenders

Active Projects
├── Project List
└── Project Detail

Portfolio

Performance

Notifications

Settings
├── Company Profile
├── Verification
├── Certifications
├── Documents
└── Notification Preferences
```

The exact URL structure can follow the existing application structure.

---

# 50. Final Product Mental Model

The Vendor application should feel like:

> **A green-energy procurement and project execution workspace.**

The Vendor should not feel like they are using a generic marketplace.

The main mental model is:

```text
DISCOVER
   ↓
BID
   ↓
PROPOSE
   ↓
NEGOTIATE
   ↓
WIN
   ↓
EXECUTE
   ↓
REPORT
   ↓
BUILD PERFORMANCE
   ↓
GET BETTER MATCHES
```

The Vendor Dashboard is the center of this experience.

The most important information is therefore:

1. **What tender/project needs my attention?**
2. **What is the deadline?**
3. **What is my current position?**
4. **What do I need to submit/change?**
5. **What projects am I currently executing?**
6. **What is my project performance?**
