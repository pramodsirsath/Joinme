import dns from 'dns';
import mongoose from 'mongoose';

// `mongodb+srv://` URIs need a DNS SRV lookup. On some Windows / ISP setups Node's
// default resolver refuses SRV queries (querySrv ECONNREFUSED) even though the
// browser and nslookup work. Using public DNS servers for Node avoids that.
// Override with DNS_SERVERS=1.1.1.1,8.8.8.8 in .env, or set DNS_SERVERS=system to skip.
const dnsServers = process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1';
if (dnsServers !== 'system') {
  dns.setServers(dnsServers.split(',').map((s) => s.trim()));
}

// Fail queries fast instead of letting requests hang while the DB is unreachable.
mongoose.set('bufferCommands', false);

const RETRY_MS = 5000;

/**
 * Connects to MongoDB and keeps retrying on failure instead of exiting, so the
 * API stays up (and can tell the app what's wrong) while the DB is unreachable.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (/whitelist|access list|Could not connect to any servers/i.test(error.message)) {
      console.error('→ Add this machine\'s public IP in Atlas → Network Access (or allow 0.0.0.0/0 for development).');
    } else if (/bad auth|authentication failed/i.test(error.message)) {
      console.error('→ The username/password in MONGODB_URI is wrong (Atlas → Database Access).');
    }
    console.error(`Retrying in ${RETRY_MS / 1000}s...`);
    setTimeout(connectDB, RETRY_MS);
  }
};

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

/** Express middleware: answer 503 with a clear message while the DB is down. */
export const requireDB = (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    message: 'Database is not connected. Please try again in a moment.',
  });
};

export default connectDB;
