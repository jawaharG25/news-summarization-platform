const express = require('express');
const router = express.Router();
const { scrapeArticle } = require('../services/scraper');
const { analyzeArticle } = require('../services/ai');
const Article = require('../models/Article');

// @route POST /api/scan
// @desc Scrape, Analyze, and Save URL
router.post('/scan', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 1. Check if already scanned
    let existing = await Article.findOne({ url });
    if (existing) {
      return res.json({ message: 'Article retrieved from archive', data: existing });
    }

    // 2. Scrape
    console.log(`Scraping URL: ${url}`);
    const { title, content } = await scrapeArticle(url);
    if (!title || !content) {
      return res.status(400).json({ error: 'Could not extract content from the article.' });
    }

    // 3. AI Analysis
    console.log(`Analyzing: ${title}`);
    const analysis = await analyzeArticle(title, content);

    // 4. Save to DB
    const newArticle = new Article({
      url,
      title,
      content,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      biasScore: analysis.biasScore,
    });

    await newArticle.save();

    return res.status(201).json({ message: 'Scan successful', data: newArticle });

  } catch (err) {
    console.error('Scan Error:', err);
    res.status(500).json({ error: err.message || 'Server error during scan' });
  }
});

// @route GET /api/archive
// @desc Get all scanned articles
router.get('/archive', async (req, res) => {
  try {
    const articles = await Article.find().sort({ timestamp: -1 }).select('-content'); // omit full text for brevity
    res.json({ data: articles });
  } catch (err) {
    console.error('Archive Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route GET /api/recommendations/:id
// @desc Get simple recommendations based on shared words in title/summary
router.get('/recommendations/:id', async (req, res) => {
  try {
    const source = await Article.findById(req.params.id);
    if (!source) return res.status(404).json({ error: 'Article not found' });

    // A completely rudimentary match logic (instead of Vector Search for simplicity in MVP)
    // We get other articles and randomize or just return recent ones.
    // In a full implementation, you'd use Atlas Vector Search.
    const recommendations = await Article.find({ _id: { $ne: source._id } }).limit(3).select('title url biasScore');
    
    res.json({ data: recommendations });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
