import { useEffect, useRef, memo } from "react";
import * as d3 from "d3";

const D3Circles = memo(({ clusters, onClusterClick, selectedClusters }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !clusters || clusters.length === 0) {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("g.cluster-group").remove();
      }
      return;
    }

    const svg = d3.select(svgRef.current);
    const groups = svg.selectAll("g.cluster-group").data(clusters, (d) => d.id);

    const selected = selectedClusters || []; // trying to avoid undef errors
    const isSelected = (id) => selected.find((c) => c.id === id);
    // EXIT: Remove old clusters with smooth transition
    groups
      .exit()
      .transition("exit")
      .duration(250)
      .ease(d3.easeQuadInOut)
      .style("opacity", 0)
      .attr("transform", (d) => `translate(${d.x}, ${d.y}) scale(0.1)`)
      .remove();

    // ENTER: Create new cluster groups
    const enterGroups = groups
      .enter()
      .append("g")
      .attr("class", "cluster-group")
      .attr("transform", (d) => `translate(${d.x}, ${d.y}) scale(0.1)`)
      .style("opacity", 0);

    // Add circles to new groups
    enterGroups
      .append("circle")
      .attr("r", 0) // Start at radius 0
      .attr("fill", (d) => d.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        if (onClusterClick) {
          onClusterClick(event, d);
        }
      });

    enterGroups
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "0")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text((d) => d.id);

    const allGroups = enterGroups.merge(groups);

    allGroups
      .transition("update")
      .duration(400)
      .ease(d3.easeBackOut.overshoot(0.3))
      .attr("transform", (d) => `translate(${d.x}, ${d.y}) scale(1)`)
      .style("opacity", 1);

    allGroups
      .select("circle")
      .transition("update")
      .duration(400)
      .ease(d3.easeQuadOut)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => d.color);

    allGroups
      .select("circle")
      .attr("stroke", (d) => (isSelected(d.id) ? "#15df22ff" : "white"))
      .attr("stroke-width", (d) => (isSelected(d.id) ? 4 : 2));

    allGroups
      .select("text")
      .transition("update")
      .duration(400)
      .ease(d3.easeQuadOut)
      .delay(100)
      .attr("font-size", "12");

    allGroups.select("circle").on("click", (event, d) => {
      if (onClusterClick) {
        onClusterClick(event, d);
      }
    });
  }, [clusters, onClusterClick, selectedClusters]);

  return <g ref={svgRef}></g>;
});

export default D3Circles;
