# Slackbot Skills for the SFA Salesforce Bot

This folder contains Markdown guides for turning the current SFA Slack app's capabilities into reusable Slackbot skills and user-facing prompt recipes.

## Why these files exist

Slackbot skills are reusable, step-by-step instructions that help Slackbot handle recurring tasks consistently. Based on Slack's current product guidance:

- A skill has a **name**, **description**, **steps**, and **output format**.
- Slackbot can choose a skill automatically when the description matches a user's request.
- Users can also add a specific skill directly to a prompt from the **Skills** tab in Slackbot.
- Skills work best for repeatable workflows with clear inputs and a predictable result.

These docs are designed for that exact model. Each file below gives you:

1. A suggested **skill name**
2. A suggested **skill description**
3. Suggested **steps** for the skill
4. A recommended **output format**
5. Example **user prompts**
6. The expected **Salesforce read/write behavior**
7. Any important **guardrails**

## What this app can already do

The existing SFA Slack app already supports flows that map well to Slackbot skills:

- Show home dashboard and rep performance
- List visits and open visit details
- Check in to and complete visits
- Reschedule visits
- Create ad-hoc visits
- Create sales orders from a visit
- Submit visit surveys
- Log visit expenses
- Record competing products
- Add visit notes
- Show visit 360 insights
- Submit retailer onboarding requests
- Show rep profile stats

## Recommended file set

- [home-dashboard-and-performance.md](./home-dashboard-and-performance.md)
- [slackbot-skill-authoring.md](./slackbot-skill-authoring.md)
- [prompt-library.md](./prompt-library.md)
- [visit-execution.md](./visit-execution.md)
- [visit-insights-and-account-context.md](./visit-insights-and-account-context.md)
- [orders.md](./orders.md)
- [field-capture.md](./field-capture.md)
- [retailer-onboarding.md](./retailer-onboarding.md)
- [reference-and-guardrails.md](./reference-and-guardrails.md)

## Recommended Slackbot skill pattern

Use this structure when creating a new skill in Slackbot:

### Skill name

Use a direct name that describes the outcome, for example:

- `Daily Field Rep Brief`
- `Visit Check-In Assistant`
- `Create Sales Order from Visit`
- `Retailer Onboarding Intake`

### Description

Write the description so Slackbot can match it to the right request. Good descriptions:

- mention the business object (`Visit`, `Order`, `Expense`, `Survey`, `Retailer`)
- mention whether the skill should **surface insights** or **update Salesforce**
- mention what the output should look like

Example:

> Use this skill when a rep wants to start or complete a visit, reschedule a visit, or create an ad-hoc visit. Resolve the correct visit, ask only for missing required fields, update Salesforce, and return a concise confirmation with the store name, visit date, and new status.

### Steps

Keep the steps explicit. For Salesforce write skills, prefer this order:

1. Resolve the user and target record
2. Check for ambiguity or missing required fields
3. Confirm the intended action if the request changes Salesforce data
4. Update or create the record
5. Return a confirmation with the fields changed

### Output

For read skills, use:

- bullets
- short tables
- a concise summary plus exceptions or follow-ups

For write skills, use:

- a one-line confirmation
- the record created or updated
- the fields that changed
- any warnings or follow-up actions

## Skill authoring rules for this org

Use these rules across all skills:

1. **Use the org's terms**
   - Visit
   - Store / Outlet / Retailer
   - SFA User / Rep
   - Order
   - Expense
   - Survey
   - Competing Product
   - Partner Request / Onboarding

2. **Ask follow-up questions only when needed**
   - If two stores have similar names, ask which one
   - If a write action needs a date, quantity, amount, or survey type and it is missing, ask for it

3. **Be explicit on writes**
   - Repeat back what will be created or updated
   - If the request is ambiguous, do not guess
   - Return the final status after the write completes

4. **Respect current product limits**
   - Only one visit can be active at a time
   - Attendance check-in is separate from visit check-in
   - Receipt upload exists in the expense UI, but the current app does not persist the receipt file
   - Route optimization is informational only
   - Some flows exist in code but are not fully wired yet; see the reference file

## Good prompt-writing habits for users

Prompts work best when they include:

- the store or visit name
- the date if it is not for today
- the action to take
- the values to write
- the format they want back

Examples:

- "Show me today's visits and flag anything overdue."
- "Start my visit for Shree Traders now."
- "Reschedule the Gupta Paints visit to 2026-06-03 because the outlet is closed."
- "Create an ad-hoc visit for Modern Hardware tomorrow for stock check."
- "Create an order for my in-progress visit at RK Stores: 12 units of Primer White and 6 units of Putty 20kg."
- "Log a fuel expense of 450 INR against my active visit and note toll plus parking."

## Suggested rollout approach

1. Start with **read-heavy** skills first:
   - daily brief
   - visit details
   - visit 360 insights
   - rep profile snapshot

2. Add **simple writes** next:
   - visit check-in / check-out
   - reschedule visit
   - add note
   - create ad-hoc visit

3. Add **structured multi-input writes** after that:
   - order creation
   - expense logging
   - survey submission
   - competitor capture
   - retailer onboarding

That sequence reduces risk while the team learns how people naturally prompt Slackbot.
