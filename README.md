# GradGuide Education Loan Assessment Tool

This tool helps prospective international students estimate their study costs, funding gap, and relevant education loan options. **This tool is for decision-support only and is not a guarantee of loan approval or rejection.**

## Running the Project

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Open the displayed local URL (usually `http://localhost:5173`) in your browser

### Running Tests
- Run `npm test` to execute the full Vitest test suite covering core calculations, assessment logic, and UI components.

### Build
- Run `npm run build` to generate the production bundle.

## Video Walkthrough

https://github.com/user-attachments/assets/video.mp4

> If the video doesn't play above, you can find it at [`docs/video.mp4`](docs/video.mp4).

## Project Overview

### Approach
The core goal of this project is to cleanly separate the business logic (financial calculations and lender assessment) from the React UI components. All heavy lifting happens in `src/lib/` using pure TypeScript functions, making it exceptionally easy to test and verify edge cases without needing to render a component. The React app (`src/components/` and `src/pages/`) simply collects state using a context provider and passes it to these pure functions. 

The UI is built with Tailwind CSS and shadcn/ui components to match GradGuide's clean, modern branding, adhering strictly to the provided design tokens.

### Lender Data Structure
The core engine is driven entirely by `src/data/lenders.json`, which serves as the single source of truth for all loan rules, minimums, maximums, and document requirements. 
- **`lenders` array**: Contains each lender's configuration including their supported routes (collateral vs non-collateral) and route-specific rules like max amounts, interest rate ranges, and conditional overrides (e.g. female applicants getting a discount, or top-100 universities qualifying for non-collateral).
- **`documents` array**: Maps the exact document checklist to the specific route, co-applicant type, and state. 

### Key Features

1. **Lender Fit Explainer**
   - **Problem:** Students often don't know why they are eligible or ineligible for certain lenders.
   - **Why it matters:** Transparency helps students improve their profile (e.g. bringing in a stronger co-applicant or improving CIBIL).
   - **How it works:** The `assessLenders` function evaluates the student's profile against each lender's rules in `lenders.json`. It returns a three-tier status (`meets`, `cannot_assess`, `does_not_meet`) and provides a plain-language explanation of exactly which criterion passed, failed, or was missing. It also highlights what the user could change to improve their eligibility.

2. **What-If Scenarios**
   - **Problem:** Loan terms and study plans can change, and users need a way to compare options side-by-side.
   - **Why it matters:** Choosing an education loan is a complex decision; comparing the EMI impact of a different university or higher scholarship is crucial.
   - **How it works:** The `ScenarioComparison` component lets users copy their current intake data into up to 3 named scenarios. They can tweak key variables (like university rank, tuition, or tenor) and immediately see the side-by-side impact on their funding gap, eligible lenders, and estimated EMI range.

3. **Document Readiness Checklist**
   - **Problem:** Lenders have complex document requirements that vary wildly based on the applicant's profile and collateral type.
   - **Why it matters:** Applying with missing or incorrect documents is the #1 cause of loan delays.
   - **How it works:** The `documents.ts` engine filters the master document list based on the user's specific scenario (e.g. Salaried co-applicant in Maharashtra seeking a collateral loan). The UI groups these requirements logically (Student, Co-applicant, Collateral) and provides a progress bar showing overall readiness. It also includes built-in consistency checks (e.g., flagging if claimed net worth is surprisingly low compared to total assets).

## Core Calculations

The application performs several key financial calculations in `src/lib/calc.ts` using the following formulas:

- **Total Cost**: 
  `total_cost = tuition_total + (living_cost_per_year × duration_years) + other_costs`
  *(Costs entered in foreign currencies are converted to INR using live exchange rates)*

- **Funding Available**:
  `funding_available = savings + scholarship + fees_already_paid + family_contribution`

- **Funding Gap (Loan Requirement)**:
  `funding_gap = max(0, total_cost - funding_available)`

- **Net Worth**:
  `net_worth = sum(assets) - sum(liabilities)`

- **EMI (Equated Monthly Installment)**:
  `EMI = P × r × (1+r)^n / ((1+r)^n - 1)`
  Where:
  - `P` = loan amount (funding gap)
  - `r` = annual interest rate / 12 / 100
  - `n` = tenor in years × 12
  - *(If `r = 0`, then `EMI = P / n`)*

- **Moratorium Interest (Optional)**:
  If the moratorium assumption is toggled on, simple interest accrues during the study duration and is added to the principal before calculating the EMI.

## Limitations and Assumptions

As required, please note the following limitations and assumptions of this tool:

- **University Rankings**: The dataset doesn't say which university ranking defines "top 100".
- **Gender-based Rates**: Only male/female rates are defined; other values (or "not specified") give "cannot assess" for products that depend on gender.
- **BOI Collateral Default Rate**: The BOI collateral base rate of 9.00% is treated as the default, with an override of 8.60% applied for female students.
- **CIBIL Requirements**: Credila and Auxilo have no CIBIL criterion defined in the dataset, so CIBIL does not affect their assessment status.
- **User Assumptions**: Tenor, moratorium, and exchange rate are explicitly treated as user assumptions because they are not present in the dataset.
- **Net Worth Certificate**: The CA Net Worth Certificate is accepted as an upload per the brief but is not a hard requirement in the lender dataset.
- **Decision Support Only**: This tool is strictly for decision support. A "Meets Criteria" status is an indication that the basic rules in the dataset are satisfied; it is **never** a guarantee of final loan approval. All results screens carry a disclaimer to this effect.
