import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Position {
  side: 'up' | 'down';
  shares: number;
  avg: string;
  now: string;
  cost: string;
  estValue: string;
  unrealizedPnL: string;
  pnlPercent: string;
}

interface OpenOrder {
  side: 'up' | 'down';
  type: string;
  price: string;
  shares: number;
  filled: string;
  total: string;
}

const mockPositions: Position[] = [
  {
    side: 'up',
    shares: 24,
    avg: '$55',
    now: '$55',
    cost: '$100.00',
    estValue: '$100.00',
    unrealizedPnL: '+$120.00 (+41%)',
    pnlPercent: '+41%',
  },
  {
    side: 'down',
    shares: 100,
    avg: '$55',
    now: '$100.00',
    cost: '$100.00',
    estValue: '$100.00',
    unrealizedPnL: '+$120.00 (+41%)',
    pnlPercent: '+41%',
  },
];

const mockOpenOrders: OpenOrder[] = [
  {
    side: 'up',
    type: 'Limit',
    price: '$0.65',
    shares: 100,
    filled: '0/100',
    total: '$65.00',
  },
];

const PositionTabs = () => {
  return (
    <div className="border-t border-border bg-white">
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-white h-auto p-0">
          <TabsTrigger
            value="positions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            Position(6)
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            Open orders(3)
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            History
          </TabsTrigger>
          <TabsTrigger
            value="claim"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
          >
            Claim
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="p-4 m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">Shares</th>
                  <th className="text-right pb-2 font-medium">Avg</th>
                  <th className="text-right pb-2 font-medium">Now</th>
                  <th className="text-right pb-2 font-medium">Cost</th>
                  <th className="text-right pb-2 font-medium">Est. Value</th>
                  <th className="text-right pb-2 font-medium">Unrealized P&L</th>
                  <th className="text-right pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockPositions.map((position, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          position.side === 'up'
                            ? 'bg-success text-white'
                            : 'bg-danger text-white'
                        }`}
                      >
                        {position.side === 'up' ? 'Up' : `${position.shares} Down`}
                      </span>
                    </td>
                    <td className="text-right py-3">{position.avg}</td>
                    <td className="text-right py-3">{position.now}</td>
                    <td className="text-right py-3">{position.cost}</td>
                    <td className="text-right py-3">{position.estValue}</td>
                    <td className="text-right py-3 text-success font-medium">
                      {position.unrealizedPnL}
                    </td>
                    <td className="text-right py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/70 h-8"
                      >
                        Sell
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="p-4 m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-right pb-2 font-medium">Shares</th>
                  <th className="text-right pb-2 font-medium">Filled</th>
                  <th className="text-right pb-2 font-medium">Total</th>
                  <th className="text-right pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockOpenOrders.map((order, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            order.side === 'up'
                              ? 'bg-success text-white'
                              : 'bg-danger text-white'
                          }`}
                        >
                          {order.side === 'up' ? 'Up' : 'Down'}
                        </span>
                        <span className="text-muted-foreground">{order.type}</span>
                      </div>
                    </td>
                    <td className="text-right py-3">{order.price}</td>
                    <td className="text-right py-3">{order.shares}</td>
                    <td className="text-right py-3">{order.filled}</td>
                    <td className="text-right py-3">{order.total}</td>
                    <td className="text-right py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:text-danger/70 h-8"
                      >
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-8 m-0">
          <div className="text-center text-muted-foreground">
            <p>No trading history</p>
          </div>
        </TabsContent>

        <TabsContent value="claim" className="p-4 m-0">
          <div className="bg-muted/20 p-4 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Claimable Rewards</div>
              <div className="text-xl font-bold text-foreground">$20,000.53</div>
            </div>
            <button className="bg-foreground text-background hover:bg-foreground/90 px-8 py-2 rounded font-medium">
              Claim
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PositionTabs;
