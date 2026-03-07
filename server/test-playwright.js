const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('response', resp => {
        if (!resp.ok() && resp.url().includes('api')) {
            console.log('BAD RESPONSE:', resp.status(), resp.url());
        }
    });

    await page.goto('https://recyglen.vercel.app', { waitUntil: 'networkidle' });

    await page.screenshot({ path: 'vercel_preview.png', fullPage: true });
    console.log('Done!');
    await browser.close();
})();
