import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "./middleware/auth";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import pkg from "pg";
const { Pool } = pkg;
import ConnectPgSimple from "connect-pg-simple";
import { testConnection } from "./db";
import cors from "cors";

const app = express();

// Enable CORS with credentials support
app.use(cors({
  origin: true, // This allows all origins, but will be restricted by credentials in production
  credentials: true, // This is critical for cookies/sessions to work
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware with better error handling
const pgSession = ConnectPgSimple(session);
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  keepAlive: true
});

sessionPool.on('error', (err) => {
  console.error('Session pool error:', err);
});

// Check if we're running in production (may vary in different environments)
const isProduction = process.env.NODE_ENV === "production";
console.log('Running in', isProduction ? 'production' : 'development', 'mode');

// Configure session with settings that work in both development and production
app.use(
  session({
    store: new pgSession({
      pool: sessionPool,
      createTableIfMissing: true,
      errorLog: console.error
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false to work in both HTTP and HTTPS
      httpOnly: true,
      sameSite: 'lax', // Helps with CSRF protection
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error occurred:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Start server with database connection testing
(async () => {
  try {
    // Test database connection before starting the server
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    const server = registerRoutes(app);

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve on port 5000 and bind to all interfaces
    const PORT = 5000;
    const HOST = '0.0.0.0';

    server.listen(PORT, HOST, () => {
      log(`Server running at http://${HOST}:${PORT}`);
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      try {
        await sessionPool.end();
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();