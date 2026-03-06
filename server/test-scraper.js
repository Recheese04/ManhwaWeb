import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function testPlaywrightScraper() {
    console.log("Launching Chromium via Playwright...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    try {
        const page = await context.newPage();

        console.log("Navigating to Manganato search...");
        await page.goto('https://manganato.com/search/story/solo_leveling', { waitUntil: 'domcontentloaded' });

        const html = await page.content();
        fs.writeFileSync('manganato-playwright.html', html);
        console.log("Dumped HTML to manganato-playwright.html");

    } catch (e) {
        console.error("Scraping error:", e);
    } finally {
        await browser.close();
    }
}

testPlaywrightScraper();
