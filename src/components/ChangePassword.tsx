'use client';

import React, { useState, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import { userService } from '../services/user-service';
import { authService } from '../services/auth-service';

export default function ChangePassword() {
  useLanguage();
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // 验证码相关状态
  const [userEmail, setUserEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [codeSending, setCodeSending] = useState<boolean>(false);
  const [codeTimer, setCodeTimer] = useState<number>(0);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 获取用户邮箱
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const userData = await userService.getCurrentUser();
        setUserEmail(userData.email);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserEmail();
  }, []);
  
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
    if (!userEmail || codeTimer > 0) return;
    
    try {
      setCodeSending(true);
      setError(null);
      
      await authService.sendVerificationCode(userEmail);
      
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
    if (!verificationCode || !userEmail) return false;
    
    try {
      await authService.verifyEmail(userEmail, verificationCode);
      setEmailVerified(true);
      return true;
    } catch (err) {
      console.error('Failed to verify email:', err);
      setError('验证码错误或已过期');
      return false;
    }
  };
  
  // 验证邮箱
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const verified = await verifyEmailCode();
      if (!verified) {
        setError('验证码错误或已过期');
      }
    } catch (err) {
      console.error('Failed to verify email:', err);
      setError('验证邮箱失败');
    } finally {
      setSaving(false);
    }
  };
  
  // 修改密码
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('新密码和确认密码不匹配');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('新密码长度至少为8个字符');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await userService.updatePassword(currentPassword, newPassword);
      
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEmailVerified(false);
      setVerificationCode('');
    } catch (err) {
      console.error('Failed to update password:', err);
      setError('更新密码失败，请确认当前密码是否正确');
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
    <div className="change-password-container">
      {!emailVerified ? (
        // 邮箱验证表单
        <form onSubmit={handleVerifyEmail}>
          <div className="verification-notice">
            <i className="fas fa-shield-alt"></i>
            <T zh="为了保障您的账户安全，修改密码前需要验证您的邮箱" en="To ensure your account security, please verify your email before changing password" />
          </div>
          
          <div className="form-group">
            <label><T zh="您的邮箱" en="Your Email" /></label>
            <input
              type="email"
              value={userEmail}
              readOnly
              className="form-input"
            />
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
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSendCode}
                disabled={codeSending || codeTimer > 0}
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
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving || !verificationCode}
          >
            {saving ? (
              <><span className="spinner"></span> <T zh="验证中..." en="Verifying..." /></>
            ) : (
              <><i className="fas fa-check-circle"></i> <T zh="验证邮箱" en="Verify Email" /></>
            )}
          </button>
        </form>
      ) : (
        // 密码修改表单
        <form onSubmit={handleSubmit}>
          <div className="success-message verification-success">
            <i className="fas fa-check-circle"></i>
            <T zh="邮箱验证成功，请继续修改密码" en="Email verified successfully, please continue to change your password" />
          </div>
          
          <div className="form-group">
            <label htmlFor="currentPassword"><T zh="当前密码" en="Current Password" /></label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword"><T zh="新密码" en="New Password" /></label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              required
              minLength={8}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword"><T zh="确认新密码" en="Confirm New Password" /></label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              required
              minLength={8}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message"><T zh="密码更新成功！" en="Password updated successfully!" /></div>}
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
          >
            {saving ? (
              <><span className="spinner"></span> <T zh="更新中..." en="Updating..." /></>
            ) : (
              <><i className="fas fa-lock"></i> <T zh="更新密码" en="Update Password" /></>
            )}
          </button>
        </form>
      )}
      
      <style jsx>{`
        .change-password-container {
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
        
        .form-input[readonly] {
          background: var(--bg-secondary, #f5f5f5);
          color: var(--text-muted, #999);
          cursor: not-allowed;
        }
        
        .verification-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          margin-bottom: 16px;
          background-color: rgba(108, 92, 231, 0.1);
          border-radius: 6px;
          color: var(--accent-primary, #6c5ce7);
          font-size: 14px;
        }
        
        .verification-success {
          display: flex;
          align-items: center;
          gap: 8px;
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
        
        :global([data-theme="dark"]) .form-input[readonly] {
          background: var(--bg-tertiary, #21262d);
          color: var(--text-muted, #6e7681);
        }
      `}</style>
    </div>
  );
} 