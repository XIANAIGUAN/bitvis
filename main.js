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

// 同时加载两个CSV
Promise.all([
  d3.csv("API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv"),
  d3.csv("Metadata_Country_API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv")
]).then(([data, countryMeta]) => {

  // 🔥修复点1：使用 trim() 去除表头空格，兼容各种格式的 CSV
  const countryRegionMap = new Map();
  countryMeta.forEach(item => {
    const code = (item["Country Code"] || item["CountryCode"] || "").trim();
    const region = (item["Region"] || "").trim();
    if (code && region) {
      countryRegionMap.set(code, region);
    }
  });

  // 🔥修复点2：智能获取年份列（处理空格）
  let targetYearColumn = "2021";
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const yearHeader = headers.find(h => h.trim().includes("2021")) || "2021";
    targetYearColumn = yearHeader;
  }

  // 处理核心数据
  const processedData = data
    .map(item => ({
      code: (item["Country Code"] || "").trim(),
      name: (item["Country Name"] || "").trim(),
      value: +item[targetYearColumn]
    }))
    .filter(item => {
      // 过滤无效数据
      return item.code && item.name && !isNaN(item.value) && item.value > 0 && countryRegionMap.has(item.code);
    })
    .map(item => ({
      ...item,
      region: countryRegionMap.get(item.code),
      year: "2021"
    }))
    .sort((a, b) => a.value - b.value);

  let currentData = [...processedData];

  // 绘制轴
  const x = d3.scaleBand()
    .domain(currentData.map(d => d.name))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(currentData, d => d.value)])
    .range([height, 0]);

  // X轴
  svg.append("g")
    .attr("class", "axis-x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .style("font-size", "9px");

  // Y轴
  svg.append("g")
    .attr("class", "axis-y")
    .call(d3.axisLeft(y).tickFormat(d => d + "‰"));

  function updateChart() {
    x.domain(currentData.map(d => d.name));
    y.domain([0, d3.max(currentData, d => d.value)]);

    svg.select(".axis-x")
      .transition()
      .duration(500)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-45)")
      .style("font-size", "9px");

    svg.select(".axis-y")
      .transition()
      .duration(500)
      .call(d3.axisLeft(y).tickFormat(d => d + "‰"));

    const bars = svg.selectAll("rect")
      .data(currentData, d => d.code);

    bars.exit().remove();

    const newBars = bars.enter()
      .append("rect")
      .attr("fill", d => regionColor[d.region] || "#ccc")
      .attr("x", d => x(d.name))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0);

    newBars.merge(bars)
      .transition()
      .duration(500)
      .attr("x", d => x(d.name))
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value))
      .attr("fill", d => regionColor[d.region] || "#ccc");

    // Tooltip 事件
    svg.selectAll("rect")
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", 1)
          .html(`国家：${d.name}<br>地区：${d.region}<br>死亡率：${d.value.toFixed(2)}‰<br>年份：${d.year}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
  }

  updateChart();

  // 按钮事件
  d3.select("#show-all").on("click", () => {
    currentData = [...processedData];
    updateChart();
  });

  d3.select("#show-asia").on("click", () => {
    currentData = processedData.filter(d => 
      d.region === "East Asia & Pacific" || d.region === "South Asia"
    );
    updateChart();
  });

  d3.select("#show-europe").on("click", () => {
    currentData = processedData.filter(d => 
      d.region === "Europe & Central Asia"
    );
    updateChart();
  });

}).catch(err => {
  console.log("最终错误捕获：", err);
  // 如果报错，在页面显示错误信息
  document.body.innerHTML += "<div style='color:red; padding:20px;'>数据加载失败，请检查 CSV 文件是否存在！</div>";
});
