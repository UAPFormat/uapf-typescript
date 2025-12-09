# uapf-typescript

Official **TypeScript / Node.js parser & validator** for [UAPF](https://github.com/UAPFormat/UAPF-spec) packages.

This library lets you load `.uapf` archives in Node/TypeScript services, validate them, and access their contents using typed interfaces.

> Status: Early draft – API and package name may change before UAPF v1.0.

---

## Installation

Until this package is published to npm, use a Git dependency or local checkout:

```bash
git clone https://github.com/UAPFormat/uapf-typescript.git
cd uapf-typescript
npm install
npm run build
```

In your own project you can reference the built package via `file:` in `package.json`, or depend on the GitHub repo directly.

---

## Quick example

```ts
import { loadUapfPackage } from "uapf-typescript"; // adjust to actual export

async function main() {
  const pkg = await loadUapfPackage("examples/acme-docflow.uapf");

  // Validate against official JSON Schemas
  await pkg.validate();

  console.log(pkg.manifest.id, pkg.manifest.version);
  console.log(pkg.agents.roles);
  console.log(pkg.integration.mcpTools);
}

main().catch(console.error);
```

(Adapt function and property names to your real API.)

---

## Features

- **Zip package loading**
  - Load from filesystem paths, buffers, or streams.

- **Schema validation**
  - Uses schemas from [`UAPF-spec`](https://github.com/UAPFormat/UAPF-spec).

- **Typed access**
  - TypeScript interfaces for:
    - `manifest`
    - `agents` (roles, capabilities, bindings)
    - `decisions`
    - `integration` (MCP tools, A2A schemas, APIs)
    - `metadata`

- **Integration-friendly**
  - Intended for:
    - UAPF viewers & web tooling (`uapf-viewer`)
    - Node-based UAPF engines and MCP servers
    - Orchestrators running in Node (LangChain JS, LangGraph, etc.)

---

## Roadmap

- Publish to npm under an official scope (e.g. `@uapf/ts`).
- Add a CLI `uapf-validate`.
- Helpers for mapping UAPF agents → MCP tools / LLM function signatures.

---

## Development

```bash
git clone https://github.com/UAPFormat/uapf-typescript.git
cd uapf-typescript
npm install
npm run lint
npm test
```

---

## License

MIT – see [`LICENSE`](LICENSE) if present, or follow org-wide license.

