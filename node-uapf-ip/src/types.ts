// UAPF-IP types — mirrors the normative types in
// https://github.com/UAPFormat/UAPF-IP/blob/main/SPEC.md
// Kept in sync with uapf-engine's src/types/uapf-ip.ts.

export interface CapabilityRef {
  namespace: string;       // e.g. "task", "ai", "data"
  operation: string;       // e.g. "assign", "classify", "read"
  version: number;         // e.g. 1
}

export function parseCapabilityRef(ref: string): CapabilityRef {
  const m = ref.match(/^([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)@(\d+)\+?$/);
  if (!m) throw new Error(`Invalid capability reference: ${ref}`);
  return { namespace: m[1], operation: m[2], version: parseInt(m[3], 10) };
}

export function formatCapabilityRef(c: CapabilityRef): string {
  return `${c.namespace}.${c.operation}@${c.version}`;
}

export interface HostCapability extends CapabilityRef {
  meta?: Record<string, unknown>;
}

export interface HostManifest {
  hostDid: string;
  hostBaseUrl: string;
  profiles: string[];
  capabilities: HostCapability[];
  manifestSignature?: string;
}

export type SessionState =
  | "created"
  | "active"
  | "suspended"
  | "completed"
  | "aborted"
  | "failed";

export interface StartSessionRequest {
  packageId: string;
  packageVersion?: string;
  processId: string;
  input: unknown;
  hostManifest: HostManifest;
  guardrailsRef?: string;
}

export interface StartSessionResponse {
  sessionId: string;
  state: SessionState;
  auditChainRoot?: string;
  output?: unknown;
}

export interface EvaluateDecisionRequest {
  packageId: string;
  decisionId: string;
  input: unknown;
}

export interface EvaluateDecisionResult {
  packageId: string;
  decisionId: string;
  outputs: unknown;
  explanations?: unknown[];
}

export interface CapabilityCallContext {
  sessionId: string;
  stepId: string;
  input: unknown;
  guardrails?: Record<string, unknown>;
}

export interface CapabilityCallResponse {
  output: unknown;
  auditEvent?: unknown;
}

export type CapabilityHandler = (
  ctx: CapabilityCallContext
) => Promise<CapabilityCallResponse | unknown> | CapabilityCallResponse | unknown;
