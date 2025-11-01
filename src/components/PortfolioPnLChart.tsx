import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries as LineSeriesType } from 'lightweight-charts';

const PortfolioPnLChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#999999',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 160,
      timeScale: {
        timeVisible: true,
        borderColor: '#e0e0e0',
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
      },
    });

    const lineSeries = chart.addSeries(LineSeriesType as any, {
      color: '#f59e0b',
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

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full" />;
};

export default PortfolioPnLChart;
