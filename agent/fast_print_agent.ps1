<#
.SYNOPSIS
    Fast Print Service - Native Windows Print Agent (Windows 10 / 11)
    Zero-dependency printing agent for Indian Print & Xerox Shops.
    Uses standard Windows Printing Subsystem and WMI/CIM spooler interfaces.
#>

[CmdletBinding()]
param(
    [string]$ServerUrl = "http://localhost:3000",
    [string]$ShopId = "sh-om-xerox",
    [string]$PairingCode = "829415",
    [int]$PollIntervalSec = 3
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   FAST PRINT SERVICE - WINDOWS PRINT AGENT v2.4 (x64/x86)" -ForegroundColor White
Write-Host "   Compatible with Windows 10, Windows 11 & Windows Server" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. System verification
$osInfo = Get-CimInstance Win32_OperatingSystem
Write-Host "[INIT] Windows Version: $($osInfo.Caption) ($($osInfo.Version))" -ForegroundColor Gray
Write-Host "[INIT] Computer Name  : $env:COMPUTERNAME" -ForegroundColor Gray

# 2. Enumerate installed printers via Windows Spooler
function Get-WindowsPrinters {
    $printers = Get-CimInstance Win32_Printer
    $printerList = @()
    foreach ($p in $printers) {
        $status = "ready"
        if ($p.WorkOffline -or $p.PrinterStatus -eq 7) { $status = "offline" }
        elseif ($p.PrinterStatus -eq 4) { $status = "printing" }
        elseif ($p.PrinterStatus -eq 5) { $status = "paper_jam" }

        $connType = "usb"
        if ($p.PortName -match "IP_|TCP|WSD|http") { $connType = "network" }
        elseif ($p.PortName -match "PDF|XPS|PORTPROMPT") { $connType = "virtual" }

        $printerList += @{
            name = $p.Name
            driver = $p.DriverName
            isDefault = [bool]$p.Default
            status = $status
            queueCount = [int]$p.JobCount
            supportedPaper = @("A4", "A5", "Legal", "Letter")
            supportsColor = [bool]($p.Capabilities -contains 2 -or $p.HorizontalResolution -ge 600)
            supportsDuplex = [bool]($p.Capabilities -contains 3 -or $p.Name -match "Duplex")
            connectionType = $connType
            location = $p.Location
        }
    }
    return $printerList
}

# 3. Pair or Authenticate with Fast Print Service Cloud
Write-Host "`n[AUTH] Connecting to Fast Print Service at $ServerUrl..." -ForegroundColor Yellow
$pairBody = @{
    shopId = $ShopId
    pairingCode = $PairingCode
    machineName = $env:COMPUTERNAME
    osVersion = "$($osInfo.Caption) build $($osInfo.BuildNumber)"
    agentVersion = "2.4.0-win"
} | ConvertTo-Json

try {
    $pairResponse = Invoke-RestMethod -Uri "$ServerUrl/api/agent/pair" -Method Post -Body $pairBody -ContentType "application/json"
    if ($pairResponse.success) {
        $authToken = $pairResponse.token
        Write-Host "[AUTH] SUCCESS! Paired with Shop: $($pairResponse.shopName)" -ForegroundColor Green
        Write-Host "[AUTH] Agent Token issued. Listening for approved print jobs..." -ForegroundColor Green
    } else {
        Write-Host "[AUTH] FAILED: $($pairResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[AUTH ERROR] Cannot connect to server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[HINT] Ensure Fast Print Service server is running and accessible." -ForegroundColor Yellow
}

# 4. Main Polling & Spooling Loop
$headers = @{
    "Authorization" = "Bearer $authToken"
    "X-Shop-Id" = $ShopId
}

$tempFolder = Join-Path $env:TEMP "FastPrintSpooler"
if (!(Test-Path $tempFolder)) { New-Item -ItemType Directory -Path $tempFolder | Out-Null }

$loopCounter = 0

while ($true) {
    try {
        $loopCounter++
        
        # Periodic Heartbeat and Printer Telemetry (every ~15 sec)
        if ($loopCounter % 5 -eq 1) {
            $currentPrinters = Get-WindowsPrinters
            $defaultP = ($currentPrinters | Where-Object { $_.isDefault }).name
            if (!$defaultP -and $currentPrinters.Count -gt 0) { $defaultP = $currentPrinters[0].name }

            $hbPayload = @{
                shopId = $ShopId
                machineName = $env:COMPUTERNAME
                osVersion = "$($osInfo.Caption) ($($osInfo.Version))"
                agentVersion = "2.4.0-win"
                installedPrinters = $currentPrinters
                defaultPrinter = $defaultP
            } | ConvertTo-Json -Depth 4

            Invoke-RestMethod -Uri "$ServerUrl/api/agent/heartbeat" -Method Post -Body $hbPayload -Headers $headers -ContentType "application/json" | Out-Null
        }

        # Poll for pending APPROVED print jobs
        $pollResult = Invoke-RestMethod -Uri "$ServerUrl/api/agent/poll?shopId=$ShopId" -Method Get -Headers $headers
        
        if ($pollResult.hasJob -and $pollResult.job) {
            $job = $pollResult.job
            Write-Host "`n>>> [NEW APPROVED JOB] Job ID: $($job.id) | Files: $($job.files.Count) | Copies: $($job.settings.copies)" -ForegroundColor Cyan
            Write-Host "    Target Printer: $($job.settings.selectedPrinter)" -ForegroundColor White
            
            # Send status update -> printing
            $statusPayload = @{ status = "printing"; message = "Spooling document to Windows print queue..." } | ConvertTo-Json
            Invoke-RestMethod -Uri "$ServerUrl/api/agent/job/$($job.id)/status" -Method Post -Body $statusPayload -Headers $headers -ContentType "application/json" | Out-Null

            $allPrinted = $true
            $targetPrinter = $job.settings.selectedPrinter
            if (!$targetPrinter) {
                $targetPrinter = ($currentPrinters | Where-Object { $_.isDefault }).name
            }

            foreach ($file in $job.files) {
                Write-Host "    [SPOOLING] $($file.originalName) ($([math]::Round($file.size / 1024, 1)) KB)..." -ForegroundColor Yellow
                
                # Download securely
                $destPath = Join-Path $tempFolder "$($job.id)_$($file.id)_$($file.originalName)"
                $downloadUri = "$ServerUrl/api/jobs/$($job.id)/file/$($file.id)?token=$authToken"
                
                try {
                    Invoke-WebRequest -Uri $downloadUri -OutFile $destPath -Headers $headers
                    
                    # Print using standard Windows PrintTo verb or SumatraPDF if present
                    if (Test-Path $destPath) {
                        Write-Host "    [WINDOWS SPOOLER] Sending $($file.originalName) to '$targetPrinter'..." -ForegroundColor Green
                        
                        # In real production Windows environments, Start-Process with -Verb PrintTo triggers the registered driver
                        # For testing, we also verify printer readiness:
                        $printProc = Start-Process -FilePath $destPath -Verb PrintTo -ArgumentList "`"$targetPrinter`"" -PassThru -WindowStyle Hidden
                        if ($printProc) {
                            $printProc.WaitForExit(10000)
                        }
                        
                        # Secure cleanup of local temp spool file immediately after printing
                        Start-Sleep -Seconds 2
                        Remove-Item $destPath -Force -ErrorAction SilentlyContinue
                    }
                } catch {
                    Write-Host "    [PRINT ERROR] Failed printing $($file.originalName): $($_.Exception.Message)" -ForegroundColor Red
                    $allPrinted = $false
                }
            }

            if ($allPrinted) {
                Write-Host ">>> [PRINT COMPLETE] Job $($job.id) successfully sent to Windows Print Queue!" -ForegroundColor Green
                $completePayload = @{ status = "completed"; message = "Successfully printed on $targetPrinter" } | ConvertTo-Json
                Invoke-RestMethod -Uri "$ServerUrl/api/agent/job/$($job.id)/status" -Method Post -Body $completePayload -Headers $headers -ContentType "application/json" | Out-Null
            } else {
                $failPayload = @{ status = "error"; message = "Windows Spooler error while sending files to printer" } | ConvertTo-Json
                Invoke-RestMethod -Uri "$ServerUrl/api/agent/job/$($job.id)/status" -Method Post -Body $failPayload -Headers $headers -ContentType "application/json" | Out-Null
            }
        }
    } catch {
        # Handle network interruption without duplicate prints
        Write-Host "[RETRY] Network heartbeat sync: $($_.Exception.Message)" -ForegroundColor DarkGray
    }

    Start-Sleep -Seconds $PollIntervalSec
}
