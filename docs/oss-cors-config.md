# 阿里云OSS跨域(CORS)配置指南

## 概述

在使用浏览器直接上传文件到阿里云OSS时，特别是使用分片上传功能时，需要正确配置OSS的跨域资源共享(CORS)规则，以避免出现`Please set the etag of expose-headers in OSS`等错误。

## 常见错误

当CORS配置不正确时，可能会遇到以下错误：

```
Failed to upload some parts with error: Error: Please set the etag of expose-headers in OSS https://help.aliyun.com/document_detail/32069.html part_num: 2
```

这个错误表示在分片上传过程中，浏览器无法获取到OSS返回的ETag头信息，导致上传失败。

## 解决方案

### 方法一：通过OSS控制台配置

1. 登录[阿里云OSS管理控制台](https://oss.console.aliyun.com/)
2. 在左侧导航栏选择**Bucket列表**，然后选择需要配置的Bucket
3. 点击**数据安全** > **跨域设置**
4. 点击**创建规则**
5. 在创建跨域规则面板中，进行如下设置：
   - **来源**：设置为允许的域名，例如 `*` (表示允许所有域名，生产环境建议设置为具体域名)
   - **允许Methods**：选择 `GET`, `POST`, `PUT`, `DELETE`, `HEAD`
   - **允许Headers**：设置为 `*`
   - **暴露Headers**：必须包含 `ETag`，建议设置为 `ETag,x-oss-request-id`
   - **缓存时间**：设置为适当的值，例如 `600` 秒
6. 点击**确定**保存规则

### 方法二：通过API或SDK配置

如果您需要通过API或SDK配置CORS规则，可以参考以下示例：

```javascript
const OSS = require('ali-oss');

async function configureCORS() {
  const client = new OSS({
    region: 'oss-cn-hangzhou',  // 替换为您的地域
    accessKeyId: 'your-access-key-id',
    accessKeySecret: 'your-access-key-secret',
    bucket: 'your-bucket-name'
  });
  
  const corsRules = [{
    allowedOrigin: ['*'],
    allowedMethod: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
    allowedHeader: ['*'],
    exposedHeader: ['ETag', 'x-oss-request-id'],
    maxAgeSeconds: 600
  }];
  
  try {
    await client.putBucketCORS('your-bucket-name', corsRules);
    console.log('CORS规则设置成功');
  } catch (err) {
    console.error('设置CORS规则失败:', err);
  }
}
```

## 验证配置

配置完成后，可以通过以下方式验证CORS配置是否正确：

1. 在浏览器中打开开发者工具(F12)
2. 尝试上传一个小文件
3. 在网络请求中查看OSS的响应头，确认是否包含ETag头，以及浏览器是否能够正常获取到该头信息

## 注意事项

1. 如果您的应用使用了CDN，请确保CDN也正确配置了CORS规则
2. 在生产环境中，建议将来源(Origin)设置为具体的域名，而不是通配符`*`
3. 如果您有多条CORS规则，请检查它们之间是否存在冲突
4. 配置更改可能需要几分钟时间才能生效

## 参考文档

- [阿里云OSS CORS配置官方文档](https://help.aliyun.com/document_detail/32069.html)
- [OSS分片上传说明](https://help.aliyun.com/zh/oss/developer-reference/multipart-upload-11) 