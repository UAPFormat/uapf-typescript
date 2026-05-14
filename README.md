# uapf-typescript

TypeScript implementations and SDKs for the [UAPF](https://github.com/UAPFormat) ecosystem.

This repository is a workspace containing:

| Package | Purpose | Status |
|---|---|---|
| [`node-uapf`](./node-uapf) | Parser + validator for `.uapf` package files | v0.1 |
| [`node-uapf-ip`](./node-uapf-ip) | Host SDK for the [UAPF Integration Protocol](https://github.com/UAPFormat/UAPF-IP) — embed in DMS / ERP / CRM / any host system to participate in UAPF process execution | v0.1 |

## Quick paths

- **You want to read or validate a `.uapf` file in Node.js?** Use [`node-uapf`](./node-uapf).
- **You're building a host that needs to invoke UAPF processes and serve capability callbacks?** Use [`node-uapf-ip`](./node-uapf-ip).

## Roadmap

v0.2 (planned):
- DID-VC signing of capability invocations (currently optional bearer token).
- Streaming session state for long-running processes.
- Python and Go counterparts at `UAPFormat/uapf-python` and `UAPFormat/uapf-go`.

## License

MIT.
