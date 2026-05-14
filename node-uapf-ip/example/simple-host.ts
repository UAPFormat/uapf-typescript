// Minimal Express-based UAPF-IP host.
//
// Run with: npm run example:host
// Then in another terminal, point a UAPF runtime at http://localhost:8200
// and call start-session for any package that needs data.read@1 or task.assign@1.

import express from "express";
import {
  createHostRouter,
  defineCapability,
  buildHostManifest,
} from "../src/index.js";

// 1. Define handlers for each capability your host offers.

const dataRead = defineCapability("data.read@1", async (ctx) => {
  const { entity, id } = (ctx.input as Record<string, unknown>) || {};
  // In a real host: look up the record in your database.
  return {
    output: {
      entity,
      id,
      data: { name: `Record ${id}`, status: "active" },
      version: "v1",
    },
  };
});

const taskAssign = defineCapability("task.assign@1", async (ctx) => {
  const { role, payload } = (ctx.input as Record<string, unknown>) || {};
  // In a real host: create a task in your inbox / queue.
  const taskInstanceId = `task_${Math.random().toString(36).slice(2, 10)}`;
  console.log(`[host] task.assign role=${role} payload=`, payload);
  return {
    output: {
      taskInstanceId,
      assignee: `${role}@example.com`,
      accessUrl: `https://example.com/tasks/${taskInstanceId}`,
    },
  };
});

const eventEmit = defineCapability("event.emit@1", async (ctx) => {
  const evt = ctx.input as Record<string, unknown>;
  // In a real host: publish to your event bus.
  console.log(`[host] event.emit`, evt);
  return { output: { eventId: `evt_${Date.now()}` } };
});

// 2. Mount the host router.

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 8200;
const HOST_BASE_URL = process.env.HOST_BASE_URL || `http://localhost:${PORT}`;

app.use(
  createHostRouter({
    hostDid: "did:web:simple-host.local",
    hostBaseUrl: HOST_BASE_URL,
    profiles: ["uapf-ip-orchestrated"],
    capabilities: [dataRead, taskAssign, eventEmit],
    onAuditEvent: (e) => console.log(`[host] audit:`, JSON.stringify(e).slice(0, 200)),
    enforceGuardrails: async (cap, ctx) => {
      // Example: reject ai.* calls if guardrails not present in context.
      if (cap.namespace === "ai" && !ctx.guardrails) {
        console.warn(`[host] rejecting ${cap.namespace}.${cap.operation} — no guardrails attached`);
        return false;
      }
      return true;
    },
  })
);

app.listen(PORT, () => {
  console.log(`Simple UAPF-IP host listening on ${HOST_BASE_URL}`);
  console.log(`Manifest: GET  ${HOST_BASE_URL}/uapf/host/manifest`);
  console.log(`Capabilities: data.read@1, task.assign@1, event.emit@1`);
});

// Suppress unused warning for the manifest helper (it's an exported utility).
void buildHostManifest;
