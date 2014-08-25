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
			getIWTable(vikiObject);
			
	}; 
}


function buildHeatmap(){

}


// Once the data is returned, the data should be subsetted based on VM < Wiki < User < Event
function propogateStats(vikiObject){

// Start by categorizing. Each wiki currently has a bunch of events. 
// We need to extract the users from these. So, for each wiki, make an array of users. 
// Each of those users will have an array of events. 

// add all the logs to an array
var allLogs = [];
vikiObject.activeWikis.forEach(function(w){
	w.logs.forEach(function(l){
		l.wiki = w.wikiTitle;
		var date = new Date(l.timestamp);
		l.hour = date.getHours();
		l.day = date.getDay();
		l.month = date.getMonth();
		allLogs.push(l);
	})
})
vikiObject.objAry = populate(allLogs, 'user', 'day');

// the two keys to filter on
function populate(ary, key1, key2){
	var lAry = [];
	var result = {};
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
			  'val' : 1
			}
		  )
		} else {
		  obj[0].val++;
		}
		// otherwise, add it to the array
	})	
return lAry;
}





	vikiObject.activeWikis.forEach(function(w){
		var wiki = w;
		wiki.users = [];
		var currentDate = new Date();
		var currentMonth = currentDate.getMonth();
		var currentDay = currentDate.getDay();
		var currentHour = currentDate.getHours();
		wiki.logs.forEach(function(l){
			var date = new Date(l.timestamp);
			l.hour = date.getHours();
			l.day = date.getDay();
			l.month = date.getMonth();
		});

// parse through all the logs. for each log, create an element with that user and row, and a val equal to 1; 
// pop that element into an array. 
// if that element is already in the array, 



		// array of objects of the form {'row' : username, 'col' : day, 'val' : logCount}
		wiki.heatArray = [];
		wiki.users.forEach(function(u){
		  // for each user, create an object for every unique date. push it to the array
		  wiki.logs.forEach(function(l){
		    // if the log is for this user
		    if(l.user === u){
			// if the heatmap array doesn't already contain that day, add it. Otherwise, ++ that day

		    }
		  })		
		})

		wiki.logs.forEach(function(l){
			var user = l.user;
			wiki.udata = [];
			// if the user is not in the array, add it to it
			if(wiki.users.indexOf(user) === -1){
				wiki.users.push(user);
//				wiki.udata.push(
//					{ 'name' : user,
//					  'row' : countTypes(wiki, 'day'),
//					}
//				)				
			}
		
		})
	})
	console.log(vikiObject)
}

//we want to create an array of month, user pairs. So, for each user, we want to create an array of 
// {user : 1, day : 1, val : 0}, {user : 1, day : 2, val : 0}
// so we can use a map function to loop through every value in the logs and for each element 

// return an array 
function countTypes(wiki, col){
        var monthArray = [];		
	wiki.monthData = {};
	// loop through all the logs on this wiki
	wiki.logs.forEach(function(l){
		// if we are counting by day, 
		if(col === 'day'){
//		  for(var m=1; m<33; m++){
//		    if(l.day === day){
		      wiki.monthData[l.day] !== undefined ? wiki.monthData[l.day]++ : wiki.monthData[l.day] = 1;
//		    }		  
//		  }
//		  monthArray.forEach(function(day){})
		}
	})
//return monthData;
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



