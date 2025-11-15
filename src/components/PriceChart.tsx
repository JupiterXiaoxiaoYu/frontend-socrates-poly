import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createChart, LineStyle, ColorType, AreaSeries as AreaSeriesType, Time } from "lightweight-charts";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { PartialPriceLine } from "@/lib/chart/PartialPriceLine";
import { socratesOracleService, PriceData, PriceHistoryData } from "@/services/socratesOracle";

interface PriceChartProps {
  targetPrice: number;
  currentPrice?: number;
  onPriceUpdate?: (price: number) => void; // 新增：价格更新回调
}

const PriceChart = ({ targetPrice, currentPrice, onPriceUpdate }: PriceChartProps) => {
  const { t } = useTranslation('market');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [latestPrice, setLatestPrice] = useState<number | null>(currentPrice || null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // 当价格更新时通知父组件
  useEffect(() => {
    if (latestPrice !== null && onPriceUpdate) {
      onPriceUpdate(latestPrice);
    }
  }, [latestPrice, onPriceUpdate]);
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<any>(null);
  const lineSeriesRef = useRef<any>(null);
  const partialPriceLineRef = useRef<any>(null);
  const smoothPriceRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetPriceRef = useRef<number | null>(null);

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

      // Create line series
      const lineSeries = chart.addSeries(AreaSeriesType as any, {
        lineColor: "#f59e0b",
        topColor: "rgba(245, 158, 11, 0.2)",
        bottomColor: "rgba(245, 158, 11, 0.0)",
        lineWidth: 3,
        priceLineVisible: false,
        lineStyle: 0, // solid
        crosshairMarkerVisible: false,
        lastValueVisible: false,
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

      // Add target price line with more visible styling
      lineSeries.createPriceLine({
        price: targetPrice,
        color: "#3b82f6", // Blue color for better visibility
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Price to Beat",
      });

      // Get 60 seconds of historical data
      try {
        const historyData: PriceHistoryData = await socratesOracleService.getPriceHistory("BTC/USD");

        if (isSubscribed && historyData.prices && historyData.prices.length > 0) {
          // Convert historical data to chart format
          const chartData = historyData.prices.map((point) => ({
            time: point.unix_time as Time,
            value: parseFloat(point.price),
          }));

          lineSeries.setData(chartData);

          // Update current price with the latest price from history
          const latestHistoricalPrice = historyData.prices[historyData.prices.length - 1];
          const latestPriceValue = parseFloat(latestHistoricalPrice.price);
          setLatestPrice(latestPriceValue);
          smoothPriceRef.current = latestPriceValue;
          setIsLoading(false);
        }
      } catch (error) {
        // Fallback to mock data with currentPrice
        const now = Math.floor(Date.now() / 1000);
        const fallbackData = [];
        let basePrice = currentPrice || 120000;

        for (let i = 60; i >= 0; i--) {
          const time = (now - i) as Time;
          const volatility = 50;
          const change = (Math.random() - 0.5) * volatility;
          basePrice = basePrice + change * 0.3;

          fallbackData.push({
            time,
            value: basePrice,
          });
        }

        lineSeries.setData(fallbackData);
        setLatestPrice(basePrice);
        smoothPriceRef.current = basePrice;
        setIsLoading(false);
      }

      // Scroll to real-time
      chart.timeScale().scrollToRealTime();
      chart.timeScale().fitContent();

      // Smooth animation function
      const animateToTarget = (targetValue: number, currentTime: number) => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        const startValue = smoothPriceRef.current || targetValue;
        const startTime = performance.now();
        const duration = 500; // 500ms for smooth transition

        const animate = (currentTime_ms: number) => {
          const elapsed = currentTime_ms - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function for smooth animation
          const easeInOutCubic = (t: number) => {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          };

          const smoothValue = startValue + (targetValue - startValue) * easeInOutCubic(progress);

          // Update the smooth data
          const smoothPoint = {
            time: currentTime as Time,
            value: smoothValue,
          };

          // Update chart with smooth point
          lineSeries.update(smoothPoint);
          if (partialPriceLineRef.current) {
            partialPriceLineRef.current.updateAllViews();
          }

          smoothPriceRef.current = smoothValue;

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      // Subscribe to real-time updates with smooth animation
      unsubscribe = await socratesOracleService.subscribeToPriceUpdates("BTC/USD", (priceData: PriceData) => {
        if (!isSubscribed) return;

        const newPrice = parseFloat(priceData.price);
        const currentTime = priceData.unix_time;

        setLatestPrice(newPrice);

        // Store target price for smooth animation
        targetPriceRef.current = newPrice;

        // Trigger smooth animation to new price
        animateToTarget(newPrice, currentTime);

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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [targetPrice, currentPrice]);

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
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-xs text-muted-foreground mb-1">{t('currentPrice')}</div>
          <div className="text-xl font-bold text-foreground">
            {isLoading ? (
              <span className="text-muted-foreground">{t('loading')}</span>
            ) : latestPrice ? (
              `$${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ) : (
              `$${(currentPrice || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-blue-600 mb-1">{t('priceToBeat')}</div>
          <div className="text-lg font-bold text-blue-700">
            ${targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-1 min-h-0" />
    </Card>
  );
};

export default PriceChart;
