const puppeteer = require('puppeteer');

async function scrapeArticle(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new', // use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    // Default timeouts are 30s, we might want to reduce it or handle it
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Extract content. This is a very basic heuristic.
    // In production, we'd use better heuristics or readability libraries like @mozilla/readability
    const articleData = await page.evaluate(() => {
      // Get title
      const title = document.querySelector('h1')?.innerText || document.title;
      
      // Get body text. We look for <article> tags or lots of <p> tags.
      let content = '';
      const articleNode = document.querySelector('article');
      
      if (articleNode) {
        const paragraphs = articleNode.querySelectorAll('p');
        paragraphs.forEach(p => content += p.innerText + '\n\n');
      } else {
        // Fallback: grab all paragraphs inside main or body
        const container = document.querySelector('main') || document.body;
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach(p => {
          // simple filter for substantive paragraphs
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
      await browser.close();
    }
  }
}

module.exports = { scrapeArticle };
