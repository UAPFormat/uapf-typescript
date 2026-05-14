# uapf-ip

Host SDK for the [UAPF Integration Protocol](https://github.com/UAPFormat/UAPF-IP).

Embed in any host system — DMS, ERP, CRM, IoT gateway, SaaS app — to participate in UAPF process execution: invoke processes from your host, and fulfill capability callbacks the runtime makes back into your host.

## Install

```bash
npm install uapf-ip
```

Requires Node.js 18+. Express 4 or 5 is a peer dependency.

## Two sides

UAPF-IP is bidirectional. Your host both invokes the runtime and gets called back by it. This package gives you both directions.

## Invoking a process (host → runtime)

```typescript
import { UapfClient } from "uapf-ip";

const uapf = new UapfClient({
  engineUrl: process.env.UAPF_ENGINE_URL || "http://uapf-engine:4000",
});

const result = await uapf.startSession({
  packageId: "lv.tiesibsargs.complaint-handling",
  processId: "complaint-handling",
  input: { documentDid: doc.did, receivedAt: doc.receivedAt },
  hostManifest: {
    hostDid: "did:web:my-host.example.com",
    hostBaseUrl: "https://my-host.example.com",
    profiles: ["uapf-ip-orchestrated"],
    capabilities: [
      { namespace: "task", operation: "assign", version: 1 },
      { namespace: "document", operation: "fetch", version: 1 },
      { namespace: "event", operation: "emit", version: 1 },
    ],
  },
});

console.log(result.sessionId, result.state, result.output);
```

Synchronous decisions:

```typescript
const decision = await uapf.evaluateDecision({
  packageId: "com.example.access-control",
  decisionId: "can-access",
  input: { role: "viewer", resource: "audit-log" },
});
```

## Receiving capability callbacks (runtime → host)

When a process the host invoked needs a capability, the runtime calls back into your host. Register a handler per capability:

```typescript
import express from "express";
import { createHostRouter, defineCapability } from "uapf-ip";

const taskAssign = defineCapability("task.assign@1", async (ctx) => {
  const taskId = await myTaskStore.create(ctx.input);
  return {
    output: {
      taskInstanceId: taskId,
      assignee: ctx.input.role + "@example.com",
      accessUrl: `https://my-host.example.com/tasks/${taskId}`,
    },
  };
});

const docFetch = defineCapability("document.fetch@1", async (ctx) => {
  const doc = await myDocStore.find(ctx.input.documentId);
  return { output: { documentId: doc.id, metadata: doc.meta, contentRef: doc.url } };
});

const app = express();
app.use(express.json());
app.use(
  createHostRouter({
    hostDid: "did:web:my-host.example.com",
    hostBaseUrl: "https://my-host.example.com",
    profiles: ["uapf-ip-orchestrated"],
    capabilities: [taskAssign, docFetch],
    onAuditEvent: (e) => myAuditLog.persist(e),
    enforceGuardrails: async (cap, ctx) => {
      // Hook to enforce guardrails before invoking the handler.
      // Return false to reject; runtime receives a 422 guardrail-violation.
      return guardrailEngine.allows(cap, ctx);
    },
  })
);

app.listen(8080);
```

The router serves:

| Endpoint | Purpose |
|---|---|
| `GET /uapf/host/manifest` | Manifest of capabilities + profiles the host offers |
| `POST /uapf/host/capability/:ns/:op` | Dispatch to your handler |
| `POST /uapf/host/audit` | Receive audit events from the runtime |

## Capabilities

`defineCapability(ref, handler, meta?)` registers one operation. The `ref` is a UAPF-IP capability reference like `task.assign@1`, `data.read@1`, `ai.classify@1`. See the [UAPF-IP capability namespace registry](https://github.com/UAPFormat/UAPF-IP/tree/main/capabilities) for the reserved namespaces and their operation schemas.

The handler receives a `CapabilityCallContext`:

```typescript
{
  sessionId: string;       // which process instance is calling
  stepId: string;          // which BPMN/CMMN element triggered this call
  input: unknown;          // the capability input — shape per the namespace schema
  guardrails?: object;     // policy snapshot the process is running under
}
```

It returns either `{ output: ... }` or a bare value the SDK wraps into `{ output }`.

## Guardrails

The `enforceGuardrails` hook fires before every capability invocation. It receives the capability ref and the call context. Returning `false` rejects the call with a `422 guardrail-violation` response that the runtime turns into a `policy_violation` audit event.

This is the right place to wire any policy engine — OPA, your own rule engine, a config-driven check.

## Try the example

```bash
git clone https://github.com/UAPFormat/uapf-typescript.git
cd uapf-typescript/node-uapf-ip
npm install
npm run example:host
```

In another shell, run a UAPF runtime (e.g. `uapf-engine`) and point it at `http://localhost:8200`.

## Status

v0.1. Tracks [UAPF-IP v0.1 draft](https://github.com/UAPFormat/UAPF-IP). DID-VC signing of capability calls is deferred to v0.2; v0.1 uses optional bearer-token auth.

## License

MIT.
