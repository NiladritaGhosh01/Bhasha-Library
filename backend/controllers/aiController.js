const geminiService = require('../services/geminiService');

// @desc    Generate a bilingual story using Gemini Flash
// @route   POST /api/ai/generate
// @access  Public (or with optional auth)
const generateStory = async (req, res) => {
  try {
    const { prompt, title, genre, tone } = req.body;

    if (!prompt && !title) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a story prompt or title.'
      });
    }

    const storyData = await geminiService.generateBilingualStory({
      prompt: prompt || title,
      title,
      genre,
      tone
    });

    res.status(200).json({
      success: true,
      data: storyData,
      isLiveAI: geminiService.isConfigured()
    });
  } catch (err) {
    console.error('Error generating story:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  generateStory
};
