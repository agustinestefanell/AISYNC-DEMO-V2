param(
  [Parameter(Mandatory = $true)]
  [string]$Root,
  [int]$Port = 4173
)

$resolvedRoot = (Resolve-Path $Root).Path
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse('127.0.0.1'), $Port)
$listener.Start()

$contentTypes = @{
  '.css' = 'text/css; charset=utf-8'
  '.html' = 'text/html; charset=utf-8'
  '.ico' = 'image/x-icon'
  '.jpeg' = 'image/jpeg'
  '.jpg' = 'image/jpeg'
  '.js' = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png' = 'image/png'
  '.svg' = 'image/svg+xml'
}

function Write-Response {
  param(
    [Parameter(Mandatory = $true)]
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$ContentType,
    [byte[]]$Body
  )

  $statusText = switch ($StatusCode) {
    200 { 'OK' }
    403 { 'Forbidden' }
    404 { 'Not Found' }
    default { 'OK' }
  }

  $headerLines = @(
    "HTTP/1.1 $StatusCode $statusText",
    "Content-Length: $($Body.Length)",
    "Connection: close"
  )

  if ($ContentType) {
    $headerLines += "Content-Type: $ContentType"
  }

  $header = [System.Text.Encoding]::ASCII.GetBytes(($headerLines -join "`r`n") + "`r`n`r`n")
  $Stream.Write($header, 0, $header.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        continue
      }

      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) {
          break
        }
      }

      $parts = $requestLine.Split(' ')
      $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { '/' }
      $requestPath = $rawPath.Split('?')[0]
      if ([string]::IsNullOrWhiteSpace($requestPath) -or $requestPath -eq '/') {
        $requestPath = '/index.html'
      }

      $targetPath = [System.Uri]::UnescapeDataString($requestPath.TrimStart('/').Replace('/', '\'))
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $resolvedRoot $targetPath))

      if (-not $filePath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        Write-Response -Stream $stream -StatusCode 403 -ContentType 'text/plain; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes('Forbidden'))
        continue
      }

      if (-not (Test-Path $filePath -PathType Leaf)) {
        Write-Response -Stream $stream -StatusCode 404 -ContentType 'text/plain; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes('Not found'))
        continue
      }

      $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      $contentType = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      Write-Response -Stream $stream -StatusCode 200 -ContentType $contentType -Body $bytes
    }
    finally {
      if ($reader) {
        $reader.Dispose()
      }
      if ($stream) {
        $stream.Dispose()
      }
      $client.Dispose()
      $reader = $null
      $stream = $null
    }
  }
}
finally {
  $listener.Stop()
}
