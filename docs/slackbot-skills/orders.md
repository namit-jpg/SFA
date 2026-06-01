# Order Skills

Use these patterns for skills that create or summarize sales orders related to a visit.

## Skill: Create Sales Order from Visit

### Suggested description

Use this skill when a rep wants to create an order from an in-progress visit or from one of today's planned or in-progress visits. Resolve the visit, search products by name or code, collect quantities, create a draft order and order items, and return a full confirmation.

### Suggested steps

1. Resolve the target visit.
2. If the user does not specify a visit, look for:
   - the active visit first
   - otherwise one of today's planned or in-progress visits
3. Parse the requested products and quantities.
4. Search the product catalog by name or product code.
5. If a product match is ambiguous, ask a short follow-up question.
6. Build the cart and calculate the total.
7. Create the order as `Draft`.
8. Create the related order items.
9. Update the visit's linked order and order value.
10. Return a clean recap.

### Suggested output

```text
Order created successfully
Visit: <visit name>
Store: <store name>
Status: Draft

Items
- <product> x <qty> = <subtotal>

Total: <currency>
```

### Example prompts users can send

- "Create an order for my active visit: 12 Primer White and 6 Wall Putty 20kg."
- "Place a draft order for Gupta Paint House with 10 units of SKU PNT-101 and 3 units of SKU PUT-020."
- "Create an order for today's RK Traders visit with 5 buckets of exterior emulsion."
- "For my current visit, add 4 enamel white and 2 primer grey, then place the order."

### Expected Salesforce behavior

- Create `Order`
- Create `OrderItem`
- Update `Visit__c.Order__c`
- Update `Visit__c.Order_Value__c`

### Guardrails

- At least one line item is required.
- The visit must resolve to an account.
- Product names may need a follow-up question if multiple matches exist.
- Current app logic creates a **draft secondary order** and calculates the visit order value from line items.

---

## Skill: Order Creation with Follow-Up Questions

### Suggested description

Use this skill when users provide partial order requests. Ask only for the missing information needed to place the order successfully, then finish the write.

### Ask for clarification when any of this is missing

- visit or store
- product identity
- quantity

### Example prompts users can send

- "Create an order for Gupta Paint House."
- "Add primer and putty to my current visit order."
- "Order 10 units for RK Traders."

### Recommended Slackbot follow-up behavior

Slackbot should ask short, specific questions such as:

- "Which product do you want for the Gupta Paint House order?"
- "How many units of Primer White should I add?"
- "Do you want me to use your active visit or today's planned RK Traders visit?"

---

## Skill: Today's Order Summary

### Suggested description

Use this skill when a user wants to see orders linked to today's visits. Show store name, visit name, order value, status, and created date.

### Suggested steps

1. Resolve the rep.
2. Fetch today's visits that already have order value or a linked order.
3. Sort latest or oldest first based on the prompt.
4. Return a concise list.

### Example prompts users can send

- "Show me today's orders."
- "List my order activity sorted latest first."
- "Which of my visits already have orders?"
- "Give me a quick order recap for today."

### Expected Salesforce behavior

- Read only

---

## Skill: Order Review Before Placement

### Suggested description

Use this skill when a user wants Slackbot to show the cart before writing to Salesforce. Summarize the products, quantities, unit prices, subtotals, and total, then ask for final confirmation.

### Suggested steps

1. Resolve the visit.
2. Parse or build the item list.
3. Show the proposed order.
4. Ask for an explicit "place it" or "confirm" instruction before creating the order.

### Example prompts users can send

- "Build an order for my active visit and show me the summary before placing it."
- "Draft the Gupta Paint House order first, then let me confirm."
- "Review this order before you save it: 8 Primer White, 2 Wall Putty 20kg."

### Expected Salesforce behavior

- Read first
- Write only after explicit confirmation

---

## Prompt-writing guidance for users

Order prompts are strongest when they include:

- the visit or store name
- product names or codes
- quantities
- whether the user wants a review step before save

### Strong examples

- "Create a draft order for RK Traders from today's visit: 5 SKU PNT-101 and 2 SKU PUT-020."
- "Use my active visit and build an order with 10 Primer White. Show me the total before placing it."
- "Place an order for Gupta Paint House with 4 Exterior Emulsion Blue and 6 Wall Putty 20kg."

### Weak examples

- "Create order."  
  Better: "Create an order for my active visit with 10 Primer White."

- "Add products."  
  Better: "Add 6 Primer White and 2 Wall Putty 20kg to the Gupta Paint House order."
