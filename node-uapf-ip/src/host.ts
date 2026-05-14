// Host-side helpers for receiving callbacks from a UAPF runtime.
//
// A host implements one handler per capability it advertises. The
// createHostRouter() function returns an Express router that:
//   - serves GET /uapf/host/manifest with the advertised capabilities
//   - serves POST /uapf/host/capability/{namespace}/{operation} for each
//     registered handler
//   - serves POST /uapf/host/audit to receive audit events from the runtime
//
// Mount the router on your Express app:
//
//   import express from "express";
//   import { createHostRouter, defineCapability } from "uapf-ip";
//
//   const taskAssign = defineCapability("task.assign@1", async (ctx) => {
//     // Translate UAPF capability call into your host's domain action
//     const taskId = await myTaskStore.create({ ...ctx.input });
//     return { taskInstanceId: taskId, assignee: ctx.input.role };
//   });
//
//   const app = express();
//   app.use(express.json());
//   app.use(createHostRouter({
//     hostDid: "did:web:my-host.example.com",
//     hostBaseUrl: "https://my-host.example.com",
//     profiles: ["uapf-ip-orchestrated"],
//     capabilities: [taskAssign],
//   }));

import { Router, Request, Response, NextFunction } from "express";
import {
  CapabilityHandler,
  CapabilityCallContext,
  HostCapability,
  HostManifest,
  parseCapabilityRef,
} from "./types.js";

export interface CapabilityDefinition {
  ref: HostCapability;
  handler: CapabilityHandler;
  meta?: Record<string, unknown>;
}

export function defineCapability(
  ref: string,
  handler: CapabilityHandler,
  meta?: Record<string, unknown>
): CapabilityDefinition {
  const parsed = parseCapabilityRef(ref);
  return {
    ref: { ...parsed, meta },
    handler,
    meta,
  };
}

export interface HostRouterOptions {
  hostDid: string;
  hostBaseUrl: string;
  profiles: string[];
  capabilities: CapabilityDefinition[];
  onAuditEvent?: (event: unknown) => Promise<void> | void;
  // Hook to enforce policy before invoking the handler. Return false to reject.
  enforceGuardrails?: (
    capability: HostCapability,
    ctx: CapabilityCallContext
  ) => Promise<boolean> | boolean;
}

export function createHostRouter(opts: HostRouterOptions): Router {
  const router = Router();

  // Index capabilities by "namespace/operation" for fast dispatch.
  const handlers = new Map<string, CapabilityDefinition>();
  for (const c of opts.capabilities) {
    const key = `${c.ref.namespace}/${c.ref.operation}`;
    if (handlers.has(key)) {
      throw new Error(`Duplicate capability handler: ${key}`);
    }
    handlers.set(key, c);
  }

  // GET /uapf/host/manifest -> declare what this host offers
  router.get("/uapf/host/manifest", (_req: Request, res: Response) => {
    const manifest: HostManifest = {
      hostDid: opts.hostDid,
      hostBaseUrl: opts.hostBaseUrl,
      profiles: opts.profiles,
      capabilities: opts.capabilities.map((c) => ({ ...c.ref })),
    };
    res.json(manifest);
  });

  // POST /uapf/host/capability/:namespace/:operation -> dispatch
  router.post(
    "/uapf/host/capability/:namespace/:operation",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { namespace, operation } = req.params;
        const def = handlers.get(`${namespace}/${operation}`);
        if (!def) {
          res.status(422).json({
            type: "https://uapf.dev/errors/capability-not-available",
            title: "Capability not available",
            status: 422,
            detail: `Host does not implement ${namespace}.${operation}`,
          });
          return;
        }

        const ctx: CapabilityCallContext = {
          sessionId: req.body?.sessionId,
          stepId: req.body?.stepId,
          input: req.body?.input,
          guardrails: req.body?.guardrails,
        };

        if (opts.enforceGuardrails) {
          const allowed = await opts.enforceGuardrails(def.ref, ctx);
          if (!allowed) {
            res.status(422).json({
              type: "https://uapf.dev/errors/guardrail-violation",
              title: "Guardrail violation",
              status: 422,
              detail: `${namespace}.${operation} rejected by host guardrails`,
            });
            return;
          }
        }

        const result = await def.handler(ctx);

        // Accept either { output, auditEvent } or a bare output value
        if (
          result &&
          typeof result === "object" &&
          "output" in (result as Record<string, unknown>)
        ) {
          res.json(result);
        } else {
          res.json({ output: result });
        }
      } catch (err) {
        next(err);
      }
    }
  );

  // POST /uapf/host/audit -> persist audit events emitted by the runtime
  router.post("/uapf/host/audit", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (opts.onAuditEvent) {
        await opts.onAuditEvent(req.body);
      }
      res.json({ acknowledged: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
