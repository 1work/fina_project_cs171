/* * * * * * * * * * * * * *
* Map Visualization        *
* * * * * * * * * * * * * */

// Covid impact on mobility globally.
// starting with data processing and wraggling. And get also topological data for drawing world map (maybe lab 9).
class GlobeVis {
// constructor
    constructor(parentElement, mobility_data, geodata){
        this.mobility_data = mobility_data;
        this.parentElement = parentElement;
        this.geoData = geodata;
        this.parseDate = d3.timeParse("%Y-%m-%d")
        this.formatTime = d3.timeFormat("%Y-%m-%d")

        this.selectDate = "2022-10-15";
        this.loadColor = {};

        this.initVis()
    }

    initVis(){
        let vis = this
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", document.getElementById(vis.parentElement).getBoundingClientRect().width)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate(0, 0)`);


        // add title
        vis.globeTitle = vis.svg.append('g')
            .attr('class', 'title globe-title')
            .append('text')
            .attr('transform', `translate(${document.getElementById(vis.parentElement).getBoundingClientRect().width / 2}, 30)`)
            .attr('text-anchor', 'middle')
            .text("Mobility Changes During COVID-19")
            .style("font-weight", "bold")
            .style("font-size", "24px")

        vis.projection = d3.geoOrthographic() // d3.geoStereographic()
            .translate([document.getElementById(vis.parentElement).getBoundingClientRect().width / 2, vis.height *4/7])
            .scale(200)

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features

        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "graticule")
            .attr('fill', '#ADDEFF')
            .attr("stroke","rgba(129,129,129,0.35)")
            .attr("d", vis.path);

        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)

        console.log(vis.countries)

        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.5 / 5}, ${vis.height - 20})`)

        vis.legendAxisGroup = vis.legend.append("g")
            .attr('class','axis axis--legend' )

        vis.color = d3.scaleLinear()
            .range((['purple', 'orange']))
            .domain([0, 100])

        vis.legendScale = d3.scaleLinear()
            .range([0,100])
            .domain([-266.6, 266.6]);

        vis.legendAxis = d3.axisBottom()
            .scale(vis.legendScale)
            .tickValues([-266.6, -100, 0, 100, 266.6]);

        vis.defs = vis.legend.append("defs");

        vis.legendScaleData = [{"color": "purple",
            "value":0},
            {"color":"white",
                "value": 50},
            {"color":"orange",
                "value": 100}];

        vis.linearGradient = vis.defs
            .append("linearGradient")
            .attr("id", "globeGradient")

        vis.linearGradient.selectAll("stop")
            .data(vis.legendScaleData)
            .enter().append("stop")
            .attr("offset", d => d.value + "%")
            .attr("stop-color", d => d.color);

        vis.legend.append("rect")
            .attr("width", 100)
            .attr("height", 10)
            .attr("y", -10)
            .style("fill", "url(#globeGradient)");

        vis.legendAxisGroup.call(vis.legendAxis);

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip')

        let m0,
            o0;

        vis.svg.call(
            d3.drag()
                .on("start", function (event) {

                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }

                    // Update the map
                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path)
                    d3.selectAll(".graticule").attr("d", vis.path)
                })
        )

        vis.legend.append("text")
            .attr("class", "legendLabel")
            .attr("x", 50)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .text("Percent Mobility Change from pre-COVID")
            .style("font-size", "8px");

        vis.wrangleData()
    }
    wrangleData () {
        let vis = this;
        console.log(vis.mobility_data);

        if (selectedTimeRange[1] <= vis.parseDate(vis.selectDate))
        {
            vis.selectDate = vis.formatTime(selectedTimeRange[1]);
        }

        vis.newdata = d3.flatRollup(vis.mobility_data,
                v=> d3.mean(v, d=> d.grocery_and_pharmacy_percent_change_from_baseline),
                d => d.date,
                d=> d.country_region);
        console.log(vis.newdata);

        vis.values = vis.newdata.map(function(row){ return row[2];});
        var maxValue = Math.max.apply(null, vis.values);
        var minValue = Math.min.apply(null, vis.values);
        console.log(maxValue) // 266.6
        console.log(minValue) // -97

        vis.dateInfo = [];

        vis.countryInfo = [];
        vis.geoData.objects.countries.geometries.forEach(d => {
            vis.countryInfo.push(
                {
                    name: d.properties.name,
                    color: "white",
                    value: 0
                })
            })

        vis.newdata.forEach(date => {
            vis.dateInfo.push(
                {
                    date: date[0],
                    countryCode: date[1],
                    metricValue: date[2]
                }
            )
        })

        console.log(vis.dateInfo)

        function checkDate(row) {
            return row.date == vis.selectDate;
        }

        vis.chosenDate = vis.dateInfo.filter(checkDate);

        console.log(vis.chosenDate);

        vis.colorlower = d3.scaleLinear()
            .range((['purple', 'white']))
            .domain([-266.6, 0])

        vis.colorupper = d3.scaleLinear()
            .range((['white', 'orange']))
            .domain([0, 266.6])

        vis.countryInfo.forEach( d => {
            vis.chosenDate.forEach( e => {
                if (d.name == e.countryCode) {
                    d.value = e.metricValue;
                    if (e.metricValue < 0) {
                        d.color = vis.colorlower(e.metricValue);
                    }
                    else{
                        d.color = vis.colorupper(e.metricValue);
                    }
                }
            })
        })

        console.log(vis.countryInfo);

        vis.countryInfo.forEach(d => {
            vis.loadColor[d.name] = {
                name: d.name,
                color: d.color
            }
        })

        vis.updateVis()

    }
    updateVis() {
        let vis = this;

        vis.countries
            .attr("fill", d => vis.loadColor[d.properties.name].color);
    }

}