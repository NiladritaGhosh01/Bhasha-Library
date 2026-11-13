const express = require('express');
const router = express.Router();
const {
  getStories,
  getStoryById,
  createStory,
  deleteStory,
  likeStory
} = require('../controllers/storyController');
const { verifyTokenOptional } = require('../middleware/authMiddleware');

router.route('/')
  .get(getStories)
  .post(verifyTokenOptional, createStory);

router.route('/:id')
  .get(getStoryById)
  .delete(verifyTokenOptional, deleteStory);

router.route('/:id/like')
  .post(likeStory);

module.exports = router;
