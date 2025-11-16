import { useState } from 'react';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Activity,
  DollarSign,
  Users,
  TrendingUp,
  Play,
  Pause,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { toast } = useToast();
  const [selectedAsset, setSelectedAsset] = useState('0'); // BTC

  const handleCreateMarket = () => {
    toast({
      title: 'Market Created',
      description: 'New market has been created successfully',
    });
  };

  const handleTick = () => {
    toast({
      title: 'System Tick',
      description: 'Manual tick executed',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage markets, users, and system operations
            </p>
          </div>
          <Button onClick={handleTick} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Manual Tick
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Markets</div>
                <div className="text-2xl font-bold">247</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="text-2xl font-bold">1,234</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
                <div className="text-2xl font-bold">$2.4M</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fee Pool</div>
                <div className="text-2xl font-bold">$12.5K</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="markets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="oracle">Oracle</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Market</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Asset</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">BTC</SelectItem>
                      <SelectItem value="1">ETH</SelectItem>
                      <SelectItem value="2">SOL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Outcome Type</Label>
                  <Select defaultValue="up">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">Up</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Time Window</Label>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Minute</SelectItem>
                      <SelectItem value="3">3 Minutes</SelectItem>
                      <SelectItem value="5">5 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Oracle Start Price</Label>
                  <Input type="number" placeholder="119500.00" />
                </div>
              </div>

              <Button onClick={handleCreateMarket} className="mt-4">
                Create Market
              </Button>
            </Card>

            {/* Market List */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Active Markets</h3>
              <div className="space-y-2">
                {[1, 2, 3].map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge>#{id}</Badge>
                      <div>
                        <div className="font-medium">
                          BTC above $119,500 at 23:15
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Started 2m ago • Ends in 3m
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-success/10 text-success">
                        <Play className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Oracle Tab */}
          <TabsContent value="oracle">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Oracle Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    <div>
                      <div className="font-medium">Connected</div>
                      <div className="text-sm text-muted-foreground">
                        Last heartbeat: 2s ago
                      </div>
                    </div>
                  </div>
                  <Badge>Latency: 45ms</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">BTC Price</div>
                    <div className="text-2xl font-bold">$119,756.34</div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">ETH Price</div>
                    <div className="text-2xl font-bold">$3,234.56</div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">SOL Price</div>
                    <div className="text-2xl font-bold">$98.45</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Fee Management</h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Total Fees Collected
                  </div>
                  <div className="text-3xl font-bold">$12,456.78</div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Fee-Exempt Users</h4>
                  <div className="space-y-2">
                    {['0x1234...5678', '0x8765...4321'].map((addr) => (
                      <div
                        key={addr}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <span className="font-mono text-sm">{addr}</span>
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Add Fee Exemption</Label>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="User ID or address" />
                    <Button>Add</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Logs</h3>
              <div className="space-y-2 font-mono text-sm">
                {[
                  { type: 'EVENT_MARKET', msg: 'Market #247 created' },
                  { type: 'EVENT_ORDER', msg: 'Order #1234 placed' },
                  { type: 'EVENT_TRADE', msg: 'Trade #567 executed' },
                  { type: 'EVENT_POSITION', msg: 'Position updated' },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{log.type}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <div>{log.msg}</div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
