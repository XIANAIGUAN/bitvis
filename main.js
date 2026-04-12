const margin = { top: 30, right: 20, bottom: 150, left: 80 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// 创建SVG容器
const svg = d3.select("#visualization")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// 提示框
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

// 颜色映射（按地区）
const regionColor = {
  "East Asia & Pacific": "#409eff",
  "Europe & Central Asia": "#67c23a",
  "Latin America & Caribbean": "#e6a23c",
  "Middle East & North Africa": "#909399",
  "North America": "#ff9800",
  "South Asia": "#f56c6c",
  "Sub-Saharan Africa": "#5cdbd3"
};

// 同时读取3个CSV文件
Promise.all([
  d3.csv("API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv"), // 核心数据
  d3.csv("Metadata_Country_API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv"), // 国家信息
  d3.csv("Metadata_Indicator_API_SP.DYN.IMRT.IN_DS2_en_csv_v2_2.csv") // 指标说明（暂用不到）
]).then(([data, countryMeta, indicatorMeta]) => {
  // 1. 处理国家元数据：构建 国家代码→地区 的映射
  const countryRegionMap = {};
  countryMeta.forEach(d => {
    if (d.Country Code && d.Region) {
      countryRegionMap[d.Country Code] = d.Region;
    }
  });

  // 2. 处理核心数据：提取2021年的死亡率（最新完整年份）
  const targetYear = "2021";
  let processedData = [];

  data.forEach(d => {
    const countryCode = d["Country Code"];
    const countryName = d["Country Name"];
    const mortalityRate = +d[targetYear]; // 死亡率数值（转为数字）

    // 过滤无效数据：必须有地区、有2021年数值
    if (countryRegionMap[countryCode] && !isNaN(mortalityRate) && mortalityRate > 0) {
      processedData.push({
        country: countryName,
        code: countryCode,
        region: countryRegionMap[countryCode],
        rate: mortalityRate,
        year: targetYear
      });
    }
  });

  // 按死亡率排序（方便查看）
  processedData.sort((a, b) => a.rate - b.rate);

  // 3. 初始化图表
  let currentData = [...processedData];

  // X轴（国家）
  const x = d3.scaleBand()
    .domain(currentData.map(d => d.country))
    .range([0, width])
    .padding(0.2);

  // Y轴（死亡率）
  const y = d3.scaleLinear()
    .domain([0, d3.max(currentData, d => d.rate)])
    .range([height, 0]);

  // 绘制X轴
  svg.append("g")
    .attr("class", "axis-x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .attr("font-size", "10px");

  // 绘制Y轴（加单位）
  svg.append("g")
    .attr("class", "axis-y")
    .call(d3.axisLeft(y).tickFormat(d => `${d}‰`)) // 千分比单位
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", -height/2)
    .attr("text-anchor", "middle")
    .attr("fill", "#333")
    .text("每1000人死亡率");

  // 4. 更新图表函数（支持筛选）
  function updateChart(filteredData) {
    // 更新轴域
    x.domain(filteredData.map(d => d.country));
    y.domain([0, d3.max(filteredData, d => d.rate)]);

    // 更新X轴
    svg.select(".axis-x")
      .transition()
      .duration(500)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-45)")
      .attr("font-size", "10px");

    // 更新Y轴
    svg.select(".axis-y")
      .transition()
      .duration(500)
      .call(d3.axisLeft(y).tickFormat(d => `${d}‰`));

    // 处理柱子（enter-update-exit模式）
    const bars = svg.selectAll("rect")
      .data(filteredData, d => d.code); // 用国家代码做唯一标识

    // 移除不需要的柱子
    bars.exit()
      .transition()
      .duration(300)
      .attr("height", 0)
      .attr("y", height)
      .remove();

    // 添加新柱子
    const newBars = bars.enter()
      .append("rect")
      .attr("x", d => x(d.country))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", d => regionColor[d.region] || "#ccc");

    // 合并新柱子和现有柱子，更新位置和高度
    newBars.merge(bars)
      .transition()
      .duration(500)
      .attr("x", d => x(d.country))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.rate))
      .attr("height", d => height - y(d.rate))
      .attr("fill", d => regionColor[d.region] || "#ccc");

    // 5. 添加交互（悬浮提示）
    svg.selectAll("rect")
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          国家：${d.country}<br>
          地区：${d.region}<br>
          死亡率：${d.rate.toFixed(2)}‰<br>
          年份：${d.year}
        `)
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 40) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(100).style("opacity", 0);
      });
  }

  // 初始化显示全部数据
  updateChart(currentData);

  // 6. 按钮筛选功能
  // 亚洲国家
  d3.select("#show-asia").on("click", () => {
    const asiaData = processedData.filter(d => d.region === "East Asia & Pacific" || d.region === "South Asia");
    updateChart(asiaData);
  });

  // 欧洲国家
  d3.select("#show-europe").on("click", () => {
    const europeData = processedData.filter(d => d.region === "Europe & Central Asia");
    updateChart(europeData);
  });

  // 全部国家
  d3.select("#show-all").on("click", () => {
    updateChart(processedData);
  });
});
