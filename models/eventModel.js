import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['cricket', 'football', 'volleyball', 'movie', 'ride', 'trip'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  eventDateTime: {
    type: Date,
    required: true,
  },
  venue: String,
  requiredPeople: {
    type: Number,
    required: true,
  },
  joinedUsers: {
    type: [String],
    default: [],
  },
  paymentRequired: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    default: 0,
  },
  contactPreference: {
    type: String,
    enum: ['chat', 'mobile', 'both'],
    default: 'chat',
  },
  contactNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: ['live', 'full', 'expired'],
    default: 'live',
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('eventModel', eventSchema);
