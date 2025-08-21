import React, { useState } from 'react';
import { useBrowser } from '@/hooks/useBrowser';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { ExternalLink, ExternalTextLink } from './external-link';
import { Alert, AlertDescription } from './alert';
import { Badge } from './badge';

/**
 * Demo component showcasing the browser service capabilities
 * This can be used for testing and as a reference for implementation
 */
export function BrowserDemo() {
  const { openBrowser, openExternal, closeBrowser, isLoading, error, clearError } = useBrowser();
  const [url, setUrl] = useState('https://example.com');
  const [presentationStyle, setPresentationStyle] = useState<'fullscreen' | 'popover'>('fullscreen');
  const [customColors, setCustomColors] = useState({
    toolbar: '#1d1d1e',
    navigationBar: '#1d1d1e',
    navigationBarDivider: '#62626a',
  });

  const handleOpenBrowser = async () => {
    const result = await openBrowser({
      url,
      presentationStyle,
      toolbarColor: customColors.toolbar,
      navigationBarColor: customColors.navigationBar,
      navigationBarDividerColor: customColors.navigationBarDivider,
    });

    if (result.type === 'error') {
      console.error('Browser error:', result.error);
    }
  };

  const handleOpenExternal = async () => {
    const result = await openExternal(url);
    if (result.type === 'error') {
      console.error('External browser error:', result.error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Browser Service Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test the @capacitor/browser integration with different configurations
        </p>
      </div>

      {/* URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>URL Configuration</CardTitle>
          <CardDescription>
            Enter a URL to test the browser service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="presentation">Presentation Style</Label>
            <Select value={presentationStyle} onValueChange={(value: 'fullscreen' | 'popover') => setPresentationStyle(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fullscreen">Fullscreen</SelectItem>
                <SelectItem value="popover">Popover</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Custom Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Colors</CardTitle>
          <CardDescription>
            Customize the browser appearance (iOS only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="toolbar">Toolbar Color</Label>
              <Input
                id="toolbar"
                type="color"
                value={customColors.toolbar}
                onChange={(e) => setCustomColors(prev => ({ ...prev, toolbar: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="navigationBar">Navigation Bar Color</Label>
              <Input
                id="navigationBar"
                type="color"
                value={customColors.navigationBar}
                onChange={(e) => setCustomColors(prev => ({ ...prev, navigationBar: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="navigationBarDivider">Divider Color</Label>
              <Input
                id="navigationBarDivider"
                type="color"
                value={customColors.navigationBarDivider}
                onChange={(e) => setCustomColors(prev => ({ ...prev, navigationBarDivider: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Actions</CardTitle>
          <CardDescription>
            Test different browser opening methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleOpenBrowser}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Opening...' : 'Open in In-App Browser'}
            </Button>
            
            <Button
              onClick={handleOpenExternal}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? 'Opening...' : 'Open in External Browser'}
            </Button>
            
            <Button
              onClick={closeBrowser}
              variant="secondary"
            >
              Close Browser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pre-configured Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-configured Examples</CardTitle>
          <CardDescription>
            Test with common URLs and configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>OAuth Example (Google)</Label>
              <ExternalLink 
                href="https://accounts.google.com/oauth/authorize?client_id=example&response_type=code&scope=email"
                variant="outline"
                size="sm"
                className="w-full"
              >
                Open Google OAuth
              </ExternalLink>
            </div>
            
            <div className="space-y-2">
              <Label>Documentation</Label>
              <ExternalTextLink href="https://capacitorjs.com/docs/apis/browser">
                Capacitor Browser Docs
              </ExternalTextLink>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status and Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2"
            >
              Clear
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Badge */}
      <div className="flex justify-center">
        <Badge variant={isLoading ? "secondary" : "default"}>
          {isLoading ? 'Loading...' : 'Ready'}
        </Badge>
      </div>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Platform:</strong> {typeof window !== 'undefined' && 'Capacitor' in window ? 'Native Mobile' : 'Web Browser'}
            </div>
            <div>
              <strong>Capacitor Available:</strong> {typeof window !== 'undefined' && 'Capacitor' in window ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Browser Plugin:</strong> Available
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
