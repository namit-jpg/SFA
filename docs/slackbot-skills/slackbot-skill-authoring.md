# Slackbot Skill Authoring Guide

This file summarizes how to turn the prompt recipes in this folder into actual Slackbot skills.

## What Slack says a skill should include

Slackbot skills are reusable, step-by-step instructions for recurring tasks. According to Slack's current help documentation, each skill should define:

- a **name**
- a **description**
- **steps**
- an **output format**

Slackbot can then:

- use the skill automatically when a prompt matches the description
- let users add the skill directly to a prompt from the Skills tab
- let teams share the skill, publish it, and assign it to user groups when permissions allow

## How to create a skill from scratch in Slack

1. Open **Slackbot**
2. Open the **Skills** tab
3. Click **Add skill**
4. Choose **Create from scratch**
5. Enter the **name**
6. Enter the **description**
7. Add the **steps**
8. Define the **output**
9. Click **Use skill** to test it

Slack also supports creating a skill with Slackbot's help or importing one from an existing canvas.

## How to use the docs in this folder

For each domain file:

1. Copy the suggested **skill name**
2. Adapt the **description** to your team's language
3. Paste the **steps** into the skill definition
4. Use the **suggested output** section as the output instructions
5. Test using the included example prompts

## Recommended writing style for descriptions

Descriptions should help Slackbot route requests correctly.

### Good description pattern

> Use this skill when a field rep wants to create or update a visit record, such as starting a visit, completing a visit, rescheduling a visit, or creating an ad-hoc visit. Ask only for missing required fields, update Salesforce, and return a short confirmation with the record updated and the fields changed.

### Weak description pattern

> Helps with visits.

The good version works better because it:

- names the business area
- names the actions
- says whether it writes to Salesforce
- defines the expected output

## Recommended step pattern for read skills

Use a structure like this:

1. Resolve the user, visit, or store mentioned in the prompt.
2. Fetch the relevant Salesforce records.
3. Summarize the requested information.
4. Highlight blockers, anomalies, or next best actions.
5. Return the answer in the requested format.

## Recommended step pattern for write skills

Use a structure like this:

1. Resolve the target record.
2. Ask for any missing required fields.
3. If the record is ambiguous, ask a short clarifying question.
4. Repeat back the intended action when needed.
5. Create or update the Salesforce record.
6. Return a concise confirmation with the fields changed.

## Recommended output patterns

### For read skills

- bullet summary
- compact table
- short narrative plus action items

### For write skills

- one-line success message
- fields changed
- IDs only if your team wants them exposed
- follow-up action if relevant

## Sharing and publishing

Slack's help docs note that:

- any member can create and share a skill
- users add skills to their Slackbot Skills tab before Slackbot can use them automatically for that person
- Skill Managers can publish skills to the catalog and assign them to user groups
- assigned skills are updated immediately when the skill changes

## Suggested rollout process

1. Build one skill per business outcome, not one huge "do everything" skill.
2. Test each skill with 5 to 10 realistic prompts.
3. Start with read-only skills before adding write-heavy ones.
4. Publish only after the prompts consistently map to the right records and output format.

## Suggested first skills to build

1. Daily Field Rep Brief
2. Visit Details Snapshot
3. Visit 360 Insights
4. Start Visit
5. Complete Visit
6. Create Sales Order from Visit

## Final reminder

These Markdown files are grounded in the current SFA app behavior. If the bot later adds new Salesforce flows, update the corresponding skill file so Slackbot instructions stay aligned with the product.
