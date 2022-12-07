/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */

class MapVis {
    constructor(parentElement, geoData, prison_covid_rate, prison_covid_case, stateLat){
        this.parentElement = parentElement
        this.prisonRateData = prison_covid_rate
        this.prisonCaseData = prison_covid_case
        this.geoData = geoData
        this.latLong = stateLat
        this.parseDate = d3.timeParse("%m/%d/%Y")
        this.initVis()
    }

    initVis(){
        // initialization
        let vis = this;
        vis.margin = {top: 20, right: 5, bottom: 50, left: 5};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.viewpoint = {'width':976, 'height': 700}
        vis.zoom = vis.width/vis.viewpoint.width

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
        // projection for the map
        vis.projection = d3.geoAlbers()
            .translate([vis.width/2.5, vis.height/2.4])    // translate to center of screen
            .scale([1000]);

        vis.path = d3.geoPath()
            .projection(vis.projection);
        vis.map = vis.svg.append("g") // group will contain all state paths
            .attr("class", "map")
            .attr('transform', `scale(${vis.zoom} ${vis.zoom})`);

        vis.usMap = topojson.feature(vis.geoData, vis.geoData.objects.states).features

        vis.states = vis.map.selectAll(".state")
            .data(vis.usMap)
            .enter().append("path")
            .attr("fill", "transparent")
            .attr('class', 'state')
            .attr("stroke", "black")
            .attr("d", vis.path);


        // add title
        vis.title = vis.svg.append('g')
            .attr('class', 'title')
            .attr('id', 'map-title')
            .append('text')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // define the scales
        vis.colorScale = d3.scaleLinear()
            .range(["#8c8c8c", "#800000"]);
        vis.legendScale = d3.scaleLinear()
            .range([0,250]);

        // vis.svg.append("g")
        //     .attr('class', 'x-axis axis');
        // the summary tooltip
        vis.tooltip = d3.select("#" + vis.parentElement)
            .append("div")
            .attr("id", "tool-tip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("height", "260px")
            .style("width", "500px")
            .style("display", 'inline-block')
            .style("visibility", "hidden")
            .style("border-bottom", "1px dotted black")
        vis.wrangleData()
    }
    wrangleData () {
        let vis = this
        let selectedCategory = document.getElementById('categorySelector').value.split(',')[0];
        let filteredData = vis.prisonRateData;
        vis.stateInfo = []

        // merge
        filteredData.forEach(state => {
            // populate the final data structure
            let death_pct = +state.prisoner_deaths_pct;
            let case_pct = +state.prisoner_cases_pct;
            let death_rate = state.prisoner_death_rate;
            let case_rate = state.prisoner_case_rate;
            let totCase = +state.cumulative_prisoner_cases;
            let totDeath = +state.cumulative_prisoner_deaths;
            let asOf = state.latest_week
            let staff_death_pct = +state.staff_deaths_pct;
            let staff_case_pct = +state.staff_cases_pct;
            let staff_death_rate = state.staff_death_rate;
            let staff_case_rate = state.staff_case_rate;
            let staff_totCase = +state.cumulative_staff_cases;
            let staff_totDeath = +state.cumulative_staff_deaths;
            let gdp_percapita = +state.gdp_perc_2021
            // console.log( staff_death_pct, staff_case_pct, gdp_percapita)
            vis.stateInfo.push(
                {
                    state: state.name,
                    totalCases: totCase,
                    totalDeaths: totDeath,
                    relCases: case_pct,
                    relDeaths: death_pct,
                    caseRate: case_rate,
                    deathRate:death_rate,
                    staff_totalCases: staff_totCase,
                    staff_totalDeaths: staff_totDeath,
                    staff_relCases: staff_case_pct,
                    staff_relDeaths: staff_death_pct,
                    staff_caseRate: staff_case_rate,
                    staff_deathRate:staff_death_rate,
                    totPrisonCase:staff_totCase+totCase,
                    totprisonDeath:staff_totDeath+totDeath,
                    gdp_percapita:gdp_percapita,
                    Date:asOf
                }
            )
        })
        vis.stateInfo.sort((a,b) => {return b[selectedCategory] - a[selectedCategory]})
        vis.topFiveData = vis.stateInfo.slice(0, 5)

        vis.latLong.forEach(d =>{
            vis.topFiveData.forEach(row =>{
                if (row.state === d.City){
                    row.lat = +d.Latitude;
                    row.long = +d.Longitude
                }
            })

        })

        vis.updateVis()

    }
    updateVis() {
        let vis = this;
        console.log("this is top five data", vis.topFiveData)
        // process  and initialize the data for update
        let selectedCategories = document.getElementById('categorySelector').value.split(',');
        console.log(selectedCategories[0], selectedCategories[1], 'this is the selected category')
        let mapTitleData = {"totalCases": "Total Prisoner COVID Cases and Death Per State",
            "staff_totalCases": "Total Staff COVID Cases & Deaths Per State",
            "totPrisonCase": "overall prison covid case and death per state"};
        let tooltipTitle = {"totalCases": "caseRate", "totalDeaths": "deathRate",
            "staff_totalCases": "staff_caseRate", "staff_totalDeaths": "staff_deathRate",
            "totPrisonCase": "overall prison covid case and death per state"};
        let maxV = d3.max(vis.stateInfo, d=> d.gdp_percapita)
        let minV = d3.min(vis.stateInfo, d=> d.gdp_percapita)
        vis.legendScaleData = [{"color":"#f7fbff",
            "value":minV},
            {"color":"#33451D",
                "value": maxV}];

        // set scales
        vis.colorScale.domain([0, maxV]);

        // set up legend number scale
        vis.legendScale.domain([minV, maxV]);

        vis.legendExtent = d3.extent(vis.legendScaleData, d => d.value);

        vis.legendTicks = vis.legendScaleData.map(d => d.value);

        vis.labelText = vis.svg.selectAll(".legend")
            .data(vis.legendScaleData);

        // remove old legend texts
        vis.labelText.remove();

        vis.legendAxis = d3.axisBottom()
            .scale(vis.legendScale)
            .tickValues(vis.legendTicks);

        // set up legend
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.4 /4.7-30}, ${vis.height - 30})`);


        vis.defs = vis.legend.append("defs");
        vis.linearGradient = vis.defs
            .append("linearGradient")
            .attr("id", "myGradient")
        vis.linearGradient.selectAll("stop")
            .data(vis.legendScaleData)
            .enter().append("stop")
            .attr("offset", d => ((d.value) / (maxV) * 100) + "%")
            .attr("stop-color", d => d.color);

        vis.legend.append("rect")
            .attr("width", 250)
            .attr("height", 10)
            .attr("y", -10)
            .style("fill", "url(#myGradient)");

        vis.legendAxisGroup = vis.legend.append("g")
            .attr("class", "axis axis--legend");
        vis.tool_tip = d3.select("body").append('div')
            .attr('id', 'circleTip')

        vis.legendAxisGroup.call(vis.legendAxis)
            .style("opacity", 0.3)
            .transition()
            .duration(800)
            .style("opacity", 1);

        vis.legend.append("text")
            .attr("class", "legendLabel")
            .attr("x", 100)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .text(function() {
                if (selectedCategory === "totalCases" || selectedCategory === "totalDeaths") {
                    return "GDP per Capita";
                }
                else {
                    return "GDP per Capita";
                }
            })

        vis.linearGradient.exit().remove();
        vis.legendAxisGroup.exit().remove();

        vis.color = d3.scaleLinear()
            .range((['#f7fbff', '#33451D']))
            .domain([minV, maxV])

        vis.states
            .attr("fill", function(d){
                let state = d.properties.name;
                let color = ""
                vis.stateInfo.forEach(d => {
                    if(d.state === state){
                        color = vis.color(d.gdp_percapita)
                    }

                })
                return color
            })
        vis.states = vis.svg.select("g")
            .selectAll("path")
            .data(vis.usMap)
        vis.states.enter().append("path")
            .merge(vis.states)
            .attr("d", vis.path)
            .attr("class", function(d, i){
                return nameConverter.getAbbreviation((d.properties.name))
            })
            .attr("fill", function(d, i){
                let state = d.properties.name;
                let color = ""
                vis.stateInfo.forEach(d => {
                    if(d.state === state){
                        color = vis.color(d.gdp_percapita)
                    }

                })
                return color
            })
            .attr("stroke", 'blue')
            .attr("stroke-width", "0.4px")
            .on("mouseover", function(event, d){
                // vis.topFiveTip.select("g").style("visibility", "hidden")
                //console.log("this is the event and data for the tooltip", d)
                let state = "";
                let gdp, absCases, absDeaths;
                let relCases, relDeaths;
                d3.select("rect." + nameConverter.getAbbreviation(d.properties.name) )
                    .attr('stroke', 'red')
                    .attr('stroke-width', '2px')
                vis.stateInfo.forEach(s => {
                    if(s.state === d.properties.name){
                        state = s.state;
                        gdp = s.gdp_percapita;
                        absCases = s[selectedCategories[0]];
                        absDeaths = s[selectedCategories[1]];
                        relCases = s[tooltipTitle[selectedCategories[0]]];
                        relDeaths = s[tooltipTitle[selectedCategories[1]]]
                    }

                })
                //console.log("this is the state info for current selection", vis.stateInfo)
                d3.select(this)
                    .attr("stroke-width", '2px')
                    .attr("stroke", '#992D2d')
                    .attr('fill', '#d53f3f');
                vis.tooltip.style("visibility", "visible")
                    .html(`<div class="row">
                            <div class="col-6">
                            <div id = "map-tip" style="height: 250px;border: thin solid grey; border-radius: 5px; background: lightgrey;"></div>
                            </div>
                            <div class="col-6">
                                <div style="height: 250px;border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px;">
                                    <h5> ${state}</h5>
                                    <h7>GDP Percapita: ${gdp}</h7>
                                    <h7>Cases(absolute): ${absCases}</h7>
                                    <h7>Deaths(absolute): ${absDeaths}</h7>
                                    <br>
                                    <h7>Cases(relative): ${relCases}</h7>
                                    <br>
                                    <h7>Deaths(relative): ${relDeaths}</h7>
                                 </div>
                            </div>
                      </div>`

                    );
                d3.select("#mapTip").remove();
                var margin =  {top: 20, right: 5, bottom: 5, left: 40};
                var width = 350-margin.left -margin.right
                var height = 300-margin.bottom-margin.top
                var tipSVG = d3.select("#map-tip")
                    .append("svg")
                    .attr("id","tipSVG")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.bottom + margin.top)
                    .append("g");

                var pieChartGroup = tipSVG
                    .append('g')
                    .attr('class', 'pie-chart')
                    .attr("transform", "translate(" + 120 + "," + 150 + ")");
                var pie = d3.pie()
                    .value(d => d.value);
                let circleColors = ['#4169E1', '#d6604d'];
                var legend = tipSVG.append("g")
                    .attr("class", "legend")
                    .attr("x", width)
                    .attr("y", 50)
                    .attr("height", 60)
                    .attr("width", 60);
                var legendData = ["Total Death" , "Total Case"]
                var colorPalete = {'Total Death': '#000000', "Total Case":'#d6604d'}

                vis.displayData_1 = [{value:absCases, color:'#d6604d'}, {value:absDeaths + 200, color:'#000000'}]

                // Pie chart settings
                var outerRadius = 100;
                // Relevant for donut charts
                var innerRadius = 0;
                // Path generator for the pie segments
                var arc = d3.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);
                let arcs = pieChartGroup.selectAll(".arc")
                    .data(pie(vis.displayData_1))
                arcs.enter()
                    .append("path")
                    .attr("d", arc)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'rgba(173,222,255,0.62)')
                    .attr("fill", d => {
                        //console.log("this is the d3 pie color fill d", d)
                        return d.data.color});
                legend.selectAll('g').data(legendData)
                    .enter()
                    .append('g')
                    .each(function (d, i) {
                        //console.log("this is the legend color  and value", d, colorPalete[d])
                        var g = d3.select(this);
                        g.append("rect")
                            .attr("x", 10)
                            .attr("y", i * 25 + 5)
                            .attr("width", 10)
                            .attr("height", 10)
                            .attr("fill", () => colorPalete[d]);
                        g.append("text")
                            .attr("x", 30)
                            .attr("y", i * 25 + 15)
                            // .attr("height", 30)
                            // .attr("width", 60)
                            .text(d);
                    })
                return 0

            })
            .on("mousemove", function(event){return vis.tooltip
                .style("top", ()=>{
                        if ((event.x >=400 && event.x <=550)&&event.y >=300&&event.y <=490) {
                            return (10)+"px"
                        }
                        else{
                            return (320)+"px"
                        }
                    }
                )
                .style("left",()=>{
                    if (event.x > 567){
                        return (-130)+"px"}
                    else{
                        return (300)+"px"}
                });})

            .on("mouseout", function(event, e){
                console.log("this is the mouseout eevent and e", event.x, event.y)
                d3.select(this)
                    .attr("stroke", 'blue')
                    .attr("stroke-width", "0.4px")
                    .attr('fill', function(d, i){
                        let state = d.properties.name;
                        let color = ""
                        vis.stateInfo.forEach(d => {
                            if(d.state === state){
                                color = vis.color(d.gdp_percapita)
                            }

                        })
                        return color
                    });
                d3.select("#tipSVG").remove();
                d3.select("rect." + nameConverter.getAbbreviation(e.properties.name) )
                    .attr("fill", "#d53f3f")
                    .attr('stroke', '#992D2d')
                    .attr('stroke-width', '2px')
                    .attr("fill", function(d, i){
                        let state = d.properties.name;
                        let color = ""
                        vis.stateInfo.forEach(d => {
                            if(d.state === state){
                                color = vis.color(d.gdp_percapita)
                            }

                        })
                        return color
                    })
                vis.tooltip.style("visibility", "hidden");
                let state = "";
                let population, absCases, absDeaths;
                let relCases, relDeaths;
                let lat;
                let long;
                vis.topFiveData.forEach(row =>{
                    state = row.state;
                    absCases = row[selectedCategories[0]];
                    absDeaths = row[selectedCategories[1]];
                    relCases = row[tooltipTitle[selectedCategories[0]]];
                    relDeaths = row[tooltipTitle[selectedCategories[1]]];
                    lat = row.lat;
                    long = row.long
                    var colorPalete = {'Total Death': '#FF0000', "Total Case":'#4169E1'}
                    vis.rScale = d3.scaleLinear()
                        .domain([d3.min(vis.topFiveData, d => d.absCases), d3.max(vis.topFiveData, d => d.absCases)])
                        .range([25, 35])

                    vis.pieData = [{value:absCases, color:'#d6604d', name:"Cases", tc:"white"}, {value:absDeaths+3000, color:'#000000', name:"Deaths", tc:"red"}]
                    var g2 = vis.svg.append("g")
                        .attr("id", "mapTip"); // pie charts
                    var pie = d3.pie()
                        .value(d => d.value);
                    var arc = d3.arc()
                        .innerRadius(0)
                        .outerRadius(20);
                    // console.log("this is the texaas projection", vis.projection([lat, long]))
                    var points = g2.selectAll("g")
                        .data([[lat, long]])
                        .enter()
                        .append('g')
                        .attr("id", "mapTip")
                        .attr("transform",function(d) { return "translate("+vis.projection([d[1],d[0]])+")" })

                    let data_ready = pie(vis.pieData)
                    console.log(data_ready, "this is the dat-ready one for slices")
                    let arcs = points.selectAll(".arc")
                        .data(data_ready)
                    arcs.enter()
                        .append("path")
                        .attr("d", arc)
                        .attr("id", "mapTip")
                        .attr('stroke-width', '2px')
                        .attr('stroke', 'black')
                        .attr('fill', 'rgba(173,222,255,0.62)')
                        .attr("fill", d => {
                            //console.log("this is the d3 pie color fill d", d)
                            return d.data.color});
                    points.selectAll('mySlices')
                        .data(data_ready)
                        .enter()
                        .append('text')
                        .text(function(d){
                            // console.log("this is the key for the group", d, d.data, d.data.value)
                            return  d.data.name})
                        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")";  })
                        .style("text-anchor", "middle")
                        .style("font-size", 10)
                        .style("fill", d => d.data.tc)
                })
            })
        vis.title
            .merge(vis.title)
            .text(() =>{
                return mapTitleData[selectedCategory]
            });
    }

}