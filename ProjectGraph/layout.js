BaseLayout.prototype.initializeGraph = function(object){
	self.zoom = d3.behavior.zoom()
   .on("zoom", self.redrawZoom)
   .scaleExtent([self.MIN_SCALE, self.MAX_SCALE]);

// set up the SVG canvas.
var svg = d3.select("#"+graphDiv)
   .append("svg:svg")
      .attr("width", self.width)
      .attr("height", self.height)
      .attr("pointer-events", "all")
  .append("svg:g")
      .call(self.zoom)
      .on("dblclick.zoom", null);

  svg.append("svg:rect")
     .attr("width", self.width)
     .attr("height", self.height)
     .attr("fill", "white");

  svg.append("svg:g")
     .attr("id", "moveable");	
}