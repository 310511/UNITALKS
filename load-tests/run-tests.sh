#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 UniTalks Load Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p load-tests/reports

echo "📝 Test 1: Text Chat"
artillery run load-tests/text-chat.yml \
  --output load-tests/reports/text-chat.json
artillery report load-tests/reports/text-chat.json \
  --output load-tests/reports/text-chat.html

echo "🎤 Test 2: Voice Chat"
artillery run load-tests/voice-chat.yml \
  --output load-tests/reports/voice-chat.json
artillery report load-tests/reports/voice-chat.json \
  --output load-tests/reports/voice-chat.html

echo "📹 Test 3: Video Chat"
artillery run load-tests/video-chat.yml \
  --output load-tests/reports/video-chat.json
artillery report load-tests/reports/video-chat.json \
  --output load-tests/reports/video-chat.html

echo "💥 Test 4: Full Stress Test"
artillery run load-tests/full-stress.yml \
  --output load-tests/reports/full-stress.json
artillery report load-tests/reports/full-stress.json \
  --output load-tests/reports/full-stress.html

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests complete!"
echo "📊 Open load-tests/reports/*.html to view results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

