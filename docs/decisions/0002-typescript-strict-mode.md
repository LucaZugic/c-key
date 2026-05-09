# ADR-0002: TypeScript Strict Mode

## Status

Accepted

## Context

TypeScript offers various strictness levels. Loose settings allow implicit `any`, unchecked index access, and other patterns that can hide bugs. Strict settings catch more errors at compile time but require more explicit type annotations.

The rules engine is the core logic of c-key. Bugs in rule evaluation could cause incorrect gear assignments or unwanted activity mutations. Type safety is a defense against these bugs.

## Decision

Enable all strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

Additionally, the ESLint rule `@typescript-eslint/no-explicit-any` is set to error. Any use of `any` fails the build.

## Consequences

**Benefits**:
- Compile-time errors catch type mismatches before runtime
- Discriminated unions are exhaustively checked
- Array access requires undefined handling
- Optional properties cannot be assigned `undefined` when absent
- Refactoring is safer (type errors guide changes)

**Drawbacks**:
- More verbose type annotations required
- Some valid patterns require type guards or assertions
- Third-party type definitions may need augmentation
- Initial development is slower (more typing, more thinking)

**Trade-off accepted**: The long-term safety and maintainability benefits justify the upfront verbosity cost.

## Date

2026-05-09
