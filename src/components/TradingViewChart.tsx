/**
 * TradingView Lightweight Chart Integration
 *
 * 集成Socrates Oracle价格数据到专业图表中
 * 支持实时价格更新、技术指标、自定义主题等
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart as ChartIcon,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useOraclePrice } from "@/hooks/useOraclePrice";

// TradingView Lightweight Charts - 需要安装: npm install lightweight-charts
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  Time, 
  CrosshairMode, 
  ColorType,
  LineStyle,
  LineType,
  LastPriceAnimationMode,
} from "lightweight-charts";

interface ChartDataPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradingViewChartProps {
  symbol?: string;
  enableWebSocket?: boolean;
  height?: number;
  showVolume?: boolean;
  autoUpdate?: boolean;
  className?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = "BTC/USD",
  enableWebSocket = true,
  height = 500,
  showVolume = true,
  autoUpdate = true,
  className = "",
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { currentPrice, priceHistory, loading, error, connected, refresh } = useOraclePrice({
    symbol,
    enableWebSocket,
    autoConnect: true,
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const isInitializedRef = useRef(false);
  const lastPriceRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // 将Oracle价格数据转换为图表数据格式
  const convertToChartData = useCallback(
    (priceHistory: any[]): ChartDataPoint[] => {
      const data: ChartDataPoint[] = [];

      // 如果没有历史数据，使用当前价格创建一个数据点
      if (priceHistory.length === 0 && currentPrice) {
        const price = parseFloat(currentPrice.price);
        const time = Math.floor(Date.now() / 1000) as Time;

        data.push({
          time,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 1000000, // 模拟成交量
        });
      } else {
        // 处理历史数据
        priceHistory.forEach((item) => {
          const price = parseFloat(item.price);
          const time = item.unix_time as Time;

          // 为每个价格创建OHLC数据（实际应用中应该从API获取真实的OHLC数据）
          const priceVariation = price * 0.001; // 0.1% 的变化
          data.push({
            time,
            open: price - priceVariation + (Math.random() - 0.5) * priceVariation,
            high: price + Math.random() * priceVariation,
            low: price - Math.random() * priceVariation,
            close: price,
            volume: 500000 + Math.random() * 1000000, // 模拟成交量
          });
        });
      }

      return data.sort((a, b) => Number(a.time) - Number(b.time));
    },
    [currentPrice]
  );

  // 初始化图表（不依赖主题，避免频繁重建）
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#000000" : "#ffffff" },
        textColor: isDark ? "#e5e5e5" : "#333333",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "rgba(197, 203, 209, 0.3)" },
        horzLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "rgba(197, 203, 209, 0.3)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "rgba(197, 203, 209, 1)",
        autoScale: true,
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
        visible: true,
        alignLabels: true,
        borderVisible: true,
      },
      timeScale: {
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "rgba(197, 203, 209, 1)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 6,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        borderVisible: true,
        visible: true,
      },
      localization: {
        locale: "en-US",
        priceFormatter: (price: number) => {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(price);
        },
        timeFormatter: (time: any) => {
          // 将 Unix 时间戳转换为当地时区，英文格式，24小时制
          const date = new Date(time * 1000);
          return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
        },
      },
    });

    // 固定使用线图 - 平滑曲线（按照 lightweight-charts 示例）
    const candlestickSeries = (chart as any).addLineSeries({
      color: isDark ? "rgba(255, 193, 7, 1)" : "rgba(255, 193, 7, 1)",
      lineWidth: 3,
      lineType: LineType.Curved, // 平滑曲线
      lineStyle: LineStyle.Solid,
      lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate, // 关键：启用价格动画
      priceLineVisible: true,
      priceLineWidth: 2,
      priceLineColor: isDark ? "#2196F3" : "#2196F3",
      priceLineStyle: LineStyle.Dashed,
      lastValueVisible: true,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBorderColor: isDark ? "#FFC107" : "#FFC107",
      crosshairMarkerBackgroundColor: isDark ? "#FFC107" : "#FFC107",
    });

    // 添加成交量系列
    let volumeSeries: ISeriesApi<"Histogram"> | null = null;
    if (showVolume) {
      volumeSeries = (chart as any).addHistogramSeries({
        color: "rgba(76, 175, 80, 0.5)",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "volume",
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    
    // 重置初始化标志，允许重新加载数据
    isInitializedRef.current = false;

    // 响应式处理
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [height, showVolume, isDark]);

  // 主题变化时平滑更新图表样式
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#000000" : "#ffffff" },
        textColor: isDark ? "#e5e5e5" : "#333333",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "rgba(197, 203, 209, 0.3)" },
        horzLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "rgba(197, 203, 209, 0.3)" },
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "rgba(197, 203, 209, 1)",
      },
      timeScale: {
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "rgba(197, 203, 209, 1)",
      },
    });
  }, [isDark]);

  // 初始化图表数据（只在初始化时使用 setData）
  useEffect(() => {
    if (!candlestickSeriesRef.current || isInitializedRef.current) return;
    if (!priceHistory || priceHistory.length === 0) return;

    const newChartData = convertToChartData(priceHistory);
    
    if (newChartData.length > 0) {
      // 转换为 LineSeries 格式 { time, value }
      const lineData = newChartData.map((item) => ({
        time: item.time,
        value: item.close,
      }));
      
      candlestickSeriesRef.current.setData(lineData);
      setChartData(newChartData);
      isInitializedRef.current = true;

      // 初始化成交量数据
      if (volumeSeriesRef.current && showVolume) {
        const volumeData = newChartData.map((item) => ({
          time: item.time,
          value: item.volume || 0,
          color: item.close >= item.open ? "rgba(76, 175, 80, 0.5)" : "rgba(244, 67, 54, 0.5)",
        }));
        volumeSeriesRef.current.setData(volumeData);
      }
    }
  }, [priceHistory, convertToChartData, showVolume]);

  // 实时价格更新（插值实现平滑动画）
  useEffect(() => {
    if (!autoUpdate || !candlestickSeriesRef.current || !currentPrice || !isInitializedRef.current) return;

    const targetPrice = parseFloat(currentPrice.price);
    const currentTime = Date.now();
    const time = Math.floor(currentTime / 1000) as Time;

    // 如果是第一次更新，直接设置
    if (lastPriceRef.current === null || lastTimeRef.current === null) {
      lastPriceRef.current = targetPrice;
      lastTimeRef.current = currentTime;
      candlestickSeriesRef.current.update({ time, value: targetPrice });
      return;
    }

    // 计算插值步数（在1秒内插入1000个点实现超平滑）
    const startPrice = lastPriceRef.current;
    const priceDiff = targetPrice - startPrice;
    const steps = 100000; // 1000个插值点
    const stepDuration = 0.01; // 每0.1ms一个点，总共1秒
    let currentStep = 0;

    const intervalId = setInterval(() => {
      if (!candlestickSeriesRef.current) {
        clearInterval(intervalId);
        return;
      }

      currentStep++;
      const progress = currentStep / steps;
      
      // 使用 easeOutQuad 缓动
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const interpolatedPrice = startPrice + priceDiff * easeProgress;
      
      // 插值时间点
      const interpolatedTime = Math.floor((Date.now()) / 1000) as Time;

      candlestickSeriesRef.current.update({
        time: interpolatedTime,
        value: interpolatedPrice,
      });

      if (currentStep >= steps) {
        clearInterval(intervalId);
        lastPriceRef.current = targetPrice;
        lastTimeRef.current = Date.now();
      }
    }, stepDuration);

    return () => clearInterval(intervalId);
  }, [currentPrice, autoUpdate]);

  // 刷新数据
  const handleRefresh = async () => {
    await refresh();
  };

  const getConnectionBadge = () => {
    if (loading)
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Loading
        </Badge>
      );
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (connected)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Live
        </Badge>
      );
    return <Badge variant="secondary">Offline</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChartIcon className="h-5 w-5" />
            <CardTitle className="text-lg">{symbol}</CardTitle>
            {getConnectionBadge()}
            {currentPrice && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{currentPrice.formattedPrice}</span>
                {currentPrice.priceChange?.direction === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
                {currentPrice.priceChange?.direction === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={chartContainerRef}
          className="[&_a]:hidden"
          style={{ height }}
        />
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;
