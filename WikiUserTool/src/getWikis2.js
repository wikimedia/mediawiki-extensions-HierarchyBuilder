// Code Procedure: 
// On window load, query the IW links table with function getIWLinksTable
// use the list of IW Table APIs to grab the logs of each of the wikis, up to a year with function getWikiLogs
// aggregate that data into wikiVObject, propogating aggregate figures up the tree using function propogateStats
// build heatmap using function buildHeatmap


// 1 month: 2.62974e9
// 2 months: 5.259e+9
// 6 months: 1.578e+10
// 1 year: 3.156e+10
var logSize = 5.259e+9;


window.WikiUserTool = function(){}






WikiUserTool.prototype.drawChart = function(graphDiv, divwidth, divheight, wiki) {
	
	window.onload = function(e){      
			var vikiObject = [];
				vikiObject.graphDiv = graphDiv;
				vikiObject.divwidth = divwidth;
				vikiObject.divheight = divheight;
				vikiObject.rowName = 'user';
				vikiObject.colName = 'day';
			getIWTable(vikiObject);
			
	}; 
}


function buildHeatmap(vikiObject){
	var gs;
	vikiObject.colName === 'day' ? gs = 32 : gs = 32;
	var margin = { top: 100, right: 100, bottom: 100, left: 100 },
          width = 2000 - margin.left - margin.right,
          height = 2000 - margin.top - margin.bottom,
          gridSize = Math.floor(width / gs),
          legendElementWidth = gridSize*2,
          buckets = 9,
          colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"],
		  cols = vikiObject.objAry.colNames,
		  rows = vikiObject.objAry.rowNames;
//          days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
//          times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];


	 var data = vikiObject.objAry.sort(function(a,b){
				if(a.col > b.col){return 1}	
				if(a.col < b.col){return -1}
				return 0;
			});

	  var x = d3.scale.ordinal()
		.domain(vikiObject.objAry.rowNames)
		.rangeRoundBands([0,vikiObject.objAry.rowNames.length], 0, 0)


	  var xAxis = d3.svg.axis()
			.scale(x)
            .orient("top");


	  var colorScale = d3.scale.quantile()
              .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
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
               .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
   //             .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); })



//svg.append("g")
//    .attr("class", "x axis")
//    .attr("transform", "translate(0," + width + ")")
//    .call(xAxis)
//  .selectAll("text")
//    .attr("y", 0)
//    .attr("x", 0)
//    .attr("dy", ".35em")
//    .attr("transform", "rotate(90)")
//    .style("text-anchor", "start");


  			// svg.append("g")
     //            .attr("class", "x axis")
     //            .attr("transform", "translate(0," + height+20 + ")")
     //            .attr("transform", "rotate(0)")
     //            .call(xAxis)
     //          .selectAll("text")
     //            // .attr("x", function(d,i) { return (x(d.row)) * gridSize; })
     //            // .attr("y", function(d) { return (d.col-1) * gridSize; })
     //            .attr("y", 0)
     //            .attr("x", function(d){
     //            	return x(d)*gridSize
     //            })
     //            .attr("dy", ".35em")
     //            .attr("transform", "rotate(0)")
     //            .style("text-anchor", "start");

		// These are the users
          var timeLabels = svg.selectAll(".timeLabel")
              .data(rows)
              .enter().append("text")
                .text(function(d) { return d; })
                .attr("x", function(d, i) { 
					return (i) * gridSize; 
				})
                .attr("y", 0)
                .style("text-anchor", "middle")
                .attr("transform", "translate(" + gridSize / 2 + ", -6)")
                .attr("id", "user")


		// timeLabels.selectAll("text")
		// 	.attr("y", 0)
		// 	.attr("x", 0)
		// 	.attr("dy", ".35em")
		// 	.attr("transform", "rotate(180)")
			// .style("text-anchor", "start")
			//     .attr("transform", "rotate(90)")
			// 	.attr("transform", function(d, i) {return "rotate(-45,0,0)";});

   //             .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); })
			// 	.attr("transform", function(d) {
			// 		return "rotate(90)" 
   //             });


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
              .style("fill", colors[0]);

          heatMap.transition().duration(1000)
              .style("fill", function(d) { return colorScale(d.value); });

          heatMap.append("title").text(function(d) { return d.row; });
              
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




}


function propogateStats(vikiObject){

// add all the logs to an array
	var allLogs = [];
	vikiObject.activeWikis.forEach(function(w){
		w.logs.forEach(function(l){
			l.wiki = w.wikiTitle;
			var date = new Date(l.timestamp);
			var dte = l.timestamp.split("T")[0]
			var tme = l.timestamp.split("T")[1]

			l.year = dte.split("-")[0]
			l.month = dte.split("-")[1]
			l.day = dte.split("-")[2]
			l.hour = tme.split(":")[0]
//			l.hour = date.getHours();
//			l.day = date.getDay();
//			l.month = date.getMonth();
			allLogs.push(l);
		})
	})
	vikiObject.objAry = populate(allLogs, vikiObject.rowName, vikiObject.colName);

	// the two keys to filter on
	function populate(ary, key1, key2){
		var lAry = [];
		var result = {};
		lAry.rowNames = [];
		lAry.colNames = [];
		ary.forEach(function(l){
			var val1 = l[key1];
			var val2 = l[key2];		
			function containsObj(element){
				return (element['row'] === val1 && element['col'] === val2);
			}
			var obj = lAry.filter(containsObj);
	//		console.log(obj)
			// if it's in the array, add 1 to the representative
			if(obj.length < 1){
			  lAry.push(
				{
				  'row' : val1,
				  'col' : val2,
				  'value' : 1
				}
			  )
			  lAry.rowNames.indexOf(val1) === -1 && lAry.rowNames.push(val1);
//			  lAry.colNames.indexOf(val2) === -1 && lAry.colNames.push(val2);
//			  lAry.colNames.push(val2);
			} else {
			  obj[0].value++;
			}
			// otherwise, add it to the array
		})	
	return lAry;
	}

	if(vikiObject.colName === 'day'){
		var colCount = 32;
		for(var i = 1; i <= 32; i++){vikiObject.objAry.colNames.push(i)}
	}

	vikiObject.objAry.colNames.sort(function(a,b){
		if(a > b){return 1}	
		if(a < b){return -1}
		return 0;			
	})



	vikiObject.objAry.rowNames.forEach(function(r){
		// find all the 'row' options (eg users)		
		function containsR(element){
			return (element['row'] === r);
		}
		
		var rowElms = vikiObject.objAry.filter(containsR)	
//		console.log(rowElms)
		for(i = 1; i <= (colCount); i++){

			function containsC(element){
				return (element['col'] === (i-1));
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
//			  vikiObject.objAry.colNames.push(i)
			}
		}				

	})


}


function populateWikiLogs(vikiObject){
	vikiObject.i = 0;
	vikiObject.activeWikis.forEach(function(d){
		d.wUrl = d.apiURL + "?action=query&list=logevents&format=json&lelimit=500"	
		d.full = false;
		d.logs = [];
	})
	incrementalRecursiveQuery(vikiObject);
}


// This query will take in the vikiObject. It will have a counter attribute for the array index and a flag for the log time
// take in the vikiObject. if the log counter is on the last index and the log flag is true, call the next function. 
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
							if( (Date.parse(Date()) - Date.parse(l.timestamp)) <= logSize   ){
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




}







window.getIWTable = function(vikiObject){
	
   jQuery.ajax({
      url: 'http://gestalt-ed.mitre.org/robopedia/api.php?action=iwtable&format=json',
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

}






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
  }



function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
}



