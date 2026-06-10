
-- Diagnostic triggers (admin-editable bank of rotating phrases)
CREATE TABLE public.diagnostic_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  prioridade INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  frases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.diagnostic_triggers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_triggers TO authenticated;
GRANT ALL ON public.diagnostic_triggers TO service_role;

ALTER TABLE public.diagnostic_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active triggers"
  ON public.diagnostic_triggers
  FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admins can read all triggers"
  ON public.diagnostic_triggers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert triggers"
  ON public.diagnostic_triggers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update triggers"
  ON public.diagnostic_triggers
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete triggers"
  ON public.diagnostic_triggers
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER diagnostic_triggers_touch
  BEFORE UPDATE ON public.diagnostic_triggers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Diagnostic responses (quiz answers tied to landing leads)
CREATE TABLE public.diagnostic_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.landing_leads(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  answers JSONB NOT NULL,
  diagnosis JSONB,
  imc NUMERIC(5,2),
  peso_ideal NUMERIC(6,2),
  diferenca_kg NUMERIC(6,2),
  triggers_acionados TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.diagnostic_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_responses TO authenticated;
GRANT ALL ON public.diagnostic_responses TO service_role;

ALTER TABLE public.diagnostic_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a diagnostic response"
  ON public.diagnostic_responses
  FOR INSERT
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 200
    AND char_length(email) BETWEEN 4 AND 255
    AND char_length(whatsapp) BETWEEN 5 AND 40
  );

CREATE POLICY "Admins can read all diagnostic responses"
  ON public.diagnostic_responses
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete diagnostic responses"
  ON public.diagnostic_responses
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_diagnostic_responses_lead ON public.diagnostic_responses(lead_id);
CREATE INDEX idx_diagnostic_responses_created ON public.diagnostic_responses(created_at DESC);

-- Seed initial triggers
INSERT INTO public.diagnostic_triggers (slug, nome, prioridade, ativo, frases) VALUES
  ('imc_sobrepeso', 'Sobrepeso / Acima do peso ideal', 10, true, '[
    "Você está aproximadamente {diferencaKg} kg acima do peso ideal para sua altura e idade. Isso é totalmente ajustável com consistência.",
    "Seu IMC indica sobrepeso. Com as mudanças certas você tem excelente potencial de melhoria.",
    "Seu peso atual mostra uma boa oportunidade de transformação. Muitos pacientes conseguem excelentes resultados."
  ]'::jsonb),
  ('imc_abaixo', 'Abaixo do peso ideal', 9, true, '[
    "Você está cerca de {diferencaKg} kg abaixo do peso ideal. Ganhar massa magra com qualidade vai melhorar muito sua disposição.",
    "Seu IMC indica baixo peso. Uma estratégia de aporte calórico inteligente vai te trazer mais energia e saúde."
  ]'::jsonb),
  ('imc_ideal', 'Peso dentro do ideal', 5, true, '[
    "Seu peso está dentro da faixa ideal. Agora é otimizar composição corporal, energia e qualidade da alimentação.",
    "Parabéns, seu IMC está na faixa saudável. Vamos focar em performance, longevidade e hábitos consistentes."
  ]'::jsonb),
  ('agua_baixa', 'Consumo baixo de água', 8, true, '[
    "Seu consumo de água ainda está baixo. Aumentar a hidratação vai melhorar energia, inchaço e controle da fome.",
    "Beber mais água é uma das mudanças mais simples e poderosas que você pode fazer a partir de hoje.",
    "Hidratação não é seu ponto forte ainda. Comece com um copo ao acordar e antes das refeições."
  ]'::jsonb),
  ('hipertensao', 'Hipertensão / Pressão alta', 9, true, '[
    "Com pressão alta, reduzir sódio e alimentos processados faz muita diferença. Atividade física também ajuda bastante.",
    "Sua hipertensão pode melhorar significativamente com menos sal e mais alimentos ricos em potássio (banana, espinafre, abacate).",
    "Diminuir sódio + aumentar movimento é uma combinação poderosa para cuidar da sua pressão arterial."
  ]'::jsonb),
  ('diabetes', 'Diabetes ou pré-diabetes', 10, true, '[
    "Com diabetes no radar, priorizar proteínas, fibras e reduzir açúcares refinados vai ajudar a estabilizar a glicemia.",
    "Controlar o consumo de açúcar e carboidratos refinados é essencial agora. Seu corpo vai agradecer rapidinho.",
    "Reduzir picos de glicemia através da alimentação pode trazer mais energia e bem-estar já nas primeiras semanas."
  ]'::jsonb),
  ('tireoide', 'Problemas de tireoide', 9, true, '[
    "Quando a tireoide está alterada, o plano precisa ser bem personalizado para apoiar o metabolismo.",
    "Problemas de tireoide exigem atenção especial na alimentação. Nutrientes como selênio e iodo são importantes.",
    "Cuidar da tireoide com alimentação adequada acelera os resultados de energia e composição corporal."
  ]'::jsonb),
  ('sop_insulina', 'SOP / Resistência à insulina', 9, true, '[
    "Com resistência à insulina, distribuir carboidratos ao longo do dia e priorizar fibras faz muita diferença.",
    "SOP responde muito bem a um plano com baixo índice glicêmico e mais movimento. Vamos por esse caminho."
  ]'::jsonb),
  ('intestino_inchaco', 'Intestino preso ou inchaço frequente', 8, true, '[
    "O inchaço frequente costuma melhorar bastante quando aumentamos fibras, água e reduzimos processados.",
    "Seu intestino pede mais atenção. Alimentos fermentados, fibras solúveis e boa hidratação fazem milagre.",
    "Reduzir inchaço abdominal é totalmente possível com as escolhas certas de alimentos e rotina."
  ]'::jsonb),
  ('compulsao', 'Compulsão alimentar ou ansiedade com comida', 8, true, '[
    "A compulsão melhora muito quando criamos um plano que te mantém saciado e sem restrições extremas.",
    "Vamos trabalhar tanto a parte física quanto a emocional da sua relação com a comida.",
    "Com um plano bem estruturado e flexível, a compulsão diminui e você recupera o controle."
  ]'::jsonb),
  ('energia_baixa', 'Cansaço e baixa energia', 7, true, '[
    "Sua energia baixa pode estar ligada à alimentação, hidratação e sono. Vamos ajustar os três.",
    "Melhorar a qualidade das refeições e do sono costuma trazer mais disposição já na primeira semana.",
    "Com pequenas mudanças na alimentação você pode recuperar energia de forma natural."
  ]'::jsonb),
  ('sedentarismo', 'Sedentarismo', 7, true, '[
    "Incluir movimento regular vai potencializar todos os resultados nutricionais.",
    "Atividade física + boa alimentação é a combinação mais poderosa que existe para saúde e emagrecimento.",
    "Começar com caminhadas ou treinos leves já traz benefícios enormes."
  ]'::jsonb),
  ('sono_ruim', 'Sono insuficiente', 6, true, '[
    "Dormir menos de 7h por noite afeta muito o metabolismo e a fome. Melhorar o sono é prioridade.",
    "Sono de qualidade é fundamental para emagrecer e ter energia. Vamos trabalhar isso também.",
    "Ajustar sono + alimentação costuma trazer resultados surpreendentes."
  ]'::jsonb),
  ('refeicoes_poucas', 'Poucas refeições por dia', 5, true, '[
    "Fazer menos de 3 refeições por dia tende a aumentar compulsão. Vamos estruturar uma rotina equilibrada.",
    "Distribuir melhor as refeições ao longo do dia ajuda a controlar fome e estabilizar energia."
  ]'::jsonb);
