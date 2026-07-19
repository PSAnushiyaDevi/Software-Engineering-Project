// server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB (Database: SKILLDB)');
    console.log('Testing database connection...');
    // Test connection
    mongoose.connection.db.admin().ping((err, result) => {
      if (err) {
        console.error('Database ping failed:', err);
      } else {
        console.log('Database ping successful - connection is working');
      }
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Please ensure MongoDB is running and accessible');
  });

// Define User schema with location
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  teachSkill: { type: String, required: true },
  learnSkill: { type: String, required: true },
  skillDetails: String,
  certificate: String,
  location: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Define Session schema
const sessionSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['online', 'offline'], required: true },
  date: { type: Date, required: true },
  location: { type: String }, // For offline sessions
  notes: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  requestedSkill: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);

// Define Message schema
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Register endpoint with certificate upload
app.post('/register', upload.single('certificate'), async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    console.log('File received:', req.file);
    
    const { name, email, password, teachSkill, learnSkill, skillDetails, location } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !teachSkill || !learnSkill) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Email already registered:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Process certificate if uploaded
    let certificateData = null;
    if (req.file) {
      certificateData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      teachSkill,
      learnSkill,
      skillDetails,
      certificate: certificateData,
      location
    });
    
    // Save to database
    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser);
    
    res.json({ 
      message: 'Registration successful', 
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        teachSkill: savedUser.teachSkill,
        learnSkill: savedUser.learnSkill,
        certificate: savedUser.certificate,
        location: savedUser.location
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password (plain text comparison for now)
    if (user.password !== password) {
      console.log('Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('Login successful for:', email);
    res.json({ 
      message: 'Login successful', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        teachSkill: user.teachSkill,
        learnSkill: user.learnSkill,
        certificate: user.certificate,
        location: user.location
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get matches - FIXED PROPER SKILL MATCHING
app.get('/match', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    const matches = [];

    // Enhanced matching algorithm - properly match based on skills
    for (const user of users) {
      // Find users who can teach what this user wants to learn
      const partners = users.filter(u => 
        u.email !== user.email && 
        u.teachSkill && 
        u.teachSkill.trim() !== '' && 
        user.learnSkill && 
        user.learnSkill.trim() !== '' &&
        u.teachSkill.toLowerCase().trim() === user.learnSkill.toLowerCase().trim()
      );
      
      for (const partner of partners) {
        matches.push({
          person: user.name,
          personEmail: user.email,
          learns: user.learnSkill,
          partner: partner.name,
          partnerEmail: partner.email,
          teaches: partner.teachSkill,
          partnerLocation: partner.location
        });
      }
    }

    res.json(matches);
  } catch (err) {
    console.error('Error matching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create session request
app.post('/sessions', async (req, res) => {
  try {
    const { requesterEmail, recipientEmail, type, date, location, notes, requestedSkill } = req.body;
    
    // Find users
    const requester = await User.findOne({ email: requesterEmail });
    const recipient = await User.findOne({ email: recipientEmail });
    
    if (!requester || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create session
    const session = new Session({
      requester: requester._id,
      recipient: recipient._id,
      type,
      date: new Date(date),
      location: type === 'offline' ? location : undefined,
      notes,
      requestedSkill,
      status: 'pending'
    });
    
    await session.save();
    
    res.status(201).json({ 
      message: 'Session request created successfully',
      session: {
        id: session._id,
        requester: requester.name,
        recipient: recipient.name,
        type: session.type,
        date: session.date,
        location: session.location,
        status: session.status
      }
    });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sessions for a user
app.get('/sessions', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const sessions = await Session.find({
      $or: [
        { requester: user._id },
        { recipient: user._id }
      ]
    }).populate('requester recipient', 'name email');
    
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update session status
app.put('/sessions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    session.status = status;
    await session.save();
    
    res.json({ message: 'Session status updated', session });
  } catch (err) {
    console.error('Error updating session status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Message endpoints
// Send a message
app.post('/messages', async (req, res) => {
  try {
    const { senderEmail, recipientEmail, content } = req.body;
    
    const sender = await User.findOne({ email: senderEmail });
    const recipient = await User.findOne({ email: recipientEmail });
    
    if (!sender || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const message = new Message({
      sender: sender._id,
      recipient: recipient._id,
      content
    });
    
    await message.save();
    
    res.status(201).json({ 
      message: 'Message sent successfully',
      data: {
        id: message._id,
        sender: sender.name,
        recipient: recipient.name,
        content: message.content,
        timestamp: message.timestamp
      }
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages between two users
app.get('/messages', async (req, res) => {
  try {
    const { userEmail, otherUserEmail } = req.query;
    
    const user = await User.findOne({ email: userEmail });
    const otherUser = await User.findOne({ email: otherUserEmail });
    
    if (!user || !otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const messages = await Message.find({
      $or: [
        { sender: user._id, recipient: otherUser._id },
        { sender: otherUser._id, recipient: user._id }
      ]
    }).populate('sender recipient', 'name email');
    
    // Mark messages as read
    await Message.updateMany(
      { recipient: user._id, sender: otherUser._id, read: false },
      { read: true }
    );
    
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread messages count
app.get('/messages/unread-count', async (req, res) => {
  try {
    const { userEmail } = req.query;
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const count = await Message.countDocuments({ 
      recipient: user._id, 
      read: false 
    });
    
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all conversations for a user
app.get('/conversations', async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all messages where the user is either sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: user._id },
        { recipient: user._id }
      ]
    }).populate('sender recipient', 'name email');
    
    // Group by the other user
    const conversationsMap = new Map();
    
    messages.forEach(message => {
      // Determine the other user
      const otherUser = message.sender._id.equals(user._id) ? message.recipient : message.sender;
      const otherUserId = otherUser._id.toString();
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: message.content,
          lastTimestamp: message.timestamp,
          unreadCount: 0
        });
      } else {
        // Update with the latest message
        const conversation = conversationsMap.get(otherUserId);
        if (message.timestamp > conversation.lastTimestamp) {
          conversation.lastMessage = message.content;
          conversation.lastTimestamp = message.timestamp;
        }
      }
      
      // Count unread messages (only if the current user is the recipient and the message is unread)
      if (message.recipient._id.equals(user._id) && !message.read) {
        conversationsMap.get(otherUserId).unreadCount++;
      }
    });
    
    // Convert map to array and sort by lastTimestamp (most recent first)
    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => b.lastTimestamp - a.lastTimestamp
    );
    
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
