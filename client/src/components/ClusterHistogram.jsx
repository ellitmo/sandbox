import * as d3 from "d3";
import { getChartDimensions, DATA_API, DUCKDB_API } from "./Constants";
import { useMemo, memo, useEffect, useState } from "react";

import axios from "axios";

const ClusterHistogram = memo(({ clusterId, chartColor }) => {
  const [varValues, setVarValues] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [varName, setVarName] = useState("popularity");
  const [varOptions, setVarOptions] = useState([]);

  const { width, height, margin, innerWidth, innerHeight } =
    getChartDimensions();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const response = await axios.get(`${DATA_API}/varnames?numeric=true`);
        setVarOptions(response.data);
      } catch (err) {
        setError(`Failed to get variable name data: ${err.message}`);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await axios.get(
          `${DUCKDB_API}/clusterstats?cluster_id=${clusterId}&var=${varName}`,
        );
        setVarValues(response.data);
      } catch (err) {
        setError(`Failed to get histogram data: ${err.message}`);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [clusterId, varName]);

  const { bins, xScaleLinear, yScaleLinear } = useMemo(() => {
    // Return empty object with defaults if no data
    if (!varValues || varValues.length === 0) {
      return {
        bins: [],
        xScaleLinear: d3.scaleLinear().range([0, innerWidth]),
        yScaleLinear: d3.scaleLinear().range([innerHeight, 0]),
      };
    }

    const histogram = d3.bin().domain(d3.extent(varValues)).thresholds(25);

    const bins = histogram(varValues);

    const xScaleLinear = d3
      .scaleLinear()
      .domain([bins[0].x0, bins[bins.length - 1].x1])
      .range([0, innerWidth]);

    const yScaleLinear = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length)])
      .range([innerHeight, 0]);

    return { bins, xScaleLinear, yScaleLinear };
  }, [varValues, innerHeight, innerWidth]);
  if (error) {
    return (
      <div className="cluster-visualization">
        <p style={{ color: "red" }}>{error}</p>
        <p>Could not fetch data! Check FastAPI server logs.</p>
      </div>
    );
  }
  return (
    <div
      style={{
        position: "relative",
        minHeight: height,
        minWidth: width,
        padding: "10px",
      }}
    >
      {(isLoadingOptions || isLoadingStats) && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          Loading histogram...
        </div>
      )}
      <h3
        style={{
          marginBottom: "15px",
          fontSize: "18px",
          color: "#333",
          textAlign: "left",
        }}
      >
        Select feature:
      </h3>
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <div>
          <select
            value={varName}
            onChange={(e) => setVarName(e.target.value)}
            style={{
              padding: "8px 2px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              color: "#333",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            {varOptions.map((varName) => (
              <option key={varName} value={varName}>
                {varName.charAt(0).toUpperCase() + varName.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <h2>{varName} Distribution</h2>
      <svg width={width} height={height} style={{ border: "1px solid #eee" }}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {bins &&
            bins.length > 0 &&
            bins.map((bin, i) => (
              <rect
                key={i}
                x={xScaleLinear(bin.x0)}
                y={yScaleLinear(bin.length)}
                width={
                  Math.max(1, xScaleLinear(bin.x1) - xScaleLinear(bin.x0)) - 1
                }
                height={innerHeight - yScaleLinear(bin.length)}
                fill={chartColor}
                opacity={0.7}
              />
            ))}
          <g transform={`translate(0, ${innerHeight})`}>
            <line x1={0} x2={innerWidth} stroke="#333" />
            {xScaleLinear.ticks(8).map((tick) => (
              <g key={tick} transform={`translate(${xScaleLinear(tick)}, 0)`}>
                <line y1={0} y2={6} stroke="#333" />
                <text y={20} textAnchor="middle" fontSize="12" fill="#333">
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}
            <text
              textAnchor="middle"
              color="#333"
              fontSize="14"
              x={innerWidth / 2}
              y={35}
            >
              {varName}
            </text>
          </g>
          <g>
            <line y1={0} y2={innerHeight} stroke="#333" />
            {yScaleLinear.ticks(5).map((tick) => (
              <g key={tick} transform={`translate(0, ${yScaleLinear(tick)})`}>
                <line x1={-6} x2={0} stroke="#333" />
                <text
                  x={-10}
                  dy="0.35em"
                  textAnchor="end"
                  fontSize="12"
                  fill="#333"
                >
                  {tick}
                </text>
              </g>
            ))}
            <text
              x={-innerHeight / 2}
              y={-50}
              textAnchor="middle"
              transform={`rotate(-90)`}
              fill="#333"
              fontSize="14"
            >
              Count
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
});

export default ClusterHistogram;
