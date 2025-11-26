// javascript
// Save as `dev-server.js` in your project root.
// Install: npm install express
// Run: NODE_ENV=production node dev-server.js
// Test: curl -I http://localhost:3000
// Open in macOS: open http://localhost:3000

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

app.use(express.static(distPath, { index: 'index.html' }));

// API placeholder (adjust or remove if you have a real API)
app.use('/api', (req, res) => {
    res.status(200).json({ message: 'API placeholder' });
});

// Fallback to index.html for SPA routes
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }

    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Serving \`${distPath}\` at http://localhost:${port}`);
});
