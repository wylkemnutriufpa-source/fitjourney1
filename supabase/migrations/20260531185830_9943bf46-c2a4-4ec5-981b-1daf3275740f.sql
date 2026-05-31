-- ============================================================
-- Fase 2/3 — Módulo Feedback Clínico
-- ============================================================

-- 1) Altura no paciente (necessária para IMC no gráfico)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,2);

-- 2) Frequência de feedback configurada pelo nutricionista (em dias)
ALTER TABLE public.nutritionists
  ADD COLUMN IF NOT EXISTS feedback_frequency_days int NOT NULL DEFAULT 7
  CHECK (feedback_frequency_days BETWEEN 1 AND 90);

-- 3) Tabela de feedbacks (snapshot imutável; sem UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS public.patient_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  nutritionist_id uuid NOT NULL,
  weight_kg numeric(5,2),
  height_cm_snapshot numeric(5,2),
  -- Aderência ao plano
  adherence_rating text NOT NULL
    CHECK (adherence_rating IN ('muito_dificil','dificil','neutro','facil','muito_facil')),
  -- Avaliação dos resultados percebidos
  result_rating text
    CHECK (result_rating IS NULL OR result_rating IN ('piores','abaixo','dentro','acima')),
  notes text,
  photo_front_path text,
  photo_side_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_feedbacks_patient_created
  ON public.patient_feedbacks (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_feedbacks_nutri_created
  ON public.patient_feedbacks (nutritionist_id, created_at DESC);

GRANT SELECT, INSERT ON public.patient_feedbacks TO authenticated;
GRANT ALL ON public.patient_feedbacks TO service_role;

ALTER TABLE public.patient_feedbacks ENABLE ROW LEVEL SECURITY;

-- 4) RLS — paciente insere e lê os próprios
CREATE POLICY "patient inserts own feedback"
  ON public.patient_feedbacks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND p.auth_user_id = auth.uid()
    )
    AND EXISTS (
      -- garante que o nutri informado é o nutri vinculado a esse paciente
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND p.nutritionist_id = patient_feedbacks.nutritionist_id
    )
  );

CREATE POLICY "patient reads own feedback"
  ON public.patient_feedbacks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND p.auth_user_id = auth.uid()
    )
  );

-- 5) RLS — nutri lê feedbacks dos pacientes dele
CREATE POLICY "nutri reads patient feedback"
  ON public.patient_feedbacks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = nutritionist_id AND n.auth_user_id = auth.uid()
    )
  );

-- Sem políticas de UPDATE/DELETE: feedback é imutável (histórico clínico).

-- 6) Bucket privado para fotos
INSERT INTO storage.buckets (id, name, public)
  VALUES ('feedback-photos', 'feedback-photos', false)
  ON CONFLICT (id) DO NOTHING;

-- Path convention: {patient_id}/{feedback_id}/{front|side}.jpg
-- storage.foldername(name)[1] = patient_id

-- Paciente faz upload no próprio diretório
CREATE POLICY "patient uploads own feedback photos"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-photos'
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.auth_user_id = auth.uid()
        AND p.id::text = (storage.foldername(name))[1]
    )
  );

-- Paciente lê as próprias fotos
CREATE POLICY "patient reads own feedback photos"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'feedback-photos'
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.auth_user_id = auth.uid()
        AND p.id::text = (storage.foldername(name))[1]
    )
  );

-- Nutri lê fotos dos pacientes dele
CREATE POLICY "nutri reads patient feedback photos"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'feedback-photos'
    AND EXISTS (
      SELECT 1
      FROM public.patients p
      JOIN public.nutritionists n ON n.id = p.nutritionist_id
      WHERE n.auth_user_id = auth.uid()
        AND p.id::text = (storage.foldername(name))[1]
    )
  );