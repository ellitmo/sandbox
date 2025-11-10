export const DUCKDB_API = "http://localhost:8000/api/duckdb";
export const DATA_API = "http://localhost:8000/api/data";
export const CHART_CONFIG = {
  width: 700,
  height: 500,
  margin: { top: 40, right: 40, bottom: 60, left: 70 },
};

export const GREEN = "#1ED760"
export const getChartDimensions = (config = CHART_CONFIG) => ({
  ...config,
  innerWidth: config.width - config.margin.left - config.margin.right,
  innerHeight: config.height - config.margin.top - config.margin.bottom,
});
