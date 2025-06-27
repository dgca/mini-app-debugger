"use client";

import { NetworkRequestEntry } from "@/lib/types";
import { useState } from "react";

interface NetworkRequestProps {
  entry: NetworkRequestEntry;
}

export default function NetworkRequest({ entry }: NetworkRequestProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status?: number, error?: string) => {
    if (error) return "text-red-600";
    if (!status) return "text-gray-500";
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 300 && status < 400) return "text-yellow-600";
    if (status >= 400) return "text-red-600";
    return "text-gray-500";
  };

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "get": return "text-blue-600 bg-blue-50";
      case "post": return "text-green-600 bg-green-50";
      case "put": return "text-orange-600 bg-orange-50";
      case "patch": return "text-purple-600 bg-purple-50";
      case "delete": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="border-b border-gray-200">
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(entry.method)}`}>
              {entry.method}
            </span>
            <span className={`text-sm font-medium ${getStatusColor(entry.response?.status, entry.error)}`}>
              {entry.error ? "ERROR" : entry.response?.status || "PENDING"}
            </span>
            <span className="text-sm text-gray-900 truncate flex-1">
              {entry.url}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {entry.duration && <span>{entry.duration}ms</span>}
            <span>{formatTime(entry.timestamp)}</span>
            {entry.origin && (
              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {entry.origin}
              </span>
            )}
            <span className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}>
              ▶
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-4">
            {/* Request Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Request</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">URL:</span> {entry.url}</div>
                <div><span className="font-medium">Method:</span> {entry.method}</div>
                {Object.keys(entry.headers).length > 0 && (
                  <div>
                    <span className="font-medium">Headers:</span>
                    <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                      {JSON.stringify(entry.headers, null, 2)}
                    </pre>
                  </div>
                )}
                {entry.body && (
                  <div>
                    <span className="font-medium">Body:</span>
                    <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                      {entry.body}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Response Details */}
            {entry.response && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Response</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span className={getStatusColor(entry.response.status)}>
                      {entry.response.status} {entry.response.statusText}
                    </span>
                  </div>
                  {Object.keys(entry.response.headers).length > 0 && (
                    <div>
                      <span className="font-medium">Headers:</span>
                      <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                        {JSON.stringify(entry.response.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                  {entry.response.body && (
                    <div>
                      <span className="font-medium">Body:</span>
                      <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto max-h-40">
                        {entry.response.body}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Details */}
            {entry.error && (
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-2">Error</h4>
                <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  {entry.error}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
