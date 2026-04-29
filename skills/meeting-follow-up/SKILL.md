---
name: meeting-follow-up
description: "Generate meeting summaries, action items, and follow-up emails from meeting notes or transcripts"
license: "MIT"
role: "workflow"
version: "1.0.0"
marketplace:
  category: "communication"
  tags:
    - "meetings"
    - "notes"
    - "follow-up"
    - "action-items"
  personas:
    developer: 40
    researcher: 50
    analyst: 60
    operator: 80
    creator: 55
    support: 75
  summary: "Summarize meetings and track action items automatically"
  featured: false
  requires:
    tools: []
    mcp: []
    env: []
  capabilities:
    - title: "Summarize meetings"
      description: "Generate summaries and action items from notes"
    - title: "Draft follow-ups"
      description: "Create follow-up emails and task assignments"
  author:
    name: "Myah Team"
    url: "https://myah.dev"
---

# Meeting Follow-Up

Never lose track of what was decided in meetings. This skill generates summaries, extracts action items, and drafts follow-up communications.

## Features

- **Meeting summaries** — Concise recap of key discussion points
- **Action item extraction** — Identify who does what by when
- **Follow-up emails** — Draft summary emails to attendees
- **Decision logging** — Track important decisions made
- **Meeting prep** — Review previous meeting notes before the next one

## How to Use

Share your meeting notes, transcript, or a brief description of what was discussed. I'll help you organize and follow up.

## Example Conversation

**User:** "We just had a product planning meeting. Here's what we discussed..."
**Myah:** "Thanks for the update. Here's a structured summary:

## Meeting Summary: Product Planning
**Date:** Today
**Attendees:** [List from your notes]

### Key Decisions
1. **Q2 Feature Priority** — Mobile app redesign takes precedence over web updates
2. **Budget Allocation** — $50K approved for user research
3. **Timeline** — Beta launch moved from June to July

### Action Items
- **@Sarah** — Finalize user research vendor selection (Due: Friday)
- **@Mike** — Create mobile redesign mockups (Due: Next Wednesday)
- **@You** — Update project timeline and communicate to stakeholders (Due: Tomorrow)

### Follow-Up Needed
- Schedule architecture review meeting
- Confirm vendor contracts

Would you like me to draft a follow-up email to the team?"

**User:** "Yes, draft the follow-up email"
**Myah:** "Here's a draft:

---

Subject: Product Planning Meeting — Summary & Action Items

Hi Team,

Thanks for a productive planning session today. Here's a summary of what we covered:

**Decisions Made:**
- Mobile app redesign is our Q2 priority
- $50K budget approved for user research
- Beta launch timeline adjusted to July

**Action Items:**
- Sarah: Finalize research vendor by Friday
- Mike: Mobile mockups by next Wednesday
- [Your name]: Update timeline and communicate to stakeholders by tomorrow

**Next Steps:**
- Architecture review meeting to be scheduled
- Vendor contracts pending confirmation

Please reply to confirm your action items or if I missed anything.

Best

---

Shall I send this or would you like to edit it first?"

## Tips

- Share notes immediately after meetings while memory is fresh
- Include attendee names for accurate action item assignment
- Review previous meeting summaries before the next session
- Set reminders for action item due dates