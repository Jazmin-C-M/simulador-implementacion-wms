param([int]$Port = 8899)
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Sirviendo $root en http://localhost:$Port/"

$mime = @{ ".html"="text/html"; ".css"="text/css"; ".js"="application/javascript"; ".json"="application/json"; ".xlsx"="application/octet-stream" }

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    try {
        $relPath = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
        if ($relPath -eq "/") { $relPath = "/index.html" }
        $filePath = Join-Path $root ($relPath.TrimStart("/"))
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentType = $contentType
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $relPath")
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
    } catch {
        $res.StatusCode = 500
    } finally {
        $res.OutputStream.Close()
    }
}
