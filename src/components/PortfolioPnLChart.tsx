import { useEffect, useRef } from "react";
import { 
  createChart, 
  ColorType, 
  LineData,
  LineSeries,
  LastPriceAnimationMode,
  LineType,
  Time,
  IChartApi,
  ISeriesApi
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { PartialPriceLine } from "@/lib/chart/PartialPriceLine";

// 生成模拟的 P&L 历史数据（30天）
const generatePnLData = (): LineData[] => {
  const data: LineData[] = [];
  const now = Math.floor(Date.now() / 1000);
  const daysAgo = 30;
  
  let cumulativePnL = 0;
  
  for (let i = daysAgo; i >= 0; i--) {
    const time = (now - i * 24 * 3600) as Time;
    
    // 模拟每天的盈亏变化（随机波动，略微偏向盈利）
    const dailyChange = (Math.random() - 0.45) * 100;
    cumulativePnL += dailyChange;
    
    data.push({
      time,
      value: cumulativePnL,
    });
  }
  
  return data;
};

// 生成实时更新数据（模拟最近的交易盈亏）
const generateRealtimeUpdates = (baseData: LineData[]): LineData[] => {
  const updates: LineData[] = [];
  const lastPoint = baseData[baseData.length - 1];
  const lastTime = lastPoint.time as number;
  let lastValue = lastPoint.value;
  
  // 生成最近 20 个数据点（模拟实时交易）
  for (let i = 1; i <= 20; i++) {
    const time = (lastTime + i * 1800) as Time; // 每 30 分钟一个点
    const change = (Math.random() - 0.48) * 50; // 小幅波动
    lastValue += change;
    
    updates.push({
      time,
      value: lastValue,
    });
  }
  
  return updates;
};

const PortfolioPnLChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const partialPriceLineRef = useRef<PartialPriceLine | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart (完全按照 chart 示例的方式)
    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0b0b0b" : "#ffffff" },
        textColor: isDark ? "#e5e5e5" : "#999999",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "#f0f0f0" },
        horzLines: { color: isDark ? "rgba(80, 80, 80, 0.5)" : "#f0f0f0" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "#e0e0e0",
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(80, 80, 80, 1)" : "#e0e0e0",
      },
    });

    chartRef.current = chart;

    // Add line series with curved line (平滑曲线)
    const lineSeries = chart.addSeries(LineSeries, {
      lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
      color: "#10b981", // 绿色表示盈利
      lineWidth: 3,
      lineType: LineType.Curved, // ← 关键：使用曲线类型
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBorderColor: "#10b981",
      crosshairMarkerBackgroundColor: "#10b981",
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    lineSeriesRef.current = lineSeries;

    // Attach PartialPriceLine plugin (完全按照 chart 示例)
    const partialPriceLine = new PartialPriceLine(isDark);
    lineSeries.attachPrimitive(partialPriceLine);
    partialPriceLineRef.current = partialPriceLine;

    // Generate data
    const data = generatePnLData();
    const realtimeUpdates = generateRealtimeUpdates(data);
    
    // Set initial data (完全按照 chart 示例)
    const [initialData, _realtimeData] = [data, realtimeUpdates];
    lineSeries.setData(initialData);

    // Scroll to show recent data (完全按照 chart 示例)
    const pos = chart.timeScale().scrollPosition();
    chart.timeScale().scrollToPosition(pos + 20, false);

    // Simulate real-time data updates (完全按照 chart 示例的方式)
    function* getNextRealtimeUpdate(realtimeData: LineData[]) {
      for (const dataPoint of realtimeData) {
        yield dataPoint;
      }
      return null;
    }
    
    const streamingDataProvider = getNextRealtimeUpdate(realtimeUpdates);

    const intervalID = setInterval(() => {
      const update = streamingDataProvider.next();
      if (update.done) {
        clearInterval(intervalID);
        return;
      }
      lineSeries.update(update.value);
    }, 500); // 每 500ms 更新一次

    // Handle resize
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
      clearInterval(intervalID);
      chart.remove();
    };
  }, [isDark]);

  // 主题变化时更新 PartialPriceLine
  useEffect(() => {
    if (!chartRef.current || !partialPriceLineRef.current) return;
    
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0b0b0b" : "#ffffff" },
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
    
    // 更新 PartialPriceLine 主题
    partialPriceLineRef.current.setDarkMode(isDark);
    partialPriceLineRef.current.updateAllViews();
  }, [isDark]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default PortfolioPnLChart;
