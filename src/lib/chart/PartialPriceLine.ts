import { CanvasRenderingTarget2D } from "fancy-canvas";
import {
  BarData,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  LineData,
  LineStyleOptions,
  MismatchDirection,
  SeriesAttachedParameter,
  SeriesType,
  Time,
  WhitespaceData,
} from "lightweight-charts";

function positionsLine(
  position: number,
  pixelRatio: number,
  verticalPixelRatio: number
): { position: number; length: number } {
  return {
    position: Math.round(position * pixelRatio),
    length: verticalPixelRatio,
  };
}

class PartialPriceLineRenderer implements IPrimitivePaneRenderer {
  _price: number | null = null;
  _x: number | null = null;
  _color: string = "#000000";
  _isDark: boolean = false;

  update(priceY: number | null, color: string, x: number | null, isDark: boolean = false) {
    this._price = priceY;
    this._color = color;
    this._x = x;
    this._isDark = isDark;
  }

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this._price === null || this._x === null) return;
      const xPosition = Math.round(this._x * scope.horizontalPixelRatio);
      const yPosition = positionsLine(this._price, scope.verticalPixelRatio, scope.verticalPixelRatio);
      const yCentre = yPosition.position + yPosition.length / 2;
      const ctx = scope.context;

      // Draw dashed line from current price to right edge
      ctx.beginPath();
      ctx.setLineDash([4 * scope.verticalPixelRatio, 2 * scope.verticalPixelRatio]);
      ctx.moveTo(xPosition, yCentre);
      ctx.lineTo(scope.bitmapSize.width, yCentre);
      ctx.strokeStyle = this._color;
      ctx.lineWidth = scope.verticalPixelRatio;
      ctx.stroke();

      // Draw circle at the end point
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.arc(xPosition, yCentre, 6 * scope.verticalPixelRatio, 0, 2 * Math.PI);
      // 根据主题设置圆圈填充颜色
      ctx.fillStyle = this._isDark ? "#000000" : "#ffffff";
      ctx.fill();
      ctx.strokeStyle = this._color;
      ctx.lineWidth = 2 * scope.verticalPixelRatio;
      ctx.stroke();
    });
  }
}

class PartialPriceLineView implements IPrimitivePaneView {
  _renderer: PartialPriceLineRenderer;
  _isDark: boolean = false;

  constructor(isDark: boolean = false) {
    this._renderer = new PartialPriceLineRenderer();
    this._isDark = isDark;
  }

  renderer(): IPrimitivePaneRenderer {
    return this._renderer;
  }

  update(priceY: number | null, color: string, x: number | null) {
    this._renderer.update(priceY, color, x, this._isDark);
  }

  setDarkMode(isDark: boolean) {
    this._isDark = isDark;
  }
}

export class PartialPriceLine implements ISeriesPrimitive<Time> {
  _paneViews: PartialPriceLineView[];
  _chart: IChartApi | null = null;
  _series: ISeriesApi<SeriesType> | null = null;
  _isDark: boolean = false;

  constructor(isDark: boolean = false) {
    this._isDark = isDark;
    this._paneViews = [new PartialPriceLineView(isDark)];
  }

  setDarkMode(isDark: boolean) {
    this._isDark = isDark;
    this._paneViews.forEach((pv) => pv.setDarkMode(isDark));
  }

  attached({ chart, series }: SeriesAttachedParameter<Time>) {
    this._chart = chart;
    this._series = series;
    this._series.applyOptions({
      priceLineVisible: false,
    });
  }

  detached() {
    this._chart = null;
    this._series = null;
  }

  updateAllViews() {
    if (!this._series || !this._chart) return;

    const seriesOptions = this._series.options();
    let color = seriesOptions.priceLineColor || (seriesOptions as LineStyleOptions).color || "#f59e0b";

    // 获取数据总数，然后获取最后一个数据点（修复移动端位置问题）
    const dataSize = this._series.data().length;
    let lastValue: LineData | BarData | WhitespaceData | null = null;

    if (dataSize > 0) {
      // 从最后一个索引开始查找，确保获取到真实的数据点
      for (let i = dataSize - 1; i >= 0; i--) {
        const value = this._series.dataByIndex(i, MismatchDirection.NearestLeft);
        if (value && (value as LineData).value !== undefined) {
          lastValue = value;
          break;
        }
      }
    }

    let price: number | null = null;
    let x: number | null = null;

    if (lastValue) {
      if ((lastValue as BarData).color !== undefined) {
        color = (lastValue as BarData).color!;
      }
      price = getValue(lastValue);
      if (price !== null && lastValue.time) {
        x = this._chart.timeScale().timeToCoordinate(lastValue.time);
      }
    }

    const priceY = price !== null ? (this._series.priceToCoordinate(price) as number) : null;

    this._paneViews.forEach((pw) => pw.update(priceY, color, x));
  }

  paneViews() {
    return this._paneViews;
  }
}

function getValue(data: LineData | BarData | WhitespaceData): number | null {
  if ((data as LineData).value !== undefined) return (data as LineData).value;
  if ((data as BarData).close !== undefined) return (data as BarData).close;
  return null;
}
