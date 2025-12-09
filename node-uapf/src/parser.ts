import AdmZip from "adm-zip";
import { UAPFPackage } from "./types.js";
import {
  assertValid,
  validateManifest,
  validateRoles,
  validateCapabilities,
  validateBindings,
  validateMcpTools,
  validateA2aSchemas,
} from "./validators.js";

function readJson(zip: AdmZip, path: string): any {
  const entry = zip.getEntry(path);
  if (!entry) {
    throw new Error(`Missing required file in archive: ${path}`);
  }
  const content = entry.getData().toString("utf-8");
  return JSON.parse(content);
}

function findComponent(components: string[] | undefined, filename: string): string {
  const matches = (components || []).find((component) => component.endsWith(filename));
  if (!matches) {
    throw new Error(`manifest.json components must include ${filename}`);
  }
  return matches;
}

export function loadUapf(path: string, validate = true): UAPFPackage {
  const zip = new AdmZip(path);

  const manifest = readJson(zip, "manifest.json");

  if (validate) {
    assertValid(validateManifest, manifest, "Manifest");
  }

  const components = manifest.components || {};
  const agents = components.agents as string[] | undefined;
  const integration = components.integration as string[] | undefined;

  const rolesPath = findComponent(agents, "roles.json");
  const capabilitiesPath = findComponent(agents, "capabilities.json");
  const bindingsPath = findComponent(agents, "bindings.json");
  const mcpToolsPath = findComponent(integration, "mcp-tools.json");
  const a2aSchemasPath = findComponent(integration, "a2a-schemas.json");

  const roles = readJson(zip, rolesPath);
  const capabilities = readJson(zip, capabilitiesPath);
  const bindings = readJson(zip, bindingsPath);
  const mcpTools = readJson(zip, mcpToolsPath);
  const a2aSchemas = readJson(zip, a2aSchemasPath);

  if (validate) {
    assertValid(validateRoles, roles, "Roles");
    assertValid(validateCapabilities, capabilities, "Capabilities");
    assertValid(validateBindings, bindings, "Bindings");
    assertValid(validateMcpTools, mcpTools, "MCP Tools");
    assertValid(validateA2aSchemas, a2aSchemas, "A2A Schemas");
  }

  const rawFiles: Record<string, Buffer> = {};
  zip.getEntries().forEach((entry) => {
    rawFiles[entry.entryName] = entry.getData();
  });

  return {
    manifest,
    roles,
    capabilities,
    bindings,
    mcpTools,
    a2aSchemas,
    rawFiles,
  };
}

export function validateUapf(path: string): void {
  loadUapf(path, true);
}
