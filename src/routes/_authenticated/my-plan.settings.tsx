// Patient Settings — paciente edita nome e WhatsApp.
// Dados clínicos NÃO entram aqui: vão pelo Runner (anamnese versionada).

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Save, Loader2, ArrowLeft, Sun, Moon, Monitor, Camera, User, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getMyPatientProfile,
  updateMyPatientProfile,
  softDeleteMyPatientAccount,
} from "@/lib/profile/patient-profile.functions";
import { getStoredTheme, setTheme, type ThemeMode } from "@/lib/patient/theme";
import { supabase } from "@/integrations/supabase/client";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { maskPhoneBR } from "@/lib/phone-mask";

export const Route = createFileRoute("/_authenticated/my-plan/settings")({
  head: () => ({ meta: [{ title: "Minha conta — FitJourney" }] }),
  component: PatientSettings,
});

const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-60";

function PatientSettings() {
  const fetchProfile = useServerFn(getMyPatientProfile);
  const updateProfile = useServerFn(updateMyPatientProfile);
  const deleteAccount = useServerFn(softDeleteMyPatientAccount);
  const navigate = useNavigate();


  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-patient-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 10_000,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  function changeTheme(mode: ThemeMode) {
    setThemeState(mode);
    setTheme(mode);
  }

  useEffect(() => {
    if (data) {
      setFullName(data.fullName ?? "");
      setPhone(data.phone ?? "");
      
      setAvatarUrl(data.avatarUrl ?? null);
    }
  }, [data]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 8MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    setPendingFile(file);
  }

  async function handleCroppedUpload(blob: Blob) {
    setUploadingAvatar(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Sessão expirada");
      const path = `${userData.user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60);
      if (signErr) throw signErr;
      setAvatarUrl(signed.signedUrl);
      await updateProfile({ data: { avatarUrl: signed.signedUrl } });
      await refetch();
      toast.success("Foto atualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        data: {
          fullName: fullName.trim(),
          phone: phone.trim(),
        },
      });
      toast.success("Conta atualizada");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSaving(false);
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
          {saving ? "Salvando..." : "Salvar"}
        </button>
      }
    >
      <div className="space-y-8 max-w-2xl">
        <div className="space-y-1 border-b border-border pb-4">
          <Link
            to="/my-plan"
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="size-3" /> Voltar ao plano
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Minha conta
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            01 · Dados pessoais
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <>
              <div className="flex items-center gap-4 pb-2">
                <div className="relative size-20 rounded-full overflow-hidden border border-border bg-background grid place-items-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto de perfil" className="size-full object-cover" />
                  ) : (
                    <User className="size-8 text-muted-foreground" />
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-background/70 grid place-items-center">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-md border border-border hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
                  >
                    <Camera className="size-3.5" />
                    {avatarUrl ? "Trocar foto" : "Adicionar foto"}
                  </button>
                  <p className="text-[10px] text-muted-foreground/70">
                    JPG ou PNG, até 4MB.
                  </p>
                </div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Nome completo
                </label>
                <input
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  WhatsApp
                </label>
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                  placeholder="+55 11 99999-9999"
                  inputMode="tel"
                  maxLength={32}
                />
                <p className="text-[10px] text-muted-foreground/70">
                  Usado pelo seu nutricionista para contato direto.
                </p>
              </div>
              {/* Altura removida das configurações: é dado clínico/antropométrico
                  e pertence à anamnese / avaliação física, não ao perfil pessoal. */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Email
                </label>
                <input
                  className={inputCls}
                  value={data?.email ?? ""}
                  disabled
                />
                <p className="text-[10px] text-muted-foreground/70">
                  Email não pode ser alterado por aqui.
                </p>
              </div>
            </div>
            </>
          )}
        </section>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            02 · Aparência
          </h2>
          <p className="text-xs text-muted-foreground">
            Escolha o tema que você prefere. Salvo neste dispositivo.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { mode: "light", label: "Claro", Icon: Sun },
                { mode: "dark", label: "Escuro", Icon: Moon },
                { mode: "system", label: "Sistema", Icon: Monitor },
              ] as const
            ).map(({ mode, label, Icon }) => {
              const active = theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => changeTheme(mode)}
                  className={
                    "flex flex-col items-center gap-1.5 py-3 rounded-md border text-xs font-medium transition-colors " +
                    (active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40")
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            03 · Dados clínicos
          </h2>
          <p className="text-sm text-muted-foreground">
            Histórico clínico, condições, medicações e exames são versionados
            pela anamnese. Em breve você poderá atualizar diretamente daqui.
          </p>
        </section>
      </div>
      <AvatarCropDialog
        file={pendingFile}
        open={!!pendingFile}
        onClose={() => setPendingFile(null)}
        onConfirm={handleCroppedUpload}
      />
    </AppShell>
  );
}
