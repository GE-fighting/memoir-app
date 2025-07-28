'use client';

import React, { useEffect, useState } from 'react';
import { T, useLanguage } from './LanguageContext';
import { userService } from '../services/user-service';
import { authService } from '../services/auth-service';
import { User } from '@/services/api-types';

export default function PersonalInfo() {
  useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Form state
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [originalEmail, setOriginalEmail] = useState<string>('');
  
  // 验证码相关状态
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showVerificationInput, setShowVerificationInput] = useState<boolean>(false);
  const [codeSending, setCodeSending] = useState<boolean>(false);
  const [codeTimer, setCodeTimer] = useState<number>(0);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await userService.getCurrentUser();
        setUser(userData);
        setUsername(userData.username);
        setEmail(userData.email);
        setOriginalEmail(userData.email);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // 监听邮箱变化
  useEffect(() => {
    if (email !== originalEmail) {
      setShowVerificationInput(true);
      setEmailVerified(false);
    } else {
      setShowVerificationInput(false);
      setEmailVerified(true);
    }
  }, [email, originalEmail]);
  
  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (codeTimer > 0) {
      timer = setTimeout(() => {
        setCodeTimer(codeTimer - 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [codeTimer]);
  
  // 发送验证码
  const handleSendCode = async () => {
    if (!email || email === originalEmail || codeTimer > 0) return;
    
    try {
      setCodeSending(true);
      setError(null);
      
      await authService.sendVerificationCode(email);
      
      // 设置60秒倒计时
      setCodeTimer(60);
      
    } catch (err) {
      console.error('Failed to send verification code:', err);
      setError('发送验证码失败');
    } finally {
      setCodeSending(false);
    }
  };
  
  // 验证验证码
  const verifyEmailCode = async (): Promise<boolean> => {
    if (!verificationCode || !email) return false;
    
    try {
      await authService.verifyEmail(email, verificationCode);
      setEmailVerified(true);
      return true;
    } catch (err) {
      console.error('Failed to verify email:', err);
      setError('验证码错误或已过期');
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // 如果邮箱已更改且未验证，先验证邮箱
      if (email !== originalEmail && !emailVerified) {
        const verified = await verifyEmailCode();
        if (!verified) {
          setSaving(false);
          return;
        }
      }
      
      // 更新用户信息
      await userService.updateUser({
        username,
        email
      });
      
      setSuccess(true);
      
      // 刷新用户数据
      const userData = await userService.getCurrentUser();
      setUser(userData);
      setOriginalEmail(userData.email);
      setShowVerificationInput(false);
      setVerificationCode('');
      
    } catch (err) {
      console.error('Failed to update user information:', err);
      setError('更新用户信息失败');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p><T zh="加载中..." en="Loading..." /></p>
      </div>
    );
  }
  
  return (
    <div className="personal-info-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username"><T zh="用户名" en="Username" /></label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email"><T zh="邮箱" en="Email" /></label>
          <div className="input-group">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>
        
        {showVerificationInput && (
          <>
            <div className="verification-notice">
              <i className="fas fa-info-circle"></i>
              <T zh="更改邮箱需要验证" en="Email verification required" />
            </div>
            
            <div className="form-group">
              <label htmlFor="verificationCode"><T zh="验证码" en="Verification Code" /></label>
              <div className="input-group">
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="form-input"
                  placeholder="请输入6位验证码"
                  required={showVerificationInput}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSendCode}
                  disabled={codeSending || codeTimer > 0 || !email}
                >
                  {codeSending ? (
                    <span className="spinner"></span>
                  ) : codeTimer > 0 ? (
                    `${codeTimer}s`
                  ) : (
                    <T zh="发送验证码" en="Send Code" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message"><T zh="个人信息更新成功！" en="Personal information updated successfully!" /></div>}
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={saving || (showVerificationInput && !verificationCode)}
        >
          {saving ? (
            <><span className="spinner"></span> <T zh="保存中..." en="Saving..." /></>
          ) : (
            <><i className="fas fa-save"></i> <T zh="保存更改" en="Save Changes" /></>
          )}
        </button>
      </form>
      
      <style jsx>{`
        .personal-info-container {
          width: 100%;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          color: var(--text-secondary, #555);
        }
        
        .input-group {
          display: flex;
          gap: 8px;
        }
        
        .input-group .form-input {
          flex: 1;
        }
        
        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border-primary, #ddd);
          border-radius: 6px;
          font-size: 14px;
          background: var(--bg-card, white);
          color: var(--text-primary, #333);
          transition: border-color 0.2s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary, #6c5ce7);
          box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.1);
        }
        
        .verification-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          margin-bottom: 16px;
          background-color: rgba(108, 92, 231, 0.1);
          border-radius: 6px;
          color: var(--accent-primary, #6c5ce7);
          font-size: 14px;
        }
        
        .error-message {
          color: var(--error, #e74c3c);
          margin-bottom: 16px;
          padding: 8px;
          border-radius: 4px;
          background-color: rgba(231, 76, 60, 0.1);
        }
        
        .success-message {
          color: var(--success, #2ecc71);
          margin-bottom: 16px;
          padding: 8px;
          border-radius: 4px;
          background-color: rgba(46, 204, 113, 0.1);
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-primary {
          background: var(--accent-primary, #6c5ce7);
          color: var(--text-inverse, white);
          width: 100%;
        }
        
        .btn-secondary {
          background: var(--bg-secondary, #f5f5f5);
          color: var(--text-primary, #333);
          min-width: 120px;
        }
        
        .btn-primary:hover {
          background: var(--accent-hover, #5b4ecc);
        }
        
        .btn-secondary:hover {
          background: var(--bg-tertiary, #e5e5e5);
        }
        
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .loading-spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 3px solid var(--accent-primary, #6c5ce7);
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* 深色主题适配 */
        :global([data-theme="dark"]) .btn-secondary {
          background: var(--bg-tertiary, #21262d);
          color: var(--text-primary, #c9d1d9);
        }
        
        :global([data-theme="dark"]) .btn-secondary:hover {
          background: var(--bg-quaternary, #30363d);
        }
      `}</style>
    </div>
  );
} 