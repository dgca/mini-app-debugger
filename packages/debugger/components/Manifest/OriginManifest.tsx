"use client";

import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface OriginManifestProps {
  origin: string;
}

interface ManifestData {
  loading: boolean;
  data?: unknown;
  error?: string;
}

interface ValidationResult {
  field: string;
  required: boolean;
  isValid: boolean;
  error?: string;
}

type TabType = 'raw' | 'validator';

export default function OriginManifest({ origin }: OriginManifestProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [manifest, setManifest] = useState<ManifestData>({ loading: false });
  const [activeTab, setActiveTab] = useState<TabType>('raw');

  const formatManifestData = (data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Failed to format JSON';
    }
  };

  const getFieldDescription = (field: string): string => {
    const descriptions: Record<string, string> = {
      'frame': 'Container object for mini app metadata',
      'frame.version': 'Manifest version. Must be "1".',
      'frame.name': 'Mini App name. Max 32 characters.',
      'frame.homeUrl': 'Default launch URL. Max 1024 characters.',
      'frame.iconUrl': 'Icon image URL. Max 1024 characters. Should be 1024x1024px PNG, no alpha.',
      'frame.subtitle': 'Short description under app name. Max 30 characters, no emojis or special characters.',
      'frame.description': 'Promotional message for Mini App Page. Max 170 characters, no emojis or special characters.',
      'frame.primaryCategory': 'Primary category of app. Must be one of: games, social, finance, utility, productivity, health-fitness, news-media, music, shopping, education, developer-tools, entertainment, art-creativity.',
      'frame.tags': 'Descriptive tags for filtering/search. Up to 5 tags, max 20 characters each. Lowercase, no spaces, no special characters.',
      'frame.splashBackgroundColor': 'Hex color code to use on loading screen.',
      'frame.webhookUrl': 'URL to which clients will POST events. Max 1024 characters.',
      'frame.ogTitle': 'Open Graph title. Max 30 characters.',
      'frame.ogDescription': 'Open Graph description. Max 100 characters.',
      'frame.heroImageUrl': 'Promotional display image. Should be 1200 x 630px (1.91:1).',
      'frame.ogImageUrl': 'Open Graph promotional image. Should be 1200 x 630px (1.91:1) PNG.',
      'frame.splashImageUrl': 'URL of image to show on loading screen. Should be 200x200px.',
      'accountAssociation': 'Account association data containing header, payload, and signature for domain verification.'
    };
    return descriptions[field] || 'Field description not available.';
  };

  const validateManifest = (data: unknown): ValidationResult[] => {
    if (!data || typeof data !== 'object') {
      return [];
    }

    const manifest = data as Record<string, any>;
    const results: ValidationResult[] = [];

    // Check if frame object exists
    if (!manifest.frame || typeof manifest.frame !== 'object') {
      results.push({
        field: 'frame',
        required: true,
        isValid: false,
        error: 'Required frame object missing'
      });
      return results;
    }

    const frame = manifest.frame;

    const validCategories = [
      'games', 'social', 'finance', 'utility', 'productivity', 
      'health-fitness', 'news-media', 'music', 'shopping', 
      'education', 'developer-tools', 'entertainment', 'art-creativity'
    ];

    // Helper functions
    const isValidHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);
    const hasEmojiOrSpecialChars = (str: string) => /[^\w\s-]/.test(str);

    // Required fields (from frame object)
    results.push({
      field: 'frame.version',
      required: true,
      isValid: frame.version === '1',
      error: frame.version !== '1' ? 'Must be "1"' : undefined
    });

    results.push({
      field: 'frame.name',
      required: true,
      isValid: typeof frame.name === 'string' && frame.name.length <= 32 && frame.name.length > 0,
      error: !frame.name ? 'Required field missing' : 
             typeof frame.name !== 'string' ? 'Must be a string' :
             frame.name.length > 32 ? 'Max 32 characters' : 
             frame.name.length === 0 ? 'Cannot be empty' : undefined
    });

    results.push({
      field: 'frame.homeUrl',
      required: true,
      isValid: typeof frame.homeUrl === 'string' && frame.homeUrl.length <= 1024 && frame.homeUrl.length > 0,
      error: !frame.homeUrl ? 'Required field missing' :
             typeof frame.homeUrl !== 'string' ? 'Must be a string' :
             frame.homeUrl.length > 1024 ? 'Max 1024 characters' : 
             frame.homeUrl.length === 0 ? 'Cannot be empty' : undefined
    });

    results.push({
      field: 'frame.iconUrl',
      required: true,
      isValid: typeof frame.iconUrl === 'string' && frame.iconUrl.length <= 1024 && frame.iconUrl.length > 0,
      error: !frame.iconUrl ? 'Required field missing' :
             typeof frame.iconUrl !== 'string' ? 'Must be a string' :
             frame.iconUrl.length > 1024 ? 'Max 1024 characters' : 
             frame.iconUrl.length === 0 ? 'Cannot be empty' : undefined
    });

    // Optional fields (from frame object)
    if (frame.subtitle !== undefined) {
      results.push({
        field: 'frame.subtitle',
        required: false,
        isValid: typeof frame.subtitle === 'string' && frame.subtitle.length <= 30 && !hasEmojiOrSpecialChars(frame.subtitle),
        error: typeof frame.subtitle !== 'string' ? 'Must be a string' :
               frame.subtitle.length > 30 ? 'Max 30 characters' :
               hasEmojiOrSpecialChars(frame.subtitle) ? 'No emojis or special characters' : undefined
      });
    }

    if (frame.description !== undefined) {
      results.push({
        field: 'frame.description',
        required: false,
        isValid: typeof frame.description === 'string' && frame.description.length <= 170 && !hasEmojiOrSpecialChars(frame.description),
        error: typeof frame.description !== 'string' ? 'Must be a string' :
               frame.description.length > 170 ? 'Max 170 characters' :
               hasEmojiOrSpecialChars(frame.description) ? 'No emojis or special characters' : undefined
      });
    }

    if (frame.primaryCategory !== undefined) {
      results.push({
        field: 'frame.primaryCategory',
        required: false,
        isValid: validCategories.includes(frame.primaryCategory),
        error: !validCategories.includes(frame.primaryCategory) ? `Must be one of: ${validCategories.join(', ')}` : undefined
      });
    }

    if (frame.tags !== undefined) {
      const isValidTags = Array.isArray(frame.tags) && 
                         frame.tags.length <= 5 &&
                         frame.tags.every((tag: any) => 
                           typeof tag === 'string' && 
                           tag.length <= 20 && 
                           tag === tag.toLowerCase() &&
                           !tag.includes(' ') &&
                           !hasEmojiOrSpecialChars(tag)
                         );
      
      results.push({
        field: 'frame.tags',
        required: false,
        isValid: isValidTags,
        error: !Array.isArray(frame.tags) ? 'Must be an array' :
               frame.tags.length > 5 ? 'Max 5 tags' :
               'Invalid tag format (lowercase, max 20 chars, no spaces/special chars)'
      });
    }

    if (frame.splashBackgroundColor !== undefined) {
      results.push({
        field: 'frame.splashBackgroundColor',
        required: false,
        isValid: typeof frame.splashBackgroundColor === 'string' && isValidHexColor(frame.splashBackgroundColor),
        error: !isValidHexColor(frame.splashBackgroundColor) ? 'Must be a valid hex color code (e.g., #FF0000)' : undefined
      });
    }

    if (frame.webhookUrl !== undefined) {
      results.push({
        field: 'frame.webhookUrl',
        required: false,
        isValid: typeof frame.webhookUrl === 'string' && frame.webhookUrl.length <= 1024,
        error: typeof frame.webhookUrl !== 'string' ? 'Must be a string' :
               frame.webhookUrl.length > 1024 ? 'Max 1024 characters' : undefined
      });
    }

    if (frame.ogTitle !== undefined) {
      results.push({
        field: 'frame.ogTitle',
        required: false,
        isValid: typeof frame.ogTitle === 'string' && frame.ogTitle.length <= 30,
        error: typeof frame.ogTitle !== 'string' ? 'Must be a string' :
               frame.ogTitle.length > 30 ? 'Max 30 characters' : undefined
      });
    }

    if (frame.ogDescription !== undefined) {
      results.push({
        field: 'frame.ogDescription',
        required: false,
        isValid: typeof frame.ogDescription === 'string' && frame.ogDescription.length <= 100,
        error: typeof frame.ogDescription !== 'string' ? 'Must be a string' :
               frame.ogDescription.length > 100 ? 'Max 100 characters' : undefined
      });
    }

    // Add accountAssociation validation
    if (manifest.accountAssociation !== undefined) {
      const hasRequiredFields = manifest.accountAssociation && 
                                typeof manifest.accountAssociation === 'object' &&
                                manifest.accountAssociation.header &&
                                manifest.accountAssociation.payload &&
                                manifest.accountAssociation.signature;
      
      results.push({
        field: 'accountAssociation',
        required: false,
        isValid: hasRequiredFields,
        error: !hasRequiredFields ? 'Must contain header, payload, and signature fields' : undefined
      });
    }

    return results;
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
                  
                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'raw'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Raw
                    </button>
                    <button
                      onClick={() => setActiveTab('validator')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'validator'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Validator
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'raw' ? (
                    <pre className="p-3 bg-white rounded text-xs overflow-x-auto border">
                      {formatManifestData(manifest.data)}
                    </pre>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const validationResults = validateManifest(manifest.data);
                        const missingRequired = validationResults.filter(r => r.required && !r.isValid);
                        const presentFields = validationResults.filter(r => {
                          if (r.required) return true;
                          const manifestData = manifest.data as any;
                          if (r.field.startsWith('frame.')) {
                            const frameField = r.field.replace('frame.', '');
                            return manifestData?.frame?.[frameField] !== undefined;
                          }
                          return manifestData?.[r.field] !== undefined;
                        });

                        return (
                          <>
                            {/* Validation Table */}
                            <div className="bg-white rounded border overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Field</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Status</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Value</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-900">Error</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {presentFields.map((result) => {
                                    const manifestData = manifest.data as any;
                                    let value;
                                    if (result.field.startsWith('frame.')) {
                                      const frameField = result.field.replace('frame.', '');
                                      value = manifestData?.frame?.[frameField];
                                    } else {
                                      value = manifestData?.[result.field];
                                    }
                                    return (
                                      <tr key={result.field} className={result.isValid ? 'bg-green-50' : 'bg-red-50'}>
                                        <td className="px-3 py-2 font-medium">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="cursor-help underline decoration-dotted">
                                                {result.field}
                                                {result.required && <span className="text-red-500 ml-1">*</span>}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="max-w-xs text-xs">
                                                {getFieldDescription(result.field)}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            result.isValid 
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {result.isValid ? 'Valid' : 'Invalid'}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 max-w-xs truncate">
                                          {value !== undefined ? (
                                            typeof value === 'object' ? JSON.stringify(value) : String(value)
                                          ) : (
                                            <span className="text-gray-400 italic">undefined</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-red-600">
                                          {result.error || ''}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Missing Required Fields */}
                            {missingRequired.length > 0 && (
                              <div className="bg-red-50 border border-red-200 rounded p-3">
                                <h5 className="text-sm font-medium text-red-800 mb-2">Missing Required Fields:</h5>
                                <ul className="text-xs text-red-700 space-y-1">
                                  {missingRequired.map((result) => (
                                    <li key={result.field} className="flex items-center">
                                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                      <strong>{result.field}</strong>: {result.error}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) as React.ReactNode}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
