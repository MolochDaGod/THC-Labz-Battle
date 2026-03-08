import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleRewards } from "./rewards";
import { scheduleWeeklyRewards } from "./weekly-rewards";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Session types extension


// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);

// Force production environment setup - detect production mode from multiple sources
const isProduction = process.env.EXPRESS_ENV === "production" || 
                    process.argv.includes("--production") ||
                    __filename.includes("dist/index.js");

if (isProduction) {
  process.env.NODE_ENV = "production";
}

const app = express();

// Configure CORS to allow iframe embedding
app.use(cors({
  origin: [
    'https://growerz.thc-labz.xyz',
    'https://cannabis-cultivator-grudgedev.replit.app',
    'https://grudge-thc-growrez.replit.app',
    /.*\.thc-labz\.xyz$/,
    /.*\.replit\.dev$/,
    /.*\.replit\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configure Helmet with iframe support
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: [
        "'self'", 
        "https://growerz.thc-labz.xyz",
        "https://*.thc-labz.xyz",
        "https://cannabis-cultivator-grudgedev.replit.app",
        "https://grudge-thc-growrez.replit.app"
      ],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  frameOptions: { action: 'sameorigin' }
}));

// Explicitly set express environment for production
if (isProduction) {
  app.set("env", "production");
  log("🚀 Production mode detected and enabled");
}

// Production security and optimization middleware
if (isProduction) {
  // Trust proxy for production deployment
  app.set('trust proxy', 1);
  
  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Request compression
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
} else {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
}

// Fix MIME type for TypeScript/JavaScript modules
app.use((req, res, next) => {
  const ext = req.path.split('.').pop();
  if (ext === 'tsx' || ext === 'ts') {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (ext === 'js' && req.path.includes('src/')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});


// Serve attached assets - check both development and production paths
const attachedAssetsPath = isProduction 
  ? path.resolve('dist/attached_assets')
  : path.resolve('attached_assets');

if (fs.existsSync(attachedAssetsPath)) {
  app.use('/attached_assets', express.static(attachedAssetsPath));
  log(`Serving attached assets from: ${attachedAssetsPath}`);
} else {
  log(`Warning: Attached assets path not found: ${attachedAssetsPath}`);
}

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

// Health check endpoints
app.get('/health', (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(healthStatus);
});

app.get('/ready', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ready',
    message: 'THC Labz Dope Boys is ready to serve traffic',
    timestamp: new Date().toISOString()
  });
});

(async () => {
  const server = await registerRoutes(app);

  // Enhanced error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error details in production
    if (isProduction) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Request Error',
        error: message,
        status,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }));
    }

    res.status(status).json({ 
      message: isProduction ? "Internal Server Error" : message,
      ...((!isProduction) && { stack: err.stack })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const environment = app.get("env");
  const nodeEnv = process.env.NODE_ENV;
  log(`Environment check: app.get("env") = "${environment}", NODE_ENV = "${nodeEnv}", isProduction = ${isProduction}`);
  
  if (!isProduction) {
    log("Setting up Vite development server");
    await setupVite(app, server);
  } else {
    log("Setting up static file serving for production");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    const startupMessage = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'THC Labz Dope Boys Server Started',
      port,
      environment: process.env.NODE_ENV || 'development',
      ready: true
    };
    
    if (isProduction) {
      console.log(JSON.stringify(startupMessage));
    } else {
      log(`serving on port ${port}`);
    }
    
    // Initialize AI Agent wallet and rewards system
    (async () => {
      try {
        // Initialize AI Agent wallet first
        const { aiAgentWallet } = await import('./ai-agent-wallet');
        log("🤖 Initializing AI Agent wallet system...");
        await aiAgentWallet.initializeAIAgentWallet();
        log("✅ AI Agent wallet system ready");
      } catch (error) {
        log("❌ Failed to initialize AI Agent wallet:", error);
      }
    })();
    
    // Initialize reward schedulers
    try {
      scheduleRewards();
      scheduleWeeklyRewards();
      log("💰 Daily and weekly rewards systems initialized");
    } catch (error) {
      log("❌ Failed to initialize rewards:", error);
    }
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Received ${signal}. Shutting down gracefully...`
    }));

    server.close(() => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Server closed successfully'
      }));
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Forced shutdown after timeout'
      }));
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
