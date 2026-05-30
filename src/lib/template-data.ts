// Banco de templates clínicos / esportivos / regionais
// REGRA: todos os alimentos referenciam imagens existentes em src/assets/foods/
// Itens nunca acoplam — sempre granular (1 alimento + qty), com equivalentes que
// escalonam proporcionalmente quando a qty do item principal muda.

export type FoodItem = {
  id: string;
  foodKey: string;     // chave da imagem (sem .jpg)
  name: string;        // nome de exibição
  qty: number;         // quantidade base (numérica)
  unit: string;        // g | ml | unid | fatia | scoop | colher
};

export type MealSlot = {
  id: string;
  time: string;
  label: string;       // Café da manhã, Almoço...
  /** Item principal da refeição */
  main: FoodItem;
  /** Equivalentes calóricos — escalonam proporcionalmente ao main */
  equivalents: FoodItem[];
  /** Imagem ilustrativa do card (usa foodKey do main se vazio) */
  heroKey?: string;
};

export type DietTemplate = {
  id: string;
  name: string;
  category:
    | "Esportivo"
    | "Clínico"
    | "Regional"
    | "Gestante"
    | "Pré/Pós-operatório"
    | "Bariátrica";
  description: string;
  tags: string[];
  kcal: number;
  meals: MealSlot[];
  /** Orientações nutricionais editáveis — vão junto no PDF/WhatsApp. */
  orientacoes?: string;
};

/** Texto padrão de Orientações Nutricionais por categoria — base editável. */
export function defaultOrientacoes(category: DietTemplate["category"]): string {
  const base = [
    "• Beba pelo menos 35 ml de água por kg de peso por dia.",
    "• Mastigue bem os alimentos — coma com calma, sem distrações.",
    "• Respeite os horários das refeições; evite pular qualquer uma.",
    "• Priorize alimentos in natura; evite ultraprocessados e refrigerantes.",
    "• As substituições equivalentes mantêm a mesma calorias/macros — escolha conforme disponibilidade.",
  ];
  const extras: Record<DietTemplate["category"], string[]> = {
    Esportivo: [
      "• Faça a refeição pré-treino 60–90 min antes do treino.",
      "• Consuma a refeição pós-treino em até 60 min após o estímulo.",
      "• Em treinos longos (>90 min) considere reposição de carbo e eletrólitos.",
    ],
    Clínico: [
      "• Reduza sal e açúcar adicionados ao mínimo.",
      "• Evite frituras e gorduras hidrogenadas.",
      "• Acompanhe os marcadores laboratoriais nas consultas de retorno.",
    ],
    Regional: [
      "• Priorize peixes e frutas regionais da estação.",
      "• Use açaí puro ou com aveia/tapioca — evite xaropes açucarados.",
    ],
    Gestante: [
      "• Não pule a ceia para evitar hipoglicemia noturna.",
      "• Evite peixes crus, embutidos e laticínios não pasteurizados.",
      "• Mantenha a suplementação prescrita (ácido fólico, ferro).",
    ],
    "Pré/Pós-operatório": [
      "• Siga rigorosamente o jejum prescrito pelo cirurgião.",
      "• Evite frituras e fibras em excesso nas 48h pré-cirurgia.",
      "• No pós, evolua a consistência apenas com liberação da equipe.",
    ],
    Bariátrica: [
      "• Pare ao primeiro sinal de saciedade — volumes pequenos.",
      "• NÃO tome líquidos durante a refeição (aguarde 30 min antes/depois).",
      "• Mastigue cada porção 20–30 vezes.",
      "• Mantenha suplementação prescrita (multivit, B12, ferro, cálcio).",
    ],
  };
  return [...base, "", ...extras[category]].join("\n");
}

/** Orientações ESPECÍFICAS por template — texto clínico direcionado ao protocolo. */
const templateOrientacoes: Record<string, string> = {
  "esp-hipertrofia": `OBJETIVO: superávit calórico moderado (+300 a +500 kcal/dia) com ≈2 g de proteína/kg para maximizar síntese proteica.

• Distribua a proteína em 5–6 refeições (25–40 g por refeição) — isso eleva a MPS ao longo do dia.
• Pré-treino (60–90 min antes): priorize carbo de absorção média (pão+ovo, tapioca, cuscuz) + proteína.
• Pós-treino (até 60 min): combine carbo + proteína (panqueca proteica, sanduíche de frango, iogurte+granola) para repor glicogênio.
• Hidratação: 35–40 ml/kg/dia; em treinos longos adicione 500–750 ml/h com eletrólitos.
• Creatina (3–5 g/dia) e whey podem ser úteis — discutir com nutricionista esportivo.
• Durma 7–9 h: o crescimento muscular ocorre no sono.
• Pesar quinzenalmente em jejum, mesmo horário. Ganho saudável: 0,25–0,5 kg/semana.`,

  "esp-endurance": `OBJETIVO: alta disponibilidade de carboidrato (6–10 g/kg/dia) para sustentar treinos longos de corrida, ciclismo e triathlon.

• Pré-treino longo (2–3 h antes): 1–4 g de carbo/kg (banana+aveia, mingau, tapioca).
• Durante treinos > 60 min: 30–60 g de carbo/h (gel, banana, isotônico). Em >2,5 h, suba para 60–90 g/h.
• Pós-treino: janela de 30 min — combine carbo (1 g/kg) + proteína (0,3 g/kg) para repor glicogênio.
• Hidratação: pese antes e depois do treino — reponha 1,5 L para cada kg perdido.
• Eletrólitos (Na 500–700 mg/L) em treinos > 1 h ou em calor.
• Suplemente ferro se houver fadiga ou queda de performance — solicite ferritina nos exames.
• Evite frituras 24 h antes de provas; teste qualquer alimento novo no treino, nunca na competição.`,

  "esp-cutting": `OBJETIVO: déficit calórico moderado (300–500 kcal/dia) preservando massa magra. Proteína alta (2,2–2,6 g/kg).

• Pese-se 1x/semana, em jejum, sempre no mesmo dia/horário. Meta: 0,5–1% do peso/semana.
• Mantenha o treino de força pesado — o estímulo é o que protege a musculatura no déficit.
• Pré-treino leve (omelete, crepioca) 60 min antes; pós-treino com proteína (whey, frango, ovos).
• Use vegetais à vontade no almoço/jantar — saciedade sem custo calórico.
• Café preto e chás (sem açúcar) ajudam na saciedade e podem ser ilimitados.
• Cuidado com "calorias líquidas" — suco, refrigerante e álcool sabotam o déficit.
• Se houver platô > 3 semanas: avalie atividade diária (passos) antes de cortar mais calorias.
• Refeed (dia com carbo elevado) a cada 7–14 dias pode ajudar adesão e performance.`,

  "cli-lowcarb": `OBJETIVO: reduzir carboidrato total para 60–80 g/dia para melhorar sensibilidade à insulina e perda de peso.

• Elimine: açúcar, refrigerante, suco, pão branco, arroz branco, massa, batata, doces.
• Permitidos à vontade: folhas, brócolis, couve-flor, abobrinha, pepino, tomate, ovos, carnes, peixes, queijos.
• Frutas com moderação: prefira morango, framboesa, mirtilo (até 1 xícara/dia).
• Gordura boa é amiga: azeite, abacate, castanhas, peixes gordos.
• Beba 2,5–3 L de água/dia — low-carb aumenta diurese e perda de eletrólitos.
• Adicione sal (himalaia/marinho) à comida — previne a "low-carb flu" nos primeiros 5 dias.
• Monitore glicemia capilar se for diabético — pode ser necessário reduzir medicação (consulte médico).
• Não é para sempre — após 8–12 semanas, reintroduza carbos complexos gradualmente.`,

  "cli-diabetes": `OBJETIVO: controlar glicemia mantendo HbA1c < 7%. Fracionar carboidratos ao longo do dia e priorizar baixo índice glicêmico.

• PROIBIDOS: açúcar, mel, rapadura, refrigerante, suco de caixinha, doces, pão branco.
• Carbos liberados (com porção controlada): tapioca, cuscuz integral, pão integral, batata-doce, aveia, quinoa.
• Sempre combine carbo + proteína + fibra na mesma refeição — reduz pico glicêmico.
• Frutas: 1 unidade por vez, com casca/bagaço, preferencialmente após refeição.
• Faça 5–6 refeições/dia em intervalos regulares (3–4 h) — evita hipoglicemia.
• Monitore glicemia capilar: jejum, 2h pós-café, 2h pós-almoço, 2h pós-jantar (conforme orientação médica).
• Caminhada de 15 min após refeições reduz glicemia pós-prandial em até 30%.
• Hipoglicemia (suor, tremor, fome súbita): tomar 15 g de carbo rápido (1 colher de açúcar ou suco).`,

  "cli-colesterol": `OBJETIVO: reduzir LDL e triglicerídeos. Eliminar gordura trans/saturada e aumentar fibras solúveis.

• ELIMINE: frituras, manteiga, banha, bacon, embutidos (salsicha, mortadela, presunto), biscoito recheado, margarina dura.
• Substitua por: azeite extra-virgem, abacate, castanhas (30 g/dia), peixes gordos (sardinha, atum, salmão) 2–3x/semana.
• Aveia: 30–40 g/dia (mingau, panqueca) — a beta-glucana reduz colesterol em até 10%.
• 5 porções de frutas e vegetais por dia — fibras solúveis "varrem" o colesterol intestinal.
• Carnes vermelhas no máximo 2x/semana, sempre magras (patinho, alcatra, lagarto).
• Retire pele de frango e gordura visível de qualquer carne antes do preparo.
• Álcool eleva triglicerídeos — limite a 1 dose/dia (mulher) ou 2 doses/dia (homem).
• Reavalie lipidograma em 3 meses; meta: LDL < 100 mg/dL (ou < 70 se alto risco).`,

  "cli-figado": `OBJETIVO: reverter esteatose hepática. Perda de 7–10% do peso reduz gordura hepática significativamente.

• ÁLCOOL: ZERO. Mesmo doses pequenas pioram a esteatose.
• ELIMINE: frituras, refrigerante, suco de caixinha, açúcar adicionado, doces, frutose industrial.
• Reduza carbos refinados — frutose hepática vira gordura direto no fígado.
• Café (3–4 xícaras/dia, sem açúcar) é PROTETOR — comprovado em estudos.
• Priorize proteína magra: peixe, frango sem pele, ovos, tofu.
• Aumente vegetais verdes escuros (couve, brócolis, espinafre) — ricos em colina.
• Caminhada de 30 min/dia 5x/semana reduz gordura hepática mesmo sem grande perda de peso.
• Reavalie enzimas hepáticas (ALT, AST, GGT) e ultrassom em 3–6 meses.
• Cuidado com suplementos "naturais" sem prescrição — muitos são hepatotóxicos.`,

  "cli-hipertensao": `OBJETIVO: reduzir PA seguindo padrão DASH. Meta: < 130/80 mmHg.

• SAL: máximo 5 g/dia (1 colher de chá rasa, somando tudo).
• ELIMINE: caldos prontos, sopas de pacote, embutidos, salgadinhos, conservas, queijos amarelos.
• Tempere com: alho, cebola, salsinha, cebolinha, açafrão, orégano, limão, vinagre.
• Aumente POTÁSSIO: banana, laranja, mamão, melão, abacate, batata-doce, feijão, espinafre.
• Aumente CÁLCIO/MAGNÉSIO: iogurte natural, leite magro, sementes (chia, linhaça), oleaginosas.
• Reduza cafeína (máx. 2 xícaras de café/dia) e álcool (máx. 1 dose/dia).
• Atividade aeróbica 150 min/semana reduz PA em 5–8 mmHg.
• Meça PA em casa 2x/semana, sempre no mesmo horário, após 5 min de repouso.
• Não interrompa medicação por conta própria mesmo com PA normalizada — converse com o médico.`,

  "cli-renais": `OBJETIVO: prevenir formação de cálculos renais. Diluir urina e reduzir fatores litogênicos.

• ÁGUA: mínimo 2,5–3 L/dia (urina deve ficar clara, quase incolor). Esta é a medida mais importante.
• Adicione limão à água (1 limão/dia) — citrato inibe formação de cálculos.
• REDUZA SAL: máximo 5 g/dia — sódio aumenta excreção de cálcio na urina.
• MODERE OXALATO (se cálculo de oxalato): espinafre, beterraba, chocolate, amendoim, chá preto, soja.
• NÃO restrinja cálcio — paradoxalmente, cálcio da dieta (laticínios, brócolis) PROTEGE contra cálculos.
• Reduza proteína animal (máx. 1,2 g/kg/dia) — excesso aumenta acidez urinária.
• Limite refrigerantes (especialmente cola — ricos em ácido fosfórico).
• Frutas cítricas (laranja, lima) e melancia ajudam pelo alto teor de água e citrato.
• Reavalie com urocultura/urina 24h e ultrassom conforme orientação do urologista.`,

  "cli-vesicula": `OBJETIVO: reduzir crises de cólica biliar evitando estímulo à contração da vesícula por alimentos gordurosos.

• ELIMINE TOTALMENTE: frituras, bacon, manteiga, creme de leite, leite integral, queijos amarelos, embutidos, frutos do mar gordurosos.
• Evite: chocolate, gema de ovo em excesso (máx. 3/semana), oleaginosas em grande quantidade.
• Prefira: peixes magros, frango sem pele, claras de ovo, laticínios desnatados, vegetais cozidos.
• Faça 5–6 refeições pequenas/dia — jejum prolongado favorece formação de cálculos.
• Cozinhe sempre: cozido, assado, grelhado, vapor. NUNCA frito.
• Beba 2 L de água/dia, distribuídos.
• Evite refeições muito volumosas, principalmente à noite.
• Crise de cólica (dor intensa no hipocôndrio direito): jejum + procurar pronto-socorro.
• Cirurgia de vesícula (colecistectomia) é a única solução definitiva — discuta com cirurgião.`,

  "po-pre-op": `OBJETIVO: preparar o organismo para a cirurgia, otimizando reservas proteicas e reduzindo inflamação.

• Suplementação proteica (whey ou caseinato 20–30 g 2x/dia) nas 2 semanas anteriores acelera recuperação.
• Vitamina C e zinco (frutas cítricas, oleaginosas) auxiliam cicatrização.
• ZERO ÁLCOOL nos 7 dias anteriores — aumenta sangramento e infecção.
• ZERO TABACO — afeta cicatrização e oxigenação.
• 48h antes: dieta de baixo resíduo (sem feijão, brócolis, repolho, cereais integrais).
• JEJUM PRÉ-OPERATÓRIO (siga rigorosamente a orientação do anestesista):
   – Sólidos: 6–8 h antes
   – Líquidos claros (água, chá ralo): até 2 h antes (protocolo ERAS)
• Carga de carboidrato (maltodextrina 100 g) até 2 h antes reduz resistência insulínica pós-operatória.
• Suspenda anti-inflamatórios e suplementos como ginkgo, alho, ginseng 7 dias antes (risco de sangramento).
• Confirme jejum, medicações e horário com a equipe cirúrgica 24 h antes.`,

  "po-pos-op": `OBJETIVO: evoluir a consistência da dieta com segurança, fornecendo proteína para cicatrização sem sobrecarregar o sistema digestivo.

• EVOLUÇÃO DA CONSISTÊNCIA (apenas com liberação médica):
   1. Líquida clara (água, chá, isotônico): primeiras 24 h.
   2. Líquida completa (caldos, vitaminas, mingau ralo): 24–72 h.
   3. Pastosa (purê, sopa cremosa, mingau): 3–7 dias.
   4. Branda (cozidos macios, sem casca/grão): 7–14 dias.
   5. Geral, conforme tolerância.
• PROTEÍNA é prioridade: 1,5–2 g/kg/dia para cicatrização.
• Hidratação: 30–35 ml/kg/dia em pequenos goles ao longo do dia.
• ZERO frituras, embutidos, ultraprocessados, álcool por pelo menos 30 dias.
• Suplementação: whey, vitamina C, zinco, arginina podem acelerar cicatrização.
• Sinais de alerta: vômitos persistentes, febre, dor abdominal forte, distensão → procurar atendimento.
• Constipação é comum no pós-op: aumente fibras gradualmente conforme tolerar + caminhada leve.
• Não force a evolução — respeite o tempo do seu organismo e as orientações da equipe.`,

  "ges-gestante": `OBJETIVO: nutrir mãe e bebê no 2º/3º trimestre com +300 kcal/dia. Foco em ferro, cálcio, folato, DHA e proteína.

• PROIBIDOS: peixes crus (sushi, sashimi), carnes mal-passadas, ovo cru, leite/queijos não pasteurizados, embutidos crus (presunto cru, salame), álcool (ZERO em qualquer quantidade).
• Limite cafeína a 200 mg/dia (≈2 xícaras de café).
• FERRO: carne vermelha magra 3x/semana + vegetais verdes escuros. Combine com vitamina C (laranja, limão) para melhor absorção.
• CÁLCIO: 1.000 mg/dia — laticínios pasteurizados, sardinha, gergelim, tofu.
• FOLATO/ÁCIDO FÓLICO: mantenha suplementação prescrita. Vegetais verdes, feijão, lentilha.
• DHA (ômega-3): peixes de águas frias 2x/semana (sardinha, salmão) — fundamental para cérebro do bebê.
• Fracione em 5–6 refeições pequenas — controla náusea, azia e hipoglicemia.
• Ceia OBRIGATÓRIA (copo de leite, iogurte) — previne hipoglicemia noturna.
• Hidratação: 2,5–3 L/dia. Caminhadas leves diárias, conforme liberação do obstetra.
• Ganho de peso esperado no 2º/3º trim.: 350–500 g/semana (peso pré-gestacional normal).`,

  "bar-pos-bariatrica": `OBJETIVO: fornecer proteína suficiente (60–80 g/dia) em volumes pequenos sem provocar dumping ou intolerância.

• MASTIGUE 20–30 VEZES cada porção. Coma em 20–30 minutos cada refeição.
• NÃO TOME LÍQUIDOS DURANTE AS REFEIÇÕES — aguarde 30 min antes e 30 min depois.
• Hidratação: 1,5–2 L/dia em pequenos goles, fora das refeições.
• PROTEÍNA SEMPRE PRIMEIRO no prato — depois vegetais, depois carbo (se houver espaço).
• Suplementação OBRIGATÓRIA E VITALÍCIA: polivitamínico, B12, ferro, cálcio, vitamina D.
• ZERO açúcar e doces — risco de dumping (sudorese, tontura, taquicardia, diarreia).
• ZERO refrigerante (gases distendem o pouch) e álcool (absorção rápida).
• Pare ao primeiro sinal de saciedade — forçar provoca vômito e pode dilatar o pouch.
• Sinais de alerta: vômitos repetidos, dor torácica ao engolir, intolerância a líquidos → procurar equipe.
• Acompanhamento mensal nos primeiros 6 meses, depois trimestral. Exames laboratoriais semestrais.`,

  "reg-paraense": `OBJETIVO: aproveitar a riqueza nutricional da culinária paraense de forma equilibrada, com porções controladas.

• AÇAÍ é fruta — mas tem ≈250 kcal por 100 g (puro). Limite a 300–400 ml/dia, sem xarope de guaraná ou açúcar.
• Prefira açaí com tapioca, farinha d'água ou aveia — sem complementos açucarados.
• PEIXES regionais (tambaqui, pirarucu, filhote, tucunaré) são excelentes — 2–3x/semana, grelhados ou cozidos.
• Pupunha, macaxeira e bolo de macaxeira são carbos densos — pese a porção, evite no jantar.
• Farofa de ovo: ótima fonte proteica, mas controle a quantidade de farinha (≈2 colheres de sopa).
• Frutas regionais (cupuaçu, bacuri, taperebá, abacaxi, manga): livres na sobremesa.
• Tucupi e jambu: liberados (baixa caloria), mas atenção ao sal em pratos como tacacá.
• Hidratação: 35 ml/kg/dia. O calor amazônico exige reposição constante.
• Limite refrigerantes guaraná locais — alta concentração de açúcar.
• Combine sempre proteína (peixe/frango) + carbo regional + vegetal/fruta em cada refeição.`,

  "cli-sem-gluten": `OBJETIVO: eliminar completamente o glúten (doença celíaca, sensibilidade não-celíaca ou alergia ao trigo).

• PROIBIDOS: trigo, centeio, cevada, aveia não certificada, malte, cerveja. Inclui pão francês, macarrão comum, biscoitos, bolos, salgados, pizza, cuscuz marroquino, seitan.
• PERMITIDOS: arroz, milho, mandioca, batata, batata-doce, tapioca, polvilho, cuscuz de milho (paulista/nordestino), quinoa, amaranto, trigo-sarraceno, aveia certificada SEM glúten.
• ATENÇÃO À CONTAMINAÇÃO CRUZADA: use utensílios separados (tábua, torradeira, panela). Leia rótulos — busque selo "SEM GLÚTEN" (lei 10.674/2003).
• Embutidos, molhos prontos, shoyu, caldos em cubo, hambúrguer industrializado podem conter glúten — confirme no rótulo.
• Reposição de fibras: feijão, lentilha, chia, linhaça, frutas com casca, vegetais — fundamental porque dietas SG tendem a ser pobres em fibra.
• Suplementação: ferro, ácido fólico, B12, cálcio e vitamina D podem estar deficientes — solicite exames a cada 6 meses.
• Em restaurantes: pergunte sobre preparo, frituras compartilhadas e farinhas de espessamento.
• Sintomas após contaminação (diarreia, dor abdominal, fadiga) podem durar semanas — não relaxe a vigilância.`,

  "cli-sem-lactose": `OBJETIVO: eliminar lactose (intolerância primária/secundária) mantendo cálcio e vitamina D adequados.

• PROIBIDOS (com lactose): leite de vaca/cabra, iogurte comum, queijos frescos (minas, ricota, requeijão), creme de leite, leite condensado, manteiga comum, sorvete, doce de leite, achocolatado em pó.
• PERMITIDOS: leites vegetais (amêndoa, coco, arroz, soja — sem adição de açúcar), leite ZERO lactose, queijos envelhecidos (parmesão, grana padano, gouda — naturalmente baixos em lactose), iogurtes ZERO lactose, manteiga ghee.
• Lactase em cápsula (5.000–9.000 FCC) pode ser usada antes de exposições acidentais.
• ATENÇÃO À LACTOSE OCULTA: pães, biscoitos, embutidos, molhos prontos, medicamentos, suplementos proteicos (whey concentrado tem lactose — prefira isolado ou hidrolisado).
• Reposição de CÁLCIO (1.000 mg/dia): sardinha com espinha, brócolis, couve, gergelim, tofu, amêndoa, bebidas vegetais fortificadas.
• Reposição de VITAMINA D: exposição solar 15 min/dia + suplementação conforme exame (25-OH-D).
• Sintomas (gases, distensão, diarreia 30 min–2h após consumo) confirmam exposição.
• Em intolerância secundária (pós-infecção intestinal), reintrodução gradual após 4–8 semanas pode ser tolerada.`,

  "cli-sem-gluten-lactose": `OBJETIVO: eliminar simultaneamente glúten e lactose (celíaca + intolerância à lactose, comum por dano de vilosidades intestinais).

• Combine TODAS as restrições dos protocolos SEM GLÚTEN e SEM LACTOSE.
• Base segura: arroz, milho, mandioca, batata, batata-doce, tapioca, quinoa + proteínas (ovo, frango, peixe, carne) + frutas e vegetais.
• Bebidas: leites vegetais sem adição (amêndoa, coco, arroz). Evite os "sabor cereais" que podem conter aveia/cevada não certificada.
• Queijos envelhecidos certificados sem glúten (parmesão, grana) são uma opção quando há tolerância.
• Pães e massas: específicos SG + sem lactose (linha Schar, Aminna, BellaVita — confirme rótulo).
• Suplementação geralmente necessária: cálcio, vitamina D, ferro, B12, ácido fólico, zinco. Reavalie a cada 6 meses.
• Refeições fora de casa: priorize grelhados simples + arroz + salada + fruta — minimiza risco de contaminação.
• Em recuperação intestinal (3–6 meses sem glúten), a lactose pode voltar a ser tolerada — teste com orientação profissional.
• Mantenha diário alimentar nos primeiros 90 dias para identificar gatilhos residuais.`,

  "cli-fodmap": `OBJETIVO: reduzir FODMAPs (oligo, di e monossacarídeos fermentáveis e polióis) para controlar SII (síndrome do intestino irritável).

• PROTOCOLO EM 3 FASES (sempre com nutricionista):
   1. ELIMINAÇÃO (2–6 semanas): retira TODOS os alimentos altos em FODMAP.
   2. REINTRODUÇÃO (6–8 semanas): testa cada grupo individualmente.
   3. PERSONALIZAÇÃO: dieta sustentável de longo prazo com tolerâncias individuais.
• ALTOS em FODMAP (EVITAR na fase 1): alho, cebola, trigo, centeio, feijão, lentilha, grão-de-bico, leite, iogurte, mel, maçã, pera, manga, melancia, abacate (>1/8), cogumelo, couve-flor, brócolis (haste), adoçantes em "-ol" (sorbitol, manitol, xilitol).
• BAIXOS em FODMAP (LIBERADOS): arroz, batata, mandioca, quinoa, aveia (40 g), ovos, frango, peixe, carne, tofu firme, leites sem lactose, queijos envelhecidos, banana firme, morango, mamão, melão cantaloupe, uva, abacaxi, kiwi, laranja, abobrinha, cenoura, espinafre, alface, tomate, pepino, azeite.
• Temperos seguros: óleo de alho-infundido (não o alho em si), cebolinha (só parte verde), gengibre, açafrão, ervas frescas.
• Tamanho da porção importa — mesmo alimentos baixos podem virar altos em grandes quantidades.
• Hidratação e exercício leve (caminhada) ajudam motilidade intestinal.
• ATENÇÃO: não é dieta para vida toda. A fase 1 mais longa que 8 semanas pode prejudicar microbiota.
• Use app Monash University FODMAP Diet como referência confiável.`,

  "cli-gastrite": `OBJETIVO: aliviar inflamação gástrica, reduzir secreção ácida e proteger a mucosa (gastrite/úlcera/H. pylori).

• EVITE: café, chá preto/mate, refrigerante (especialmente cola), bebida alcoólica, frituras, gordura em excesso, embutidos, alimentos defumados, pimenta, mostarda, vinagre em excesso.
• EVITE FRUTAS ÁCIDAS em jejum: laranja, limão, abacaxi, kiwi, maracujá, acerola. Podem ser toleradas após refeição.
• EVITE chocolate, hortelã (relaxam o esfíncter esofágico inferior — pioram refluxo).
• PRIORIZE: mingau de aveia, banana, mamão, maçã sem casca, pera cozida, batata, batata-doce, arroz branco, frango/peixe grelhados, ovos cozidos/pochê, iogurte natural, queijos brancos magros.
• FRACIONE em 5–6 refeições pequenas — estômago vazio aumenta acidez.
• MASTIGUE BEM e coma devagar (20–30 min por refeição) — saliva neutraliza ácido.
• NÃO se deite por 2–3 h após comer. Eleve cabeceira da cama em 15 cm se houver refluxo noturno.
• Última refeição até 3 h antes de dormir.
• ANTI-INFLAMATÓRIOS (AAS, ibuprofeno, diclofenaco) AGRAVAM — evite ou use com proteção gástrica prescrita.
• Cigarro e estresse aumentam secreção ácida — manejo é parte do tratamento.
• Em gastrite por H. pylori: tratamento antibiótico (10–14 dias) prescrito pelo médico é obrigatório para cura.
• Sinais de alerta: dor noturna intensa, vômito com sangue, fezes pretas, perda de peso → procurar atendimento imediato.`,
};

/** Retorna orientações específicas do template (se houver), ou fallback por categoria. */
export function orientacoesFor(t: Pick<DietTemplate, "id" | "category">): string {
  return templateOrientacoes[t.id] ?? defaultOrientacoes(t.category);
}



// ---- Catálogo enxuto de alimentos (apenas o que existe no banco de imagens) ----
// Reaproveitamos para montar refeições. Cada chave corresponde a um arquivo .jpg
// em src/assets/foods/.

const F = {
  // Cafés / lanches
  pao_ovo: { foodKey: "pao-com-ovo", name: "Pão francês + ovo", unit: "porção" },
  pao_queijo: { foodKey: "pao-com-queijo", name: "Pão francês + queijo", unit: "porção" },
  tapioca_ovo: { foodKey: "tapioca-com-ovo", name: "Tapioca recheada com ovo", unit: "unid" },
  tapioca_queijo: { foodKey: "tapioca-com-queijo", name: "Tapioca recheada com queijo", unit: "unid" },
  cuscuz_ovo: { foodKey: "cuscuz-com-ovo", name: "Cuscuz + ovo", unit: "porção" },
  crepioca: { foodKey: "crepioca", name: "Crepioca", unit: "unid" },
  omelete: { foodKey: "omelete", name: "Omelete", unit: "unid" },
  ovos_cozidos: { foodKey: "ovos-cozidos", name: "Ovos cozidos", unit: "unid" },
  ovos_mexidos: { foodKey: "ovos-mexidos", name: "Ovos mexidos", unit: "unid" },
  ovos_bacon: { foodKey: "ovos-com-bacon", name: "Ovos com bacon", unit: "porção" },
  mingau_aveia: { foodKey: "mingau-de-aveia", name: "Mingau de aveia", unit: "g" },
  banana_aveia: { foodKey: "banana-com-aveia", name: "Banana com aveia", unit: "porção" },
  mamao_aveia: { foodKey: "mamao-com-aveia", name: "Mamão com aveia", unit: "porção" },
  iogurte_natural: { foodKey: "iogurte-natural", name: "Iogurte natural", unit: "g" },
  iogurte_fruta: { foodKey: "iogurte-com-fruta", name: "Iogurte com fruta", unit: "porção" },
  iogurte_granola: { foodKey: "iogurte-com-ganola", name: "Iogurte com granola", unit: "porção" },
  panqueca_proteica: { foodKey: "panqueca-proteica", name: "Panqueca proteica", unit: "unid" },
  cha_torrada: { foodKey: "cha-com-torrada", name: "Chá + torrada integral", unit: "porção" },
  cha_torrada_queijo: { foodKey: "cha-com-torrada-e-queijo", name: "Chá + torrada com queijo", unit: "porção" },
  copo_leite: { foodKey: "copo-de-leite-morno", name: "Copo de leite morno", unit: "ml" },
  torrada_integral: { foodKey: "torrada-integral", name: "Torrada integral", unit: "unid" },
  pao_de_queijo: { foodKey: "pao-de-queijo", name: "Pão de queijo", unit: "unid" },

  // Frutas
  abacaxi: { foodKey: "abacaxi", name: "Abacaxi", unit: "g" },
  goiaba: { foodKey: "goiaba", name: "Goiaba", unit: "unid" },
  laranja: { foodKey: "laranja", name: "Laranja", unit: "unid" },
  maca: { foodKey: "maca", name: "Maçã", unit: "unid" },
  mamao: { foodKey: "mamao", name: "Mamão", unit: "g" },
  manga: { foodKey: "manga", name: "Manga", unit: "g" },
  melancia: { foodKey: "melancia", name: "Melancia", unit: "g" },
  melao: { foodKey: "melao", name: "Melão", unit: "g" },
  morango: { foodKey: "morango", name: "Morango", unit: "g" },
  pera: { foodKey: "pera", name: "Pera", unit: "unid" },
  uva: { foodKey: "uva", name: "Uva", unit: "g" },
  frutas_vermelhas: { foodKey: "frutas-vermelhas", name: "Frutas vermelhas", unit: "g" },
  salada_frutas: { foodKey: "salada-de-frutas", name: "Salada de frutas", unit: "g" },
  vitamina_fruta: { foodKey: "vitamina-de-fruta", name: "Vitamina de fruta", unit: "ml" },
  smoothie: { foodKey: "smoff-de-frutas", name: "Smoothie de frutas", unit: "ml" },

  // Almoço/jantar — carnes
  frango_grelhado: { foodKey: "frango-grelhado", name: "Frango grelhado", unit: "g" },
  bife_acebolado: { foodKey: "bife-acebolado", name: "Bife acebolado", unit: "g" },
  carne_grelhada: { foodKey: "carne-grelhada", name: "Carne grelhada", unit: "g" },
  carne_batata: { foodKey: "carne-com-batata", name: "Carne + batata", unit: "g" },
  carne_assada: { foodKey: "carne-assada-de-panela", name: "Carne assada de panela", unit: "g" },
  acem: { foodKey: "acem", name: "Acém cozido", unit: "g" },
  maminha: { foodKey: "maminha", name: "Maminha", unit: "g" },
  picanha: { foodKey: "picanha", name: "Picanha grelhada", unit: "g" },
  picanha_suina: { foodKey: "picanha-suina", name: "Picanha suína", unit: "g" },
  lombo_suino: { foodKey: "lombo-suino", name: "Lombo suíno", unit: "g" },
  file_porco: { foodKey: "file-de-porco", name: "Filé de porco", unit: "g" },
  costela_suina: { foodKey: "costela-suina", name: "Costela suína", unit: "g" },
  costela_bovina: { foodKey: "costela-bovina-com-batata", name: "Costela bovina + batata", unit: "g" },
  coxa_sobrecoxa: { foodKey: "coxa-e-sobrecoxa", name: "Coxa e sobrecoxa", unit: "g" },
  frango_batata_doce: { foodKey: "frango-com-batata-doce", name: "Frango + batata doce", unit: "g" },
  file_tilapia: { foodKey: "file-de-tilapia", name: "Filé de tilápia", unit: "g" },
  peixe_legumes: { foodKey: "peixe-com-legumes", name: "Peixe com legumes", unit: "g" },
  macarrao_carne: { foodKey: "macarrao-com-carne-moida", name: "Macarrão + carne moída", unit: "g" },
  macarronada_camarao: { foodKey: "macarronada-de-camarao", name: "Macarronada de camarão", unit: "g" },
  strog_carne: { foodKey: "strogonoff-de-carne", name: "Strogonoff de carne", unit: "g" },
  strog_frango: { foodKey: "strogonoff-de-frango-light", name: "Strogonoff de frango light", unit: "g" },
  strog_camarao: { foodKey: "strogonoff-de-camarao", name: "Strogonoff de camarão", unit: "g" },

  // Sopas / leves / clínicas
  canja: { foodKey: "canja-de-galinha-com-legumes", name: "Canja de galinha + legumes", unit: "ml" },
  sopa_legumes: { foodKey: "sopa-de-legumes", name: "Sopa de legumes", unit: "ml" },
  salada_completa: { foodKey: "salada-completa", name: "Salada completa", unit: "g" },
  sanduiche_natural: { foodKey: "sanduiche-natural", name: "Sanduíche natural", unit: "unid" },
  sanduiche_frango: { foodKey: "sanduiche-natural-de-frango", name: "Sanduíche natural de frango", unit: "unid" },
  pao_frango: { foodKey: "pao-com-frango-desfiado", name: "Pão + frango desfiado", unit: "porção" },

  // Regionais / paraenses
  acai: { foodKey: "acai", name: "Açaí", unit: "ml" },
  acai_tapioca: { foodKey: "acai-com-tapioca", name: "Açaí com tapioca", unit: "porção" },
  acai_aveia: { foodKey: "acai-com-aveia", name: "Açaí com aveia", unit: "porção" },
  acai_frango: { foodKey: "acai-com-frango", name: "Açaí com frango", unit: "porção" },
  acai_peixe: { foodKey: "acai-com-peixe-frito", name: "Açaí com peixe frito", unit: "porção" },
  pupunha_cafe: { foodKey: "pupunha-com-cafe", name: "Pupunha + café", unit: "porção" },
  macaxeira_cafe: { foodKey: "macaxeira-com-cafe", name: "Macaxeira + café", unit: "porção" },
  bolo_macaxeira: { foodKey: "bolo-de-macaxeira-com-cafe", name: "Bolo de macaxeira + café", unit: "porção" },
  bolo_milho: { foodKey: "bolo-de-milho-com-cafe", name: "Bolo de milho + café", unit: "porção" },
  farofa_ovo: { foodKey: "farofa-ovo", name: "Farofa de ovo", unit: "g" },
  farofa_ovo_cafe: { foodKey: "farofa-de-ovo-com-cafe", name: "Farofa de ovo + café", unit: "porção" },
  milho_cozido: { foodKey: "milho-cozido", name: "Milho cozido", unit: "g" },
} as const;

type FKey = keyof typeof F;
let _i = 0;
const item = (key: FKey, qty: number): FoodItem => {
  _i++;
  const f = F[key];
  return { id: `it-${_i}-${key}`, foodKey: f.foodKey, name: f.name, qty, unit: f.unit };
};

let _m = 0;
const meal = (
  time: string,
  label: string,
  main: FoodItem,
  equivalents: FoodItem[],
): MealSlot => {
  _m++;
  return { id: `m-${_m}`, time, label, main, equivalents };
};

// ====================== TEMPLATES ======================

export const templates: DietTemplate[] = [
  // ---------- ESPORTIVOS ----------
  {
    id: "esp-hipertrofia",
    name: "Hipertrofia — Superávit Moderado",
    category: "Esportivo",
    description:
      "Plano hiperproteico (≈2g/kg) com carbo moderado-alto. Foco em treino de força.",
    tags: ["Musculação", "Crossfit", "Hipertrofia"],
    kcal: 3000,
    meals: [
      meal("07:00", "Café da manhã",
        item("pao_ovo", 1),
        [item("tapioca_ovo", 1), item("cuscuz_ovo", 1), item("crepioca", 2), item("omelete", 1)]),
      meal("10:00", "Lanche da manhã",
        item("iogurte_granola", 1),
        [item("banana_aveia", 1), item("mamao_aveia", 1), item("vitamina_fruta", 300)]),
      meal("13:00", "Almoço",
        item("frango_grelhado", 180),
        [item("bife_acebolado", 180), item("picanha", 180), item("acem", 180), item("file_tilapia", 200)]),
      meal("16:30", "Lanche da tarde",
        item("panqueca_proteica", 2),
        [item("sanduiche_frango", 1), item("pao_frango", 1)]),
      meal("19:30", "Jantar",
        item("peixe_legumes", 200),
        [item("frango_batata_doce", 200), item("carne_grelhada", 180), item("strog_frango", 200)]),
      meal("22:00", "Ceia",
        item("iogurte_natural", 200),
        [item("ovos_cozidos", 3), item("copo_leite", 250)]),
    ],
  },
  {
    id: "esp-endurance",
    name: "Endurance — Alto Carbo",
    category: "Esportivo",
    description: "Treinos longos (corrida/ciclismo/triathlon). Janelas de carbo pré e pós.",
    tags: ["Corrida", "Ciclismo", "Triathlon"],
    kcal: 3200,
    meals: [
      meal("05:30", "Pré-treino",
        item("banana_aveia", 1),
        [item("mingau_aveia", 200), item("tapioca_queijo", 1), item("crepioca", 2)]),
      meal("09:00", "Pós-treino",
        item("vitamina_fruta", 400),
        [item("smoothie", 400), item("iogurte_granola", 1), item("acai_aveia", 1)]),
      meal("12:30", "Almoço",
        item("macarrao_carne", 250),
        [item("macarronada_camarao", 250), item("strog_carne", 200), item("carne_batata", 220)]),
      meal("16:00", "Lanche",
        item("sanduiche_natural", 1),
        [item("pao_queijo", 1), item("pao_de_queijo", 3), item("pupunha_cafe", 1)]),
      meal("19:30", "Jantar",
        item("frango_batata_doce", 200),
        [item("peixe_legumes", 200), item("canja", 400)]),
    ],
  },
  {
    id: "esp-cutting",
    name: "Cutting — Definição",
    category: "Esportivo",
    description: "Déficit calórico moderado preservando massa magra. Alta proteína.",
    tags: ["Emagrecimento", "Estética"],
    kcal: 1900,
    meals: [
      meal("07:00", "Café da manhã",
        item("ovos_mexidos", 3),
        [item("omelete", 1), item("crepioca", 2), item("tapioca_queijo", 1)]),
      meal("10:30", "Lanche",
        item("maca", 1),
        [item("pera", 1), item("goiaba", 1), item("laranja", 1)]),
      meal("13:00", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("peixe_legumes", 180), item("acem", 150)]),
      meal("16:30", "Lanche",
        item("iogurte_natural", 170),
        [item("frutas_vermelhas", 150), item("iogurte_fruta", 1)]),
      meal("19:30", "Jantar",
        item("salada_completa", 250),
        [item("sopa_legumes", 350), item("ovos_cozidos", 3)]),
    ],
  },

  // ---------- CLÍNICOS ----------
  {
    id: "cli-lowcarb",
    name: "Low-Carb Clínico",
    category: "Clínico",
    description: "Baixo carbo (≈60-80g/dia). Indicado p/ resistência insulínica e perda de peso.",
    tags: ["Low-Carb", "Resistência insulínica"],
    kcal: 1800,
    meals: [
      meal("07:00", "Café da manhã",
        item("omelete", 1),
        [item("ovos_mexidos", 3), item("ovos_bacon", 1), item("crepioca", 2)]),
      meal("10:30", "Lanche",
        item("ovos_cozidos", 2),
        [item("morango", 100), item("iogurte_natural", 150)]),
      meal("12:30", "Almoço",
        item("bife_acebolado", 180),
        [item("frango_grelhado", 180), item("file_tilapia", 200), item("carne_grelhada", 180)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 150),
        [item("frutas_vermelhas", 80), item("ovos_cozidos", 2)]),
      meal("19:30", "Jantar",
        item("peixe_legumes", 200),
        [item("salada_completa", 250), item("strog_frango", 180)]),
    ],
  },
  {
    id: "cli-diabetes",
    name: "Diabetes Tipo 2",
    category: "Clínico",
    description:
      "Carbos complexos fracionados, baixo IG, fibras altas. Evita açúcares simples.",
    tags: ["Diabetes", "Baixo IG"],
    kcal: 2000,
    meals: [
      meal("07:00", "Café da manhã",
        item("tapioca_ovo", 1),
        [item("cuscuz_ovo", 1), item("pao_ovo", 1), item("crepioca", 2)]),
      meal("10:00", "Lanche",
        item("maca", 1),
        [item("pera", 1), item("goiaba", 1), item("morango", 120)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("peixe_legumes", 180), item("acem", 150)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("torrada_integral", 2), item("pao_queijo", 1)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("canja", 400), item("salada_completa", 250)]),
      meal("21:30", "Ceia",
        item("iogurte_natural", 120),
        [item("copo_leite", 200)]),
    ],
  },
  {
    id: "cli-colesterol",
    name: "Colesterol Alto (Dislipidemia)",
    category: "Clínico",
    description:
      "Reduz gordura saturada, prioriza peixes, fibras solúveis, frutas e legumes.",
    tags: ["Colesterol", "Dislipidemia", "Cardio"],
    kcal: 1900,
    meals: [
      meal("07:00", "Café da manhã",
        item("mingau_aveia", 200),
        [item("banana_aveia", 1), item("mamao_aveia", 1)]),
      meal("10:00", "Lanche",
        item("mamao", 150),
        [item("maca", 1), item("pera", 1), item("salada_frutas", 150)]),
      meal("12:30", "Almoço",
        item("file_tilapia", 200),
        [item("peixe_legumes", 200), item("frango_grelhado", 150)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("torrada_integral", 2)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("salada_completa", 250), item("canja", 400)]),
    ],
  },
  {
    id: "cli-figado",
    name: "Esteatose Hepática (Gordura no Fígado)",
    category: "Clínico",
    description:
      "Sem álcool, sem frituras. Carbo complexo, proteína magra, vegetais.",
    tags: ["Fígado", "Esteatose"],
    kcal: 1850,
    meals: [
      meal("07:00", "Café da manhã",
        item("tapioca_queijo", 1),
        [item("cha_torrada", 1), item("crepioca", 2)]),
      meal("10:00", "Lanche",
        item("maca", 1),
        [item("pera", 1), item("mamao", 150)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("peixe_legumes", 180)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 150),
        [item("torrada_integral", 2)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("canja", 400)]),
    ],
  },
  {
    id: "cli-hipertensao",
    name: "Hipertensão (DASH)",
    category: "Clínico",
    description:
      "Baixo sódio, rico em K/Mg/Ca. Vegetais, frutas, laticínios magros, peixes.",
    tags: ["Hipertensão", "DASH"],
    kcal: 1900,
    meals: [
      meal("07:00", "Café da manhã",
        item("banana_aveia", 1),
        [item("mingau_aveia", 200), item("mamao_aveia", 1)]),
      meal("10:00", "Lanche",
        item("laranja", 1),
        [item("mamao", 150), item("melao", 150), item("maca", 1)]),
      meal("12:30", "Almoço",
        item("file_tilapia", 200),
        [item("frango_grelhado", 150), item("peixe_legumes", 200)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("torrada_integral", 2)]),
      meal("19:30", "Jantar",
        item("salada_completa", 250),
        [item("sopa_legumes", 400)]),
    ],
  },
  {
    id: "cli-renais",
    name: "Cálculos Renais",
    category: "Clínico",
    description:
      "Hidratação alta, baixo sódio, oxalato moderado, cálcio adequado da dieta.",
    tags: ["Cálculo renal", "Hidratação"],
    kcal: 1900,
    meals: [
      meal("07:00", "Café da manhã",
        item("pao_queijo", 1),
        [item("cha_torrada_queijo", 1), item("tapioca_queijo", 1)]),
      meal("10:00", "Lanche",
        item("melancia", 200),
        [item("melao", 150), item("abacaxi", 150)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("acem", 150)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("pera", 1), item("maca", 1)]),
      meal("19:30", "Jantar",
        item("canja", 400),
        [item("sopa_legumes", 400), item("salada_completa", 250)]),
    ],
  },
  {
    id: "cli-vesicula",
    name: "Pedra na Vesícula",
    category: "Clínico",
    description:
      "Baixa gordura, sem frituras, refeições leves fracionadas. Evita embutidos.",
    tags: ["Vesícula", "Baixa gordura"],
    kcal: 1700,
    meals: [
      meal("07:00", "Café da manhã",
        item("cha_torrada", 1),
        [item("mingau_aveia", 200), item("tapioca_queijo", 1)]),
      meal("10:00", "Lanche",
        item("maca", 1),
        [item("pera", 1), item("mamao", 150)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 150),
        [item("file_tilapia", 180), item("peixe_legumes", 180)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 150),
        [item("torrada_integral", 2)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("canja", 400)]),
    ],
  },

  // ---------- PRÉ/PÓS-OPERATÓRIO ----------
  {
    id: "po-pre-op",
    name: "Pré-operatório",
    category: "Pré/Pós-operatório",
    description:
      "Refeições leves, hiperproteicas moderadas, fibras controladas nas 48h finais.",
    tags: ["Pré-operatório", "Hospitalar"],
    kcal: 2000,
    meals: [
      meal("07:00", "Café da manhã",
        item("pao_queijo", 1),
        [item("tapioca_queijo", 1), item("crepioca", 2)]),
      meal("10:00", "Lanche",
        item("vitamina_fruta", 300),
        [item("iogurte_fruta", 1), item("salada_frutas", 150)]),
      meal("12:30", "Almoço",
        item("frango_grelhado", 180),
        [item("file_tilapia", 180), item("acem", 180)]),
      meal("16:00", "Lanche",
        item("iogurte_natural", 170),
        [item("pera", 1), item("maca", 1)]),
      meal("19:30", "Jantar",
        item("canja", 400),
        [item("sopa_legumes", 400)]),
    ],
  },
  {
    id: "po-pos-op",
    name: "Pós-operatório (evolução)",
    category: "Pré/Pós-operatório",
    description:
      "Progressão de líquida → pastosa → branda. Hiperproteico, hipogorduroso.",
    tags: ["Pós-operatório", "Hospitalar"],
    kcal: 1600,
    meals: [
      meal("07:00", "Café",
        item("mingau_aveia", 200),
        [item("vitamina_fruta", 300), item("iogurte_natural", 170)]),
      meal("10:00", "Lanche",
        item("iogurte_natural", 150),
        [item("salada_frutas", 150), item("vitamina_fruta", 250)]),
      meal("12:30", "Almoço",
        item("canja", 400),
        [item("sopa_legumes", 400)]),
      meal("16:00", "Lanche",
        item("vitamina_fruta", 300),
        [item("iogurte_fruta", 1)]),
      meal("19:30", "Jantar",
        item("sopa_legumes", 400),
        [item("canja", 400)]),
    ],
  },

  // ---------- GESTANTE ----------
  {
    id: "ges-gestante",
    name: "Gestante (2º/3º trimestre)",
    category: "Gestante",
    description:
      "+300 kcal, ferro, cálcio, folato e proteína. Fracionado em 6 refeições.",
    tags: ["Gestante", "Materno"],
    kcal: 2300,
    meals: [
      meal("07:00", "Café da manhã",
        item("tapioca_ovo", 1),
        [item("cuscuz_ovo", 1), item("pao_ovo", 1), item("crepioca", 2)]),
      meal("10:00", "Lanche",
        item("mamao_aveia", 1),
        [item("banana_aveia", 1), item("iogurte_granola", 1)]),
      meal("12:30", "Almoço",
        item("carne_grelhada", 180),
        [item("frango_grelhado", 180), item("file_tilapia", 200), item("acem", 180)]),
      meal("15:30", "Lanche",
        item("vitamina_fruta", 300),
        [item("iogurte_fruta", 1), item("salada_frutas", 200)]),
      meal("19:30", "Jantar",
        item("frango_batata_doce", 200),
        [item("peixe_legumes", 200), item("canja", 400)]),
      meal("22:00", "Ceia",
        item("copo_leite", 250),
        [item("iogurte_natural", 170), item("pao_de_queijo", 2)]),
    ],
  },

  // ---------- BARIÁTRICA ----------
  {
    id: "bar-pos-bariatrica",
    name: "Pós-bariátrica (Fase Branda)",
    category: "Bariátrica",
    description:
      "Pequenos volumes, hiperproteica, mastigação lenta. Sem líquido junto da refeição.",
    tags: ["Bariátrica", "Hiperproteica"],
    kcal: 1100,
    meals: [
      meal("07:00", "Café",
        item("ovos_mexidos", 2),
        [item("omelete", 1), item("crepioca", 1)]),
      meal("09:30", "Lanche",
        item("iogurte_natural", 120),
        [item("frutas_vermelhas", 80)]),
      meal("12:00", "Almoço",
        item("frango_grelhado", 90),
        [item("file_tilapia", 100), item("acem", 90)]),
      meal("15:00", "Lanche",
        item("iogurte_natural", 120),
        [item("pera", 1)]),
      meal("18:30", "Jantar",
        item("sopa_legumes", 250),
        [item("canja", 250)]),
      meal("21:00", "Ceia",
        item("copo_leite", 150),
        [item("iogurte_natural", 100)]),
    ],
  },

  // ---------- REGIONAIS / PARAENSE ----------
  {
    id: "reg-paraense",
    name: "Paraense — Cotidiano Regional",
    category: "Regional",
    description:
      "Alimentação típica paraense balanceada: açaí, tapioca, pupunha, peixes.",
    tags: ["Paraense", "Regional", "Norte"],
    kcal: 2400,
    meals: [
      meal("07:00", "Café da manhã",
        item("tapioca_queijo", 1),
        [item("pupunha_cafe", 1), item("macaxeira_cafe", 1), item("bolo_macaxeira", 1)]),
      meal("10:00", "Lanche",
        item("acai_tapioca", 1),
        [item("acai_aveia", 1), item("acai", 300)]),
      meal("12:30", "Almoço",
        item("acai_peixe", 1),
        [item("acai_frango", 1), item("file_tilapia", 200), item("peixe_legumes", 200)]),
      meal("16:00", "Lanche",
        item("bolo_milho", 1),
        [item("pao_de_queijo", 3), item("cha_torrada_queijo", 1)]),
      meal("19:30", "Jantar",
        item("canja", 400),
        [item("sopa_legumes", 400), item("frango_grelhado", 180)]),
    ],
  },
];

export const categories: DietTemplate["category"][] = [
  "Esportivo",
  "Clínico",
  "Regional",
  "Gestante",
  "Pré/Pós-operatório",
  "Bariátrica",
];
