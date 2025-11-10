import * as d3 from "d3";
import { useMemo, memo, useEffect, useState } from "react";
import axios from "axios";
import { getChartDimensions, DUCKDB_API } from "./Constants";
import { Spinner } from "@chakra-ui/react";

const ClusterScatterplot = memo(
  ({ clusterId1, clusterId2, xVariable, yVariable }) => {
    const [scatterplotPoints, setScatterplotPoints] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const color1 = "magenta";
    const color2 = "limegreen";

    useEffect(() => {
      setIsLoading(true);
      const fetchScatterplot = async () => {
        try {
          const response =
            await axios.get(`${DUCKDB_API}/compare?cluster_id1=${clusterId1}
                    &cluster_id2=${clusterId2}&var1=${xVariable}&var2=${yVariable}`);
          const points = [];
          for (const [clusterId, data] of Object.entries(
            response.data.clusters,
          )) {
            for (let i = 0; i < data.x.length; i++) {
              points.push({
                clusterId: parseInt(clusterId),
                x: data.x[i],
                y: data.y[i],
              });
            }
          }

          setScatterplotPoints(points);
        } catch (err) {
          console.error("Error fetching scatterplot data:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchScatterplot();
    }, [clusterId1, clusterId2, xVariable, yVariable]);

    //d3 things
    const { width, height, margin, innerWidth, innerHeight } =
      getChartDimensions();
    //memoize d3 math
    const { plotPoints, xScale, yScale } = useMemo(() => {
      if (!scatterplotPoints || scatterplotPoints.length === 0) {
        return {
          plotPoints: [],
          xScale: d3.scaleLinear().range([0, innerWidth]),
          yScale: d3.scaleLinear().range([innerHeight, 0]),
        };
      }

      const xExtent = d3.extent(scatterplotPoints, (d) => d.x);
      const yExtent = d3.extent(scatterplotPoints, (d) => d.y);
      const xScale = d3
        .scaleLinear()
        .domain(xExtent)
        .range([0, innerWidth])
        .nice();

      const yScale = d3
        .scaleLinear()
        .domain(yExtent)
        .range([innerHeight, 0])
        .nice();

      const plotPoints = scatterplotPoints.map((p) => ({
        ...p,
        x: xScale(p.x),
        y: yScale(p.y),
        color: p.clusterId === clusterId1 ? color1 : color2,
      }));

      return { plotPoints, xScale, yScale };
    }, [
      scatterplotPoints,
      clusterId1,
      color1,
      color2,
      innerWidth,
      innerHeight,
    ]);
    //create scatterplot
    return (
      <div>
        <h3>
          Cluster Comparison: {clusterId1} vs {clusterId2}
        </h3>
        {isLoading && <Spinner />}
        <svg width={width} height={height}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <rect
              width={innerWidth}
              height={innerHeight}
              fill="#fafafa"
              stroke="#e0e0e0"
            />
            {plotPoints.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={2}
                fill={point.color}
                opacity={0.7}
              />
            ))}
            <g transform={`translate(0, ${innerHeight + 1})`}>
              <line x1={0} x2={innerWidth} stroke="#333" strokeWidth={1} />
              {xScale.ticks(5).map((tick) => (
                <g key={tick} transform={`translate(${xScale(tick)}, 0)`}>
                  <line y1={0} y2={6} stroke="#333" />
                  <text y={20} textAnchor="middle" fontSize="12">
                    {tick.toFixed(2)}
                  </text>
                </g>
              ))}
            </g>
            <g>
              <line y1={0} y2={innerHeight + 1} stroke="#333" strokeWidth={1} />
              {yScale.ticks(5).map((tick) => (
                <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                  <line x1={-6} x2={0} stroke="#333" />
                  <text x={-10} dy="0.35em" textAnchor="end" fontSize="12">
                    {tick.toFixed(2)}
                  </text>
                </g>
              ))}
            </g>
          </g>
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
          >
            {xVariable}
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            {yVariable}
          </text>
          <g transform={`translate(${width - 150}, 0)`}>
            <circle cx={10} cy={10} r={3} fill={color1} opacity={0.8} />
            <text x={20} y={15} fontSize="12">
              Cluster {clusterId1}
            </text>
            <circle cx={10} cy={30} r={3} fill={color2} opacity={0.8} />
            <text x={20} y={35} fontSize="12">
              Cluster {clusterId2}
            </text>
          </g>
        </svg>
      </div>
    );
  },
);

export default ClusterScatterplot;
