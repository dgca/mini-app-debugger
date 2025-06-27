"use client";

import { useState } from "react";

interface OriginManifestProps {
  origin: string;
}

interface ManifestData {
  loading: boolean;
  data?: unknown;
  error?: string;
}

export default function OriginManifest({ origin }: OriginManifestProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [manifest, setManifest] = useState<ManifestData>({ loading: false });

  const formatManifestData = (data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Failed to format JSON';
    }
  };

  const fetchManifest = async () => {
    if (manifest.data || manifest.loading) return;

    setManifest({ loading: true });
    try {
      const response = await fetch(`/api/manifest?origin=${encodeURIComponent(origin)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      setManifest({ loading: false, data });
    } catch (error) {
      setManifest({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch manifest'
      });
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && !manifest.data && !manifest.error) {
      fetchManifest();
    }
  };

  return (
    <div className="border-b border-gray-200">
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {origin}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              farcaster.json
            </span>
          </div>
          <span className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}>
            ▶
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Manifest Data
              </h4>
              
              {manifest.loading && (
                <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded">
                  Loading manifest...
                </div>
              )}

              {manifest.error && (
                <div className="text-sm text-red-700 p-3 bg-red-50 rounded">
                  <div className="font-medium mb-1">Error fetching manifest:</div>
                  <div>{manifest.error}</div>
                </div>
              )}

              {manifest.data !== undefined && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">
                    GET {origin}/.well-known/farcaster.json
                  </div>
                  <pre className="p-3 bg-white rounded text-xs overflow-x-auto border">
                    {formatManifestData(manifest.data)}
                  </pre>
                </div>
              ) as React.ReactNode}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
