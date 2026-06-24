#!/usr/bin/env pwsh
# Plugin loader for Spec-Kit (PowerShell equivalent of plugin-loader.sh)

param(
    [Alias('hook')]
    [string]$Hook,
    [Alias('verbose')]
    [switch]$Verbose,
    [Alias('help','h')]
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

function Write-Stderr {
    param([string]$Message)
    [Console]::Error.WriteLine($Message)
}

function Get-HookScripts {
    param($HookEntry)

    if ($null -eq $HookEntry) {
        return @()
    }

    if ($HookEntry -is [pscustomobject]) {
        $collected = @()
        foreach ($prop in $HookEntry.PSObject.Properties) {
            $collected += Get-HookScripts -HookEntry $prop.Value
        }
        return $collected
    }

    if ($HookEntry -is [System.Collections.IDictionary]) {
        $collected = @()
        foreach ($value in $HookEntry.Values) {
            $collected += Get-HookScripts -HookEntry $value
        }
        return $collected
    }

    if (($HookEntry -is [System.Collections.IEnumerable]) -and ($HookEntry -isnot [string])) {
        $collected = @()
        foreach ($item in $HookEntry) {
            $collected += Get-HookScripts -HookEntry $item
        }
        return $collected
    }

    if ($HookEntry -is [string]) {
        return @($HookEntry)
    }

    return @($HookEntry.ToString())
}

function Invoke-HookScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HookPath
    )

    $resolvedPath = $HookPath
    try {
        $resolvedPath = (Resolve-Path -LiteralPath $HookPath -ErrorAction Stop).Path
    } catch {
        # Leave resolvedPath as provided when Resolve-Path fails
    }

    $extension = [System.IO.Path]::GetExtension($resolvedPath).ToLowerInvariant()
    $workingDir = Split-Path -Parent $resolvedPath

    try {
        switch ($extension) {
            '.ps1' {
                $pwshCommand = Get-Command pwsh -ErrorAction SilentlyContinue
                if (-not $pwshCommand) {
                    Write-Stderr "WARNING: pwsh not found. Cannot execute PowerShell hook: $resolvedPath"
                    return 1
                }
                $arguments = @('-NoLogo', '-NoProfile', '-File', $resolvedPath)
                $process = Start-Process -FilePath $pwshCommand.Source -ArgumentList $arguments -WorkingDirectory $workingDir -PassThru -Wait
                return $process.ExitCode
            }
            '.sh' {
                $bashCommand = Get-Command bash -ErrorAction SilentlyContinue
                if (-not $bashCommand) {
                    Write-Stderr "WARNING: bash not found. Cannot execute hook: $resolvedPath"
                    return 1
                }
                $quoted = $resolvedPath.Replace("`"", "`"`"")
                $arguments = @('-lc', "`"$quoted`"")
                $process = Start-Process -FilePath $bashCommand.Source -ArgumentList $arguments -WorkingDirectory $workingDir -PassThru -Wait
                return $process.ExitCode
            }
            '.bat' { 
                $process = Start-Process -FilePath $resolvedPath -WorkingDirectory $workingDir -PassThru -Wait
                return $process.ExitCode
            }
            '.cmd' {
                $process = Start-Process -FilePath $resolvedPath -WorkingDirectory $workingDir -PassThru -Wait
                return $process.ExitCode
            }
            default {
                $process = Start-Process -FilePath $resolvedPath -WorkingDirectory $workingDir -PassThru -Wait
                return $process.ExitCode
            }
        }
    } catch {
        Write-Stderr "ERROR: Failed to execute hook script: $resolvedPath. $_"
        return 1
    }
}

function Show-Usage {
    param([string]$ScriptName)
    Write-Stderr "Usage: $ScriptName -Hook <hook-name> [-Verbose]"
    Write-Stderr "Available hooks: pre-plan, post-plan, pre-tasks, post-tasks"
}

if ($Help) {
    $scriptName = [System.IO.Path]::GetFileName($MyInvocation.MyCommand.Definition)
    Show-Usage -ScriptName $scriptName
    exit 0
}

$hookName = $Hook

if ([string]::IsNullOrWhiteSpace($hookName)) {
    $scriptName = [System.IO.Path]::GetFileName($MyInvocation.MyCommand.Definition)
    Show-Usage -ScriptName $scriptName
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptDir '..\..\..'))
$pluginsConfig = Join-Path $repoRoot '.specify/plugins.json'

if (-not (Test-Path -LiteralPath $pluginsConfig -PathType Leaf)) {
    if ($Verbose) {
        Write-Stderr "No plugins.json found, skipping plugin hooks"
    }
    exit 0
}

try {
    $configContent = Get-Content -LiteralPath $pluginsConfig -Raw
    $config = $configContent | ConvertFrom-Json -ErrorAction Stop
} catch {
    Write-Stderr "ERROR: Failed to parse plugins config at $pluginsConfig. $_"
    exit 1
}

$pluginsProperty = $null
if ($config -and $config.PSObject.Properties.Name -contains 'plugins') {
    $pluginsProperty = $config.PSObject.Properties['plugins'].Value
}

$plugins = @()
if ($pluginsProperty) {
    if (($pluginsProperty -is [System.Collections.IEnumerable]) -and ($pluginsProperty -isnot [string])) {
        $plugins = @($pluginsProperty)
    } else {
        $plugins = @($pluginsProperty)
    }
}

$enabledPlugins = @($plugins | Where-Object { $_ -and $_.enabled -eq $true -and $_.id })

if ($enabledPlugins.Count -eq 0) {
    if ($Verbose) {
        Write-Stderr "No enabled plugins found"
    }
    exit 0
}

$overallExitCode = 0

foreach ($plugin in $enabledPlugins) {
    $pluginId = $plugin.id
    $hookSet = $null

    if ($plugin.hooks) {
        $hookProperty = $plugin.hooks.PSObject.Properties[$hookName]
        if ($hookProperty) {
            $hookSet = $hookProperty.Value
        }
    }

    if ($null -eq $hookSet) {
        if ($Verbose) {
            Write-Stderr "Plugin '$pluginId': No hook for '$hookName'"
        }
        continue
    }

    $hookScripts = @(Get-HookScripts -HookEntry $hookSet | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

    if ($hookScripts.Count -eq 0) {
        if ($Verbose) {
            Write-Stderr "Plugin '$pluginId': No hook for '$hookName'"
        }
        continue
    }

    foreach ($hookScript in $hookScripts) {
        if ([System.IO.Path]::IsPathRooted($hookScript)) {
            $hookPath = $hookScript
        } else {
            $hookPath = Join-Path $repoRoot $hookScript
        }

        if (-not (Test-Path -LiteralPath $hookPath -PathType Leaf)) {
            Write-Stderr "WARNING: Hook script not found: $hookPath"
            continue
        }

        $hookPath = (Resolve-Path -LiteralPath $hookPath).Path

        $operationName = 'run'
        $scriptBaseName = [System.IO.Path]::GetFileName($hookPath)
        if ($scriptBaseName -and ($scriptBaseName -match '-([^-]+)\.[^\.]+$')) {
            $operationName = $matches[1]
        }

        if ($Verbose) {
            Write-Stderr "Executing plugin '$pluginId' hook '$hookName' [$operationName]: $hookPath"
        }

        $hookExit = Invoke-HookScript -HookPath $hookPath

        switch ($hookExit) {
            0 {
                if ($Verbose) {
                    Write-Stderr "Plugin '$pluginId' hook '$hookName' [$operationName]: OK"
                }
            }
            10 {
                if ($Verbose) {
                    Write-Stderr "Plugin '$pluginId' hook '$hookName' [$operationName]: WARNING (non-blocking)"
                }
            }
            20 {
                if ($Verbose) {
                    Write-Stderr "Plugin '$pluginId' hook '$hookName' [$operationName]: SUGGESTION"
                }
            }
            default {
                Write-Stderr "ERROR: Plugin '$pluginId' hook '$hookName' [$operationName] failed with exit code $hookExit"
                $overallExitCode = $hookExit
            }
        }
    }
}

exit $overallExitCode
