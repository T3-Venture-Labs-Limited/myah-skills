---
name: daily-standup
description: "Generate daily standup reports from your activity, calendar, and task list"
license: "MIT"
role: "workflow"
version: "1.0.0"
marketplace:
  category: "productivity"
  tags:
    - "standup"
    - "daily-report"
    - "team"
    - "agile"
  personas:
    developer: 75
    researcher: 50
    analyst: 55
    operator: 70
    creator: 45
    support: 60
  summary: "Auto-generate daily standup updates from your work activity"
  featured: false
  requires:
    tools: []
    mcp: []
    env: []
  author:
    name: "Myah Team"
    url: "https://myah.dev"
---

# Daily Standup

Generate your daily standup report automatically from your calendar, completed tasks, and ongoing work.

## Features

- **Yesterday's accomplishments** — Pull from your completed tasks and calendar
- **Today's plan** — Review upcoming meetings and scheduled work
- **Blockers** — Identify potential issues or dependencies
- **Team-friendly format** — Structured for Slack, email, or standup tools
- **Weekly rollup** — Aggregate daily updates into a weekly summary

## How It Works

1. **Connect your data** — Calendar, task manager, code commits (optional)
2. **Generate** — Create your standup report each morning
3. **Customize** — Adjust tone, detail level, and format
4. **Share** — Copy to Slack, email, or your standup tool

## Example Conversation

**User:** "Generate my standup report"
**Myah:** "Here's your standup update for today:

---

**Yesterday:**
- Completed API integration for user authentication
- Reviewed 3 pull requests from the team
- Fixed bug in payment processing flow
- Attended product planning meeting (notes shared)

**Today:**
- Finish writing tests for authentication API
- Start on password reset feature
- 1:1 with Sarah at 2pm
- Team standup at 10am

**Blockers:**
- Waiting for design mockups from the design team (expected Thursday)
- Staging environment is down — IT is working on it

---

Would you like me to adjust anything or format this for a specific platform?"

**User:** "Format it for Slack"
**Myah:** "Here's your Slack-formatted standup:

```
*Yesterday:*
:white_check_mark: Completed API integration for user authentication
:white_check_mark: Reviewed 3 pull requests from the team
:white_check_mark: Fixed bug in payment processing flow
:white_check_mark: Attended product planning meeting (notes shared)

*Today:*
:arrow_right: Finish writing tests for authentication API
:arrow_right: Start on password reset feature
:arrow_right: 1:1 with Sarah at 2pm
:arrow_right: Team standup at 10am

*Blockers:*
:warning: Waiting for design mockups from the design team (expected Thursday)
:warning: Staging environment is down — IT is working on it
```

Just copy and paste into Slack!"

## Customization Options

- **Detail level** — Brief (3 bullets) vs. Detailed (full sentences)
- **Tone** — Casual (emojis) vs. Professional (formal)
- **Focus areas** — Development, meetings, research, etc.
- **Include/exclude** — Choose what data sources to pull from

## Tips

- Generate your standup at the same time each day for consistency
- Review and edit before sharing — automation helps, but you know best
- Use the weekly rollup for 1:1s or progress reviews
- Flag blockers early so they can be addressed quickly