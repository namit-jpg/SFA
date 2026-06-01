# Home Dashboard and Performance Skills

Use these skill patterns for requests that summarize a rep's day, week, or personal performance without changing Salesforce data.

## Skill: Daily Field Rep Brief

### Suggested description

Use this skill when a user wants a quick summary of today's field activity. Show attendance status, today's order value, sales, visit totals, completed visits, pending visits, and any obvious exceptions that need attention.

### Suggested steps

1. Resolve the rep from the Slack user.
2. Fetch today's visits and attendance state.
3. Calculate:
   - today's order value
   - today's sales
   - total visits
   - completed visits
   - pending visits
4. Highlight blockers such as:
   - no attendance recorded
   - zero planned visits
   - a visit stuck in progress
5. Return a short, action-oriented summary.

### Suggested output

- 5 to 7 bullets
- one section called `Needs attention` if there is anything urgent

### Example prompts users can send

- "Give me my field brief for today."
- "Show my attendance, today's visits, and sales."
- "Summarize today's performance and tell me what still needs action."
- "How is my day looking so far in the SFA org?"

### Expected Salesforce behavior

- Read only
- Uses visit and attendance-related fields already surfaced on the home dashboard

---

## Skill: Weekly Progress Snapshot

### Suggested description

Use this skill when a rep or manager wants weekly performance metrics. Show completed visits this week versus total week visits, plus all-time visits and total order value where available.

### Suggested steps

1. Resolve the rep.
2. Fetch weekly visit counts and summary insights.
3. Return a compact summary with one sentence of interpretation.
4. If progress looks weak, suggest the next best action.

### Suggested output

- short summary paragraph
- bullet list with metrics

### Example prompts users can send

- "Show my weekly progress."
- "How many visits have I completed this week?"
- "Give me my week-to-date SFA performance."
- "Summarize my visits and order value for this week."

### Expected Salesforce behavior

- Read only

---

## Skill: Rep Profile Snapshot

### Suggested description

Use this skill when a user wants profile-style stats for a rep. Show total visits, this week's visits, total order value, and average order value.

### Suggested steps

1. Resolve the rep.
2. Fetch profile insight totals.
3. Present the results in a compact scorecard.
4. If the user names another rep and access rules allow it, show that rep instead.

### Suggested output

```text
Rep: <name>
Total Visits: <count>
This Week: <count>
Total Orders: <currency>
Avg Order: <currency>
```

### Example prompts users can send

- "Show my profile stats."
- "What is my average order value?"
- "Give me a summary of my total visits and total orders."
- "Show my rep scorecard."

### Expected Salesforce behavior

- Read only

---

## Prompt-writing guidance for users

These prompts work best if the user includes:

- a time range if it is not today or this week
- whether they want a quick summary or a detailed breakdown
- whether they want only metrics or also recommended actions

### Good examples

- "Give me a quick dashboard for today with only the key numbers."
- "Show my weekly progress and call out anything risky."
- "Give me my profile stats in bullet form."

### Less effective examples

- "How am I doing?"  
  Better: "How am I doing this week on visits and order value?"

- "Show numbers."  
  Better: "Show today's attendance, visits, and sales."
