import NetworkViewer from "@/components/Network/NetworkViewer";
import { useDebugServer } from "@/hooks/useDebugServer";

export function Network() {
  const { allNetworkRequests, isConnected, connectionStatus, clearNetworkRequests } =
    useDebugServer();

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
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
        <span className="text-xs text-gray-500">ws://localhost:3002</span>
      </div>
      <div className="flex-1 min-h-0">
        <NetworkViewer entries={allNetworkRequests} onClear={clearNetworkRequests} />
      </div>
    </div>
  );
}
