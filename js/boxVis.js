class boxVis {
// constructor
    constructor(parentElement, vaxdata){
        this.vaxdata = vaxdata;
        this.parentElement = parentElement;
        this.parseDate = d3.timeParse("%Y-%m-%d")

        let vis = this;
        vis.margin = {top: 40, right: 5, bottom: 70, left: 70},
            vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = 450 - vis.margin.top - vis.margin.bottom;

        // define colors
        this.initVis()
    }

    initVis() {
        let vis = this;
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        let filteredData = vis.vaxdata;

        vis.groupData = [];

        filteredData.forEach(country => {
            // populate the final data structure
            let date_updated = country.DATE_UPDATED.parseDate; // fix this - currently undefined
            let first_vaccine_date = country.FIRST_VACCINE_DATE.parseDate; // fix this - currently undefined
            let onePlus = +country.PERSONS_VACCINATED_1PLUS_DOSE;
            let perHundred = +country.PERSONS_VACCINATED_1PLUS_DOSE_PER100;
            if (country.NUMBER_VACCINES_TYPES_USED != 0) {
                vis.groupData.push(
                    {
                        country: country.COUNTRY,
                        oneplus: onePlus,
                        perhundred: perHundred,
                        numvax: +country.NUMBER_VACCINES_TYPES_USED,
                        vaxed: country.PERSONS_FULLY_VACCINATED,
                        vaxed100: country.PERSONS_FULLY_VACCINATED_PER100,
                        totvax: country.TOTAL_VACCINATIONS,
                        totvax100: country.TOTAL_VACCINATIONS_PER100,
                        vaxnames: country.VACCINES_USED,
                        region: nameConverter.getFullName(country.WHO_REGION),
                        code: country.countryCode,
                        gdp: country.gdpercapita
                    }
                )
            }
        })

        console.log(vis.groupData);

        // Compute quartiles, median, inter quantile range min and max --> these info are then used to draw the box.

        vis.sumstat = Array.from(d3.rollup(vis.groupData, function (d) {
            let q1 = d3.quantile(d.map(function(g) { return g.numvax;}).sort(function(a, b){return a-b}),.25)
            let median = d3.quantile(d.map(function(g) { return g.numvax;}).sort(function(a, b){return a-b}),.5)
            let q3 = d3.quantile(d.map(function(g) { return g.numvax;}).sort(function(a, b){return a-b}),.75)
            let interQuantileRange = q3 - q1;
            let min = d3.min(d.map(function (g) {return g.numvax;}));
            let max = d3.max(d.map(function (g) {return g.numvax;}));
            return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max})}, v => v.region));

        console.log(vis.sumstat)

        // Show the X scale
        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .domain(vis.groupData.map(d => d.region))
            .paddingInner(1)
            .paddingOuter(.5)

            // Show the Y scale
        vis.y = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([0, d3.max(vis.groupData.map(d => d.numvax))]);

        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.groupData.map(d => d.region))
            .range(["#F3DF2E", "#CDB61A", "#94bb86", "#758225", "#445B1F","#33451D", "black"]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.svg.append("g")
            .call(vis.xAxis)
            .attr("transform",
                "translate(0," + vis.height + ")")
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-20)");;

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.yAxis = vis.svg.append("g")
            .call(vis.yAxis)

        // Show the main vertical line
        vis.svg
            .selectAll("vertLines")
            .data(vis.sumstat)
            .enter()
            .append("line")
            .attr("x1", function(d){return(vis.x(d[0]))})
            .attr("x2", function(d){return(vis.x(d[0]))})
            .attr("y1", function(d){return(vis.y(d[1].min))})
            .attr("y2", function(d){return(vis.y(d[1].max))})
            .attr("stroke", d => vis.colorScale(d[0]))
            .style("filter", "brightness(50%)")
            .style("width", 40)

        vis.boxnum = 8;

        // rectangle for the main box
        vis.boxWidth = vis.width/vis.boxnum;

        vis.svg
            .selectAll("boxes")
            .data(vis.sumstat)
            .enter()
            .append("rect")
            .attr("x", function(d){return vis.x(d[0])-vis.boxWidth/2;})
            .attr("y", function(d){return vis.y(d[1].q3);})
            .attr("height", function(d){return vis.y(d[1].q1) - vis.y(d[1].q3);})
            .attr("width", vis.boxWidth)
            .attr("stroke", d => vis.colorScale(d[0]))
            .style("filter", "brightness(125%)")
            .attr("class", "boxes")
            .style("fill", d => vis.colorScale(d[0]))
            .attr("opacity", 0.75);

        // Show the median
        vis.svg
            .selectAll("medianLines")
            .data(vis.sumstat)
            .enter()
            .append("line")
            .attr("x1", function(d){return(vis.x(d[0])-vis.boxWidth/2) })
            .attr("x2", function(d){return(vis.x(d[0])+vis.boxWidth/2) })
            .attr("y1", function(d){return(vis.y(d[1].median))})
            .attr("y2", function(d){return(vis.y(d[1].median))})
            .attr("stroke", "black")
            .attr("class", "medianLines")
            .style("width", 80);

        // Show the max and min
        vis.svg
            .selectAll("medianLines")
            .data(vis.sumstat)
            .enter()
            .append("line")
            .attr("x1", function(d){return(vis.x(d[0])-vis.boxWidth/2) })
            .attr("x2", function(d){return(vis.x(d[0])+vis.boxWidth/2) })
            .attr("y1", function(d){return(vis.y(d[1].max))})
            .attr("y2", function(d){return(vis.y(d[1].max))})
            .attr("stroke", "black")
            .attr("class", "maxLines")
            .style("width", 80);

        vis.svg
            .selectAll("medianLines")
            .data(vis.sumstat)
            .enter()
            .append("line")
            .attr("x1", function(d){return(vis.x(d[0])-vis.boxWidth/2) })
            .attr("x2", function(d){return(vis.x(d[0])+vis.boxWidth/2) })
            .attr("y1", function(d){return(vis.y(d[1].min))})
            .attr("y2", function(d){return(vis.y(d[1].min))})
            .attr("stroke", "black")
            .attr("class", "minLines")
            .style("width", 80);

        // Add individual points with jitter
        var jitterWidth = vis.boxWidth*0.8;

        vis.svg
            .selectAll("indPoints")
            .data(this.groupData)
            .enter()
            .append("circle")
            .attr("cx", function(d){return(vis.x(d.region) - jitterWidth/2 + Math.random()*jitterWidth )})
            .attr("cy", function(d){return(vis.y(d.numvax))})
            .attr("r", 4)
            .style("fill", d => vis.colorScale(d.region))
            .attr("opacity",0.5)
            .attr("stroke", "black")
            .on("mouseover", function(event, d){
                document.getElementById("countryid").textContent = d.country;
                document.getElementById("numvaxused").textContent = d.numvax;
                document.getElementById("whoregion").textContent = d.region;
                document.getElementById("numvaccinated").textContent = d.vaxed;
                document.getElementById("vaccinesused").textContent = d.vaxnames;
                document.getElementById("gdppc").textContent = d.gdp;

            })

        // add axes labels
        vis.svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", vis.width/2 + vis.margin.left)
            .attr("y", vis.height+55)
            .text("WHO Region")
            .style("font-size", "12px")
            .style('font-weight', 'bold');

        vis.svg.append("g")
            .attr('transform', 'translate(' + -1/2*vis.margin.left + ', ' + vis.height/2 + ')')
            .append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("# of Types of Vaccines Used by Country")
            .style("font-size", "10px")
            .style("font-weight", 'bold');

        vis.svg.append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", vis.width/2)
            .attr("y", -5)
            .text("National Access to Vaccine Types by WHO Region")
            .attr("class", "natvaxTitle");

        this.wrangleData();
    }

    wrangleData () {
        let vis = this
        // next iteration: enable sort of box plots by the following parameters:
        // largest number of countries
        // default alphabetical order
        // highest average number of vaccines

        vis.updateVis()

    }
    updateVis() {
        let vis = this;
        // update order of display
    }


}