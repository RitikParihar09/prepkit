# AI INTERVIEW PREP KIT

An AI-powered, research-backed web application that turns any job description and company URL into a personalized interview preparation kit — featuring autonomous web crawling, company brief extraction, categorized question generation, deterministic requirement coverage checking, second-pass gap-closing, flashcards, deterministic study schedule allocation, inline edit preservation, interactive practice drills, and weak spots analytics.

---

## 1. Tech Stack & Free-Tier LLM Justification

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React Icons (Modern SaaS aesthetic inspired by Linear and Notion).
- **Backend**: Node.js, Express, TypeScript, Mongoose, JWT Authentication, bcryptjs.
- **Database**: MongoDB (Atlas or local instance).
- **LLM Provider Choice (Genuine Free Tier)**:
  - **Google Gemini (1.5 Flash / 2.0 Flash)** is configured as the default LLM provider. Google Gemini offers a **genuine free tier** (15 Requests Per Minute / 1 Million Tokens Per Minute / 1,500 Requests Per Day) without requiring credit card billing.
  - **OpenAI / OpenRouter**: Fully supported via abstraction for custom API keys.
  - **Deterministic Mock Provider**: Automatic fallback if `LLM_API_KEY` is not provided or set to `mock`, allowing offline evaluation without any external API calls or key requirements.
- **Free-Tier Rate-Limit & Token Resiliency**:
  - Free-tier LLMs strictly limit both Requests Per Minute (RPM) and Tokens Per Minute (TPM).
  - To prevent pipeline failures when hitting provider rate limits (`HTTP 429` / `RESOURCE_EXHAUSTED` / `503`), our LLM pipeline implements **Exponential Backoff with Jitter** (up to 5 retries with delays scaling from 2s to 32s) and inspects `Retry-After` HTTP headers.
  - Multi-pass generation requests are structured concisely to minimize token consumption per call.
- **Scraping & Research**: Axios, Cheerio HTML Parser, URL resolution, SSRF protection, dynamic link discovery & link scoring.
- **Testing**: Vitest for deterministic schedule allocation, requirement coverage checking, and Appendix A schema validation.

---

## 2. Setup & Local Execution Instructions

### Prerequisites
- Node.js v18+ and npm
- MongoDB running locally or a MongoDB Atlas URI

### Installation
```bash
# 1. Install root & backend dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. Configure Environment Variables
cp .env.example .env
```

### Running Local Development Servers
```bash
# Start backend server (Port 5001)
npm run backend:dev

# Start frontend application (Port 3000)
npm run frontend:dev
```

Open `http://localhost:3000` in your browser.

---

## 3. Mandatory Batch Entry Point (`npm run evaluate`)

The repository includes the CLI evaluator script specified in Section 9 of the assessment brief.

### Exact Execution Command
```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

### Example
```bash
npm run evaluate -- --input test-cases.json --output test-kits.json
```

### Evaluator Features & Conformance
- Reads input JSON array of test cases (`[{ id, jd, company_url, days }]`).
- Executes the **exact same `KitCoordinator.generateKit()` pipeline** used by the web app.
- Supports local evaluation URLs (e.g. `http://localhost:8099/acme/`).
- Handles failed or unreachable sites gracefully without stopping execution (outputs status `ok` or `failed` per Appendix B format).
- Strips internal metadata to output clean Appendix A kit JSON.

---

## 4. Multi-Step Generation & Research Sequencing

The kit generation pipeline runs in 9 deliberate, sequential steps:

```
Job Description & Company URL
            ↓
1. Requirement Extraction (Role, Seniority, Requirements r1, r2... with Must/Nice priority)
            ↓
2. Web Crawler & Link Scorer (Crawls company homepage, ranks links dynamically)
            ↓
3. Company Brief Generator (Produces summary, what they do, and research sources)
            ↓
4. Categorized Question & Flashcard Generator (Pass 1: Technical, Behavioural, System Design, Fit)
            ↓
5. Deterministic Coverage Checker (Checks must-have requirement IDs against question tags)
            ↓
6. Second-Pass Gap Closing (If uncovered must-haves exist, generates targeted missing questions)
            ↓
7. Deterministic Coverage Checker Pass 2 (Final verification)
            ↓
8. Deterministic Schedule Allocator (Arithmetic distribution over exact N requested days)
            ↓
9. Zod Schema Validation (Validates against Appendix A structure before persistence)
```

---

## 5. Web Research & Dynamic Link Discovery

Finding company hiring information cannot rely on fixed URL paths like `/careers` or `/jobs`. The crawler uses dynamic link discovery:
1. Crawls the target homepage and extracts all internal hyperlinks.
2. Resolves relative URLs using `new URL(href, base)`.
3. Scores candidates using a weighted keyword ranking engine (`hiring`, `careers`, `interview`, `engineering`, `handbook`, `culture`, `values`, `team`).
4. Fetches the top-ranked pages (capped at 2MB per page, 8-second timeout).
5. Sanitizes HTML (strips script/nav/footer tags) and passes clean text to the model as **data**, never as instructions.
6. If no hiring information is found, reports honestly (`"No reliable hiring information was found."`) without fabricating fake company data.

---

## 6. Deterministic Algorithms (Non-LLM)

### A. Deterministic Coverage Checker
Implemented in pure TypeScript (`CoverageChecker.ts`):
1. Filters requirements where `priority === 'must'`.
2. Collects all requirement IDs referenced across generated questions (`q.requirement_ids`).
3. Flags any unreferenced must-have requirement IDs into `coverage.uncovered_requirement_ids`.
4. Triggers Pass 2 gap-closing if needed.

### B. Deterministic Schedule Allocator
Implemented in pure TypeScript (`ScheduleAllocator.ts`):
1. Accepts exact requested days $N$ ($1 \le N \le 60$).
2. Sorts questions by **Requirement Priority** (`must` > `nice`) and **Difficulty** ($3 > 2 > 1$).
3. Distributes questions across $N$ days (earliest days get highest priority & hardest topics).
4. Handles sparse question sets (e.g. 60 days with 10 questions) by scheduling core questions first and allocating structured review days.
5. Calculates **integer minutes** per day (minimum 15 mins).
6. Guarantees every question ID referenced in `schedule.days[i].question_ids` exists in the kit.

---

## 7. Edit Preservation Strategy (Section Regeneration)

Every generated question and flashcard maintains internal metadata:
```json
{
  "generated": true,
  "edited": false,
  "pinned": false,
  "updatedAt": "2026-09-10T18:00:00.000Z"
}
```

- When a user edits a question inline $\rightarrow$ `edited = true`.
- When a user manually creates a question $\rightarrow$ `pinned = true`.
- **Regeneration Behavior**: When regenerating a section (e.g., `technical` questions), the backend filters out un-edited generated questions while preserving all items with `edited: true` or `pinned: true`. Fresh questions are generated to replace unedited items, merged with preserved items, and re-processed through the coverage checker and schedule allocator.

---

## 8. Creative Feature — Weak Spots Report

To solve the candidate problem of knowing *what* to study next:
- During flashcard practice drills, candidates rate their confidence on a 1–5 scale.
- The **Weak Spots Report** aggregates these confidence ratings across requirement categories.
- Highlights **High Risk / Weak Areas** (average confidence $< 3.5$) versus **Strong Proficiency Areas** ($\ge 3.5$).
- Generates a **Recommended Practice Priority** list ordering topics by lowest confidence score.

---

## 9. Security & SSRF Protection

- **SSRF Protection**: URL validation rejects invalid protocols. In production, blocks `localhost`, `127.0.0.1`, `::1`, and private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). Allows local test URLs when `ALLOW_LOCAL_URLS=true` or in evaluator mode.
- **Untrusted Page Content**: Crawled web text is stripped of HTML scripts, sanitized, and fed into LLM prompts inside strict data blocks (`"""\n...\n"""`) with explicit instructions treating text as data only.

---

## 10. Automated Tests

Run backend unit tests with Vitest:
```bash
npm run backend:test
```

Tests cover:
1. `schedule.test.ts`: 1-day, 5-day, 60-day allocation, must-have inclusion, integer minutes, valid question IDs.
2. `coverage.test.ts`: 100% coverage verification, missing requirement detection, 2nd pass gap closure.
3. `kitValidation.test.ts`: Strict Appendix A Zod schema validation, rejection of invalid difficulty/float minutes.
4. `auth.test.ts`: Password hashing, JWT token generation & verification.
