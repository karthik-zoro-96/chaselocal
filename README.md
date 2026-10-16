# ChaseLocal

Turn an overdue invoice into three ready-to-send follow-up emails — Polite, Firm, and Final Notice — in under a minute.

Built for freelancers and small studios who'd rather not spend twenty minutes wording a "just checking in" email to a client who owes them money.

## What it does

1. **Upload the invoice** — PDF, JPG, or PNG. Or type the details in yourself, or click **Try a sample invoice**.
2. **Check the details** — client, amount, currency, due date, invoice number, and work description are extracted for you. Any ISO currency works, and days overdue is calculated from the due date. Add any earlier messages for context.
3. **Pick a tone** — get three escalating drafts, each with a subject line. The one that fits how late the payment is opens first. Copy it, open it in your email app, or use a quick tweak: add a payment link placeholder, make it more concise, or make it more direct.

The prompts tell the model to use only the facts you provide, so drafts don't invent dates, amounts, or promises.

## How it works

| Step | Runs on | Tool |
| --- | --- | --- |
| PDF text extraction | Your server | [pdf-parse](https://github.com/mehmet-kozan/pdf-parse) |
| Image OCR | Your server | [tesseract.js](https://github.com/naptha/tesseract.js) |
| Field extraction, drafting, tweaks | Model provider | Llama 3.1 8B (open-weight) |

Only the extracted text goes to the model, never the file itself. Nothing is stored: there's no database and no account.

## Why open models

- **Cheap enough to sell.** A small open-weight model costs a fraction of a cent per invoice, so a low monthly price for freelancers still works as a business.
- **No lock-in.** The app uses the standard OpenAI-compatible API, so moving to another host (Groq, Together, Fireworks, or your own GPU) is a change to `OPENAI_BASE_URL` and `MODEL_NAME`, not a rewrite.
- **Open all the way down.** The OCR and PDF parsing are open source too and run alongside the app.

## Getting started

Requires Node.js 20.9 or later.

```bash
cp .env.example .env.local   # then add your API key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Required. A [Groq](https://console.groq.com/keys) key works on the free tier. `GROQ_API_KEY` is also accepted. |
| `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint. |
| `MODEL_NAME` | `llama-3.1-8b-instant` | Any chat model your provider serves. |

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com), [Motion](https://motion.dev), and Sonner.
