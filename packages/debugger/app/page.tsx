"use client";
import { useQueryState } from "nuqs";
import { Logs } from "@/components/Logs/Logs";
import { Network } from "@/components/Network/Network";
import { Manifest } from "@/components/Manifest/Manifest";

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
          case "manifest":
            return <Manifest />;
          default:
            return <Logs />;
        }
      })()}
    </div>
  );
}
