const { auth, isFirestoreAvailable } = require('../config/firebase');

// Optional authentication - populates req.user if token is present and valid
const verifyTokenOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!isFirestoreAvailable() || !auth) {
    // Mock user for offline development if test token passed
    req.user = { uid: 'guest-creator', name: 'Community Author', email: 'guest@bhasha.org' };
    return next();
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.warn('Invalid Firebase token:', err.message);
    req.user = null;
    next();
  }
};

// Strict authentication - rejects requests without valid token
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in with Firebase.'
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!isFirestoreAvailable() || !auth) {
    req.user = { uid: 'dev-user', name: 'Dev Author', email: 'dev@bhasha.org' };
    return next();
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }
};

module.exports = {
  verifyTokenOptional,
  requireAuth
};
