# Voice Assistant - MCP-Powered Building Control

## Overview

The voice assistant provides hands-free control of your building's myGEKKO automation systems through natural language commands. It uses Model Context Protocol (MCP) to securely interface with building hardware while maintaining full audit logs and safety guardrails.

## Features

### Intent Recognition
- **Rule-based classification** with confidence scoring
- **Natural language processing** for flexible command input
- **Contextual parameter extraction** (room names, values, units)

### Supported Commands

#### Control Commands
- `"Set office temperature to 22.5"` - Adjusts HVAC temperature
- `"Set lobby light to 80 percent"` - Controls lighting levels
- `"Turn on the boiler"` - Switch control for equipment

#### Query Commands
- `"What is the office temperature"` - Read current sensor values
- `"Show me the lobby light status"` - Check device states
- `"List all controllable points"` - Inventory available controls

#### System Commands
- `"System health check"` - Validate MCP connection and database
- `"Show energy history today"` - Historical data queries
- `"What happened yesterday"` - Time-based data retrieval

### Safety & Security

#### Value Validation
- **Range checking** against configured min/max values
- **Unit validation** to prevent incorrect setpoints
- **Controllability verification** - only marked points can be changed

#### Audit Trail
- **Complete logging** of all voice commands in `voice_log` table
- **Response time tracking** for performance monitoring
- **Success/failure status** with error details
- **IP address logging** for security

#### Permissions
- **Point-level security** via `is_controllable` flag
- **Database-enforced limits** on temperature ranges
- **MCP authentication** for hardware access

## Database Schema

### Points Table
```sql
points {
  id: UUID (primary key)
  point_id: TEXT (unique, myGEKKO identifier)
  name: TEXT (human-readable name)
  room: TEXT (location)
  type: TEXT (temperature|light|switch|sensor)
  unit: TEXT (°C|%|on/off)
  is_controllable: BOOLEAN
  min_value: NUMERIC (safety limit)
  max_value: NUMERIC (safety limit)
  current_value: TEXT
  last_updated: TIMESTAMP
}
```

### Voice Log Table
```sql
voice_log {
  id: UUID
  user_input: TEXT (original command)
  intent: TEXT (classified intent)
  point_id: TEXT (affected point)
  old_value: TEXT
  new_value: TEXT
  success: BOOLEAN
  error_message: TEXT
  response_time_ms: INTEGER
  ip_address: INET
  created_at: TIMESTAMP
}
```

### Point History Table
```sql
point_history {
  id: UUID
  point_id: TEXT
  value: TEXT
  timestamp: TIMESTAMP
  source: TEXT (voice|mcp|manual)
}
```

## API Endpoints

### POST /functions/v1/voice-assistant
Processes voice commands and returns structured responses.

**Request:**
```json
{
  "text": "set office temperature to 22",
  "userId": "user-id",
  "clientIp": "192.168.1.100"
}
```

**Response:**
```json
{
  "success": true,
  "intent": "set_point",
  "confidence": 0.9,
  "message": "Set Office Temperature to 22°C",
  "speechText": "Office temperature set to 22 degrees",
  "data": {
    "point": "Office Temperature",
    "value": 22,
    "unit": "°C"
  },
  "responseTime": 245
}
```

## UI Components

### VoiceAssistant
Full-featured voice interface with:
- **Live transcript display** during speech recognition
- **Intent/confidence visualization** with badges
- **MCP connection status** indicator
- **Command history** with success/failure status
- **Sample commands help** modal

### FloatingVoiceButton
Always-accessible voice control with:
- **VU meter animation** during listening
- **Processing/speaking status** indicators
- **Quick voice commands** without opening full interface
- **Toast notifications** for command feedback

## Configuration

### Environment Variables
```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
MCP_SERVER_URL=http://localhost:8787/mcp/tools
MCP_TOKEN=your-mcp-token
```

### MCP Server Setup
The voice assistant requires a running MCP server with these tools:
- `health` - Connection and status check
- `list_points` - Enumerate available devices
- `read_point` - Get current values
- `set_point` - Change device settings

### Sample Points Configuration
```sql
INSERT INTO points (point_id, name, room, type, unit, is_controllable, min_value, max_value) VALUES
('HVAC.Office.Temperature', 'Office Temperature', 'Office', 'temperature', '°C', true, 15, 28),
('LIGHTS.Lobby.Main', 'Lobby Main Light', 'Lobby', 'light', '%', true, 0, 100),
('SENSORS.Kitchen.Humidity', 'Kitchen Humidity', 'Kitchen', 'sensor', '%', false, null, null);
```

## Usage Examples

### Temperature Control
```
User: "Set the office to 23 degrees"
System: Intent=set_point, Confidence=90%, Point=HVAC.Office.Temperature
Response: "Office temperature set to 23°C"
```

### Status Queries
```
User: "What's the lobby light level?"
System: Intent=read_point, Confidence=85%, Point=LIGHTS.Lobby.Main
Response: "Lobby Main Light is currently 75%"
```

### System Health
```
User: "Is everything working okay?"
System: Intent=health, Confidence=70%
Response: "System is operational. Database has 5 points configured. MCP connection: OK"
```

## Error Handling

### Common Error Scenarios
- **Point not found**: "No controllable temperature found in office"
- **Value out of range**: "Value 35 is above maximum 28°C"
- **MCP connection failure**: "Failed to connect to building control system"
- **Permission denied**: "This point is not controllable"

### Recovery Strategies
- **Automatic retries** for transient MCP failures
- **Fallback to database values** when MCP unavailable
- **Graceful degradation** with clear error messages
- **Voice feedback** for all error conditions

## Performance & Monitoring

### Response Time Targets
- **Intent classification**: < 50ms
- **Database queries**: < 100ms
- **MCP calls**: < 500ms
- **Total response time**: < 1000ms

### Monitoring Metrics
- **Command success rate** from voice_log table
- **Average response times** by intent type
- **MCP connection reliability**
- **Most frequent commands** and error patterns

## Security Considerations

### Input Validation
- **Zod schema validation** for all API inputs
- **SQL injection prevention** via parameterized queries
- **Range validation** before MCP calls
- **Rate limiting** to prevent abuse

### Access Control
- **Point-level permissions** via is_controllable flag
- **IP-based logging** for security auditing
- **MCP token authentication** for hardware access
- **Database RLS policies** for data isolation

## Future Enhancements

### Planned Features
- **GPT-4 intent fallback** for complex commands
- **Multi-room commands**: "Set all bedroom lights to 50%"
- **Scheduled commands**: "Turn off all lights at 11 PM"
- **Voice biometrics** for user identification
- **Mobile app integration** with push-to-talk

### Integration Opportunities
- **Microsoft Teams notifications** for system alerts
- **Energy usage optimization** suggestions
- **Predictive maintenance** warnings
- **Weather-based automation** recommendations