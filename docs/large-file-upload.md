# 大文件上传指南

## 概述

本文档介绍了如何使用改进的OSS上传功能来处理大文件上传（如视频文件），避免超时错误。

## 技术实现

我们实现了一个智能的文件上传系统，具有以下特点：

1. **自动选择上传方式**：
   - 小文件（<50MB）：使用简单上传（client.put）
   - 大文件（≥50MB）：使用分片上传（client.multipartUpload）

2. **分片上传优化**：
   - 分片大小：1MB
   - 并行上传：5个分片同时上传
   - 超时设置：120秒（比默认的60秒更长）

3. **错误处理与恢复**：
   - 自动重试：最多3次
   - 断点续传：在网络中断后可以从已上传的部分继续

4. **进度跟踪**：
   - 实时显示上传进度
   - 分片上传也支持进度回调

## 常见问题及解决方案

### 1. 连接超时错误

**错误信息**：
```
Connect timeout for 60000ms. PUT https://memoir-storage.oss-cn-nanjing.aliyuncs.com/...
```

**解决方案**：
- 我们已经将超时时间从60秒增加到120秒
- 对于大文件，自动使用分片上传而非简单上传
- 如果仍然超时，可能是网络问题，建议使用更稳定的网络环境

### 2. ETag错误

**错误信息**：
```
Failed to upload some parts with error: Error: Please set the etag of expose-headers in OSS https://help.aliyun.com/document_detail/32069.html part_num: 2
```

**原因**：
此错误是由于阿里云OSS的CORS（跨域资源共享）配置中没有设置暴露ETag头信息。在分片上传过程中，浏览器需要访问OSS返回的ETag头来验证分片的完整性。

**解决方案**：
1. 登录阿里云OSS控制台
2. 找到对应的Bucket
3. 点击"数据安全" > "跨域设置"
4. 添加或修改CORS规则，确保"暴露Headers"中包含"ETag"
5. 详细步骤请参考：[docs/oss-cors-config.md](oss-cors-config.md)

### 3. 上传速度慢

**解决方案**：
- 检查网络环境，尽量使用有线网络或稳定的WiFi
- 考虑使用阿里云OSS的传输加速功能
- 减小分片大小（当前为1MB），可以尝试设置为512KB

## 使用方法

### 基本用法

```typescript
import { uploadFileToOSS, getOSSClient } from '@/lib/services/ossService';

// 获取OSS客户端
const client = await getOSSClient();

// 定义进度回调函数
const onProgress = (progress: number) => {
  console.log(`上传进度: ${progress}%`);
};

// 上传文件
const url = await uploadFileToOSS(client, file, objectKey, onProgress);
console.log(`文件上传成功，URL: ${url}`);
```

### 在React组件中使用

我们提供了两个Hook来简化上传操作：

1. **useOSSUpload**: 用于个人空间的文件上传
2. **useAlbumUpload**: 用于相册的文件上传

示例：

```tsx
import { useOSSUpload } from '@/lib/hooks/useOSSUpload';

const MyComponent = () => {
  const { uploadFile, progress, status, error } = useOSSUpload();
  
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const result = await uploadFile(file);
        console.log('上传成功:', result.url);
      } catch (err) {
        console.error('上传失败:', err);
      }
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileSelect} />
      {status === 'uploading' && <div>上传进度: {progress[Object.keys(progress)[0]]}%</div>}
      {error && <div className="error">{error.message}</div>}
    </div>
  );
};
```

## 验证OSS配置

为了确保OSS配置正确，特别是CORS设置，我们提供了配置验证工具：

```typescript
import { validateOSSConfig } from '@/lib/services/ossConfigValidator';

// 获取OSS客户端
const client = await getOSSClient();

// 验证OSS配置
const validationResult = await validateOSSConfig(client);
if (!validationResult.success) {
  console.warn('OSS配置存在问题:', validationResult.issues);
}
```

### 禁用CORS验证

如果您的OSS已经配置正确，并且能够成功上传大文件，可以禁用CORS验证以避免不必要的API调用和警告：

```typescript
// 在应用初始化时设置
import { OSSConfig } from '@/lib/services/ossService';

// 禁用CORS验证
OSSConfig.enableCORSValidation = false;
```

默认情况下，CORS验证是禁用的，因为一旦OSS配置正确，就不再需要每次上传前验证。

## 最佳实践

1. **文件大小限制**：
   - 虽然系统支持大文件上传，但建议限制上传文件大小在500MB以内
   - 对于更大的文件，考虑使用专业的视频处理服务

2. **网络环境**：
   - 稳定的网络环境对大文件上传至关重要
   - 移动网络环境下上传大文件可能会遇到更多中断

3. **文件类型验证**：
   - 在上传前验证文件类型和大小
   - 对于视频文件，支持的格式包括：MP4, MOV, AVI等

4. **错误处理**：
   - 始终使用try/catch处理上传过程中可能出现的错误
   - 为用户提供清晰的错误提示和重试选项

## 常见问题

1. **上传超时**：
   - 如果仍然遇到超时问题，可能是网络不稳定或文件过大
   - 尝试在网络更稳定的环境下上传，或减小文件大小

2. **上传进度卡住**：
   - 这可能是因为某个分片上传失败并正在重试
   - 系统会自动处理重试，请耐心等待

3. **上传后无法访问文件**：
   - 检查返回的URL是否正确
   - 可能需要使用`getSignedUrl`函数获取带授权的访问URL

## 技术细节

分片上传过程：

1. 文件被分割成多个1MB大小的分片
2. 系统并行上传多个分片（默认5个）
3. 所有分片上传完成后，OSS服务器将这些分片组合成完整文件
4. 如果上传过程中断，系统会从已上传的部分继续

关键配置参数：

```typescript
const options = {
  parallel: 5,        // 并行上传分片数
  partSize: 1048576,  // 分片大小（1MB）
  timeout: 120000,    // 超时时间（120秒）
  headers: {
    'Cache-Control': 'max-age=31536000'
  }
};
``` 