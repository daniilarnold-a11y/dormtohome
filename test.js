const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  // Clear cache
  await context.clearCookies();
  await context.clearPermissions();
  
  console.log('Fresh context test...');
  await page.goto('https://dormtohome.onrender.com', { waitUntil: 'networkidle' });
  
  const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
  console.log('Body:', bodyLen);
  
  await page.screenshot({ path: 'fresh.png', fullPage: true });
  
  await browser.close();
})();