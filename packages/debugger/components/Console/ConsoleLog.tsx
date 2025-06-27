"use client";

import { ConsoleLogEntry, LogLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertCircle, Info, AlertTriangle, Bug } from "lucide-react";

interface ConsoleLogProps {
  entry: ConsoleLogEntry;
}

const logLevelConfig: Record<
  LogLevel,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }
> = {
  log: { icon: Info, color: "text-gray-600", bg: "bg-gray-50" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
  warn: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50" },
  error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  debug: { icon: Bug, color: "text-purple-600", bg: "bg-purple-50" },
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ConsoleLog({ entry }: ConsoleLogProps) {
  const config = logLevelConfig[entry.level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 border-b border-gray-200 hover:bg-gray-50 font-mono text-sm",
        config.bg,
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.color)} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("font-medium uppercase text-xs", config.color)}>
            {entry.level}
          </span>
          <span className="text-gray-500 text-xs">
            {formatTimestamp(entry.timestamp)}
          </span>
          {entry.origin && (
            <span className="text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded">
              {entry.origin}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-gray-900">{entry.message}</div>
          {entry.args.length > 0 && (
            <div className="pl-4 border-l-2 border-gray-300">
              {entry.args.map((arg, index) => (
                <div key={index} className="text-gray-700 whitespace-pre-wrap">
                  {formatValue(arg)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
