window.WikiTreeMap = function() {
    var jsonData = {"name":"allcategories", "children" : []};
    var elmData;
//    mitre_getAllWikis(vikiObject)    
}

WikiTreeMap.prototype.drawChart = function(graphDiv, divwidth, divheight, wiki) {
	if (wiki !== ""){
		$('#selectAWiki').hide();						
	}

      var wikis = ["cnsdtm", "darpapedia", "dstc", "dstc-devel","enable", "eseteam", "examples", "experipedia",  "geopedia", "gestalt",  "gestaltd", "healthcareanalytics", "international", "j850mip", "j85d",  "jcrew-connect",  "languapedia","map",  "mitrepedia","mobilepedia", "mooc", "odp", "phatwiki", "reading",  "robopedia","socialmedia","tge", "tools","viki"];     
      fillAppropriateDropdown('#wikis', wikis);

	window.onload = function(e){
    	var elmDiv = wiki;
        elmData = elmDiv;        
        jsonData = {"name":"allcategories", "children" : []};
	    $('div.wikitreemap-graph-container').append("<h2>" + elmData + "</h2>");
		var categoryUrl = getCategoryUrl(elmData);
		var	wantedUrl = getWantedUrl(elmData);
	    var unusedUrl = getUnusedUrl(elmData);
		getWanted(wantedUrl, categoryUrl, graphDiv, divwidth, divheight);
		getUnused(unusedUrl, categoryUrl, graphDiv, divwidth, divheight);
	    var vikiObject = [];
		mitre_getAllWikis(vikiObject) 
    }; 
    


    $('#clearData').click(function(e){$('svg').remove(); $('h2').remove();})

    $('#loadData').click(function(e){
        var elmDiv = $('#wikis');
        elmData = elmDiv[0].value;        
        jsonData = {"name":"allcategories", "children" : []};
	    $('div.wikitreemap-graph-container').append("<h2>" + elmData + "</h2>");
		var categoryUrl = getCategoryUrl(elmData);
	    var unusedUrl = getUnusedUrl(elmData);
		var wantedUrl = getWantedUrl(elmData);
	    getWanted(wantedUrl, categoryUrl, graphDiv, divwidth, divheight);  
		getUnused(unusedUrl, categoryUrl, graphDiv, divwidth, divheight);
      }); 
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
		      

                  //  .attr("transform", "translate(-.5,-.5)");
                  // .attr("width", width)  // width
                  // .attr("height", height) // height

	  canvas.call(tip);	  
	  canvas.selectAll("svg").append("h2")

//	  canvas.append("h2");
//		 .addClass("text")
//		 .attr("x", 0)
//		 .attr("y", 0)
//		 .text(elmData);

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
//	      .call(wrap, 10);
//	      .text(function(d) { return d.children ? null : d.name; });

//           cells.append("text")
//               .attr("x", function(d){ return d.x + d.dx / 2})
//               .attr("y", function(d){ return d.y + d.dy / 2})
//               .attr('text-anchor', 'middle')
//               .text(function(d){return d.children ? null : d['*'];})
// 	       .call(wrap, 10);	
               // .call(self.textWrap, 0.9*(this.width), -1*self.width/2 + paddingAllowance);

	cells.append("svg:text")
		.attr("x", function(d){return d.x})
		.attr("y", function(d){return d.y})
		.attr("dx", "0.35em")
		.attr("dy", "0.9em")
		.each(fontSize)
		.each(wordWrap);




//	   d3.selectAll("input").on("change", function change() {
//	    var value = this.value === "count"
//	        ? function() { return 1; }
//	        : function(d) { return d.size; };
//
//	    cells
//	        .data(treemap.value(value).cells)
//	      .transition()
//	        .duration(1500)
//	        .call(position);
//	   });


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


      function recursiveQuery(wUrl,graphDiv, divwidth, divheight, wanted){
        jQuery.ajax({

            url: wUrl,
            dataType: 'jsonp',
            async: false,
            success: function (data, textStatus, jqXHR) {
              jsonData.children = jsonData.children.concat(data.query.allcategories);
              if(elmData==="mitrepedia"){
                if (data.hasOwnProperty("query-continue")){        
                  var qCont = data['query-continue'].allcategories.acfrom;
                  var newQuery = wUrl.split("&acfrom=")[0] + "&acfrom=" + qCont;
                  recursiveQuery(newQuery, graphDiv, divwidth, divheight, wanted);
                } else {
                  tutorTree(jsonData, graphDiv, divwidth, divheight, wanted);
                }
              } else {
                 if (data.hasOwnProperty("query-continue")){        
                  var qCont = data['query-continue'].allcategories.accontinue;
                  var newQuery = wUrl.split("&acfrom=")[0] + "&acfrom=" + qCont;
                  recursiveQuery(newQuery, graphDiv, divwidth, divheight, wanted);
                } else {
                  tutorTree(jsonData, graphDiv, divwidth, divheight, wanted);
                }
              }
            },
            error: function (jqXHR, textStatus, errorThrown) {
               error(textStatus);
            }
        }); 

      }

     function fillAppropriateDropdown(dropdownName, arrayToUse) {
        $.each(arrayToUse,
            function() {
            $(dropdownName).append('<option value="' + this + '">' + this + '</option>');
            });
            $(dropdownName).prepend("<option value='0' selected='true'>" +"--Select a Wiki--"+ "</option>");
            $(dropdownName).find("option:first")[0].selected = true;
    }

			
     function getWanted(wantedUrl, categoryUrl, graphDiv, divwidth, divheight){
	  jQuery.ajax({
            url: wantedUrl,
            dataType: 'jsonp',
            async: false,
            success: function (data, textStatus, jqXHR) {
		      var wanted = data.query.querypage.results;
	              recursiveQuery(categoryUrl, graphDiv, divwidth, divheight, wanted);
		},
            error: function (jqXHR, textStatus, errorThrown) {
               error(textStatus);
	           recursiveQuery(categoryUrl, graphDiv, divwidth, divheight);
            }
        }); 
     }

    function getWantedUrl(elmData){
		if(elmData==="mitrepedia"){
          return "http://" + elmData + ".mitre.org/api.php?action=query&list=allcategories&acmin=1&acto=Tags&format=json&aclimit=max&acmax=max&acprop=size"
        } else {
          return "http://" + elmData + ".mitre.org/.mediawiki/api.php?action=query&list=querypage&qppage=Wantedcategories&format=json"
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

	function getUnused(unusedUrl, categoryUrl, graphDiv, divwidth, divheight){
		jQuery.ajax({
            url: unusedUrl,
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

	// render the table
//	var peopleTable = tabulate(data, ["date", "close"]);
