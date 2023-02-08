/*
 *    main.js
 *    Mastering Data Visualization with D3.js
 *    Project 3 - CoinStats
 */

const MARGIN = { LEFT: 20, RIGHT: 100, TOP: 50, BOTTOM: 100 };
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT;
const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM;

const svg = d3
  .select("#chart-area")
  .append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM);

const g = svg.append("g").attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);

// time parser for x-scale
const parseTime = d3.timeParse("%d/%m/%Y");
// for tooltip
const bisectDate = d3.bisector((d) => d.date).left;

// scales
const x = d3.scaleTime().range([0, WIDTH]);
const y = d3.scaleLinear().range([HEIGHT, 0]);

// axis generators
const xAxisCall = d3.axisBottom();
const yAxisCall = d3
  .axisLeft()
  .ticks(6)
  .tickFormat((d) => `${parseInt(d / 1000)}k`);

// axis groups
const xAxis = g.append("g").attr("class", "x axis").attr("transform", `translate(0, ${HEIGHT})`);
const yAxis = g.append("g").attr("class", "y axis");

// y-axis label
yAxis
  .append("text")
  .attr("class", "axis-title")
  .attr("transform", "rotate(-90)")
  .attr("y", 6)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .attr("fill", "#5D6971")
  .text("Population)");

// line path generator
const line = d3
  .line()
  .x((d) => x(d.date))
  .y((d) => y(d.value));

// add line to chart
const linePath = g
  .append("path")
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", "grey")
  .attr("stroke-width", "3px");

/******************************** Tooltip Code ********************************/
const focus = g.append("g").attr("class", "focus").style("display", "none");

focus.append("line").attr("class", "x-hover-line hover-line").attr("y1", 0).attr("y2", HEIGHT);

focus.append("line").attr("class", "y-hover-line hover-line").attr("x1", 0).attr("x2", WIDTH);

focus.append("circle").attr("r", 7.5);

focus.append("text").attr("x", 15).attr("dy", ".31em");

g.append("rect")
  .attr("class", "overlay")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  .on("mouseover", () => focus.style("display", null))
  .on("mouseout", () => focus.style("display", "none"))
  .on("mousemove", mousemove);

function mousemove() {
  const [data] = linePath.data();
  const x0 = x.invert(d3.mouse(this)[0]);
  const i = bisectDate(data, x0, 1);
  const d0 = data[i - 1];
  const d1 = data[i];
  const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
  focus.attr("transform", `translate(${x(d.date)}, ${y(d.value)})`);
  focus.select("text").text(d.value);
  focus.select(".x-hover-line").attr("y2", HEIGHT - y(d.value));
  focus.select(".y-hover-line").attr("x2", -x(d.date));
}
/******************************** Tooltip Code ********************************/

const filteredData = {};

d3.json("data/coins.json").then((data) => {
  // clean data
  Object.keys(data).forEach((key) => {
    filteredData[key] = data[key].map((d) => {
      d.date = parseTime(d.date);
      d["24h_vol"] = Number(d["24h_vol"]);
      d.market_cap = Number(d.market_cap);
      d.price_usd = Number(d.price_usd);
      return d;
    });
  });

  update();
});

$("#coin-select").on("change", update);
$("#var-select").on("change", update);

function update() {
  const coin = $("#coin-select").val();
  const value = $("#var-select").val();
  const data = filteredData[coin]
    .filter((d) => d[value])
    .map((d) => ({
      date: d.date,
      value: d[value],
    }));
  const t = d3.transition().duration(500);

  // set scale domains
  x.domain(d3.extent(data, (d) => d.date));
  y.domain([d3.min(data, (d) => d.value) / 1.005, d3.max(data, (d) => d.value) * 1.005]);

  // generate axes once scales have been set
  xAxis.transition(t).call(xAxisCall.scale(x));
  yAxis.transition(t).call(yAxisCall.scale(y));

  linePath.exit().remove();

  linePath.enter().append("path").merge(linePath).data([data]).transition(t).attr("d", line);
}
