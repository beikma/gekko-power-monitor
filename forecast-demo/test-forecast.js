#!/usr/bin/env node
/**
 * Test script for Prophet forecasting service
 * Tests all endpoints and provides example usage
 */

import { config } from 'dotenv';

// Load environment variables
config();

const BASE_URL = `http://localhost:${process.env.FORECAST_PORT || 3001}`;
const API_KEY = process.env.FORECAST_API_KEY;

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function testHealthEndpoint() {
  console.log('🏥 Testing health endpoint...');
  const result = await makeRequest(`${BASE_URL}/health`);
  
  if (result.error) {
    console.error('❌ Health check failed:', result.error);
  } else if (result.status === 200) {
    console.log('✅ Health check passed:', result.data);
  } else {
    console.error('❌ Health check failed with status:', result.status);
  }
  console.log('');
}

async function testForecastEndpoint() {
  console.log('🔮 Testing forecast endpoint...');
  const startTime = Date.now();
  
  const result = await makeRequest(`${BASE_URL}/api/forecast`);
  const endTime = Date.now();
  
  if (result.error) {
    console.error('❌ Forecast failed:', result.error);
  } else if (result.status === 200 && result.data.success) {
    console.log(`✅ Forecast successful (${endTime - startTime}ms)`);
    console.log(`📊 Historical data points: ${result.data.historical?.length || 0}`);
    console.log(`🔮 Forecast data points: ${result.data.forecast?.length || 0}`);
    
    if (result.data.model_info) {
      console.log(`🤖 Model info:`, result.data.model_info);
    }
    
    if (result.data.server_info) {
      console.log(`🖥️  Server info:`, result.data.server_info);
    }
    
    // Show first few forecast points
    if (result.data.forecast && result.data.forecast.length > 0) {
      console.log('📈 Sample forecast data:');
      result.data.forecast.slice(0, 3).forEach((point, index) => {
        const date = new Date(point.timestamp).toLocaleString();
        console.log(`   ${index + 1}. ${date}: ${point.predicted.toFixed(2)} kWh (±${(point.upper - point.lower).toFixed(2)})`);
      });
    }
  } else {
    console.error('❌ Forecast failed:', result.data);
  }
  console.log('');
}

async function testLiveForecastEndpoint() {
  console.log('📡 Testing live data forecast endpoint...');
  const startTime = Date.now();
  
  const result = await makeRequest(`${BASE_URL}/api/forecast?live=true`);
  const endTime = Date.now();
  
  if (result.error) {
    console.error('❌ Live forecast failed:', result.error);
  } else if (result.status === 200 && result.data.success) {
    console.log(`✅ Live forecast successful (${endTime - startTime}ms)`);
    console.log(`🔗 Used live data: ${result.data.server_info?.live_data || false}`);
  } else {
    console.error('❌ Live forecast failed:', result.data);
  }
  console.log('');
}

async function runAllTests() {
  console.log('🧪 Prophet Forecast Service Test Suite');
  console.log('=====================================');
  console.log(`🎯 Target URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY ? 'Configured' : 'Not configured'}`);
  console.log('');
  
  await testHealthEndpoint();
  await testForecastEndpoint();
  await testLiveForecastEndpoint();
  
  console.log('✨ Test suite completed!');
  console.log('');
  console.log('📋 Example curl commands:');
  console.log('');
  console.log('# Health check:');
  console.log(`curl "${BASE_URL}/health"`);
  console.log('');
  console.log('# Get forecast:');
  if (API_KEY) {
    console.log(`curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/api/forecast"`);
  } else {
    console.log(`curl "${BASE_URL}/api/forecast"`);
  }
  console.log('');
  console.log('# Get forecast with live data:');
  if (API_KEY) {
    console.log(`curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/api/forecast?live=true"`);
  } else {
    console.log(`curl "${BASE_URL}/api/forecast?live=true"`);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This test requires Node.js 18+ with built-in fetch support');
  console.log('💡 Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run tests
runAllTests().catch(console.error);