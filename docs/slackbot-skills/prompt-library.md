# Prompt Library for Slackbot

This file is a copy-ready set of prompt examples users can send to Slackbot once the matching skills are available.

## Daily summaries and performance

- "Give me my field brief for today."
- "Show my attendance, today's visits, and sales."
- "Summarize today's performance and tell me what still needs action."
- "Show my weekly progress and call out anything risky."
- "Give me my profile stats in bullet form."

## Visit lists and visit actions

- "Show me today's visits."
- "List all my visits sorted oldest first."
- "What visits do I still need to finish today?"
- "Start my visit for Gupta Paint House."
- "Begin today's visit at Modern Hardware."
- "End my current visit."
- "Check out of the Gupta Paint House visit."
- "Reschedule the Shree Traders visit to 2026-06-03 because the outlet is closed."
- "Move my Gupta Paint House visit to Friday due to travel issue."
- "Create an ad-hoc visit for Modern Hardware tomorrow."
- "Add an unplanned visit for Gupta Paint House on 2026-06-04 for stock check."
- "Add a note to my current visit: retailer asked for a follow-up on pricing."

## Visit details and insights

- "Show me the details for my Gupta Paint House visit."
- "Give me the full visit context for RK Traders."
- "Show me a 360 view for Gupta Paint House."
- "What products does Modern Hardware order most often?"
- "Show store history, last order, and visit logs for Shree Traders."
- "What promotions should I discuss at Gupta Paint House?"
- "Who is the contact for RK Traders and what is the phone number?"

## Orders

- "Create an order for my active visit: 12 Primer White and 6 Wall Putty 20kg."
- "Place a draft order for Gupta Paint House with 10 units of SKU PNT-101 and 3 units of SKU PUT-020."
- "Create an order for today's RK Traders visit with 5 buckets of exterior emulsion."
- "Use my active visit and build an order with 10 Primer White. Show me the total before placing it."
- "Show me today's orders."
- "Which of my visits already have orders?"

## Surveys, expenses, and competitor capture

- "Submit a market survey for my active visit: shelves partially stocked, staff moderately engaged, competitor stock visible, no delivery concerns, cleanliness 4, promo materials displayed."
- "Log retailer feedback for Gupta Paint House and include note: owner wants faster delivery."
- "Log a fuel expense of 450 INR against my current visit."
- "Add a parking expense of 120 for the Gupta Paint House visit."
- "Record competing products for my active visit: Ultra Gloss Paint by Asian Paints at 1450, remarks high shelf visibility."
- "Log three competitor products for Gupta Paint House: Brand A primer 650, Brand B emulsion 1800, Brand C putty 520."

## Retailer onboarding

- "Start retailer onboarding for Gupta Hardware."
- "Create a new onboarding request for a retailer and guide me through the required details."
- "Submit onboarding for Modern Paint House. Contact is Ravi Sharma, phone +91-9876543210, email ravi@example.com."
- "Open a retailer onboarding intake and ask me for the missing information one step at a time."

## Strong prompt pattern

The best prompts usually include:

1. the record or store name
2. the action to take
3. the values to write
4. the date if it is not today
5. the format the user wants back

### Example

> Create an ad-hoc visit for Gupta Paint House on 2026-06-04 for stock check, then confirm the visit name, store, date, and status.

## When Slackbot should ask a follow-up question

Users should expect a short follow-up when a prompt does not include enough information, for example:

- which visit to update
- which store was intended
- which product to add
- quantity
- amount
- date
- survey type

That follow-up behavior is a good sign. It means the skill is avoiding a bad Salesforce update.
