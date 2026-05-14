// Helpers for assembling a host manifest from a CapabilityDefinition set.

import { CapabilityDefinition } from "./host.js";
import { HostManifest } from "./types.js";

export function buildHostManifest(args: {
  hostDid: string;
  hostBaseUrl: string;
  profiles: string[];
  capabilities: CapabilityDefinition[];
}): HostManifest {
  return {
    hostDid: args.hostDid,
    hostBaseUrl: args.hostBaseUrl,
    profiles: args.profiles,
    capabilities: args.capabilities.map((c) => ({ ...c.ref })),
  };
}
