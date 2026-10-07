# Prompt pack - Education Loan Assessment Tool

Paste these into Antigravity **one at a time, in order**. Start a fresh conversation for each prompt (or each pair) so the agent's context stays clean. After each prompt: read the summary, run the app/tests yourself, and commit.

Compressed plan (deadline 9 Oct):
- **6 Oct:** Prompts 0-4
- **7 Oct:** Prompts 5-7
- **8 Oct:** Prompts 8-10
- **9 Oct (morning):** Prompts 11-12, record video, submit early

---

## Prompt 0 - Check the environment
```
Read GEMINI.md, docs/SPEC.md and src/data/lenders.json (or lenders.json in the project root if the src folder doesn't exist yet).
Then tell me:
1. Which skills you can see (list their names).
2. Which MCP servers are connected (list their names and one tool each).
3. A 5-line summary of the project and its hard rules, in your own words.
Do not write any code yet.
```

## Prompt 1 - Extract the GradGuide look
```
Open https://www.gradguide.in/ in the browser (use the browser tool or the Playwright MCP) at desktop width (1440px) and mobile width (390px).
Inspect the computed styles and extract the design tokens that define its look:
- Font families (headings, body, small uppercase labels) and where each is used
- Colour palette: background, surface/card, text, muted text, primary/accent, borders, and any status colours
- Heading style (note: headings have an italic emphasised phrase), eyebrow labels (small uppercase), stat numbers, buttons, cards, form fields, tags (e.g. CORE / SELECTIVE badges)
- Border radius, shadows, spacing scale, section padding, max content width
- Header/nav layout and footer layout
Save screenshots of the hero, a card section, and the form section into docs/reference/.
Write everything into docs/design-tokens.md as a table, with hex values and Google Font names where you can identify them.
Then create a skill at .agent/skills/gradguide-brand/SKILL.md (with YAML front-matter: name, description) that tells future agents: use these tokens, this tone of voice (plain, honest, trust-focused), these component patterns, and never copy GradGuide's logo, photos, testimonials or copy.
If you can't identify something with confidence, say so in the file instead of guessing.
```
*(If the agent can't browse, open the site yourself, take 3-4 screenshots, and use DevTools (right-click, Inspect) to read the colours and fonts, then paste them into the chat and ask the agent to write the two files.)*

## Prompt 2 - Scaffold the project
```
Scaffold the project in the current folder following GEMINI.md and docs/SPEC.md section 2:
- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui initialised (use the shadcn MCP / CLI), with the theme variables set from docs/design-tokens.md
- Vitest + React Testing Library
- Folder structure: src/data, src/lib, src/components, src/pages, tests/
- Put lenders.json in src/data/ and SPEC.md in docs/
Then build an app shell only: a header with a text wordmark "Education Loan Assessment" (no GradGuide logo), a simple nav, a footer, and an empty home page, styled with the brand tokens. Add the shadcn components we'll need: button, input, label, select, card, tabs, badge, table, dialog, progress, alert.
Run the dev server, open it in the browser, take a screenshot at desktop and mobile width, and check it against docs/reference/. Fix visible mismatches.
Summarise what you set up and any assumptions.
```

## Prompt 3 - Calculations (tests first)
```
Implement src/lib/types.ts and src/lib/calc.ts exactly as described in docs/SPEC.md sections 3 and 4.
Write the tests FIRST in tests/calc.test.ts using the fixed cases in SPEC.md section 8 (cost/gap, EMI ~41,803, zero gap, zero rate, net worth, rate range EMI). Show me the tests failing, then implement until they pass.
Include: total cost, funding available, funding gap, net worth, EMI (and EMI range), optional moratorium interest (clearly labelled as an assumption), and an Indian-format currency helper (lakh/crore grouping) with tests.
No UI in this task. Run npm test and show the result. Summarise the formulas in plain language.
```

## Prompt 4 - Lender assessment engine (tests first)
```
Implement src/lib/assess.ts following docs/SPEC.md section 5.
Write tests FIRST in tests/assess.test.ts for: BOI collateral female 8.60% vs default 9.00%; BOB collateral male 8.95 / female 8.75 / other => cannot_assess; top-100 conditions (rank 150 => does_not_meet, missing rank => cannot_assess); BOI non-collateral not available; CIBIL 710 => BOB meets, SBI does_not_meet; Credila and Auxilo => cannot_assess (no CIBIL criterion in dataset); overall status rules; what_would_change messages.
All rules must come from lenders.json. Grep the codebase at the end and confirm there are no hard-coded lender names, rates or CIBIL numbers outside the JSON and the tests.
Run npm test and show the result. Summarise the decision logic and any assumption you had to make.
```

## Prompt 5 - Intake form (steps)
```
Build the intake flow as a multi-step form using shadcn components, following docs/SPEC.md section 3 and the brand tokens:
Step 1 Student and study details -> Step 2 Funding -> Step 3 Financial profile (income, assets list, liabilities list, net worth shown live) -> Step 4 Collateral (list of items with value, property state/type/status) -> then Results.
Requirements: every field optional where possible; inline validation; live "total cost / funding gap" summary panel; helper text warning not to double-count savings and family contribution; assumptions (tenor, exchange rate) shown as clearly labelled inputs; state kept in a single typed store (React context or Zustand) so every step and the Results page share it; partial data never crashes anything.
Use calc.ts for all numbers, with no maths in components. Add a "Load sample profile" button for demos.
Verify in the browser with screenshots (desktop + mobile), fill the form with the sample profile, and fix any visual or logic issues.
```

## Prompt 6 - Results page + Feature 1 (Lender fit explainer)
```
Build the Results page: summary cards (total cost, funding gap, net worth), route relevance (collateral vs non-collateral, with the indicative-only collateral note), and Feature 1 from docs/SPEC.md section 6: lender x route cards with the three-state badge (Meets / Does not meet / Cannot assess), plain-language reasons, rate (range where applicable), EMI estimate, and a "What would change this" list. Sort per SPEC section 5.
Wording must follow the hard rules: "may be relevant", never approved/rejected. Show the disclaimer on this page.
Use assess.ts only; no lender logic in components. Add component tests for the three states.
Verify with the sample profile and with a profile where CIBIL is missing; take screenshots and show me.
```

## Prompt 7 - Documents + Feature 3 (readiness checker)
```
Implement src/lib/documents.ts and tests/documents.test.ts, then the UI, following docs/SPEC.md section 6 (Feature 3).
- Generate the checklist from lenders.json by route, co-applicant type, property state, property type and status (Delhi and Maharashtra extras).
- Upload UI: drag and drop, map each file to a checklist item, file type/size validation, keep files in memory only, status uploaded/missing, readiness % per group and overall, and the "all documents should be self-attested" reminder.
- Accept CA Net Worth Certificate and other supplementary documents as uploads, but label them as not part of the lender dataset.
- Light consistency flags: net worth in the form vs a figure typed in from the CA certificate; income vs a figure typed in from the ITR. Tolerance is a visible setting (default 10%). Wording: "please verify", never "wrong".
Tests: salaried => ITR 2 years; self-employed => ITR 3 years + balance sheet/P&L; Delhi => conveyance deed/DDA; Maharashtra new => commencement certificate; non-collateral => no property documents.
Verify in the browser and show screenshots.
```

## Prompt 8 - Feature 2 (What-if scenarios)
```
Implement Feature 2 from docs/SPEC.md section 6: up to 3 named scenarios cloned from the current inputs, editable per scenario (university + rank, tuition, family contribution, scholarship, collateral value, tenor), compared side by side: total cost, funding gap, relevant routes, lowest applicable rate, EMI (range where applicable), with differences highlighted.
Scenario logic must reuse calc.ts and assess.ts, with no duplicated logic. Add tests: changing rank to <= 100 changes which non-collateral products apply and the lowest rate shown.
Mobile layout: scenarios must stack or scroll cleanly. Verify in the browser with screenshots.
```

## Prompt 9 - Polish and states
```
Do a polish pass without changing behaviour:
- Empty, loading and error states everywhere; a friendly "missing information" panel on Results listing exactly what would improve the assessment
- Keyboard navigation and visible focus, labels on every input, sufficient colour contrast
- Responsive check at 360px, 768px and 1440px
- Consistent number formatting (Indian digit grouping, INR)
- The disclaimer visible on Results, Scenarios and Documents screens
- Make it match the brand tokens: spacing, type scale, eyebrow labels, card style
Use the browser to take before/after screenshots and list what you changed.
```

## Prompt 10 - Audit (catch problems before the reviewers do)
```
Act as a strict reviewer of this repo against docs/SPEC.md and GEMINI.md. Report, don't fix yet:
1. Any lender rule, rate, CIBIL number or document list hard-coded outside lenders.json
2. Any wording that implies guaranteed approval or rejection
3. Any calculation I can't trace to SPEC.md formulas
4. Any assumption (tenor, moratorium, exchange rate, top-100 definition, gender handling) that isn't shown to the user or documented
5. Missing tests, dead code, unused dependencies, TypeScript any's
6. Anything in the UI that copies GradGuide's logo, photos, testimonials or copy
Give a prioritised list with file and line references. Wait for my go-ahead before changing anything.
```

## Prompt 11 - README, write-up and video script
```
Write README.md with: what the tool does; run instructions (install, dev, test, build); tech stack; architecture (how lenders.json is structured and how to update it, with an example of adding a lender); the three features each with problem / why it matters / how it works; assumptions and limitations (use SPEC section 10); a placeholder line for the video link.
Then write docs/WRITEUP.md (one page): approach, data structure and how to update it, the three features, and design decisions with trade-offs.
Then write a 3-minute video walkthrough script with timestamps: problem (20s), data-driven design (30s), live demo of the three features (90s), testing and limitations (30s), wrap (10s).
Do not exaggerate. Only describe what the code actually does.
```

## Prompt 12 - Deploy
```
Prepare a static production build and deploy instructions for Vercel (or Netlify): confirm `npm run build` passes, add any required config, make sure no files are uploaded to a server (uploads stay in the browser), and give me exact steps to deploy from GitHub. Then give me a final pre-submission checklist from docs/SPEC.md section 10.
```

---

## Prompts for when things go wrong

**Bug fix**
```
Bug: [what you did] -> [what happened] -> [what you expected].
First reproduce it in the browser and show me the evidence. Then write a failing test if it's a logic bug. Then fix it with the smallest change, run all tests, and explain the root cause in two sentences.
```

**Interview prep (do this for every feature)**
```
Explain [file or feature] to me as if I'm about to be questioned about it by a hiring manager. Cover: what it does, why it's designed this way, two alternatives we rejected and why, the main risk, and 5 likely follow-up questions with short answers.
```

**Stuck agent**
```
Stop. Summarise what you have done so far, what is failing, and what you've tried. Do not try anything new yet. Propose two different approaches and recommend one.
```
