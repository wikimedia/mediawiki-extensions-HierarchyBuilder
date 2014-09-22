

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
//		   error(textStatus);
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
//		   error(textStatus);
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
     	    var unused = data.query.querypage.results;
			if(unused.length){
				var tabulation = tabulate(unused, ["Unused Categories:"]);
				setTimeout(function() {
		  			 $('div.wikitreemap-graph-container').append(tabulation);
				;}, 1000);
			}		      
		},
        error: function (jqXHR, textStatus, errorThrown) {
//           error(textStatus);
//	           recursiveQuery(categoryUrl, graphDiv, divwidth, divheight);
        }
    }); 	
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


