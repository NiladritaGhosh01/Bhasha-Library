const express = require('express');
const router = express.Router();
const { generateStory } = require('../controllers/aiController');
const { verifyTokenOptional } = require('../middleware/authMiddleware');

router.post('/generate', verifyTokenOptional, generateStory);

module.exports = router;
