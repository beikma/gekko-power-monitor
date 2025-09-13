# myGEKKO MCP Server

A Model Context Protocol (MCP) server that provides secure access to myGEKKO smart home data and controls for external AI agents.

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp mcp-server/.env.example mcp-server/.env

# Edit with your myGEKKO credentials
nano mcp-server/.env
```

### 2. Install Dependencies
```bash
cd mcp-server
npm install
```

### 3. Run Server
```bash
# Development mode
npm run dev:mcp

# Production mode
npm run build:mcp
npm run start:mcp
```

### 4. Test Connection
```bash
# Run automated tests
npm run test:mcp

# Show curl examples
npm run test:mcp -- --curl
```

## 🔧 Configuration

### Environment Variables
```env
# myGEKKO API Configuration
MYGEKKO_USERNAME=your-username@email.com
MYGEKKO_KEY=your-api-key
MYGEKKO_GEKKOID=your-gekko-id

# MCP Server Configuration
MCP_PORT=8787
MCP_TOKEN=your-secure-bearer-token
```

### Security
- All MCP tool endpoints require `Authorization: Bearer <token>`
- Health check endpoint `/health` is public
- Use HTTPS in production by setting `NODE_ENV=production`

## 🛠 Available Tools

### 1. `list_points`
List all available myGEKKO data points and their metadata.

**Parameters:** None

**Example Response:**
```json
{
  "success": true,
  "totalPoints": 150,
  "categories": ["lights", "meteo", "roomtemps", "blinds"],
  "points": {
    "lights.item0": {
      "id": "lights.item0",
      "name": "Küche Spots",
      "category": "lights",
      "readable": true,
      "writable": true
    }
  }
}
```

### 2. `read_point`
Read the current value of a specific data point.

**Parameters:**
- `point` (string): Data point identifier (e.g., "lights.item0", "meteo.temperature")

**Example Response:**
```json
{
  "success": true,
  "point": "meteo.temperature",
  "value": {
    "value": 21.5,
    "unit": "°C"
  },
  "timestamp": "2025-01-13T10:30:00Z"
}
```

### 3. `set_point`
Set a value for a controllable data point (currently lights only).

**Parameters:**
- `point` (string): Controllable point identifier
- `value` (string): Command value ("1"=on, "0"=off, "D50"=50% brightness)

**Example Response:**
```json
{
  "success": true,
  "message": "Command sent successfully",
  "point": "lights.item0",
  "value": "1"
}
```

### 4. `health`
Check server health and connectivity status.

**Parameters:** None

**Example Response:**
```json
{
  "status": "ok",
  "mode": "connected",
  "message": "MCP server healthy and connected to myGEKKO",
  "responseTime": 150
}
```

## 📡 HTTP API Endpoints

### POST /mcp/tools
Execute MCP tools via HTTP.

**Headers:**
```
Authorization: Bearer your-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "tool": "read_point",
  "args": {
    "point": "meteo.temperature"
  }
}
```

### GET /health
Public health check endpoint (no authentication required).

## 🧪 Testing

### Automated Tests
```bash
npm run test:mcp
```

### Manual Testing with curl
```bash
# Health check
curl "http://localhost:8787/health"

# List points
curl -X POST "http://localhost:8787/mcp/tools" \
     -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     -d '{"tool": "list_points"}'

# Read temperature
curl -X POST "http://localhost:8787/mcp/tools" \
     -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     -d '{"tool": "read_point", "args": {"point": "meteo.temperature"}}'
```

## 🤖 Connecting External AI Agents

### OpenAI Assistant/GPT
1. Configure your OpenAI Assistant to use this MCP server
2. Set the endpoint: `http://your-server:8787/mcp/tools`
3. Add the bearer token to headers
4. The AI can now call the 4 available tools

### Claude MCP Client
1. Install the MCP client: `npm install -g @anthropic-ai/mcp`
2. Configure connection to stdio mode:
```bash
node mcp-server/index.ts --stdio
```

### Custom Integration
Any HTTP client can use the REST API:
- Endpoint: `POST /mcp/tools`
- Authentication: `Bearer token`
- Content-Type: `application/json`

## 🐛 Troubleshooting

### Common Issues

**Connection Refused**
- Check if server is running: `curl localhost:8787/health`
- Verify port in .env file matches your configuration

**Authentication Failed**
- Verify `MCP_TOKEN` matches in both server and client
- Check Authorization header format: `Bearer <token>`

**myGEKKO API Errors**
- Verify credentials in .env file
- Check if gekkoid is correct
- Test direct API access outside MCP

**Fallback Mode**
- Server runs with mock data when credentials are missing
- All responses will have `"fallbackMode": true`
- No actual hardware commands are sent

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npm run dev:mcp
```

### Log Files
Server logs all requests and errors to console. In production, redirect to log files:
```bash
npm run start:mcp > mcp-server.log 2>&1
```

## 🔄 Integration with Lovable App

The Lovable dashboard includes:
- MCP proxy endpoint at `/api/mcp-proxy`
- Test button to verify MCP connectivity
- Direct integration without CORS issues

## 📝 Development Notes

### Architecture
- Express.js HTTP server for external access
- MCP SDK for protocol compliance
- Axios for myGEKKO API communication
- TypeScript for type safety

### Adding New Tools
1. Add tool definition in `index.ts` (ListToolsRequestSchema handler)
2. Implement tool logic in `tools/gekkoTools.ts`
3. Add case in CallToolRequestSchema handler
4. Update tests in `testMCP.ts`

### Performance Considerations
- API requests have 10s timeout
- Responses are cached in-memory briefly
- Rate limiting recommended for production

## 📄 License
MIT License - see LICENSE file for details.