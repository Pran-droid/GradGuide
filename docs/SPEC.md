# Education Loan Assessment Tool - Build Spec

Paste this into your IDE agent together with `lenders.json`. Work through it in the order given.

## 1. Goal and hard rules

A decision-support tool where a student or counsellor enters study details, funding, financial profile and collateral, uploads documents, and gets: approximate total study cost, funding gap (loan requirement), net worth, a collateral vs non-collateral view, and lender-by-lender criteria matching.

**Hard rules (do not break these):**
1. **No hard-coded lender rules.** Rates, CIBIL minimums, conditions and document lists are read from `lenders.json` only. Adding a lender or changing a rate must need only a JSON edit.
2. **Never invent rules the dataset doesn't contain.** The dataset has no loan caps, tenor, moratorium, or collateral-value ratios. If something isn't in the data, the UI says "not specified in the dataset" or "cannot assess".
3. **Never claim approval or rejection.** Use wording like "may be relevant", "criteria met in dataset", "indicative". Show a disclaimer on every results screen: *"Decision-support only. Not a guarantee of loan approval or rejection. Based on a limited reference dataset."*
4. Every number the user didn't enter and the data didn't provide (tenor, exchange rate, moratorium) is a **visible, editable assumption** labelled as such.

## 2. Suggested stack

React + TypeScript (Vite), Vitest for tests, no backend needed. Keep calculation and assessment logic in plain TypeScript modules with no UI imports, so they are unit-testable. Uploaded files can stay in browser memory/IndexedDB for the demo (say so in the README). No OCR is required.

Suggested structure:

```
src/
  data/lenders.json
  lib/calc.ts          // cost, funding gap, net worth, EMI
  lib/assess.ts        // lender x product evaluation
  lib/documents.ts     // checklist generation
  lib/types.ts
  components/...
tests/
  calc.test.ts, assess.test.ts, documents.test.ts
```

## 3. Inputs

| Section | Fields |
|---|---|
| Student | name, gender (male / female / other / not specified), CIBIL score (optional), co-applicant type (salaried / self-employed / not specified) |
| Study | country, university, course, university rank (number, optional), duration (years), total tuition, living cost per year, other costs (optional), exchange rate to INR if costs are in another currency |
| Funding | savings, scholarship, fees already paid, family contribution |
| Financial profile | annual income (student/co-applicant), list of assets (type, value), list of liabilities (type, amount) |
| Collateral | list of items: type, estimated value, property state (Delhi / Maharashtra / other), property type (apartment / other), property status (new / resale) |
| Documents | uploads mapped to document IDs from `lenders.json` plus `supplementary_documents` |

Every field is optional where possible. Incomplete input must produce a partial result with clear "missing information" notes, never a crash or a fake default.

## 4. Calculations (`calc.ts`)

```
total_cost       = tuition_total + (living_cost_per_year x duration_years) + other_costs
                   (convert to INR first if another currency)
funding_available = savings + scholarship + fees_already_paid + family_contribution
funding_gap      = max(0, total_cost - funding_available)     // = loan requirement
net_worth        = sum(assets) - sum(liabilities)
EMI              = P x r x (1+r)^n / ((1+r)^n - 1)
                   P = loan amount, r = annual_rate / 12 / 100, n = tenor_years x 12
                   if r == 0: EMI = P / n
```

- Tenor is a user input (default 10 years, labelled "assumption - not in dataset").
- Where a rate is a range (Credila collateral 9.25%-9.75%), compute and show an EMI **range**.
- Optional moratorium toggle: simple interest accrues during the study period on the loan amount. Label it as an illustrative assumption.
- Helper text on the funding form: avoid counting the same money twice (e.g. savings also included in family contribution).
- Format INR with Indian digit grouping (lakh/crore).

## 5. Assessment engine (`assess.ts`)

For each lender and each product in `lenders.json`, return a status and reasons.

**Statuses:** `meets` / `does_not_meet` / `cannot_assess`.

**Evaluate in this order:**
1. `available: false` -> `does_not_meet`, reason from `note` (e.g. BOI non-collateral: "Not possible").
2. Each key in `conditions`:
   - `university_rank_max`: compare with the student's rank. Rank unknown -> `cannot_assess` ("university rank not provided").
   - `gender`: compare. Gender not specified or "other" -> `cannot_assess` for that product (the dataset only defines male/female rates).
3. CIBIL: if lender `min_cibil` is null -> `cannot_assess` ("no CIBIL criterion in dataset"). If CIBIL not provided -> `cannot_assess`. Otherwise `meets` or `does_not_meet`.
4. `rate_overrides`: apply the first override whose `when` matches (e.g. BOI collateral for female students -> 8.60%).
5. Overall status for a product: any `does_not_meet` -> `does_not_meet`; else any `cannot_assess` -> `cannot_assess`; else `meets`.

Each result carries: `lender`, `product_type`, `status`, `rate_min/max` (after overrides), `reasons[]` (each with a code, message and the profile field involved), and `what_would_change[]` (e.g. "CIBIL 40 points higher", "admission to a top-100 university").

**Route relevance (collateral vs non-collateral):**
- Show collateral as relevant when the user has entered collateral value > 0.
- Show non-collateral as relevant when at least one non-collateral product is `meets` or `cannot_assess`.
- Show collateral value next to the funding gap as an **indicative comparison only**, with the note "the dataset does not specify collateral-value requirements".

**Sorting:** meets first, then cannot_assess, then does_not_meet; within a group by lowest rate. Do not label anything "best".

## 6. The three original features

### Feature 1 - Lender fit explainer
- **Problem:** a list of lenders doesn't tell the counsellor why one fits or what to do about it.
- **Why it matters:** counsellors must explain results live; students need a next step.
- **How:** table/cards of lender x route with the three-state badge, plain-language reasons, and a "what would change this" line, all generated from `assess.ts` output. Include a visible note on any lender with no CIBIL criterion.
- **Acceptance:** CIBIL 710 -> BOB meets, SBI does_not_meet (needs 750); Credila/Auxilo cannot_assess; BOI non-collateral does_not_meet.

### Feature 2 - What-if scenario comparison
- **Problem:** families trade off university, contribution and collateral; one calculation can't show that.
- **Why it matters:** "what if we contribute more?" or "what if we pick a top-100 university?" is the real conversation.
- **How:** let the user duplicate the current inputs into up to 3 named scenarios, edit key inputs per scenario (university + rank, tuition, family contribution, scholarship, collateral value, tenor), and compare side by side: total cost, funding gap, relevant routes, lowest applicable rate, EMI (range where applicable). Highlight differences.
- **Acceptance:** changing a scenario to rank <= 100 makes BOB/SBI non-collateral eligible for rank (subject to CIBIL) and the lowest rate shown changes accordingly.

### Feature 3 - Document readiness checker
- **Problem:** applications stall on missing or mismatched paperwork.
- **Why it matters:** fewer delays; counsellors can spot issues before applying.
- **How:** generate the checklist from `lenders.json` documents by route, co-applicant type, property state (Delhi / Maharashtra extras), property type and status. Match uploads to checklist items; show uploaded / missing, a readiness percentage per group and overall, and the "all documents should be self-attested" reminder. Add light consistency flags: net worth from the form vs a figure typed in from the CA Net Worth Certificate, and income vs the ITR figure typed in. Flag mismatches above a user-visible tolerance (e.g. 10%); do not claim the documents are wrong, only "please verify".
- **Acceptance:** a Maharashtra resale apartment on the collateral route shows the share certificate and occupancy certificate; a non-collateral route shows no property documents.

## 7. UI outline

1. Step form: Study -> Funding -> Financial profile -> Collateral -> Documents (with progress and partial-save).
2. Results page: summary cards (total cost, funding gap, net worth), route relevance, lender fit explainer, scenarios, document readiness, disclaimer.
3. Counsellor-friendly: clear numbers, Indian formatting, printable summary if time remains.

## 8. Tests (write these first)

Use these as fixed test cases:

- **Cost/gap:** tuition 30,00,000; living 10,00,000/yr for 2 years; savings 5,00,000; scholarship 3,00,000; family 7,00,000; fees paid 2,00,000 -> total cost 50,00,000; funding 17,00,000; gap 33,00,000.
- **EMI:** P = 33,00,000 at 9.00% over 10 years -> about 41,803 per month (within 1 rupee of 41,803.01).
- **Zero gap:** funding >= cost -> gap 0, no loan routes shown.
- **Zero rate:** EMI = P / n.
- **Net worth:** assets 80,00,000, liabilities 20,00,000 -> 60,00,000.
- **Rate overrides:** BOI collateral female -> 8.60%, male -> 9.00%.
- **BOB collateral:** male -> 8.95%, female -> 8.75%, other -> cannot_assess.
- **Top 100:** rank 150 -> BOB and SBI non-collateral does_not_meet; rank missing -> cannot_assess.
- **Credila collateral:** EMI range from 9.25% and 9.75%.
- **Documents:** salaried co-applicant -> 2 years ITR; self-employed -> 3 years ITR plus balance sheet and P&L; Delhi -> conveyance deed/DDA; Maharashtra new -> commencement certificate.

## 9. Build order (deadline 9 Oct, aim to submit with buffer)

- **5-6 Oct:** types, `lenders.json` loader, `calc.ts` with tests, `assess.ts` with tests, basic form and results page.
- **7 Oct:** Feature 1 UI, document checklist and upload (Feature 3).
- **8 Oct:** Feature 2 scenarios, polish, empty/partial-input handling, disclaimer on all screens.
- **9 Oct (morning):** README with run instructions, short write-up, record the video and add it to the README, deploy, submit.

## 10. Deliverables checklist

- [ ] Working app (hosted link or clear run instructions)
- [ ] GitHub repo with README including the video walkthrough
- [ ] Short write-up: approach, how lender data is structured and updated, the three features (problem / why / how)
- [ ] "Limitations and assumptions" section in the README (see below)

**State these in the README:**
- The dataset doesn't say which university ranking defines "top 100".
- Only male/female rates are defined; other values give "cannot assess".
- The BOI collateral base rate of 9.00% is treated as the default, with 8.60% for girls.
- Credila and Auxilo have no CIBIL criterion in the dataset.
- Tenor, moratorium and exchange rate are user assumptions.
- The CA Net Worth Certificate is accepted as an upload per the brief but is not a requirement in the lender dataset.

## 11. Working rules for the agent

- Read lender data only from `lenders.json`; ask before adding any rule not in it.
- Write the tests in section 8 first, then make them pass.
- Keep logic out of React components.
- After each feature, summarise what was built and which assumptions were made, so the developer can explain it in the follow-up conversation.
