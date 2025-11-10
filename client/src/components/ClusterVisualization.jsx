import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { getChartDimensions, DUCKDB_API } from "./Constants";
import axios from "axios";
import * as d3 from "d3";
import D3Circles from "./D3Circles";
import ClusterHover from "./ClusterHover";

const ClusterVisualization = memo(
  ({
    onClusterClick,
    xVariable = "popularity",
    yVariable = "danceability",
    selectedClusters = [],
  }) => {
    const [clusters, setClusters] = useState(null);
    const [staticClusters, setStaticClusters] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categoricalData, setCategoricalData] = useState(null);
    const [currentHover, setCurrentHover] = useState(null);

    useEffect(() => {
      const fetchStaticClusters = async () => {
        try {
          const response = await axios.get(`${DUCKDB_API}/clusters`);
          setStaticClusters(
            Object.keys(response.data.id || {}).map((key) => ({
              id: response.data.id[key],
              size: response.data.size[key],
            })),
          );
        } catch (err) {
          console.error("Error fetching static cluster data:", err);
        }
      };
      fetchStaticClusters();
    }, []);

    useEffect(() => {
      const fetchClusterAverages = async () => {
        if (!xVariable || !yVariable) {
          return;
        }

        try {
          setIsLoading(true);
          const response = await axios.get(
            `${DUCKDB_API}/cluster-averages?x_var=${xVariable}&y_var=${yVariable}`,
          );

          if (response.data.error) {
            setError(response.data.error);
            return;
          }

          const clusterData = [];
          for (const [clusterId, data] of Object.entries(
            response.data.clusters,
          )) {
            const staticInfo = staticClusters?.find(
              (c) => c.id === parseInt(clusterId),
            );
            clusterData.push({
              id: parseInt(clusterId),
              x: data.x,
              y: data.y,
              size: staticInfo?.size || 50,
              count: data.count,
            });
          }

          setClusters(clusterData);
          setError(null);
        } catch (err) {
          setError(`Failed to fetch cluster averages: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };

      fetchClusterAverages();
    }, [xVariable, yVariable, staticClusters]);

    useEffect(() => {
      const fetchClusterCategories = async () => {
        try {
          const response = await axios.get(`${DUCKDB_API}/categorical`);
          setCategoricalData(response.data);
        } catch (err) {
          console.error("Error fetching categorical summaires:", err);
        }
      };
      fetchClusterCategories();
    }, []);
    // callbacks
    const handleClusterClick = useCallback(
      (event, cluster) => {
        if (onClusterClick) {
          onClusterClick(event, cluster);
        }
      },
      [onClusterClick],
    );

    //d3 things
    const { width, height, margin, innerWidth, innerHeight } =
      getChartDimensions();

    const handleHover = useCallback(
      (event, cluster) => {
        const svg = event.currentTarget.closest("svg");
        const svgRect = svg.getBoundingClientRect();
        setCurrentHover({
          cluster,
          position: {
            x: svgRect.left + cluster.x + margin.left,
            y: svgRect.top + cluster.y + margin.top,
          },
        });
      },
      [margin.left, margin.top],
    );

    const handleHoverLeave = useCallback(() => {
      setCurrentHover(null);
    }, []);

    const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeDark2), []);

    const { xScale, yScale } = useMemo(() => {
      if (!clusters || clusters.length === 0) {
        return {
          xScale: d3.scaleLinear().range([0, innerWidth]),
          yScale: d3.scaleLinear().range([innerHeight, 0]),
        };
      }

      const xExtent = d3.extent(clusters, (d) => d.x);
      const yExtent = d3.extent(clusters, (d) => d.y);

      const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
      const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

      const xScale = d3
        .scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
        .range([0, innerWidth]);

      const yScale = d3
        .scaleLinear()
        .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
        .range([innerHeight, 0]); // Invert Y-axis for SVG

      return { xScale, yScale };
    }, [clusters, innerWidth, innerHeight]);
    // actually create cluster
    const clusterRender = useMemo(() => {
      if (!clusters || clusters.length === 0 || !xScale || !yScale) {
        return [];
      }

      const radii = d3.extent(clusters, (d) => d.size);
      const rScale = d3.scaleSqrt().domain(radii).range([10, 30]);

      return clusters.map((cluster) => ({
        id: cluster.id,
        x: xScale(cluster.x),
        y: yScale(cluster.y),
        r: rScale(cluster.size),
        color: colorScale(cluster.id),
        originalX: cluster.x,
        originalY: cluster.y,
        size: cluster.size,
        count: cluster.count,
      }));
    }, [clusters, xScale, yScale, colorScale]);

    // subselect categorical data for tooltip
    const selectedCategoricalData = useMemo(() => {
      if (!currentHover?.cluster || !categoricalData) {
        return null;
      }
      return categoricalData[currentHover.cluster.id];
    }, [currentHover, categoricalData]);

    if (isLoading) {
      return (
        <div
          className="cluster-visualization"
          style={{ width: width, minHeight: height + 100 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>Spotify Music Clusters</h2>
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid #f3f3f3",
                borderTop: "2px solid #666",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </div>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
            Loading cluster data...
          </p>
          <div
            style={{
              width: width,
              height: height,
              border: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fafafa",
            }}
          >
            <p style={{ color: "#999" }}>Loading visualization...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="cluster-visualization"
          style={{ width: width, minHeight: height + 100 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ margin: 0, color: "#d32f2f" }}>
              Spotify Music Clusters
            </h2>
          </div>
          <p
            style={{ fontSize: "14px", color: "#d32f2f", marginBottom: "15px" }}
          >
            {error}
          </p>
          <div
            style={{
              width: width,
              height: height,
              border: "1px solid #d32f2f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffeaea",
            }}
          >
            <p style={{ color: "#d32f2f" }}>
              Could not fetch data! Check FastAPI server logs.
            </p>
          </div>
        </div>
      );
    }

    if (!clusters || clusters.length === 0) {
      return (
        <div
          className="cluster-visualization"
          style={{ width: width, minHeight: height + 100 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>Spotify Music Clusters</h2>
          </div>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
            No cluster data found. Are you pointing to the right DB?
          </p>
          <div
            style={{
              width: width,
              height: height,
              border: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fafafa",
            }}
          >
            <p style={{ color: "#999" }}>No data to display</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="cluster-visualization"
        style={{ width: width, minHeight: height + 100, position: "relative" }}
      >
        <ClusterHover
          cluster={currentHover?.cluster}
          position={currentHover?.position}
          categoricalData={selectedCategoricalData}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "10px",
          }}
        >
          {isLoading && (
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid #f3f3f3",
                borderTop: "2px solid #666",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          )}
        </div>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
          Showing clusters positioned by average <strong>{xVariable}</strong>{" "}
          (X) vs <strong>{yVariable}</strong> (Y)
          <br />
          Click on a cluster to see histogram distributions of its features
          <br />
          Shift + click on 2 clusters to compare currently selected features
          {isLoading && (
            <span style={{ color: "#999", marginLeft: "10px" }}>
              (Loading...)
            </span>
          )}
        </p>
        <svg width={width} height={height} style={{ border: "1px solid #ddd" }}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <rect
              width={innerWidth}
              height={innerHeight}
              fill="#fafafa"
              stroke="#e0e0e0"
            />

            <g transform={`translate(0, ${innerHeight})`}>
              <line x1={0} x2={innerWidth} stroke="#cdcbcbff" strokeWidth={1} />
              {xScale &&
                xScale.ticks(5).map((tick) => (
                  <g key={tick} transform={`translate(${xScale(tick)}, 0)`}>
                    <line y1={0} y2={6} stroke="#cdcbcbff" />
                    <text
                      y={20}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#cdcbcbff"
                    >
                      {tick.toFixed(1)}
                    </text>
                  </g>
                ))}
            </g>

            <g>
              <line
                y1={0}
                y2={innerHeight}
                stroke="#cdcbcbff"
                strokeWidth={1}
              />
              {yScale &&
                yScale.ticks(5).map((tick) => (
                  <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                    <line x1={-6} x2={0} stroke="#cdcbcbff" />
                    <text
                      x={-10}
                      dy="0.35em"
                      textAnchor="end"
                      fontSize="12"
                      fill="#cdcbcbff"
                    >
                      {tick.toFixed(1)}
                    </text>
                  </g>
                ))}
            </g>
            <D3Circles
              clusters={clusterRender}
              onClusterClick={handleClusterClick}
              onHover={handleHover}
              onHoverLeave={handleHoverLeave}
              selectedClusters={selectedClusters}
            />
          </g>
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#cdcbcbff"
          >
            {xVariable.charAt(0).toUpperCase() + xVariable.slice(1)}
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#cdcbcbff"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            {yVariable.charAt(0).toUpperCase() + yVariable.slice(1)}
          </text>
        </svg>
      </div>
    );
  },
);

export default ClusterVisualization;
