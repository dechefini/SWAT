import { FC, PropsWithChildren } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export const MainLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <TopBar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
