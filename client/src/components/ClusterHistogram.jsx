import * as d3 from 'd3';
import DUCKDB_API from './Constants';
import { useMemo, memo, useEffect, useState } from 'react';

import axios from 'axios';


const ClusterHistogram = memo(({ clusterId, varName, chartColor }) => {
    const [varValues, setVarValues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const width = 500;
    const height = 500;
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`${DUCKDB_API}/clusterstats?cluster_id=${clusterId}&var=${varName}`)
                setVarValues(response.data)
            } catch (err) {
                setError(`Failed to get histogram data: ${err.message}`)
            } finally {
        setIsLoading(false);
        }
    }
    fetchStats();
    }, [clusterId, varName]);

    const { bins, xScaleLinear, yScaleLinear } = useMemo(() => {
        // Return empty object with defaults if no data
        if (!varValues || varValues.length === 0) {
            return {
                bins: [],
                xScaleLinear: d3.scaleLinear().range([0, width]),
                yScaleLinear: d3.scaleLinear().range([height, 0])
            };
        }

        const histogram = d3.bin()
            .domain(d3.extent(varValues))
            .thresholds(25);

        const bins = histogram(varValues);

        const xScaleLinear = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([0, width]);

        const yScaleLinear = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([height, 0]);

        return { bins, xScaleLinear, yScaleLinear };
    }, [varValues, width, height])
  if (isLoading) {
    return (
      <div className="cluster-visualization">
        <h2>Music Clusters</h2>
        <p>Loading histograms...</p>
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
    return (
        <div>
            <h2>{varName} Distribution</h2>
            <svg width={width} height={height} style={{ border: '1px solid #eee' }}>
                {bins && bins.length > 0 && bins.map((bin, i) => (
                    <rect
                        key={i}
                        x={xScaleLinear(bin.x0)}
                        y={yScaleLinear(bin.length)}
                        width={Math.max(1, xScaleLinear(bin.x1) - xScaleLinear(bin.x0))}
                        height={height - yScaleLinear(bin.length)}
                        fill={chartColor}
                    />
                ))}
                <line x1={0} x2={width} stroke="black"/>
                <text textAnchor="middle"> {varName} </text>

                <line y1={0} y2={height} stroke="black"/>
                <text
                    x={-height/2}
                    textAnchor="middle"
                    transform={`rotate(-90)`}
                >
                    Count
                </text>
            </svg>
        </div>
    )

});


export default ClusterHistogram