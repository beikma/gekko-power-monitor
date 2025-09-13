#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { z } from 'zod';
import { gekkoTools } from './tools/gekkoTools.js';
import { openMeteoTools } from './tools/openMeteo.js';

// Load environment variables
dotenv.config();

const PORT = process.env.MCP_PORT || 8787;
const MCP_TOKEN = process.env.MCP_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Validate required environment variables
if (!MCP_TOKEN || MCP_TOKEN === 'default-token-change-me') {
  console.error('SECURITY ERROR: MCP_TOKEN must be set to a secure value in .env file');
  process.exit(1);
}

// Input validation schemas
const ToolRequestSchema = z.object({
  tool: z.enum(['list_points', 'read_point', 'set_point', 'health', 'weather_forecast']),
  args: z.object({
    point: z.string().optional(),
    value: z.string().optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    hours: z.number().optional(),
  }).optional(),
});

const ReadPointSchema = z.object({
  point: z.string().min(1, 'Point identifier is required'),
});

const SetPointSchema = z.object({
  point: z.string().min(1, 'Point identifier is required'),
  value: z.string().min(1, 'Value is required'),
});

const WeatherForecastSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  hours: z.number().min(1).max(168).optional().default(48),
});

// Create Express app for HTTP MCP server
const app = express();

// CORS configuration - restrict to specific origins in production
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? [FRONTEND_URL, 'https://kayttwmmdcubfjqrpztw.supabase.co']
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Rate limiting: 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/mcp/health', // Don't rate limit health checks
});

app.use(limiter);

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(8000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Authentication middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || token !== MCP_TOKEN) {
    return res.status(401).json({ 
      error: 'Unauthorized - Invalid or missing Bearer token',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Sanitize error responses
const sanitizeError = (error: any, includeStack = false): string => {
  if (NODE_ENV === 'development' && includeStack && error.stack) {
    return error.stack;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Internal server error';
};

// Create MCP server instance
const server = new Server({
  name: 'gekko-mcp-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_points',
        description: 'List all available myGEKKO data points and their metadata',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'read_point',
        description: 'Read the current value of a specific myGEKKO data point',
        inputSchema: {
          type: 'object',
          properties: {
            point: {
              type: 'string',
              description: 'The data point identifier (e.g., "lights.item0", "meteo.temperature")',
            },
          },
          required: ['point'],
        },
      },
      {
        name: 'set_point',
        description: 'Set a value for a controllable myGEKKO data point (lights, blinds, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            point: {
              type: 'string',
              description: 'The controllable point identifier (e.g., "lights.item0")',
            },
            value: {
              type: 'string',
              description: 'Command value (e.g., "1" for on, "0" for off, "D50" for 50% brightness)',
            },
          },
          required: ['point', 'value'],
        },
      },
      {
        name: 'health',
        description: 'Check the health status of the myGEKKO MCP server',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'weather_forecast',
        description: 'Get weather forecast including temperature and solar radiation from Open-Meteo',
        inputSchema: {
          type: 'object',
          properties: {
            lat: {
              type: 'number',
              description: 'Latitude coordinate (-90 to 90)',
              minimum: -90,
              maximum: 90
            },
            lon: {
              type: 'number', 
              description: 'Longitude coordinate (-180 to 180)',
              minimum: -180,
              maximum: 180
            },
            hours: {
              type: 'number',
              description: 'Number of forecast hours (1-168, default: 48)',
              minimum: 1,
              maximum: 168,
              default: 48
            },
          },
          required: ['lat', 'lon'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'list_points':
        result = await gekkoTools.listPoints();
        break;
      case 'read_point':
        ReadPointSchema.parse(args);
        result = await gekkoTools.readPoint(args?.point as string);
        break;
      case 'set_point':
        SetPointSchema.parse(args);
        result = await gekkoTools.setPoint(args?.point as string, args?.value as string);
        break;
      case 'health':
        result = await gekkoTools.health();
        break;
      case 'weather_forecast':
        WeatherForecastSchema.parse(args);
        result = await openMeteoTools.weatherForecast(args?.lat!, args?.lon!, args?.hours);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = sanitizeError(error);
    console.error(`Tool ${name} error:`, errorMessage);
    
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ 
              error: 'Invalid input parameters',
              details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// HTTP endpoints for external access
app.post('/mcp/tools', authenticate, async (req, res) => {
  try {
    // Validate request body
    const validation = ToolRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }

    const { tool, args } = validation.data;
    
    let result;
    switch (tool) {
      case 'list_points':
        result = await gekkoTools.listPoints();
        break;
      case 'read_point':
        ReadPointSchema.parse(args);
        result = await gekkoTools.readPoint(args?.point!);
        break;
      case 'set_point':
        SetPointSchema.parse(args);
        result = await gekkoTools.setPoint(args?.point!, args?.value!);
        break;
      case 'health':
        result = await gekkoTools.health();
        break;
      case 'weather_forecast':
        WeatherForecastSchema.parse(args);
        result = await openMeteoTools.weatherForecast(args?.lat!, args?.lon!, args?.hours);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Unknown tool: ${tool}`,
          timestamp: new Date().toISOString()
        });
    }
    
    res.json({ 
      success: true, 
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = sanitizeError(error, NODE_ENV === 'development');
    console.error('MCP tool error:', errorMessage);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input parameters',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint (no auth required, but rate limited)
app.get('/mcp/health', async (req, res) => {
  try {
    const healthResult = await gekkoTools.health();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      gekko: healthResult
    });
  } catch (error) {
    const errorMessage = sanitizeError(error);
    console.error('Health check error:', errorMessage);
    res.status(500).json({ 
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Start servers
async function main() {
  // Start stdio MCP server for local MCP clients
  if (process.argv.includes('--stdio')) {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP Server running on stdio');
  } else {
    // Start HTTP server for external access
    app.listen(PORT, () => {
      console.log(`🔒 Secure MCP Server running on http://localhost:${PORT}`);
      console.log(`🛡️  Environment: ${NODE_ENV}`);
      console.log(`⚡ Rate limit: 30 req/min per IP`);
      console.log(`🔑 Authentication: Bearer token required`);
      console.log('📡 Endpoints:');
      console.log('  POST /mcp/tools - Execute MCP tools (auth required)');
      console.log('  GET /mcp/health - Health check (rate limited)');
      
      if (NODE_ENV === 'development') {
        console.log(`🔧 Development mode - CORS allows all origins`);
      } else {
        console.log(`🔒 Production mode - CORS restricted to: ${corsOptions.origin}`);
      }
    });
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down MCP server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', sanitizeError(error, true));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', sanitizeError(reason, true));
  process.exit(1);
});

main().catch((error) => {
  console.error('💥 Failed to start MCP server:', sanitizeError(error, true));
  process.exit(1);
});