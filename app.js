const  margin = {top: 50, right: 30, bottom: 80, left: 10};
const w = 900 - margin.left - margin.right;
const h = 720 - margin.top - margin.bottom;

// Initialize svg, set width, height 
const svg = d3.select(".plot")
    .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// Function to get data
async function getData() {
    try {
        return fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json')
            .then(async (response) => await response.json())
    } catch(e) {
        return e;
    }
}

(async function(){
    // Get data, set titles
    let dataset = await getData();
    let cData = dataset.children;
    let title = dataset.name;
    const root = d3.hierarchy(dataset).sum(d => d.value);

    const consoles = cData.map(d => d.name);
    const colorArray = [ "#f50808", "#f56308", "#f5b408","#f4f508","#9af508","#08f526","#08f5a1","#08f5de","#08c0f5","#0882f5","#083bf5","#5f08f5","#b908f5","#f508ef","#f50890","#47517c","#477c77","#7c4747"];
    const minValue = d3.min(cData, d => {
        return d3.min(d.children, a => a.value*1);
    });
    const maxValue = d3.max(cData, d => {
        return d3.max(d.children, a => a.value*1);
    });

    function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 1.1, // ems
              y = text.attr("y"),
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
          }
        });
    }

    // Tooltip
    const tooltip = d3.select(".plot")
        .append("g")
            .attr("id", "tooltip")
            .attr("data-name", "")
            .attr("data-console", "")
            .attr("data-value", 0)
            .style("left", "0px")
            .style("visibility", "hidden");
    
    tooltip.append("div")
            .attr("class", "tooltip-text")
            .text("hidden");

    // Function called when moving mouse out of bar 
    const mouseout = function() {
        d3.select(this).style("opacity", "1");
        tooltip.style("visibility", "hidden");
    } 

    // Function called when moving mouse into bar
    const mouseover = function() {
        d3.select(this).style("opacity", ".5");
        tooltip.style("visibility", "visible");
    }

    // Function called when mouse moves on bar
    // Sets tooltip text and changes location
    const mousemove = function(data) {
        tooltip.attr("data-name", data.data.name);
        tooltip.attr("data-console", data.parent.data.name);
        tooltip.attr("data-value", data.data.value);
        const text = d3.select('.tooltip-text');
        text.html(`Name: ${data.data.name}<br/>Console: ${data.parent.data.name}
        <br/>Value: ${data.data.value}`);
        const [x, y] = d3.mouse(this);
        tooltip.style("left", `${x+67}px`)
            .style("top", `${y-720}px`)
    };

    // Add title
    svg.append('text')
        .attr("class", "text")
        .attr("id", "title")
        .style("font-size", "25px")
        .attr('x', 150)
        .attr('y', -15)
        .text(title);

    // Initialize treemap
    d3.treemap()
        .size([w, h])
        .paddingTop(1)
        .paddingRight(4)
        .paddingInner(3)
        (root);

    // Set color and opacity scales
    var color = d3.scaleOrdinal()
        .domain(consoles)
        .range(colorArray);
    
    var opacity = d3.scaleLinear()
        .domain([minValue, maxValue])
        .range([.75,1]);

    // Create node var, groups for each game
    var nodes = svg.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("class", "group");

    // Add video game areas
    nodes.append("rect")
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr("class", "tile")
        .attr("data-name", d => d.data.name)
        .attr("data-category", d => d.parent.data.name)
        .attr("data-value", d => d.data.value)
        .style("stroke", "black")
        .style("fill", d => color(d.parent.data.name) )
        .style("opacity", d => opacity(d.data.value))
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove);

    // Add video game name text to areas
    nodes.append("text")
        .text(d => d.data.name)
        .attr("transform", "translate(-97, 10)")
        //.style("text-anchor", "left")
        .attr("x", d => d.x0+100)
        .attr("y", d => d.y0)
        .attr("fill", "white")
        .attr("width", d => d.x1-(d.x0+100))
        .attr("cursor", "default")
        .attr("dy", 0)
        .attr("font-size", "8")
        .call(wrap, 50);

    // Create and append legend
    var legend = svg.append("g")
      .attr("transform", "translate(60, 625)")
      .attr("id", "legend")
      .selectAll("g")
      .data(consoles)
      .enter()
      .append("g")
      .attr("transform", function (d, i) {
        return (
          'translate(' +
          (i % 9) * 70 +
          ',' +
          (Math.floor(i / 9) * 18 +
            5 * Math.floor(i / 9)) +
          ')'
        );
      });

    // Colors in legend
    legend.append("rect")
        .attr("height", 12)
        .attr("width", 12)
        .attr("class", "legend-item")
        .attr("fill", d => color(d));

    // Legend description
    legend.append("text")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .attr("x", 15)
        .attr("y", 10)
        .text(d => d)
        .style("font-family", "verdana")
        .style("font-size", "12px")
        .style("fill", "white");


})();
