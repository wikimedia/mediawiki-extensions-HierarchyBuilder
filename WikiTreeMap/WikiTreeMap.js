window.WikiTreeMap = function() {
    var jsonData = {"name":"allcategories", "children" : []};
    var elmData;
}






WikiTreeMap.prototype.drawChart = function(graphDiv, divwidth, divheight, wiki) {
	
	window.onload = function(e){        
		if (wiki !== ""){
//			$('#selectAWiki').hide();						
			var elmDiv = wiki;
			elmData = elmDiv;        
			jsonData = {"name":"allcategories", "children" : []};
				$('div.wikitreemap-graph-container').append("<h2>" + elmData + "</h2>");
			var categoryUrl = getCategoryUrl(elmData);
			var	wantedUrl = getWantedUrl(elmData);
			var unusedUrl = getUnusedUrl(elmData);
			getWanted(wantedUrl, categoryUrl, graphDiv, divwidth, divheight);
			getUnused(unusedUrl, categoryUrl, graphDiv, divwidth, divheight);
		} else {
			var vikiObject = [];
				vikiObject.graphDiv = graphDiv;
				vikiObject.divwidth = divwidth;
				vikiObject.divheight = divheight;
			mitre_getAllWikis(vikiObject) 
		}
    }; 

}







var tutorTree = function(data, graphDiv, divwidth, divheight, wanted){

	// add the necessary names and values for the treemap to recognize the data          
	data.children.forEach(function(o){
	  o.name = o['*'];
	  o.value = o.pages;
	})

	if(wanted){
		wanted.forEach( function(w){ 
			data.children.forEach( function(d){ if(d['*']===w.title.split(':')[1]){d.color = "#990000";} else{d.color = "black"} }  )
		})
	}

	var margin = {top: 40, right: 20, bottom: 10, left: 20},
	  width = 829 - margin.left - margin.right,
	  height = 550 - margin.top - margin.bottom;
	  
	var paddingAllowance = 2;
	var color = d3.scale.category20();
	var treemap = d3.layout.treemap()
		.size([(width),(height)])
		.nodes(data)


	var tip = d3.tip()
	.attr('class', 'd3-tip')
	.offset([-10, 0])
	.html(function(d) {
	  return "<strong>Category:</strong> <span style='color:red'>" + d.name + "</span>" +
			 "</br>" +
			 "<strong>Subcategories:</strong> <span style='color:yellow'>"+d.subcats+"</span>" + "</br>" +
			 "<strong>Pages:</strong> <span style='color:green'>" + d.pages + "</span>";
	})




	var canvas = d3.select("#" + graphDiv).append("svg")
		      .style("position", "relative")
		      .style("width", width + margin.left + margin.right + "px")
		      .style("height", height + margin.top + margin.bottom + "px")
		      .attr("class", "tree")
	  		.append("g")
		      
	canvas.call(tip);	  
	canvas.selectAll("svg").append("h2")


    // after calling 'treemap', it reorders the values in the object. 
	var cells = canvas.selectAll("g")
	  .data(treemap)
	  .enter().append("g")
	  .attr("class", "cell")
	.call(position);

          // This makes the DOM object elements a function of the treemap variables
	cells.append("rect")
	  .attr("x", function (d) {return d.x; })
	  .attr("y", function (d) {return d.y; })
	  .attr("width", function (d) {return d.dx; })
	  .attr("height", function (d) {return d.dy; })
	  .attr("fill", function (d) {return d.children ? null : color(d.parent.name);})
	  .attr("stroke", "white")
	  .on('mouseover', tip.show)
	  .on('mouseout', tip.hide);

	cells.append("svg:text")
		.attr("x", function(d){return d.x})
		.attr("y", function(d){return d.y})
		.attr("dx", "0.35em")
		.attr("dy", "0.9em")
		.each(fontSize)
		.each(wordWrap);
}   


function fontSize(d,i) {
	var size = d.dx/5;
	var words = d.name.split(' ');
	var word = words[0];
	var width = d.dx;
	var height = d.dy;
	var length = 0;
	d3.select(this).style("font-size", size + "px").text(word);
	while(((this.getBBox().width >= width) || (this.getBBox().height >= height)) && (size > 12))
	{
		size--;
		if(d.dy===0 || d.name==='allcategories'){
		d3.select(this).style("font-size", 0 + "px");
		} else {
		d3.select(this).style("font-size", size + "px");
		}
		this.firstChild.data = word;
	}
}





function wordWrap(d, i){
	var words = d.name.split(' ');
	var line = new Array();
	var length = 0;
	var text = "";
	var width = d.dx;
	var height = d.dy;
	var word;
	do {
	   word = words.shift(); // adds the first word in the title to the variable 'word'
	   line.push(word); // adds that word to the 'line'
	   if (words.length) // if there are still words left in the 'words' array, 
		 this.firstChild.data = line.join(' ') + " " + words[0];
		 // declare the actual text object to be the line plus the next value
	   else
		 this.firstChild.data = line.join(' ');  // if no more words, set text to the 'line'

	   length = this.getBBox().width;  // determine the width of the bounding box
	   if (length < width && words.length) {  
		// if the bounding box is less wide than the rect, and there are words left, 
		// move to the next word
		 ;
	   }
	   else { // but if the bounding box is bigger than the rect, or there are no words left,
		  // then the box should be sufficuently populated
		 text = line.join(' '); // declare 'text' to be the stuff in the line
		 this.firstChild.data = text;  // declare the svg element to be 'text'
		 if (this.getBBox().width > width) { 
		// if the bbox is wider than the rect
		// add dots and make it a part of the object
		   text = d3.select(this).select(function() {return this.lastChild;}).text();
		   text = text + "...";
		   d3.select(this).select(function() {return this.lastChild;}).text(text);
		   d3.select(this).classed("wordwrapped", true);
		   break;
		}
		else
		  ;

	  if (text != '') {
		d3.select(this).append("svg:tspan")
		.attr("x", function(d){return d.x})
		.attr("dx", "0.1em")
		.attr("dy", "0.9em")
		.style("fill",function(d){return d.color})
		.text(text);
	  }
	  else
		 ;

	  if(this.getBBox().height > height && words.length) {
		 text = d3.select(this).select(function() {return this.lastChild;}).text();
		 text = text + "...";
		 d3.select(this).select(function() {return this.lastChild;}).text(text);
		 d3.select(this).classed("wordwrapped", true);

		 break;
	  }
	  else
		 ;
	  line = new Array(); // Line is reinstantiated, deleting what was in it before
		}
	  } while (words.length);
	  this.firstChild.data = '';
	 //   line = new Array();
} 






function position() {
  this.style("left", function(d) { return d.x + "px"; })
  .style("top", function(d) { return d.y + "px"; })
  .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
  .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}






function recursiveQuery(vikiObject, wanted){
	jQuery.ajax({

		url: vikiObject.wUrl,
		dataType: 'jsonp',
		async: false,
		success: function (data, textStatus, jqXHR) {
		  jsonData.children = jsonData.children.concat(data.query.allcategories);
		  if(vikiObject.elmLabel==="mitrepedia"){
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



function fillDropdown(dropdownName, vikiObject) {
	
	// Creating the dropdown menu
    $('#selectAWiki').append('<select id="wikis" style="width:500px;"></select>');		
    $(dropdownName).prepend("<option value='0' selected='true'>" +"--Select a Wiki--"+ "</option>");
    $(dropdownName).find("option:first")[0].selected = true;
    $('#selectAWiki').append('<p><button id="loadData" type="button">Load Data</button></p>');		
    $('#selectAWiki').append('<p><button id="clearData" type="button">clear</button></p>');		
    $(dropdownName).append('<option value="' + "http://mitrepedia.mitre.org/api.php" + '">' + "MITREpedia" + '</option>');

  	vikiObject.activeWikis.forEach(function(d) {
        $(dropdownName).append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
    });
	
	$('#clearData').click(function(e){$('svg').remove(); $('h2').remove();})

	$('#loadData').click(function(e){
	    var elmDiv = $('#wikis');
	    elmValue = elmDiv[0].value;        
		elmLabel = elmDiv[0]['selectedOptions'][0]['label'];
	    jsonData = {"name":"allcategories", "children" : []};
		$('div.wikitreemap-graph-container').append("<h2>" + elmLabel + "</h2>");
		vikiObject.elmLabel = elmLabel;
//		console.log(elmValue);
		vikiObject.wUrl = elmValue + "?action=query&list=allcategories&format=json&acprop=size&aclimit=500&acmin=1"
		vikiObject.unusedUrl = elmValue + "?action=query&list=querypage&qppage=Unusedcategories&format=json"
		vikiObject.wantedUrl = elmValue + "?action=query&list=querypage&qppage=Wantedcategories&format=json";
		getWanted(vikiObject);  
		getUnused(vikiObject);
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








function getWantedUrl(elmData){
	if(elmData==="mitrepedia"){
      return "http://" + elmData + ".mitre.org/api.php?action=query&list=allcategories&acmin=1&acto=Tags&format=json&aclimit=max&acmax=max&acprop=size"
    } else {
	  console.log(elmData + "?action=query&list=querypage&qppage=Wantedcategories&format=json");
      return elmData + "?action=query&list=querypage&qppage=Wantedcategories&format=json"
    }		
}








function getCategoryUrl(elmData){
    if(elmData==="mitrepedia"){
      return "http://" + elmData + ".mitre.org/api.php?action=query&list=allcategories&acmin=1&acto=Tags&format=json&aclimit=max&acmax=max&acprop=size"
    } else {
      return "http://" + elmData + ".mitre.org/.mediawiki/api.php?action=query&list=allcategories&format=json&acprop=size&aclimit=500&acmin=1"
    }
}






	
function getUnusedUrl(elmData){
    if(elmData==="mitrepedia"){
      return "http://" + elmData + ".mitre.org/api.php?action=query&list=allcategories&acmin=1&acto=Tags&format=json&aclimit=max&acmax=max&acprop=size"
    } else {
      return "http://" + elmData + ".mitre.org/.mediawiki/api.php?action=query&list=querypage&qppage=Unusedcategories&format=json"
    }
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
           error(textStatus);
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

	    var table = d3.select("body").append("table")
            .attr("style", "margin-left: 250px"),

	    thead = table.append("thead"),
        tbody = table.append("tbody");

		table.attr("class", "unusedTable");

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







window.MITRE_VIKI = {
	GESTALT_API_URL : "http://gestalt.mitre.org/gestalt/api.php"
}

window.mitre_getAllWikis = function(vikiObject, parameters, hookName) {
   MITRE_VIKI.hookName = hookName;

   queryForAllWikis(vikiObject, null);
}




window.queryForAllWikis = function(vikiObject, offset) {
// TODO: use offset if it exists to craft next query  
//   hook_log("url: "+MITRE_VIKI.GESTALT_API_URL);
   jQuery.ajax({
      url: MITRE_VIKI.GESTALT_API_URL,
      dataType: 'jsonp',
      data: {
         action: 'askargs',
         conditions: 'Category:Gestalt Communities',
         printouts: 'Wiki API URL|Wiki Content URL|Small Wiki Logo|Gestalt Community Searchable|Wiki Type',
         parameters: 'limit=500',
         format: 'json'
      },
      beforeSend: function (jqXHR, settings) {
         url = settings.url;
         // hook_log("url of ajax call: "+url);
      },
      success: function(data, textStatus, jqXHR) {
        parseAllWikisResults(data, vikiObject);
	//	fillDropdown('#wikis', vikiObject);
      },
      error: function(jqXHR, textStatus, errorThrown) {
         alert("Unable to fetch list of wikis. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown="+errorThrown);
      }
   });
}




window.parseAllWikisResults = function(data, vikiObject) {
   allWikis = data["query"]["results"];
   allWikisArray = [];

   for(var i in allWikis) {
      var title = allWikis[i]["fulltext"];
      var wiki = {
            wikiTitle: title,
            apiURL: allWikis[i]["printouts"]["Wiki API URL"][0],
            contentURL: allWikis[i]["printouts"]["Wiki Content URL"][0],
            logoURL: allWikis[i]["printouts"]["Small Wiki Logo"][0],
			wikiType : allWikis[i]["printouts"]["Wiki Type"][0],
            };
            if(allWikis[i]["printouts"]["Gestalt Community Searchable"].length > 0 && allWikis[i]["printouts"]["Gestalt Community Searchable"][0] === 't')
               wiki.searchableWiki = true;
            else
               wiki.searchableWiki = false;
            
      allWikisArray.push(wiki);

   }

vikiObject.allWikis = allWikisArray;
vikiObject.activeWikis = []
vikiObject.allWikis.forEach(function(d){
	if(d.wikiType=="Production"){
		vikiObject.activeWikis.push(d)
	}
})

fillDropdown('#wikis', vikiObject);
}


