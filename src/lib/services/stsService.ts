/**
 * Service for fetching STS tokens from the backend API
 */

import axios from 'axios';
import { getEnvConfig } from '../config/env';

export type STSToken = {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  region: string;
  bucket: string;
};

/**
 * Fetches a temporary STS token for OSS operations
 * 
 * @param category - Optional category to scope the token to a specific directory
 * @returns STS token information including credentials and bucket details
 */
export async function fetchSTSToken(category?: string): Promise<STSToken> {
  const config = getEnvConfig();
  const response = await axios.post(
    `${config.apiBaseUrl}/v1/oss/token`,
    { category },
    {
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if you have auth
        // 'Authorization': `Bearer ${token}`
      },
    }
  );
  
  return response.data;
} 