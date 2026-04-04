const express = require('express');
const router = express.Router();
const { scrapeArticle } = require('../services/scraper');
const { analyzeArticle, generateEmbedding } = require('../services/ai');
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
// @desc Get 5 related articles (Atlas Vector Search primary, Keyword Fallback secondary)
router.get('/recommendations/:id', async (req, res) => {
  try {
    const source = await Article.findById(req.params.id);
    if (!source) return res.status(404).json({ error: 'Article not found' });

    const summaryText = source.summary.join(' ');

    // 1. Generate Vector Embedding using Gemini
    const embedding = await generateEmbedding(summaryText);
    
    // Optional: save it back to the document if not present
    if (!source.embedding || source.embedding.length === 0) {
      source.embedding = embedding;
      await source.save();
    }

    // 2. Vector Search Pipeline
    let results = [];
    try {
      const vectorPipeline = [
        {
          $vectorSearch: {
            index: 'vector_index', 
            path: 'embedding',
            queryVector: embedding,
            numCandidates: 100,
            limit: 6 
          }
        },
        {
          $match: { _id: { $ne: source._id } }
        },
        {
          $project: { title: 1, url: 1, biasScore: 1, summary: 1, score: { $meta: 'vectorSearchScore' } }
        },
        {
          $limit: 5
        }
      ];
      
      results = await Article.aggregate(vectorPipeline);
      console.log(`Vector Search found ${results.length} related articles.`);
    } catch (vectorErr) {
      console.error("Vector Search failed (fallback active):", vectorErr.message);
      
      // 3. Fallback: Keyword-based matching
      const words = summaryText.split(/\s+/).filter(w => w.length > 5);
      const regexPattern = new RegExp(words.join('|'), 'i');

      results = await Article.find({
        _id: { $ne: source._id },
        $or: [
          { title: { $regex: regexPattern } },
          { summary: { $regex: regexPattern } }
        ]
      })
      .limit(5)
      .select('title url biasScore summary');
    }

    // Pad with recent if needed
    if (results.length < 5) {
      const more = await Article.find({
        _id: { $nin: [source._id, ...results.map(r => r._id)] }
      })
      .sort({ timestamp: -1 })
      .limit(5 - results.length)
      .select('title url biasScore summary');
      results = results.concat(more);
    }
    
    res.json({ data: results });
  } catch (err) {
    console.error('Recommendation Error:', err);
    res.status(500).json({ error: 'Server error fetching recommendations' });
  }
});

module.exports = router;
