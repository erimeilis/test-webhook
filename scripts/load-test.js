/**
 * High-Performance Webhook Load Testing Script
 *
 * Supports:
 * - 10K+ requests per second
 * - Random GET/POST methods
 * - Random payloads (JSON objects, arrays, strings, numbers)
 * - Random headers
 * - Multiple webhook endpoints testing
 * - Real-time metrics and thresholds
 *
 * Usage:
 *   # Light load (100 RPS)
 *   k6 run --env LOAD_PROFILE=light load-test.js
 *
 *   # Medium load (1000 RPS)
 *   k6 run --env LOAD_PROFILE=medium load-test.js
 *
 *   # Heavy load (5000 RPS)
 *   k6 run --env LOAD_PROFILE=heavy load-test.js
 *
 *   # Extreme load (10000 RPS)
 *   k6 run --env LOAD_PROFILE=extreme load-test.js
 *
 *   # Stress test (find breaking point)
 *   k6 run --env LOAD_PROFILE=stress load-test.js
 *
 *   # Custom webhook endpoint
 *   k6 run --env WEBHOOK_URL=https://your-worker.workers.dev/w/your-uuid load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Configuration
const WEBHOOK_URL = __ENV.WEBHOOK_URL;
const LOAD_PROFILE = __ENV.LOAD_PROFILE || 'medium';

if (!WEBHOOK_URL) {
  throw new Error('WEBHOOK_URL environment variable is required. Run via npm run load-test:[profile]');
}

// Load profiles
const profiles = {
  light: {
    executor: 'constant-arrival-rate',
    rate: 100,
    timeUnit: '1s',
    duration: '60s',
    preAllocatedVUs: 20,
    maxVUs: 100,  // Increased from 50 to handle slower responses
  },
  medium: {
    executor: 'constant-arrival-rate',
    rate: 1000,
    timeUnit: '1s',
    duration: '60s',
    preAllocatedVUs: 100,
    maxVUs: 500,  // Increased from 200
  },
  heavy: {
    executor: 'constant-arrival-rate',
    rate: 5000,
    timeUnit: '1s',
    duration: '60s',
    preAllocatedVUs: 500,
    maxVUs: 2500,  // Increased from 1000
  },
  extreme: {
    executor: 'constant-arrival-rate',
    rate: 10000,
    timeUnit: '1s',
    duration: '60s',
    preAllocatedVUs: 1000,
    maxVUs: 5000,  // Increased from 2000
  },
  stress: {
    executor: 'ramping-arrival-rate',
    startRate: 100,
    timeUnit: '1s',
    preAllocatedVUs: 100,
    maxVUs: 5000,
    stages: [
      { duration: '2m', target: 1000 },   // Ramp to 1K RPS
      { duration: '5m', target: 5000 },   // Ramp to 5K RPS
      { duration: '5m', target: 10000 },  // Ramp to 10K RPS
      { duration: '5m', target: 15000 },  // Ramp to 15K RPS
      { duration: '5m', target: 20000 },  // Ramp to 20K RPS - find breaking point
      { duration: '2m', target: 0 },      // Ramp down
    ],
  },
};

// Test configuration
export const options = {
  scenarios: {
    webhook_load: profiles[LOAD_PROFILE] || profiles.medium,
  },
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'], // 95% under 1s, 99% under 2s (realistic for D1)
    'http_req_failed': ['rate<0.01'],                   // Error rate under 1%
    'errors': ['rate<0.01'],                            // Custom error rate under 1%
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Random data generators
function randomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomInt(min = 0, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min = 0, max = 100) {
  return Math.random() * (max - min) + min;
}

function randomEmail() {
  return `${randomString(8)}@${randomString(6)}.com`;
}

function randomBoolean() {
  return Math.random() < 0.5;
}

function randomArray(length = 5) {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(randomValue());
  }
  return arr;
}

function randomObject(depth = 2) {
  if (depth <= 0) return randomValue(0);

  const obj = {};
  const numKeys = randomInt(3, 8);

  for (let i = 0; i < numKeys; i++) {
    const key = randomString(randomInt(5, 12));
    obj[key] = randomValue(depth - 1);
  }

  return obj;
}

function randomValue(depth = 2) {
  const types = ['string', 'number', 'boolean', 'null', 'object', 'array'];
  const type = types[randomInt(0, types.length - 1)];

  switch (type) {
    case 'string':
      return Math.random() < 0.3 ? randomEmail() : randomString(randomInt(5, 50));
    case 'number':
      return Math.random() < 0.5 ? randomInt() : randomFloat();
    case 'boolean':
      return randomBoolean();
    case 'null':
      return null;
    case 'object':
      return depth > 0 ? randomObject(depth - 1) : randomString();
    case 'array':
      return depth > 0 ? randomArray(randomInt(1, 5)) : [randomString()];
    default:
      return randomString();
  }
}

function generateRandomPayload() {
  const payloadTypes = [
    'simple',      // Simple flat object
    'nested',      // Nested objects
    'array',       // Array of objects
    'mixed',       // Mixed types
    'large',       // Large payload
  ];

  const type = payloadTypes[randomInt(0, payloadTypes.length - 1)];

  switch (type) {
    case 'simple':
      return {
        id: randomInt(1, 100000),
        name: randomString(10),
        email: randomEmail(),
        timestamp: new Date().toISOString(),
        value: randomFloat(),
      };

    case 'nested':
      return {
        user: {
          id: randomInt(1, 100000),
          profile: {
            name: randomString(10),
            email: randomEmail(),
            metadata: {
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
            },
          },
        },
        data: randomObject(2),
      };

    case 'array':
      return {
        items: randomArray(randomInt(5, 20)),
        total: randomInt(1, 1000),
        page: randomInt(1, 10),
      };

    case 'mixed':
      return randomObject(3);

    case 'large':
      const large = {};
      for (let i = 0; i < 50; i++) {
        large[`field_${i}`] = randomValue(1);
      }
      return large;

    default:
      return { message: randomString(20) };
  }
}

function generateRandomHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': `LoadTest-k6/${randomInt(1, 10)}.${randomInt(0, 20)}`,
  };

  // Add random custom headers
  if (Math.random() < 0.5) {
    headers['X-Request-ID'] = randomString(32);
  }
  if (Math.random() < 0.3) {
    headers['X-User-ID'] = randomInt(1, 100000).toString();
  }
  if (Math.random() < 0.3) {
    headers['X-Session-ID'] = randomString(36);
  }
  if (Math.random() < 0.2) {
    headers['X-Trace-ID'] = randomString(16);
  }

  return headers;
}

// Main test function
export default function () {
  const method = Math.random() < 0.7 ? 'POST' : 'GET'; // 70% POST, 30% GET

  let response;
  const headers = generateRandomHeaders();

  if (method === 'POST') {
    const payload = JSON.stringify(generateRandomPayload());
    response = http.post(WEBHOOK_URL, payload, { headers });
  } else {
    // For GET requests, add query parameters (manual URL encoding for k6 compatibility)
    const params = [
      `id=${randomInt(1, 100000)}`,
      `name=${randomString(10)}`,
      `timestamp=${Date.now()}`,
      `value=${randomFloat().toFixed(2)}`,
      `random=${randomString(8)}`,
    ].join('&');
    response = http.get(`${WEBHOOK_URL}?${params}`, { headers });
  }

  // Record metrics
  requestDuration.add(response.timings.duration);

  // Check response
  const statusOk = response.status === 200 || response.status === 201;
  const under2s = response.timings.duration < 2000;
  const under1s = response.timings.duration < 1000;

  check(response, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  // Only count as failed if status is not OK or takes > 2s
  const success = statusOk && under2s;

  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);

    // Better error message
    if (!statusOk) {
      console.error(`❌ HTTP Error: ${method} - Status: ${response.status} (${response.timings.duration.toFixed(0)}ms)`);
    } else {
      console.error(`⏱️  Timeout: ${method} - ${response.timings.duration.toFixed(0)}ms (threshold: 2000ms)`);
    }
  }

  errorRate.add(!success);

  // No sleep - maximize throughput
}

// Test lifecycle hooks
export function setup() {
  console.log(`\n🚀 Starting load test with profile: ${LOAD_PROFILE}`);
  console.log(`📍 Target URL: ${WEBHOOK_URL}`);
  console.log(`📊 Expected RPS: ${profiles[LOAD_PROFILE]?.rate || 'variable'}`);
  console.log(`⏱️  Duration: ${profiles[LOAD_PROFILE]?.duration || 'variable'}\n`);

  // Verify webhook endpoint is accessible
  const testResponse = http.get(WEBHOOK_URL);
  if (testResponse.status !== 200 && testResponse.status !== 405) {
    console.warn(`⚠️  Warning: Webhook endpoint returned status ${testResponse.status}`);
  }
}

export function teardown(data) {
  console.log('\n✅ Load test completed!');
  console.log('📈 Check the summary above for detailed metrics.\n');
}
