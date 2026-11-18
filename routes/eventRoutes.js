import express from 'express';
import { createEvent, joinEvent, getAllEvents } from '../controllers/eventController.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

router.post('/create', userAuth, createEvent);
router.post('/join', userAuth, joinEvent);
router.get('/all', getAllEvents);

export default router;
