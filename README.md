# AI INTERVIEW PREP KIT ("prepKit")

An AI-powered, research-backed web application that turns any job description and company URL into a personalized interview preparation kit — featuring autonomous web crawling, Tavily public interview discussion discovery, structured Gemini 2.5 Flash evidence extraction, question quality filtering, deterministic requirement coverage checking, second-pass gap-closing, flashcards, deterministic study schedule allocation, inline edit preservation, interactive practice drills, and weak spots analytics.

---

## 1. Tech Stack & LLM Integration

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React Icons (Modern SaaS aesthetic inspired by Linear and Notion).
- **Backend**: Node.js, Express, TypeScript, Mongoose, JWT Authentication, bcryptjs.
- **Database**: MongoDB (Atlas or local instance).
- **LLM Provider**:
  - **Google Gemini 2.5 Flash** (`GEMINI_API_KEY`) is configured as the default LLM provider for requirement extraction, evidence synthesis, and question generation.
  - Multi-pass generation requests are structured concisely to minimize token consumption per call.
- **Search & Discovery Provider**:
  - **Tavily API** (`TAVILY_API_KEY`) is integrated as an abstracted `SearchProvider` (`TavilySearchProvider`) to search the public web for real interview experiences on platforms like Reddit, LeetCode Discuss, GitHub, and tech blogs.
- **Free-Tier Rate-Limit & Token Resiliency**:
  - To prevent pipeline failures when hitting provider rate limits (`HTTP 429` / `RESOURCE_EXHAUSTED` / `503`), our LLM & search pipeline implements **Exponential Backoff with Jitter** (up to 5 retries with delays scaling from 2s to 32s) and inspects `Retry-After` HTTP headers.
- **Scraping & Research**: Axios, Cheerio HTML Parser, URL resolution, SSRF protection, dynamic link discovery & link scoring.
- **Testing**: Vitest for deterministic schedule allocation, requirement coverage checking, result filtering, question quality validation, and Appendix A schema validation.

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

Ensure `.env` contains:
```env
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
MONGODB_URI=mongodb://localhost:27017/prepkit
JWT_SECRET=your_jwt_secret
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

## 4. Multi-Step Generation & Research Sequencing Pipeline

The research and kit generation pipeline runs in 15 sequential steps:

```
Job Description & Company URL
            ↓
1. Requirement Extraction (Gemini 2.5 Flash: r1, r2... with Must/Nice priority)
            ↓
2. Own Company Crawler (Crawl company domain, score candidate links deterministically)
            ↓
3. Tavily Public Web Search (Discover public interview discussions on Reddit, LeetCode, GitHub, Blogs)
            ↓
4. Result Filtering & Deduplication (Validate URLs, reject login/auth noise & non-public pages)
            ↓
5. Accessible Page Fetching (Retrieve public discussion pages, strip scripts/styling)
            ↓
6. Gemini 2.5 Flash Evidence Extraction (Extract structured interview topics, rounds, reported questions)
            ↓
7. Research Source Persistence (Store ResearchSource documents with evidence & status)
            ↓
8. Company Brief Generation (Summarize company mission & technical culture honestly)
            ↓
9. Research-Backed Question Generation (Gemini 2.5 Flash per requirement & evidence hierarchy)
            ↓
10. Deterministic Question Quality Filter (Reject generic noise, city names like "Hyderabad", benefits)
            ↓
11. Deterministic Coverage Checker (Check must-have requirement IDs against generated questions)
            ↓
12. Second-Pass Gap Closing (If uncovered must-haves exist, generate targeted missing questions)
            ↓
13. Flashcard Generation (Generate requirement-linked review flashcards)
            ↓
14. Deterministic Schedule Allocator (Arithmetic distribution over exact N requested days)
            ↓
15. Zod Appendix A Schema Validation (Validate final structure before persistence)
```

---

## 5. Web Research, Tavily Discovery & Evidence Hierarchy

### Why Tavily for Discovery vs. Own Crawler for Company Domain
- **Company Crawler**: Scrapes official company website pages to extract company values, tech stack context, and hiring page information.
- **Tavily Search Engine**: Company websites rarely publish actual interview questions. Tavily discovers authentic candidate interview experiences across public platforms (Reddit, LeetCode Discuss, GitHub, tech blogs).

### Evidence Hierarchy
To prevent question fabrication while grounding questions in authentic context:
1. **Level 1 (Highest)**: Actual reported interview questions from candidate experiences.
2. **Level 2**: Reported interview topics combined with Job Description requirements.
3. **Level 3**: Official company hiring process evidence combined with Job Description requirements.
4. **Level 4**: Job Description requirement analysis only (when no public interview evidence exists).

### Prevention of Fabricated Interview Questions & Quality Filtering
- Gemini 2.5 Flash is strictly instructed never to label a question as a "reported question" unless explicitly supported by research sources.
- **Deterministic Quality Filter** (`QuestionGenerator.validateQuestionQuality`): Application code validates generated questions to reject generic noise such as city names ("Hyderabad"), benefits, isolated nouns, or prompt injection fragments.

---

## 6. Deterministic Algorithms (Non-LLM Code)

TypeScript application code retains full control over logical decisions:

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

## 7. Security, Prompt Injection Protection & Rate Limits

- **SSRF Protection**: URL validation rejects invalid protocols. In production, blocks `localhost`, `127.0.0.1`, `::1`, and private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). Allows local test URLs when `ALLOW_LOCAL_URLS=true` or in evaluator mode.
- **Untrusted Page Content Boundary**: Fetched webpage text from search results is treated strictly as **DATA ONLY**. Gemini prompts wrap scraped text inside isolated data blocks (`=== START UNTRUSTED WEBPAGE CONTENT === ... === END UNTRUSTED WEBPAGE CONTENT ===`) with explicit instructions to ignore any embedded directives (e.g. "Ignore previous instructions").
- **Rate Limiting & Retries**: Queue-based concurrency limits, exponential backoff, jitter, and HTTP 429 retry handling are implemented across both Gemini and Tavily services.

---

## 8. Automated Tests

Run backend unit tests with Vitest:
```bash
npm run backend:test
```

Tests cover:
1. `crawler.test.ts`: Deterministic link scoring, URL normalization, domain restriction.
2. `resultFilter.test.ts`: Search result filtering, URL deduplication, rejection of login/auth noise.
3. `questionQuality.test.ts`: Question quality filter blocking city names ("Hyderabad"), benefits, and generic noise.
4. `coverage.test.ts`: 100% coverage verification, missing requirement detection, 2nd pass gap closure.
5. `schedule.test.ts`: 1-day, 5-day, 60-day allocation, must-have inclusion, integer minutes, valid question IDs.
6. `kitValidation.test.ts`: Strict Appendix A Zod schema validation, rejection of invalid difficulty/float minutes.
7. `auth.test.ts`: Password hashing, JWT token generation & verification.

