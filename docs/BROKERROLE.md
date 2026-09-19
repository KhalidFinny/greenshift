# GreenShift — Broker Role Specification

## 1. Role Overview

The **Broker** is a verified financial intermediary that handles the bond-related process for GreenShift projects.

The Broker enters the process **after a Company and Vendor have successfully matched and the project has been verified by LVV GRK**.

The Broker is not responsible for finding projects, selecting investment opportunities, managing Vendors, or managing GreenShift's project implementation.

The Broker's primary responsibility is to:

> **Prepare a verified GreenShift project for bond issuance, process the bond issuance and distribution outside GreenShift, and use GreenShift's ongoing project reports to support investor communication and monitoring.**

---

# 2. GreenShift Financial Boundary

GreenShift is **not a bond marketplace** and does not manage financial transactions between Brokers and Investors.

The following activities happen outside GreenShift:

* Bond issuance execution
* Bond sales
* Bond distribution to Investors
* Investor management
* Investor transactions
* Escrow management
* Fund management
* Secondary bond trading

GreenShift only maintains the project information and monitoring data needed to support the Broker.

Therefore:

```text
GreenShift
    │
    ├── Project preparation
    ├── Vendor + Company matchmaking
    ├── LVV GRK validation
    ├── Project monitoring
    └── Monthly project reporting
             │
             ▼
          Broker
             │
             ├── Bond preparation
             ├── Bond issuance
             ├── Bond distribution
             └── Investor communication
                    │
                    ▼
                 Investors
```

The actual financial transaction does not occur inside GreenShift.

---

# 3. Broker Entry Point

The Broker does not browse GreenShift projects and choose investment opportunities.

The expected project flow is:

```text
Company creates project
        ↓
Company + Vendor matchmaking
        ↓
Vendor proposal / project agreement
        ↓
Green Project Blueprint
        ↓
LVV GRK validation
        ↓
Project verified
        ↓
Company selects Broker
        ↓
Broker receives project assignment
```

Only a project that has successfully passed the required LVV GRK validation can proceed to the Broker stage.

---

# 4. Broker Assignment

The **Company chooses the Broker** after the project has passed LVV GRK validation.

The Broker does not compete for projects through a GreenShift marketplace.

Once selected:

```text
Company
   ↓
Select Broker
   ↓
Broker receives assignment
```

The Broker can then:

* Accept the assignment
* Request additional information
* Decline the assignment

The Broker does not approve or reject the underlying GreenShift project itself.

---

# 5. Declining an Assignment

A Broker may decline an assigned project if it cannot or does not want to proceed with the bond process.

Declining an assignment must require a reason.

Example:

```text
Decline Assignment

Reason:
[____________________________]

[Confirm Decline]
```

If the Broker declines:

```text
Broker declines
       ↓
Company is notified
       ↓
Company selects another Broker
       ↓
New Broker receives assignment
```

A declined assignment does **not** mean that the project failed.

It only means that the current Broker will not process it.

---

# 6. Broker Verification

Broker registration is self-service.

A Broker can create an account but must pass strict verification before receiving or processing projects.

The purpose of verification is to ensure that the Broker:

* Is a real legal entity
* Is legitimately operating
* Has the required financial/bond-related capability
* Can legally perform its stated role

Broker verification should follow the same general principle as Vendor verification:

```text
Self Registration
      ↓
Document Submission
      ↓
Automatic Verification
      ↓
Verification Result
      ↓
Verified / Failed
```

Verification should be primarily automated.

If verification fails, the Broker should receive a clear explanation and, where appropriate, be allowed to resubmit corrected information.

---

# 7. Broker Verification Information

The system should collect sufficient information to establish the Broker's legitimacy and capability.

Recommended information includes:

### Company Information

* Legal company name
* Company registration information
* Business address
* Contact information
* Website
* Authorized representative

### Financial / Regulatory Information

* Relevant licenses
* Financial-sector certifications or registrations
* Bond-related authorization where applicable
* Supporting legal documents

### Supporting Documents

The exact required documents may vary depending on the Broker's legal and operational requirements.

The system should therefore avoid assuming that every Broker requires exactly the same documents.

---

# 8. Broker Permissions

## Broker CAN

* View assigned verified projects
* View project information relevant to financing
* View Company information relevant to financing
* View Vendor information relevant to financing
* View LVV GRK verification
* View Project Risk Assessment
* View relevant project documents
* Request additional documents from Company
* Review submitted documents
* Approve submitted documents
* Reject submitted documents with a reason
* Accept project assignments
* Decline project assignments
* Track bond-processing status
* View monthly project reports
* Download monthly project reports
* View historical project reports
* View project progress and performance

## Broker CANNOT

* Create or modify Company projects
* Modify Company information
* Modify Vendor information
* Modify Vendor proposals
* Participate in Vendor tenders
* Modify Green Project Blueprint
* Modify LVV GRK validation
* Modify Project Risk Assessment
* Approve Vendor milestones
* Modify project milestones
* Modify official project performance data
* Modify official monthly reports
* Manage GreenShift funds
* Manage Investors inside GreenShift
* Sell bonds inside GreenShift
* Manage Investor transactions
* Manage escrow inside GreenShift

---

# 9. Broker Dashboard

The Broker's primary dashboard should focus on **assigned projects and actions requiring attention**.

The dashboard should prioritize:

### Key Metrics

Recommended metrics:

* Assigned Projects
* Documents Awaiting Review
* Outstanding Document Requests
* Projects in Bond Processing
* Projects Under Monitoring

These metrics should help the Broker immediately understand their current workload.

---

# 10. Dashboard Sections

Recommended dashboard structure:

```text
Broker Dashboard

Overview
├── Assigned Projects
├── Documents Awaiting Review
├── Outstanding Requests
└── Projects in Bond Processing

Assigned Projects
├── Recently Assigned
├── Document Collection
├── Under Review
├── Bond Processing
└── Monitoring

Document Requests
├── Pending
├── Submitted
└── Requiring Review

Monthly Reports
├── Latest Reports
└── Historical Reports
```

The most important section is:

> **Assigned Projects**

The Broker should not see an investment-opportunity marketplace.

---

# 11. Assigned Projects

The Broker should have a dedicated page containing projects assigned to them.

Each project should show relevant information such as:

* Project name
* Company
* Vendor
* Project location where relevant
* Project type
* Project value
* LVV GRK verification status
* Project risk status
* Current Broker status
* Bond status
* Last report date
* Outstanding document requests

The Broker should be able to open a project to view its complete financing-related information.

---

# 12. Information Visibility

The Broker should **not automatically receive every piece of information stored in GreenShift**.

Different Brokers may require different information for their bond-processing requirements.

Therefore:

> The Broker should have access to information relevant to the financing process and the documents/data required by that specific Broker.

The Broker can request additional information from the Company when required.

---

# 13. Project Detail

The Broker's project detail page should provide a complete financing context.

Recommended sections:

### Project Overview

* Project name
* Project description
* Project type
* Project location
* Project value
* Project timeline

### Parties

* Company
* Vendor

### Validation

* Green Project Blueprint status
* LVV GRK verification
* Validation information
* Validation documents

### Risk

* Project Risk Assessment
* Current risk level
* Identified risks

### Financial Information

Only relevant financial information should be shown.

### Project Performance

* Implementation progress
* Energy performance
* Environmental performance
* Financial performance
* ROI-related performance

### Documents

* Available project documents
* Broker requests
* Submitted documents
* Document status

---

# 14. Project Risk Assessment

The Broker can **view** the Project Risk Assessment.

The Broker cannot modify it.

The Risk Assessment belongs to the GreenShift project assessment process.

Example:

```text
Project Risk Assessment

Overall Risk: Medium

Financial Risk:       Medium
Technical Risk:       Low
Implementation Risk:  Medium
Environmental Risk:   Low
```

The Broker uses this information as part of its own financing assessment.

---

# 15. Document Request System

The Broker must be able to request additional documents from the Company.

This is one of the Broker's primary interactions with GreenShift.

The Broker should not be limited to a fixed list of documents because different Brokers may have different requirements.

The recommended request interface is:

```text
REQUEST DOCUMENT

Document type:
[ Financial Statement ]

Required period:
[ 2025 ]

Reason:
[ Required for bond issuance ]

Deadline:
[ 15 Sept 2026 ]

Additional notes:
[ ... ]

[Send Request]
```

---

# 16. Document Request Source

The Broker requests documents **from the Company only**.

If the required information actually belongs to the Vendor:

```text
Broker
   ↓
Company
   ↓
Vendor
   ↓
Company
   ↓
Broker
```

The Broker does not need to directly request documents from the Vendor.

This keeps the financial relationship centralized through the Company.

---

# 17. Document Type

The document request system should provide common document types to make requests easier.

Examples:

### Legal

* Company Deed
* Business License
* Legal Entity Documents

### Financial

* Financial Statement
* Revenue Information
* Debt Information
* Tax Documents

### Project

* Project Budget
* Project Financial Information
* Project Timeline

### Technical

* Technical Specifications
* Equipment Information
* Warranty Documentation

### Other

The Broker should also be able to select:

> **Other**

and describe a custom document requirement.

---

# 18. Document Request Status

Recommended document lifecycle:

```text
REQUESTED
    ↓
SUBMITTED
    ↓
UNDER REVIEW
    ├── APPROVED
    │
    └── REJECTED
            ↓
       RESUBMISSION
```

### REQUESTED

Broker has requested a document.

### SUBMITTED

Company has uploaded the requested document.

### UNDER REVIEW

Broker is reviewing the submission.

### APPROVED

Broker accepts the document.

### REJECTED

Broker does not accept the document and must provide a reason.

### RESUBMISSION

Company needs to submit a corrected or replacement document.

---

# 19. Document Rejection

If a Broker rejects a document, a reason is required.

Example:

```text
Document Rejected

Reason:
The submitted financial statement does not
cover the required financial period.

Status:
Resubmission Required
```

The Company should be able to upload a replacement document.

---

# 20. Broker Project Lifecycle

The recommended Broker-side lifecycle is:

```text
ASSIGNED
    ↓
DOCUMENT COLLECTION
    ↓
UNDER REVIEW
    ↓
READY FOR BOND ISSUANCE
    ↓
BOND ISSUANCE
    ↓
MONITORING
    ↓
COMPLETED
```

These statuses describe the Broker's process and should not be confused with the overall GreenShift project lifecycle.

---

# 21. ASSIGNED

The project has passed LVV GRK validation and the Company has selected the Broker.

The Broker must decide whether to proceed.

Available actions:

```text
[Accept Assignment]
[Request Information]
[Decline Assignment]
```

---

# 22. DOCUMENT COLLECTION

The Broker has accepted the assignment and is collecting any additional information required for the bond process.

The Broker can create document requests for the Company.

The project remains in this stage while required documents are being collected.

---

# 23. UNDER REVIEW

The Broker has sufficient information to begin reviewing the project for its bond process.

The Broker can:

* Review project information
* Review documents
* Review risk information
* Review financial information
* Request additional documents

---

# 24. READY FOR BOND ISSUANCE

The Broker has completed its required preparation inside GreenShift.

This status means:

> The project has reached the point where the Broker can proceed with the external bond process.

It does **not** mean that the bond has already been issued.

---

# 25. BOND ISSUANCE

The actual bond issuance occurs outside GreenShift.

GreenShift should only track the high-level status.

Recommended status:

```text
Not Started
In Progress
Issued
```

GreenShift does not execute the transaction.

---

# 26. Bond Information

GreenShift may store limited information about the bond so that the project's financing status can be tracked.

Recommended information:

* Bond status
* Bond amount
* Issuance date
* Maturity date
* Tenor where relevant
* Assigned Broker

GreenShift should not store or manage individual Investor transactions.

---

# 27. External Bond Process

The conceptual flow is:

```text
GreenShift Project
       ↓
LVV GRK Verified
       ↓
Company Selects Broker
       ↓
Broker Prepares Project
       ↓
Bond Issuance
       ↓
Bond Distribution / Sale
       ↓
Investors
```

The steps after the Broker receives the project may occur outside GreenShift.

GreenShift should only track relevant high-level status.

---

# 28. Investor Relationship Boundary

GreenShift does not directly manage the Broker's Investors.

The relationship is:

```text
GreenShift
    │
    │ verified project information
    │ monthly monitoring reports
    ▼
Broker
    │
    │ investor communication
    │ bond distribution
    ▼
Investors
```

The Broker is responsible for presenting the investment opportunity to Investors.

GreenShift's responsibility is to provide credible and updated project information that supports that communication.

---

# 29. GreenShift's Role in Investor Confidence

GreenShift should not tell Investors:

> "You should invest in this project."

Instead, GreenShift provides evidence about project performance.

The purpose of ongoing monitoring is to help answer:

> **"Is this project progressing as expected, and does its actual performance continue to support the original project assumptions?"**

This distinction is important.

GreenShift provides **project transparency and monitoring**.

The Broker handles the **investment relationship**.

---

# 30. Monthly Project Reporting

The Company and Vendor are responsible for providing the information used for monthly project reporting.

The report should communicate:

* How the project is progressing
* Whether implementation is on schedule
* Whether financial performance is within expectations
* Whether energy performance matches expectations
* Whether environmental targets are being achieved
* Whether ROI-related performance is developing as expected
* Whether there are risks or issues that could affect project success

The report should help the Broker communicate project performance to Investors.

---

# 31. Monthly Report Purpose

The report should answer:

### "Why should the Broker remain confident in the project's progress?"

The report should not simply contain raw numbers.

It should provide enough context to understand whether the project is:

```text
ON TRACK
ATTENTION REQUIRED
AT RISK
```

Example:

```text
Project Status: ON TRACK

Planned Progress: 65%
Actual Progress: 68%

Energy Savings:
97% of expected performance

Budget:
Within planned range

Risk:
No major new risks detected
```

---

# 32. Monthly Report Content

Recommended sections:

## Project Progress

* Planned progress
* Actual progress
* Completed milestones
* Current milestone
* Delayed milestones

## Financial Performance

* Planned budget
* Actual spending
* Budget variance

## Energy Performance

* Expected energy savings
* Actual energy savings
* Performance against baseline

## Environmental Performance

* Expected emission reduction
* Actual/measured emission reduction
* Performance against target

## ROI / Project Performance

* Projected ROI
* Current performance
* Performance trend

## Risk and Issues

* Current risks
* Detected anomalies
* Delays
* Major issues
* Corrective actions

## Overall Conclusion

A concise assessment of the project's current condition.

---

# 33. Monthly Report Delivery

Monthly reports should be available automatically as part of the ongoing monitoring process.

The Broker should receive a notification when a new monthly report becomes available.

The Broker should be able to:

* View the report
* Download the report as PDF
* Access historical reports

---

# 34. Historical Reports

The Broker should be able to access previous monthly reports.

Example:

```text
September 2026
August 2026
July 2026
June 2026
```

Historical reports allow the Broker to understand project performance over time.

The Broker should be able to compare the current situation with previous reporting periods.

---

# 35. Report Integrity

Official GreenShift project reports should be treated as **read-only for the Broker**.

The Broker cannot:

* Edit project performance
* Change reported numbers
* Modify project status
* Modify environmental results
* Modify financial performance
* Rewrite the official report

The Broker may download and use the report in its external Investor communication.

---

# 36. Broker Communication

The Broker does not require a general chat system inside GreenShift.

Communication should primarily happen through structured interactions:

* Document requests
* Document rejection reasons
* Project assignment notifications
* Project status notifications
* Monthly report notifications

The Broker communicates with the Company regarding additional information.

The Broker does not maintain a direct general communication channel with the Vendor.

---

# 37. Company–Broker Document Flow

The expected document flow is:

```text
Broker
   │
   │ Request document
   ▼
Company
   │
   ├── already has document
   │
   └── requests information from Vendor if necessary
              │
              ▼
           Company
              │
              │ uploads document
              ▼
            Broker
```

The Company is the Broker's primary document counterpart.

---

# 38. Notifications

The Broker should receive notifications for important events.

Recommended notification categories:

### Assignment

* New project assigned
* Assignment accepted
* Assignment declined

### Documents

* Document request submitted
* Document received
* Document rejected
* Document requires resubmission

### Project

* Project status changed
* Project risk information updated
* Important project issue detected

### Reporting

* New monthly report available
* Monthly report updated

### Bond

* Project ready for bond issuance
* Bond status updated
* Bond issued

---

# 39. Broker Settings

Recommended Broker settings:

### Company Profile

* Company name
* Description
* Representative
* Contact information
* Website

### Verification

* Verification status
* Verification information
* Verification documents where applicable

### Certifications / Licenses

* Relevant licenses
* Certifications
* Expiration dates where relevant

### Notifications

* Assignment notifications
* Document notifications
* Project notifications
* Report notifications
* Bond status notifications

### Security

* Password
* Authentication settings
* Account security

### Account

* Logout
* Account management

---

# 40. Public Broker Profile

The Broker may have a public-facing profile containing:

* Company name
* Company overview
* Representative
* Contact information
* Website
* Relevant licenses/certifications
* Experience
* Projects handled

Broker performance metrics should not be publicly calculated by GreenShift unless explicitly required later.

---

# 41. Broker Performance

GreenShift does **not** need to calculate a public Broker performance score.

The Broker's purpose is to process financing for assigned projects, not to compete inside GreenShift.

Therefore, the system should not create a ranking such as:

```text
Broker #1
Broker #2
Broker #3
```

unless a future business requirement explicitly introduces Broker comparison.

---

# 42. No Investment Marketplace

The Broker role must not be implemented as an investment marketplace.

Do not create features such as:

* Browse investment opportunities
* Invest now
* Buy bond
* Investor portfolio
* Investor wallet
* Investor transaction history
* Bond order book
* Investor matching
* Investor bidding

These functions belong outside GreenShift.

---

# 43. No Escrow Management

GreenShift does not manage escrow.

If an escrow mechanism is required for the financial process, it is handled outside GreenShift by the appropriate financial parties.

The Broker page should therefore not contain:

* Escrow wallet
* Escrow balance
* Deposit funds
* Withdraw funds
* Investor payment processing

---

# 44. Broker's Core Workflow

The complete Broker workflow is:

```text
1. Broker registers
        ↓
2. Broker verification
        ↓
3. Broker becomes Verified
        ↓
4. Company + Vendor complete project process
        ↓
5. LVV GRK validates project
        ↓
6. Company selects Broker
        ↓
7. Broker receives assignment
        ↓
8. Broker accepts / requests information / declines
        ↓
9. Broker collects required documents
        ↓
10. Company uploads documents
        ↓
11. Broker reviews documents
        ↓
12. Broker prepares project for bond issuance
        ↓
13. Bond process occurs outside GreenShift
        ↓
14. GreenShift tracks bond status
        ↓
15. Company + Vendor provide monthly project data
        ↓
16. Monthly project report becomes available
        ↓
17. Broker reviews/downloads report
        ↓
18. Broker uses report for Investor communication
        ↓
19. Project continues to be monitored
```

---

# 45. Important Role Boundaries

## Company

Responsible for:

* Creating/managing the project
* Working with Vendor
* Selecting Broker
* Providing Broker-requested documents
* Coordinating with Vendor when additional information is required
* Providing required project information

## Vendor

Responsible for:

* Project implementation
* Milestones
* Technical work
* Project evidence
* Providing information to Company

## LVV GRK

Responsible for:

* Validating environmental/green claims
* Ensuring the project does not overclaim its environmental impact

## Broker

Responsible for:

* Bond-related preparation
* Requesting additional Company documents
* Reviewing required information
* Processing bond issuance externally
* Selling/distributing bonds externally
* Communicating with Investors externally
* Using GreenShift reports for Investor communication

## GreenShift

Responsible for:

* Company + Vendor matchmaking
* Project process
* Project information
* LVV GRK validation workflow
* Project monitoring
* Monthly reporting
* Providing reliable project information to Broker

---

# 46. Critical Business Rules

The AI implementation must preserve these rules:

1. Broker must be strictly verified before processing projects.
2. Broker does not browse and select projects.
3. Company selects the Broker.
4. A project must pass LVV GRK validation before it can be assigned to a Broker.
5. Broker can accept or decline an assignment.
6. If Broker declines, the Company chooses another Broker.
7. Broker requests documents from Company only.
8. Company may obtain Vendor information/documents when necessary.
9. Different Brokers may require different documents.
10. Broker can create custom document requests.
11. Rejected documents must include a rejection reason.
12. Broker can view Project Risk Assessment but cannot modify it.
13. Broker cannot modify GreenShift project data.
14. Bond issuance happens outside GreenShift.
15. Bond sales/distribution happen outside GreenShift.
16. Escrow, if required, happens outside GreenShift.
17. GreenShift does not manage Investors.
18. GreenShift does not manage Investor transactions.
19. Company and Vendor provide the information used for monthly reporting.
20. Broker receives monthly project reports.
21. Broker can download reports as PDF.
22. Broker can view historical reports.
23. Broker cannot modify official monthly reports.
24. Monthly reports are intended to communicate project progress and performance.
25. GreenShift provides evidence and monitoring, not investment recommendations.
26. Broker performance is not ranked publicly by GreenShift.
27. The Broker role is a financing/monitoring role, not a marketplace role.

---

# 47. Broker Mental Model

The AI agent should understand the Broker role using this mental model:

> **The Broker is not looking for projects. The Broker receives a verified project from a Company after Company + Vendor matchmaking and LVV GRK validation. The Broker prepares that project for bond issuance by requesting whatever additional documents it needs from the Company. The actual bond issuance, sale, distribution, escrow, and Investor relationship happen outside GreenShift. GreenShift's responsibility continues through project monitoring and monthly reporting. The Broker receives those reports and uses them to communicate the project's ongoing performance to Investors.**

In short:

```text
GREENSHIFT
"Is this project real, validated, and performing?"

BROKER
"Can I prepare and process the bond for this project?"

INVESTOR
"Do I want to invest?"
```

Each party should remain within its own responsibility.
