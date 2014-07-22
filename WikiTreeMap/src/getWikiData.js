

function recursiveQuery(vikiObject, wanted){
	jQuery.ajax({

		url: vikiObject.wUrl,
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
		  jsonData.children = jsonData.children.concat(data.query.allcategories);
		  if(vikiObject.elmLabel==="MITREpedia"){
		    if (data.hasOwnProperty("query-continue")){        
		      var qCont = data['query-continue'].allcategories.acfrom;
		      var newQuery = vikiObject.wUrl.split("&acfrom=")[0] + "&acfrom=" + qCont;
		      vikiObject.wUrl = newQuery;
		      recursiveQuery(vikiObject, wanted);
		    } else {
		      tutorTree(jsonData, vikiObject.graphDiv, vikiObject.divwidth, vikiObject.divheight, wanted);
		    }
		  } else {
		     if (data.hasOwnProperty("query-continue")){        
		      var qCont = data['query-continue'].allcategories.accontinue;
		      var newQuery = wUrl.split("&acfrom=")[0] + "&acfrom=" + qCont;
			  vikiObject.wUrl = newQuery;
		      recursiveQuery(vikiObject, wanted);
		    } else {
		      tutorTree(jsonData, vikiObject.graphDiv, vikiObject.divwidth, vikiObject.divheight, wanted);
		    }
		  }
		},
		error: function (jqXHR, textStatus, errorThrown) {
		   error(textStatus);
		}
	}); 

}




			
function getWanted(vikiObject){
	jQuery.ajax({
		url: vikiObject.wantedUrl,
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
		  var wanted = data.query.querypage.results;
		  recursiveQuery(vikiObject, wanted);
	},
		error: function (jqXHR, textStatus, errorThrown) {
		   error(textStatus);
		   recursiveQuery(vikiObject);
		}
	}); 
}


function getUnused(vikiObject){
	jQuery.ajax({
        url: vikiObject.unusedUrl,
        dataType: 'jsonp',
        async: false,
        success: function (data, textStatus, jqXHR) {
     	    var unused = data.query.querypage.results;console.log(unused)
			if(unused.length){
				var tabulation = tabulate(unused, ["Unused Categories:"]);
				setTimeout(function() {
		  			 $('div.wikitreemap-graph-container').append(tabulation);
				;}, 1000);
			}		      
		},
        error: function (jqXHR, textStatus, errorThrown) {
           error(textStatus);
//	           recursiveQuery(categoryUrl, graphDiv, divwidth, divheight);
        }
    }); 	
}	




var getComparativeWikis = function(wikiVObject, data1, flag1){

	if(flag1){
		var wikiURL = wikiVObject.wiki2;
	} else {
		var wikiURL = wikiVObject.wiki1;
	}

	jQuery.ajax({
		url: wikiURL + '?action=query&meta=siteinfo&format=json&siprop=extensions',
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
			var wikiData = data.query.extensions;
			
			if(flag1){
				makeDiff(data1, wikiData, wikiVObject);
			} else {
				getComparativeWikis(wikiVObject, wikiData, "true")				
			}			


	},
		error: function (jqXHR, textStatus, errorThrown) {
		   error(textStatus);
		}
	}); 
}



var getGeneralWikiInfo = function(wikiVObject, data1, flag1){

	if(flag1){
		var wikiURL = wikiVObject.wiki2;
	} else {
		var wikiURL = wikiVObject.wiki1;
	}

	jQuery.ajax({
		url: wikiURL + '?action=query&meta=siteinfo&siprop=general&format=json',
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
			var wikiData = data.query.general;
			
			if(flag1){
				makeGeneralDiff(data1, wikiData, wikiVObject);
			} else {
				getGeneralWikiInfo(wikiVObject, wikiData, "true")				
			}			
	},
		error: function (jqXHR, textStatus, errorThrown) {
		   error(textStatus);
		}
	}); 

}


function makeGeneralDiff(wikiData1, wikiData2, wikiVObject){

	// creating a master list of extensions
	var allFields = [];
	allFields.push(["generator", "phpversion", "dbversion"]);

	var tObject = [];
	var n1 = wikiVObject.wiki1Name;
	var n2 = wikiVObject.wiki2Name;

	
	allFields[0].forEach(function(d){

		var rowObj = {};
			rowObj['Product'] = d;
			rowObj[n1]  = wikiData1[d];
			rowObj[n2]  = wikiData2[d];
			
		if(wikiData1[d]===wikiData2[d]){
			rowObj['same']  = "yes";			
		} else {
			rowObj['same']  = "no";						
		}		

		tObject.push(rowObj);		

	})

		var columns = ["Product", n1, n2];
		versionTable(tObject, columns, "generalWikiInfo");				

}	







function makeDiff(wikiData1, wikiData2, wikiVObject){

	// creating a master list of extensions
	var allExtensions = [];
	wikiData1.forEach(function(d){
		allExtensions.push(d.name);
	})
	wikiData2.forEach(function(d){
		allExtensions.push(d.name);
	})

	var extNames = allExtensions.unique();
	extNames.sort();

	var tObject = [];
	var n1 = wikiVObject.wiki1Name;
	var n2 = wikiVObject.wiki2Name;

	extNames.forEach(function(d){

		var hasSameName = function(elm){
			return elm.name === elmName;
		}

		var elmName = d;
		var wx1 = (wikiData1.filter(hasSameName).length > 0) ? wikiData1.filter(hasSameName)[0].version :  "Not Used";
		var wx2 = (wikiData2.filter(hasSameName).length > 0) ? wikiData2.filter(hasSameName)[0].version :  "Not Used";

		var rowObj = {};
			rowObj["Extension"] = d;
			rowObj[n1]  = wx1;
			rowObj[n2]  = wx2;

		if(wx1 === wx2){
			rowObj['same']  = "yes";			
		} else if(wx1==="Not Used" ^ wx2 === "Not Used"){
			rowObj['same']  = "no";						
		} else {
			rowObj['same']  = "differentVersion";						
		}
			
		tObject.push(rowObj);		

	})
		var columns = ["Extension", n1, n2];
		versionTable(tObject, columns, "wikiVersionTable");				

}	


function versionTable(data, columns, div) {
	    var table = d3.select("#"+div).append("table")
//            .attr("style", "margin-left: 250px"),

	    thead = table.append("thead"),
        tbody = table.append("tbody");

		table.attr("class", "datagrid");

    	// append the header row
		thead.append("tr")
		.attr("style", "text-align:left")
	     .selectAll("th")
	     .data(columns)
         .enter()
 	     .append("th")
          .text(function(column) { return column; });

		// create a row for each object in the data
	    var rows = tbody.selectAll("tr")
			.data(data)
			.enter()
			.append("tr")
			.style("background-color", function(d){
				if(d.same === "no"){
					return '#e5a1a1'
				} else if(d.same === "differentVersion"){
					return '#d8db17'
				} else {
					return '#b4d4a7'
				}			
			});

	    // create a cell in each row for each column
	    var cells = rows.selectAll("td")
			.data(function(row) {
 				 return columns.map(function(column) {
	               	return {column: column, value: row[column]};
    			 });
			})
	        .enter()
	        .append("td")
			.attr("style", "font-family: Courier")
				.html(function(d) { return d.value; });


		return table;
}







function tabulate(unused, columns) {
	data = Array();
	// parses names of unused categories into an array				
	unused.forEach(function(d){ 
		data.push(d.value);
	});   

	    var table = d3.select("#wikiVersions").append("table")
           .attr("style", "margin-left: 250px"),

	    thead = table.append("thead"),
        tbody = table.append("tbody");

		table.attr("class", "versionTable");

    	// append the header row
		thead.append("tr")
		.attr("style", "text-align:left")
	     .selectAll("th")
	     .data(columns)
         .enter()
 	     .append("th")
          .text(function(column) { return column; });

		// create a row for each object in the data
	    var rows = tbody.selectAll("tr")
			.data(data)
			.enter()
			.append("tr");

	    // create a cell in each row for each column
	    var cells = rows.selectAll("td")
			.data(function(row) {
 				 return columns.map(function(column) {
	               	return {column: column, value: row};
    			 });
			})
	        .enter()
	        .append("td")
			.attr("style", "font-family: Courier")
				.html(function(d) { return d.value; });


		return table;
}



if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun /*, thisp*/) {
    var len = this.length >>> 0;
    if (typeof fun != "function")
    throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in this) {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
        res.push(val);
      }
    }
    return res;
  };
}
Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
}


