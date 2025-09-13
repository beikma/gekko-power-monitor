#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MCP_URL = `http://localhost:${process.env.MCP_PORT || 8787}`;
const MCP_TOKEN = process.env.MCP_TOKEN || 'default-token-change-me';

interface TestResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number;
}

class MCPTester {
  private async callTool(tool: string, args: any = {}): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.post(`${MCP_URL}/mcp/tools`, {
        tool,
        args
      }, {
        headers: {
          'Authorization': `Bearer ${MCP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      return {
        tool,
        success: true,
        data: response.data,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        tool,
        success: false,
        error: axios.isAxiosError(error) ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testHealth(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${MCP_URL}/health`, { timeout: 5000 });
      
      return {
        tool: 'health (direct)',
        success: true,
        data: response.data,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        tool: 'health (direct)',
        success: false,
        error: axios.isAxiosError(error) ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting MCP Server Tests');
    console.log(`📍 Testing server at: ${MCP_URL}`);
    console.log(`🔑 Using token: ${MCP_TOKEN.substring(0, 10)}...`);
    console.log('━'.repeat(60));

    const tests: Array<() => Promise<TestResult>> = [
      () => this.testHealth(),
      () => this.callTool('health'),
      () => this.callTool('list_points'),
      () => this.callTool('read_point', { point: 'meteo.temperature' }),
      () => this.callTool('read_point', { point: 'lights.item0' }),
      () => this.callTool('set_point', { point: 'lights.item0', value: '1' }),
      () => this.callTool('invalid_tool'), // Test error handling
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      const result = await test();
      results.push(result);
      
      const status = result.success ? '✅' : '❌';
      const time = `${result.responseTime}ms`;
      
      console.log(`${status} ${result.tool.padEnd(20)} ${time.padStart(8)}`);
      
      if (result.success) {
        if (result.data?.data) {
          console.log(`   📊 Data preview: ${JSON.stringify(result.data.data).substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ Error: ${result.error}`);
      }
      
      console.log();
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / totalCount);

    console.log('━'.repeat(60));
    console.log('📋 Test Summary:');
    console.log(`   Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    console.log(`   Avg Response Time: ${avgResponseTime}ms`);
    console.log();

    if (successCount === totalCount - 1) { // -1 because invalid_tool test should fail
      console.log('🎉 All tests passed! MCP Server is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the error messages above.');
    }
  }
}

// Example curl commands
function printCurlExamples(): void {
  console.log('📖 Example curl commands:');
  console.log();
  console.log('1. Health check (no auth):');
  console.log(`   curl "${MCP_URL}/health"`);
  console.log();
  console.log('2. List all points:');
  console.log(`   curl -X POST "${MCP_URL}/mcp/tools" \\`);
  console.log(`        -H "Authorization: Bearer ${MCP_TOKEN}" \\`);
  console.log(`        -H "Content-Type: application/json" \\`);
  console.log(`        -d '{"tool": "list_points"}'`);
  console.log();
  console.log('3. Read temperature:');
  console.log(`   curl -X POST "${MCP_URL}/mcp/tools" \\`);
  console.log(`        -H "Authorization: Bearer ${MCP_TOKEN}" \\`);
  console.log(`        -H "Content-Type: application/json" \\`);
  console.log(`        -d '{"tool": "read_point", "args": {"point": "meteo.temperature"}}'`);
  console.log();
}

async function main() {
  const tester = new MCPTester();
  
  if (process.argv.includes('--curl')) {
    printCurlExamples();
    return;
  }
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test runner failed:', error);
    process.exit(1);
  }
}

main();