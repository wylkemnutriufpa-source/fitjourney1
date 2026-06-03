# Recomendações de UX: Exibição de Gate Warnings

> **Parte 2 da Auditoria Crítica**
> Status: DESIGN RECOMMENDATION
> Escopo: UI para exibir warnings clínicos sem bloquear publicação

---

## ESTADO ATUAL (PRÉ-CORREÇÃO)

```
Nutricionista clica "Publicar"
        ↓
Gate executa validação
        ↓
Gate.blockers.length > 0 → Erro genérico
        ↓
"O plano não passou nas regras clínicas obrigatórias"
        ↓
Publicação bloqueada
        ↓
Nutricionista fica confuso
```

---

## ESTADO APÓS CORREÇÃO (PÓS-IMPLEMENTAÇÃO)

```
Nutricionista clica "Publicar"
        ↓
Gate executa validação (todos warnings agora)
        ↓
gate.issues.length > 0 → Exibir panel com warnings
        ↓
Nutricionista vê:
  ⚠️ Proteína 2.8 g/kg (limite: 2.5)
     → "Se objetivo é hipertrofia, pode ser apropriado"
  ⚠️ Déficit 30% (vs TDEE 2500)
     → "Confirme se é perda acelerada planejada"
        ↓
[Revisar plano]  ou  [Confirmar e publicar]
        ↓
Se clica "Confirmar":
  - Snapshot publicado
  - Gate warnings persistidos em clinicalAudit
  - Paciente recebe plano
```

---

## COMPONENTE UI: WarningsPanel

### Localização
- Modal ou drawer que aparece quando há warnings
- **Após** clicar "Publicar" e **antes** de confirmar

### Estrutura

```tsx
export interface GateWarning {
  code: string;
  severity: "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
  suggestedAction?: string;
}

export interface WarningsPanelProps {
  warnings: GateWarning[];
  onConfirm: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}
```

### Visual proposto

```
╔════════════════════════════════════════════╗
║  ⚠️ ATENÇÃO — 3 avisos clínicos            ║
╠════════════════════════════════════════════╣
║                                            ║
║ 1️⃣ PROTEÍNA ACIMA DO RECOMENDADO          ║
║   ├─ Detectado: 2.8 g/kg                  ║
║   ├─ Limite sugerido: 2.5 g/kg            ║
║   └─ Ação: Se objetivo é hipertrofia      ║
║      agressiva, pode ser apropriado.      ║
║      Confirme clinicamente com paciente.  ║
║                                            ║
║ 2️⃣ DÉFICIT CALÓRICO ALTO                   ║
║   ├─ Detectado: 30%                       ║
║   ├─ TDEE: 2500 kcal                      ║
║   ├─ Plano: 1750 kcal                     ║
║   └─ Ação: Se é perda de peso agressiva,  ║
║      pode ser apropriado. Revise a meta.  ║
║                                            ║
║ 3️⃣ MACROS DESVIADAS DO ALVO                ║
║   ├─ Proteína: +12%                       ║
║   ├─ Carboidrato: -8%                     ║
║   └─ Ação: Considere ajustar quantidades  ║
║      ou revisar meta com paciente.        ║
║                                            ║
╠════════════════════════════════════════════╣
║                                            ║
║   ℹ️ Estes avisos não impedem publicação.   ║
║   O nutricionista é responsável pela      ║
║   decisão clínica. Todos os avisos ficam  ║
║   registrados no histórico do plano.      ║
║                                            ║
║  [✏️ Revisar plano]  [✅ Confirmar publ.]  ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## MAPEAMENTO: Código → Mensagem Nutri-Friendly

| Código | Mensagem | Ação sugerida |
|--------|----------|---------------|
| `PROTEIN_OVER_LIMIT` | "Proteína acima de 2.5 g/kg" | "Se objetivo é hipertrofia agressiva, pode ser apropriado. Confirme clinicamente." |
| `CALORIC_DEFICIT_HIGH` | "Déficit calórico de X%" | "Se objetivo é perda acelerada, pode ser apropriado. Revise a meta." |
| `MACRO_DEVIATION` | "Macros desviadas X% do alvo" | "Considere ajustar quantidades ou revisar meta." |
| `FOOD_MONOTONY` | "Alimento repetido Nx/semana" | "Considere diversificar ou confirme se planejado." |

---

## FLUXO DE INTERAÇÃO

### Cenário 1: Nutricionista clica "Revisar plano"

```
WarningsPanel exibida
        ↓
Nutricionista clica [✏️ Revisar plano]
        ↓
onEdit() callback chamado
        ↓
UI volta ao editor
        ↓
Nutricionista ajusta refeições
        ↓
Clica "Publicar" novamente
        ↓
Gate re-executa com novos valores
        ↓
Menos warnings (ou zero)
```

### Cenário 2: Nutricionista confirma com warnings

```
WarningsPanel exibida
        ↓
Nutricionista lê ações sugeridas
        ↓
Decide que é apropriado clinicamente
        ↓
Clica [✅ Confirmar publicação]
        ↓
API chamada com snapshot
        ↓
Gate warnings persistidos em clinicalAudit
        ↓
Paciente recebe plano
        ↓
Auditoria completa: contexto da decisão salvo
```

---

## SCHEMA: Adições ao SnaphotV3

```typescript
export type ClinicalAudit = {
  // ... existente ...
  
  // Novos campos (recomendados, não obrigatórios):
  gateConfiguration?: {
    proteinHardLimitGPerKg: number;
    caloricDeficitHardPct: number;
    macroDeviationHardPct: number;
    monotonyHardCount: number;
  };
  
  overrideNotes?: string; // Se nutricionista ignorou warning
  overriddenBy?: string;  // user_id do nutri
  overriddenAt?: string;  // ISO timestamp
};
```

---

## PRÓXIMAS FASES (Não fazer agora)

1. **Fase 2:** UI de override com texto livre
   - Nutricionista adiciona nota: "Paciente confirmou querer déficit 30%"
   - Nota persiste em `overrideNotes`

2. **Fase 3:** Tracking de decisões
   - Dashboard: nutricionista vê histórico de overrides
   - Padrões: "X% dos planos com hipertrofia têm proteína > 2.5"

3. **Fase 4:** Personalização de constantes
   - Nutricionista ajusta limites (2.5 → 3.0 g/kg se especialista em hipertrofia)
   - Limites persistem por nutri

---

## REJEIÇÕES E EDGE CASES

### Edge case 1: Sem anamnese aprovada

**Cenário:**
- `ctx.calculable === false` (sem peso/altura)
- Nutri quer publicar mesmo assim (usar template)

**Comportamento atual (após correção):**
```typescript
if (!ctx.calculable && !data.overrideMissingClinical) {
  throw "CLINICAL_CONTEXT_INCOMPLETE"
}
// Com override, continua:
// - Gate ainda roda com valores defaults
// - Warnings aparecem normalmente
// - Nutri pode confirmar
```

**UX:**
```
⚠️ ATENÇÃO — Sem dados clínicos completos
├─ Sem peso confirmado
├─ Sem altura confirmada
└─ Gate usando valores estimados

⚠️ Avisos clínicos (3):
├─ Proteína acima do recomendado
├─ ... (etc)
└─ Ação: Revisar com paciente quando tiver dados

[✏️ Revisar] [✅ Confirmar e usar valores estimados]
```

### Edge case 2: Todos os avisos

**Cenário:**
- Plano muito fora dos padrões (muitos warnings)

**Recomendação:**
- Limitar a 5 warnings na UI (scroll se necessário)
- Mostrar badge: "3 de 5 avisos"
- Button: "Ver todos"

---

## CÓDIGO: Stub de implementação

```tsx
// components/meal-planner/WarningsPanel.tsx

import { AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GateWarning } from "@/lib/engine/types";

export interface WarningsPanelProps {
  warnings: GateWarning[];
  onConfirm: () => Promise<void>;
  onEdit: () => void;
  isLoading?: boolean;
}

export function WarningsPanel({
  warnings,
  onConfirm,
  onEdit,
  isLoading,
}: WarningsPanelProps) {
  if (!warnings.length) return null;

  const hasErrors = warnings.some((w) => w.severity === "error");
  const icon = hasErrors ? AlertCircle : AlertTriangle;
  const title = hasErrors
    ? "❌ Erros Encontrados"
    : "⚠️ Avisos Clínicos";

  return (
    <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        {icon && <icon className="w-5 h-5" />}
        {title} — {warnings.length} item(s)
      </h2>

      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {warnings.map((w, idx) => (
          <div key={w.code} className="bg-white p-3 rounded border-l-4 border-yellow-400">
            <p className="font-semibold text-sm">{idx + 1}. {w.message}</p>
            {w.suggestedAction && (
              <p className="text-xs text-gray-600 mt-1">
                💡 {w.suggestedAction}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mb-4">
        ℹ️ Esses avisos são informativos. Você é responsável pela decisão clínica.
        Todos os avisos serão registrados no histórico do plano.
      </p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onEdit}>
          ✏️ Revisar Plano
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? "Publicando..." : "✅ Confirmar e Publicar"}
        </Button>
      </div>
    </div>
  );
}
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Atualizar `GateIssue` com `suggestedAction`
- [ ] Mudar severidade de ERROR → WARNING em `clinical-gate.ts`
- [ ] Remover bloqueio em `plans.functions.ts`
- [ ] Atualizar schema de `gateWarnings` em `snapshot.schema.ts`
- [ ] Criar componente `WarningsPanel.tsx`
- [ ] Integrar panel no flow de publicação
- [ ] Testar com 1 nutricionista real
- [ ] Validar UX vs. Dietbox

---

## MÉTRICA DE SUCESSO

**Antes da correção:**
- Nutricionista tenta publicar → Erro → Confuso → Desiste ou contorna

**Depois da correção:**
- Nutricionista tenta publicar → Aviso com contexto → Clica confirmar (ou revisa)
- Tempo para publicar: similar ao Dietbox
- Satisfação: "Faz sentido. Sistema me ajuda, não me bloqueia."

