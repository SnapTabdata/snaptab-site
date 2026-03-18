# SnapTab 官网 - 腾讯云静态托管一键部署
# 使用前：npm install -g @cloudbase/cli && cloudbase login
# 用法：.\deploy-tencent.ps1 -EnvId 你的环境ID

param(
    [Parameter(Mandatory=$true)]
    [string]$EnvId
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "部署 SnapTab 官网到腾讯云静态托管..." -ForegroundColor Cyan
Write-Host "环境 ID: $EnvId"
Write-Host ""

$cli = Get-Command cloudbase -ErrorAction SilentlyContinue
if (-not $cli) {
    Write-Host "未找到 cloudbase CLI，请先安装：" -ForegroundColor Yellow
    Write-Host "  npm install -g @cloudbase/cli"
    Write-Host "  cloudbase login"
    exit 1
}

Push-Location $scriptDir
try {
    cloudbase hosting deploy . -e $EnvId
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "部署完成！访问地址：https://$EnvId.tcloudbaseapp.com" -ForegroundColor Green
    } else {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
