"use client";

import { ConsoleLogEntry } from "@/lib/types";
import ConsoleLog from "./ConsoleLog";

interface ConsoleViewerProps {
  entries: ConsoleLogEntry[];
  onClear: () => void;
}

export default function ConsoleViewer({
  entries,
  onClear,
}: ConsoleViewerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Console</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">{entries.length} entries</div>
          <button
            onClick={onClear}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-gray-200">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 space-y-2">
              <div>No console logs yet</div>
              <div className="text-xs text-gray-400">
                Waiting for mini apps to connect and send logs...
              </div>
            </div>
          ) : (
            entries.map((entry) => <ConsoleLog key={entry.id} entry={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}
