import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';
import os from 'os';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import connectDB, { requireDB } from './config/mongodb.js';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import eventRouter from './routes/eventRoutes.js';

// ✅ Step 1: Create app
const app = express();
const PORT = process.env.PORT || 4000;

// ✅ Step 2: Connect to DB (retries on failure instead of crashing)
connectDB();

// ✅ Step 3: Setup middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  credentials: false,
}));

// Log every request so you can see whether the mobile app is reaching the server.
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms) from ${req.ip}`);
  });
  next();
});

// ✅ Step 4: Setup routes
app.get('/', (req, res) => {
  res.send('JoinMe API is working fine');
});
app.get('/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ success: dbUp, server: 'up', database: dbUp ? 'connected' : 'disconnected' });
});
app.use('/api', requireDB);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);

// Unknown routes and unexpected errors still return JSON the app can show.
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, message: err.type === 'entity.parse.failed' ? 'Invalid JSON body' : 'Server error' });
});

// ✅ Step 5: Setup Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// ✅ Step 6: Attach io instance to app
app.set('io', io);

// ✅ Step 7: Start the server on all network interfaces so phones on the same Wi-Fi can reach it
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  const lan = Object.values(os.networkInterfaces()).flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i.address}:${PORT}`);
  if (lan.length) console.log(`Reachable from your phone at: ${lan.join('  |  ')}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use — another backend is probably running. Stop it or set PORT in .env.`);
    process.exit(1);
  }
  throw err;
});
