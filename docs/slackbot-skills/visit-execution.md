# Visit Execution Skills

Use these patterns for skills that help reps manage planned and ad-hoc visits. These are the highest-value Salesforce write skills because they update `Visit__c` records directly.

## Skill: My Visits List and Prioritization

### Suggested description

Use this skill when a rep asks to see today's visits or all recent visits. Show visits sorted by newest or oldest first and call out their current status.

### Suggested steps

1. Resolve the rep.
2. Decide whether the user wants:
   - today's visits
   - all recent visits
   - latest first
   - oldest first
3. Fetch the visits and include:
   - visit name
   - store name
   - planned date
   - created time when useful
   - status
4. If the user asks for prioritization, highlight what should be handled next.

### Example prompts users can send

- "Show me today's visits."
- "List all my visits sorted oldest first."
- "What visits do I still need to finish today?"
- "Show today's visits and flag the active one."

### Expected Salesforce behavior

- Read only

---

## Skill: Start Visit

### Suggested description

Use this skill when a rep wants to check in to a visit and begin field execution. Resolve the correct visit, enforce the single-active-visit rule, update the visit to `In Progress`, and confirm the store and start time.

### Suggested steps

1. Resolve the visit from the prompt.
2. If the visit is already `In Progress`, say so clearly.
3. Check whether the rep already has another active visit.
4. If another visit is active, do not start a new one.
5. Update the target visit:
   - `Status__c = In Progress`
   - `ActualStartTime__c = now`
6. Confirm success with the visit name, store, and timestamp.

### Example prompts users can send

- "Start my visit for Gupta Paint House."
- "Check me in to the RK Traders visit now."
- "Begin today's visit at Modern Hardware."
- "Start the planned visit for Shree Traders."

### Expected Salesforce behavior

- Update `Visit__c`
- Set status to `In Progress`
- Set actual start time

### Guardrails

- Only one visit can be active at a time.
- If there are multiple matching visits, ask which one.
- If the user does not name a visit, prefer today's planned visit only if it is unambiguous.

---

## Skill: Complete Visit

### Suggested description

Use this skill when a rep wants to check out of a visit. Resolve the active or named visit, mark it completed, stamp the end time, and return a short confirmation.

### Suggested steps

1. Resolve the visit from the user's prompt or from the active visit.
2. Confirm which visit will be closed if there is any ambiguity.
3. Update the visit:
   - `Status__c = Completed`
   - `ActualEndTime__c = now`
4. Return a final confirmation and remind the user about follow-up actions if useful.

### Example prompts users can send

- "End my current visit."
- "Check out of the Gupta Paint House visit."
- "Complete the in-progress visit now."
- "Mark today's RK Traders visit as finished."

### Expected Salesforce behavior

- Update `Visit__c`
- Set status to `Completed`
- Set actual end time

---

## Skill: Reschedule Visit

### Suggested description

Use this skill when a rep needs to move a visit to another date. Ask for the new date and reason if either is missing, then update the visit and confirm the change.

### Suggested steps

1. Resolve the visit.
2. Ask for a new date if it was not provided.
3. Ask for a valid reason if it was not provided.
4. Update the visit with the new date and reason.
5. Return the old and new date if available, plus the selected reason.

### Valid reasons

- `Customer Unavailable`
- `Outlet Closed`
- `Travel Issue`
- `Other`

### Example prompts users can send

- "Reschedule the Shree Traders visit to 2026-06-03 because the outlet is closed."
- "Move my Gupta Paint House visit to Friday due to travel issue."
- "Push today's RK Traders visit to tomorrow."
- "Reschedule the Modern Hardware visit and mark the reason as customer unavailable."

### Expected Salesforce behavior

- Update the visit's scheduled date
- Store the reschedule reason

---

## Skill: Create Ad-Hoc Visit

### Suggested description

Use this skill when a rep wants to create an unplanned visit. Ask for the store and visit date if missing, set the visit type to `Ad hoc`, capture the purpose, and create the record.

### Suggested steps

1. Resolve the target store.
2. Ask for the visit date if missing.
3. Ask for the purpose if the user wants something other than the default.
4. Create the visit with:
   - `Status__c = Planned`
   - `Type__c = Ad hoc`
   - `Purpose__c = selected purpose`
5. Confirm the retailer name and date.

### Supported purposes

- `Order Taking`
- `Stock Check`
- `Payment Collection`
- `Scheme Discussion`
- `Asset Audit`
- `New Product Launch`
- `Complaint Resolution`

### Example prompts users can send

- "Create an ad-hoc visit for Modern Hardware tomorrow."
- "Add an unplanned visit for Gupta Paint House on 2026-06-04 for stock check."
- "Create a new visit for RK Traders next Monday for payment collection."
- "Plan an ad-hoc visit to Shree Traders for scheme discussion."

### Expected Salesforce behavior

- Create `Visit__c`
- Set the visit to `Planned`
- Set the type to `Ad hoc`

### Guardrails

- Store and date are required.
- If the user does not specify a purpose, default to `Order Taking`.
- The current UI has an optional notes field, but the current app does not save those notes on creation.

---

## Skill: Add Visit Note

### Suggested description

Use this skill when a rep wants to capture or update notes on a visit. Resolve the visit, save the note text, and confirm the update.

### Suggested steps

1. Resolve the visit.
2. Ask for the note text if missing.
3. Update `Visit_Notes__c`.
4. Confirm that the note was saved.

### Example prompts users can send

- "Add a note to my current visit: retailer asked for a follow-up on pricing."
- "Save this note on the Gupta Paint House visit: low stock on primer."
- "Update the visit notes for RK Traders with today's discussion."
- "Add note to my active visit: owner wants a scheme comparison."

### Expected Salesforce behavior

- Update `Visit__c.Visit_Notes__c`

---

## Separate attendance prompt pattern

Attendance check-in is different from visit check-in. If you want a dedicated attendance skill, prompt for that explicitly.

### Example prompts users can send

- "Mark my attendance for today."
- "Check me in for the day."
- "Record today's attendance and show the time."

### Expected Salesforce behavior

- Updates `Check_In_Time__c` on the first planned visit found for today

### Important note

This does **not** start a field visit. Users should say "start my visit" when they want visit execution to begin.
