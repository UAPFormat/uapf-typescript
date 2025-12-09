export interface UAPFPackage {
  manifest: any;
  roles: any;
  capabilities: any;
  bindings: any;
  mcpTools: any;
  a2aSchemas: any;
  rawFiles: Record<string, Buffer>;
}
