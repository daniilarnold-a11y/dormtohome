# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.test.js >> DormToHome E2E Tests >> Test 11: Landing page is accessible after sign out
- Location: tests/e2e.test.js:547:3

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('#screen-login .auth-link a').filter({ hasText: 'Home' })
    - locator resolved to <a onclick="showScreen('screen-landing')">Home</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    87 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4] [cursor=pointer]:
      - img [ref=e6]
      - generic [ref=e9]: DormToHome
    - generic [ref=e10]:
      - button "Sign In" [ref=e11] [cursor=pointer]
      - button "Get Started" [ref=e12] [cursor=pointer]
  - generic [ref=e13]:
    - generic [ref=e14]: ✦ Premium Student Bus Travel v2
    - heading "Travel home with comfort & peace of mind" [level=1] [ref=e15]:
      - text: Travel
      - emphasis [ref=e16]: home
      - text: with comfort & peace of mind
    - paragraph [ref=e17]: Safe, reliable bus routes connecting campuses to home. Real-time tracking, guardian notifications, and seamless booking.
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]: From
        - generic [ref=e22]:
          - img
          - textbox "College Station, TX" [ref=e23]
      - generic [ref=e24]:
        - generic [ref=e25]: To
        - generic [ref=e26]:
          - img
          - textbox "Houston, TX" [ref=e27]
      - generic [ref=e28]:
        - generic [ref=e29]: Date
        - generic [ref=e30]:
          - img
          - textbox [ref=e31]
      - button "Search Rides" [ref=e32] [cursor=pointer]
    - generic [ref=e33]:
      - generic [ref=e34]:
        - generic [ref=e35]: 4,200+
        - generic [ref=e36]: Trips Completed
      - generic [ref=e37]:
        - generic [ref=e38]: 98%
        - generic [ref=e39]: On-Time Rate
      - generic [ref=e40]:
        - generic [ref=e41]: 120+
        - generic [ref=e42]: Active Routes
      - generic [ref=e43]:
        - generic [ref=e44]: 12K+
        - generic [ref=e45]: Happy Riders
```

# Test source

```ts
  449 |     // Navigate from landing to login
  450 |     await page.locator('#screen-landing button', { hasText: 'Sign In' }).click();
  451 |     await expect(page.locator('#screen-login')).toBeVisible({ timeout: 5000 });
  452 | 
  453 |     // Sign in as driver
  454 |     await page.fill('#login-email', 'marcus@dormtohome.com');
  455 |     await page.fill('#login-pass', 'password123');
  456 |     await page.locator('#login-btn').click();
  457 |     await expect(page.locator('#screen-driver')).toBeVisible({ timeout: 12000 });
  458 | 
  459 |     const driver = page.locator('#screen-driver');
  460 | 
  461 |     // Driver dashboard with analytics
  462 |     await expect(driver.getByText('Driver Dashboard')).toBeVisible({ timeout: 10000 });
  463 |     await expect(driver.locator('.nav-item', { hasText: 'My Routes' })).toBeVisible({ timeout: 5000 });
  464 |     await expect(driver.getByText('Total Passengers')).toBeVisible({ timeout: 5000 });
  465 |     await expect(driver.getByText('Upcoming Trips')).toBeVisible({ timeout: 5000 });
  466 |     await expect(driver.locator('.section-title', { hasText: 'Location Sharing' })).toBeVisible({ timeout: 5000 });
  467 | 
  468 |     // My Routes
  469 |     await driver.locator('[data-tab="routes"]').click();
  470 |     await waitForSpinner();
  471 |     await expect(driver.locator('.page-title', { hasText: 'My Routes' })).toBeVisible({ timeout: 5000 });
  472 |     const hasDriverRoutes = await driver.locator('.route-card').first().isVisible().catch(() => false);
  473 |     if (hasDriverRoutes) {
  474 |       await expect(driver.locator('.route-card').first()).toBeVisible({ timeout: 5000 });
  475 |     }
  476 | 
  477 |     // New Route creation wizard
  478 |     await driver.locator('[data-tab="create"]').click();
  479 |     await expect(driver.getByText('Create New Route')).toBeVisible({ timeout: 5000 });
  480 |     await expect(driver.getByText('Route Information')).toBeVisible({ timeout: 3000 });
  481 | 
  482 |     // Step 1: Route Info
  483 |     await page.fill('#cr-from', 'College Station, TX');
  484 |     await page.fill('#cr-to', 'Dallas, TX');
  485 |     await page.fill('#cr-date', '2026-08-01');
  486 |     await page.fill('#cr-dep-time', '08:00');
  487 |     await page.fill('#cr-duration', '3h 30m');
  488 |     await driver.locator('button', { hasText: 'Next: Stops' }).click();
  489 | 
  490 |     // Step 2: Stops & Checkpoints
  491 |     await expect(driver.getByText('Stops & Checkpoints')).toBeVisible({ timeout: 3000 });
  492 |     await driver.locator('button', { hasText: 'Next: Seats' }).click();
  493 | 
  494 |     // Step 3: Seats & Pricing
  495 |     await expect(driver.getByText('Seats & Pricing')).toBeVisible({ timeout: 3000 });
  496 |     await page.fill('#cr-price', '35');
  497 |     await driver.locator('button', { hasText: 'Review' }).click();
  498 | 
  499 |     // Step 4: Review & Post
  500 |     await expect(driver.getByText('Review & Post')).toBeVisible({ timeout: 3000 });
  501 |     await expect(driver.getByText('Route Preview')).toBeVisible({ timeout: 3000 });
  502 | 
  503 |     // Cancel — don't post a real route
  504 |     await driver.locator('button', { hasText: '← Edit' }).click();
  505 |     await expect(driver.getByText('Seats & Pricing')).toBeVisible({ timeout: 3000 });
  506 |     await driver.locator('[data-tab="routes"]').click();
  507 |     await waitForSpinner();
  508 | 
  509 |     // Requests tab
  510 |     await driver.locator('[data-tab="requested"]').click();
  511 |     await waitForSpinner();
  512 |     await expect(driver.getByText('Passenger Requests')).toBeVisible({ timeout: 5000 });
  513 |     const hasRequests = await driver.locator('.card-sm').first().isVisible().catch(() => false);
  514 |     if (hasRequests) {
  515 |       await expect(driver.locator('.card-sm').first()).toBeVisible({ timeout: 5000 });
  516 |     }
  517 | 
  518 |     // Messages tab (driver)
  519 |     await driver.locator('[data-tab="messages"]').click();
  520 |     await waitForSpinner();
  521 |     const driverChat = driver.locator('.chat-sidebar');
  522 |     if (await driverChat.isVisible({ timeout: 5000 }).catch(() => false)) {
  523 |       await expect(driver.locator('.chat-room-item').first()).toBeVisible({ timeout: 5000 });
  524 |       const driverInput = driver.locator('#chat-input');
  525 |       if (await driverInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  526 |         await driverInput.fill(`Driver test message ${Date.now()}`);
  527 |         await driver.locator('button', { hasText: 'Send' }).click();
  528 |         await page.waitForTimeout(1500);
  529 |         const lastMsg = driver.locator('.chat-msg').last();
  530 |         await expect(lastMsg).toContainText('Driver test message', { timeout: 5000 });
  531 |       }
  532 |     }
  533 | 
  534 |     // Sign out from driver account
  535 |     await driver.locator('[data-tab="dashboard"]').click();
  536 |     await waitForSpinner();
  537 |     const signOutBtns = driver.locator('button', { hasText: 'Sign Out' });
  538 |     const count = await signOutBtns.count();
  539 |     if (count > 0) {
  540 |       await signOutBtns.first().click();
  541 |     await expect(page.locator('#screen-landing')).toBeVisible({ timeout: 5000 });
  542 |     }
  543 |   });
  544 | 
  545 |   // ─── TEST 11: LANDING PAGE REVISIT ────────────────────
  546 | 
  547 |   test('Test 11: Landing page is accessible after sign out', async () => {
  548 |     // Should be on login screen now
> 549 |     await page.locator('#screen-login .auth-link a', { hasText: 'Home' }).click();
      |                                                                           ^ Error: locator.click: Target page, context or browser has been closed
  550 |     await expect(page.locator('#screen-landing')).toBeVisible({ timeout: 5000 });
  551 |     await expect(page.locator('#screen-landing .hero-title')).toBeVisible({ timeout: 3000 });
  552 |   });
  553 | });
  554 | 
```