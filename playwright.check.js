import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/settings_page.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved');
})();
