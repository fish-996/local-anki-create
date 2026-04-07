$env:GOOGLE_API_KEY="sk-LENeYOYQSILeXPcPFW60hv1woUO5W6o9hNoHn6b9ThZsL5Pl"
$env:GOOGLE_API_URL="https://api.ekan8.com/v1"
$env:LLM_MODEL="[Y]gemini-3-flash-preview"
$env:ANKI_ENDPOINT="http://localhost:8766"

$targetFile = Join-Path -Path $PSScriptRoot -ChildPath ".next/standalone/server.js"

echo "正在从 $PSScriptRoot 启动程序..."

# 3. 运行 Node.js
node $targetFile
pause