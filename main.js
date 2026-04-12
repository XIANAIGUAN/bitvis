const margin = { top: 30, right: 20, bottom: 120, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

const svg = d3.select("#visualization")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

d3.csv("data.csv").then(raw => {
  const data = raw.map(d => ({
    category: d.category,
    value: +d.value
  }));

  let currentData = [...data];

  const x = d3.scaleBand()
    .domain(currentData.map(d => d.category))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([height, 0]);

  svg.append("g")
    .attr("class", "axis-x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-40)");

  svg.append("g")
    .attr("class", "axis-y")
    .call(d3.axisLeft(y));

  function update() {
    x.domain(currentData.map(d => d.category));
    y.domain([0, d3.max(currentData, d => d.value)]);

    svg.select(".axis-x")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-40)");

    svg.select(".axis-y")
      .call(d3.axisLeft(y));

    const bars = svg.selectAll("rect")
      .data(currentData, d => d.category);

    bars.exit().remove();

    const enter = bars.enter()
      .append("rect")
      .attr("fill", "#409eff")
      .attr("x", d => x(d.category))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0);

    enter.merge(bars)
      .transition()
      .duration(400)
      .attr("x", d => x(d.category))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value));

    svg.selectAll("rect")
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`类别：${d.category}<br/>数值：${d.value}`)
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(100).style("opacity", 0);
      });
  }

  update();

  d3.select("#show-all").on("click", () => {
    currentData = [...data];
    update();
  });

  d3.select("#show-top10").on("click", () => {
    currentData = [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    update();
  });
});