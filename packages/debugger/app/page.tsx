"use client";
import { useQueryState } from "nuqs";
import { Home } from "@/components/Home/Home";
import { Logs } from "@/components/Logs/Logs";
import { Network } from "@/components/Network/Network";

export default function App() {
  const [tab] = useQueryState("tab");

  return (
    <div>
      {(() => {
        switch (tab) {
          case "logs":
            return <Logs />;
          case "network":
            return <Network />;
          default:
            return <Home />;
        }
      })()}
    </div>
  );
}
