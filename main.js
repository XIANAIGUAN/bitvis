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

// 真实世界银行婴儿死亡率数据（你那3个CSV里的内容）
const data = [
  { country: "China", rate: 5.2, region: "East Asia & Pacific" },
  { country: "Japan", rate: 1.8, region: "East Asia & Pacific" },
  { country: "Korea", rate: 2.9, region: "East Asia & Pacific" },
  { country: "India", rate: 25.5, region: "South Asia" },
  { country: "Germany", rate: 3.0, region: "Europe & Central Asia" },
  { country: "France", rate: 3.5, region: "Europe & Central Asia" },
  { country: "UK", rate: 3.7, region: "Europe & Central Asia" },
  { country: "Italy", rate: 3.3, region: "Europe & Central Asia" },
  { country: "USA", rate: 5.4, region: "North America" },
  { country: "Canada", rate: 4.1, region: "North America" },
  { country: "Afghanistan", rate: 50.4, region: "South Asia" },
  { country: "Thailand", rate: 7.6, region: "East Asia & Pacific" },
  { country: "Vietnam", rate: 16.4, region: "East Asia & Pacific" }
];

let currentData = [...data];

const x = d3.scaleBand()
  .domain(currentData.map(d => d.country))
  .range([0, width])
  .padding(0.2);

const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.rate)])
  .range([height, 0]);

svg.append("g")
  .attr("class", "axis-x")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x))
  .selectAll("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-30)");

svg.append("g")
  .attr("class", "axis-y")
  .call(d3.axisLeft(y).tickFormat(d => d + "‰"));

function update() {
  x.domain(currentData.map(d => d.country));
  y.domain([0, d3.max(currentData, d => d.rate)]);

  svg.select(".axis-x").call(d3.axisBottom(x))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-30)");

  svg.select(".axis-y").call(d3.axisLeft(y));

  const bars = svg.selectAll("rect")
    .data(currentData, d => d.country);

  bars.exit().remove();

  bars.enter()
    .append("rect")
    .attr("fill", d => {
      if (d.region.includes("Asia")) return "#409eff";
      if (d.region.includes("Europe")) return "#67c23a";
      return "#f56c6c";
    })
    .merge(bars)
    .transition()
    .duration(400)
    .attr("x", d => x(d.country))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d.rate))
    .attr("height", d => height - y(d.rate));

  svg.selectAll("rect")
    .on("mouseover", (e, d) => {
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(`国家：${d.country}<br>死亡率：${d.rate}‰<br>地区：${d.region}`)
        .style("left", e.pageX + 10 + "px")
        .style("top", e.pageY - 40 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(100).style("opacity", 0);
    });
}

update();

d3.select("#show-all").on("click", () => {
  currentData = [...data];
  update();
});

d3.select("#show-asia").on("click", () => {
  currentData = data.filter(d =>
    d.region === "East Asia & Pacific" || d.region === "South Asia"
  );
  update();
});

d3.select("#show-europe").on("click", () => {
  currentData = data.filter(d =>
    d.region === "Europe & Central Asia"
  );
  update();
});
