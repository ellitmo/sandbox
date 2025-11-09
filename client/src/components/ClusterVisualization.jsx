import { useState, useEffect, useMemo, useCallback } from 'react';
import DUCKDB_API from './Constants';
import axios from 'axios';
import * as d3 from 'd3';
import D3Circles from './D3Circles';

const ClusterVisualization = ({ onClusterClick, xVariable = 'popularity', yVariable = 'danceability' }) => {
  const [clusters, setClusters] = useState(null);
  const [staticClusters, setStaticClusters] = useState(null); // For size info
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simplified component - no complex logging

  // Fetch static cluster data for sizes and IDs
  useEffect(() => {
    const fetchStaticClusters = async () => {
      try {
        const response = await axios.get(`${DUCKDB_API}/clusters`);
        setStaticClusters(
          Object.keys(response.data.id || {}).map(key => ({
            id: response.data.id[key],
            size: response.data.size[key],
          }))
        );
      } catch (err) {
        console.error('Error fetching static cluster data:', err);
      }
    };
    fetchStaticClusters();
  }, []);

  // Fetch dynamic positions based on selected variables
  useEffect(() => {
    const fetchClusterAverages = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${DUCKDB_API}/cluster-averages?x_var=${xVariable}&y_var=${yVariable}`);

        if (response.data.error) {
          setError(response.data.error);
          return;
        }

        // Convert API response to cluster array with positions
        const clusterData = [];
        for (const [clusterId, data] of Object.entries(response.data.clusters)) {
          const staticInfo = staticClusters?.find(c => c.id === parseInt(clusterId));
          clusterData.push({
            id: parseInt(clusterId),
            x: data.x,
            y: data.y,
            size: staticInfo?.size || 50, // Use static size or default
            count: data.count
          });
        }

        setClusters(clusterData);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch cluster averages: ${err.message}`);
        console.error('Error fetching cluster averages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (staticClusters && xVariable && yVariable) {
      fetchClusterAverages();
    }
  }, [xVariable, yVariable, staticClusters]);

  const handleClusterClick = useCallback((cluster) => {
    if (onClusterClick) {
      onClusterClick(cluster);
    }
  }, [onClusterClick]);

  const width = 600;
  const height = 500;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeDark2), []); // Stable color scale

  const { clusterRender, xScale, yScale } = useMemo(() => {
    if (!clusters || clusters.length === 0) {
      return {
        clusterRender: [],
        xScale: d3.scaleLinear().range([0, innerWidth]),
        yScale: d3.scaleLinear().range([innerHeight, 0])
      };
    }

    const xExtent = d3.extent(clusters, d => d.x);
    const yExtent = d3.extent(clusters, d => d.y);

    const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([innerHeight, 0]); // Invert Y-axis for SVG

    const radii = d3.extent(clusters, d => d.size);
    const rScale = d3.scaleSqrt()
      .domain(radii)
      .range([10, 30]); // Reasonable radius range

    const clusterRender = clusters.map((cluster, i) => ({
      ...cluster,
      x: xScale(cluster.x),
      y: yScale(cluster.y),
      r: rScale(cluster.size),
      color: colorScale(cluster.id)
    }));

    return { clusterRender, xScale, yScale };
  }, [clusters, innerWidth, innerHeight, colorScale]);

  if (isLoading) {
    return (
      <div className="cluster-visualization">
        <h2>Music Clusters</h2>
        <p>Loading cluster data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cluster-visualization">
        <h2>Music Clusters</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Could not fetch data! Check FastAPI server logs.</p>
      </div>
    );
  }

  if (!clusters || clusters.length === 0) {
    return (
      <div className="cluster-visualization">
        <h2>Music Clusters</h2>
        <p>No cluster data found. Are you pointing to the right DB?</p>
      </div>
    );
  }

  return (
    <div className="cluster-visualization">
      <h2>Spotify Music Clusters</h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
        Showing clusters positioned by average <strong>{xVariable}</strong> (X) vs <strong>{yVariable}</strong> (Y)
      </p>
      <svg width={width} height={height} style={{ border: '1px solid #ddd' }}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <rect
            width={innerWidth}
            height={innerHeight}
            fill="#fafafa"
            stroke="#e0e0e0"
          />

          <g transform={`translate(0, ${innerHeight})`}>
            <line x1={0} x2={innerWidth} stroke="#cdcbcbff" strokeWidth={1} />
            {xScale && xScale.ticks(5).map(tick => (
              <g key={tick} transform={`translate(${xScale(tick)}, 0)`}>
                <line y1={0} y2={6} stroke="#cdcbcbff" />
                <text y={20} textAnchor="middle" fontSize="12" fill="#cdcbcbff">
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}
          </g>

          <g>
            <line y1={0} y2={innerHeight} stroke="#cdcbcbff" strokeWidth={1} />
            {yScale && yScale.ticks(5).map(tick => (
              <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                <line x1={-6} x2={0} stroke="#cdcbcbff" />
                <text x={-10} dy="0.35em" textAnchor="end" fontSize="12" fill="#cdcbcbff">
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}
          </g>
          <D3Circles
            clusters={clusterRender}
            onClusterClick={handleClusterClick}
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
};

export default ClusterVisualization;