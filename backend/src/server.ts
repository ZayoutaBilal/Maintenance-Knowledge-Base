import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 5000;

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Export for Vercel serverless
export default app;