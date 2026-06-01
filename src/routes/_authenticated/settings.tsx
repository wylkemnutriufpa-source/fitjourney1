import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Save, Loader2, Copy, Link2, MessageCircle, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyNutritionistProfile,
  updateMyNutritionistProfile,
  getOrCreateMyReferralCode,
} from "@/lib/profile/nutritionist-profile.functions";
import {
  getMyFeedbackFrequency,
  setMyFeedbackFrequency,
} from "@/lib/feedback/feedback.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — FitJourney" }] }),
  component: Settings,
});

const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-60";

function onlyDigits(s: string) {
  return s.replace(/\D+/g, "");
}

function Settings() {
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const updateProfile = useServerFn(updateMyNutritionistProfile);
  const getReferral = useServerFn(getOrCreateMyReferralCode);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["my-nutritionist-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 10_000,
  });

  // Frequência de feedback (lado nutri).
  const getFreq = useServerFn(getMyFeedbackFrequency);
  const setFreq = useServerFn(setMyFeedbackFrequency);
  const { data: freqData, refetch: refetchFreq } = useQuery({
    queryKey: ["my-feedback-frequency"],
    queryFn: () => getFreq(),
    staleTime: 60_000,
  });
  const [freqDays, setFreqDays] = useState<number>(7);
  const [savingFreq, setSavingFreq] = useState(false);
  useEffect(() => {
    if (freqData?.days) setFreqDays(freqData.days);
  }, [freqData]);
  async function handleSaveFreq() {
    setSavingFreq(true);
    try {
      await setFreq({ data: { days: freqDays } });
      toast.success("Frequência atualizada");
      await refetchFreq();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar frequência");
    } finally {
      setSavingFreq(false);
    }
  }

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [crn, setCrn] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setDisplayName(profile.displayName ?? "");
      setAvatarUrl(profile.avatarUrl ?? null);
      setCrn(profile.crn ?? "");
      setEmail(profile.email ?? "");
      setSpecialty(profile.specialty ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  // Referral / invite link
  const [referral, setReferral] = useState<{ code: string } | null>(null);
  const [loadingRef, setLoadingRef] = useState(false);

  async function loadReferral() {
    setLoadingRef(true);
    try {
      const r = await getReferral();
      setReferral(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar link de convite");
    } finally {
      setLoadingRef(false);
    }
  }

  // Tenta carregar/gerar quando o perfil estiver pronto.
  useEffect(() => {
    if (profile && !referral && !loadingRef) {
      void loadReferral();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const inviteUrl = useMemo(() => {
    if (!referral) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/signup/patient?code=${referral.code}`;
  }, [referral]);

  const waUrl = useMemo(() => {
    const d = onlyDigits(phone);
    if (!d) return "";
    return `https://wa.me/${d}`;
  }, [phone]);

  async function handleSave() {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        data: {
          fullName: fullName.trim(),
          displayName: displayName.trim() || undefined,
          avatarUrl: avatarUrl || undefined,
          crn: crn.trim() || undefined,
          email: email.trim(),
          specialty: specialty.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      });
      toast.success("Configurações salvas");
      await refetch();
      if (!referral) void loadReferral();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 4MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    setUploadingAvatar(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Sessão expirada");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${userData.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60);
      if (signErr) throw signErr;
      setAvatarUrl(signed.signedUrl);
      toast.success("Foto carregada — clique em Salvar para confirmar");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploadingAvatar(false);
    }
  }


  async function copy(text: string, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <AppShell
      header={
        <button
          onClick={handleSave}
          disabled={saving || isLoading}
          className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      }
    >
      <div className="space-y-8 max-w-3xl">
        <div className="space-y-1 border-b border-border pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Perfil & Preferências
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            01 · Dados Profissionais
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando perfil…</p>
          ) : (
            <>
              {/* Avatar + display name row */}
              <div className="flex items-start gap-4 pb-4 border-b border-border">
                <div className="relative">
                  <div className="size-20 rounded-full bg-background border border-border overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      <User className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 grid place-items-center bg-background/70 rounded-full">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Como você quer ser chamado
                    </label>
                    <input
                      className={inputCls}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={saving}
                      placeholder="Dr. Wylkem Raiol"
                      maxLength={120}
                    />
                    <p className="text-[10px] text-muted-foreground/70">
                      Aparece no convite enviado ao paciente.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar || saving}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border border-border rounded-md hover:border-primary disabled:opacity-50"
                  >
                    <Upload className="size-3.5" />
                    {avatarUrl ? "Trocar foto" : "Enviar foto"}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(null)}
                      disabled={uploadingAvatar || saving}
                      className="ml-2 text-[11px] text-muted-foreground hover:text-destructive underline"
                    >
                      remover
                    </button>
                  )}
                </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Nome completo
                </label>
                <input
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Registro CRN
                </label>
                <input
                  className={inputCls}
                  value={crn}
                  onChange={(e) => setCrn(e.target.value)}
                  disabled={saving}
                  placeholder="CRN-3 12345"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Especialidade
                </label>
                <input
                  className={inputCls}
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  disabled={saving}
                  placeholder="Esportiva, Clínica, Materno-infantil…"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Telefone / WhatsApp
                </label>
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                  placeholder="+55 11 99999-9999"
                />
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline mt-1"
                  >
                    <MessageCircle className="size-3" />
                    {waUrl}
                  </a>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Email
                </label>
                <input
                  className={inputCls}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            </>
          )}
        </section>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            02 · Frequência de feedback
          </h2>
          <p className="text-xs text-muted-foreground -mt-1">
            De quantos em quantos dias seus pacientes devem registrar feedback?
            O paciente recebe um lembrete visual quando passa do prazo.
          </p>
          <div className="flex items-center gap-3 max-w-md">
            <input
              type="number"
              min={1}
              max={90}
              step={1}
              value={freqDays}
              onChange={(e) => setFreqDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
              className={inputCls + " w-24"}
              disabled={savingFreq}
            />
            <span className="text-xs text-muted-foreground">dias</span>
            <button
              type="button"
              onClick={handleSaveFreq}
              disabled={savingFreq || freqDays === freqData?.days}
              className="ml-auto bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 rounded-md hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {savingFreq ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Salvar
            </button>
          </div>
        </section>


        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
              03 · Link público de convite
            </h2>
            <button
              onClick={loadReferral}
              disabled={loadingRef || !profile}
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {loadingRef ? "Gerando..." : "Atualizar"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Compartilhe este link com novos pacientes. Eles entram pelo link e ficam
            vinculados automaticamente ao seu cadastro.
          </p>
          {!profile ? (
            <p className="text-xs text-muted-foreground">
              Salve seu perfil antes para liberar o link de convite.
            </p>
          ) : !referral ? (
            <p className="text-xs text-muted-foreground">
              {loadingRef ? "Gerando link…" : "Nenhum link disponível."}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 border border-border rounded-md bg-background">
                <Link2 className="size-4 text-primary shrink-0" />
                <code className="text-xs flex-1 truncate">{inviteUrl}</code>
                <button
                  onClick={() => copy(inviteUrl, "Link")}
                  className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-border rounded hover:border-primary/40"
                >
                  <Copy className="size-3" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">Código: {referral.code}</span>
                <button
                  onClick={() => copy(referral.code, "Código")}
                  className="underline hover:text-foreground"
                >
                  copiar código
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
