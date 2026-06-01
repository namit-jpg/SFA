# Retailer Onboarding Skills

Use this pattern for Slackbot skills that guide a user through a structured onboarding intake and create a `Partner_Request__c` record in Salesforce.

## Skill: Retailer Onboarding Intake

### Suggested description

Use this skill when a rep wants to create a new retailer onboarding request. Guide the user through contact, business, address, store, tax, and banking information. Ask only for missing required fields, then create the onboarding request and confirm submission.

### Suggested steps

1. Tell the user the onboarding flow has three sections:
   - business and contact
   - store details
   - tax and banking
2. Collect the required fields first.
3. Ask follow-up questions only for missing required data.
4. Accept optional fields when the user has them.
5. Create the partner request with status `Submitted`.
6. Return a concise submission summary plus any follow-up items the ops team may need.

### Required fields to collect

#### Step 1: Business and contact

- first name
- last name
- enterprise or company name
- phone
- email
- business type

#### Step 2: Store details

- street
- city
- state
- postal code
- country

#### Step 3: Documents and banking

- PAN number
- GST number
- bank name
- bank account number
- IFSC code

### Useful optional fields

- company website
- year established
- store area in square feet
- store type
- expected opening date
- Aadhar number

### Allowed business types

- `Individual`
- `Partnership`
- `Private`
- `Public`
- `Other`

### Supported store types

- `Regular Store`
- `Flagship Store`
- `Virtual Store`
- `Van Store`

### Example prompts users can send

- "Start retailer onboarding for Gupta Hardware."
- "Create a new onboarding request for a retailer and guide me through the required details."
- "Submit onboarding for Modern Paint House. Contact is Ravi Sharma, phone +91-9876543210, email ravi@example.com."
- "Open a retailer onboarding intake and ask me for the missing information one step at a time."

### Example of a strong full-input prompt

> Create a retailer onboarding request for Gupta Hardware. Contact: Ravi Sharma, phone +91-9876543210, email ravi@example.com. Business type: Individual. Address: 12 Market Road, Jaipur, Rajasthan, 302001, India. PAN: ABCDE1234F. GST: 08ABCDE1234F1Z2. Bank: SBI, account 12345678901, IFSC SBIN0001234. Expected opening date 2026-06-10.

### Expected Salesforce behavior

- Create `Partner_Request__c`
- Set `Onboarding_Stage__c = Submitted`
- Set `Status__c = Submitted`

### Suggested output

```text
Retailer onboarding submitted
Retailer: <enterprise name>
Primary contact: <name>
City/State: <city>, <state>
Status: Submitted

Missing follow-up items
- <only if anything optional is still needed later>
```

### Guardrails

- Do not submit the record until the required fields are present.
- If the user supplies free-form business details, map them carefully and repeat back the normalized values before writing if anything is unclear.
- Use `India` as the country default only when the user does not specify another country and that default is acceptable for the process.

---

## Prompt-writing guidance for users

Retailer onboarding works best when the user:

- clearly says this is a new onboarding request
- includes the retailer or enterprise name early
- groups details by contact, address, and banking
- allows Slackbot to ask follow-up questions for anything missing

### Strong examples

- "Start onboarding for RK Paint Supplies and ask me for the missing details."
- "Create a partner request for Modern Hardware. I'll give you the business details first."
- "Submit retailer onboarding for Gupta Hardware using the details below."

### Weak examples

- "Add retailer."  
  Better: "Start retailer onboarding for Gupta Hardware and collect the missing details."

- "Create new store."  
  Better: "Create a retailer onboarding request for a new store called Gupta Hardware."
