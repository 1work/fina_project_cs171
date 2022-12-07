/* * * * * * * * * * * * * *
*         Bar Vis for Attendance         *
* * * * * * * * * * * * * */


class barVis {
// constructor
    constructor(parentElement, attendanceData){
        console.log('inside constructor');
        this.parentElement = parentElement;
        this.attendanceData = attendanceData;
        this.initVis()
    }

    initVis(){
        let vis = this;
        vis.margin = {top: 20, right: 20, bottom: 20, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;
        console.log('post 1');

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);
        // add title
        vis.barTitle = vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .attr('transform', `translate(${vis.width / 2}, 5)`)
            .attr('text-anchor', 'middle');

        // init the scales
        vis.x = d3.scaleBand()
            .range([0, vis.width]);
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        vis.logScale = d3.scaleLog().range([0, vis.width]);
        // axis
        vis.yAxis = d3.axisLeft().scale(vis.y);
        vis.xAxis = d3.axisBottom().scale(vis.x);
        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "yAxis axis")
            .attr('transform', `translate (-7, 0)`);

        vis.XAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis, axis")
            .attr("transform", "translate(-7," + vis.height + ")");
        console.log('end init');
        vis.wrangleData()

    }
    wrangleData () {
        let vis = this
        console.log(vis.attendanceData);
        // wrangle data.
        vis.attendanceData.forEach(row => {
            row.Country = row.Countries
            row.Total = +row.Total
            row.Female = +row.Female
            row.Male = +row.Male
            row.Rural = +row.Rural
            row.Urban = +row.Urban
        })
        console.log('Upload');

        vis.updateVis()

    }
    updateVis() {

        // Moving forward, making it interactive and the code efficient.
        let vis = this;

        // let selection = d3.select("#ranking-type").property("value");
        let selection = 'Male';

        vis.attendanceData.sort((a,b)=> b[selection] - a[selection]);
        //console.log("this is the attendance data ", vis.attendanceData)
        vis.x.domain(vis.attendanceData.map(d=> d.Country));
        vis.y.domain([0, d3.max(vis.attendanceData, d=> d[selection])]);

        // update axis
        vis.xAxis.scale(vis.x);
        vis.yAxis.scale(vis.y);
        vis.yAxisGroup.call(vis.yAxis)
            .attr('transform', `translate (10, -10)`);
        vis.XAxisGroup.call(vis.xAxis)
            .attr('font-size', 'xx-small')
            .attr('transform', `translate (${vis.margin.left-30}, ${vis.margin.top+ 200})`)
            .selectAll("text")
            .attr("transform", "rotate(-10)");


        // console.log(vis.attendanceData);

        let rectangle = vis.svg.selectAll("rect")
            .data(vis.attendanceData);


        rectangle.enter().append("rect")
            .attr("class", "bar")
            .merge(rectangle)
            .transition()
            .attr("x", d=> vis.x(d.Country))
            .attr("y", d=> vis.y(d[selection]))
            // .attr("width", vis.x.bandwidth())
            .attr("height", d=> vis.height - vis.y(d[selection]));

        vis.svg.select(".y-axis")
            .transition()
            .call(vis.yAxis);

        vis.svg.select(".x-axis")
            .transition()
            .call(vis.xAxis);

        rectangle.exit().remove();

        //d3.select("#ranking-type").on("change", updateVisualization);

        // update the title
        vis.barTitle
            .text(" Bar Plot of Attendance of Primary School Children")
    }
}
