import Ajv, { ValidateFunction } from "ajv";
import manifestSchema from "../../schemas/uapf-manifest.schema.json" assert { type: "json" };
import rolesSchema from "../../schemas/uapf-roles.schema.json" assert { type: "json" };
import capabilitiesSchema from "../../schemas/uapf-capabilities.schema.json" assert { type: "json" };
import bindingsSchema from "../../schemas/uapf-bindings.schema.json" assert { type: "json" };
import mcpToolsSchema from "../../schemas/uapf-mcp-tools.schema.json" assert { type: "json" };
import a2aSchemasSchema from "../../schemas/uapf-a2a-schemas.schema.json" assert { type: "json" };

const ajv = new Ajv({ allErrors: true });

function assertValid(validateFn: ValidateFunction, data: unknown, name: string): void {
  const valid = validateFn(data);
  if (!valid) {
    const errors = validateFn.errors?.map((e) => `${e.instancePath || '/'} ${e.message}`).join("; ") || "Unknown validation error";
    throw new Error(`${name} validation failed: ${errors}`);
  }
}

const validateManifest = ajv.compile(manifestSchema);
const validateRoles = ajv.compile(rolesSchema);
const validateCapabilities = ajv.compile(capabilitiesSchema);
const validateBindings = ajv.compile(bindingsSchema);
const validateMcpTools = ajv.compile(mcpToolsSchema);
const validateA2aSchemas = ajv.compile(a2aSchemasSchema);

export {
  assertValid,
  validateManifest,
  validateRoles,
  validateCapabilities,
  validateBindings,
  validateMcpTools,
  validateA2aSchemas,
};
