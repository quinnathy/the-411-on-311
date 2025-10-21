const scroller = scrollama();
const tooltip = d3.select("#tooltip");

Promise.all([
  d3.json("data/311_complaint_avg.geojson"),
  d3.json("data/311_wait_times.geojson")
]).then(([geo1, geo2]) => {
  const width = window.innerWidth * 0.6;
  const height = window.innerHeight;

  // Ensure numeric values for avg_ccount
  geo1.features.forEach(d => d.properties.avg_ccount = +d.properties.avg_ccount);
  geo2.features.forEach(d => d.properties.avg_wait_hours = +d.properties.avg_wait_hours);

  // Set up shared projection
  const projection = d3.geoMercator().fitSize([width, height], geo1); 

  const path = d3.geoPath(projection);

  // --- COLOR SCALES ---
  // You can use the same scale if both maps have comparable values,
  // or separate scales if they’re totally different ranges.
  const color1 = d3.scaleQuantile()
    .domain(geo1.features.map(d => d.properties.avg_ccount))
    .range(d3.schemeGnBu[9]);

  const color2 = d3.scaleQuantile()
    .domain(geo2.features.map(d => d.properties.avg_wait_hours))
    .range(d3.schemePuRd[9]);

  // --- MAP 1 ---
  const svg1 = d3.select("#map1")
    .attr("width", width)
    .attr("height", height);

  svg1.selectAll("path")
    
    .style("background", "none")
    .data(geo1.features)
    .attr("id", d => `zip-${d.properties.zip}`)
    .join("path")
    .attr("d", path)
    .attr("fill", d => color1(d.properties.avg_ccount))
    .attr("stroke", "#1E1E29")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
        .html(`<strong>ZIP:</strong> ${d.properties.zip}<br>
               <strong>Avg Count:</strong> ${d.properties.avg_ccount.toFixed(2)}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", event.pageX + 12 + "px")
             .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));


  // --- MAP 2 ---
  const svg2 = d3.select("#map2")
    .attr("width", width)
    .attr("height", height);

  svg2.selectAll("path")
  .style("background", "none")
    .data(geo2.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => color2(d.properties.avg_wait_hours))
    .attr("stroke", "#1E1E29")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
        .html(`<strong>ZIP:</strong> ${d.properties.zip}<br>
               <strong>Avg Wait (hrs):</strong> ${d.properties.avg_wait_hours.toFixed(2)}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", event.pageX + 12 + "px")
             .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

//--chart--//
const ctx = document.getElementById('waitChart').getContext('2d');

const avgWaitDays = [
  786, 669, 665, 654, 577
];

const complaintTypes = [
  'Window Guard', 'Smoking', 'Tattooing', 'Day Care', 'Adopt-A-Basket'
];

const counts = [
  100, 13353, 931, 7620, 651
];

const data = {
  labels: complaintTypes,
  datasets: [{
    label: 'Average Wait (days)',
    data: Array(avgWaitDays.length).fill(0),
    backgroundColor: [
      '#fff3b0',
      '#ffe066',
      '#f9c74f',
      '#f8961e',
      '#f3722c'],
    borderWidth: 0,         // no borders
    barPercentage: 1.0,     // full-width bars
    categoryPercentage: 1.0
  }]
};

const waitChart = new Chart(ctx, {
  type: 'bar',
  data: data,
  options: {
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${counts[context.dataIndex].toLocaleString()} complaints`
        }
      }
    },
    scales: {
      x: { 
        beginAtZero: true,
        ticks: {
          color: '#fff',
          font: { family: 'IBM Plex Serif, serif', size: 13, weight: '400' }
        }
      },
      y: { 
        ticks: {
          color: '#fff',
          font: { family: 'IBM Plex Serif, serif', size: 13, weight: '400' }
        }
      }
    }
  }
});



//- scroll logic and operations 
  function handleStepEnter(response) {
    const step = +response.element.dataset.step;
    tooltip.style("display", "none");
    console.log("Entered step:", step);

    if (step < 2) {
      svg1.style("opacity", 1).style("pointer-events", "all");
      svg2.style("opacity", 0).style("pointer-events", "none");
    } else if (step === 2) {
      svg1.select("#zip-11225")
        .transition()
        .duration(500)
        .attr("fill", "#fff");
    } else if (step === 3) {
      svg1.transition().duration(500)
          .style("opacity", 0)
          .style("pointer-events", "none");
      svg2.style("opacity", 1).style("pointer-events", "all");
    } else if (step === 6) {
      let progress = 0;
      const duration = 1500;
      const stepTime = 20;
      const interval = setInterval(() => {
        progress += stepTime;
        const t = Math.min(progress / duration, 1);
        waitChart.data.datasets[0].data = avgWaitDays.map(v => v * t);
        waitChart.update();
        if (t === 1) clearInterval(interval);
      }, stepTime); 
    } else {
      svg1.style("opacity", 0).style("pointer-events", "none");
      svg2.style("opacity", 1).style("pointer-events", "all");
    }

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

