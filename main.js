const margin = { top: 30, right: 20, bottom: 150, left: 70 };
const width = 900 - margin.left - margin.right;
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
  "South Asia": "#f56c6c",
  "Sub-Saharan Africa": "#5cdbd3",
  "Latin America & Caribbean": "#e6a23c"
};

Promise.all([
  d3.csv("API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv"),
  d3.csv("Metadata_Country_API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv")
]).then(([data, countryMeta]) => {

  // 国家-地区映射（兼容你仓库的真实列名）
  const regionMap = {};
  countryMeta.forEach(d => {
    const code = d["Country Code"];
    const region = d["Region"];
    if (code && region) regionMap[code] = region;
  });

  // 强制清洗数据（解决你CSV隐藏字符问题）
  const cleaned = data.map(d => {
    const code = d["Country Code"]?.trim();
    const name = d["Country Name"]?.trim();
    const val = parseFloat(d["2021"]);
    return { code, name, val, region: regionMap[code] };
  }).filter(d => d.code && d.name && !isNaN(d.val) && d.region);

  let current = cleaned.slice(0, 40);

  // 比例尺
  const x = d3.scaleBand()
    .domain(current.map(d => d.name))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(current, d => d.val)])
    .range([height, 0]);

  // 轴
  svg.append("g")
    .attr("class", "x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("class", "y")
    .call(d3.axisLeft(y).tickFormat(v => v + "‰"));

  function update() {
    const bars = svg.selectAll("rect").data(current, d => d.code);
    bars.exit().remove();

    bars.enter()
      .append("rect")
      .attr("fill", d => regionColor[d.region] || "#777")
      .merge(bars)
      .transition()
      .duration(400)
      .attr("x", d => x(d.name))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.val))
      .attr("height", d => height - y(d.val));

    svg.selectAll("rect")
      .on("mouseover", (e, d) => {
        tooltip.style("opacity", 1)
          .html(`国家：${d.name}<br>地区：${d.region}<br>死亡率：${d.val.toFixed(1)}‰`)
          .style("left", e.pageX + 10 + "px")
          .style("top", e.pageY - 40 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  }

  update();

  // 按钮
  d3.select("#show-all").on("click", () => {
    current = cleaned.slice(0,40);
    update();
  });

  d3.select("#show-asia").on("click", () => {
    current = cleaned.filter(d =>
      d.region === "East Asia & Pacific" || d.region === "South Asia"
    ).slice(0,30);
    update();
  });

  d3.select("#show-europe").on("click", () => {
    current = cleaned.filter(d =>
      d.region === "Europe & Central Asia"
    ).slice(0,30);
    update();
  });

}).catch(e => console.error("错误：", e));
