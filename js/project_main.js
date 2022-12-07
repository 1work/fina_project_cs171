/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switche
let myLineVis,
    MyMapVis,
    myGlobeVis,
    myBoxVis,
    myBrushVis,
    myBarVis

let selectedState = '';
// prep for brushvis
let selectedTimeRange = [];
// load data using promises
let promisess = [

    //d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),  // not projected -> you need to do it
    // already projected -> you can just scale it to fit your browser window

    d3.csv("project_data/final_gdp_percapita.csv"),
    d3.csv("project_data/vaccineFinal.csv"),
    d3.csv("project_data/who_data.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    d3.csv("project_data/marshalData/prison_covid_data.csv"),
    d3.csv("project_data/marshalData/covid_prison_cases.csv"),
    d3.csv("project_data/covid_data_20.csv"),
    d3.csv("project_data/statelatlong.csv"),
    d3.csv("project_data/primary_attendance.csv"),
    d3.csv("project_data/final_mobility_df.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),

];

Promise.all(promisess)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

// initMainPage
function initMainPage(dataArray) {

    // log data
    // console.log('check out the data', dataArray);
    // console.log("mobility", dataArray[0]);
    // console.log("gdp", dataArray[1]);
    // console.log("vaccine", dataArray[2]);
    // console.log("who", dataArray[3])
    myLineVis = new lineVis('lineDiv', dataArray[0], dataArray[1])
    myGlobeVis = new GlobeVis("globeDiv", dataArray[9], dataArray[10])
    console.log("this is the state latituted", dataArray[7])
    MyMapVis = new MapVis("mapDiv", dataArray[3],dataArray[4], dataArray[5], dataArray[7])
    myBoxVis = new boxVis('boxDiv', dataArray[1]);
    myBrushVis = new BrushVis('brushDiv', dataArray[6]);
    myBarVis = new barVis('barDiv',dataArray[8]);

}
let selectedCategory =  document.getElementById('categorySelector').value;
function categoryChange() {
    selectedCategory =  document.getElementById('categorySelector').value;
    // console.log(selectedCategory)
    MyMapVis.wrangleData();
}

// init brush - attaching to mobility globe later

