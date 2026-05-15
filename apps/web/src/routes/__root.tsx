import { AppShell, type ShellLinkProps, ThemeProvider } from "@mdcz/views/shell";
import { useQuery } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { api } from "../client";
import { LoginPage } from "../components/auth/LoginPage";
import { useWebTaskSync } from "../hooks/useWebTaskSync";

const PUBLIC_PATHS = new Set(["/setup", "/login"]);

const ShellLink = ({ to, className, onFocus, onMouseEnter, children }: ShellLinkProps) => (
  <a className={className} href={to} onFocus={onFocus} onMouseEnter={onMouseEnter}>
    {children}
  </a>
);

export const RootLayout = ({ children }: { children: ReactNode }) => {
  const pathname = window.location.pathname;
  const authQ = useQuery({ queryKey: ["auth", "status"], queryFn: () => api.auth.status(), retry: false });

  if (authQ.isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-surface-canvas text-sm text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (authQ.data?.setupRequired && pathname !== "/setup") {
    window.location.replace("/setup");
    return null;
  }

  if (!authQ.data?.setupRequired && pathname === "/setup") {
    window.location.replace("/");
    return null;
  }

  if (!authQ.data?.setupRequired && !authQ.data?.authenticated && !PUBLIC_PATHS.has(pathname)) {
    return <LoginPage />;
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return <AuthenticatedShell pathname={pathname}>{children}</AuthenticatedShell>;
};

const AuthenticatedShell = ({ children, pathname }: { children: ReactNode; pathname: string }) => {
  useWebTaskSync();

  return (
    <ThemeProvider>
      <AppShell currentPath={pathname} linkComponent={ShellLink}>
        {children}
      </AppShell>
    </ThemeProvider>
  );
};

export const Route = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
});
