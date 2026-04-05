const puppeteer = require('puppeteer');
const path = require('path');

async function scrapeArticle(url) {
  let browser;
  try {
    const userDataDir = path.join('/tmp', '.puppeteer_data');

    browser = await puppeteer.launch({
      headless: 'new',
      userDataDir: userDataDir,
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

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
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn('Browser close warning:', closeErr.message);
      }
    }
  }
}

module.exports = async function (context, req) {
  context.log('Article Scraper function triggered');

  const url = req.body && req.body.url;
  
  if (!url) {
    context.res = {
      status: 400,
      body: { error: 'URL is required in request body' }
    };
    return;
  }

  try {
    const result = await scrapeArticle(url);
    
    context.res = {
      status: 200,
      body: {
        success: true,
        data: result
      }
    };
  } catch (error) {
    context.log.error('Scraping error:', error);
    context.res = {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
};