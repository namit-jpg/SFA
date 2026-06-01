# Reference and Guardrails

This file captures the org terms, supported values, and implementation limits that Slackbot skills should respect.

## 1. What Slackbot skills should assume

Slackbot skills for this org should mirror the current SFA app's real behavior:

- some skills are **read only**
- some skills **create or update Salesforce records**
- write skills should ask concise follow-up questions when required information is missing
- write skills should avoid guessing when multiple records match

## 2. Core business objects and user-facing terms

| User-facing term | Salesforce object or concept |
| --- | --- |
| Visit | `Visit__c` |
| Store / Outlet / Retailer | `RetailStore__c` and linked retailer account |
| Rep / SFA User | `SFA_User__c` |
| Order | `Order` |
| Survey response | `Visit_Survey_Response__c` |
| Expense | `Expense__c` |
| Competing product | `Competing_Product__c` |
| Retailer onboarding request | `Partner_Request__c` |
| Scheme / Promotion | `Promotion__c` |

## 3. Supported read skills today

- daily dashboard summary
- weekly progress summary
- rep profile scorecard
- visit list with filters and sorting
- visit details
- visit 360 insights
- contact and navigation context
- active promotions and schemes
- today's order recap

## 4. Supported write skills today

- mark attendance for today
- start visit
- complete visit
- reschedule visit
- create ad-hoc visit
- save visit note
- create order and order items
- submit survey responses
- log expense
- record competing products
- submit retailer onboarding request

## 5. Picklist values and controlled values

### Visit status

- `Planned`
- `In Progress`
- `Completed`
- `Cancelled`

### Visit type

- `Regular`
- `Ad hoc`
- `Promotional`

### Ad-hoc visit purpose

- `Order Taking`
- `Stock Check`
- `Payment Collection`
- `Scheme Discussion`
- `Asset Audit`
- `New Product Launch`
- `Complaint Resolution`

### Reschedule reason

- `Customer Unavailable`
- `Outlet Closed`
- `Travel Issue`
- `Other`

### Survey type

- `Retailer Feedback`
- `Market Survey`
- `Competitor Info`

### Expense category

- `Travel`
- `Food`
- `Accommodation`
- `Fuel`
- `Parking`
- `Miscellaneous`

## 6. Guardrails for write skills

### Disambiguation

If more than one record could match, Slackbot should ask a follow-up question before writing.

Examples:

- two stores with similar names
- multiple planned visits for the same day
- product search returning several close matches

### Minimum write-safe behavior

Before writing, Slackbot should be able to answer:

1. Which record am I updating or creating?
2. Which fields will change?
3. Do I have all required values?
4. Is there any business rule blocking the action?

### Recommended confirmation format

For successful writes, return:

- action completed
- record name
- key fields changed
- any next step or warning

Example:

> Visit updated: Gupta Paint House is now In Progress. Actual start time recorded at 10:42 AM.

## 7. Important business rules

### One active visit at a time

Only one visit can be `In Progress` for a rep at a time. Slackbot should block a second start-visit request until the active visit is completed.

### Attendance is not the same as visit start

"Mark attendance" updates daily attendance context. It does not automatically start a visit.

### Expense receipts are not fully implemented

The current UI supports receipt upload, but the current app does not persist the uploaded file in the implemented submit logic.

### Route optimization is informational only

The visits screen includes an optimize action, but it does not run true routing logic today.

### Today's orders are visit-linked

Order summaries are based on visits that already have a linked order or a visit order value.

## 8. Features present in code but not ready for skill docs yet

Do not document these as production-ready Slackbot skills unless the app is expanded first:

- beat plan submission
- returns and claims
- bulk invoice processing
- selfie-based attendance modal
- start-visit modal and end-visit modal flow
- manager dashboard-specific workflows

## 9. Prompt patterns that work best

### Best for read skills

- "Show me today's visits."
- "Give me a 360 view for Gupta Paint House."
- "Summarize my weekly performance."

### Best for write skills

- "Start my visit for RK Traders now."
- "Reschedule the Gupta Paint House visit to 2026-06-03 because the outlet is closed."
- "Log a travel expense of 800 INR against my active visit."
- "Create an ad-hoc visit for Modern Hardware tomorrow for stock check."

### Common missing information Slackbot may need to ask for

- which visit
- which store
- which product
- quantity
- amount
- date
- survey type
- reason for reschedule

## 10. Suggested publishing order for skills

If you want to add these skills to Slackbot gradually, use this order:

1. daily dashboard summary
2. visit details
3. visit 360 insights
4. start and complete visit
5. reschedule and ad-hoc visit
6. orders
7. field capture
8. retailer onboarding
