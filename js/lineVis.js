/* * * * * * * * * * * * * *
*          Line graph for country gdp vs vaccination          *
* * * * * * * * * * * * * */

// need to get gdp data for countries. either get it and combine in the notebook or load a separate gdp csv data.
// more efficient way would be adding a gdp column to the csv data in the notebook.
// exclude the ones that have zero gdp and also color the circles and
// add the tooltips.
class lineVis {
    constructor(parentElement, gdp_data, vaccination_data){
        this.gdp_data = gdp_data;
        this.parentElement = parentElement;
        this.vaccination_data = vaccination_data
        this.initVis()
    }

    initVis(){
        let vis = this
        vis.margin = {top: 20, right: 20, bottom: 45, left: 60};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;


        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width +vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);
        // add title
        vis.scatterTitle = vis.svg.append('g')
            .attr('class', 'title scatter-title')
            .append('text')
            .attr('transform', `translate(${vis.width / 2}, 5)`)
            .attr('text-anchor', 'middle')

        // init the scales
        vis.x = d3.scaleLinear()
            .range([0, vis.width]);
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        vis.logScale = d3.scaleLog().range([0, vis.width]);
        // axis
        vis.yAxis = d3.axisLeft().scale(vis.y);
        vis.xAxis = d3.axisBottom();
        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "yAxis axis")
            .attr('transform', `translate (-7, 0)`);
        // Axis titles
        vis.svg.append("text")
            .attr("x", -300)
            .attr("y",-40)
            .text("Vaccinations per 100")
            .attr("transform", "rotate(-90)")
            .style("font-weight", "bold")
            .style("font-size", "10 px");
        vis.svg.append("text")
            .attr("x", vis.width * 0.5 - 50)
            .attr("y", vis.height + 40)
            .text("GDP per Capita")
            .style("font-weight", "bold")
            .style("font-size", "10 px");
        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("x", vis.width - 85)
            .attr("y", 25)
            .attr("height", 100)
            .attr("width", 100);


        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'scatterTooltip')

        vis.XAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis, axis")
            .attr("transform", "translate(-7," + (vis.height + 10) + ")");
        vis.colorPalette = d3.scaleOrdinal(["#F3DF2E", "#CDB61A", "#94bb86", "#758225", "#445B1F","#33451D", "black"]);
        vis.wrangleData()
    }
    wrangleData () {
        let vis = this
        // wrangle data.
        vis.vaccination_data.forEach(row => {
            row.NUMBER_VACCINES_TYPES_USED = + row.NUMBER_VACCINES_TYPES_USED
            row.TOTAL_VACCINATIONS = + row.TOTAL_VACCINATIONS
            row.TOTAL_VACCINATIONS_PER100 = +row.TOTAL_VACCINATIONS_PER100
            row.PERSONS_FULLY_VACCINATED = + row.PERSONS_FULLY_VACCINATED
            row.PERSONS_FULLY_VACCINATED_PER100 = +row.PERSONS_FULLY_VACCINATED_PER100
            row.gdpercapita = 210
            this.gdp_data.map(d => {
                if(d.Country_code === row.countryCode && +d["2020"] != 0){
                    row.gdpercapita = +d["2020"]
                }
            })
        })

        vis.updateVis()

    }
    updateVis() {

        // Moving forward, making it interactive and the code efficient.
        let vis = this;
        // update domains
        vis.rScale = d3.scaleLinear()
            .domain([d3.min(vis.vaccination_data, d => d.TOTAL_VACCINATIONS), d3.max(vis.vaccination_data, d => d.TOTAL_VACCINATIONS)])
            .range([4, 25])
        vis.x.domain([0, d3.max(vis.vaccination_data, d => d.gdpercapita)]);
        vis.y.domain([0, d3.max(vis.vaccination_data, d => d.TOTAL_VACCINATIONS_PER100)]);
        vis.logScale.domain([200, d3.max(vis.vaccination_data, d => d.gdpercapita)]);
        vis.colorPalette.domain(vis.vaccination_data.map(d => d.WHO_REGION))
        // update axis
        vis.xAxis.scale(vis.logScale);
        vis.yAxis.scale(vis.y);
        vis.yAxisGroup.call(vis.yAxis)
        vis.XAxisGroup.call(vis.xAxis)
            .attr('font-size', 'xx-small')
            .selectAll("text")
            .append("text")
            .attr("class", "x-axis-title")
            .attr("transform", "translate(" + (30) + ",0)")
            .attr("x", 260)
            .attr("y", 500)
            .text("Income per Person (GDP per Capita)")
            .attr("text-anchor", "center");

        // get the x and y values for least squares
        // extract the x labels for the axis and scale domain
        // var xLabels = data.map(function (d) { return d['yearmonth']; })
        // var xSeries = d3.range(0, d3.max(vis.vaccination_data, d => d.gdpercapita) + 1);
        // var ySeries = vis.vaccination_data.map(function(d) { return d.TOTAL_VACCINATIONS_PER100; });
        // console.log("this is the start for the trendline", xSeries, ySeries)
        // let leastSquaresCoeff = this.leastSquares(xSeries, ySeries);
        // console.log("this is", leastSquaresCoeff)

        // draw the scatter graph.
        vis.circles = vis.svg.selectAll("circle")
            .data(vis.vaccination_data);
        vis.circles.exit().remove();
        vis.circles.enter()
            .append("circle")
            .attr("cx", function (d) {
                return vis.logScale(d.gdpercapita);

            })
            .attr("cy", function (d) {
                return vis.y(d.TOTAL_VACCINATIONS_PER100);
            })
            .attr("r", function (d) {
                return vis.rScale(d.TOTAL_VACCINATIONS);
            })
            .attr("fill", function (d) {
                return vis.colorPalette(d.WHO_REGION)
            })
            .style("opacity", 0.9)
            .on('mouseover', function (event, d) {
                d3.select(this).style("fill", function (d) {
                    return vis.colorPalette(d.WHO_REGION)
                })
                    .style("r", 35)
                    .style('opacity', 0.3);
                vis.tooltip
                    .style('opacity', 1)
                    .style("left", event.pageX + 20 + "px")
                    .style('top', event.pageY + "px")
                    .html(`<div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                        <h3> ${d.COUNTRY}</h3>
                            <h6>Total Vaccination: ${d.TOTAL_VACCINATIONS}</h6>
                            <h6>Vaccinated Percentage: ${d.TOTAL_VACCINATIONS_PER100.toFixed(2)}</h6>
                            <h6>GDP Percapita: ${d.gdpercapita.toFixed(2)} USD</h6>
                            <h6> First Vaccine Date: ${d.FIRST_VACCINE_DATE}</h6>
                         </div>`
                    );

            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .style("fill", function () {
                        return vis.colorPalette(d.WHO_REGION)
                    })
                    .style("opacity", 0.9)
                    .style("r", function () {
                        return vis.rScale(d.TOTAL_VACCINATIONS);
                    });
                vis.tooltip
                    .style('opacity', 0)
                    .style('left', 0)
                    .style('top', 0)
                    .html('');
            })
        // add legend to the plot
        vis.regions = []
        vis.vaccination_data.forEach(row => {
            vis.regions.push(row.WHO_REGION)
        })
        vis.legendData = [...new Set(vis.regions)];

        vis.legend.selectAll('g').data(vis.legendData)
            .enter()
            .append('g')
            .each(function (d, i) {
                var g = d3.select(this);
                g.append("rect")
                    .attr("x", vis.width - 105)
                    .attr("y", i * 15 + 10)
                    .attr("width", 10)
                    .attr("height", 10)
                    .style("fill", () => vis.colorPalette(d));

                g.append("text")
                    .attr("x", vis.width - 90)
                    .attr("y", i * 15 + 18)
                    .attr("height", 30)
                    .attr("width", 100)
                    .style("fill", () => vis.colorPalette(d))
                    .text(function(d){
                        if (d === "EMRO") {
                            return "Eastern Mediterranean";
                        }
                        if (d === "EURO") {
                            return "Europe";
                        }
                        if (d === "AFRO") {
                            return "Africa";
                        }
                        if (d === "WPRO") {
                            return "Western Pacific";
                        }
                        if (d === "AMRO") {
                            return "Americas";
                        }
                        if (d === "SEARO") {
                            return "South East Asia";
                        }
                        if (d === "OTHER") {
                            return "Other";
                        }
                    })
                    .style("font-size", "10px");

            })
        // update the title
        vis.scatterTitle
            .text("Country GDP Vs Vaccination Rate")
            .attr("class", "gdpVvaxTitle")
    }
    // returns slope, intercept and r-square of the line
    // from: http://bl.ocks.org/benvandyke/8459843
    leastSquares(xSeries, ySeries) {
        var reduceSumFunc = function(prev, cur) { return prev + cur; };

        var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
        var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

        var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
            .reduce(reduceSumFunc);

        var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
            .reduce(reduceSumFunc);

        var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
            .reduce(reduceSumFunc);

        var slope = ssXY / ssXX;
        var intercept = yBar - (xBar * slope);
        var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

        return [slope, intercept, rSquare];
    }

}




