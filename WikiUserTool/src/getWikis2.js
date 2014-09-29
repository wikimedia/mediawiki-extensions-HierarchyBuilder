// Code Procedure: 
// On window load, query the IW links table with function getIWLinksTable
// use the list of IW Table APIs to grab the logs of each of the wikis, up to a year with function getWikiLogs
// aggregate that data into wikiVObject, propogating aggregate figures up the tree using function propogateStats
// build heatmap using function buildHeatmap


// 1 month: 2.62974e9

// 2 months: 5.259e+9
var logMils = 5.259e+9;
// 6 months: 1.578e+10
// 1 year: 3.156e+10

// 5 days 4.32e+8
// var logSize = 4.32e+8;

window.WikiUserTool = function(){};







WikiUserTool.prototype.drawChart = function(graphDiv, divwidth, divheight, wiki, user, logSize) {
	
// This is the controller, where the chart is drawn based on the arguments provided. 
// Arguments for wiki can be "All", or any wiki name. 
// Arguments for user can be "All", or any user name. 
// Arguments for logSize can be in number of days. 

// When the page loads: 
// 	if user = all and wiki = all, call the original heatmap
// 	if user = all and wiki = Wiki, call the Wiki heatmap
//	if user = User and wiki = all, call the User heatmap


	$(function(e){      

		var vikiObject = [];
			vikiObject.graphDiv = graphDiv;
			vikiObject.divwidth = divwidth;
			vikiObject.divheight = divheight;
			vikiObject.rowName = 'user';
			vikiObject.colName = 'day';
			vikiObject.wiki = wiki;
			vikiObject.user = user;
			vikiObject.days = parseInt(logSize);
			vikiObject.logMils = parseInt(logSize)*8.64e+7; // converting to milliseconds


		if(user === "All" && wiki === "All"){
			getIWTable(vikiObject);
		} else if(user === "All"){
			getWiki(vikiObject)
		} else if(wiki === "All"){
			getUser(vikiObject)
		} 

			
	}); 
};




function buildHeatmap(vikiObject){
	var gs;
	vikiObject.colName === 'day' ? gs = 32 : gs = 32;
	var margin = { top: 100, right: 100, bottom: 100, left: 100 },
          width = 2000 - margin.left - margin.right,
          gridSize = Math.floor(width / gs),
          expanse = gridSize * vikiObject.objAry.colNames.length + 300,
          height = expanse - margin.top - margin.bottom,
          legendElementWidth = gridSize,
          buckets = 9,
          colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"],
		  cols = vikiObject.objAry.colNames,
		  rows = vikiObject.objAry.rowNames;
//          days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
//          times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];
	

	 // make sure there are only as many days rendered as specified
	var maxDays = vikiObject.days
	var filterDays = function(element){
		return  element.col >= 1 && element.col <= maxDays
	}

	var filData = vikiObject.objAry.filter(filterDays)

	var data = filData.sort(function(a,b){
			if(a.col > b.col){return 1}	
			if(a.col < b.col){return -1}
			return 0;
	});

	// making a list of wikis to display
	data.forEach(function(d){
		if(d.logs !== undefined){
			var wikis = d.logs.map(function(l){
				return l.wiki
			})
		var wikiSet = wikis.filter(function(elem, pos) {
		   			return wikis.indexOf(elem) == pos;
				});
		d.wikis = wikiSet
		}
	})	

// var uniqueArray = duplicatesArray.filter(function(elem, pos) {
//     return duplicatesArray.indexOf(elem) == pos;
//   }); 


////////////////////////////////////////////////////
// D3 Tooltip 

var mousemove = function(d) {
  var xPosition = d3.event.pageX - 160;
  var yPosition = d3.event.pageY - 250;

 
  if(d.value < 1){
	 d3.select("#tooltip")
	    .style("left", xPosition + "px")
	    .style("top", yPosition + "px");
	 d3.select("#tooltip #category")
	    .text("User: " + d.row);
	 d3.select("#tooltip #subcategory")
	    .text("Days Ago: " + d.col);
	 d3.select("#tooltip #pages")
	    .text("");
	 d3.select("#tooltip #logEvents")
	    .text("# of Log Events: " + 0);
     d3.select("#tooltip").classed("hidden", false);  	

  } else {
	 d3.select("#tooltip")
	    .style("left", xPosition + "px")
	    .style("top", yPosition + "px");
	 d3.select("#tooltip #category")
	    .text("User: " + d.row);
	 d3.select("#tooltip #subcategory")
	    .text("Days Ago: " + d.col);
	 d3.select("#tooltip #pages")
	    .text("Wikis: " + d.wikis.join(", "));
	 d3.select("#tooltip #logEvents")
	    .text("# of Log Events: " + d.value);
     d3.select("#tooltip").classed("hidden", false);  	
  }
};



var mouseout = function() {
  d3.select("#tooltip").classed("hidden", true);
};


///////////////////////////////////////////////////




	  var x = d3.scale.ordinal()
		.domain(vikiObject.objAry.rowNames)
		.rangeRoundBands([0,vikiObject.objAry.rowNames.length], 0, 0)

	  var xAxis = d3.svg.axis()
			.scale(x)
            .orient("top");


	  var colorScale = d3.scale.quantile()
            .domain([0, buckets - 1, d3.max(data, function (d) {
	           	return d.value; 
            })])
            .range(colors);

      var svg = d3.select('#' + vikiObject.graphDiv).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


		// these are the days
          var dayLabels = svg.selectAll(".dayLabel")
              .data(cols)
              .enter().append("text")
                .text(function (d) { return d; })
                .attr("x", 0)
                .attr("y", function (d, i) { 
					return (i) * gridSize; 
				})
                .style("text-anchor", "end")
               .attr("transform", "translate(-6," + gridSize / 1.5 + ")");


        // translation of name indices to svg width inndices for the name row
		  var xIndex = d3.scale.ordinal()
		  	.domain(d3.range(vikiObject.objAry.rowNames.length))
		  	.rangeBands([0,vikiObject.objAry.rowNames.length*gridSize])



          var timeLabels = svg.selectAll(".timeLabel")
              .data(rows)
			 .enter().append("text")
              .text(function(d){return d})
              .attr("y", 0)
              .attr("x", 0)
              .attr("text-anchor", "start")
	          .attr("transform", function(d, i) {
	             return "translate(" + xIndex(i)+",-45) rotate(-45," + xIndex(1)+"," + 0+") "; 
	          });




          var heatMap = svg.selectAll(".hour")
              .data(data)
              .enter().append("rect")
              .attr("x", function(d,i) { return (x(d.row)) * gridSize; })
              .attr("y", function(d) { return (d.col-1) * gridSize; })
              .attr("rx", 4)
              .attr("ry", 4)
              .attr("class", "hour bordered")
              .attr("width", gridSize)
              .attr("height", gridSize)
              .style("fill", colors[0])
        	  .on('mousemove', mousemove)
	    	  .on('mouseout', mouseout);

          heatMap.transition().duration(1000)
              .style("fill", function(d) { 
              	return colorScale(d.value); 
              });

          // heatMap.append("title").text(function(d) { return d.value; });
              
          var legend = svg.selectAll(".legend")
              .data([0].concat(colorScale.quantiles()), function(d) { return d; })
              .enter().append("g")
              .attr("class", "legend");

          legend.append("rect")
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", function(d, i) { return colors[i]; });

          legend.append("text")
            .attr("class", "mono")
            .text(function(d) { return "≥ " + Math.round(d); })
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height + gridSize);




};


var magicFun = function(vikiObject){
	// imagine a function that goes through each wiki, mapping the wiki names. 
	// it also goes through each log, mapping log objects to a list of users, and a list of days
	// it also adds a count to the object, with the user, day, and count


	var wikiObj = vikiObject.activeWikis.map(function(o){
		return o.wikiName
	})

	// loop thorugh all the wikis
	// 		for each wiki, have a function that returns all the users in that wiki's log
	//			so, there should be a mapping function that returns the user of each object

		var wikiSet = []
		var userObj = vikiObject.activeWikis.map(function(o){
			if(wikiSet.indexOf(l.user)===-1){
				var ws = []
				var wikiUser = o.logs.map(function(l){
					if(ws.indexOf(l.user)===-1){
						ws.push(l.user)
					}
					return ws
				})
			}
			return wikiSet
		})
}


function propogateStats(vikiObject){

// magicFun(vikiObject)


// add all the logs to an array
// add day, month, year and hour of the timestamp
	var allLogs = [];
	vikiObject.activeWikis.forEach(function(w){
		w.logs.forEach(function(l){
			l.wiki = w.wikiTitle;
			var date = new Date(l.timestamp);
			var dte = l.timestamp.split("T")[0]
			var tme = l.timestamp.split("T")[1]
			var currentDate = new Date()

			l.year = dte.split("-")[0]
			l.month = dte.split("-")[1]
			l.day = dte.split("-")[2]
			l.hour = tme.split(":")[0]

			// there should be a 'days since today' variable, whcih will 
			l.daysAgo = -Math.round(Date.parse(date)*1.1574e-8 - Date.parse(currentDate)*1.1574e-8)
//			l.hour = date.getHours();
//			l.day = date.getDay();
//			l.month = date.getMonth();
			allLogs.push(l);
		})
	})
	vikiObject.objAry = populate(allLogs, vikiObject.rowName, 'daysAgo');

	// the two keys to filter on
	function populate(ary, key1, key2){
		var lAry = [];
		var result = {};
		lAry.rowNames = [];
		lAry.colNames = [];
		// for each log, if that row-column combination already exits, +1. else create with val 1
		ary.forEach(function(l){
			var val1 = l[key1];
			var val2 = l[key2];		
			function containsObj(element){
				return (element['row'] === val1 && element['col'] === parseInt(val2));
			}
			var obj = lAry.filter(containsObj);
			// if it's in the array, add the value to the representative object
			if(obj.length < 1){

				var lObject = {
				  'row' : val1,
				  'col' : parseInt(val2),
				  'value' : 1,
				  'logs' : []
				}
				lObject.logs.push(l)
	  		    lAry.push(lObject)
	 		    lAry.rowNames.indexOf(val1) === -1 && lAry.rowNames.push(val1);

			} else {
			  obj[0].value++;
			  obj[0].logs.push(l)
			}
			// otherwise, add it to the array
		})	
	return lAry;
	}

	// populating an array of days the length of the user input
	if(vikiObject.colName === 'day'){
		var colCount = vikiObject.days;
		for(var i = 1; i <= colCount; i++){vikiObject.objAry.colNames.push(i)}
	}

	// sorting that array, just to be sure
	vikiObject.objAry.colNames.sort(function(a,b){
		if(a > b){return 1}	
		if(a < b){return -1}
		return 0;			
	})

	// Adds in objects for empty-log days
	//	cycle through each user, find all the days for that user
	vikiObject.objAry.rowNames.forEach(function(r){

		// find all the 'row' options (eg users)		
		function containsR(element){
			return (element['row'] === r);
		}
		
		var rowElms = vikiObject.objAry.filter(containsR)	

		// for each day, find all the objects with that day
		// if there aren't any events on that day, add an empty value
		for(i = 1; i <= (colCount); i++){

			function containsC(element){
				return (element['col'] === (i));
			}
			var cObj = rowElms.filter(containsC);		
			if(cObj.length < 1){
			  vikiObject.objAry.push(
				{
				  'row' : r, 
				  'col' : i,
				  'value' : 0
				}
			  )
			}
		}				

	})


};






function populateWikiLogs(vikiObject){
	vikiObject.i = 0;
	vikiObject.activeWikis.forEach(function(d){
		d.wUrl = d.apiURL + "?action=query&list=logevents&format=json&lelimit=500"	
		d.full = false;
		d.logs = [];
	})
	incrementalRecursiveQuery(vikiObject);
};


// This query will take in the vikiObject. It will have a counter attribute for the array index and a flag for the log time.
// Take in the vikiObject. if the log counter is on the last index and the log flag is true, call the next function. 
// otherwise, find the index, and check that wiki. If the flag for that wiki is true, increment the index. 
// if the log flag is false, query for more logs. On success of the query, add the logs and determine if the log flag should 
// be changed. If so, do so and increment the index. If not, call this same function with the next wUrl. 
function incrementalRecursiveQuery(vikiObject){

	// if the increment is not equal to the vikiObject.activeWikis.length, run a query on the wiki at i
	// otherwise call the next function
	if(vikiObject.i !== vikiObject.activeWikis.length){
	
			jQuery.ajax({
				url: vikiObject.activeWikis[vikiObject.i].wUrl,
				dataType: 'jsonp',
				async: false,
				success: function (data, textStatus, jqXHR) {
					// populate the logs
					if(data.hasOwnProperty("query") && data.query.logevents.length > 0){
						data.query.logevents.forEach(function(l){
							// make sure each log is not older than the log limit before pushing
							if( (Date.parse(Date()) - Date.parse(l.timestamp)) <= vikiObject.logMils   ){
								vikiObject.activeWikis[vikiObject.i].logs.push(l)	
							} else {
								vikiObject.activeWikis[vikiObject.i].full = true;
							}

						})
						if(!vikiObject.activeWikis[vikiObject.i].full){
							// if there are any more log events, then
							if (data.hasOwnProperty("query-continue")){        
							  // if it has a 'lecontinue', query that
							  if(data["query-continue"].logevents.hasOwnProperty("lestart")){

								  var qCont = data['query-continue'].logevents.lestart;
								  var newQuery = vikiObject.activeWikis[vikiObject.i].wUrl.split("&lestart=")[0] + "&lestart=" + qCont;
 								  vikiObject.activeWikis[vikiObject.i].wUrl = newQuery;
								  incrementalRecursiveQuery(vikiObject);

							  } else if(data["query-continue"].logevents.hasOwnProperty("lecontinue")){
								  var qCont = data['query-continue'].logevents.lecontinue;
								  var newQuery = vikiObject.activeWikis[vikiObject.i].wUrl.split("&lecontinue=")[0] + "&lecontinue=" + qCont;
 								  vikiObject.activeWikis[vikiObject.i].wUrl = newQuery;
								  incrementalRecursiveQuery(vikiObject);
							  } else {
								  // if there is no more log data, mark the log as full and increment the index
								  vikiObject.activeWikis[vikiObject.i].full = true;
								  vikiObject.i += 1;
								  incrementalRecursiveQuery(vikiObject);
							  }
				
							} else {
								  // if there is no 'query continue', increment the index and flag the logs
								  vikiObject.activeWikis[vikiObject.i].full = true;
								  vikiObject.i += 1;
								  incrementalRecursiveQuery(vikiObject);							  
							}		  
						} else {
							// Log is full to the brim. Call the next wiki. 
							vikiObject.i += 1;
							incrementalRecursiveQuery(vikiObject);
						}
					} else {
						    // if there is no 'query', increment the index and flag the logs
						    vikiObject.activeWikis[vikiObject.i].full = true;
						    vikiObject.i += 1;
						    incrementalRecursiveQuery(vikiObject);							  
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
		//		   error(textStatus);
				}
			}); 	
		




	} else {
		propogateStats(vikiObject);
		buildHeatmap(vikiObject)
	}




};






window.getIWTable = function(vikiObject){
   var serverURL = mw.config.get("wgServer");
   var myApiURL = serverURL + mw.config.get("wgScriptPath") +"/api.php";	
   var iwLinksURL = myApiURL + "?action=iwtable&format=json" 


   jQuery.ajax({
      url: iwLinksURL,
      dataType: 'jsonp',
      beforeSend: function (jqXHR, settings) {
         url = settings.url;
         // hook_log("url of ajax call: "+url);
      },
      success: function(data, textStatus, jqXHR) {
				 allWikis = data["iwtable"]["wikiIWArray"];
				 allWikisArray = [];

				 for(var i in allWikis) {
						var title = allWikis[i]["wikiTitle"];
						var wiki = {
									wikiTitle: title,
									apiURL: allWikis[i]["apiURL"],
									contentURL: allWikis[i]["contentURL"],
									logoURL: allWikis[i]["logoURL"],
									searchableWiki : allWikis[i]["searchableWiki"],
									server : allWikis[i]["server"],
		                            wikiName : allWikis[i]["wikiName"]
								  };
						if(allWikis[i]['searchableWiki']!== undefined ){

							var searchable = allWikis[i]['searchableWiki']

							if(searchable.length > 0 && searchable=== 'false'){
								 wiki.searchableWiki = true;
							} else {
								 wiki.searchableWiki = false;
							}		        

							allWikisArray.push(wiki);
	
						} else {
//							console.log(allWikis[i])
						}		
				}

				vikiObject.allWikis = allWikisArray;
				vikiObject.activeWikis = []
				vikiObject.allWikis.forEach(function(d){
					if(d.searchableWiki===false){
							vikiObject.activeWikis.push(d)
					}
				})
//				fillDropdown('#IWwikis', vikiObject);
//				getWikiLogs(vikiObject);
				populateWikiLogs(vikiObject);
    },
      error: function(jqXHR, textStatus, errorThrown) {
         alert("Unable to fetch list of wikis. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown="+errorThrown);
      }
   });

};






// Creates a hierarchy out of the data
 function genJSON(csvData, groups) {

    var genGroups = function(data) {
      return _.map(data, function(element, index) {
        return { name : index, children : element };
      });
    };

    var nest = function(node, curIndex) {
      if (curIndex === 0) {
        node.children = genGroups(_.groupBy(csvData, groups[0]));
        _.each(node.children, function (child) {
          nest(child, curIndex + 1);
        });
      }
      else {
        if (curIndex < groups.length) {
          node.children = genGroups(
            _.groupBy(node.children, groups[curIndex])
          );
          _.each(node.children, function (child) {
            nest(child, curIndex + 1);
          });
        }
      }
      return node;
    };
    return nest({}, 0);
  };



function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
};



