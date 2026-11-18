import jwt from 'jsonwebtoken';

const userAuth = (req, res, next) => {
  // Extract token from Authorization: Bearer <token> header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ success: false, message: 'Unauthorized access. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.json({ success: false, message: 'Unauthorized access. Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.json({ success: false, message: 'Invalid or expired token' });
  }
};

export default userAuth;
