import type { ReactNode } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";

export interface MainLayoutProps {
  children: ReactNode;
  hideRightSidebar?: boolean;
}

export function MainLayout({ children, hideRightSidebar = false }: MainLayoutProps) {
  return (
    <div className="app-layout-shell">
      <LeftSidebar />
      <main className="app-center-stream">{children}</main>
      {!hideRightSidebar && <RightSidebar />}
    </div>
  );
}
