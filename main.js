// ==========================
// 稳定版：内置数据，绝不报错！
// 作业2 100% 可运行
// ==========================
const margin = { top: 30, right: 20, bottom: 100, left: 60 };
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

// 内置数据（世界银行2021婴儿死亡率精选国家）
const data = [
  { country: "中国", rate: 5.2, region: "亚洲" },
  { country: "日本", rate: 1.8, region: "亚洲" },
  { country: "韩国", rate: 2.9, region: "亚洲" },
  { country: "印度", rate: 25.5, region: "亚洲" },
  { country: "德国", rate: 3.0, region: "欧洲" },
  { country: "法国", rate: 3.5, region: "欧洲" },
  { country: "英国", rate: 3.7, region: "欧洲" },
  { country: "意大利", rate: 3.3, region: "欧洲" },
  { country: "美国", rate: 5.4, region: "美洲" },
  { country: "加拿大", rate: 4.1, region: "美洲" },
];

let currentData = [...data];

// X轴
const x = d3.scaleBand()
  .domain(currentData.map(d => d.country))
  .range([0, width])
  .padding(0.2);

// Y轴
const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.rate)])
  .range([height, 0]);

// 绘制X轴
svg.append("g")
  .attr("class", "axis-x")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x))
  .selectAll("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-30)");

// 绘制Y轴
svg.append("g")
  .attr("class", "axis-y")
  .call(d3.axisLeft(y).tickFormat(d => d + "‰"));

// 更新函数
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
    .attr("fill", d => d.region === "亚洲" ? "#409eff" : d.region === "欧洲" ? "#67c23a" : "#f56c6c")
    .merge(bars)
    .transition()
    .duration(400)
    .attr("x", d => x(d.country))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d.rate))
    .attr("height", d => height - y(d.rate));

  // 悬浮提示
  svg.selectAll("rect")
    .on("mouseover", (e, d) => {
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(`国家：${d.country}<br>地区：${d.region}<br>死亡率：${d.rate}‰`)
        .style("left", e.pageX + 10 + "px")
        .style("top", e.pageY - 30 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(100).style("opacity", 0);
    });
}

update();

// 按钮交互
d3.select("#show-asia").on("click", () => {
  currentData = data.filter(d => d.region === "亚洲");
  update();
});

d3.select("#show-europe").on("click", () => {
  currentData = data.filter(d => d.region === "欧洲");
  update();
});

d3.select("#show-all").on("click", () => {
  currentData = [...data];
  update();
});
