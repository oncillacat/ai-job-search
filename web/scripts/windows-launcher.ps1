# AI Job Search for Windows: the launcher the Start menu and Desktop shortcuts run.
# Starts the app's server on this PC only (127.0.0.1), asks once for an access code or API key
# (saved with Windows Data Protection for the current user, the format lib/secrets.ts reads),
# opens the browser, and shows a small window with Open and Quit.

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Security
[System.Windows.Forms.Application]::EnableVisualStyles()

$AppName = "AI Job Search"
$Here = $PSScriptRoot
$Node = Join-Path $Here "node\node.exe"
$AppDir = Join-Path $Here "app"
$Icon = Join-Path $Here "AppIcon.ico"
$DataDir = Join-Path $env:APPDATA $AppName
$KeyDir = Join-Path $DataDir "keys"
$Log = Join-Path $DataDir "app.log"
$ErrLog = Join-Path $DataDir "app-errors.log"
New-Item -ItemType Directory -Force -Path $KeyDir | Out-Null

function Show-Message([string]$text) {
  [System.Windows.Forms.MessageBox]::Show($text, $AppName, "OK", "Information") | Out-Null
}

function Has-Secret([string]$name) { Test-Path -LiteralPath (Join-Path $KeyDir "$name.dat") }

function Save-Secret([string]$name, [string]$value) {
  $bytes = [Text.Encoding]::UTF8.GetBytes($value)
  $protected = [Security.Cryptography.ProtectedData]::Protect($bytes, $null, "CurrentUser")
  [IO.File]::WriteAllText((Join-Path $KeyDir "$name.dat"), [Convert]::ToBase64String($protected))
}

# A small form with a hidden-text box. Returns the text, or $null if cancelled.
function Ask-Secret([string]$prompt) {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = $AppName
  $form.Size = New-Object System.Drawing.Size(460, 200)
  $form.StartPosition = "CenterScreen"
  $form.FormBorderStyle = "FixedDialog"
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.TopMost = $true
  if (Test-Path $Icon) { $form.Icon = New-Object System.Drawing.Icon($Icon) }
  $label = New-Object System.Windows.Forms.Label
  $label.Text = $prompt
  $label.Location = New-Object System.Drawing.Point(16, 16)
  $label.Size = New-Object System.Drawing.Size(420, 36)
  $box = New-Object System.Windows.Forms.TextBox
  $box.UseSystemPasswordChar = $true
  $box.Location = New-Object System.Drawing.Point(16, 58)
  $box.Size = New-Object System.Drawing.Size(410, 24)
  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = "Save"
  $ok.DialogResult = "OK"
  $ok.Location = New-Object System.Drawing.Point(250, 108)
  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = "Cancel"
  $cancel.DialogResult = "Cancel"
  $cancel.Location = New-Object System.Drawing.Point(340, 108)
  $form.Controls.AddRange(@($label, $box, $ok, $cancel))
  $form.AcceptButton = $ok
  $form.CancelButton = $cancel
  if ($form.ShowDialog() -eq "OK" -and $box.Text.Trim()) { return $box.Text.Trim() }
  return $null
}

function Test-App([int]$port) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 -Uri "http://127.0.0.1:$port/api/chat"
    return $r.Content -match '"live"'
  } catch { return $false }
}

function Test-PortFree([int]$port) {
  try {
    $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
    $l.Start(); $l.Stop(); return $true
  } catch { return $false }
}

# Already running? Just open it.
foreach ($p in 3124..3134) {
  if (Test-App $p) { Start-Process "http://localhost:$p/chat"; exit 0 }
}

# First run: an access code for the shared site, or the person's own Anthropic API key.
if (-not (Has-Secret "ANTHROPIC_API_KEY") -and -not (Has-Secret "REMOTE_ACCESS_CODE")) {
  $choice = [System.Windows.Forms.MessageBox]::Show(
    "Welcome to AI Job Search.`n`nTo use Claude, enter the access code you were given.`n`nClick Yes to enter an access code, or No to use your own Anthropic API key instead.",
    $AppName, "YesNoCancel", "Question")
  if ($choice -eq "Yes") {
    $code = Ask-Secret "Access code:"
    if (-not $code) { exit 0 }
    Save-Secret "REMOTE_ACCESS_CODE" $code
  } elseif ($choice -eq "No") {
    $key = Ask-Secret "Your Anthropic API key (starts with sk-ant-):"
    if (-not $key) { exit 0 }
    if (-not $key.StartsWith("sk-ant-")) { Show-Message "That doesn't look like an Anthropic API key. Open the app again to retry."; exit 1 }
    Save-Secret "ANTHROPIC_API_KEY" $key
  } else { exit 0 }
}

# A free port, starting at 3124.
$Port = $null
foreach ($p in 3124..3134) { if (Test-PortFree $p) { $Port = $p; break } }
if (-not $Port) { Show-Message "Ports 3124 to 3134 are all in use. Close something and try again."; exit 1 }
$Url = "http://localhost:$Port/chat"

# Only this PC can reach the server. The server reads the saved keys itself. Settings go to the
# server through this process's environment (Start-Process passes it on).
$env:NODE_ENV = "production"
$env:PORT = "$Port"
$env:HOSTNAME = "127.0.0.1"
$env:NEXT_TELEMETRY_DISABLED = "1"
foreach ($v in @("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL")) {
  Remove-Item -Path "Env:$v" -ErrorAction SilentlyContinue
}
$server = Start-Process -FilePath $Node -ArgumentList "server.js" -WorkingDirectory $AppDir `
  -WindowStyle Hidden -PassThru -RedirectStandardOutput $Log -RedirectStandardError $ErrLog

$ready = $false
foreach ($i in 1..40) {
  if ($server.HasExited) { break }
  if (Test-App $Port) { $ready = $true; break }
  Start-Sleep -Milliseconds 500
}
if (-not $ready) {
  if (-not $server.HasExited) { $server.Kill() }
  Show-Message "AI Job Search couldn't start. Details are in $ErrLog"
  exit 1
}
Start-Process $Url

# The small window: keep it open while using the app; closing it stops the app.
$form = New-Object System.Windows.Forms.Form
$form.Text = $AppName
$form.Size = New-Object System.Drawing.Size(420, 170)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
if (Test-Path $Icon) { $form.Icon = New-Object System.Drawing.Icon($Icon) }
$label = New-Object System.Windows.Forms.Label
$label.Text = "AI Job Search is running.`nKeep this window open while you use it (you can minimise it)."
$label.Location = New-Object System.Drawing.Point(16, 16)
$label.Size = New-Object System.Drawing.Size(380, 40)
$open = New-Object System.Windows.Forms.Button
$open.Text = "Open in browser"
$open.Size = New-Object System.Drawing.Size(130, 30)
$open.Location = New-Object System.Drawing.Point(150, 80)
$open.add_Click({ Start-Process $Url })
$quit = New-Object System.Windows.Forms.Button
$quit.Text = "Quit"
$quit.Size = New-Object System.Drawing.Size(90, 30)
$quit.Location = New-Object System.Drawing.Point(290, 80)
$quit.add_Click({ $form.Close() })
$form.Controls.AddRange(@($label, $open, $quit))
$form.AcceptButton = $open
# If the server stops on its own, close the window too.
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 2000
$timer.add_Tick({ if ($server.HasExited) { $form.Close() } })
$timer.Start()
[void]$form.ShowDialog()

$timer.Stop()
if (-not $server.HasExited) { $server.Kill() }
