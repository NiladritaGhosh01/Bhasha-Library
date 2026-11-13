const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase & Gemini
const { isFirestoreAvailable } = require('./config/firebase');
const geminiService = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Story routes
const storyRoutes = require('./routes/storyRoutes');
app.use('/api/stories', storyRoutes);

// Gemini AI routes
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bhasha-Library API is running',
    services: {
      firestore: isFirestoreAvailable() ? 'connected' : 'memory_fallback',
      geminiAI: geminiService.isConfigured() ? 'active' : 'fallback_mode'
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Bhasha-Library Backend API with Firebase & Gemini');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Firestore Status: ${isFirestoreAvailable() ? 'Connected' : 'In-Memory Fallback'}`);
  console.log(`Gemini Status: ${geminiService.isConfigured() ? 'Active' : 'Fallback / Awaiting API Key'}`);
});
