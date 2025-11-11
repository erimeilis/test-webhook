# Webhook Load Testing Guide

High-performance stress testing for the webhook ingestion system using k6.

## Features

✅ **10K+ RPS capable** - Can generate over 10,000 requests per second
✅ **Random payloads** - Generates diverse JSON data with random structures
✅ **Mixed methods** - 70% POST, 30% GET with query parameters
✅ **Random headers** - Includes custom headers for realistic traffic simulation
✅ **Real-time metrics** - Live dashboard with p95, p99 latency tracking
✅ **Multiple profiles** - From light (100 RPS) to extreme (10K+ RPS)
✅ **Stress testing** - Automatically finds your system's breaking point

## Quick Start

### 1. Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Fedora/CentOS
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

**Windows:**
```bash
choco install k6
# or
winget install k6 --source winget
```

**Docker:**
```bash
docker pull grafana/k6:latest
```

### 2. Run Load Tests

**Light load (100 RPS):**
```bash
cd scripts
k6 run --env LOAD_PROFILE=light load-test.js
```

**Medium load (1K RPS):**
```bash
k6 run --env LOAD_PROFILE=medium load-test.js
```

**Heavy load (5K RPS):**
```bash
k6 run --env LOAD_PROFILE=heavy load-test.js
```

**Extreme load (10K RPS):**
```bash
k6 run --env LOAD_PROFILE=extreme load-test.js
```

**Stress test (find breaking point):**
```bash
k6 run --env LOAD_PROFILE=stress load-test.js
```

### 3. Custom Webhook Endpoint

Test your own webhook:
```bash
k6 run --env WEBHOOK_URL=https://your-worker.workers.dev/w/your-uuid \
       --env LOAD_PROFILE=medium \
       load-test.js
```

## Load Profiles

| Profile | RPS | Duration | VUs | Use Case |
|---------|-----|----------|-----|----------|
| `light` | 100 | 60s | 10-50 | Basic functionality test |
| `medium` | 1,000 | 60s | 50-200 | Standard load test |
| `heavy` | 5,000 | 60s | 200-1,000 | High load test |
| `extreme` | 10,000 | 60s | 500-2,000 | Maximum throughput test |
| `stress` | 100→20K | 24m | 100-5,000 | Find breaking point |

## Understanding Results

### Key Metrics

**http_req_duration**: Response time
- `p(95)`: 95th percentile (should be <500ms)
- `p(99)`: 99th percentile (should be <1s)
- `avg`: Average response time
- `max`: Maximum response time

**http_req_failed**: Error rate
- Should be <1%
- Higher means system is overloaded

**http_reqs**: Total requests made
- Compare to target RPS

**iterations**: Completed iterations
- Should match http_reqs (1 request per iteration)

**Example Output:**
```
     ✓ status is 200 or 201
     ✓ response time < 1s
     ✓ response time < 500ms

     checks.........................: 100.00% ✓ 60000      ✗ 0
     data_received..................: 12 MB   200 kB/s
     data_sent......................: 60 MB   1.0 MB/s
     http_req_blocked...............: avg=1.23ms   min=1µs    med=3µs    max=234ms  p(90)=5µs    p(95)=7µs
     http_req_connecting............: avg=634µs    min=0s     med=0s     max=156ms  p(90)=0s     p(95)=0s
   ✓ http_req_duration..............: avg=45.67ms  min=15ms   med=42ms   max=987ms  p(90)=76ms   p(95)=95ms
       { expected_response:true }...: avg=45.67ms  min=15ms   med=42ms   max=987ms  p(90)=76ms   p(95)=95ms
   ✓ http_req_failed................: 0.00%   ✓ 0          ✗ 60000
     http_req_receiving.............: avg=123µs    min=18µs   med=98µs   max=12ms   p(90)=187µs  p(95)=234µs
     http_req_sending...............: avg=45µs     min=8µs    med=32µs   max=3.45ms p(90)=76µs   p(95)=98µs
     http_req_tls_handshaking.......: avg=567µs    min=0s     med=0s     max=78ms   p(90)=0s     p(95)=0s
     http_req_waiting...............: avg=45.5ms   min=14.8ms med=41.8ms max=986ms  p(90)=75.8ms p(95)=94.8ms
     http_reqs......................: 60000   1000/s
     iteration_duration.............: avg=47.23ms  min=15.5ms med=43.1ms max=1.01s  p(90)=78ms   p(95)=97ms
     iterations.....................: 60000   1000/s
     vus............................: 50      min=50       max=50
     vus_max........................: 200     min=200      max=200
```

### Success Criteria

✅ **Passing Test:**
- `http_req_failed` < 1%
- `p(95)` < 500ms
- `p(99)` < 1000ms
- No timeout errors

❌ **Failing Test:**
- Error rate > 1%
- High response times
- Timeout errors
- Worker crashes

## Advanced Usage

### Save Results to File

```bash
k6 run --out json=results.json load-test.js
```

### Run with Docker

```bash
docker run --rm -i grafana/k6:latest run - <load-test.js
```

### Cloud Testing (Grafana Cloud)

```bash
k6 cloud login
k6 cloud load-test.js
```

### Custom Configuration

Create `config.js`:
```javascript
export const options = {
  scenarios: {
    custom: {
      executor: 'constant-arrival-rate',
      rate: 2500,           // 2.5K RPS
      timeUnit: '1s',
      duration: '5m',       // 5 minutes
      preAllocatedVUs: 100,
      maxVUs: 500,
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<300'],  // Stricter: 95% under 300ms
    'http_req_failed': ['rate<0.005'],   // Stricter: error rate under 0.5%
  },
};
```

## Payload Types

The script generates 5 types of random payloads:

**1. Simple (flat object):**
```json
{
  "id": 12345,
  "name": "xR8kLmQ2",
  "email": "aB3dEf9G@gH7iJk.com",
  "timestamp": "2025-01-11T08:15:30.123Z",
  "value": 42.56
}
```

**2. Nested (hierarchical):**
```json
{
  "user": {
    "id": 67890,
    "profile": {
      "name": "John Doe",
      "email": "john@example.com",
      "metadata": {
        "created": "2025-01-11T08:15:30.123Z",
        "updated": "2025-01-11T08:15:30.123Z"
      }
    }
  },
  "data": { ... }
}
```

**3. Array (list of items):**
```json
{
  "items": [1, "foo", true, null, {"nested": "object"}],
  "total": 500,
  "page": 3
}
```

**4. Mixed (random types):**
```json
{
  "field1": "string",
  "field2": 123,
  "field3": true,
  "field4": null,
  "field5": ["array"],
  "field6": {"nested": "object"}
}
```

**5. Large (50+ fields):**
```json
{
  "field_0": "...",
  "field_1": 123,
  "field_2": true,
  ...
  "field_49": {...}
}
```

## Troubleshooting

### Low RPS (not reaching target)

**Problem:** Actual RPS is lower than expected

**Solution:**
- Increase `preAllocatedVUs` and `maxVUs`
- Run on a more powerful machine
- Use distributed testing (k6 cloud)

### High Error Rate

**Problem:** `http_req_failed` > 1%

**Causes:**
- Webhook worker is overloaded
- Database (D1) is rate-limited
- Network issues
- Cold starts

**Solution:**
- Scale down RPS
- Check worker logs: `wrangler tail`
- Monitor Cloudflare dashboard
- Increase worker resources

### Timeout Errors

**Problem:** Requests timing out

**Solution:**
```javascript
export const options = {
  httpDebug: 'full',  // Enable debug logging
  timeout: '60s',      // Increase timeout
};
```

### Memory Issues

**Problem:** k6 runs out of memory

**Solution:**
- Reduce `maxVUs`
- Decrease payload size
- Use shorter test duration
- Run on machine with more RAM

## Best Practices

1. **Start Small**: Begin with `light` profile, gradually increase
2. **Monitor System**: Watch Cloudflare dashboard during tests
3. **Test Production-Like**: Use realistic payloads and traffic patterns
4. **Warm Up System**: Run a small load first to avoid cold starts
5. **Test Incrementally**: Don't jump from 100 to 10K RPS immediately
6. **Analyze Results**: Check p95, p99, error rates - not just averages
7. **Test Regularly**: Performance can degrade over time
8. **Document Baselines**: Record normal performance for comparison

## Example Test Scenarios

### Scenario 1: Capacity Planning

Find maximum sustainable RPS:
```bash
k6 run --env LOAD_PROFILE=stress load-test.js
```

Watch for:
- When error rate rises above 1%
- When p95 latency exceeds 500ms
- This is your system's capacity

### Scenario 2: Regression Testing

Test after code changes:
```bash
# Before changes
k6 run --env LOAD_PROFILE=medium load-test.js > baseline.txt

# After changes
k6 run --env LOAD_PROFILE=medium load-test.js > current.txt

# Compare results
diff baseline.txt current.txt
```

### Scenario 3: Spike Testing

Test sudden traffic spikes:
```javascript
// Custom scenario in load-test.js
{
  executor: 'ramping-arrival-rate',
  startRate: 100,
  stages: [
    { duration: '1m', target: 100 },    // Normal load
    { duration: '30s', target: 5000 },  // Sudden spike
    { duration: '2m', target: 5000 },   // Sustained spike
    { duration: '30s', target: 100 },   // Back to normal
  ],
}
```

### Scenario 4: Endurance Testing

Test for memory leaks and degradation:
```bash
# Run for 1 hour at medium load
k6 run --env LOAD_PROFILE=medium \
       --duration 1h \
       load-test.js
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Load Test
on:
  push:
    branches: [main]
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: scripts/load-test.js
          flags: --env LOAD_PROFILE=medium
      - name: Check thresholds
        run: |
          if [ $? -ne 0 ]; then
            echo "Load test failed thresholds"
            exit 1
          fi
```

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/api-load-testing/)
- [Grafana Cloud k6](https://grafana.com/products/cloud/k6/)

## Support

If you encounter issues:
1. Check worker logs: `cd admin && wrangler tail`
2. Monitor Cloudflare dashboard: Analytics tab
3. Review k6 debug output: Add `--http-debug="full"`
4. Check system resources: CPU, memory, network
