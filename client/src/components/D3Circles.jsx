import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3Circles = ({ clusters, onClusterClick }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !clusters || clusters.length === 0) return;

    const svg = d3.select(svgRef.current);

    // Clear everything and start fresh - no fancy data binding
    svg.selectAll("*").remove();

    // Add circles - simple approach
    clusters.forEach(cluster => {
      const g = svg.append('g');

      g.append('circle')
        .attr('cx', cluster.x)
        .attr('cy', cluster.y)
        .attr('r', cluster.r)
        .attr('fill', cluster.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .style('cursor', 'pointer')
        .on('click', () => {
          if (onClusterClick) {
            onClusterClick(cluster);
          }
        });

      g.append('text')
        .attr('x', cluster.x)
        .attr('y', cluster.y)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '12')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .attr('pointer-events', 'none')
        .text(cluster.id);
    });

  }, [clusters, onClusterClick]);

  return <g ref={svgRef}></g>;
};

export default D3Circles;