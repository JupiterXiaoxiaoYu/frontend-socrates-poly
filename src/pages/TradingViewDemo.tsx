/**
 * TradingView Demo Page
 *
 * 展示集成了Socrates Oracle价格数据的专业交易图表
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradingViewChart } from '@/components/TradingViewChart';
import { AdvancedTradingDashboard } from '@/components/AdvancedTradingDashboard';
import {
  LineChart as ChartIcon,
  Settings,
  BarChart3,
  Info,
  CheckCircle,
  AlertCircle,
  Code,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';

export const TradingViewDemo: React.FC = () => {
  const [symbol, setSymbol] = useState('BTC/USD');
  const [tempSymbol, setTempSymbol] = useState('BTC/USD');
  const [enableWebSocket, setEnableWebSocket] = useState(true);
  const [chartHeight, setChartHeight] = useState(500);
  const [showVolume, setShowVolume] = useState(true);
  const [showTechnicalIndicators, setShowTechnicalIndicators] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [timeframe, setTimeframe] = useState('1');

  const handleSymbolChange = () => {
    setSymbol(tempSymbol);
  };

  const resetSettings = () => {
    setTempSymbol('BTC/USD');
    setSymbol('BTC/USD');
    setEnableWebSocket(true);
    setChartHeight(500);
    setShowVolume(true);
    setShowTechnicalIndicators(true);
    setAutoUpdate(true);
    setChartType('candlestick');
    setTimeframe('1');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <ChartIcon className="h-8 w-8" />
          TradingView Chart Integration
        </h1>
        <p className="text-muted-foreground">
          Professional trading charts powered by Socrates Oracle price data
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Chart Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Trading Symbol</Label>
              <div className="flex gap-2">
                <Input
                  id="symbol"
                  value={tempSymbol}
                  onChange={(e) => setTempSymbol(e.target.value)}
                  placeholder="BTC/USD"
                />
                <Button onClick={handleSymbolChange} variant="outline">
                  Apply
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-height">Chart Height</Label>
              <Select value={chartHeight.toString()} onValueChange={(value) => setChartHeight(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">400px</SelectItem>
                  <SelectItem value="500">500px</SelectItem>
                  <SelectItem value="600">600px</SelectItem>
                  <SelectItem value="800">800px</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candlestick">Candlestick</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1m</SelectItem>
                  <SelectItem value="5">5m</SelectItem>
                  <SelectItem value="15">15m</SelectItem>
                  <SelectItem value="60">1H</SelectItem>
                  <SelectItem value="1D">1D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websocket">Enable WebSocket</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="websocket"
                  checked={enableWebSocket}
                  onCheckedChange={setEnableWebSocket}
                />
                <span className="text-sm text-muted-foreground">
                  {enableWebSocket ? 'Real-time updates' : 'Polling mode'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-update">Auto Update</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-update"
                  checked={autoUpdate}
                  onCheckedChange={setAutoUpdate}
                />
                <span className="text-sm text-muted-foreground">
                  {autoUpdate ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Show Volume</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="volume"
                  checked={showVolume}
                  onCheckedChange={setShowVolume}
                />
                <Eye className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicators">Technical Indicators</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="indicators"
                  checked={showTechnicalIndicators}
                  onCheckedChange={setShowTechnicalIndicators}
                />
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={resetSettings} variant="outline">
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="basic-chart" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic-chart" className="flex items-center gap-2">
            <ChartIcon className="h-4 w-4" />
            Basic Chart
          </TabsTrigger>
          <TabsTrigger value="advanced-dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Advanced Dashboard
          </TabsTrigger>
          <TabsTrigger value="integration-guide" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Integration Guide
          </TabsTrigger>
        </TabsList>

        {/* Basic Chart Tab */}
        <TabsContent value="basic-chart" className="space-y-4">
          <TradingViewChart
            symbol={symbol}
            enableWebSocket={enableWebSocket}
            height={chartHeight}
            showVolume={showVolume}
            showTechnicalIndicators={showTechnicalIndicators}
            autoUpdate={autoUpdate}
          />
        </TabsContent>

        {/* Advanced Dashboard Tab */}
        <TabsContent value="advanced-dashboard" className="space-y-4">
          <AdvancedTradingDashboard
            symbol={symbol}
            enableWebSocket={enableWebSocket}
          />
        </TabsContent>

        {/* Integration Guide Tab */}
        <TabsContent value="integration-guide" className="space-y-4">
          <div className="grid gap-6">
            {/* Installation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Installation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Install Lightweight Charts:</h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <pre>npm install lightweight-charts</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2. Import Components:</h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <pre>{`import { TradingViewChart } from '@/components/TradingViewChart';
import { AdvancedTradingDashboard } from '@/components/AdvancedTradingDashboard';`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <pre>{`// Simple chart
<TradingViewChart
  symbol="BTC/USD"
  enableWebSocket={true}
  height={500}
  showVolume={true}
/>

// Advanced dashboard
<AdvancedTradingDashboard
  symbol="BTC/USD"
  enableWebSocket={true}
  className="w-full"
/>`}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Chart Features:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Candlestick, Line, and Area charts</li>
                      <li>• Real-time price updates</li>
                      <li>• Volume bars display</li>
                      <li>• Multiple timeframes</li>
                      <li>• Responsive design</li>
                      <li>• Fullscreen mode</li>
                      <li>• Price formatting</li>
                      <li>• Crosshair interactions</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Dashboard Features:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Live price feed display</li>
                      <li>• Order book visualization</li>
                      <li>• Recent trades history</li>
                      <li>• Market statistics</li>
                      <li>• Exchange status monitoring</li>
                      <li>• WebSocket connection status</li>
                      <li>• Auto-refresh controls</li>
                      <li>• Customizable settings</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Integration */}
            <Card>
              <CardHeader>
                <CardTitle>Oracle Data Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Charts automatically integrate with Socrates Oracle API for real-time price data
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <pre>{`// Data flow:
Socrates Oracle API -> WebSocket/REST -> React Hook -> Chart Component

// Price update cycle:
1. Oracle publishes price update
2. WebSocket receives real-time data
3. React Hook processes the data
4. Chart updates with OHLC data
5. UI reflects latest price`}</pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Data Sources:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Multiple exchange aggregation</li>
                      <li>• Weighted price averaging</li>
                      <li>• Real-time WebSocket streaming</li>
                      <li>• REST API fallback</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Update Frequency:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• WebSocket: Real-time</li>
                      <li>• Polling: 5 seconds</li>
                      <li>• Historical: 60 seconds</li>
                      <li>• Auto-reconnect: Yes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradingViewDemo;