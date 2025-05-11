import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper: Check if user is admin (assumes req.user is set by auth middleware)
function isAdmin(req) {
  return req.user && req.user.role === 'Admin';
}

export const geminiChatHandler = async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not set in the backend.' });
    }
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    // Use v1 and gemini-1.5-pro model
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: message }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    // Parse Gemini response
    let reply = 'Sorry, I could not process that.';
    const data = geminiRes.data;
    if (
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0].text
    ) {
      reply = data.candidates[0].content.parts[0].text;
    }
    res.json({ reply });
  } catch (e) {
    console.error('Gemini AI error:', e?.response?.data || e.message || e);
    res.status(500).json({ reply: 'Sorry, I could not process that.' });
  }
};

export default { geminiChatHandler }; 