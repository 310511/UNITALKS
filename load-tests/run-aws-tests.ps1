# UniTalks AWS Load Test Runner
# Run this from PowerShell in the project root

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🚀 UniTalks AWS Load Test Suite"
Write-Host "Target: https://unitalks.gingr.chat:5006"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create reports folder (even if we don't save JSON, keep the layout consistent)
New-Item -ItemType Directory -Force -Path "load-tests\reports" | Out-Null

Write-Host ""
Write-Host "📝 Test 1: Text Chat (AWS)"
artillery run load-tests\text-chat.yml

Write-Host ""
Write-Host "🎤 Test 2: Voice Chat (AWS)"
artillery run load-tests\voice-chat.yml

Write-Host ""
Write-Host "📹 Test 3: Video Chat (AWS)"
artillery run load-tests\video-chat.yml

Write-Host ""
Write-Host "💥 Test 4: Full Mixed Stress (AWS)"
artillery run load-tests\aws-full-test.yml

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ All AWS tests complete!"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

