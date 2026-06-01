// Versões dos motores clínicos e do gate. Bump MANUAL a cada mudança
// comportamental (não apenas cosmética). Persistidas em
// snapshot.clinicalAudit para que auditoria futura responda:
//   "este plano foi publicado com qual motor / qual gate?"
//
// Convenção: "<nome>@<semver>".
export const ENGINE_VERSION = "engine@1.0.0";
export const GATE_VERSION = "gate@1.0.0";
