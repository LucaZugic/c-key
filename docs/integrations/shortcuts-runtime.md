# Shortcuts Runtime

The rules engine runs inside the iOS Shortcuts app via JavaScript execution. This document describes the runtime environment and its constraints.

## Execution Environment

iOS Shortcuts can run JavaScript using the "Run JavaScript on Web Page" action. This action executes JavaScript in a WebKit context similar to Safari. The engine bundle is fetched and evaluated in this environment.

### Available APIs

The runtime provides standard ES2020 JavaScript:

- All ES2020 built-ins: `Array`, `Map`, `Set`, `Object`, `String`, `Number`, `Date`, `Math`, `JSON`, `RegExp`, `Promise`, `async/await`
- `fetch` API for HTTP requests (though the engine should not use this directly)
- `console` for logging (output may not be visible to the user)
- `setTimeout`, `setInterval` (though the engine should not use these)

### Unavailable APIs

The runtime does NOT provide:

- Node.js APIs: `fs`, `path`, `process`, `Buffer`, `require()`
- DOM APIs: `document`, `window`, `localStorage`, `sessionStorage`
- Web Workers
- WebSocket
- IndexedDB
- File system access

The engine must be self-contained. It cannot import modules at runtime (no dynamic `import()`). Everything must be bundled into a single file.

## Bundle Requirements

The engine is bundled using esbuild into a single ES2020 JavaScript file:

```bash
esbuild src/entry/shortcut.ts --bundle --format=esm --target=es2020 --outfile=dist/c-key.js
```

Requirements:
- **Single file**: No external dependencies, no dynamic imports.
- **ES2020 target**: Avoid newer syntax that may not be supported.
- **ESM format**: The bundle is an ES module.
- **No Node shims**: esbuild should not inject Node.js polyfills.

## Calling the Engine from Shortcuts

The Shortcut uses this pattern:

1. **Fetch the bundle**: Use "Get Contents of URL" to download `c-key.js` from GitHub Pages.

2. **Create a data URI**: Convert the JavaScript into a `data:text/html` URI containing a script tag:
   ```html
   <html><body><script type="module">
     // Fetched bundle code here
     const result = evaluateAndPlan(activityJson, rulesJson);
     completion(result);
   </script></body></html>
   ```

3. **Run JavaScript on Web Page**: Execute the data URI. The `completion()` function returns data to the Shortcut.

4. **Parse the result**: The Shortcut receives a JSON string, which it parses to get the ActionPlan.

## Entry Point Contract

The engine exposes a single function callable from the Shortcut:

```typescript
function evaluateAndPlan(activityJson: string, rulesJson: string): string
```

- **Input**: Two JSON strings (not objects). The Shortcut serializes the activity and rules before calling.
- **Output**: A JSON string representing the ActionPlan.

Why strings? The Shortcuts-to-JavaScript bridge handles strings more reliably than complex objects. Serialization is explicit and debuggable.

## Limitations and Workarounds

### No persistent state

The engine runs fresh each time. It has no memory of previous executions. If state is needed (e.g., "last processed activity ID"), the Shortcut must store it in Data Jar and pass it to the engine.

### No network access from engine

The engine should not call `fetch` directly. All Strava API calls are made by the Shortcut, before and after engine execution. The engine receives data and returns a plan; it does not perform I/O.

### Execution timeout

Shortcuts may terminate long-running scripts. The engine should execute in under a second. Rule evaluation is O(rules * filters), which is fast for typical rule counts (< 20 rules, < 10 filters each).

### Error handling

If the engine throws an exception, the Shortcut's "Run JavaScript on Web Page" action fails. The engine should catch errors internally and return a structured error response:

```typescript
interface EngineResult {
  success: boolean;
  plan?: ActionPlan;
  error?: string;
}
```

The Shortcut checks `success` and displays `error` if present.

## Testing the Runtime

The engine is developed and tested in Node.js using Vitest. The actual Shortcuts runtime is tested manually by running the Shortcut on a real iOS device.

To simulate the Shortcuts environment in tests:
- Do not use Node.js-specific APIs in engine code.
- Do not use DOM APIs.
- Use only ES2020 features.

If a test passes in Vitest but fails in the Shortcut, check for accidental use of Node.js or DOM APIs.
