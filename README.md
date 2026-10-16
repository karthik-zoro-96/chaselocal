# ChaseLocal

A simple web app that drafts follow-up messages for overdue freelancer invoices.

## How it works
- Paste client + invoice details
- Get 3 drafts: Polite, Firm, Final Notice
- Powered by an open-weight model (Llama via a hosted endpoint)

## Setup
1. Copy `.env.example` to `.env.local`
2. Add your API key (Groq free tier or any OpenAI-compatible open-model provider)
3. `npm install`
4. `npm run dev`

## Why open models
- No lock-in to a closed provider’s pricing
- You can swap the model by changing one env var
- Lower cost than proprietary APIs for this use case
