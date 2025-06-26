import ConsoleViewer from '@/components/Console/ConsoleViewer'
import { useDebugServer } from '@/hooks/useDebugServer'

export function Logs() {
  const { allLogs, isConnected, connectionStatus } = useDebugServer()

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium text-gray-700">
            Debug Server: {connectionStatus}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          ws://localhost:3001
        </span>
      </div>
      <div className="flex-1">
        <ConsoleViewer entries={allLogs} />
      </div>
    </div>
  );
}
