import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface GekkoConfig {
  username: string;
  key: string;
  gekkoid: string;
  baseUrl: string;
}

class GekkoTools {
  private config: GekkoConfig;
  private fallbackMode: boolean = false;

  constructor() {
    this.config = {
      username: process.env.MYGEKKO_USERNAME || 'demo@example.com',
      key: process.env.MYGEKKO_KEY || 'demo-key',
      gekkoid: process.env.MYGEKKO_GEKKOID || 'demo-gekkoid',
      baseUrl: process.env.MYGEKKO_BASE_URL || 'https://live.my-gekko.com/api/v1'
    };

    // Check if we're in fallback mode (missing credentials)
    if (!process.env.MYGEKKO_USERNAME || !process.env.MYGEKKO_KEY || !process.env.MYGEKKO_GEKKOID) {
      this.fallbackMode = true;
      console.warn('⚠️ myGEKKO credentials missing - running in fallback mode with mock data');
    }
  }

  private async makeGekkoRequest(endpoint: string, params: Record<string, string> = {}) {
    if (this.fallbackMode) {
      return this.getFallbackData(endpoint);
    }

    try {
      const queryParams = new URLSearchParams({
        username: this.config.username,
        key: this.config.key,
        gekkoid: this.config.gekkoid,
        ...params
      });

      const response = await axios.get(`${this.config.baseUrl}/${endpoint}?${queryParams}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'myGEKKO-MCP-Server/1.0.0'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`myGEKKO API error for ${endpoint}:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('Authentication failed - check your myGEKKO credentials');
        } else if (error.response?.status === 410) {
          throw new Error('myGEKKO resource no longer available - check your gekkoid');
        }
      }
      
      throw new Error(`Failed to fetch from myGEKKO API: ${error}`);
    }
  }

  private getFallbackData(endpoint: string) {
    const mockData: Record<string, any> = {
      'var': {
        globals: {
          network: {
            gekkoname: { description: 'Device hostname', type: 'STRING' },
            version: { description: 'Software version', type: 'AO' }
          },
          meteo: {
            temperature: { description: 'Temperature in °C', type: 'AI' },
            humidity: { description: 'Relative humidity %', type: 'AI' }
          }
        },
        lights: {
          item0: { name: 'Demo Light 1', page: 'Living Room' },
          item1: { name: 'Demo Light 2', page: 'Kitchen' }
        }
      },
      'var/status': {
        globals: {
          network: {
            gekkoname: { value: 'Demo GEKKO' },
            version: { value: '123456' }
          },
          meteo: {
            temperature: { value: '21.5' },
            humidity: { value: '45.0' }
          }
        },
        lights: {
          item0: { sumstate: { value: '1;;;;0;;;;;;;;;;;;;;;;;;;100.00;' } },
          item1: { sumstate: { value: '0;;;;0;;;;;;;;;;;;;;;;;;;0.00;' } }
        }
      }
    };

    return mockData[endpoint] || { message: 'Mock data not available for this endpoint' };
  }

  async listPoints(): Promise<any> {
    try {
      const data = await this.makeGekkoRequest('var');
      
      const points: Record<string, any> = {};
      
      // Process different categories
      for (const [category, items] of Object.entries(data)) {
        if (typeof items === 'object' && items !== null) {
          for (const [itemKey, itemData] of Object.entries(items)) {
            const pointId = `${category}.${itemKey}`;
            points[pointId] = {
              id: pointId,
              category,
              name: (itemData as any)?.name || itemKey,
              description: (itemData as any)?.description || `${category} ${itemKey}`,
              type: (itemData as any)?.type || 'UNKNOWN',
              readable: true,
              writable: (itemData as any)?.scmd ? true : false,
              page: (itemData as any)?.page
            };
          }
        }
      }
      
      return {
        success: true,
        totalPoints: Object.keys(points).length,
        categories: Object.keys(data),
        points,
        fallbackMode: this.fallbackMode
      };
    } catch (error) {
      throw new Error(`Failed to list points: ${error}`);
    }
  }

  async readPoint(point: string): Promise<any> {
    if (!point) {
      throw new Error('Point identifier is required');
    }

    try {
      // Get current values
      const statusData = await this.makeGekkoRequest('var/status');
      
      // Parse point path (e.g., "lights.item0" -> category: "lights", item: "item0")
      const [category, item] = point.split('.');
      
      if (!category || !item) {
        throw new Error('Invalid point format. Use "category.item" (e.g., "lights.item0")');
      }
      
      const categoryData = statusData[category];
      if (!categoryData) {
        throw new Error(`Category "${category}" not found`);
      }
      
      const itemData = categoryData[item];
      if (!itemData) {
        throw new Error(`Item "${item}" not found in category "${category}"`);
      }
      
      // Parse value based on category
      let parsedValue = itemData;
      
      if (category === 'lights' && itemData.sumstate) {
        const parts = itemData.sumstate.value.split(';');
        parsedValue = {
          state: parts[0] === '1' ? 'on' : 'off',
          brightness: parts[1] ? parseFloat(parts[1]) : null,
          rawValue: itemData.sumstate.value
        };
      } else if (category === 'meteo' || category === 'roomtemps') {
        parsedValue = {
          value: parseFloat(itemData.value),
          unit: this.getUnitForMeteoPoint(item),
          rawValue: itemData.value
        };
      }
      
      return {
        success: true,
        point,
        category,
        item,
        value: parsedValue,
        timestamp: new Date().toISOString(),
        fallbackMode: this.fallbackMode
      };
    } catch (error) {
      throw new Error(`Failed to read point "${point}": ${error}`);
    }
  }

  async setPoint(point: string, value: string): Promise<any> {
    if (!point || value === undefined) {
      throw new Error('Both point identifier and value are required');
    }

    if (this.fallbackMode) {
      return {
        success: true,
        message: 'Command executed in fallback mode (no actual hardware changed)',
        point,
        value,
        timestamp: new Date().toISOString(),
        fallbackMode: true
      };
    }

    try {
      // Parse point path
      const [category, item] = point.split('.');
      
      if (category !== 'lights') {
        throw new Error('Currently only lights can be controlled via MCP');
      }
      
      // Get the command index for this light
      const schemaData = await this.makeGekkoRequest('var');
      const lightData = schemaData.lights?.[item];
      
      if (!lightData?.scmd?.index) {
        throw new Error(`Light "${item}" is not controllable or command index not found`);
      }
      
      const commandIndex = lightData.scmd.index;
      
      // Send command using scmd endpoint
      const commandResponse = await this.makeGekkoRequest('var/scmd', {
        index: commandIndex.toString(),
        value: value
      });
      
      return {
        success: true,
        message: 'Command sent successfully',
        point,
        value,
        commandIndex,
        response: commandResponse,
        timestamp: new Date().toISOString(),
        fallbackMode: this.fallbackMode
      };
    } catch (error) {
      throw new Error(`Failed to set point "${point}" to "${value}": ${error}`);
    }
  }

  async health(): Promise<any> {
    try {
      const startTime = Date.now();
      
      if (this.fallbackMode) {
        return {
          status: 'ok',
          mode: 'fallback',
          message: 'MCP server healthy (using mock data)',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          config: {
            username: this.config.username,
            gekkoid: this.config.gekkoid,
            hasCredentials: false
          }
        };
      }
      
      // Try a simple API call to check connectivity
      await this.makeGekkoRequest('var', {});
      
      return {
        status: 'ok',
        mode: 'connected',
        message: 'MCP server healthy and connected to myGEKKO',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        config: {
          username: this.config.username,
          gekkoid: this.config.gekkoid,
          hasCredentials: true
        }
      };
    } catch (error) {
      return {
        status: 'error',
        mode: 'error',
        message: `Health check failed: ${error}`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getUnitForMeteoPoint(item: string): string {
    const units: Record<string, string> = {
      temperature: '°C',
      humidity: '%',
      twilight: 'lx',
      wind: 'm/s'
    };
    return units[item] || '';
  }
}

export const gekkoTools = new GekkoTools();