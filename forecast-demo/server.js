#!/usr/bin/env node
/**
 * Prophet Forecasting Service
 * Express server that provides energy consumption forecasting via Prophet
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const app = express();
const PORT = process.env.FORECAST_PORT || 3001;
const API_KEY = process.env.FORECAST_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  if (API_KEY) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid API key' });
    }
    
    const token = authHeader.split(' ')[1];
    if (token !== API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'prophet-forecast',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Main forecast endpoint
app.get('/api/forecast', validateApiKey, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const useLiveData = req.query.live === 'true';
    const scriptPath = path.join(__dirname, 'prophet-forecast.py');
    
    // Configure Python shell options
    const options = {
      mode: 'text',
      pythonPath: 'python3', // or 'python' depending on system
      pythonOptions: ['-u'], // unbuffered stdout
      scriptPath: __dirname,
      args: useLiveData ? ['--live'] : []
    };
    
    console.log(`[${new Date().toISOString()}] Running Prophet forecast (live: ${useLiveData})...`);
    
    // Run Python Prophet script
    const results = await new Promise((resolve, reject) => {
      PythonShell.run('prophet-forecast.py', options, (err, results) => {
        if (err) {
          console.error('Python script error:', err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
    
    // Parse the JSON output from Python
    const outputJson = results.join('\n');
    const forecastData = JSON.parse(outputJson);
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    console.log(`[${new Date().toISOString()}] Forecast completed in ${totalDuration}ms`);
    
    // Add server timing information
    if (forecastData.success) {
      forecastData.server_info = {
        total_duration_ms: totalDuration,
        server_timestamp: new Date().toISOString(),
        live_data: useLiveData
      };
    }
    
    res.json(forecastData);
    
  } catch (error) {
    console.error('Forecast error:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      server_info: {
        total_duration_ms: Date.now() - startTime,
        server_timestamp: new Date().toISOString()
      }
    };
    
    res.status(500).json(errorResponse);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Prophet Forecast Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔮 Forecast API: http://localhost:${PORT}/api/forecast`);
  
  if (API_KEY) {
    console.log(`🔒 API Key authentication enabled`);
  } else {
    console.log(`⚠️  No API key configured - service is public`);
  }
});

export default app;