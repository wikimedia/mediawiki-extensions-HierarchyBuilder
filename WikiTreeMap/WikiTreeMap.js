window.WikiTreeMap = function() {
    var jsonData = {"name":"allcategories", "children" : []};
    var elmData;
}

WikiTreeMap.prototype.drawChart = function(graphDiv, divwidth, divheight) {
      var wikis = ["cnsdtm", "darpapedia", "dstc", "dstc-devel","enable", "eseteam", "examples", "experipedia",  "geopedia", "gestalt",  "gestaltd", "healthcareanalytics", "international", "j850mip", "j85d",  "jcrew-connect",  "languapedia","map",  "mitrepedia","mobilepedia", "mooc", "odp", "phatwiki", "reading",  "robopedia","socialmedia","tge", "tools","viki"];     
      fillAppropriateDropdown('#wikis', wikis);
      // var graphDiv = graphDiv;


    $('#clearData').click(function(e){$('svg').remove(); $('h2').remove();})

    $('#loadData').click(function(e){
        var elmDiv = $('#wikis');
            elmData = elmDiv[0].value;        
            jsonData = {"name":"allcategories", "children" : []};
         //   $('svg').remove();
//            $('h2').append().text(elmData);
	    $('div.wikitreemap-graph-container').append("<h2>" + elmData + "</h2>");
        if(elmData==="mitrepedia"){

          var wikiUrl = "http://" + elmData + ".mitre.org/api.php?action=query&list=allcategories&acmin=1&acto=Tags&format=json&aclimit=max&acmax=max&acprop=size"
        } else {
          var wikiUrl = "http://" + elmData + ".mitre.org/.mediawiki/api.php?action=query&list=allcategories&format=json&acprop=size&acmax=500&acto=Tags"
        }
            recursiveQuery(wikiUrl, graphDiv, divwidth, divheight);       
      }); 
}

      var tutorTree = function(data, graphDiv, divwidth, divheight){
		// add the necessary names and values for the treemap to recognize the data          
        data.children.forEach(function(o){
          o.name = o['*'];
          o.value = o.pages;
        })

	  var margin = {top: 40, right: 20, bottom: 10, left: 20},
	      width = 829 - margin.left - margin.right,
	      height = 550 - margin.top - margin.bottom;
          
	  var paddingAllowance = 2;
          var color = d3.scale.category20();

          var treemap = d3.layout.treemap()
                  .size([(width),(height)])
                  .nodes(data)

          var canvas = d3.select("#" + graphDiv).append("svg")
                      .style("position", "relative")
                      .style("width", width + margin.left + margin.right + "px")
                      .style("height", height + margin.top + margin.bottom + "px")
                      .attr("class", "tree")
		      .append("g")
		      

                  //  .attr("transform", "translate(-.5,-.5)");
                  // .attr("width", width)  // width
                  // .attr("height", height) // height

	  
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
   word = words.shift();
   line.push(word);
   if (words.length)
     this.firstChild.data = line.join(' ') + " " + words[0]; 
   else
     this.firstChild.data = line.join(' ');
   length = this.getBBox().width;
   if (length < width && words.length) {
     ;
   }
   else {
     text = line.join(' ');
     this.firstChild.data = text;
     if (this.getBBox().width > width) { 
       text = d3.select(this).select(function() {return this.lastChild;}).text();
       text = text + "...";
       d3.select(this).select(function() {return this.lastChild;}).text(text);
       d3.select(this).classed("wordwrapped", true);
       break;
    }
    else
      ;

//  if (text != '') {
//    d3.select(this).append("svg:tspan")
//    .attr("x", 0)
//    .attr("dx", "0.15em")
//    .attr("dy", "0.9em")
//    .text(text);
//  }
//  else
//     ;

  if(this.getBBox().height > height && words.length) {
     text = d3.select(this).select(function() {return this.lastChild;}).text();
     text = text + "...";
     d3.select(this).select(function() {return this.lastChild;}).text(text);
     d3.select(this).classed("wordwrapped", true);

     break;
  }
  else
     ;

  line = new Array();
    }
  } while (words.length);
 // this.firstChild.data = '';
} 


     function position() {
      this.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
	}


      function recursiveQuery(wUrl,graphDiv, divwidth, divheight){
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
                  recursiveQuery(newQuery, graphDiv, divwidth, divheight);
                } else {
                  tutorTree(jsonData, graphDiv, divwidth, divheight);
                }
              } else {
                 if (data.hasOwnProperty("query-continue")){        
                  var qCont = data['query-continue'].allcategories.accontinue;
                  var newQuery = wUrl.split("&acfrom=")[0] + "&acfrom=" + qCont;
                  recursiveQuery(newQuery, graphDiv, divwidth, divheight);
                } else {
                  tutorTree(jsonData, graphDiv, divwidth, divheight);
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
