const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// @route GET /api/analytics
// @desc Get aggregation of bias and sentiment for charts
router.get('/', async (req, res) => {
  try {
    // 1. Bias Distribution Aggregation
    const biasDistribution = await Article.aggregate([
      {
        $project: {
          biasCategory: {
            $switch: {
              branches: [
                { case: { $lt: ["$biasScore", 40] }, then: "Left" },
                { case: { $gt: ["$biasScore", 60] }, then: "Right" }
              ],
              default: "Center"
            }
          }
        }
      },
      {
        $group: {
          _id: "$biasCategory",
          count: { $sum: 1 }
        }
      }
    ]);

    // Transform Bias Aggregation into formatting suitable for recharts PieChart
    let biasData = [
      { name: 'Left', value: 0, fill: '#ef4444' }, // Red for left (typically, or blue, we use distinct colors)
      { name: 'Center', value: 0, fill: '#a855f7' }, // Purple
      { name: 'Right', value: 0, fill: '#3b82f6' }  // Blue
    ];

    biasDistribution.forEach(b => {
      const index = biasData.findIndex(item => item.name === b._id);
      if (index !== -1) {
        biasData[index].value = b.count;
      }
    });

    // 2. Sentiment Trends (Last 10 articles)
    // For AreaChart: we need chronological or sequential data
    const sentimentTrends = await Article.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('title sentiment timestamp');
    
    // Reverse to get chronological order from left to right on the chart
    const sentimentData = sentimentTrends.reverse().map((article, idx) => ({
      name: `A${idx + 1}`, // Short label
      title: article.title,
      sentiment: article.sentiment // Y axis value 0-100
    }));

    res.json({ data: { biasData, sentimentData } });
  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

module.exports = router;
