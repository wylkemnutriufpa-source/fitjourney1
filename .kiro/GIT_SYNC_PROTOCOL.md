# 📋 Protocolo de Sincronização Git Automática

## Objetivo
Garantir que TODAS as mudanças na arquitetura sejam:
- ✅ Commitadas automaticamente
- ✅ Sincronizadas com o GitHub
- ✅ Nunca perdidas
- ✅ Rastreáveis com timestamps

---

## Como Funciona

### 1️⃣ Auto-Commit ao Salvar
Sempre que você salva um arquivo (Ctrl+S), um hook automático:
- Faz `git add -A` (staging de todas as mudanças)
- Faz `git commit -m "auto: ..."`
- Faz `git push origin main`

**Arquivos monitorados:**
- `src/**/*.ts`
- `src/**/*.tsx`
- `docs/**/*.md`
- `.kiro/specs/**/*.md`

### 2️⃣ Sincronização a Cada 30 Minutos
Você pode também executar manualmente a sincronização:

```powershell
# Sincronizar uma vez agora
& ".\.kiro\scripts\auto-sync.ps1" -RunOnce $true

# Ou deixar rodando (sincroniza a cada 30 min)
& ".\.kiro\scripts\auto-sync.ps1" -IntervalMinutes 30
```

### 3️⃣ Manual: Quando Quiser Forçar
Se precisar fazer commit manual:

```powershell
git add -A
git commit -m "feat: descrição da mudança"
git push origin main
```

---

## O Que Você NÃO Precisa Fazer

❌ NÃO precisa fazer `git add` manualmente
❌ NÃO precisa lembrar de fazer push
❌ NÃO precisa de comando manual para sincronizar
❌ NÃO precisa de terminal aberto

Tudo é automático!

---

## O Que Acontece

### Cenário 1: Você edita um arquivo
```
1. Você salva arquivo (Ctrl+S)
   ↓
2. Hook detecta mudança
   ↓
3. `git add -A` (staging)
   ↓
4. `git commit -m "auto: commit de mudança em arquivo"`
   ↓
5. `git push origin main`
   ↓
6. GitHub atualizado ✅
```

### Cenário 2: Você está trabalhando continuamente
```
Tempo 0:00 - Faz 1ª edição e salva
            → Auto-commit #1 + push

Tempo 15:00 - Faz 2ª edição e salva
            → Auto-commit #2 + push

Tempo 30:00 - Sem edição? Hook ainda pode rodar sync
            → Verifica se há mudanças, faz push se houver
```

---

## Log de Sincronizações

Todos os commits e pushs são registrados em:
```
.kiro/logs/auto-sync.log
```

Exemplo de log:
```
[2024-06-03 14:23:45] 🔄 Iniciando sincronização automática...
[2024-06-03 14:23:45] 📝 Mudanças detectadas:
[2024-06-03 14:23:45]   M src/lib/engine/clinical-gate.ts
[2024-06-03 14:23:45]   M src/lib/plans/plans.functions.ts
[2024-06-03 14:23:46] 📦 Staging realizado
[2024-06-03 14:23:46] ✅ Commit realizado com sucesso
[2024-06-03 14:23:47] 🚀 Push para GitHub concluído
[2024-06-03 14:23:47] ✅ Sincronização completa!
```

---

## Verificar Status

Para verificar se tudo está sincronizado:

```powershell
git status
```

Esperado:
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

---

## Se Algo Der Errado

### Erro: "fatal: not a git repository"
Certifique-se que você está no diretório correto:
```powershell
cd "c:\Users\55919\Downloads\fitjourney1_audit"
```

### Erro: "Authentication failed"
Git precisa ser autenticado. Configure:
```powershell
git config --global user.email "seu@email.com"
git config --global user.name "Seu Nome"
```

### Mudanças não estão sendo commitadas
Verifique se o hook está ativo:
```powershell
# Ver hooks criados
get-content .kiro/GIT_SYNC_PROTOCOL.md
```

---

## Resumo: O Contrato

**VOCÊ:**
- ✅ Edita arquivos normalmente
- ✅ Salva com Ctrl+S
- ✅ Continua trabalhando

**O SISTEMA (automático):**
- ✅ Detecta mudanças
- ✅ Faz staging (`git add -A`)
- ✅ Cria commit descritivo
- ✅ Faz push para GitHub
- ✅ Registra tudo em log

**RESULTADO:**
- ✅ Nenhuma mudança se perde
- ✅ GitHub sempre sincronizado
- ✅ Histórico completo
- ✅ Rastreabilidade 100%

---

## Próximas Mudanças

Sempre que eu fizer mudanças no código, você verá:
1. Arquivo sendo editado
2. Commit automático no console
3. GitHub atualizado em poucos segundos

Você não precisa fazer nada!

