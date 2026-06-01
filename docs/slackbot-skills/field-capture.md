# Field Capture Skills

Use these patterns for field tasks that capture structured information during or after a visit.

## Skill: Submit Visit Survey

### Suggested description

Use this skill when a rep wants to submit a survey tied to a visit. Ask for the survey type and at least one answer, write each response to Salesforce, and confirm how many responses were saved.

### Suggested steps

1. Resolve the target visit.
2. Ask for the survey type if missing.
3. Capture one or more answers from the supported question set.
4. Add optional notes if the user includes them.
5. Create one survey response record per answer.
6. Confirm how many responses were recorded.

### Supported survey types

- `Retailer Feedback`
- `Market Survey`
- `Competitor Info`

### Current question set

1. Are shelves adequately stocked?
2. How engaged were the store staff?
3. Any competitor stock visible?
4. Any delivery or shipping concerns?
5. Rate store cleanliness from 1 to 5
6. Are promotional materials displayed?

### Example prompts users can send

- "Submit a market survey for my active visit: shelves partially stocked, staff moderately engaged, competitor stock visible, no delivery concerns, cleanliness 4, promo materials displayed."
- "Log retailer feedback for Gupta Paint House and include note: owner wants faster delivery."
- "Record a survey for RK Traders with answers to shelf stock, staff engagement, and cleanliness only."
- "Submit competitor info survey for today's visit and add note that a rival brand has new display material."

### Expected Salesforce behavior

- Create `Visit_Survey_Response__c` records

### Guardrails

- At least one answer is required.
- If the user does not provide a survey type, default to `Retailer Feedback`.

---

## Skill: Log Visit Expense

### Suggested description

Use this skill when a rep wants to log an expense against a visit. Ask for the amount and category if they are missing, create the expense record, update the visit's total expense amount, and return a confirmation in INR.

### Suggested steps

1. Resolve the target visit.
2. Ask for the amount if it is missing.
3. Ask for a category if it is missing.
4. Capture an optional description.
5. Create the expense record.
6. Roll the amount into the visit total.
7. Return the confirmation and new context.

### Supported categories

- `Travel`
- `Food`
- `Accommodation`
- `Fuel`
- `Parking`
- `Miscellaneous`

### Example prompts users can send

- "Log a fuel expense of 450 INR against my current visit."
- "Add a parking expense of 120 for the Gupta Paint House visit."
- "Record a travel expense of 800 for RK Traders and note taxi from depot."
- "Log 250 INR as food for today's Modern Hardware visit."

### Expected Salesforce behavior

- Create `Expense__c`
- Update `Visit__c.Total_Expense_Amount__c`

### Guardrails

- Amount must be greater than zero.
- Current app UI supports receipt upload, but the current implementation does not persist the uploaded file. Do not promise receipt storage unless that feature is added later.

---

## Skill: Record Competing Products

### Suggested description

Use this skill when a rep wants to capture competitor products seen at a store. Accept up to three entries, each with product name and optional brand, price, and remarks, then create the competitor records.

### Suggested steps

1. Resolve the target visit.
2. Parse up to three product entries.
3. Require at least one product name.
4. Create the competing product records.
5. Confirm how many were recorded.

### Example prompts users can send

- "Record competing products for my active visit: Ultra Gloss Paint by Asian Paints at 1450, remarks high shelf visibility."
- "Log three competitor products for Gupta Paint House: Brand A primer 650, Brand B emulsion 1800, Brand C putty 520."
- "Add competitor intel for RK Traders: Rival Primer, brand BrightCo, price 700, remarks retailer pushing discount."
- "Save competitor products seen during today's Modern Hardware visit."

### Expected Salesforce behavior

- Create `Competing_Product__c`

### Guardrails

- Up to three products per submission
- At least one product name is required

---

## Prompt-writing guidance for users

These write skills are easiest for Slackbot when prompts include:

- the target visit or store
- a single clear business action
- structured values such as amount, category, survey type, or product details

### Strong examples

- "For my active visit, log a travel expense of 900 INR and note round-trip bus fare."
- "Submit a retailer feedback survey for Gupta Paint House with answers to all six questions."
- "Record competitor products for RK Traders: Rival Putty by CoatPro at 510, remarks retailer says margin is improving."

### Weak examples

- "Save survey."  
  Better: "Submit a market survey for my active visit with cleanliness 5 and no delivery concerns."

- "Add expense."  
  Better: "Add a parking expense of 80 INR to today's RK Traders visit."
