# Convierte WMS Scenarios - Anonymized.xlsx a js/data.js (solo lectura del original, no lo modifica)
$path = "C:\radec-claude\proyectos\Sesión-5-Proyecto-Simulador-de-implementación\datos\WMS Scenarios - Anonymized.xlsx"
$outJs = "C:\radec-claude\proyectos\Sesión-5-Proyecto-Simulador-de-implementación\js\data.js"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($path, [Type]::Missing, $true)  # ReadOnly

# ---------- Sites Master ----------
$ws = $wb.Worksheets.Item("Sites Master")
$v = $ws.UsedRange.Value2
$sites = @()
for ($r = 2; $r -le 16; $r++) {
    $sites += [ordered]@{
        country              = [string]$v[$r,1]
        siteId               = [string]$v[$r,2]
        cluster              = [int]$v[$r,3]
        capacityMioHl        = [double]$v[$r,4]
        productionMioHl      = [double]$v[$r,5]
        distributionVolumeKHl= [double]$v[$r,6]
        lineCapacity         = [double]$v[$r,7]
        productionLines      = [double]$v[$r,8]
        warehouses           = [double]$v[$r,9]
        warehouseArea        = [double]$v[$r,10]
        occupationLv         = [double]$v[$r,11]
        aislesIdentification = [double]$v[$r,12]
        boxIdentification    = [string]$v[$r,13]
        controlTower         = [string]$v[$r,14]
        t2MkpKa              = [string]$v[$r,15]
        forkliftsLogistics   = [double]$v[$r,16]
        hcForklifts          = [double]$v[$r,17]
        wifiState            = [double]$v[$r,18]
        tablets              = [double]$v[$r,19]
        countingDevices      = [double]$v[$r,20]
    }
}
Write-Output "Sites Master leidas: $($sites.Count)"

# ---------- Financials (USD header, tratado como MXN) ----------
$ws = $wb.Worksheets.Item("Financials (USD)")
$v = $ws.UsedRange.Value2
$financials = @()
for ($r = 2; $r -le 16; $r++) {
    $financials += [ordered]@{
        siteId                    = [string]$v[$r,2]
        benefitsPerMonth          = [double]$v[$r,3]
        implementationCosts       = [double]$v[$r,4]
        devices                   = [double]$v[$r,5]
        forkliftStructure         = [double]$v[$r,6]
        warehouseSignage          = [double]$v[$r,7]
        labels                    = [double]$v[$r,8]
        costsWithoutLabelersWifi  = [double]$v[$r,9]
        labelPrinters             = [double]$v[$r,10]
        manualLabeling            = [double]$v[$r,11]
        wifiFull                  = [double]$v[$r,12]
        wifiFullOptimized         = [double]$v[$r,13]
        wifiPrioritized           = [double]$v[$r,14]
    }
}
Write-Output "Financials leidas: $($financials.Count)"

# ---------- Resource Master ----------
$ws = $wb.Worksheets.Item("Resource Master")
$v = $ws.UsedRange.Value2
$roles = @()
for ($r = 2; $r -le 19; $r++) {
    $roles += [ordered]@{
        id                   = $r - 1
        role                 = [string]$v[$r,1]
        workMode             = [string]$v[$r,2]
        canMultitask         = [string]$v[$r,3]
        internalOrExternal   = [string]$v[$r,4]
        fixedOrFlexibleCost  = [string]$v[$r,5]
        avgMonthlyCostMxn    = [double]$v[$r,6]
        actual               = [double]$v[$r,7]
        escenario1           = [double]$v[$r,8]
    }
}
Write-Output "Resource Master leidas: $($roles.Count)"

# ---------- Implementation Phases ----------
$ws = $wb.Worksheets.Item("Implementation Phases")
$v = $ws.UsedRange.Value2
$phases = @()
for ($r = 2; $r -le 65; $r++) {
    $phases += [ordered]@{
        cluster           = [int]$v[$r,1]
        phase             = [string]$v[$r,2]
        sequence          = [int]$v[$r,3]
        deploymentMaturity= [string]$v[$r,4]
        durationWeeks     = [double]$v[$r,5]
    }
}
Write-Output "Implementation Phases leidas: $($phases.Count)"

# ---------- Phase-Resource Allocation ----------
$ws = $wb.Worksheets.Item("Phase-Resource Allocation")
$v = $ws.UsedRange.Value2
$allocation = @()
for ($r = 2; $r -le 187; $r++) {
    $allocation += [ordered]@{
        cluster            = [int]$v[$r,1]
        phase              = [string]$v[$r,2]
        role               = [string]$v[$r,3]
        capacityConsumption= [double]$v[$r,4]
    }
}
Write-Output "Phase-Resource Allocation leidas: $($allocation.Count)"

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

$data = [ordered]@{
    sites       = $sites
    financials  = $financials
    roles       = $roles
    phases      = $phases
    allocation  = $allocation
}

$json = $data | ConvertTo-Json -Depth 6
$jsContent = "// Generado automaticamente desde 'WMS Scenarios - Anonymized.xlsx' via build-data.ps1`n// No editar a mano -- si el Excel cambia, correr build-data.ps1 de nuevo.`nconst RAW_DATA = $json;`n"
[System.IO.File]::WriteAllText($outJs, $jsContent, [System.Text.Encoding]::UTF8)
Write-Output "OK -> $outJs"
