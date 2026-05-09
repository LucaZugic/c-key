# Definition of Done

A change is not complete until all items on this checklist are satisfied. "Almost done" is not done.

## Code Quality

- [ ] **All tests pass locally.** Run the full test suite, not just the tests you wrote.
- [ ] **No new warnings.** Compiler warnings, linter warnings — all clean.
- [ ] **Code reviewed (two passes).** Used the checklist in `code-review-checklist.md`.
- [ ] **Tests reviewed.** Applied the test review section of the checklist.

## Architecture

- [ ] **Domain layer has no forbidden imports.** Verified with grep or inspection.
- [ ] **Strava actions are within proven capabilities.** No `makePrivate`, `delete`, `editMapVisibility`.
- [ ] **Coros types are contained.** Nothing leaks from adapter to domain.
- [ ] **Ports are protocols, adapters are concrete.** Dependency direction is correct.

## Documentation

- [ ] **Public APIs documented.** If non-obvious, add a doc comment explaining why/how.
- [ ] **`docs/` updated.** If behavior or architecture changed, the relevant doc reflects it.
- [ ] **Reading map updated.** If a new doc was added that should be read before certain changes, update `CLAUDE.md`.
- [ ] **ADR written.** If a significant decision was made, record it in `docs/decisions/`.

## Commit

- [ ] **Commit message follows convention.** Type prefix, imperative mood, under 72 chars.
- [ ] **No AI attribution.** No `Co-authored-by: Claude`, no generated-by lines.
- [ ] **Commit is focused.** One concept per commit. Split if doing multiple things.
- [ ] **Commit builds and passes tests.** Each commit is independently valid.

## Cleanup

- [ ] **No `TODO` without issue link.** If it's worth noting, track it.
- [ ] **No commented-out code.** Delete it. Git remembers.
- [ ] **No debugging artifacts.** `print()` statements, hardcoded test values.
- [ ] **No secrets.** Double-check for tokens, keys, passwords.

---

## Quick Self-Check

Before marking a change as complete, answer these questions:

1. **Would I be comfortable explaining this code to a colleague?**
   If not, simplify or document.

2. **If I came back to this in 6 months, would I understand it?**
   Names, structure, and comments should make it clear.

3. **Does this change do exactly what was asked, and nothing more?**
   Avoid scope creep. Separate improvements into separate changes.

4. **Have I tested the unhappy paths?**
   Error cases, edge cases, nil values.

5. **Is there any way this could break something else?**
   If yes, add a regression test.

---

## What "Done" Does Not Mean

- **"It works on my machine."** Tests must pass in a clean environment.
- **"The happy path works."** Edge cases and errors matter.
- **"I'll clean it up later."** Later never comes. Clean it now.
- **"The reviewer will catch issues."** Do your own review first.
- **"It's just a small change."** Small changes can have big impacts. Same rigor.

---

## Process

1. Complete implementation
2. Run full test suite
3. Self-review using checklist (both passes)
4. Self-review tests
5. Update documentation if needed
6. Commit with proper message
7. Mark as done only when all boxes are checked

If any item fails, the change is not done. Fix it first.
