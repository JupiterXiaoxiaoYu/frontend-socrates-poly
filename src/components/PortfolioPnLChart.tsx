import { useEffect, useRef } from "react";
import { createChart, ColorType, LineSeries as LineSeriesType, IChartApi } from "lightweight-charts";
import { useTheme } from "next-themes";

const PortfolioPnLChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0b0b0b" : "#ffffff" },
        textColor: isDark ? "#e5e5e5" : "#999999",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: isDark ? "rgba(80,80,80,0.5)" : "#f0f0f0" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 160,
      timeScale: {
        timeVisible: true,
        borderColor: isDark ? "rgba(80,80,80,1)" : "#e0e0e0",
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(80,80,80,1)" : "#e0e0e0",
      },
    });

    const lineSeries = chart.addSeries(LineSeriesType as any, {
      color: "#f59e0b",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    // Generate sample data
    const now = Math.floor(Date.now() / 1000);
    const data: any[] = [];
    let baseValue = 3000;

    for (let i = 100; i >= 0; i--) {
      const time = now - i * 3600; // hourly data
      const change = (Math.random() - 0.45) * 50; // slight upward bias
      baseValue = Math.max(2500, baseValue + change);

      data.push({
        time,
        value: baseValue,
      });
    }

    lineSeries.setData(data);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    chartRef.current = chart;

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [isDark]);

  // 主题变化时平滑更新样式（如果不想重建图表）
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0b0b0b" : "#ffffff" },
        textColor: isDark ? "#e5e5e5" : "#999999",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: isDark ? "rgba(80,80,80,0.5)" : "#f0f0f0" },
      },
      timeScale: {
        borderColor: isDark ? "rgba(80,80,80,1)" : "#e0e0e0",
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(80,80,80,1)" : "#e0e0e0",
      },
    });
  }, [isDark]);

  return <div ref={chartContainerRef} className="w-full" />;
};

export default PortfolioPnLChart;
