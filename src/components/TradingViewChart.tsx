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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LineChart as ChartIcon,
  RefreshCw,
  Settings,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { useOraclePrice } from "@/hooks/useOraclePrice";

// TradingView Lightweight Charts - 需要安装: npm install lightweight-charts
import { createChart, IChartApi, ISeriesApi, Time, CrosshairMode, ColorType } from "lightweight-charts";

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
  showTechnicalIndicators?: boolean;
  autoUpdate?: boolean;
  className?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = "BTC/USD",
  enableWebSocket = true,
  height = 500,
  showVolume = true,
  showTechnicalIndicators = true,
  autoUpdate = true,
  className = "",
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const { theme, resolvedTheme } = useTheme();
  const isDark = (theme ?? resolvedTheme) === "dark";

  const { currentPrice, priceHistory, loading, error, connected, refresh } = useOraclePrice({
    symbol,
    enableWebSocket,
    autoConnect: true,
  });

  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  const [timeframe, setTimeframe] = useState<"1" | "5" | "15" | "60" | "1D">("1");
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoUpdate, setIsAutoUpdate] = useState(autoUpdate);
  const [isShowVolume, setIsShowVolume] = useState(showVolume);

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
        priceHistory.forEach((item, index) => {
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
        background: { type: ColorType.Solid, color: isDark ? "#0b0b0b" : "#ffffff" },
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
      },
      timeScale: {
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "rgba(197, 203, 209, 1)",
        timeVisible: true,
        secondsVisible: false,
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

    // 添加价格线系列
    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // 添加成交量系列
    let volumeSeries: ISeriesApi<"Histogram"> | null = null;
    if (isShowVolume) {
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
  }, [height, isShowVolume]);

  // 主题变化时平滑更新图表样式
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0b0b0b" : "#ffffff" },
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

  // 更新图表数据
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;

    const newChartData = convertToChartData(priceHistory);
    setChartData(newChartData);

    if (newChartData.length > 0) {
      candlestickSeriesRef.current.setData(newChartData);

      // 更新成交量数据
      if (volumeSeriesRef.current && isShowVolume) {
        const volumeData = newChartData.map((item) => ({
          time: item.time,
          value: item.volume || 0,
          color: item.close >= item.open ? "rgba(76, 175, 80, 0.5)" : "rgba(244, 67, 54, 0.5)",
        }));
        volumeSeriesRef.current.setData(volumeData);
      }

      setLastUpdate(new Date());
    }
  }, [priceHistory, currentPrice, convertToChartData, isShowVolume]);

  // 实时价格更新
  useEffect(() => {
    if (!isAutoUpdate || !candlestickSeriesRef.current || !currentPrice) return;

    const price = parseFloat(currentPrice.price);
    const time = Math.floor(Date.now() / 1000) as Time;

    // 更新最后一个数据点或添加新数据点
    const lastDataPoint = chartData[chartData.length - 1];
    if (lastDataPoint && Math.abs(Number(lastDataPoint.time) - Number(time)) < 60) {
      // 更新当前时间段的数据
      const updatedPoint = {
        ...lastDataPoint,
        close: price,
        high: Math.max(lastDataPoint.high, price),
        low: Math.min(lastDataPoint.low, price),
      };

      candlestickSeriesRef.current.update(updatedPoint);
      setChartData((prev) => [...prev.slice(0, -1), updatedPoint]);
    } else {
      // 添加新的数据点
      const newPoint: ChartDataPoint = {
        time,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 500000 + Math.random() * 1000000,
      };

      candlestickSeriesRef.current.update(newPoint);
      setChartData((prev) => [...prev, newPoint]);
    }

    setLastUpdate(new Date());
  }, [currentPrice, isAutoUpdate, chartData]);

  // 切换图表类型
  const changeChartType = (type: "candlestick" | "line" | "area") => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    // 移除当前系列
    chartRef.current.removeSeries(candlestickSeriesRef.current);

    // 添加新类型的系列
    let newSeries: ISeriesApi<any>;

    switch (type) {
      case "line":
        newSeries = (chartRef.current as any).addLineSeries({
          color: "#2196f3",
          lineWidth: 2,
        });
        break;
      case "area":
        newSeries = (chartRef.current as any).addAreaSeries({
          topColor: "rgba(33, 150, 243, 0.56)",
          bottomColor: "rgba(33, 150, 243, 0.04)",
          lineColor: "rgba(33, 150, 243, 1)",
          lineWidth: 2,
        });
        break;
      default:
        newSeries = (chartRef.current as any).addCandlestickSeries({
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderVisible: false,
          wickUpColor: "#26a69a",
          wickDownColor: "#ef5350",
        });
    }

    candlestickSeriesRef.current = newSeries as ISeriesApi<"Candlestick">;

    // 重新设置数据
    if (chartData.length > 0) {
      candlestickSeriesRef.current.setData(chartData);
    }

    setChartType(type);
  };

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (chartRef.current && chartContainerRef.current) {
      setTimeout(() => {
        chartRef.current?.applyOptions({
          width: chartContainerRef.current?.clientWidth,
          height: isFullscreen ? height || 500 : Math.max(0, window.innerHeight - 100),
        });
      }, 100);
    }
  };

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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChartIcon className="h-5 w-5" />
            <CardTitle className="text-lg">{symbol} Chart</CardTitle>
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
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>

            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4 mr-2" />
              {isFullscreen ? "Exit" : "Fullscreen"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className="flex items-center gap-6 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Label htmlFor="chart-type">Chart Type:</Label>
              <Select value={chartType} onValueChange={(value: any) => changeChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candlestick">Candlestick</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="timeframe">Timeframe:</Label>
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger className="w-24">
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

            <div className="flex items-center gap-2">
              <Label htmlFor="auto-update">Auto Update:</Label>
              <Switch id="auto-update" checked={isAutoUpdate} onCheckedChange={setIsAutoUpdate} />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="show-volume">Volume:</Label>
              <Switch id="show-volume" checked={isShowVolume} onCheckedChange={setIsShowVolume} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Last update: {lastUpdate?.toLocaleTimeString() || "Never"}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={chartContainerRef}
          className={isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}
          style={{ height: isFullscreen ? "calc(100vh - 100px)" : height }}
        />
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;
