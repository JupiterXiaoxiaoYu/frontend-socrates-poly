import React, { useState, useEffect } from "react";
import { usePredictionMarket, useMarkets, useUserPortfolio, useMarketOperations } from "../contexts";
import {
  formatPrice,
  formatAmount,
  formatTimestamp,
  calculateTimeRemaining,
  isMarketActive,
  basisPointsToDecimal,
} from "../utils";
import type { MarketCreationParams, OrderParams } from "../types";

/**
 * Example component demonstrating the zkWASM Prediction Market integration
 * This component shows how to use all the major features of the integration
 */
const PredictionMarketExample: React.FC = () => {
  const { isConnected, walletInfo, loading, error, transactionState, connect, disconnect, refreshData } =
    usePredictionMarket();

  const { markets } = useMarkets();
  const { positions, stats } = useUserPortfolio();
  const { createMarket, placeOrder, claimWinnings } = useMarketOperations();

  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  // Form states
  const [marketForm, setMarketForm] = useState<Partial<MarketCreationParams>>({
    question: "",
    outcome1: "Yes",
    outcome2: "No",
    endTimeOffset: 86400n, // 1 day from now
    fee: 100n, // 1% fee
  });

  const [orderForm, setOrderForm] = useState<Partial<OrderParams>>({
    marketId: 0n,
    orderType: "YES",
    outcome: 1,
    amount: "0",
    price: "5000", // 50%
  });

  // Example handlers
  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleCreateMarket = async () => {
    if (!marketForm.question || !marketForm.outcome1 || !marketForm.outcome2) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const params: MarketCreationParams = {
        question: marketForm.question!,
        outcome1: marketForm.outcome1!,
        outcome2: marketForm.outcome2!,
        endTimeOffset: marketForm.endTimeOffset || 86400n,
        fee: marketForm.fee || 100n,
      };

      await createMarket(params);
      setShowCreateMarket(false);
      setMarketForm({
        question: "",
        outcome1: "Yes",
        outcome2: "No",
        endTimeOffset: 86400n,
        fee: 100n,
      });
    } catch (error) {
      console.error("Failed to create market:", error);
      alert(error instanceof Error ? error.message : "Failed to create market");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedMarket || !orderForm.amount || parseFloat(orderForm.amount) <= 0) {
      alert("Please select a market and enter a valid amount");
      return;
    }

    try {
      const params: OrderParams = {
        marketId: BigInt(selectedMarket),
        orderType: orderForm.orderType!,
        outcome: orderForm.outcome!,
        amount: BigInt(parseFloat(orderForm.amount)),
        price: BigInt(parseInt(orderForm.price)),
      };

      await placeOrder(params);
      setShowPlaceOrder(false);
      setOrderForm({
        marketId: 0n,
        orderType: "YES",
        outcome: 1,
        amount: "0",
        price: "5000",
      });
    } catch (error) {
      console.error("Failed to place order:", error);
      alert(error instanceof Error ? error.message : "Failed to place order");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">zkWASM Prediction Market Example</h1>
        <p className="text-gray-600">
          This example demonstrates how to integrate with the zkWASM prediction market backend.
        </p>

        {/* Connection Status */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            {walletInfo && (
              <span className="text-sm text-gray-600">
                {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : (
              <button onClick={disconnect} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                Disconnect
              </button>
            )}
            <button
              onClick={() => refreshData()}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Transaction Status */}
        {transactionState.status !== "IDLE" && (
          <div
            className={`mt-4 p-3 rounded ${
              transactionState.status === "SUCCESS"
                ? "bg-green-100 text-green-800"
                : transactionState.status === "ERROR"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            <div className="font-medium">
              {transactionState.type && <span className="mr-2">{transactionState.type.replace("_", " ")}</span>}
              {transactionState.status}
            </div>
            {transactionState.error && <div className="text-sm mt-1">{transactionState.error}</div>}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
            <div className="font-medium">Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}
      </div>

      {/* User Stats */}
      {isConnected && stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Balance</div>
              <div className="text-lg font-semibold">{formatAmount(stats.balance)} pts</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total Invested</div>
              <div className="text-lg font-semibold">{formatAmount(stats.totalInvested)} pts</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Open Positions</div>
              <div className="text-lg font-semibold">{stats.openPositions}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Win Rate</div>
              <div className="text-lg font-semibold">{stats.winRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowCreateMarket(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Create Market
            </button>
            <button
              onClick={() => setShowPlaceOrder(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Place Order
            </button>
          </div>
        </div>
      )}

      {/* Markets List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Markets</h2>
        {loading ? (
          <div className="text-center py-8">Loading markets...</div>
        ) : markets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No markets available</div>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => {
              const timeRemaining = calculateTimeRemaining(market.endTime);
              const active = isMarketActive(market);

              return (
                <div key={market.marketId} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{market.question}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        {market.outcome1} vs {market.outcome2}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Ends: {formatTimestamp(market.endTime)} ({timeRemaining.formatted})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        YES: {formatPrice(market.probability1 * 10000)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        NO: {formatPrice(market.probability2 * 10000)}
                      </div>
                      <div
                        className={`text-xs mt-1 px-2 py-1 rounded ${
                          active
                            ? "bg-green-100 text-green-800"
                            : market.status === "RESOLVED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {market.status}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedMarket(market.marketId);
                        setOrderForm((prev) => ({ ...prev, marketId: BigInt(market.marketId) }));
                        setShowPlaceOrder(true);
                      }}
                      disabled={!active}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Trade
                    </button>
                    {market.status === "RESOLVED" && positions.some((p) => p.marketId === market.marketId) && (
                      <button
                        onClick={() =>
                          claimWinnings({ marketId: BigInt(market.marketId), outcome: market.resolvedOutcome! })
                        }
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Market Modal */}
      {showCreateMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Market</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={marketForm.question}
                  onChange={(e) => setMarketForm((prev) => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Will X happen by Y date?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome 1</label>
                  <input
                    type="text"
                    value={marketForm.outcome1}
                    onChange={(e) => setMarketForm((prev) => ({ ...prev, outcome1: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome 2</label>
                  <input
                    type="text"
                    value={marketForm.outcome2}
                    onChange={(e) => setMarketForm((prev) => ({ ...prev, outcome2: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time (seconds from now)</label>
                <input
                  type="number"
                  value={marketForm.endTimeOffset?.toString()}
                  onChange={(e) => setMarketForm((prev) => ({ ...prev, endTimeOffset: BigInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="86400 (1 day)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee (basis points, 100 = 1%)</label>
                <input
                  type="number"
                  value={marketForm.fee?.toString()}
                  onChange={(e) => setMarketForm((prev) => ({ ...prev, fee: BigInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleCreateMarket}
                disabled={transactionState.status === "PENDING"}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Create Market
              </button>
              <button
                onClick={() => setShowCreateMarket(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place Order Modal */}
      {showPlaceOrder && selectedMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Place Order</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
                <div className="px-3 py-2 bg-gray-50 border rounded">
                  {markets.find((m) => m.marketId === selectedMarket)?.question}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                  <select
                    value={orderForm.orderType}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, orderType: e.target.value as "YES" | "NO" }))}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select
                    value={orderForm.outcome}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, outcome: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Outcome 1</option>
                    <option value="2">Outcome 2</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (points)</label>
                <input
                  type="number"
                  value={orderForm.amount}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (basis points, 5000 = 50%)</label>
                <input
                  type="number"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                  min="0"
                  max="10000"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Implied probability: {formatPrice(parseInt(orderForm.price || "0"))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handlePlaceOrder}
                disabled={transactionState.status === "PENDING"}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Place Order
              </button>
              <button
                onClick={() => setShowPlaceOrder(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionMarketExample;
