"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { errorHandler } from "@/utils/error-handler";
import { authService } from "@/services/auth-service";
import AuthVerify from "@/components/auth/auth-verify";
import { useTheme } from "@/contexts/theme-context";

// Zod schema matches backend DTO requirements in Chinese
const registerSchema = z.object({
  username: z.string().min(3, "用户名至少需要3个字符").max(50, "用户名不能超过50个字符"),
  email: z.string().email("请输入有效的电子邮箱"),
  password: z.string().min(6, "密码至少需要6个字符"),
  verification_code: z.string().min(4, "请输入有效的验证码").max(6, "请输入有效的验证码"),
  pair_token: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { theme } = useTheme();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      verification_code: "",
    }
  });

  // 监听邮箱输入
  const watchEmail = watch("email");

  // 处理倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // 发送验证码
  const sendVerificationCode = async () => {
    if (!watchEmail || !watchEmail.match(/^\S+@\S+\.\S+$/)) {
      setApiError("请输入有效的电子邮箱");
      return;
    }

    setIsSendingCode(true);
    setApiError(null);

    try {
      await authService.sendVerificationCode(watchEmail);
        setCountdown(60); // 60秒倒计时
        setApiError(null);
    } catch (error) {
      const errorMessage = errorHandler.parseApiError(error);
      setApiError(errorMessage || "发送验证码失败，请稍后再试");
    } finally {
      setIsSendingCode(false);
    }
  };

  // 验证邮箱
  const verifyEmailCode = async (email: string, code: string) => {
    try {
        await authService.verifyEmail(email, code);
        setVerifySuccess(true);
        return true;
    } catch (error) {
      const errorMessage = errorHandler.parseApiError(error);
      setApiError(errorMessage || "验证失败，请重试");
      return false;
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    setSuccess(false);

    try {
      // 首先验证邮箱
      const verified = await verifyEmailCode(data.email, data.verification_code);
      if (!verified) {
        return;
      }

      // 使用auth上下文的register方法
      const registerSuccess = await registerUser(
        data.username, 
        data.email, 
        data.password, 
        data.pair_token
      );
      
      if (registerSuccess) {
        setSuccess(true);
        // 设置延迟以显示成功消息
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setApiError("注册失败，请检查您的信息或尝试使用其他用户名/邮箱");
      }
    } catch (error) {
      const errorMessage = errorHandler.getAuthErrorMessage(error);
      setApiError(errorMessage);
    }
  };

  return (
    <AuthVerify requireAuth={false} redirectTo="/dashboard">
      <div className="flex min-h-screen w-full">
        {/* Left side - Decorative */}
        <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-purple-600 to-blue-600 p-12 text-white lg:flex">
          <div className="mb-8">
            <h1 className="text-4xl font-light tracking-wide">
              <span className="font-serif italic tracking-tighter">Memoir</span>
            </h1>
            <p className="mt-2 text-sm font-light opacity-80">记录美好，珍藏回忆</p>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex h-full items-center justify-center"
          >
            <div className="w-full max-w-xs mx-auto opacity-75">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path fill="url(#grad1)" d="M40,90 C40,70 50,50 80,50 C110,50 120,70 120,90 C120,110 110,130 80,130 C50,130 40,110 40,90 Z" />
                <path fill="url(#grad1)" d="M100,40 C100,20 110,0 140,0 C170,0 180,20 180,40 C180,60 170,80 140,80 C110,80 100,60 100,40 Z" opacity="0.6" />
                <circle cx="70" cy="70" r="10" fill="#FFFFFF" opacity="0.6" />
                <circle cx="140" cy="90" r="15" fill="#FFFFFF" opacity="0.4" />
                <circle cx="90" cy="100" r="8" fill="#FFFFFF" opacity="0.7" />
              </svg>
            </div>
          </motion.div>
          <div className="mt-8 text-xs opacity-60">
            <p>© {currentYear} Memoir · 美好时刻，永久珍藏</p>
          </div>
        </div>

        {/* Right side - Register form */}
        <div className="flex w-full flex-col items-center justify-center px-4 py-8 md:px-6 lg:w-1/2" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg rounded-2xl p-8 sm:p-10"
            style={{
              backgroundColor: 'var(--bg-card)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-primary)'
            }}
          >
            <div className="mb-6 text-center sm:mb-8">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>创建账户</h2>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>开始记录您的美好回忆</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>用户名</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    {...register("username")}
                    className="w-full rounded-lg pl-10 px-4 py-2.5 shadow-sm transition focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-focus)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)';
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    placeholder="输入您的用户名"
                    autoComplete="username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--accent-danger)' }}>{errors.username.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>电子邮箱</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-lg pl-10 px-4 py-2.5 shadow-sm transition focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-focus)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)';
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    placeholder="输入您的电子邮箱"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--accent-danger)' }}>{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>验证码</label>
                <div className="relative mt-1 flex">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    {...register("verification_code")}
                    className="w-full rounded-lg pl-10 px-4 py-2.5 shadow-sm transition focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-focus)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)';
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    placeholder="输入验证码"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="ml-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition"
                    style={{
                      backgroundColor: countdown > 0 ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                      color: countdown > 0 ? 'var(--text-tertiary)' : 'var(--text-inverse)',
                    }}
                    disabled={countdown > 0 || !watchEmail || isSendingCode}
                    onClick={sendVerificationCode}
                  >
                    {isSendingCode ? "发送中..." : countdown > 0 ? `重新发送(${countdown}s)` : "获取验证码"}
                  </button>
                  {errors.verification_code && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--accent-danger)' }}>{errors.verification_code.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>密码</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    {...register("password")}
                    className="w-full rounded-lg pl-10 px-4 py-2.5 shadow-sm transition focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-focus)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)';
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    placeholder="设置您的密码"
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--accent-danger)' }}>{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>配对码（可选）</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    {...register("pair_token")}
                    className="w-full rounded-lg pl-10 px-4 py-2.5 shadow-sm transition focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-focus)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-primary)';
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    placeholder="如有配对码请输入"
                  />
                  {errors.pair_token && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--accent-danger)' }}>{errors.pair_token.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg py-3 px-4 text-center text-sm font-semibold transition focus:outline-none focus:ring-2 disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(to right, var(--accent-secondary), var(--accent-primary))',
                    color: 'var(--text-inverse)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" style={{ color: 'var(--text-inverse)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      注册中...
                    </div>
                  ) : "注册"}
                </button>
              </div>

              {apiError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm"
                  style={{ color: 'var(--accent-danger)' }}
                >
                  {apiError}
                </motion.p>
              )}

              {success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm"
                  style={{ color: 'var(--accent-success)' }}
                >
                  注册成功！
                </motion.p>
              )}

              {verifySuccess && !success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm"
                  style={{ color: 'var(--accent-success)' }}
                >
                  {/* 邮箱验证成功！正在完成注册... */}
                </motion.p>
              )}
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--border-primary)' }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-tertiary)' }}>或者</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="flex w-full items-center justify-center rounded-lg py-2.5 px-4 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2"
                  style={{
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                  已有账号？立即登录
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AuthVerify>
  );
}
