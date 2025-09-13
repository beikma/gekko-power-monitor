# Prophet Forecasting Service

A lightweight AI-powered energy consumption forecasting service using Facebook/Meta Prophet algorithm for daily and weekly seasonality predictions.

## Quick Start

### 1. Install Dependencies

```bash
cd forecast-demo
npm install

# Install Python dependencies
pip install prophet pandas numpy
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```
FORECAST_PORT=3001
FORECAST_API_KEY=your-secret-key-here

# Optional: For future live data integration
GEKKO_USERNAME=your-gekko-username
GEKKO_KEY=your-gekko-api-key
GEKKO_GEKKOID=your-gekko-id
```

### 3. Run the Service

```bash
# Development mode
npm run dev

# Or from project root
npm run dev:forecast
```

The service will be available at `http://localhost:3001`

## API Endpoints

### Health Check
```bash
curl "http://localhost:3001/health"
```

### Get Energy Forecast
```bash
# Basic forecast (synthetic data)
curl -H "Authorization: Bearer your-api-key" "http://localhost:3001/api/forecast"

# Forecast with live data (when available)
curl -H "Authorization: Bearer your-api-key" "http://localhost:3001/api/forecast?live=true"
```

### Example Response

```json
{
  "success": true,
  "historical": [
    {
      "timestamp": "2024-01-15T10:00:00.000Z",
      "actual": 45.23
    }
  ],
  "forecast": [
    {
      "timestamp": "2024-01-16T10:00:00.000Z",
      "predicted": 47.15,
      "lower": 42.08,
      "upper": 52.22
    }
  ],
  "model_info": {
    "training_samples": 720,
    "forecast_horizon_hours": 48,
    "generated_at": "2024-01-16T09:30:00.000Z",
    "training_duration_ms": 1250,
    "algorithm": "Facebook Prophet"
  },
  "server_info": {
    "total_duration_ms": 1350,
    "server_timestamp": "2024-01-16T09:30:00.000Z",
    "live_data": false
  }
}
```

## Testing

Run the test suite:

```bash
npm run test

# Or from project root
npm run test:forecast
```

This will test all endpoints and display example usage.

## Integration with Lovable

The forecasting service is integrated with your Lovable project through:

1. **Supabase Edge Function**: `/supabase/functions/energy-forecast/index.ts`
   - Provides the same forecasting API as a serverless function
   - Uses a JavaScript-based Prophet-inspired algorithm
   - Available at your Lovable project's Supabase endpoint

2. **React Hook**: `/src/hooks/useForecast.ts`
   - `useForecast()` hook for easy integration
   - Handles loading states, errors, and data management

3. **UI Component**: `/src/components/ForecastCard.tsx`
   - Interactive forecast visualization
   - Chart with historical data, predictions, and confidence bands
   - "Run Forecast" button for real-time predictions

4. **Dashboard Integration**: Available in the Admin page (`/admin`)

## Architecture

### Standalone Service
- **Express Server**: Lightweight HTTP server
- **Python Prophet**: Statistical forecasting model
- **Data Generation**: Realistic synthetic energy consumption patterns
- **API Security**: Bearer token authentication

### Lovable Integration  
- **Edge Function**: Serverless Prophet-inspired forecasting
- **React Components**: Interactive dashboard integration
- **Real-time Updates**: Instant forecast visualization

## Algorithm Details

The Prophet algorithm handles:
- **Trend Analysis**: Long-term consumption patterns
- **Daily Seasonality**: 24-hour consumption cycles (higher during day, lower at night)
- **Weekly Seasonality**: Weekday vs. weekend patterns
- **Confidence Intervals**: Upper and lower bounds for predictions
- **Holiday Effects**: (Future enhancement)

## Future Enhancements

1. **Live Data Integration**:
   - Connect to myGEKKO API for real consumption data
   - MQTT broker integration for real-time updates

2. **Advanced Features**:
   - Weather data integration
   - Holiday effect modeling
   - Multi-building forecasting
   - Cost optimization recommendations

3. **Model Improvements**:
   - Machine learning hyperparameter tuning
   - Ensemble forecasting
   - Anomaly detection

## Troubleshooting

### Python Issues
```bash
# Make sure Python 3.8+ is installed
python3 --version

# Install Prophet with conda (recommended)
conda install -c conda-forge prophet

# Or with pip
pip install prophet
```

### Port Conflicts
```bash
# Check if port 3001 is in use
lsof -i :3001

# Use a different port
FORECAST_PORT=3002 npm run dev
```

### API Key Issues
- Remove `FORECAST_API_KEY` from `.env` to disable authentication
- Check Bearer token format: `Authorization: Bearer your-key-here`

## Production Deployment

For production use:

1. **Security**: Always use API keys in production
2. **HTTPS**: Enable SSL certificates
3. **Monitoring**: Add logging and metrics
4. **Scaling**: Consider containerization with Docker
5. **Database**: Store forecasts for historical analysis

## Learn More

- [Prophet Documentation](https://facebook.github.io/prophet/)
- [Express.js Guide](https://expressjs.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)