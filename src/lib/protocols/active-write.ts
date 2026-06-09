import { findProtocolPhase } from "@/lib/protocols/catalog";
import { protocolPhaseToPlannerTemplate } from "@/lib/protocols/phase-to-template";

export type ApplyActiveProtocolPhaseInput = {
  patientId: string;
  nutritionistId: string;
  protocolId: string;
  moduleId: string;
  phaseId: number;
};

/**
 * Aplica uma fase de protocolo ao paciente e GARANTE que o plano alimentar
 * derivado da fase seja entregue como plano publicado (status='published'),
 * para que apareça em todas as rotas (Patient App, lista de pacientes,
 * dashboard, perfil). Snapshot é imutável após published; ajustes posteriores
 * exigem um novo plano via editor.
 *
 * Operações:
 *  1. Idempotência: se já existe protocolo ativo igual, retorna o existente.
 *  2. Fecha protocolo ativo anterior do mesmo protocol_id (status=completed).
 *  3. Insere novo `patient_active_protocols` com `phase_snapshot` imutável.
 *  4. Arquiva planos publicados anteriores do paciente (status=archived).
 *  5. Publica novo `plans` com snapshot derivado de `protocolPhaseToPlannerTemplate`.
 */
export async function applyActiveProtocolPhase(
  supabase: any,
  input: ApplyActiveProtocolPhaseInput,
): Promise<{ id: string; alreadyActive: boolean }> {
  const found = findProtocolPhase(input.protocolId, input.moduleId, input.phaseId);
  if (!found) throw new Error("Fase de protocolo inválida");

  const { data: existing, error: existingErr } = await supabase
    .from("patient_active_protocols")
    .select("id")
    .eq("patient_id", input.patientId)
    .eq("nutritionist_id", input.nutritionistId)
    .eq("protocol_id", input.protocolId)
    .eq("module_id", input.moduleId)
    .eq("phase_id", input.phaseId)
    .eq("status", "active")
    .maybeSingle();
  if (existingErr) throw new Error(existingErr.message);
  if (existing?.id) {
    // Mesmo idempotente, garante que existe um plano publicado correspondente.
    await ensurePublishedPlanFromPhase(supabase, input, found);
    return { id: existing.id as string, alreadyActive: true };
  }

  const { error: closeErr } = await supabase
    .from("patient_active_protocols")
    .update({ status: "completed" })
    .eq("patient_id", input.patientId)
    .eq("nutritionist_id", input.nutritionistId)
    .eq("protocol_id", input.protocolId)
    .eq("status", "active");
  if (closeErr) throw new Error(closeErr.message);

  const startedAt = new Date();
  const endsAt = new Date(
    startedAt.getTime() + found.phase.durationWeeks * 7 * 24 * 60 * 60 * 1000,
  );

  const { data: row, error } = await supabase
    .from("patient_active_protocols")
    .insert({
      patient_id: input.patientId,
      nutritionist_id: input.nutritionistId,
      protocol_id: input.protocolId,
      protocol_name: found.protocol.name,
      module_id: input.moduleId,
      module_name: found.module.name,
      phase_id: input.phaseId,
      phase_snapshot: JSON.parse(JSON.stringify(found.phase)),
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await ensurePublishedPlanFromPhase(supabase, input, found);

  return { id: row.id as string, alreadyActive: false };
}

/**
 * Garante que existe um plano publicado para esta fase do protocolo.
 * Idempotente: se já existe um `plans` publicado com mesmo
 * `source_template_key`, não republica.
 */
async function ensurePublishedPlanFromPhase(
  supabase: any,
  input: ApplyActiveProtocolPhaseInput,
  found: NonNullable<ReturnType<typeof findProtocolPhase>>,
) {
  const sourceTemplateKey = `protocol-${input.protocolId}-${input.moduleId}-${input.phaseId}`;

  const { data: existingPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("patient_id", input.patientId)
    .eq("status", "published")
    .eq("source_template_key", sourceTemplateKey)
    .maybeSingle();
  if (existingPlan?.id) return;

  // Arquiva planos publicados anteriores para que o novo seja o único ativo.
  await supabase
    .from("plans")
    .update({ status: "archived" })
    .eq("patient_id", input.patientId)
    .eq("status", "published");

  const template = protocolPhaseToPlannerTemplate(found.protocol, found.module, found.phase);
  const publishedAt = new Date().toISOString();
  const snapshot = {
    ...template,
    publishedAt,
    publishedFromProtocol: true,
    protocolMeta: template.protocolMeta,
  };

  const { error } = await supabase.from("plans").insert({
    patient_id: input.patientId,
    nutritionist_id: input.nutritionistId,
    schema_version: 3,
    status: "published",
    snapshot,
    source_template_key: sourceTemplateKey,
    published_at: publishedAt,
  });
  if (error) throw new Error(error.message);
}
