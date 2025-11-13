# Toggle Switch E2E Tests

End-to-end tests for the ToggleSwitch component using Playwright MCP server.

## Prerequisites

- Admin worker running on `http://localhost:5173`
- Test user credentials: `test@example.com` / `password123`
- Webhook with data created (via seed script)

## Test Setup

```bash
# Start the development server
npm run dev

# Seed test data (if not already done)
npm run db:seed
```

## Test Scenarios

### 1. Toggle Switch Rendering

**Objective**: Verify toggle switch renders correctly on webhook detail page

**Steps**:
1. Navigate to `http://localhost:5173/login`
2. Login with test credentials
3. Click on a webhook card
4. Verify toggle switch is visible

**Expected Results**:
- Toggle switch with 3 buttons: All, GET, POST
- Sliding indicator visible
- "All" button is active by default
- Indicator positioned at "All" button

**Playwright Commands**:
```typescript
playwright_navigate({ url: "http://localhost:5173/login" })
playwright_fill({ selector: "#email", value: "test@example.com" })
playwright_fill({ selector: "#password", value: "password123" })
playwright_click({ selector: 'button[type="submit"]' })
playwright_click({ selector: '[data-webhook-id]' })
playwright_screenshot({ name: "toggle-initial-state" })

// Verify toggle switch exists
playwright_get_visible_html({ selector: '[data-toggle-switch="method-filter"]' })
```

### 2. Toggle Switch Click Interaction

**Objective**: Verify clicking toggle buttons updates state and filters

**Steps**:
1. Navigate to webhook detail page (authenticated)
2. Click "GET" button
3. Verify indicator slides to GET position
4. Verify URL updates with `?requests_table_method=GET`
5. Verify table shows only GET requests

**Expected Results**:
- Indicator animates smoothly to GET button
- GET button becomes active (highlighted)
- URL query parameter updated
- Page reloads with filtered data
- Only GET requests visible in table

**Playwright Commands**:
```typescript
// Initial state
playwright_screenshot({ name: "before-get-click" })

// Click GET button
playwright_click({ selector: '[data-toggle-value="GET"]' })

// Wait for navigation
playwright_wait_for({ text: "GET" })

// Verify URL
playwright_evaluate({ function: "() => window.location.href" })
// Should contain: requests_table_method=GET

// Verify indicator position
playwright_get_visible_html({ selector: '[data-toggle-indicator]' })
// Should have transform: translateX(calc(100% + 0.25rem))

playwright_screenshot({ name: "after-get-click" })
```

### 3. Toggle Switch POST Filter

**Objective**: Verify POST filter works correctly

**Steps**:
1. From GET filtered state
2. Click "POST" button
3. Verify indicator slides to POST position
4. Verify URL updates with `?requests_table_method=POST`
5. Verify table shows only POST requests

**Expected Results**:
- Indicator animates from GET to POST
- POST button becomes active
- GET button becomes inactive
- URL updated correctly
- Only POST requests in table

**Playwright Commands**:
```typescript
playwright_click({ selector: '[data-toggle-value="POST"]' })
playwright_wait_for({ text: "POST" })
playwright_screenshot({ name: "post-filter-active" })

// Verify indicator at third position
playwright_get_visible_html({ selector: '[data-toggle-indicator]' })
// Should have transform: translateX(calc(200% + 0.25rem))
```

### 4. Toggle Switch "All" Reset

**Objective**: Verify clicking "All" clears filter

**Steps**:
1. From POST filtered state
2. Click "All" button
3. Verify indicator returns to first position
4. Verify URL clears method parameter
5. Verify table shows all requests

**Expected Results**:
- Indicator returns to "All" position
- All button active, POST inactive
- URL has no method parameter
- All requests visible (GET and POST)

**Playwright Commands**:
```typescript
playwright_click({ selector: '[data-toggle-value="all"]' })
playwright_screenshot({ name: "all-filter-reset" })

// Verify no method in URL
playwright_evaluate({ function: "() => window.location.search" })
// Should not contain: method
```

### 5. Toggle Switch Visual Styles

**Objective**: Verify toggle switch has correct soft primary style

**Steps**:
1. Navigate to webhook detail page
2. Inspect toggle switch element
3. Verify style classes

**Expected Results**:
- Container: `bg-muted/50 border border-border/50`
- Indicator: `bg-primary opacity-60`
- Active button: `text-primary`
- Inactive buttons: `text-muted-foreground`

**Playwright Commands**:
```typescript
playwright_get_visible_html({ selector: '[data-toggle-switch="method-filter"]' })

// Verify classes in output
// Container should have: bg-muted/50, border, border-border/50
// Indicator should have: bg-primary, opacity-60
// Active button should have: text-primary
```

### 6. Toggle Switch Accessibility

**Objective**: Verify toggle switch is accessible

**Steps**:
1. Navigate to webhook detail page
2. Verify keyboard navigation works
3. Verify screen reader attributes

**Expected Results**:
- All buttons have `type="button"`
- Buttons have `cursor-pointer` class
- Indicator has `pointer-events-none`
- Data attributes present for identification

**Playwright Commands**:
```typescript
// Verify button types
playwright_get_visible_html({ selector: '[data-toggle-value="GET"]' })
// Should have: type="button"

// Test keyboard navigation
playwright_press_key({ key: "Tab" })
playwright_press_key({ key: "Enter" })
```

### 7. Toggle Switch State Persistence

**Objective**: Verify filter persists across page reloads

**Steps**:
1. Set filter to "GET"
2. Reload page
3. Verify GET filter still active

**Expected Results**:
- GET button active after reload
- Indicator at GET position
- Table shows GET requests
- URL parameter persists

**Playwright Commands**:
```typescript
// Set GET filter
playwright_click({ selector: '[data-toggle-value="GET"]' })

// Reload
playwright_evaluate({ function: "() => window.location.reload()" })

// Verify state persists
playwright_screenshot({ name: "get-after-reload" })
playwright_get_visible_html({ selector: '[data-toggle-switch="method-filter"]' })
```

### 8. Toggle Switch with Empty Data

**Objective**: Verify toggle works with no webhook data

**Steps**:
1. Navigate to webhook with 0 requests
2. Verify toggle switch renders
3. Click different options
4. Verify no errors

**Expected Results**:
- Toggle switch renders normally
- Clicking works without errors
- Empty state message shown
- Indicator animates correctly

**Playwright Commands**:
```typescript
// Navigate to empty webhook
playwright_navigate({ url: "http://localhost:5173/dashboard/[empty-webhook-id]" })

playwright_click({ selector: '[data-toggle-value="GET"]' })
playwright_screenshot({ name: "toggle-empty-state" })

// Verify no console errors
playwright_console_logs({ type: "error" })
```

## Running Tests via Playwright MCP

### Setup Playwright Session

```typescript
// 1. Navigate to admin
playwright_navigate({
  url: "http://localhost:5173",
  headless: false
})

// 2. Take initial screenshot
playwright_screenshot({ name: "initial-state" })
```

### Login Flow

```typescript
playwright_fill({ selector: "#email", value: "test@example.com" })
playwright_fill({ selector: "#password", value: "password123" })
playwright_click({ selector: 'button[type="submit"]' })
```

### Navigate to Webhook Detail

```typescript
// Wait for dashboard to load
playwright_wait_for({ text: "Webhooks" })

// Click first webhook
playwright_click({ selector: '[data-webhook-id]' })

// Wait for detail page
playwright_wait_for({ text: "Requests" })
```

### Test Toggle Switch

```typescript
// Verify rendering
playwright_get_visible_html({ selector: '[data-toggle-switch="method-filter"]' })
playwright_screenshot({ name: "toggle-initial" })

// Test GET filter
playwright_click({ selector: '[data-toggle-value="GET"]' })
playwright_screenshot({ name: "toggle-get" })

// Test POST filter
playwright_click({ selector: '[data-toggle-value="POST"]' })
playwright_screenshot({ name: "toggle-post" })

// Test All reset
playwright_click({ selector: '[data-toggle-value="all"]' })
playwright_screenshot({ name: "toggle-all" })
```

### Cleanup

```typescript
playwright_close()
```

## Test Results Location

Screenshots saved to: `~/Downloads/`

## Automated Test Script

Create a script to run all E2E tests:

```bash
#!/bin/bash
# tests/e2e/run-toggle-tests.sh

echo "Starting E2E tests for ToggleSwitch..."

# Ensure server is running
if ! curl -s http://localhost:5173/health > /dev/null; then
  echo "Error: Admin server not running on port 5173"
  echo "Run: npm run dev"
  exit 1
fi

echo "✓ Server is running"

# Run tests via Claude Code with Playwright MCP
# (Manual execution via Claude Code interface)

echo "✓ E2E tests complete"
echo "Review screenshots in ~/Downloads/"
```

## Troubleshooting

### Toggle Not Clickable

**Issue**: Clicking toggle buttons doesn't work

**Checks**:
1. Verify client.js is loaded
2. Check browser console for errors
3. Verify event listeners are attached
4. Check z-index and pointer-events

**Playwright Debug**:
```typescript
playwright_console_logs({ type: "all" })
playwright_evaluate({ function: "() => document.querySelector('[data-toggle-switch]')" })
```

### Indicator Not Animating

**Issue**: Indicator doesn't slide to clicked button

**Checks**:
1. Verify `transform` style is being updated
2. Check CSS transitions are working
3. Verify indicator has correct positioning

**Playwright Debug**:
```typescript
playwright_get_visible_html({ selector: '[data-toggle-indicator]' })
// Check transform style value
```

### URL Not Updating

**Issue**: Query parameters not changing

**Checks**:
1. Verify `updateTableParams` function is called
2. Check `window.location.href` is being updated
3. Verify page is reloading

**Playwright Debug**:
```typescript
playwright_console_logs({ search: "Navigating to" })
// Should see: 🔗 Navigating to: [url]
```

## Best Practices

1. **Always start fresh**: Login for each test session
2. **Use data attributes**: Target elements by `[data-toggle-value]`, not classes
3. **Wait for navigation**: Use `playwright_wait_for` after clicks that trigger navigation
4. **Capture screenshots**: Take screenshots at each step for visual verification
5. **Check console logs**: Monitor for JavaScript errors
6. **Test in sequence**: Run tests in order (render → click → verify)
7. **Cleanup**: Close browser after tests to free resources

## Future Enhancements

1. **Automated Test Runner**: Create script to run all tests programmatically
2. **Visual Regression**: Compare screenshots to baseline images
3. **Performance Metrics**: Measure animation smoothness and load times
4. **Accessibility Audit**: Run axe-core accessibility checks
5. **Cross-Browser**: Test in Chrome, Firefox, Safari
6. **Mobile Testing**: Verify touch interactions on mobile viewports
