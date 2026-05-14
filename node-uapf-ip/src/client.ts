// UapfClient — calls a UAPF-IP-conformant runtime engine over the REST binding.
//
// Typical usage from a host (e.g. an ERP, CRM, DMS):
//
//   const uapf = new UapfClient({ engineUrl: "http://uapf-engine:4000" });
//   const result = await uapf.startSession({
//     packageId: "lv.tiesibsargs.complaint-handling",
//     processId: "complaint-handling",
//     input: { documentDid: doc.did },
//     hostManifest: { ... }
//   });
//
// The client is intentionally thin — no retries, no auth tokens beyond a
// bearer for v0.1. DID-VC signing wires in at v0.2.

import {
  StartSessionRequest,
  StartSessionResponse,
  EvaluateDecisionRequest,
  EvaluateDecisionResult,
} from "./types.js";

export interface UapfClientOptions {
  engineUrl: string;
  authToken?: string;     // Bearer token for now; replace with VC in v0.2
  timeoutMs?: number;     // default 30s
}

export class UapfClient {
  constructor(private readonly opts: UapfClientOptions) {
    if (!opts.engineUrl) throw new Error("UapfClient: engineUrl is required");
  }

  async startSession(req: StartSessionRequest): Promise<StartSessionResponse> {
    return this.post<StartSessionResponse>("/uapf/start-session", req);
  }

  async evaluateDecision(req: EvaluateDecisionRequest): Promise<EvaluateDecisionResult> {
    return this.post<EvaluateDecisionResult>("/uapf/evaluate-decision", req);
  }

  async getSession(sessionId: string): Promise<unknown> {
    return this.get(`/uapf/sessions/${encodeURIComponent(sessionId)}`);
  }

  async getSessionAudit(sessionId: string): Promise<unknown[]> {
    return this.get<unknown[]>(`/uapf/sessions/${encodeURIComponent(sessionId)}/audit`);
  }

  async listPackages(): Promise<unknown[]> {
    return this.get<unknown[]>("/uapf/packages");
  }

  async listSessions(): Promise<unknown[]> {
    return this.get<unknown[]>("/uapf/sessions");
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = this.url(path);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 30000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      return this.parse<T>(res);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async get<T>(path: string): Promise<T> {
    const url = this.url(path);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 30000);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.headers(),
        signal: controller.signal,
      });
      return this.parse<T>(res);
    } finally {
      clearTimeout(timeout);
    }
  }

  private url(path: string): string {
    return `${this.opts.engineUrl.replace(/\/$/, "")}${path}`;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.opts.authToken) h["Authorization"] = `Bearer ${this.opts.authToken}`;
    return h;
  }

  private async parse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { rawText: text };
    }
    if (!res.ok) {
      const body = typeof parsed === "object" ? JSON.stringify(parsed) : String(parsed);
      throw new Error(`UAPF runtime returned ${res.status}: ${body}`);
    }
    return parsed as T;
  }
}
