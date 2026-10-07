# Project rules - GradGuide Education Loan Assessment Tool

You are helping build a hiring assignment for GradGuide. Read these files before starting any task:
- `docs/SPEC.md` - full requirements, formulas, features, tests (source of truth for behaviour)
- `src/data/lenders.json` - source of truth for all lender rules, rates and document lists
- `docs/design-tokens.md` and the `gradguide-brand` skill (once they exist) - source of truth for visual style

## Hard rules
1. Never hard-code lender rules, rates, CIBIL minimums or document lists. Read them from `src/data/lenders.json` only. If a rule isn't in that file, say "not specified in the dataset" or return `cannot_assess`. Do not invent rules (no made-up loan caps, tenors or collateral ratios).
2. Never claim a loan will be approved or rejected. Use wording like "may be relevant" or "criteria met in dataset". Every results screen shows: "Decision-support only. Not a guarantee of loan approval or rejection."
3. Any number the user didn't enter and the dataset doesn't provide (tenor, exchange rate, moratorium) must be a visible, editable, labelled assumption.
4. Incomplete input must give a partial result with clear "missing information" notes, never a crash or a silent default.

## Architecture
- Stack: Vite + React + TypeScript, Tailwind, shadcn/ui, Vitest. No backend.
- All calculation and assessment logic lives in `src/lib/` as plain TypeScript with no UI imports.
- Components in `src/components/` only render and collect input.
- Write tests first for anything in `src/lib/`. `npm test` must pass before you say a task is done.

## UI
- Use official shadcn/ui components for forms, inputs, tables and dialogs (shadcn MCP).
- Use Shadcn Space blocks only for page-level layout, and only if they fit the brand.
- Visual style comes from `gradguide-brand` / `docs/design-tokens.md`. The `frontend-design` skill is for quality only (hierarchy, spacing, states, responsiveness); do not use it to invent a new look that departs from the brand.
- Do not copy GradGuide's logo, photos, testimonials or marketing copy. Match the style, not the assets.
- Responsive from 360px wide. Include empty, loading and error states.

## Working style
- Plan first for anything bigger than a small edit, then implement in small steps.
- Do not add dependencies without telling me why.
- After each feature, summarise in plain language: what you built, which files, which assumptions. I must be able to explain every decision in an interview.
- Do not put secrets or API keys in the repo.
- Keep commits small. Suggest a commit message when tests are green.
