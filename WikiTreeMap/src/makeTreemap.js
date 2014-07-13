

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
	.offset([0, 0])
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





