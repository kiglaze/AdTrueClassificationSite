// javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const distPath = path.join(__dirname, 'dist');

// If behind a proxy (Heroku, GCP, AWS ELB, nginx) enable trust proxy
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// Security and performance
app.use(
    helmet({
        // Disable HSTS because you're not serving HTTPS on this port
        hsts: false,
        // Optional: avoid the noisy console warning about COOP on non-HTTPS
        crossOriginOpenerPolicy: false,
    })
);

app.use(compression());

// Optional: redirect HTTP to HTTPS when FORCE_HTTPS is "true" and trust proxy is enabled
if (process.env.FORCE_HTTPS === 'true') {
    app.use((req, res, next) => {
        const proto = req.get('x-forwarded-proto') || (req.protocol || '');
        if (!proto.includes('https')) {
            return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
        }
        next();
    });
}

// Serve static assets with long cache lifetime; index.html should be revalidated
app.use(
    express.static(distPath, {
        index: 'index.html',
        maxAge: '1y',
        immutable: true,
    })
);

// Example API placeholder (replace with real routes)
app.use('/api', (req, res) => {
    res.status(200).json({ message: 'API placeholder' });
});

// SPA fallback: use a regex route to avoid path-to-regexp string parsing issues
app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    // Ensure index.html is not cached by browsers
    res.sendFile(path.join(distPath, 'index.html'), {
        headers: { 'Cache-Control': 'no-cache, must-revalidate' },
    }, (err) => {
        if (err) next(err);
    });
});

const server = app.listen(port, host, () => {
    const addr = server.address();
    const address = addr && addr.address ? addr.address : host;
    const boundPort = addr && addr.port ? addr.port : port;
    console.log(`Serving \`dist\` at http://${address}:${boundPort} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
});

server.on('error', (err) => {
    console.error('Server failed to start:', err);
    if (err.code === 'EADDRINUSE') {
        console.error('Port is already in use. Run `sudo lsof -nP -iTCP:PORT -sTCP:LISTEN` to find the process.');
    } else if (err.code === 'EACCES') {
        console.error('Insufficient privileges to bind to this port (use non-privileged port or run with elevated privileges).');
    } else if (err.code === 'EADDRNOTAVAIL') {
        console.error('The HOST IP is not available on this machine. Use `0.0.0.0` or an IP assigned to an interface.');
    }
    process.exit(1);
});

// graceful shutdown (unchanged)
const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
