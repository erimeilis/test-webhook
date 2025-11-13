#!/bin/bash

# Test script to overflow 100MB storage limit
# Sends many requests to a webhook to test size-based cleanup

WEBHOOK_URL="http://localhost:5174/w/9e4abcdbd-303b-49a8-9cff-71d53829ce8f"
TARGET_REQUESTS=${1:-160000}  # Default 160k, can override with argument
PARALLEL_JOBS=5               # Number of parallel requests (reduced to avoid overwhelming D1)
DELAY_MS=10                   # Delay between requests in milliseconds

echo "🚀 Starting overflow test..."
echo "📊 Target: $TARGET_REQUESTS requests to exceed 100MB"
echo "🔗 Webhook: $WEBHOOK_URL"
echo "⚡ Parallel jobs: $PARALLEL_JOBS"
echo ""

# Generate a payload (around 640 bytes with JSON overhead)
PAYLOAD='{"test":"overflow","data":"'$(printf 'x%.0s' {1..500})'","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'

echo "📦 Payload size: ~640 bytes per request"
echo "💾 Expected total: ~$((TARGET_REQUESTS * 640 / 1024 / 1024))MB"
echo ""

START_TIME=$(date +%s)

echo "⏳ Sending requests in parallel..."

# Function to send a batch of requests with rate limiting
send_batch() {
  local batch_size=$1
  for i in $(seq 1 $batch_size); do
    curl -s -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" > /dev/null 2>&1

    # Small delay to avoid overwhelming D1
    [ $DELAY_MS -gt 0 ] && sleep 0.01
  done
}

export -f send_batch
export WEBHOOK_URL PAYLOAD DELAY_MS

# Calculate batches
BATCH_SIZE=$((TARGET_REQUESTS / PARALLEL_JOBS))
REMAINING=$((TARGET_REQUESTS % PARALLEL_JOBS))

# Send batches in parallel using xargs
seq 1 $PARALLEL_JOBS | xargs -P $PARALLEL_JOBS -I {} bash -c "send_batch $BATCH_SIZE"

# Send remaining requests
if [ $REMAINING -gt 0 ]; then
  send_batch $REMAINING
fi

END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

echo ""
echo "✅ Test complete!"
echo "📊 Sent $TARGET_REQUESTS requests in ${TOTAL_TIME}s"
echo "⚡ Average rate: $((TARGET_REQUESTS / TOTAL_TIME))/sec"
echo ""
echo "📊 Check storage in admin panel at http://localhost:5173"
echo ""
echo "Next step: Trigger cleanup to test size enforcement"
echo "Run: curl http://localhost:5173/cdn-cgi/handler/scheduled"
