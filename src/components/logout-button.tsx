"use client";

import { useAuth } from "@/contexts/auth-context";

type LogoutButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({ 
  className = "",
  children
}: LogoutButtonProps) {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${className}`}
    >
      {children || (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.707a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L10 10.414V14a1 1 0 102 0v-3.586l1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
          退出登录
        </>
      )}
    </button>
  );
} 