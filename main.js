const margin = { top: 30, right: 20, bottom: 150, left: 80 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#visualization")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

const regionColor = {
  "East Asia & Pacific": "#409eff",
  "Europe & Central Asia": "#67c23a",
  "Latin America & Caribbean": "#e6a23c",
  "Middle East & North Africa": "#909399",
  "North America": "#ff9800",
  "South Asia": "#f56c6c",
  "Sub-Saharan Africa": "#5cdbd3"
};

Promise.all([
  d3.csv("API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv"),
  d3.csv("Metadata_Country_API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv")
]).then(([data, countryMeta]) => {

  const countryToRegion = {};
  countryMeta.forEach(row => {
    const code = row["CountryCode"] || row["Country Code"];
    const region = row["Region"];
    if (code && region) countryToRegion[code] = region;
  });

  const validRows = data.filter(row => {
    const code = row["Country Code"];
    const val = row["2021"];
    return code && val && !isNaN(+val) && countryToRegion[code];
  });

  const processed = validRows.map(row => ({
    country: row["Country Name"],
    code: row["Country Code"],
    region: countryToRegion[row["Country Code"]],
    value: +row["2021"],
    year: "2021"
  })).sort((a, b) => a.value - b.value);

  let current = [...processed];

  const x = d3.scaleBand()
    .domain(current.map(d => d.country))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(current, d => d.value)])
    .range([height, 0]);

  svg.append("g")
    .attr("class", "axis-x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .style("font-size", "9px");

  svg.append("g")
    .attr("class", "axis-y")
    .call(d3.axisLeft(y).tickFormat(d => d + "‰"));

  function update() {
    x.domain(current.map(d => d.country));
    y.domain([0, d3.max(current, d => d.value)]);

    svg.select(".axis-x").call(d3.axisBottom(x))
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-45)")
      .style("font-size", "9px");

    svg.select(".axis-y").call(d3.axisLeft(y).tickFormat(d => d + "‰"));

    const u = svg.selectAll("rect")
      .data(current, d => d.code);

    u.exit().remove();

    u.enter()
      .append("rect")
      .merge(u)
      .transition()
      .duration(400)
      .attr("x", d => x(d.country))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => regionColor[d.region] || "#888");

    svg.selectAll("rect")
      .on("mouseover", function (e, d) {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          国家：${d.country}<br/>
          地区：${d.region}<br/>
          死亡率：${d.value.toFixed(2)}‰<br/>
          年份：2021
        `)
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY - 30) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(100).style("opacity", 0);
      });
  }

  update();

  d3.select("#show-all").on("click", () => {
    current = [...processed];
    update();
  });

  d3.select("#show-asia").on("click", () => {
    current = processed.filter(d =>
      d.region === "East Asia & Pacific" || d.region === "South Asia"
    );
    update();
  });

  d3.select("#show-europe").on("click", () => {
    current = processed.filter(d =>
      d.region === "Europe & Central Asia"
    );
    update();
  });

}).catch(err => {
  console.error("加载数据失败：", err);
});
