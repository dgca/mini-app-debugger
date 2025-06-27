"use client";

import OriginManifest from "./OriginManifest";

interface ManifestViewerProps {
  origins: Set<string>;
}

export default function ManifestViewer({ origins }: ManifestViewerProps) {
  const originsList = Array.from(origins).sort();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Manifest</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">{originsList.length} origins</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-gray-200">
          {originsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 space-y-2">
              <div>No origins detected yet</div>
              <div className="text-xs text-gray-400">
                Waiting for mini apps to connect...
              </div>
            </div>
          ) : (
            originsList.map((origin) => (
              <OriginManifest key={origin} origin={origin} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
