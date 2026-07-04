# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.test.js >> DormToHome E2E Tests >> Test 10: Driver login and all driver features
- Location: tests/e2e.test.js:448:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#screen-driver').getByText('My Routes')
Expected: visible
Error: strict mode violation: locator('#screen-driver').getByText('My Routes') resolved to 2 elements:
    1) <div data-tab="routes" class="nav-item active" onclick="dTab('routes')">My Routes</div> aka getByRole('navigation').getByText('My Routes')
    2) <div class="page-title">My Routes</div> aka locator('#d-content').getByText('My Routes')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#screen-driver').getByText('My Routes')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic:
    - generic [ref=e2]:
      - generic [ref=e3]: ℹ
      - generic [ref=e4]: Signed out
    - generic [ref=e5]:
      - generic [ref=e6]: ✓
      - generic [ref=e7]: Welcome back, Marcus!
  - generic [ref=e9]:
    - banner [ref=e10]:
      - generic [ref=e11] [cursor=pointer]:
        - img [ref=e13]
        - generic [ref=e16]: DormToHome
      - navigation [ref=e17]:
        - generic [ref=e18] [cursor=pointer]: Dashboard
        - generic [ref=e19] [cursor=pointer]: My Routes
        - generic [ref=e20] [cursor=pointer]: New Route
        - generic [ref=e21] [cursor=pointer]: Check-In
        - generic [ref=e22] [cursor=pointer]: Live
        - generic [ref=e23] [cursor=pointer]: Requests
        - generic [ref=e24] [cursor=pointer]: Messages
      - generic [ref=e26]:
        - generic [ref=e27]: Live
        - button [ref=e29] [cursor=pointer]:
          - img [ref=e30]
        - generic [ref=e34] [cursor=pointer]: MD
    - generic [ref=e35]:
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]: My Routes
          - generic [ref=e39]: All your posted routes
        - button "+ New Route" [ref=e40] [cursor=pointer]
      - generic [ref=e41]:
        - generic [ref=e42] [cursor=pointer]: Active
        - generic [ref=e43] [cursor=pointer]: Completed
        - generic [ref=e44] [cursor=pointer]: Draft
      - generic [ref=e45]:
        - generic [ref=e46] [cursor=pointer]:
          - generic [ref=e47]:
            - generic [ref=e48]:
              - generic [ref=e49]: College Station
              - generic [ref=e50]: →
              - generic [ref=e51]: Austin
              - generic [ref=e52]: DTH-210
            - generic [ref=e53]:
              - generic [ref=e54]:
                - img [ref=e55]
                - text: October 20, 2026
              - generic [ref=e57]:
                - img [ref=e58]
                - text: 08:00 AM
              - generic [ref=e61]:
                - img [ref=e62]
                - text: 0/44 booked
          - generic [ref=e68]:
            - generic [ref=e69]: $0
            - generic [ref=e70]: est. revenue
            - generic [ref=e71]:
              - button "Check-In" [ref=e72]
              - button "Notify" [ref=e73]
        - generic [ref=e74] [cursor=pointer]:
          - generic [ref=e75]:
            - generic [ref=e76]:
              - generic [ref=e77]: Dallas
              - generic [ref=e78]: →
              - generic [ref=e79]: College Station
              - generic [ref=e80]: DTH-208
            - generic [ref=e81]:
              - generic [ref=e82]:
                - img [ref=e83]
                - text: October 1, 2026
              - generic [ref=e85]:
                - img [ref=e86]
                - text: 01:00 PM
              - generic [ref=e89]:
                - img [ref=e90]
                - text: 0/44 booked
          - generic [ref=e96]:
            - generic [ref=e97]: $0
            - generic [ref=e98]: est. revenue
            - generic [ref=e99]:
              - button "Check-In" [ref=e100]
              - button "Notify" [ref=e101]
        - generic [ref=e102] [cursor=pointer]:
          - generic [ref=e103]:
            - generic [ref=e104]:
              - generic [ref=e105]: Austin
              - generic [ref=e106]: →
              - generic [ref=e107]: Dallas
              - generic [ref=e108]: DTH-206
            - generic [ref=e109]:
              - generic [ref=e110]:
                - img [ref=e111]
                - text: September 20, 2026
              - generic [ref=e113]:
                - img [ref=e114]
                - text: 06:30 AM
              - generic [ref=e117]:
                - img [ref=e118]
                - text: 2/44 booked
          - generic [ref=e125]:
            - generic [ref=e126]: $76
            - generic [ref=e127]: est. revenue
            - generic [ref=e128]:
              - button "Check-In" [ref=e129]
              - button "Notify" [ref=e130]
        - generic [ref=e131] [cursor=pointer]:
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e134]: College Station
              - generic [ref=e135]: →
              - generic [ref=e136]: San Antonio
              - generic [ref=e137]: DTH-205
            - generic [ref=e138]:
              - generic [ref=e139]:
                - img [ref=e140]
                - text: September 15, 2026
              - generic [ref=e142]:
                - img [ref=e143]
                - text: 10:00 AM
              - generic [ref=e146]:
                - img [ref=e147]
                - text: 0/44 booked
          - generic [ref=e153]:
            - generic [ref=e154]: $0
            - generic [ref=e155]: est. revenue
            - generic [ref=e156]:
              - button "Check-In" [ref=e157]
              - button "Notify" [ref=e158]
        - generic [ref=e159] [cursor=pointer]:
          - generic [ref=e160]:
            - generic [ref=e161]:
              - generic [ref=e162]: College Station
              - generic [ref=e163]: →
              - generic [ref=e164]: Dallas
              - generic [ref=e165]: DTH-203
            - generic [ref=e166]:
              - generic [ref=e167]:
                - img [ref=e168]
                - text: September 5, 2026
              - generic [ref=e170]:
                - img [ref=e171]
                - text: 07:00 AM
              - generic [ref=e174]:
                - img [ref=e175]
                - text: 1/44 booked
          - generic [ref=e182]:
            - generic [ref=e183]: $35
            - generic [ref=e184]: est. revenue
            - generic [ref=e185]:
              - button "Check-In" [ref=e186]
              - button "Notify" [ref=e187]
        - generic [ref=e188] [cursor=pointer]:
          - generic [ref=e189]:
            - generic [ref=e190]:
              - generic [ref=e191]: College Station
              - generic [ref=e192]: →
              - generic [ref=e193]: Houston
              - generic [ref=e194]: DTH-201
            - generic [ref=e195]:
              - generic [ref=e196]:
                - img [ref=e197]
                - text: August 15, 2026
              - generic [ref=e199]:
                - img [ref=e200]
                - text: 08:00 AM
              - generic [ref=e203]:
                - img [ref=e204]
                - text: 1/44 booked
          - generic [ref=e211]:
            - generic [ref=e212]: $28
            - generic [ref=e213]: est. revenue
            - generic [ref=e214]:
              - button "Check-In" [ref=e215]
              - button "Notify" [ref=e216]
```

# Test source

```ts
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
  443 |     await expect(page.locator('#screen-landing')).toBeVisible({ timeout: 5000 });
  444 |   });
  445 | 
  446 |   // ─── TEST 10: DRIVER LOGIN AND DASHBOARD ──────────────
  447 | 
  448 |   test('Test 10: Driver login and all driver features', async () => {
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
> 471 |     await expect(driver.getByText('My Routes')).toBeVisible({ timeout: 5000 });
      |                                                 ^ Error: expect(locator).toBeVisible() failed
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
  549 |     await page.locator('#screen-login .auth-link a', { hasText: 'Home' }).click();
  550 |     await expect(page.locator('#screen-landing')).toBeVisible({ timeout: 5000 });
  551 |     await expect(page.locator('#screen-landing .hero-title')).toBeVisible({ timeout: 3000 });
  552 |   });
  553 | });
  554 | 
```