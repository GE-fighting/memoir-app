// memoir-app/src/app/auth/login/page.tsx

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { errorHandler } from "@/utils/error-handler";
import AuthVerify from "@/components/auth/auth-verify";

// Zod schema for validation
const loginSchema = z.object({
  identifier: z.string().min(1, "请输入用户名或邮箱"),
  password: z.string().min(1, "请输入密码"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    setSuccess(false);
    try {
      // 确定是用户名还是邮箱
      const isEmail = data.identifier.includes("@");
      const username = isEmail ? "" : data.identifier;
      const email = isEmail ? data.identifier : "";
      
      // 使用auth上下文的login方法
      const loginSuccess = await login(username, email, data.password);
      
      if (loginSuccess) {
        setSuccess(true);
        // 设置延迟以显示成功消息
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setApiError("登录失败，请检查用户名/邮箱和密码");
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
        <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-600 to-purple-700 p-12 text-white lg:flex">
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
            <p>© 2024 Memoir · 美好时刻，永久珍藏</p>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex w-full flex-col items-center justify-center bg-gray-50 px-4 py-8 md:px-6 lg:w-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl sm:p-10"
          >
            <div className="mb-6 text-center sm:mb-8">
              <h2 className="text-3xl font-bold text-gray-800">欢迎回来</h2>
              <p className="mt-2 text-gray-600">请登录您的Memoir账户</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">用户名/邮箱</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    {...register("identifier")}
                    className="w-full rounded-lg border border-gray-300 pl-10 px-4 py-2.5 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="输入用户名或邮箱"
                    autoComplete="username"
                  />
                  {errors.identifier && (
                    <p className="mt-1 text-sm text-red-500">{errors.identifier.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">密码</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    {...register("password")}
                    className="w-full rounded-lg border border-gray-300 pl-10 px-4 py-2.5 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="输入密码"
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    记住我
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    忘记密码?
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 px-4 text-center text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      登录中...
                    </div>
                  ) : "登录"}
                </button>
              </div>

              {apiError && (
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-center text-sm text-red-500"
                >
                  {apiError}
                </motion.p>
              )}
              
              {success && (
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-center text-sm text-green-600"
                >
                  登录成功！
                </motion.p>
              )}
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">或者</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/auth/register"
                  className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  还没有账号？立即注册
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AuthVerify>
  );
}