# Visit Insights and Account Context Skills

Use these patterns for read-heavy skills that help reps understand a visit, a store, or recent account history before or during field work.

## Skill: Visit Details Snapshot

### Suggested description

Use this skill when a rep wants the full context for one visit. Show visit status, store, type, planned and actual timing, order value, expense total, store contact details, active schemes, survey responses, and notes.

### Suggested steps

1. Resolve the visit from the prompt.
2. Fetch the visit record, store, and contact details.
3. Include any financial summary already linked to the visit.
4. Include active promotions or schemes where available.
5. Include expenses, survey responses, and current notes.
6. End with the next best actions, such as start visit, create order, log expense, or view 360 insights.

### Suggested output

- summary section
- financial section
- contact section
- notes and follow-up section

### Example prompts users can send

- "Show me the details for my Gupta Paint House visit."
- "Give me the full visit context for RK Traders."
- "Open the Shree Traders visit details and show contact, notes, and schemes."
- "What do I need to know before I start the Modern Hardware visit?"

### Expected Salesforce behavior

- Read only

---

## Skill: Visit 360 Insights

### Suggested description

Use this skill when a user wants a store-level 360 view before discussing orders or execution. Show prior visits at the store, last order total, most frequently ordered products, last order line items, and detailed visit logs.

### Suggested steps

1. Resolve the visit or store.
2. Fetch store history and recent orders.
3. Summarize:
   - number of visits
   - last order total
   - frequently ordered products
   - last order details
   - recent visit logs
4. Highlight practical talking points for the rep.

### Suggested output

```text
Store: <name>
Visits: <count>
Last order total: <currency>

Frequently ordered
- <product> - <qty trend>

Last order
- <item> x <qty>

Recent visit notes
- <date> <rep> <status>
```

### Example prompts users can send

- "Show me a 360 view for Gupta Paint House."
- "Give me visit insights for RK Traders before I place an order."
- "What products does Modern Hardware order most often?"
- "Show store history, last order, and visit logs for Shree Traders."

### Expected Salesforce behavior

- Read only

---

## Skill: Retailer Contact and Action Card

### Suggested description

Use this skill when a user needs the retailer's contact details or immediate field actions for a visit. Surface the primary contact, phone, email, and navigation context in a concise block.

### Suggested steps

1. Resolve the visit or store.
2. Fetch the contact record linked to the account.
3. Return:
   - contact name
   - phone
   - email
   - store name
4. If mapping data is available, include a navigation hint or destination label.

### Example prompts users can send

- "Show me the contact details for the Gupta Paint House visit."
- "Who is the contact for RK Traders and what is the phone number?"
- "Give me the retailer contact and navigation info for Modern Hardware."
- "Show me the email and phone for Shree Traders."

### Expected Salesforce behavior

- Read only

### Important note

The current app exposes call, email, and navigate actions from visit details. A Slackbot skill should surface the same information clearly, but should not invent actions the underlying system cannot perform.

---

## Skill: Promotion and Scheme Context

### Suggested description

Use this skill when a rep wants to see which active schemes or promotions may be relevant during a store visit. Show current promotion names, scheme type, status, validity window, and description.

### Suggested steps

1. Resolve the visit or store.
2. Fetch active promotions available in the visit detail context.
3. Return the relevant promotions in a compact list.
4. If none exist, say so plainly.

### Example prompts users can send

- "Show me active schemes for my current visit."
- "What promotions should I discuss at Gupta Paint House?"
- "List the current schemes available for RK Traders."
- "Show active promotions before I start the Shree Traders visit."

### Expected Salesforce behavior

- Read only

---

## Prompt-writing guidance for users

Include one of these identifiers whenever possible:

- visit name
- store name
- "my active visit"
- "today's visit at <store>"

That helps Slackbot resolve the correct record quickly.

### Strong examples

- "Give me a 360 view for my active visit at Gupta Paint House."
- "Show visit details for RK Traders and include notes and expenses."
- "Before I call on Modern Hardware, summarize store history and last order."

### Weak examples

- "Show me insights."  
  Better: "Show me visit insights for Gupta Paint House."

- "What should I know?"  
  Better: "What should I know before today's RK Traders visit?"
