import ConsoleViewer from "@/components/Console/ConsoleViewer";
import { useDebugServer } from "@/hooks/useDebugServer";

export function Logs() {
  const { allLogs, isConnected, connectionStatus, clearLogs } =
    useDebugServer();

  return (
    <div className="h-[calc(100vh)] flex flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            Debug Server: {connectionStatus}
          </span>
        </div>
        <span className="text-xs text-gray-500">ws://localhost:3001</span>
      </div>
      <div className="flex-1 min-h-0">
        <ConsoleViewer entries={allLogs} onClear={clearLogs} />
      </div>
    </div>
  );
}
