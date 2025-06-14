'use client';

import React, { useState } from 'react';
import { getEnvConfig } from '../../lib/config/env';
import { geocodingService } from '../../lib/services/geocodingService';

export default function EnvDebug() {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const config = getEnvConfig();

  const testApiKey = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('开始测试API Key...');
      console.log('配置中的API Key:', config.amapApiKey ? `${config.amapApiKey.substring(0, 8)}...` : '未配置');
      console.log('环境变量中的API Key:', process.env.NEXT_PUBLIC_AMAP_API_KEY ? `${process.env.NEXT_PUBLIC_AMAP_API_KEY.substring(0, 8)}...` : '未设置');
      console.log('服务是否配置:', geocodingService.isConfigured());

      // 直接测试API调用
      const testUrl = `https://restapi.amap.com/v3/geocode/geo?key=${config.amapApiKey}&address=北京&output=json`;
      console.log('测试URL:', testUrl.replace(config.amapApiKey, '***'));

      const response = await fetch(testUrl);
      const data = await response.json();
      console.log('API响应:', data);

      if (data.status === '1') {
        const results = await geocodingService.searchCities('北京');
        setTestResult({
          success: true,
          message: '测试成功',
          results: results.length,
          data: results[0],
          apiResponse: data
        });
      } else {
        setTestResult({
          success: false,
          message: `API错误: ${data.info} (${data.infocode})`,
          apiResponse: data
        });
      }
    } catch (error) {
      console.error('API测试失败:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        error: error
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        环境变量调试面板
      </h2>

      {/* 环境变量状态 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">环境变量配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium">APP_URL</div>
            <div className="text-sm text-gray-600">{config.appUrl}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium">API_BASE_URL</div>
            <div className="text-sm text-gray-600">{config.apiBaseUrl}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium">USER_ID</div>
            <div className="text-sm text-gray-600">{config.userId}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium">AMAP_API_KEY</div>
            <div className="text-sm text-gray-600">
              {config.amapApiKey ? 
                `${config.amapApiKey.substring(0, 8)}...` : 
                '❌ 未配置'
              }
            </div>
          </div>
        </div>
      </div>

      {/* 原始环境变量 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">原始环境变量</h3>
        <div className="p-3 bg-gray-50 rounded text-sm font-mono">
          <div>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || '未设置'}</div>
          <div>NEXT_PUBLIC_API_BASE_URL: {process.env.NEXT_PUBLIC_API_BASE_URL || '未设置'}</div>
          <div>NEXT_PUBLIC_USER_ID: {process.env.NEXT_PUBLIC_USER_ID || '未设置'}</div>
          <div>NEXT_PUBLIC_AMAP_API_KEY: {
            process.env.NEXT_PUBLIC_AMAP_API_KEY ? 
            `${process.env.NEXT_PUBLIC_AMAP_API_KEY.substring(0, 8)}...` : 
            '❌ 未设置'
          }</div>
          <div>NODE_ENV: {process.env.NODE_ENV}</div>
        </div>
      </div>

      {/* 服务状态 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">服务状态</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            {geocodingService.isConfigured() ? (
              <span className="text-green-600">✅ 地理编码服务已配置</span>
            ) : (
              <span className="text-red-600">❌ 地理编码服务未配置</span>
            )}
          </div>
        </div>
      </div>

      {/* API测试 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">API测试</h3>
        <button
          onClick={testApiKey}
          disabled={testing || !geocodingService.isConfigured()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {testing ? '测试中...' : '测试API Key'}
        </button>

        {testResult && (
          <div className={`mt-4 p-4 rounded ${
            testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.success ? '✅ 测试成功' : '❌ 测试失败'}
            </div>
            <div className={`text-sm mt-1 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.message}
            </div>
            {testResult.success && testResult.data && (
              <div className="mt-2 text-sm text-gray-600">
                <div>找到 {testResult.results} 个结果</div>
                <div>示例: {testResult.data.city} ({testResult.data.latitude}, {testResult.data.longitude})</div>
              </div>
            )}
            {!testResult.success && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">查看详细错误</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResult.error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* 故障排除建议 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="text-lg font-semibold mb-2 text-yellow-800">故障排除建议</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>1. 确保 .env 文件在项目根目录</li>
          <li>2. 重启开发服务器 (npm run dev)</li>
          <li>3. 检查API Key是否正确（32位字符串）</li>
          <li>4. 确认API Key对应的是"Web服务"类型</li>
          <li>5. 检查高德控制台中的配额使用情况</li>
          <li>6. 确认域名白名单设置（如果有）</li>
        </ul>
      </div>
    </div>
  );
}
