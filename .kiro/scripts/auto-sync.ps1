# Auto-sync script para sincronização automática de mudanças
# Executa a cada 30 minutos durante a sessão de desenvolvimento

param(
    [int]$IntervalMinutes = 30,
    [bool]$RunOnce = $false
)

$repoPath = "c:\Users\55919\Downloads\fitjourney1_audit"
$logFile = "$repoPath\.kiro\logs\auto-sync.log"

# Criar diretório de logs se não existir
$logDir = Split-Path $logFile -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

function SyncRepository {
    Log "🔄 Iniciando sincronização automática..."
    
    try {
        Push-Location $repoPath
        
        # Verificar se há mudanças
        $status = & git status --porcelain
        
        if ([string]::IsNullOrWhiteSpace($status)) {
            Log "✅ Nenhuma mudança detectada. Repositório está sincronizado."
            return $true
        }
        
        Log "📝 Mudanças detectadas:"
        $status | ForEach-Object { Log "  $_" }
        
        # Fazer staging de todas as mudanças
        & git add -A 2>&1 | Out-Null
        Log "📦 Staging realizado"
        
        # Fazer commit
        $commitMessage = "auto: sincronização automática de mudanças na arquitetura [skip ci]`n`nTimestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`nHora: $(Get-Date -Format 'HH:mm')"
        & git commit -m $commitMessage 2>&1 | Out-Null
        Log "✅ Commit realizado com sucesso"
        
        # Fazer push
        & git push origin main 2>&1 | Out-Null
        Log "🚀 Push para GitHub concluído"
        
        Log "✅ Sincronização completa!"
        return $true
    }
    catch {
        Log "❌ Erro durante sincronização: $_"
        return $false
    }
    finally {
        Pop-Location
    }
}

if ($RunOnce) {
    Log "🚀 Executando sincronização única..."
    SyncRepository
    exit
}

Log "🔔 Auto-sync iniciado. Intervalo: $IntervalMinutes minutos"
Log "Pressione Ctrl+C para parar"

# Loop infinito com intervalo
while ($true) {
    SyncRepository
    
    Log "⏰ Próxima sincronização em $IntervalMinutes minutos..."
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}
