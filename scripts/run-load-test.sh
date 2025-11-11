#!/bin/bash

# High-Performance Webhook Load Testing Script
# Quick commands for running different load test scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determine base URL based on environment
if [ "$USE_LOCAL_DB" = "true" ]; then
    BASE_URL="${BASE_URL:-http://localhost:5174}"
    echo -e "${BLUE}🏠 Testing against local development server${NC}"
else
    BASE_URL="${BASE_URL:-https://webhook-ingestion.eri-42e.workers.dev}"
    echo -e "${BLUE}☁️  Testing against production server${NC}"
fi

# Get webhook UUID dynamically or use environment variable
if [ -z "$WEBHOOK_URL" ]; then
    # Check if WEBHOOK_UUID is provided directly
    if [ -n "$WEBHOOK_UUID" ]; then
        WEBHOOK_URL="${BASE_URL}/w/${WEBHOOK_UUID}"
        echo -e "${GREEN}✅ Using provided webhook: ${WEBHOOK_UUID}${NC}"
    else
        echo -e "${BLUE}🔍 Fetching admin webhook UUID from database...${NC}"

        # Get webhook UUID from database (use absolute path from script directory)
        SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        # Add 5 second timeout for database query
        FETCHED_UUID=$(cd "$SCRIPT_DIR/.." && timeout 5 node scripts/get-admin-webhook.js 2>/dev/null || echo "")

        if [ -n "$FETCHED_UUID" ]; then
            # Construct webhook URL with fetched UUID
            WEBHOOK_URL="${BASE_URL}/w/${FETCHED_UUID}"
            echo -e "${GREEN}✅ Using webhook from database: ${FETCHED_UUID}${NC}"
        else
            # Check for .webhook-uuid file as fallback
            WEBHOOK_UUID_FILE="$SCRIPT_DIR/../.webhook-uuid"
            if [ -f "$WEBHOOK_UUID_FILE" ]; then
                FALLBACK_UUID=$(cat "$WEBHOOK_UUID_FILE" | tr -d '[:space:]')
                if [ -n "$FALLBACK_UUID" ]; then
                    WEBHOOK_URL="${BASE_URL}/w/${FALLBACK_UUID}"
                    echo -e "${YELLOW}⚠️  Using webhook from .webhook-uuid file: ${FALLBACK_UUID}${NC}"
                    echo -e "${YELLOW}💡 For production, consider migrating database: npm run db:migrate${NC}"
                else
                    echo -e "${RED}❌ .webhook-uuid file is empty${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}❌ Failed to fetch webhook UUID${NC}"
                echo -e ""
                echo -e "${YELLOW}💡 Set webhook manually using one of:${NC}"
                echo -e "   ${BLUE}export WEBHOOK_URL=${BASE_URL}/w/your-uuid${NC}"
                echo -e "   ${BLUE}export WEBHOOK_UUID=your-uuid${NC}"
                echo -e "   ${BLUE}echo 'your-uuid' > .webhook-uuid${NC}"
                echo -e ""
                echo -e "${YELLOW}Or ensure database is set up:${NC}"
                echo -e "   1. Create a webhook in the admin panel"
                echo -e "   2. Set ADMIN_EMAIL in admin/.env"
                echo -e "   3. Run migrations: npm run db:migrate"
                exit 1
            fi
        fi
    fi
fi

# Default values
PROFILE="${1:-medium}"
OUTPUT_DIR="./load-test-results"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed${NC}"
    echo -e "${YELLOW}Install with: brew install k6 (macOS) or visit https://k6.io/docs/get-started/installation/${NC}"
    exit 1
fi

# Display banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║       Webhook Load Testing - High Performance         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Display configuration
echo -e "${GREEN}Configuration:${NC}"
echo -e "  Profile:      ${YELLOW}$PROFILE${NC}"
echo -e "  Webhook URL:  ${YELLOW}$WEBHOOK_URL${NC}"
echo -e "  Output Dir:   ${YELLOW}$OUTPUT_DIR${NC}"
echo ""

# Profile descriptions
case "$PROFILE" in
    light)
        echo -e "${BLUE}📊 Light Load Test${NC} - 100 RPS for 60 seconds"
        ;;
    medium)
        echo -e "${BLUE}📊 Medium Load Test${NC} - 1,000 RPS for 60 seconds"
        ;;
    heavy)
        echo -e "${BLUE}📊 Heavy Load Test${NC} - 5,000 RPS for 60 seconds"
        ;;
    extreme)
        echo -e "${BLUE}📊 Extreme Load Test${NC} - 10,000 RPS for 60 seconds"
        ;;
    stress)
        echo -e "${BLUE}📊 Stress Test${NC} - Ramp up to find breaking point (24 minutes)"
        ;;
    *)
        echo -e "${RED}❌ Unknown profile: $PROFILE${NC}"
        echo -e "${YELLOW}Available profiles: light, medium, heavy, extreme, stress${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}⏳ Starting load test...${NC}"
echo ""

# Generate timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULT_FILE="$OUTPUT_DIR/load-test_${PROFILE}_${TIMESTAMP}.json"

# Run k6 load test
k6 run \
    --env WEBHOOK_URL="$WEBHOOK_URL" \
    --env LOAD_PROFILE="$PROFILE" \
    --out "json=$RESULT_FILE" \
    load-test.js

# Check if test passed
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Load test completed successfully!${NC}"
    echo -e "${GREEN}📄 Results saved to: $RESULT_FILE${NC}"
    echo ""

    # Display summary if jq is available
    if command -v jq &> /dev/null; then
        echo -e "${BLUE}📊 Quick Summary:${NC}"

        # Extract key metrics (simplified - actual parsing would be more complex)
        TOTAL_REQS=$(jq -r 'select(.type=="Point" and .metric=="http_reqs") | .data.value' "$RESULT_FILE" | tail -1)

        if [ -n "$TOTAL_REQS" ]; then
            echo -e "  Total Requests: ${YELLOW}$TOTAL_REQS${NC}"
        fi

        echo -e "${YELLOW}  For full metrics, check the console output above${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ Load test failed or did not meet thresholds${NC}"
    echo -e "${YELLOW}Check the output above for details${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo -e "  1. Review the metrics above"
echo -e "  2. Check worker logs: ${YELLOW}cd admin && wrangler tail${NC}"
echo -e "  3. Monitor Cloudflare dashboard for resource usage"
echo -e "  4. Analyze results file: ${YELLOW}$RESULT_FILE${NC}"
echo ""
