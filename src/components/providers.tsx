"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { SpaceModeProvider } from "@/contexts/space-mode-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SpaceModeProvider>
        {children}
      </SpaceModeProvider>
    </AuthProvider>
  );
} 