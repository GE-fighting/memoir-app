/**
 * 高德地图地理编码服务测试
 * 
 * 注意：这些测试需要有效的API Key才能运行
 * 在运行测试前，请确保环境变量 NEXT_PUBLIC_AMAP_API_KEY 已正确配置
 */

import { geocodingService } from '../geocodingService';

// 模拟环境变量
const mockApiKey = 'test_api_key';

// 模拟fetch响应
const mockSuccessResponse = {
  status: '1',
  info: 'OK',
  infocode: '10000',
  count: '1',
  geocodes: [
    {
      formatted_address: '北京市',
      country: '中国',
      province: '北京市',
      citycode: '010',
      city: '北京市',
      district: '',
      township: '',
      neighborhood: { name: '', type: '' },
      building: { name: '', type: '' },
      adcode: '110000',
      street: '',
      number: '',
      location: '116.407526,39.90403',
      level: '省'
    }
  ]
};

describe('GeocodingService', () => {
  beforeEach(() => {
    // 重置fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('geocode', () => {
    it('应该成功获取城市的经纬度', async () => {
      // 模拟成功的API响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const results = await geocodingService.geocode('北京');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        name: '北京',
        formattedAddress: '北京市',
        latitude: 39.90403,
        longitude: 116.407526,
        city: '北京市',
        province: '北京市',
        country: '中国'
      });
    });

    it('应该处理空输入', async () => {
      const results = await geocodingService.geocode('');
      expect(results).toEqual([]);
    });

    it('应该处理API错误', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: '0',
          info: 'INVALID_USER_KEY',
          infocode: '10001'
        }),
      });

      await expect(geocodingService.geocode('北京')).rejects.toThrow('高德地图API错误');
    });

    it('应该处理网络错误', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(geocodingService.geocode('北京')).rejects.toThrow('Network error');
    });
  });

  describe('searchCities', () => {
    it('应该搜索城市并返回结果', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const results = await geocodingService.searchCities('北京');

      expect(results).toHaveLength(1);
      expect(results[0].city).toBe('北京市');
    });

    it('应该处理空查询', async () => {
      const results = await geocodingService.searchCities('');
      expect(results).toEqual([]);
    });

    it('应该限制返回结果数量', async () => {
      // 模拟多个结果
      const multipleResults = {
        ...mockSuccessResponse,
        count: '15',
        geocodes: Array(15).fill(mockSuccessResponse.geocodes[0])
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => multipleResults,
      });

      const results = await geocodingService.searchCities('北京');

      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('isConfigured', () => {
    it('应该检查API Key是否配置', () => {
      // 这个测试依赖于实际的环境变量配置
      const isConfigured = geocodingService.isConfigured();
      expect(typeof isConfigured).toBe('boolean');
    });
  });
});

// 集成测试（需要真实的API Key）
describe('GeocodingService Integration Tests', () => {
  // 跳过集成测试，除非有真实的API Key
  const hasApiKey = process.env.NEXT_PUBLIC_AMAP_API_KEY && 
                   process.env.NEXT_PUBLIC_AMAP_API_KEY !== '';

  const testCases = [
    { input: '北京', expected: { city: '北京', hasCoordinates: true } },
    { input: 'Shanghai', expected: { city: '上海', hasCoordinates: true } },
    { input: '广州市', expected: { city: '广州', hasCoordinates: true } },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`应该能够搜索 "${input}"`, async () => {
      if (!hasApiKey) {
        console.log('跳过集成测试：未配置API Key');
        return;
      }

      try {
        const results = await geocodingService.searchCities(input);
        
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].latitude).toBeDefined();
        expect(results[0].longitude).toBeDefined();
        expect(typeof results[0].latitude).toBe('number');
        expect(typeof results[0].longitude).toBe('number');
      } catch (error) {
        console.error(`搜索 "${input}" 失败:`, error);
        throw error;
      }
    }, 10000); // 10秒超时
  });
});
