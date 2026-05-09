# Definition of Done

A change is not complete until it meets all these criteria. Do not merge or commit until every box is checked.

## Code Quality

- [ ] All tests pass: `npm test`
- [ ] Linter passes: `npm run lint`
- [ ] Formatter passes: `npm run format:check`
- [ ] Type check passes: `npm run typecheck`

## Code Review

- [ ] Code reviewed against the [checklist](code-review-checklist.md) (two passes)
- [ ] Pass 1: Architecture and hexagonal compliance
- [ ] Pass 2: Clean code and implementation details

## Test Review

- [ ] Tests reviewed for quality and coverage
- [ ] Happy path covered
- [ ] Edge cases covered
- [ ] Error conditions covered
- [ ] No redundant tests

## Documentation

- [ ] Public APIs documented inline where behavior is non-obvious
- [ ] `docs/` updated if architecture or behavior changed
- [ ] Reading map in `CLAUDE.md` updated if a new doc was added
- [ ] ADR written if an architectural decision was made

## Technical Debt

- [ ] No `TODO` comments left without an issue link
- [ ] No `FIXME` comments left unaddressed
- [ ] No `@ts-ignore` or `@ts-expect-error` without justification
- [ ] No disabled linter rules without justification

## Commit

- [ ] Commit message follows [conventions](commits.md)
- [ ] Commit is small and focused (one logical change)
- [ ] Commit builds, lints, and passes tests independently
- [ ] No AI attribution (no Co-authored-by for AI)

## Deployment Readiness

- [ ] Feature works in the target environment (Shortcuts runtime for engine code)
- [ ] No debug code left in (console.log, hardcoded test values)
- [ ] No secrets committed
- [ ] Bundle size checked if adding dependencies (should not increase significantly)

## Checklist Usage

Before marking a change as complete:

1. Run through this checklist item by item
2. Check the box only if the criterion is fully met
3. If any item fails, fix it before proceeding
4. Do not skip items with "I'll fix it later"

## What "Done" Means

Done means **actually done**. Not "code written but not tested." Not "works on my machine." Not "I'll add docs later."

Done means:
- A stranger could check out the code and run it successfully
- The change could be deployed to production immediately
- No follow-up work is required to complete this change

If there is follow-up work, the current change should be scoped down to what is actually complete, and the follow-up tracked as a separate issue.
