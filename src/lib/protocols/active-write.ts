import { findProtocolPhase } from "@/lib/protocols/catalog";

export type ApplyActiveProtocolPhaseInput = {
  patientId: string;
  nutritionistId: string;
  protocolId: string;
  moduleId: string;
  phaseId: number;
};

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
  if (existing?.id) return { id: existing.id as string, alreadyActive: true };

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

  return { id: row.id as string, alreadyActive: false };
}