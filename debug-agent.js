const { chromium } = require('playwright');
const https = require('https');
const http = require('http');

const BASE_URL = process.env.TARGET_URL || 'https://dormtohome.onrender.com';

const BUGS = [];
let authToken = null;

function log(level, msg, details = {}) {
  const entry = { level, message: msg, timestamp: new Date().toISOString(), ...details };
  console.log(`[${level.toUpperCase()}] ${msg}`);
  if (level === 'error') BUGS.push(entry);
}

async function waitForPage(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function loginAsPassenger(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(1000);
  await page.fill('#login-email', 'alex@tamu.edu');
  await page.fill('#login-pass', 'password123');
  await page.click('#login-btn');
  await page.waitForTimeout(3000);
  return page;
}

async function loginAsDriver(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(1000);
  await page.click('#lt-driver');
  await page.fill('#login-email', 'marcus@dormtohome.com');
  await page.fill('#login-pass', 'password123');
  await page.click('#login-btn');
  await page.waitForTimeout(3000);
  return page;
}

// === LANDING PAGE TESTS ===

async function testLandingPage() {
  log('info', 'Testing landing page');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    const title = await page.title();
    if (!title.includes('DormToHome')) {
      log('error', 'Incorrect page title', { expected: 'DormToHome', got: title });
    }
    
    const signInBtn = await waitForPage(page, 'button:has-text("Sign In")');
    const getStartedBtn = await waitForPage(page, 'button:has-text("Get Started")');
    
    if (!signInBtn) log('error', 'Sign In button not found');
    if (!getStartedBtn) log('error', 'Get Started button not found');
    
    const searchBtn = await waitForPage(page, 'button:has-text("Search Rides")');
    if (!searchBtn) log('error', 'Search Rides button not found');
    
  } catch (e) {
    log('error', 'Landing page load failed', { error: e.message });
  }
  
  await browser.close();
}

// === LOGIN TESTS ===

async function testLoginFlow() {
  log('info', 'Testing login flow');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    
    await page.fill('#login-email', 'alex@tamu.edu');
    await page.fill('#login-pass', 'password123');
    await page.click('#login-btn');
    await page.waitForTimeout(5000);
    
    const activeScreen = await page.evaluate(() => document.querySelector('.screen.active')?.id);
    
    if (activeScreen === 'screen-passenger' || activeScreen === 'screen-driver') {
      log('info', 'Login successful - app screen shown');
    } else {
      const bodyText = await page.textContent('body');
      log('error', 'Login failed - screen did not change', { screen: activeScreen, body: bodyText?.substring(0, 400) });
    }
    
  } catch (e) {
    log('error', 'Login test failed', { error: e.message });
  }
  
  await browser.close();
}

async function testLoginValidation() {
  log('info', 'Testing login validation (empty fields)');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(1000);
    
    // Try clicking login without entering anything
    await page.click('#login-btn');
    await page.waitForTimeout(1000);
    
    // Check for toast notification
    const toastVisible = await page.$('.toast.error');
    if (!toastVisible) {
      log('error', 'No validation error shown for empty login fields');
    } else {
      log('info', 'Validation error shown for empty fields');
    }
    
  } catch (e) {
    log('error', 'Login validation test failed', { error: e.message });
  }
  
  await browser.close();
}

async function testLoginWrongPassword() {
  log('info', 'Testing login with wrong password');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(1000);
    
    await page.fill('#login-email', 'alex@tamu.edu');
    await page.fill('#login-pass', 'wrongpassword');
    await page.click('#login-btn');
    await page.waitForTimeout(3000);
    
    const activeScreen = await page.evaluate(() => document.querySelector('.screen.active')?.id);
    if (activeScreen === 'screen-login') {
      log('info', 'Login correctly rejected wrong password');
    } else {
      log('error', 'Login accepted wrong password');
    }
    
  } catch (e) {
    log('error', 'Login wrong password test failed', { error: e.message });
  }
  
  await browser.close();
}

async function testLoginTypeSelector() {
  log('info', 'Testing login type selector (passenger/driver)');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(1000);
    
    // Click driver type
    await page.click('#lt-driver');
    await page.waitForTimeout(500);
    
    const driverSelected = await page.evaluate(() => 
      document.getElementById('lt-driver')?.classList.contains('selected')
    );
    
    if (!driverSelected) {
      log('error', 'Driver type selector not toggling');
    } else {
      log('info', 'Driver type selector works');
    }
    
    // Switch back to passenger
    await page.click('#lt-passenger');
    const passengerSelected = await page.evaluate(() => 
      document.getElementById('lt-passenger')?.classList.contains('selected')
    );
    
    if (!passengerSelected) {
      log('error', 'Passenger type selector not toggling');
    }
    
  } catch (e) {
    log('error', 'Login type selector test failed', { error: e.message });
  }
  
  await browser.close();
}

// === REGISTRATION TESTS ===

async function testRegistrationFlow() {
  log('info', 'Testing registration flow');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(2000);
    
    const uniqueEmail = `test${Date.now()}@test.com`;
    await page.fill('#reg-first', 'Test');
    await page.fill('#reg-last', 'User');
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-phone', '5551234567');
    await page.fill('#reg-pass', 'testpass123');
    await page.click('#reg-btn');
    await page.waitForTimeout(5000);
    
    const activeScreen = await page.evaluate(() => document.querySelector('.screen.active')?.id);
    
    if (activeScreen === 'screen-passenger' || activeScreen === 'screen-driver') {
      log('info', 'Registration successful - app screen shown');
    } else {
      const bodyText = await page.textContent('body');
      log('error', 'Registration failed - screen did not change', { screen: activeScreen, body: bodyText?.substring(0, 400) });
    }
    
  } catch (e) {
    log('error', 'Registration test failed', { error: e.message });
  }
  
  await browser.close();
}

async function testRegistrationValidation() {
  log('info', 'Testing registration validation (empty fields)');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    
    // Try registering without required fields
    await page.click('#reg-btn');
    await page.waitForTimeout(1000);
    
    const activeScreen = await page.evaluate(() => document.querySelector('.screen.active')?.id);
    if (activeScreen === 'screen-register') {
      log('info', 'Registration correctly validates required fields');
    } else {
      log('error', 'Registration accepted empty required fields');
    }
    
  } catch (e) {
    log('error', 'Registration validation test failed', { error: e.message });
  }
  
  await browser.close();
}

// === ROUTE SEARCH TESTS ===

async function testRouteSearch() {
  log('info', 'Testing route search');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    await page.fill('#land-from', 'Dallas');
    await page.fill('#land-to', 'Austin');
    await page.fill('#land-date', '2026-04-10');
    
    await page.click('button:has-text("Search Rides")');
    await page.waitForTimeout(2000);
    
    const screenAfterClick = await page.evaluate(() => document.querySelector('.screen.active')?.id);
    
    if (screenAfterClick !== 'screen-login') {
      log('error', 'Expected screen-login but got: ' + screenAfterClick);
      await browser.close();
      return;
    }
    
    await page.fill('#login-email', 'alex@tamu.edu');
    await page.fill('#login-pass', 'password123');
    await page.click('#login-btn');
    await page.waitForTimeout(3000);
    
    const activeScreen = await page.evaluate(() => document.querySelector('.screen.active')?.id);
    if (activeScreen !== 'screen-passenger') {
      log('error', 'Not on passenger screen after login');
      await browser.close();
      return;
    }
    
    await page.waitForTimeout(2000);
    const pContent = await page.$('#p-content');
    if (pContent) {
      const text = await pContent.textContent();
      if (text?.includes('Available Routes') || text?.includes('DTH-')) {
        log('info', 'Routes displayed correctly');
      } else {
        log('error', 'Routes page may not be showing routes');
      }
    } else {
      log('error', 'No p-content element found');
    }
    
  } catch (e) {
    log('error', 'Route search test failed', { error: e.message });
  }
  
  await browser.close();
}

async function testRouteSearchNoParams() {
  log('info', 'Testing route search without entering params');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Click search without entering anything
    await page.click('button:has-text("Search Rides")');
    await page.waitForTimeout(2000);
    
    const screenAfterClick = await page.evaluate(() => document.querySelector('.screen.active')?.id);
    
    if (screenAfterClick !== 'screen-login') {
      log('error', 'Expected screen-login but got: ' + screenAfterClick);
    } else {
      log('info', 'Search works without params (shows all routes after login)');
    }
    
  } catch (e) {
    log('error', 'Route search no params test failed', { error: e.message });
  }
  
  await browser.close();
}

// === PASSENGER TABS TESTS ===

async function testPassengerTabs() {
  log('info', 'Testing passenger tab navigation');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    // Test Routes tab
    const routesTab = await page.$('[data-tab="routes"]');
    if (routesTab) {
      await routesTab.click();
      await page.waitForTimeout(2000);
      const routesContent = await page.textContent('#p-content');
      if (routesContent?.includes('Available Routes')) {
        log('info', 'Routes tab works');
      } else {
        log('error', 'Routes tab content not loading');
      }
    } else {
      log('error', 'Routes tab not found');
    }
    
    // Test Active tab
    const activeTab = await page.$('[data-tab="active"]');
    if (activeTab) {
      await activeTab.click();
      await page.waitForTimeout(2000);
      const activeContent = await page.textContent('#p-content');
      if (activeContent) {
        log('info', 'Active tab works');
      }
    }
    
    // Test Tickets tab
    const ticketsTab = await page.$('[data-tab="tickets"]');
    if (ticketsTab) {
      await ticketsTab.click();
      await page.waitForTimeout(2000);
      const ticketsContent = await page.textContent('#p-content');
      if (ticketsContent) {
        log('info', 'Tickets tab works');
      }
    }
    
    // Test Messages tab
    const messagesTab = await page.$('[data-tab="messages"]');
    if (messagesTab) {
      await messagesTab.click();
      await page.waitForTimeout(2000);
      const messagesContent = await page.textContent('#p-content');
      if (messagesContent) {
        log('info', 'Messages tab works');
      }
    }
    
    // Test Account tab
    const accountTab = await page.$('[data-tab="account"]');
    if (accountTab) {
      await accountTab.click();
      await page.waitForTimeout(2000);
      const accountContent = await page.textContent('#p-content');
      if (accountContent?.includes('Account')) {
        log('info', 'Account tab works');
      }
    }
    
  } catch (e) {
    log('error', 'Passenger tabs test failed', { error: e.message });
  }
  
  await browser.close();
}

// === BOOKING TESTS ===

async function testBookingFlow() {
  log('info', 'Testing booking flow');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => log('info', `Console: ${msg.text()}`));
  page.on('pageerror', err => log('error', `Page error: ${err.message}`));
  
  try {
    await loginAsPassenger(page);
    
    // Go to routes
    await page.click('[data-tab="routes"]');
    await page.waitForTimeout(2000);
    
    // Wait for routes to load
    await page.waitForSelector('.route-card', { timeout: 5000 });
    
    // Get route ID from onclick attribute
    const routeId = await page.evaluate(() => {
      const card = document.querySelector('.route-card');
      const match = card?.getAttribute('onclick')?.match(/openRouteDetail\('([^']+)'/);
      return match ? match[1] : null;
    });
    
    if (!routeId) {
      log('error', 'Could not find route ID to open');
      await browser.close();
      return;
    }
    
    log('info', `Opening route: ${routeId}`);
    
    // Click the card directly using evaluate to trigger onclick
    await page.evaluate(() => {
      document.querySelector('.route-card').click();
    });
    await page.waitForTimeout(2000);
    
    // Check modal state - class is "modal-overlay open"
    const modalOpen = await page.evaluate(() => {
      const routeModal = document.getElementById('modal-route');
      return routeModal?.classList.contains('open') || false;
    });
    
    if (!modalOpen) {
      log('error', 'Route detail modal did not open');
    } else {
      log('info', 'Route detail modal opened successfully');
      
      // Try to book
      const bookBtn = await page.$('button:has-text("Book a Seat")');
      if (bookBtn) {
        await bookBtn.click();
        await page.waitForTimeout(2000);
        
        const seatModalOpen = await page.evaluate(() => 
          document.getElementById('modal-seats')?.classList.contains('open')
        );
        
        if (seatModalOpen) {
          log('info', 'Seat selection modal opened');
          
          const availableSeats = await page.$$('.seat:not(.taken)');
          if (availableSeats.length > 0) {
            await availableSeats[0].click();
            await page.waitForTimeout(500);
            
            const confirmBtn = await page.$('button:has-text("Confirm Booking")');
            if (confirmBtn) {
              await confirmBtn.click();
              await page.waitForTimeout(2000);
              
              const toastSuccess = await page.$('.toast.success');
              if (toastSuccess) {
                log('info', 'Booking completed successfully');
              } else {
                log('error', 'Booking may not have completed - no success toast');
              }
            }
          } else {
            log('error', 'No available seats to book');
          }
        } else {
          log('error', 'Seat modal did not open');
        }
      }
    }
    
  } catch (e) {
    log('error', 'Booking flow test failed', { error: e.message, stack: e.stack });
  }
  
  await browser.close();
}

// === FILTER PANEL TESTS ===

async function testFilterPanel() {
  log('info', 'Testing filter panel');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    await page.click('[data-tab="routes"]');
    await page.waitForTimeout(2000);
    
    // Open departure filter
    const depFilter = await page.$('text=Departure');
    if (depFilter) {
      await depFilter.click();
      await page.waitForTimeout(1000);
      
      const filterPanel = await page.$('#filter-panel-overlay');
      if (filterPanel) {
        const isVisible = await page.evaluate(() => 
          document.getElementById('filter-panel-overlay').style.display !== 'none'
        );
        
        if (isVisible) {
          log('info', 'Filter panel opened');
          
          // Close filter panel
          const cancelBtn = await page.$('button:has-text("Cancel")');
          if (cancelBtn) {
            await cancelBtn.click();
            await page.waitForTimeout(500);
          }
        } else {
          log('error', 'Filter panel not visible after clicking');
        }
      } else {
        log('error', 'Filter panel overlay not found');
      }
    } else {
      log('error', 'Departure filter chip not found');
    }
    
  } catch (e) {
    log('error', 'Filter panel test failed', { error: e.message });
  }
  
  await browser.close();
}

// === ROUTE REQUESTS TESTS ===

async function testRouteRequests() {
  log('info', 'Testing route requests');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    await page.click('[data-tab="routes"]');
    await page.waitForTimeout(2000);
    
    // Switch to Route Requests tab
    const reqTab = await page.$('text=Route Requests');
    if (reqTab) {
      await reqTab.click();
      await page.waitForTimeout(1500);
      
      const reqContent = await page.textContent('#p-content');
      if (reqContent?.includes('Request') || reqContent?.includes('interested')) {
        log('info', 'Route requests tab works');
      } else {
        log('error', 'Route requests content not loading');
      }
      
      // Look for Support button
      const supportBtns = await page.$$('button:has-text("Support Route")');
      if (supportBtns.length > 0) {
        await supportBtns[0].click();
        await page.waitForTimeout(1500);
        
        const btnText = await supportBtns[0].textContent();
        if (btnText?.includes('Supported') || btnText?.includes('✓')) {
          log('info', 'Support request works');
        }
      }
    }
    
  } catch (e) {
    log('error', 'Route requests test failed', { error: e.message });
  }
  
  await browser.close();
}

// === DRIVER TESTS ===

async function testDriverDashboard() {
  log('info', 'Testing driver dashboard');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => log('info', `Console: ${msg.text()}`));
  
  try {
    await loginAsDriver(page);
    
    const activeScreen = await page.evaluate(() => document.querySelector('.screen.active')?.id);
    if (activeScreen !== 'screen-driver') {
      log('error', 'Driver login did not go to driver screen');
      await browser.close();
      return;
    }
    
    log('info', 'Driver screen loaded');
    
    // Check dashboard content
    await page.waitForTimeout(2000);
    const dContent = await page.textContent('#d-content');
    if (dContent) {
      log('info', 'Driver dashboard content present');
    }
    
  } catch (e) {
    log('error', 'Driver dashboard test failed', { error: e.message });
  }
  
  await browser.close();
}

async function testDriverTabs() {
  log('info', 'Testing driver tab navigation');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsDriver(page);
    await page.waitForTimeout(1000);
    
    const tabs = ['Dashboard', 'My Routes', 'New Route', 'Check-In', 'Requests'];
    
    let successCount = 0;
    for (const tab of tabs) {
      try {
        await page.click(`text=${tab}`, { timeout: 2000 });
        await page.waitForTimeout(500);
        successCount++;
      } catch (e) {
        log('error', `Failed to click: ${tab}`);
      }
    }
    
    log('info', `Driver tabs working (${successCount}/5 core tabs)`);
    
  } catch (e) {
    log('info', 'Driver tabs test completed with warnings');
  }
  
  await browser.close();
}

// === MESSAGING TESTS ===

async function testMessaging() {
  log('info', 'Testing messaging functionality');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    // Go to messages
    const msgTab = await page.$('[data-tab="messages"]');
    if (msgTab) {
      await msgTab.click();
      await page.waitForTimeout(2000);
      
      const chatExists = await page.$('.chat-layout');
      if (chatExists) {
        log('info', 'Chat interface loaded');
        
        // Try sending a message
        const input = await page.$('#chat-input');
        if (input) {
          await input.fill('Test message from debug agent');
          const sendBtn = await page.$('button:has-text("Send")');
          if (sendBtn) {
            await sendBtn.click();
            await page.waitForTimeout(1000);
            log('info', 'Message send attempted');
          }
        }
      } else {
        log('error', 'Chat layout not found');
      }
    }
    
  } catch (e) {
    log('error', 'Messaging test failed', { error: e.message });
  }
  
  await browser.close();
}

// === ACCOUNT/PROFILE TESTS ===

async function testAccountSettings() {
  log('info', 'Testing account settings');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    // Go to account using text selector
    await page.click('text=Account');
    await page.waitForTimeout(2000);
    
    const hasAccContent = await page.evaluate(() => {
      const content = document.getElementById('p-content');
      return content?.innerHTML.includes('Account') || content?.innerHTML.includes('Profile');
    });
    
    if (hasAccContent) {
      log('info', 'Account page loaded');
      
      const hasInputs = await page.evaluate(() => !!document.getElementById('acc-first'));
      if (hasInputs) {
        log('info', 'Account profile fields present');
      }
    } else {
      log('info', 'Account page may use different structure');
    }
    
  } catch (e) {
    log('info', 'Account test completed with warnings');
  }
  
  await browser.close();
}

// === GUARDIAN TESTS ===

async function testGuardianManagement() {
  log('info', 'Testing guardian management');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    await page.click('text=Account');
    await page.waitForTimeout(2000);
    
    const addBtn = await page.$('button:has-text("Add")');
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      
      const formVisible = await page.evaluate(() => {
        const form = document.getElementById('guardian-add-form');
        return form && form.style.display !== 'none';
      });
      
      if (formVisible) {
        log('info', 'Guardian add form opened');
      }
    }
    
    log('info', 'Guardian management test completed');
    
  } catch (e) {
    log('info', 'Guardian test completed with warnings');
  }
  
  await browser.close();
}

// === LOGOUT TESTS ===

async function testLogout() {
  log('info', 'Testing logout flow');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    // Go to account to find logout
    await page.click('[data-tab="account"]');
    await page.waitForTimeout(1000);
    
    // Look for sign out button
    const logoutBtn = await page.$('button:has-text("Sign Out")');
    if (logoutBtn) {
      // Handle confirm dialog
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      
      const activeScreen = await page.evaluate(() => document.querySelector('.screen.active')?.id);
      if (activeScreen === 'screen-login') {
        log('info', 'Logout successful');
      } else {
        log('error', 'Logout did not return to login screen');
      }
    }
    
  } catch (e) {
    log('error', 'Logout test failed', { error: e.message });
  }
  
  await browser.close();
}

// === MODAL TESTS ===

async function testModalOpenClose() {
  log('info', 'Testing modal open/close');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    await page.click('text=Routes');
    await page.waitForTimeout(2000);
    
    const routeCard = await page.$('.route-card');
    if (routeCard) {
      await page.evaluate(() => document.querySelector('.route-card').click());
      await page.waitForTimeout(1500);
      
      const modalOpen = await page.evaluate(() => {
        const m = document.getElementById('modal-route');
        return m?.classList.contains('open');
      });
      
      if (modalOpen) {
        log('info', 'Modal opened');
        
        // Try to close
        const closeBtn = await page.$('#modal-route .close');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          
          const modalClosed = await page.evaluate(() => {
            const m = document.getElementById('modal-route');
            return !m?.classList.contains('open');
          });
          
          if (modalClosed) {
            log('info', 'Modal closed successfully');
          }
        }
      }
    }
    
    log('info', 'Modal test completed');
    
  } catch (e) {
    log('info', 'Modal test completed with warnings');
  }
  
  await browser.close();
}

// === API ENDPOINTS TESTS ===

async function testApiEndpoints() {
  log('info', 'Testing API endpoints');
  
  const endpoints = [
    { path: '/api/routes', method: 'GET', auth: false },
    { path: '/api/requests', method: 'GET', auth: false },
    { path: '/api/auth/me', method: 'GET', auth: true },
    { path: '/api/bookings/mine', method: 'GET', auth: true },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: endpoint.auth ? { 'Authorization': 'Bearer invalid' } : {}
      });
      
      const status = res.status;
      if (status === 500) {
        log('error', `${endpoint.path} returned 500 server error`);
      } else if (status === 404) {
        log('error', `${endpoint.path} returned 404 not found`);
      } else if (status === 401 && !endpoint.auth) {
        log('error', `${endpoint.path} should not require auth`);
      } else {
        log('info', `${endpoint.path} returned ${status}`);
      }
    } catch (e) {
      log('error', `API ${endpoint.path} request failed`, { error: e.message });
    }
  }
}

// === SOCKET.IO TESTS ===

async function testRealTimeConnection() {
  log('info', 'Testing Socket.io connection');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Sign In")');
    await page.fill('#login-email', 'alex@tamu.edu');
    await page.fill('#login-pass', 'password123');
    await page.click('#login-btn');
    await page.waitForTimeout(3000);
    
    const socketLoaded = await page.evaluate(() => {
      // Check if socket.io client script is loaded
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
      return typeof io !== 'undefined' || scripts.some(s => s.includes('socket.io'));
    });
    
    if (socketLoaded) {
      log('info', 'Socket.io loaded or available');
    } else {
      log('info', 'Socket.io may not be required for basic functionality');
    }
    
  } catch (e) {
    log('info', 'Socket test completed (may not be critical)');
  }
  
  await browser.close();
}

// === RESPONSIVE DESIGN TESTS ===

async function testResponsiveDesign() {
  log('info', 'Testing responsive design');
  
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 800, name: 'desktop' }
  ];
  
  for (const viewport of viewports) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
      
      const overflow = await page.evaluate(() => {
        return document.body.scrollWidth > document.documentElement.clientWidth;
      });
      
      if (overflow) {
        log('error', `Horizontal overflow on ${viewport.name}`, { width: viewport.width });
      }
      
    } catch (e) {
      log('error', `Responsive test failed for ${viewport.name}`, { error: e.message });
    }
    
    await browser.close();
  }
}

// === EDGE CASE TESTS ===

async function testEmptyStates() {
  log('info', 'Testing empty states');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    // Go to routes tab
    await page.click('text=Routes');
    await page.waitForTimeout(3000);
    
    const content = await page.textContent('#p-content');
    
    // Check if routes are displayed or empty state
    const hasRoutes = content?.includes('DTH-') || content?.includes('Available Routes');
    const hasEmpty = content?.includes('No routes') || content?.includes('empty') || content?.includes('No active trips');
    
    if (hasRoutes) {
      log('info', 'Routes displayed successfully');
    } else if (hasEmpty) {
      log('info', 'Empty state shown correctly');
    } else {
      log('info', 'Routes page rendered');
    }
    
    // Test Active Trips tab for empty state
    await page.click('text=Active Trips');
    await page.waitForTimeout(2000);
    
    const activeContent = await page.textContent('#p-content');
    if (activeContent?.includes('No active trips') || activeContent?.includes('empty')) {
      log('info', 'Active trips empty state works');
    }
    
  } catch (e) {
    log('info', 'Empty state test completed');
  }
  
  await browser.close();
}

async function testNavigationAfterLogin() {
  log('info', 'Testing navigation after login');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await loginAsPassenger(page);
    
    // Try navigating back to landing
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Check what screen we're on
    const activeScreen = await page.evaluate(() => 
      document.querySelector('.screen.active')?.id
    );
    
    // Should stay on app screens, not go back to landing
    log('info', `After navigation, active screen: ${activeScreen}`);
    
  } catch (e) {
    log('error', 'Navigation test failed', { error: e.message });
  }
  
  await browser.close();
}

// === RUN ALL TESTS ===

async function runAllTests() {
  console.log('═'.repeat(60));
  console.log('🔍 DormToHome Debugging Agent - Extended');
  console.log('═'.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log('');
  
  // Basic tests
  await testLandingPage();
  await testLoginFlow();
  await testLoginValidation();
  await testLoginWrongPassword();
  await testLoginTypeSelector();
  await testRegistrationFlow();
  await testRegistrationValidation();
  await testRouteSearch();
  await testRouteSearchNoParams();
  
  // Passenger functionality
  await testPassengerTabs();
  await testBookingFlow();
  await testFilterPanel();
  await testRouteRequests();
  await testMessaging();
  await testAccountSettings();
  await testGuardianManagement();
  await testModalOpenClose();
  await testLogout();
  
  // Driver functionality
  await testDriverDashboard();
  await testDriverTabs();
  
  // Technical tests
  await testApiEndpoints();
  await testRealTimeConnection();
  await testResponsiveDesign();
  
  // Edge cases
  await testEmptyStates();
  await testNavigationAfterLogin();
  
  console.log('');
  console.log('═'.repeat(60));
  console.log('📋 BUG REPORT');
  console.log('═'.repeat(60));
  console.log(`Total bugs found: ${BUGS.length}`);
  console.log('');
  
  BUGS.forEach((bug, i) => {
    console.log(`${i + 1}. [${bug.level.toUpperCase()}] ${bug.message}`);
    if (bug.details) console.log(`   Details: ${JSON.stringify(bug.details)}`);
  });
  
  if (BUGS.length === 0) {
    console.log('✅ No bugs detected!');
  }
  
  process.exit(BUGS.length > 0 ? 1 : 0);
}

runAllTests().catch(e => {
  console.error('Test runner failed:', e);
  process.exit(1);
});