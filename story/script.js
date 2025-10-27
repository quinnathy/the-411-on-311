const scroller = scrollama();
const tooltip = d3.select("#tooltip");

Promise.all([
  d3.json("data/311_complaint_avg.geojson"),
  d3.json("data/311_wait_times.geojson"),
  d3.json("data/311_shrinkage_wait.geojson")
]).then(([geo1, geo2, geo3]) => {
  const width = window.innerWidth * 0.6;
  const height = window.innerHeight;

  // --- Data parsing ---
  geo1.features.forEach(d => d.properties.avg_ccount = +d.properties.avg_ccount);
  geo2.features.forEach(d => d.properties.avg_wait_hours = +d.properties.avg_wait_hours);
  geo3.features.forEach(d => d.properties.EB_Shrunken_Wait_Time = +d.properties.EB_Shrunken_Wait_Time);

  // --- Projection ---
  const projection = d3.geoMercator().fitSize([width, height], geo1);
  const path = d3.geoPath(projection);

  // --- Color Scales ---
  const color1 = d3.scaleQuantile()
    .domain(geo1.features.map(d => d.properties.avg_ccount))
    .range(d3.schemeGnBu[9]);

  const color2 = d3.scaleQuantile()
    .domain(geo2.features.map(d => d.properties.avg_wait_hours))
    .range(d3.schemePuRd[9]);

  const color3 = d3.scaleQuantile()
    .domain(geo3.features.map(d => d.properties.EB_Shrunken_Wait_Time))
    .range(d3.schemeRdPu[5]);

  // --- Map builder function ---
  function buildMap(containerId, geoData, colorScale, valueKey, label) {
    const svg = d3.select(containerId)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("id", d => `zip-${d.properties.zip}`)
      .attr("d", path)
      .attr("fill", d => colorScale(d.properties[valueKey]))
      .attr("stroke", "#1E1E29")
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block")
          .html(`<strong>ZIP:</strong> ${d.properties.zip}<br>
                 <strong>${label}:</strong> ${d.properties[valueKey].toFixed(2)}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", event.pageX + 12 + "px")
               .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"));

    return svg;
  }

  // --- Create all maps using config ---
  const maps = [
    { id: "#map1", geo: geo1, color: color1, key: "avg_ccount", label: "Avg Count" },
    { id: "#map2", geo: geo2, color: color2, key: "avg_wait_hours", label: "Avg Wait (hrs)" },
    { id: "#map3", geo: geo3, color: color3, key: "EB_Shrunken_Wait_Time", label: "Weighted Wait (hrs)" }
  ];

  const [svg1, svg2, svg3] = maps.map(cfg => buildMap(cfg.id, cfg.geo, cfg.color, cfg.key, cfg.label));

  svg1.style("opacity", 1).style("pointer-events", "all");
  svg2.style("opacity", 0);
  svg3.style("opacity", 0);

  // --- Scrollama logic ---
  function handleStepEnter(response) {
    const step = +response.element.dataset.step;
    tooltip.style("display", "none");
    console.log("Entered step:", step);

    [svg1, svg2, svg3].forEach((svg, i) => {
      svg.transition()
        .duration(400)
        .style("opacity", step === i + 1 ? 1 : 0)
        .style("pointer-events", step === i + 1 ? "all" : "none");
    });
  }

  scroller
    .setup({
      step: ".step",
      offset: 0.6,
      debug: false
    })
    .onStepEnter(handleStepEnter);

  window.addEventListener("resize", () => scroller.resize());
});
