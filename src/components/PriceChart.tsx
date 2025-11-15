import { useEffect, useRef, useState } from "react";
import { 
  createChart, 
  LineStyle, 
  ColorType, 
  LineSeries,
  LineType,
  LastPriceAnimationMode,
  Time
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { PartialPriceLine } from "@/lib/chart/PartialPriceLine";
import { socratesOracleService, PriceData, PriceHistoryData } from "@/services/socratesOracle";

interface PriceChartProps {
  targetPrice: number;
  onPriceUpdate?: (price: number) => void;
}

const PriceChart = ({ targetPrice, onPriceUpdate }: PriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // 当价格更新时通知父组件
  useEffect(() => {
    if (latestPrice !== null && onPriceUpdate) {
      onPriceUpdate(latestPrice);
    }
  }, [latestPrice, onPriceUpdate]);
  
  const chartRef = useRef<any>(null);
  const lineSeriesRef = useRef<any>(null);
  const partialPriceLineRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let isSubscribed = true;
    let unsubscribe: (() => void) | null = null;

    const initializeChart = async () => {
      if (!chartContainerRef.current) return;

      // Create chart with dark mode support
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: isDark ? "#0b0b0b" : "#ffffff" },
          textColor: isDark ? "#e5e5e5" : "#999999",
        },
        grid: {
          vertLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "#f0f0f0" },
          horzLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "#f0f0f0" },
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        timeScale: {
          timeVisible: true,
          secondsVisible: true,
          borderColor: isDark ? "rgba(80, 80, 80, 1)" : "#e0e0e0",
        },
        rightPriceScale: {
          borderColor: isDark ? "rgba(80, 80, 80, 1)" : "#e0e0e0",
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

      chartRef.current = chart;

      // Create line series with curved line (平滑曲线)
      const lineSeries = chart.addSeries(LineSeries, {
        lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
        color: "#f59e0b", // 橙色
        lineWidth: 3,
        lineType: LineType.Curved, // ← 平滑曲线
        priceLineVisible: true, // 显示当前价格线
        priceLineColor: "#f59e0b",
        priceLineWidth: 1,
        priceLineStyle: LineStyle.Solid,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderWidth: 2,
        crosshairMarkerBorderColor: "#f59e0b",
        crosshairMarkerBackgroundColor: "#f59e0b",
        lastValueVisible: true, // 显示最新价格标签
        priceFormat: {
          type: "price",
          precision: 2,
          minMove: 0.01,
        },
      });

      lineSeriesRef.current = lineSeries;

      // Add custom partial price line with circle
      const partialPriceLine = new PartialPriceLine(isDark);
      lineSeries.attachPrimitive(partialPriceLine);
      partialPriceLineRef.current = partialPriceLine;

      // Target price line reference
      let targetPriceLine: any = null;

      // 获取 60 秒历史数据
      try {
        const historyData: PriceHistoryData = await socratesOracleService.getPriceHistory("BTC/USD");

        if (isSubscribed && historyData.prices && historyData.prices.length > 0) {
          // 直接使用原始数据
          const chartData = historyData.prices.map((point) => ({
            time: point.unix_time as Time,
            value: parseFloat(point.price),
          }));

          lineSeries.setData(chartData);

          // 更新最新价格
          const latestHistoricalPrice = historyData.prices[historyData.prices.length - 1];
          const latestPriceValue = parseFloat(latestHistoricalPrice.price);
          setLatestPrice(latestPriceValue);

          // 数据加载后添加目标价格线（智能定位）
          setTimeout(() => {
            // 计算数据的价格范围
            const prices = chartData.map(d => d.value);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            // 智能定位目标价格线
            let displayPrice = targetPrice;
            if (targetPrice > maxPrice) {
              // 目标价格高于范围，放在顶部附近
              displayPrice = maxPrice;
            } else if (targetPrice < minPrice) {
              // 目标价格低于范围，放在底部附近
              displayPrice = minPrice;
            }
            
            targetPriceLine = lineSeries.createPriceLine({
              price: displayPrice,
              color: "#3b82f6",
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: "",
            });
          }, 100);
        }
      } catch (error) {
        console.error("Failed to load price history:", error);
      }

      // Scroll to real-time
      chart.timeScale().scrollToRealTime();
      chart.timeScale().fitContent();

      // 订阅实时更新
      unsubscribe = await socratesOracleService.subscribeToPriceUpdates("BTC/USD", (priceData: PriceData) => {
        if (!isSubscribed) return;

        const newPrice = parseFloat(priceData.price);
        const currentTime = priceData.unix_time;

        setLatestPrice(newPrice);

        // 直接更新图表
        lineSeries.update({
          time: currentTime as Time,
          value: newPrice,
        });

        // 更新 PartialPriceLine
        if (partialPriceLineRef.current) {
          partialPriceLineRef.current.updateAllViews();
        }

        // Scroll to real-time
        chart.timeScale().scrollToRealTime();
      });

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };

      window.addEventListener("resize", handleResize);
    };

    initializeChart();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        socratesOracleService.unsubscribe("BTC/USD");
      }
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [targetPrice, isDark]);

  // 主题变化时更新图表样式
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#000000" : "#ffffff" },
        textColor: isDark ? "#e5e5e5" : "#999999",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "#f0f0f0" },
        horzLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "#f0f0f0" },
      },
      timeScale: {
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "#e0e0e0",
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "#e0e0e0",
      },
    });
    // 更新 PartialPriceLine 的主题
    if (partialPriceLineRef.current) {
      partialPriceLineRef.current.setDarkMode(isDark);
      partialPriceLineRef.current.updateAllViews();
    }
  }, [isDark]);

  return (
    <Card className="p-4 border border-border bg-card h-full flex flex-col">
      <div ref={chartContainerRef} className="flex-1 min-h-0" />
    </Card>
  );
};

export default PriceChart;
