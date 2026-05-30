# Domain Write Layer — FitJourney

**Invariante arquitetural:** toda mutação em tabelas de identidade e domínio
crítico vive exclusivamente aqui. Sem exceção.

## Regras

1. **Bloqueio físico no banco**
   - `nutritionists`, `patients`, `referral_codes` revogaram
     `INSERT/UPDATE/DELETE` para `anon` e `authenticated`.
   - Mutação só passa via `supabaseAdmin` (service_role).
   - `cleanup_orphan_auth_user()` revogou EXECUTE de client roles.

2. **Gate obrigatório**
   - Toda server fn que escreve usa `withDomainGate({...})`.
   - O gate resolve identidade, aplica `assertState` / `assertRole`,
     emite audit event, e só então entrega o `admin` client + identidade
     verificada ao handler.
   - Sem caminho que escreva no banco sem passar pelo gate.

3. **Arquivos permitidos aqui**
   - `*.server.ts` — helpers server-only
   - `*.functions.ts` — server fns exportadas (thin file: só
     `createServerFn` declarations + imports)
   - `__tests__/*.test.ts` — invasion tests

4. **Mutations existentes**
   - `createNutritionistProfile` (S2 → S3)
   - _futuras:_ `signupPatientViaReferral`, `generateReferralCode`,
     `cleanupOrphanAuthUser`

5. **Proibido**
   - Mutação em tabela de identidade fora de `src/domain/write/`.
   - Uso de `supabase.from('nutritionists').insert(...)` em rota,
     componente ou hook.
   - Bypass do gate dentro do próprio módulo.

## Como adicionar uma nova mutation

```ts
// src/domain/write/foo.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { withDomainGate } from "./gate.server";

const Input = z.object({ /* ... */ });

export const fooMutation = createServerFn({ method: "POST" })
  .inputValidator((i) => Input.parse(i))
  .handler(
    withDomainGate(
      {
        flow: "fooMutation",
        allowedStates: ["S3"],
        requiredRole: "nutritionist",
      },
      async ({ data, identity, admin }) => {
        // identity já validada, admin já elevado
        // ... insert/update via admin
        return { ok: true };
      },
    ),
  );
```
