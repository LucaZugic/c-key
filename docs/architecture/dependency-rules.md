# Dependency Rules

These rules govern what each layer may import. They are non-negotiable. Violating them breaks the hexagonal architecture and compromises testability.

## The Rules

### Domain imports nothing external

`src/domain/` may only import:

- Other files within `src/domain/`
- Standard JavaScript/TypeScript built-ins: `Array`, `Map`, `Set`, `Date`, `Math`, `JSON`, `RegExp`, `String`, `Number`, `Object`, `Error`

`src/domain/` must NOT import:

- Anything from `src/application/`
- Anything from `src/infrastructure/`
- Anything from `src/entry/`
- `fetch` or any HTTP client
- `console` or any logging utility
- `fs`, `path`, or any Node.js API
- Any npm package

**Rationale**: The domain is the heart of the application. It must be pure functions and types that can run anywhere: in the browser, in Node, in a Shortcut's JavaScriptCore, in a test runner. External dependencies destroy this portability.

### Application imports Domain only

`src/application/` may only import:

- `src/domain/`
- Port interfaces defined within `src/application/` itself
- Standard JavaScript/TypeScript built-ins

`src/application/` must NOT import:

- Anything from `src/infrastructure/`
- Anything from `src/entry/`
- `fetch`, `console`, or any runtime API
- Any concrete adapter implementation

**Rationale**: Use cases orchestrate domain logic but do not know how the outside world is accessed. They depend on abstractions (ports), not concretions (adapters).

### Infrastructure imports Domain and Application

`src/infrastructure/` may import:

- `src/domain/`
- `src/application/` (specifically port interfaces)
- Runtime APIs appropriate for the target environment: `fetch`, `JSON`, `console`, standard ES2020 globals

`src/infrastructure/` must NOT import:

- Anything from `src/entry/`

**Rationale**: Adapters implement ports using real I/O. They need access to domain types (to map external data) and port interfaces (to satisfy the contract). They do not need the composition root.

### Entry imports everything

`src/entry/` may import:

- Everything: domain, application, infrastructure

**Rationale**: The entry layer is the composition root. It wires together all the pieces. This is the only place where concrete adapters are instantiated and injected into use cases.

### Tests import everything

`tests/` may import:

- Everything: domain, application, infrastructure, entry

**Rationale**: Tests need to instantiate real objects, including test adapters, and verify behavior across layers.

## Verification

Before committing any change to `src/`, mentally verify:

1. Does this file live in the correct layer based on what it does?
2. Does this file import only from allowed layers?
3. Does this file use any forbidden APIs (`fetch`, `console`, Node APIs) in a layer that prohibits them?

The linter does not automatically enforce layer boundaries (though a custom ESLint rule could be added). This is a discipline enforced by code review.

## Common Violations

| Violation | Why it's wrong | Fix |
|-----------|----------------|-----|
| Domain file imports `fetch` | Domain must be pure | Move HTTP logic to infrastructure adapter |
| Domain file imports `console.log` | Domain must have no side effects | Use a Logger port, inject in application layer |
| Application file imports concrete adapter | Application depends on abstractions, not concretions | Import the port interface, not the adapter class |
| Application file uses `fetch` directly | Application should not know about HTTP | Define a port, implement in infrastructure |
| Infrastructure file imports entry | Circular dependency risk | Never import the composition root from lower layers |

## Visualized

```
+-------------+
|    entry    |  <-- imports everything, wires dependencies
+------+------+
       |
       v
+-------------+
|   application   |  <-- imports domain + port interfaces
+------+------+
       |
       v
+-------------+
|   domain    |  <-- imports nothing external
+-------------+

+------------------+
|  infrastructure  |  <-- imports domain + application (ports), uses runtime APIs
+------------------+
```

The arrows point in the direction of allowed imports. Domain is the inner core; everything depends on it. Entry is the outer shell; it sees everything.
