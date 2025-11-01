/**
 * Oracle Price Demo Page
 *
 * 展示如何使用Socrates Chain Oracle API获取比特币价格数据
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SocratesPriceFeed } from '@/components/SocratesPriceFeed';
import {
  oracleClient,
  OraclePriceResponse,
  ExchangeStatus
} from '@/services/oracle-api';
import {
  Play,
  Square,
  Info,
  Code,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export const OraclePriceDemo: React.FC = () => {
  const [symbol, setSymbol] = useState('BTC/USD');
  const [tempSymbol, setTempSymbol] = useState('BTC/USD');
  const [enableWebSocket, setEnableWebSocket] = useState(true);
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testAPICall = async (apiCall: () => Promise<any>, label: string) => {
    setLoading(true);
    try {
      const result = await apiCall();
      setApiResults(prev => [...prev, {
        id: Date.now(),
        label,
        success: true,
        data: result,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setApiResults(prev => [...prev, {
        id: Date.now(),
        label,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testLatestPrice = () => {
    testAPICall(() => oracleClient.getLatestPrice(symbol), 'Get Latest Price');
  };

  const testPriceHistory = () => {
    testAPICall(() => oracleClient.getPriceHistory(symbol), 'Get Price History');
  };

  const testAveragePrice = () => {
    testAPICall(() => oracleClient.getAveragePrice(symbol), 'Get Average Price');
  };

  const testSupportedSymbols = () => {
    testAPICall(() => oracleClient.getSupportedSymbols(), 'Get Supported Symbols');
  };

  const testExchangeStatus = () => {
    testAPICall(() => oracleClient.getExchangeStatus(), 'Get Exchange Status');
  };

  const testHealthCheck = () => {
    testAPICall(() => oracleClient.healthCheck(), 'Health Check');
  };

  const handleSymbolChange = () => {
    setSymbol(tempSymbol);
  };

  const clearResults = () => {
    setApiResults([]);
  };

  const formatJSON = (data: any): string => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Socrates Oracle Price API Demo</h1>
        <p className="text-muted-foreground">
          Real-time Bitcoin price data from Socrates Chain Oracle
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="price-feed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="price-feed" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Price Feed
          </TabsTrigger>
          <TabsTrigger value="api-testing" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API Testing
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        {/* Price Feed Tab */}
        <TabsContent value="price-feed" className="space-y-4">
          <SocratesPriceFeed
            symbol={symbol}
            enableWebSocket={enableWebSocket}
            showDetails={true}
            showHistory={true}
            showExchangeStatus={true}
          />
        </TabsContent>

        {/* API Testing Tab */}
        <TabsContent value="api-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  onClick={testLatestPrice}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Latest Price
                </Button>
                <Button
                  onClick={testPriceHistory}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Price History
                </Button>
                <Button
                  onClick={testAveragePrice}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Average Price
                </Button>
                <Button
                  onClick={testSupportedSymbols}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Symbols
                </Button>
                <Button
                  onClick={testExchangeStatus}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Exchange Status
                </Button>
                <Button
                  onClick={testHealthCheck}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Health Check
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {apiResults.length} test results
                </span>
                <Button
                  onClick={clearResults}
                  variant="outline"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Clear Results
                </Button>
              </div>

              {/* API Results */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {apiResults.map((result) => (
                  <Card key={result.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{result.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {result.timestamp}
                          </span>
                        </div>
                      </div>

                      {result.success ? (
                        <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
                          <pre>{formatJSON(result.data)}</pre>
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription className="text-sm">
                            {result.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <div className="grid gap-4">
            {/* API Info */}
            <Card>
              <CardHeader>
                <CardTitle>API Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Base URL:</strong>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                    https://api-oracle-test.socrateschain.org
                  </code>
                </div>
                <div>
                  <strong>WebSocket URL:</strong>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                    wss://api-oracle-test.socrateschain.org/ws
                  </code>
                </div>
                <div>
                  <strong>Default Symbol:</strong>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                    BTC/USD
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Usage Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Usage:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <pre>
{`import { oracleClient } from '@/services/oracle-api';

// Get latest price
const price = await oracleClient.getLatestPrice('BTC/USD');
console.log(price.price); // "112999.5161538461538462"

// Get price history
const history = await oracleClient.getPriceHistory('BTC/USD');
console.log(history.length); // 60 seconds of data

// WebSocket subscription
oracleClient.subscribe('my-id', (data) => {
  console.log('Price update:', data.data.price);
});`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">React Hook:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <pre>
{`import { useOraclePrice } from '@/hooks/useOraclePrice';

function MyComponent() {
  const { currentPrice, loading, error, connected } = useOraclePrice({
    symbol: 'BTC/USD',
    enableWebSocket: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div>Price: {currentPrice?.formattedPrice}</div>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
    </div>
  );
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Real-time price updates via WebSocket</li>
                  <li>• Automatic reconnection with backoff</li>
                  <li>• Price history (60 seconds)</li>
                  <li>• Multiple exchange aggregation</li>
                  <li>• Weighted price averaging</li>
                  <li>• Price validation and anomaly detection</li>
                  <li>• Exchange status monitoring</li>
                  <li>• TypeScript support</li>
                  <li>• React hooks for easy integration</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OraclePriceDemo;