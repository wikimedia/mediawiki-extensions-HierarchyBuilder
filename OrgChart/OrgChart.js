window.OrgChart = function() {
	this.width = 0;
	this.height = 0;
	this.nodeWidth = 350;
	this.nodeHeight = 75;

	this.imageWidth = this.nodeHeight;

	this.MIN_SCALE = .2;
	this.MAX_SCALE = 3;
	this.Zoompos = 1;

	this.tree = null;
	this.imagePath = mw.config.get("wgServer")+mw.config.get("wgScriptPath") + "/extensions/OrgChart/";
	this.familyTreeData = {
	"name" : "DoD",
	"longName" : "U.S. Department of Defense",
	"img" : "dod.jpg",
	"children" : [
	  {
	    "name" : "AMEDD",
	    "longName" : "U.S. Army Medical Command",
	    "img" : "amedd.png",
	    "children" : [
	      { 
	        "name" : "BAMC",
		"longName" : "Brooke Army Medical Center",
		"img" : "bamc.gif"
	      },
	      {
		"name" : "AMEDD C & S",
		"longName" : "U.S. Army Medical Department Center and School",
		"img" : "amedd_cs.png"
	      }
	    ]
	  }
	]
	};
		
/*	this.familyTreeData = {
	  "name" : "J800",
	  "children": [

		{
			"name" : "J810",
			"children": [
				{"name" : "J81A"},
				{"name" : "J81B"},
				{"name" : "J81C"},
				{"name" : "J81D"},
				{"name" : "J81E"},
				{"name" : "J81F"},
				{"name" : "J81G"}
			]
		},
		{
			"name" : "J820",
			"children": [
				{"name" : "J82A"},
				{"name" : "J82B"},
				{"name" : "J82C"},
				{"name" : "J82D"},
				{"name" : "J82E"},
				{"name" : "J82F"},
				{"name" : "J82G"},
				{"name" : "J82H"}
			]
		},
		{
			"name" : "J830",
			"children": [
				{"name" : "J83A"},
				{"name" : "J83B"},
				{"name" : "J83C"},
				{"name" : "J83D"},
				{"name" : "J83E"},
				{"name" : "J83F"},
				{"name" : "J83G"},
				{"name" : "J83H"},
				{"name" : "J83J"},
				{"name" : "J83K"},
				{"name" : "J83L"}
			]
		},
		{
			"name" : "J840",
			"children": [
 				{"name" : "J84A"},
				{"name" : "J84B"},
				{"name" : "J84C"},
				{"name" : "J84D"}
			]
		},
	  	{
		    "name" : "J850",
			"children": [
				{"name" : "J85A"},
				{"name" : "J85B"},
				{"name" : "J85C"},
				{"name" : "J85D"},
				{"name" : "J85E"},
				{"name" : "J85F"},
				{"name" : "J85G"},
				{"name" : "J85H"},
				{"name" : "J85J"}
			]
		},		  
		{
			"name" : "J860",
			"children": [
				{"name" : "J86A"},
				{"name" : "J86B"},
				{"name" : "J86C"},
				{"name" : "J86D"},
				{"name" : "J86E"},
				{"name" : "J86F"},
				{"name" : "J86G"}
			]
		}
		
	  ]
	};
*/
}

OrgChart.prototype.drawChart = function(orgName, graphDiv, width, height) {
	var self = this;
	self.width = width;
	self.height = height;

	// set up the zoom behavior.
	self.zoom = d3.behavior.zoom().translate([600,200])
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
	     .attr("fill", "white")

	  svg.append("svg:g")
	     .attr("id", "moveable")
//	     .attr("transform", "translate("+self.width/2+", "+self.height*3/2+")");
	     .attr("transform", "translate(600,200)");	
  
	d3.select("#moveable").append("svg:g").attr("id", "links");
	d3.select("#moveable").append("svg:g").attr("id", "nodes");

	// initialize the tree.
	self.tree = d3.layout.tree()
	  .nodeSize([self.nodeWidth, self.nodeHeight*2])
	  .separation(function(a,b) {
		return a.parent == b.parent ? 2 : 3;
	  });
	
    // change x and y (for the left to right tree)
	// or don't change them for the top-to-bottom tree
	var diagonal = d3.svg.diagonal()
	    .projection(function(d) { return [d.x, d.y]; });
	
	
	// set up the nodes (from the JSON data) and the links (from the nodes)
	// this is on the data side, not on the drawing side
	var nodes = self.tree.nodes(self.familyTreeData);
	var links = self.tree.links(nodes);
	
	// do a data-join to draw paths for all links
	var allLinks = svg.select("#links").selectAll("pathlink")
	.data(links)
	.enter().append("svg:path")
	.attr("class", "link")
	.attr("d", diagonal)
	
	// do a data-join to draw things for all nodes
	var allNodes = svg.select("#nodes").selectAll(".node")
	.data(nodes)
	.enter().append("svg:g")
	// if swapped x,y above, then swap it here too
	.attr("transform", function(d) { return "translate("+d.x+", "+d.y+")"})
	.attr("class", "node");

	// draw stuff inside the node.
	var padding = 2;

	allNodes.append("svg:rect")
	.attr("x", function(d) { return -1*self.nodeWidth/2; })
	.attr("y", function(d) { return -1*self.nodeHeight/2; })
	.attr("width", self.nodeWidth)
	.attr("height", self.nodeHeight)
	.attr("fill", "white")
	.attr("stroke", "black")
	.attr("stroke-width", 1);

	allNodes.append("svg:image")
	.attr("xlink:href", function(d) { return self.imagePath + d.img; })
	.attr("width", this.imageWidth)
	.attr("height", this.imageWidth)
	.attr("x", -1*self.nodeWidth/2)
	.attr("y", -1*self.nodeHeight/2);

	allNodes.append("svg:text")
	.attr("text-anchor", "start")
	.text(function(d) { return d.name; })
	.style("font-family", "Verdana")
	.style("font-size", "20pt")
	.style("font-weight", "bold")
	.attr("x", -1*self.nodeWidth/2 + self.imageWidth + padding)
	.attr("y", -1*self.nodeHeight/4)
	.attr("dy", ".5em")	// see bost.ocks.org/mike/d3/workshop/#114
	.attr("fill", "black")
	.attr("id", "titleLabel");

	allNodes.append("svg:text")
	.attr("text-anchor", "start")
	.text(function(d) { return d.longName; })
	.style("font-family", "Verdana")
	.style("font-size", "10pt")
	.style("font-style", "italic")
	.attr("x", -1*self.nodeWidth/2 + self.imageWidth + padding)
	.attr("y", function(d) {
		var node = d3.select(this.parentNode);
		var topText = node.select("#titleLabel").node();
		var textbox = topText.getBBox();
		return -1*self.nodeHeight/4 + textbox.height;

	})
	.attr("fill", "black");

}

OrgChart.prototype.redrawZoom = function() {	
	self.Zoompos = d3.event.scale;
	d3.select("#moveable").attr("transform", "translate("+d3.event.translate+")" + " scale("+self.Zoompos+")");
}
