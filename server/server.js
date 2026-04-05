require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createIndexIfNotExists } = require('./services/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const scanRoutes = require('./routes/scan');
const analyticsRoutes = require('./routes/analytics');
app.use('/api', scanRoutes);
app.use('/api/analytics', analyticsRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/news-prediction', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  // Initialize Azure AI Search index
  return createIndexIfNotExists();
})
.then(() => console.log('Azure AI Search initialized'))
.catch(err => console.error('Initialization error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
