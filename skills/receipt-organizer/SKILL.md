---
name: receipt-organizer
description: "Extract data from receipts, categorize expenses, and generate expense reports"
license: "MIT"
role: "tool"
version: "1.0.0"
marketplace:
  category: "finance"
  tags:
    - "receipts"
    - "expenses"
    - "finance"
    - "organization"
  summary: "Extract receipt data and organize expenses automatically"
  featured: false
  requires:
    tools: []
    mcp: []
    env: []
  capabilities:
    - title: "Extract receipt data"
      description: "Parse receipts and extract key information"
    - title: "Categorize expenses"
      description: "Organize spending and generate expense reports"
  author:
    name: "Myah Team"
    url: "https://myah.dev"
---

# Receipt Organizer

Extract data from receipts, categorize expenses, and generate expense reports with minimal effort.

## Features

- **Receipt parsing** — Extract merchant, date, amount, and items from receipt text or images
- **Auto-categorization** — Sort expenses into categories (meals, travel, office supplies, etc.)
- **Expense reports** — Generate formatted reports for accounting or reimbursement
- **Mileage tracking** — Log business trips with distance calculations
- **Receipt storage** — Organize and archive receipts for tax purposes

## How to Use

Share receipt details (text, photo description, or forwarded email) and I'll extract and organize the information.

## Example Conversation

**User:** "I have a receipt from lunch with a client. It's from Bistro 42, dated April 15th, total was $67.50 including tip."
**Myah:** "Got it. Here's the extracted receipt data:

**Receipt Summary:**
- **Merchant:** Bistro 42
- **Date:** April 15, 2026
- **Amount:** $67.50
- **Category:** Meals & Entertainment (client meeting)
- **Payment:** [Not specified — please add if needed]

**Expense Report Entry:**
| Date | Merchant | Category | Amount | Notes |
|------|----------|----------|--------|-------|
| 04/15/26 | Bistro 42 | Meals & Entertainment | $67.50 | Client lunch |

Would you like me to:
1. Add this to your monthly expense report?
2. Flag it for reimbursement?
3. Categorize it differently?"

**User:** "Add it to my April expense report"
**Myah:** "Added to your April 2026 expense report. Your current totals:

**April 2026 Expenses:**
- Meals & Entertainment: $245.50 (3 receipts)
- Travel: $120.00 (2 receipts)
- Office Supplies: $45.99 (1 receipt)
- **Total: $411.49**

You're within your $500 monthly budget. Would you like me to generate the full April report?"

**User:** "Yes, generate the report"
**Myah:** "Here's your April 2026 expense report:

---

**Expense Report — April 2026**
**Employee:** [Your Name]
**Department:** [Your Department]
**Report Date:** April 22, 2026

### Summary
- Total Expenses: $411.49
- Receipt Count: 6
- Budget Status: Within limit ($500)

### Breakdown by Category
1. **Meals & Entertainment** — $245.50
   - Bistro 42 (04/15) — $67.50 — Client lunch
   - [Other receipts...]

2. **Travel** — $120.00
   - [Receipt details...]

3. **Office Supplies** — $45.99
   - [Receipt details...]

### Reimbursement Request
Total requested: $411.49

---

Ready to submit? I can format this for your accounting system or email it to your manager."

## Categories

- Meals & Entertainment
- Travel & Transportation
- Office Supplies
- Software & Tools
- Professional Development
- Marketing & Advertising
- Miscellaneous

## Tips

- Share receipts as soon as possible to avoid losing them
- Include context ("client dinner", "team lunch") for better categorization
- Review auto-categorizations — they learn from your corrections
- Export monthly reports before submitting for reimbursement