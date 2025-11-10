import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { Flex } from "@chakra-ui/react";

export default function D3Plot({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 30, right: 120, bottom: 70, left: 70 };
    const width = 650 - margin.left - margin.right;
    const height = 650 - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const genes = Array.from(new Set(data.map((d) => d.gene)));
    const groups = Array.from(new Set(data.map((d) => d.metadata)));
    const tpmList = data.map((d) => d.tpm);
    const colorRange = [Math.min(...tpmList), Math.max(...tpmList)];

    const x = d3.scaleBand().range([0, width]).domain(genes).padding(0.05);
    const y = d3.scaleBand().range([height, 0]).domain(groups).padding(0.05);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .style("fill", "black")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("text-anchor", "end")
      .style("fill", "black");

    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain(colorRange);

    // Create tooltip div
    const tooltip = d3
      .select("body")
      .selectAll(".d3-tooltip")
      .data([0])
      .join("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.3)");

    // Create heatmap rectangles
    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.gene))
      .attr("y", (d) => y(d.metadata))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d) => colorScale(d.tpm))
      .style("stroke", "#333")
      .style("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        // Enhance rectangle appearance
        d3.select(this).style("stroke-width", 3).style("stroke", "#35e7ffff");

        // Show tooltip with detailed info
        tooltip
          .style("visibility", "visible")
          .html(
            `
                        <strong>Gene:</strong> ${d.gene}<br>
                        <strong>Source:</strong> ${d.metadata}<br>
                        <strong>TPM:</strong> ${d.tpm.toFixed(2)}<br>
                    `,
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mousemove", function (event, d) {
        // Update tooltip position as mouse moves
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function (event, d) {
        // Reset rectangle appearance
        d3.select(this).style("stroke-width", 1).style("stroke", "#333");

        // Hide tooltip
        tooltip.style("visibility", "hidden");
      });

    // Create colorbar legend
    const colorbarWidth = 20;
    const colorbarHeight = height;
    const colorbarX = width + 30; // Position to the right of heatmap

    // Create colorbar group
    const colorbarGroup = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + colorbarX}, ${margin.top})`,
      );

    const numSegments = 50; // Number of color segments
    const segmentHeight = colorbarHeight / numSegments;

    // Create data array for colorbar segments
    const colorbarData = [];
    for (let i = 0; i < numSegments; i++) {
      const t = i / (numSegments - 1);
      const value = colorRange[0] + t * (colorRange[1] - colorRange[0]);
      const yPos = colorbarHeight - (i + 1) * segmentHeight; // Bottom to top
      colorbarData.push({ value, yPos });
    }

    // Add colorbar rectangles
    colorbarGroup
      .selectAll(".colorbar-segment")
      .data(colorbarData)
      .join("rect")
      .attr("class", "colorbar-segment")
      .attr("x", 0)
      .attr("y", (d) => d.yPos)
      .attr("width", colorbarWidth)
      .attr("height", segmentHeight + 1) // +1 to avoid gaps
      .style("fill", (d) => colorScale(d.value))
      .style("stroke", "none");

    // Add border around entire colorbar
    colorbarGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", colorbarWidth)
      .attr("height", colorbarHeight)
      .style("fill", "none")
      .style("stroke", "#333")
      .style("stroke-width", 1);

    // Create scale for colorbar axis
    const colorbarScale = d3
      .scaleLinear()
      .domain(colorRange)
      .range([colorbarHeight, 0]); // Reverse for bottom-to-top

    // Add colorbar axis
    const colorbarAxis = d3
      .axisRight(colorbarScale)
      .tickSize(6)
      .tickFormat(d3.format(".1f"));

    colorbarGroup
      .append("g")
      .attr("transform", `translate(${colorbarWidth}, 0)`)
      .call(colorbarAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "black");

    // Add colorbar label
    colorbarGroup
      .append("text")
      .attr(
        "transform",
        `translate(${colorbarWidth + 35}, ${colorbarHeight / 2}) rotate(90)`,
      )
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text("TPM Values");

    // Add title
    svg
      .append("text")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Gene Expression Heatmap");

    svg
      .append("text")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", height + margin.top + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "black")
      .text("Gene");
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>No data available for heatmap visualization</p>
        <p>Please fetch data from the FastAPI server first</p>
      </div>
    );
  }

  return (
    <Flex
      bg="white"
      width="800px"
      height="800px"
      justify="center"
      align="center"
      direction="column"
      p={4}
      borderRadius="md"
      boxShadow="sm"
    >
      <svg ref={svgRef}></svg>
      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <p>Color intensity represents TPM values</p>
        <p>Lighter = Lower TPM, Darker = Higher TPM</p>
      </div>
    </Flex>
  );
}
