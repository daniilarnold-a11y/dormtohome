# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.test.js >> DormToHome E2E Tests >> Test 9: Sign Out redirects to login
- Location: tests/e2e.test.js:433:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#screen-login')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#screen-login')
    14 × locator resolved to <div id="screen-login" class="screen auth-screen">…</div>
       - unexpected value "hidden"

```

```yaml
- navigation:
  - img
  - text: DormToHome
  - button "Sign In"
  - button "Get Started"
- text: ✦ Premium Student Bus Travel v2
- heading "Travel home with comfort & peace of mind" [level=1]:
  - text: Travel
  - emphasis: home
  - text: with comfort & peace of mind
- paragraph: Safe, reliable bus routes connecting campuses to home. Real-time tracking, guardian notifications, and seamless booking.
- text: From
- img
- textbox "College Station, TX"
- text: To
- img
- textbox "Houston, TX"
- text: Date
- img
- textbox
- button "Search Rides"
- text: 4,200+ Trips Completed 98% On-Time Rate 120+ Active Routes 12K+ Happy Riders
```

# Test source

```ts
  343 |       const chatInput = passenger.locator('#chat-input');
  344 |       await expect(chatInput).toBeVisible({ timeout: 3000 });
  345 |       const testMessage = `Test message ${Date.now()}`;
  346 |       await chatInput.fill(testMessage);
  347 | 
  348 |       // Click send button
  349 |       await passenger.locator('button', { hasText: 'Send' }).click();
  350 |       await page.waitForTimeout(1500);
  351 | 
  352 |       // Message should appear in chat
  353 |       const lastMsg = passenger.locator('.chat-msg').last();
  354 |       await expect(lastMsg).toContainText(testMessage, { timeout: 5000 });
  355 |     } else {
  356 |       // No chat rooms — empty state
  357 |       const hasEmpty = await passenger.getByText('No trips').isVisible().catch(() => false);
  358 |       if (!hasEmpty) {
  359 |         // Chat UI might not have loaded; that's OK for this test
  360 |       }
  361 |     }
  362 |   });
  363 | 
  364 |   // ─── TEST 8: ACCOUNT PAGE ─────────────────────────────
  365 | 
  366 |   test('Test 8: Account page profile editing and guardian management', async () => {
  367 |     await page.locator('#screen-passenger [data-tab="account"]').click();
  368 |     await waitForSpinner();
  369 | 
  370 |     const passenger = page.locator('#screen-passenger');
  371 | 
  372 |     // Profile section
  373 |     await expect(passenger.getByText('Account Settings')).toBeVisible({ timeout: 5000 });
  374 |     await expect(passenger.getByText('Profile')).toBeVisible({ timeout: 3000 });
  375 | 
  376 |     // Avatar initials should be visible
  377 |     await expect(passenger.locator('#p-avatar')).toBeVisible({ timeout: 3000 });
  378 | 
  379 |     // Edit first name
  380 |     const firstNameInput = passenger.locator('#acc-first');
  381 |     await expect(firstNameInput).toBeVisible({ timeout: 3000 });
  382 |     const originalName = await firstNameInput.inputValue();
  383 |     const newName = originalName + 'E2E';
  384 |     await firstNameInput.fill(newName);
  385 | 
  386 |     // Save changes
  387 |     await passenger.locator('button', { hasText: 'Save Changes' }).click();
  388 |     const toast = await waitForToast('success');
  389 |     await expect(toast).toContainText('Profile saved');
  390 |     await clearToast();
  391 | 
  392 |     // Restore original name
  393 |     await firstNameInput.fill(originalName);
  394 |     await passenger.locator('button', { hasText: 'Save Changes' }).click();
  395 |     await waitForToast('success');
  396 |     await clearToast();
  397 | 
  398 |     // Guardian section
  399 |     await expect(passenger.getByText('Guardian Contacts')).toBeVisible({ timeout: 3000 });
  400 | 
  401 |     // Add a guardian
  402 |     await passenger.locator('button', { hasText: '+ Add' }).click();
  403 |     await expect(page.locator('#guardian-add-form')).toBeVisible({ timeout: 3000 });
  404 | 
  405 |     const guardianName = `E2E Guardian ${Date.now()}`;
  406 |     const guardianEmail = `e2e${Date.now()}@test.com`;
  407 |     const guardianPhone = '5551234567';
  408 | 
  409 |     await page.fill('#g-add-name', guardianName);
  410 |     await page.fill('#g-add-email', guardianEmail);
  411 |     await page.fill('#g-add-phone', guardianPhone);
  412 | 
  413 |     // Save guardian
  414 |     await page.locator('#guardian-add-form button', { hasText: 'Save Guardian' }).click();
  415 |     await waitForToast('success');
  416 |     await clearToast();
  417 | 
  418 |     // Verify guardian card appears in the list
  419 |     await expect(page.locator(`#guardian-list`)).toContainText(guardianName, { timeout: 5000 });
  420 |     await expect(page.locator(`#guardian-list`)).toContainText(guardianEmail, { timeout: 3000 });
  421 | 
  422 |     // Remove the guardian we just added
  423 |     const removeBtn = passenger.locator('#guardian-list').locator('button', { hasText: 'Remove' }).last();
  424 |     await expect(removeBtn).toBeVisible({ timeout: 3000 });
  425 |     await removeBtn.click();
  426 |     await page.waitForTimeout(500);
  427 |     await waitForToast('success');
  428 |     await clearToast();
  429 |   });
  430 | 
  431 |   // ─── TEST 9: SIGN OUT ────────────────────────────────
  432 | 
  433 |   test('Test 9: Sign Out redirects to login', async () => {
  434 |     await page.locator('#screen-passenger [data-tab="account"]').click();
  435 |     await waitForSpinner();
  436 | 
  437 |     // Click Sign Out button on account page
  438 |     const signOutBtn = page.locator('#screen-passenger button', { hasText: 'Sign Out' }).last();
  439 |     await expect(signOutBtn).toBeVisible({ timeout: 3000 });
  440 |     await signOutBtn.click();
  441 | 
  442 |     // Confirm dialog is auto-accepted by the handler
> 443 |     await expect(page.locator('#screen-login')).toBeVisible({ timeout: 5000 });
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  444 |   });
  445 | 
  446 |   // ─── TEST 10: DRIVER LOGIN AND DASHBOARD ──────────────
  447 | 
  448 |   test('Test 10: Driver login and all driver features', async () => {
  449 |     // Sign in as driver
  450 |     await page.fill('#login-email', 'marcus@dormtohome.com');
  451 |     await page.fill('#login-pass', 'password123');
  452 |     await page.locator('#login-btn').click();
  453 |     await expect(page.locator('#screen-driver')).toBeVisible({ timeout: 12000 });
  454 | 
  455 |     const driver = page.locator('#screen-driver');
  456 | 
  457 |     // Driver dashboard with analytics
  458 |     await expect(driver.getByText('Driver Dashboard')).toBeVisible({ timeout: 10000 });
  459 |     await expect(driver.locator('.nav-item', { hasText: 'My Routes' })).toBeVisible({ timeout: 5000 });
  460 |     await expect(driver.getByText('Total Passengers')).toBeVisible({ timeout: 5000 });
  461 |     await expect(driver.getByText('Upcoming Trips')).toBeVisible({ timeout: 5000 });
  462 |     await expect(driver.getByText('Location Sharing')).toBeVisible({ timeout: 5000 });
  463 | 
  464 |     // My Routes
  465 |     await driver.locator('[data-tab="routes"]').click();
  466 |     await waitForSpinner();
  467 |     await expect(driver.getByText('My Routes')).toBeVisible({ timeout: 5000 });
  468 |     const hasDriverRoutes = await driver.locator('.route-card').first().isVisible().catch(() => false);
  469 |     if (hasDriverRoutes) {
  470 |       await expect(driver.locator('.route-card').first()).toBeVisible({ timeout: 5000 });
  471 |     }
  472 | 
  473 |     // New Route creation wizard
  474 |     await driver.locator('[data-tab="create"]').click();
  475 |     await expect(driver.getByText('Create New Route')).toBeVisible({ timeout: 5000 });
  476 |     await expect(driver.getByText('Route Information')).toBeVisible({ timeout: 3000 });
  477 | 
  478 |     // Step 1: Route Info
  479 |     await page.fill('#cr-from', 'College Station, TX');
  480 |     await page.fill('#cr-to', 'Dallas, TX');
  481 |     await page.fill('#cr-date', '2026-08-01');
  482 |     await page.fill('#cr-dep-time', '08:00');
  483 |     await page.fill('#cr-duration', '3h 30m');
  484 |     await driver.locator('button', { hasText: 'Next: Stops' }).click();
  485 | 
  486 |     // Step 2: Stops & Checkpoints
  487 |     await expect(driver.getByText('Stops & Checkpoints')).toBeVisible({ timeout: 3000 });
  488 |     await driver.locator('button', { hasText: 'Next: Seats' }).click();
  489 | 
  490 |     // Step 3: Seats & Pricing
  491 |     await expect(driver.getByText('Seats & Pricing')).toBeVisible({ timeout: 3000 });
  492 |     await page.fill('#cr-price', '35');
  493 |     await driver.locator('button', { hasText: 'Review' }).click();
  494 | 
  495 |     // Step 4: Review & Post
  496 |     await expect(driver.getByText('Review & Post')).toBeVisible({ timeout: 3000 });
  497 |     await expect(driver.getByText('Route Preview')).toBeVisible({ timeout: 3000 });
  498 | 
  499 |     // Cancel — don't post a real route
  500 |     await driver.locator('button', { hasText: '← Edit' }).click();
  501 |     await expect(driver.getByText('Seats & Pricing')).toBeVisible({ timeout: 3000 });
  502 |     await driver.locator('[data-tab="routes"]').click();
  503 |     await waitForSpinner();
  504 | 
  505 |     // Requests tab
  506 |     await driver.locator('[data-tab="requested"]').click();
  507 |     await waitForSpinner();
  508 |     await expect(driver.getByText('Passenger Requests')).toBeVisible({ timeout: 5000 });
  509 |     const hasRequests = await driver.locator('.card-sm').first().isVisible().catch(() => false);
  510 |     if (hasRequests) {
  511 |       await expect(driver.locator('.card-sm').first()).toBeVisible({ timeout: 5000 });
  512 |     }
  513 | 
  514 |     // Messages tab (driver)
  515 |     await driver.locator('[data-tab="messages"]').click();
  516 |     await waitForSpinner();
  517 |     const driverChat = driver.locator('.chat-sidebar');
  518 |     if (await driverChat.isVisible({ timeout: 5000 }).catch(() => false)) {
  519 |       await expect(driver.locator('.chat-room-item').first()).toBeVisible({ timeout: 5000 });
  520 |       const driverInput = driver.locator('#chat-input');
  521 |       if (await driverInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  522 |         await driverInput.fill(`Driver test message ${Date.now()}`);
  523 |         await driver.locator('button', { hasText: 'Send' }).click();
  524 |         await page.waitForTimeout(1500);
  525 |         const lastMsg = driver.locator('.chat-msg').last();
  526 |         await expect(lastMsg).toContainText('Driver test message', { timeout: 5000 });
  527 |       }
  528 |     }
  529 | 
  530 |     // Sign out from driver account
  531 |     await driver.locator('[data-tab="dashboard"]').click();
  532 |     await waitForSpinner();
  533 |     const signOutBtns = driver.locator('button', { hasText: 'Sign Out' });
  534 |     const count = await signOutBtns.count();
  535 |     if (count > 0) {
  536 |       await signOutBtns.first().click();
  537 |       await expect(page.locator('#screen-login')).toBeVisible({ timeout: 5000 });
  538 |     }
  539 |   });
  540 | 
  541 |   // ─── TEST 11: LANDING PAGE REVISIT ────────────────────
  542 | 
  543 |   test('Test 11: Landing page is accessible after sign out', async () => {
```