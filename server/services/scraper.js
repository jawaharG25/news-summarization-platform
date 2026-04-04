const puppeteer = require('puppeteer');
const path = require('path');

async function scrapeArticle(url) {
  let browser;
  try {
    // Determine a local data directory to avoid Windows Temp locking issues (EBUSY)
    const userDataDir = path.join(__dirname, '../.puppeteer_data');

    browser = await puppeteer.launch({
      headless: 'new',
      userDataDir: userDataDir, // Use a persistent local directory
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-features=FirstPartySets', 
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check'
      ]
    });
    
    const page = await browser.newPage();
    // Default timeouts are 30s
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Extract content. 
    const articleData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText || document.title;
      
      let content = '';
      const articleNode = document.querySelector('article');
      
      if (articleNode) {
        const paragraphs = articleNode.querySelectorAll('p');
        paragraphs.forEach(p => content += p.innerText + '\n\n');
      } else {
        const container = document.querySelector('main') || document.body;
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach(p => {
          if (p.innerText.length > 50) {
            content += p.innerText + '\n\n';
          }
        });
      }

      return { title, content: content.trim() };
    });

    return articleData;

  } catch (err) {
    console.error('Error scraping article:', err);
    throw new Error('Failed to extract content from the provided URL.');
  } finally {
    if (browser) {
      // On Windows, EBUSY sometimes occurs even with userDataDir if close is too fast.
      // We wrap it in a small try-catch to prevent the app from crashing on cleanup failure.
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn('Browser close warning (Cleanup):', closeErr.message);
      }
    }
  }
}

module.exports = { scrapeArticle };
