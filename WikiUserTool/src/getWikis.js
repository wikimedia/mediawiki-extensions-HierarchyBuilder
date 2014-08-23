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

	vikiObject.activeWikis.forEach(function(w){
		var wiki = w;
		w.logs.forEach(function(l){
			wiki.users = [];
			var user = l.user;
			if(wiki.users[user] !== undefined){
				wiki.users.user.push(l)
			} else {
				wiki.users[user] = [];
			}
		})
	})
	console.log(vikiObject)

}

function getWikiLogs(vikiObject){
	var lastWiki = vikiObject.activeWikis[vikiObject.activeWikis.length-1].wikiTitle;

	vikiObject.activeWikis.forEach(function(d){
		d.wUrl = d.apiURL + "?action=query&list=logevents&format=json&lelimit=500"
		d.logs = [];
		if(d.wikiTitle !== lastWiki){		
			recursiveQuery(d);
		} else {
			finalRecursiveQuery(d);
		}
	})
	
	propogateStats(vikiObject)

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






function finalRecursiveQuery(wiki){
	jQuery.ajax({
		url: wiki.wUrl,
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
			if(data.hasOwnProperty("query") && data.query.logevents.length > 0){
				data.query.logevents.forEach(function(l){wiki.logs.push(l)})
				var lastLogDate = data.query.logevents[data.query.logevents.length-1].timestamp;
				var milliFromNow = 	Date.parse(Date()) - Date.parse(lastLogDate)
	
				// if the last log was less than a year old, then
				if(milliFromNow < logSize){
					// if there are any more log events, then
					if (data.hasOwnProperty("query-continue")){        
					  // if it has a 'lecontinue', query that
					  if(data["query-continue"].logevents.hasOwnProperty("lestart")){

						  var qCont = data['query-continue'].logevents.lestart;
						  var newQuery = wiki.wUrl.split("&lestart=")[0] + "&lestart=" + qCont;

//						  console.log("New lecstart Query");
//						  console.log(newQuery)

						  wiki.wUrl = newQuery;
						  recursiveQuery(wiki);

					  } else if(data["query-continue"].logevents.hasOwnProperty("lecontinue")){
						  var qCont = data['query-continue'].logevents.lecontinue;
						  var newQuery = wiki.wUrl.split("&lecontinue=")[0] + "&lecontinue=" + qCont;

//						  console.log("New lecontinue Query");
//						  console.log(newQuery)

						  wiki.wUrl = newQuery;
						  recursiveQuery(wiki);

					  } else {
//							console.log("No leStuff")
//							console.log(data)
					  }
					
					} else {
//					  console.log("No Query Continue");
//					  console.log(data);
					}		  
				}
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
//		   error(textStatus);
		}
	}); 	
}



// For a given wiki, query the logs using the wUrl. 
// Push the log objects onto the wiki's log array
// If the timestamp of the last log event is less than a year ago and there is a query-continue, append the query-continue value to the URL.
// Call recursiveQuery again. 
function recursiveQuery(wiki){
	jQuery.ajax({
		url: wiki.wUrl,
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
			if(data.hasOwnProperty("query") && data.query.logevents.length > 0){
				data.query.logevents.forEach(function(l){wiki.logs.push(l)})
				var lastLogDate = data.query.logevents[data.query.logevents.length-1].timestamp;
				var milliFromNow = 	Date.parse(Date()) - Date.parse(lastLogDate)
	
				// if the last log was less than a year old, then
				if(milliFromNow < logSize){
					// if there are any more log events, then
					if (data.hasOwnProperty("query-continue")){        
					  // if it has a 'lecontinue', query that
					  if(data["query-continue"].logevents.hasOwnProperty("lestart")){

						  var qCont = data['query-continue'].logevents.lestart;
						  var newQuery = wiki.wUrl.split("&lestart=")[0] + "&lestart=" + qCont;

//						  console.log("New lecstart Query");
//						  console.log(newQuery)

						  wiki.wUrl = newQuery;
						  recursiveQuery(wiki);

					  } else if(data["query-continue"].logevents.hasOwnProperty("lecontinue")){
						  var qCont = data['query-continue'].logevents.lecontinue;
						  var newQuery = wiki.wUrl.split("&lecontinue=")[0] + "&lecontinue=" + qCont;

//						  console.log("New lecontinue Query");
//						  console.log(newQuery)

						  wiki.wUrl = newQuery;
						  recursiveQuery(wiki);

					  } else {
//							console.log("No leStuff")
//							console.log(data)
					  }
					
					} else {
//					  console.log("No Query Continue");
//					  console.log(data);
					}		  
				}
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
//		   error(textStatus);
		}
	}); 	
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







