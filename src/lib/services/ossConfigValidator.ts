import OSS from 'ali-oss';

/**
 * OSS配置验证结果
 */
export interface OSSConfigValidationResult {
  success: boolean;
  issues: string[];
  details?: any;
}

/**
 * 验证OSS配置是否正确
 * @param client OSS客户端实例
 * @returns 验证结果
 */
export async function validateOSSConfig(client: OSS): Promise<OSSConfigValidationResult> {
  const result: OSSConfigValidationResult = {
    success: true,
    issues: []
  };

  try {
    // 1. 验证CORS配置
    const corsResult = await validateCORSConfig(client);
    if (!corsResult.success) {
      result.success = false;
      result.issues.push(...corsResult.issues);
      result.details = { ...result.details, cors: corsResult.details };
    }

    return result;
  } catch (error) {
    console.error('验证OSS配置时出错:', error);
    return {
      success: false,
      issues: ['验证OSS配置时出错: ' + (error instanceof Error ? error.message : String(error))]
    };
  }
}

/**
 * 验证OSS的CORS配置是否正确
 * @param client OSS客户端实例
 * @returns 验证结果
 */
export async function validateCORSConfig(client: OSS): Promise<OSSConfigValidationResult> {
  const result: OSSConfigValidationResult = {
    success: true,
    issues: [],
    details: { corsRules: [] }
  };

  try {
    // 获取当前的CORS配置
    const corsResult = await client.getBucketCORS((client as any).options.bucket);
    const corsRules = corsResult.rules || [];
    result.details!.corsRules = corsRules;

    if (corsRules.length === 0) {
      result.success = false;
      result.issues.push('OSS Bucket未配置CORS规则，这可能会导致浏览器端上传失败');
      return result;
    }

    // 检查是否有规则包含ETag在expose-headers中
    let hasETagExposed = false;
    for (const rule of corsRules) {
      const exposedHeaders = rule.allowedHeader || [];
      if (
        rule.exposeHeader && 
        (rule.exposeHeader.includes('ETag') || 
         rule.exposeHeader.includes('etag') || 
         rule.exposeHeader.includes('*'))
      ) {
        hasETagExposed = true;
        break;
      }
    }

    if (!hasETagExposed) {
      result.success = false;
      result.issues.push(
        'OSS CORS配置中缺少ETag在expose-headers中，这将导致分片上传失败。' +
        '请参考文档：docs/oss-cors-config.md'
      );
    }

    return result;
  } catch (error) {
    console.error('验证CORS配置时出错:', error);
    return {
      success: false,
      issues: ['验证CORS配置时出错: ' + (error instanceof Error ? error.message : String(error))],
      details: { error }
    };
  }
}

/**
 * 检查并修复常见的OSS配置问题
 * @param client OSS客户端实例
 * @returns 修复结果
 */
export async function fixCommonOSSConfigIssues(client: OSS): Promise<OSSConfigValidationResult> {
  const result: OSSConfigValidationResult = {
    success: true,
    issues: []
  };

  try {
    // 验证当前配置
    const validationResult = await validateOSSConfig(client);
    if (validationResult.success) {
      result.issues.push('OSS配置已经正确，无需修复');
      return result;
    }

    // 获取当前的CORS配置
    let corsResult;
    try {
      corsResult = await client.getBucketCORS((client as any).options.bucket);
    } catch (error) {
      // 如果获取失败，可能是因为没有配置CORS
      corsResult = { rules: [] };
    }

    const corsRules = corsResult.rules || [];
    
    // 创建或修改CORS规则
    const updatedRules = [...corsRules];
    
    // 检查是否有规则包含ETag在expose-headers中
    let hasETagExposed = false;
    for (const rule of updatedRules) {
      if (rule.exposeHeader && Array.isArray(rule.exposeHeader)) {
        if (!rule.exposeHeader.includes('ETag') && !rule.exposeHeader.includes('etag')) {
          rule.exposeHeader.push('ETag');
          hasETagExposed = true;
        } else {
          hasETagExposed = true;
        }
      } else if (rule.exposeHeader) {
        // 如果不是数组，可能是字符串
        if (typeof rule.exposeHeader === 'string' && 
            !rule.exposeHeader.includes('ETag') && 
            !rule.exposeHeader.includes('etag')) {
          rule.exposeHeader = `${rule.exposeHeader},ETag`;
          hasETagExposed = true;
        } else {
          hasETagExposed = true;
        }
      } else {
        rule.exposeHeader = ['ETag', 'x-oss-request-id'];
        hasETagExposed = true;
      }
    }

    // 如果没有任何规则或没有规则包含ETag，添加一个新规则
    if (!hasETagExposed) {
      updatedRules.push({
        allowedOrigin: ['*'],
        allowedMethod: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
        allowedHeader: ['*'],
        exposeHeader: ['ETag', 'x-oss-request-id'],
        maxAgeSeconds: '600'
      });
    }

    // 更新CORS配置
    await client.putBucketCORS((client as any).options.bucket, updatedRules);
    
    result.issues.push('OSS CORS配置已更新，已添加ETag到expose-headers中');
    
    // 再次验证配置
    const revalidateResult = await validateOSSConfig(client);
    if (!revalidateResult.success) {
      result.success = false;
      result.issues.push('更新CORS配置后仍存在问题:');
      result.issues.push(...revalidateResult.issues);
    }

    return result;
  } catch (error) {
    console.error('修复OSS配置时出错:', error);
    return {
      success: false,
      issues: ['修复OSS配置时出错: ' + (error instanceof Error ? error.message : String(error))]
    };
  }
} 