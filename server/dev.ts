import app from "./index";
import { serveStatic } from "./static";

const PORT = process.env.PORT || 5000;

// Force serve static files in development
serveStatic(app);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});