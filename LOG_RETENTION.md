# Log Retention and Automated Cleanup

## Overview

The webhook system implements automatic log retention and cleanup to prevent unlimited data growth. The cleanup process runs daily and enforces two limits:

1. **Time-based**: Deletes webhook data older than **1 month** (30 days)
2. **Size-based**: Deletes oldest requests if a user exceeds **100MB** storage
   - Intelligent bulk deletion: calculates average request size and deletes approximate amount in ONE SQL statement
   - Fine-tunes with 100-record batches if needed
   - Safety limit of 200,000 deletions per user per cycle

Detailed statistics are sent to the admin via email after each cleanup.

## How It Works

### Automatic Cleanup Process

1. **Schedule**: Runs daily at midnight UTC (0:00) via Cloudflare Workers Cron Triggers
2. **Time-based Cleanup**: Deletes all `webhook_data` records older than 30 days (1 month)
3. **Size-based Cleanup**: For each user exceeding 100MB storage, deletes oldest requests until storage is ≤100MB
   - **Step 1**: Calculate average request size (`totalStorage / totalRecords`)
   - **Step 2**: Estimate records to delete (`excessStorage / avgSize`)
   - **Step 3**: Bulk delete estimated amount in ONE SQL statement (typically 50,000-100,000 records)
   - **Step 4**: Fine-tune with 100-record batches if storage still exceeds limit
   - Safety limit: Maximum 200,000 deletions per user per cycle to prevent runaway operations
   - **Performance**: ~99% reduction in database operations compared to individual deletions
4. **Notification**: Sends daily statistics email to the configured admin with both cleanup types

### What Gets Deleted

Only **webhook data records** (`webhook_data` table) are deleted:
- Request headers
- Request bodies/query parameters
- Request metadata (method, timestamp, size)

**What is NOT deleted**:
- User accounts
- Webhook definitions (UUIDs, names, tags)
- Webhook sharing relationships

## Configuration

### 1. Enable Cron Triggers

The cron schedule is configured in `admin/wrangler.toml`:

```toml
[triggers]
crons = ["0 0 * * *"]  # Runs daily at midnight UTC (0:00)
```

**Cron Schedule Format**: Standard cron expression
- `0 0 * * *` = Daily at midnight UTC (current setting)
- `0 */6 * * *` = Every 6 hours
- `0 * * * *` = Every hour at minute 0
- `0 0 * * 0` = Weekly on Sunday at midnight
- `0 0 1 * *` = Monthly on the 1st at midnight

### 2. Set Admin Email

Configure the `ADMIN_EMAIL` environment variable to receive daily statistics:

**Local Development** (`admin/.env`):
```env
ADMIN_EMAIL=admin@example.com
```

**Production** (Cloudflare Dashboard or via CLI):
```bash
wrangler secret put ADMIN_EMAIL
# Enter: admin@example.com
```

Or upload all secrets at once:
```bash
npm run secrets:upload
```

### 3. Configure Email Service

The cleanup process uses Resend for sending emails. Ensure these are configured:

```env
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=your-verified-sender@example.com
ADMIN_EMAIL=admin@example.com
```

## Daily Statistics Email

### Email Content

The admin receives a daily email with:

1. **System Overview**
   - Total Users
   - Total Webhooks
   - Total Records
   - Total Storage

2. **Cleanup Summary** (if data was deleted)
   - **Time-based Cleanup**: Number of records deleted older than 1 month
   - **Size-based Cleanup**: Number of records deleted to enforce 100MB per-user limit
   - **Total Deleted**: Combined count from both cleanup types

3. **User Statistics Table**
   - User email
   - Number of webhooks
   - Number of records
   - Storage used (formatted: B, KB, MB, GB)
   - Sorted by data count (descending)

### Email Example

**Subject**: 📊 Daily Webhook Stats | 3 users | 150 records | 25 deleted

**Content**:
- System totals in card format
- Cleanup notification with breakdown:
  - Time-based cleanup: Records older than 1 month
  - Size-based cleanup: Records deleted to enforce 100MB limit
  - Total deleted count
- Detailed user table (email, webhooks, records, storage)
- Timestamp (UTC)

## Customizing Cleanup Settings

### Change Time-based Retention Period

Edit `admin/src/handlers/cleanup.ts`:

```typescript
// Calculate cutoff date: 1 day ago (24 hours)
const oneDayAgo = new Date()
oneDayAgo.setDate(oneDayAgo.getDate() - 1)  // Current setting
```

**Other Retention Period Examples**:

**7 days retention**:
```typescript
const cutoffDate = new Date()
cutoffDate.setDate(cutoffDate.getDate() - 7)
```

**3 months retention**:
```typescript
const cutoffDate = new Date()
cutoffDate.setMonth(cutoffDate.getMonth() - 3)
```

**6 months retention**:
```typescript
const cutoffDate = new Date()
cutoffDate.setMonth(cutoffDate.getMonth() - 6)
```

**1 year retention**:
```typescript
const cutoffDate = new Date()
cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)
```

### Change Cleanup Frequency

Edit `admin/wrangler.toml`:

```toml
[triggers]
crons = ["0 0 * * *"]  # Current: Daily at midnight UTC
```

**Examples**:

**Every 6 hours**:
```toml
crons = ["0 */6 * * *"]
```

**Daily at 2 AM UTC** (current default):
```toml
crons = ["0 0 * * *"]  # Midnight UTC
```

**Daily at specific time**:
```toml
crons = ["0 2 * * *"]  # 2 AM UTC
```

**Hourly**:
```toml
crons = ["0 * * * *"]  # Every hour at minute 0
```

**Weekly on Sunday at midnight**:
```toml
crons = ["0 0 * * 0"]
```

### Change Size-based Storage Limit

Edit `admin/src/handlers/cleanup.ts`:

```typescript
// Size-based cleanup: Enforce 100MB per user limit
const MAX_USER_STORAGE_BYTES = 100 * 1024 * 1024 // 100MB
```

**Examples**:

**50MB per user**:
```typescript
const MAX_USER_STORAGE_BYTES = 50 * 1024 * 1024 // 50MB
```

**200MB per user**:
```typescript
const MAX_USER_STORAGE_BYTES = 200 * 1024 * 1024 // 200MB
```

**1GB per user**:
```typescript
const MAX_USER_STORAGE_BYTES = 1024 * 1024 * 1024 // 1GB
```

**Note**: The size-based cleanup deletes **oldest requests first** to bring the user's storage under the limit.

## Manual Cleanup

### Trigger Cleanup Manually

**Via API** (when admin worker is running):
```bash
curl -X POST http://localhost:5173/api/test-cleanup \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

**Via Scheduled Event** (local development):
```bash
curl "http://127.0.0.1:5173/cdn-cgi/handler/scheduled"
```

**In Production** (via Wrangler CLI):
```bash
wrangler publish
wrangler tail webhook-admin-prod
# Cron will trigger automatically at the scheduled time
```

## Implementation Details

### Code Location

- **Cleanup Handler**: `admin/src/handlers/cleanup.ts`
- **Cron Configuration**: `admin/wrangler.toml`
- **Main Entry Point**: `admin/src/index.tsx` (exports `scheduled` handler)

### Cleanup Flow

```
1. Cron Trigger (Cloudflare Workers)
   ↓
2. scheduled() handler in index.tsx
   ↓
3. cleanupOldData(env) in cleanup.ts
   ↓
4. Collect user statistics
   ↓
5. Delete old webhook_data records
   ↓
6. Send hourly email to ADMIN_EMAIL
   ↓
7. Return cleanup results
```

### Database Queries

**User Statistics Collection**:
```sql
-- Get all users
SELECT id, email FROM user;

-- For each user, count webhooks
SELECT COUNT(*) FROM webhooks WHERE userId = ?;

-- For each user, count data and total size
SELECT
  COUNT(*) as count,
  COALESCE(SUM(sizeBytes), 0) as totalSize
FROM webhook_data
INNER JOIN webhooks ON webhook_data.webhookId = webhooks.id
WHERE webhooks.userId = ?;
```

**Cleanup Deletion**:
```sql
DELETE FROM webhook_data
WHERE receivedAt < ?  -- cutoff date (1 month ago)
RETURNING *;
```

## Monitoring

### Check Cleanup Logs

**Local Development**:
```bash
npm run dev
# Watch console output for:
# 🧹 Starting cleanup of data older than: [date]
# 🧹 Cleanup completed: deleted [count] records older than [date]
# 🗑️ User [email] exceeds 100MB ([size] MB), cleaning up oldest requests...
# ✅ User [email] cleanup complete: deleted [count] requests
# 📦 Size enforcement completed: deleted [count] additional records
# 📧 Daily stats email sent to [email]
```

**Production** (Cloudflare Dashboard):
1. Go to Workers & Pages
2. Select `webhook-admin-prod`
3. Click "Logs" tab
4. Filter for cleanup messages

**Production** (via Wrangler CLI):
```bash
wrangler tail webhook-admin-prod
```

### Email Delivery Issues

If emails are not being received:

1. **Check ADMIN_EMAIL is set**:
   ```bash
   wrangler secret list --name webhook-admin-prod
   ```

2. **Check Resend API Key**:
   - Verify key is valid at https://resend.com/api-keys
   - Ensure FROM_EMAIL domain is verified in Resend

3. **Check logs for email errors**:
   ```bash
   wrangler tail webhook-admin-prod | grep "📧"
   ```

4. **Test email service manually**:
   ```bash
   curl -X POST http://localhost:5173/api/test-cleanup
   ```

## Best Practices

### 1. Monitor Storage Growth

Review daily emails to track:
- Users with highest data counts
- Storage growth trends
- Cleanup effectiveness

### 2. Adjust Retention Based on Usage

- **High-volume systems**: Consider shorter retention (7-14 days)
- **Low-volume systems**: Longer retention is fine (3-6 months)
- **Compliance requirements**: Adjust to meet legal/regulatory needs

### 3. Set Up Alerts

Configure email filters to alert on:
- High storage usage (>1 GB per user)
- Rapid growth (>10,000 new records/hour)
- Cleanup failures (check for error logs)

### 4. Backup Before Changing

Before modifying retention settings:
1. Document current configuration
2. Test changes in development first
3. Monitor production carefully after deployment

## Troubleshooting

### Cleanup Not Running

**Check cron triggers are enabled**:
```bash
wrangler publish
# Verify [triggers] section in wrangler.toml
```

**Manually trigger to test**:
```bash
curl "http://127.0.0.1:5173/cdn-cgi/handler/scheduled"
```

### Emails Not Sending

**Verify environment variables**:
```bash
# Local
cat admin/.env | grep -E "(ADMIN_EMAIL|RESEND_API_KEY|FROM_EMAIL)"

# Production
wrangler secret list --name webhook-admin-prod
```

**Check Resend dashboard**:
- Login to https://resend.com/emails
- Verify emails are being sent
- Check for bounce/spam reports

### High Storage Usage

**Identify high-usage users**:
- Review daily statistics emails
- Check users with >10,000 records or approaching 100MB storage
- Size-based cleanup automatically enforces 100MB limit

**Options**:
1. Reduce time-based retention period (e.g., 2 weeks instead of 1 month)
2. Increase cleanup frequency (e.g., every 6 hours instead of daily)
3. Adjust MAX_USER_STORAGE_BYTES limit (increase or decrease)
4. Contact high-usage users about their webhook volume

## Future Enhancements

Potential improvements to log retention:

1. **Per-User Retention Settings**
   - Allow users to configure their own retention periods
   - Enforce minimum/maximum retention limits

2. **Tiered Storage**
   - Move old data to cheaper storage (e.g., R2) instead of deleting
   - Provide export/download for archived data

3. **Selective Cleanup**
   - Delete by webhook instead of global cutoff
   - Keep certain tagged webhooks longer

4. **Advanced Analytics**
   - Dashboard showing storage trends over time
   - Predictive analytics for storage needs
   - Cost estimation based on usage

5. **Email Customization**
   - Configure email frequency per admin preference
   - Custom thresholds for alerts
   - Digest vs. real-time notifications

## References

- **Cloudflare Workers Cron Triggers**: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- **Resend Email API**: https://resend.com/docs
- **Drizzle ORM Delete**: https://orm.drizzle.team/docs/delete
- **Cron Expression Syntax**: https://crontab.guru/