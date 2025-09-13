#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { gekkoTools } from './tools/gekkoTools.js';

// Load environment variables
dotenv.config();

const PORT = process.env.MCP_PORT || 8787;
const MCP_TOKEN = process.env.MCP_TOKEN || 'default-token-change-me';

// Create Express app for HTTP MCP server
const app = express();
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || token !== MCP_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized - Invalid or missing Bearer token' });
  }
  
  next();
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
        result = await gekkoTools.readPoint(args?.point as string);
        break;
      case 'set_point':
        result = await gekkoTools.setPoint(args?.point as string, args?.value as string);
        break;
      case 'health':
        result = await gekkoTools.health();
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Tool ${name} error:`, error);
    
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
    const { tool, args } = req.body;
    
    let result;
    switch (tool) {
      case 'list_points':
        result = await gekkoTools.listPoints();
        break;
      case 'read_point':
        result = await gekkoTools.readPoint(args?.point);
        break;
      case 'set_point':
        result = await gekkoTools.setPoint(args?.point, args?.value);
        break;
      case 'health':
        result = await gekkoTools.health();
        break;
      default:
        return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('MCP tool error:', error);
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Health check endpoint (no auth required)
app.get('/health', async (req, res) => {
  try {
    const healthResult = await gekkoTools.health();
    res.json(healthResult);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
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
      console.log(`MCP Server running on http://localhost:${PORT}`);
      console.log(`Use Authorization: Bearer ${MCP_TOKEN}`);
      console.log('Endpoints:');
      console.log('  POST /mcp/tools - Execute MCP tools');
      console.log('  GET /health - Health check');
    });
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('Shutting down MCP server...');
  process.exit(0);
});

main().catch(console.error);