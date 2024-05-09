var margin = {t: 30, r: 90, b: 30, l: 60};//padding
var width = 1000;
var height = 500;

var chartWidth = width - margin.l - margin.r - 20;
var chartHeight = height - margin.t - margin.b;

var svg = d3.select("svg").attr("width", width).attr("height", height);
var chartG = svg.append("g").attr("transform", "translate(" + margin.l + "," + margin.t + ")");

var color = d3.scale.category10();
var transport;

var parseTime = d3.timeParse("%Y");

var data;
var x;
var y;
var dataMin, dataMax;
var allGroup;
var transportType;
var allTransport;
var flag;

function dataPreprocessor(row) {//create access vars
    return {
        Year: parseTime(+row["Year"]),//display year as time instead of int
        Car: +row["Car_Occupant"],
        Pedestrian: +row["Pedestrian"],
        Motorcycle: +row["Motorcycle"],
        Bicycle: +row["Bicycle"],
        Trucks: +row["Trucks"],
    };
}

//function used to create coord points (x,y) for line
var line = d3.line()
  .x(function(d) {
      return x(d.Year);
  })
  .y(function(d) {
      return y(d.total);
  })
  .curve(d3.curveBasis);

// using the data ------------------------------------------------------------------------
d3.csv("transportation.csv", dataPreprocessor).then(function(dataset) {
  data = dataset;
  x = d3.time.scale().range([0, chartWidth]); //set x axis scale
  y = d3.scaleLinear().range([chartHeight, 0]); //set y axis scale
  color.domain(d3.keys(dataset[0]).filter(function (key) { //assign a color to each key
      return key !== "Year";
  }));

  allGroup = ['All', 'Car', 'Pedestrian', 'Motorcycle', 'Bicycle', 'Trucks'];

  //map the keys to the value pair (x,y) coord point
  transport = color.domain().map(function(type) {
    return {
      type: type,
      values: dataset.map(function (d) {
        return {
          Year: d.Year,
          total: +d[type]
        };
      }) 
    };
  });

  //create selection dropdown
  d3.select('#categorySelect')
  .selectAll('myOptions')
  .data(allGroup)
  .enter()
  .append('option')
  .text(function (d) {
    return d;
  }).attr('value', function (d) {
    return d;
  });

  //create axes
  addAxes(d3.min(dataset, d => d.Year), d3.max(dataset, d => d.Year));

  //create inital chart
  initAllLine();
  flag = 0;
  //create initial line for updating chart
  transportType = chartG.append('g').append('path')
  .data(transport).attr('d', function (d) {
    return line(d.values);
  }).attr('stroke', function (d) {
    return color(d.type);
  }).style('fill', 'none');
  
  //detects change within dropdown
  d3.select('#categorySelect').on('change', function (d){
    var selectedOption = d3.select(this).property('value');
    updateChart(selectedOption);
  });

    //title
    var main = chartG.append("text").attr('class', 'chartTitle').attr("transform", "translate(200, 0)");
    main.text("Transportation Fatalities by Vehicles Through the Years");

    //draw inital chart
    updateChart("All");
});

//creates axes for the chart
function addAxes(xMin, xMax) {
  x.domain([xMin, xMax]);
  y.domain([0, d3.max(transport, function(t) {
    return d3.max(t.values, function(v) {
        return v.total;
    })
  })]);

  chartG.append("g").attr("class", "yAxis").call(d3.axisLeft(y))
  svg.append("text")
  .attr("class", "yAxisLabel")
  .attr("transform", "rotate(-90)")
  .attr("x", -200)
  .attr("y", 15)
  .style("text-anchor", "end")
  .text("Total Fatalities");
  chartG.append("g").attr("transform", "translate(0," + chartHeight + ")").call(d3.axisBottom(x));
  svg.append("text")
  .attr("class", "xAxisLabel")
  .attr("x", width/2)
  .attr("y", height)
  .text("Year");

  //creates legend
  var legend = chartG.selectAll("legend").data(transport).enter().append("g")
  .attr("class", "legend");
  legend.append("rect").attr("x", chartWidth + 40).attr("y", function(d, i) {
    return i * 20;
  }).attr("width", 10).attr("height", 10)
  .style("fill", function (d) {
    return color(d.type);
  });

  legend.append('text').attr("class", "legendLabel")
  .attr('x', chartWidth + 55)
  .attr('y', function(d, i) {
    return (i * 20) + 9;
  })
  .text(function(d) {
    return d.type;
  });
}

//creates initial line for chart
function initAllLine() {
  allTransport = chartG.selectAll('.transport')
  .data(transport)
  .enter()
  .append('path').attr('class', 'line')
  .attr('d', function (d) {
    return line(d.values);
  }).attr('stroke', function (d) {
    return color(d.type);
  }).attr('fill', 'none');
}

function updateChart(selected) {
  //display lines
  var dataFilter;
  
  //see which category was selected and display lines
  if (selected !== "All") {
    dataFilter = transport.filter(function (d) {
      if (d.type === selected) {
        return d.type;
      }
    })
    transportType.data(dataFilter).attr('class', 'line')
    .attr('d', function (d) {
      return line(d.values);
    }).attr('stroke', function (d) {
      return color(d.type);
    });
    //removes other lines beside the category selected
    allTransport.remove();
    flag = 1;
  } else if (selected === 'All' && flag == 1) {
    flag = 0;
    initAllLine();
  }
   // mouse functions ------------------------------------------------------------
   var mouseG = chartG.append("g")
   .attr("class", "mouse-over-effects");
 
   // this is the black vertical line to follow mouse
   mouseG.append("path") 
     .attr("class", "mouse-line")
     .style("stroke", "black")
     .style("stroke-width", "1px")
     .style("opacity", "0");
 
   var lines = document.getElementsByClassName('line');

   var mousePerLine = mouseG;
   if (selected === 'All') {
    mousePerLine = mouseG.selectAll('.mouse-per-line')
     .data( transport)
     .enter()
     .append("g")
     .attr("class", "mouse-per-line");
     //circles attached to the line
     mousePerLine.append("circle")
     .attr("r", 7)
     .style("stroke", 'black')
     .style("fill", "none")
     .style("stroke-width", "1px")
     .style("opacity", "0");
   } else {
    mousePerLine = mouseG
     .data(dataFilter)
     .append("g")
     .attr("class", "mouse-per-line");
     //circles attached to the line
     mousePerLine.append("circle")
     .attr("r", 7)
     .style("stroke", 'black')
     .style("fill", "none")
     .style("stroke-width", "1px")
     .style("opacity", "0");
   }
 
   mousePerLine.append("text")
     .attr("transform", "translate(10,3)");
 
   mouseG.append('chartG:rect') // append a rect to catch mouse movements on canvas
     .attr('width', chartWidth) // can't catch mouse events on a g element
     .attr('height', chartHeight)
     .attr('fill', 'none')
     .attr('pointer-events', 'all')
     // on mouse out hide line, circles and text
     .on('mouseout', function() { 
       d3.select(".mouse-line")
         .style("opacity", "0");
       d3.selectAll(".mouse-per-line circle")
         .style("opacity", "0");
       d3.selectAll(".mouse-per-line text")
         .style("opacity", "0");
     })
     // on mouse in show line, circles and text
     .on('mouseover', function() { 
       d3.select(".mouse-line")
         .style("opacity", "1");
       d3.selectAll(".mouse-per-line circle")
         .style("opacity", "1");
       d3.selectAll(".mouse-per-line text")
         .style("opacity", "1");
     })
     // mouse moving over canvas
     .on('mousemove', function() { 
       var mouse = d3.mouse(this);
       d3.select(".mouse-line")
         .attr("d", function() {
           var d = "M" + mouse[0] + "," + chartHeight;
           d += " " + mouse[0] + "," + 0;
           return d;
         });
 
       d3.selectAll(".mouse-per-line")
         .attr("transform", function(d, i) {
           var xDate = x.invert(mouse[0]),
               bisect = d3.bisector(function(d) { return d.Year; }).right;
               idx = bisect(d.values, xDate);
           
           var beginning = 0,
               end = lines[i].getTotalLength(),
               target = null;
 
           while (true){
             target = Math.floor((beginning + end) / 2);
             pos = lines[i].getPointAtLength(target);
             if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                 break;
             }
             if (pos.x > mouse[0])      end = target;
             else if (pos.x < mouse[0]) beginning = target;
             else break; //position found
           }
           
           d3.select(this).select('text')
             .text(y.invert(pos.y).toFixed(2));
             
           return "translate(" + mouse[0] + "," + pos.y +")";
         });
   });
}


