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
/*	this.familyTreeData = {
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
*/		

	OrgChart.prototype.assembleData = function(orgName) {

		var self = this;

		var orgChartData = self.queryForParents(orgName, null);
		// after queryForParents, orgChartData is a linear tree (no branches) from top org to bottom.
		var currentOrg = orgChartData;
		while(currentOrg["children"]) {
			currentOrg = currentOrg["children"][0];
		}
		// now currentOrg should point to the bottom org in the tree
//		currentOrg["children"] = self.queryForChildren(currentOrg.name, 
		self.log(orgChartData);
		this.familyTreeData = orgChartData;
	//====================================================================================================================
	// query to get parent and page info (e.g. name, longName)
/*		jQuery.ajax({
			url: 'http://gestalt-dev.mitre.org/bispr/index.php?title=Special:Ask&q=[[' + orgName + ']]&po=?Parent%0D%0A?Short Name%0D%0A?Long Name%0D%0A?Website%0D%0A?Logo Link&p[format]=json',
			dataType: 'json',
			beforeSend: function(jqXHR, settings) {
				self.log("url of query: "+settings.url);
			},
			success: function(data, textStatus, jqXHR) {
				self.log("result: "+data["results"]);
			},
			failure: function(jqXHR, textStatus, errorThrown) {
				alert("failed query to Special:Ask");
			}
		});
*/
	//====================================================================================================================


	}

	OrgChart.prototype.queryForParents = function(orgName, orgChartData) {
		var self = this;

		jQuery.ajax({
			async: false,
			url: 'http://gestalt-dev.mitre.org/bispr/index.php?title=Special:Ask&q=[[' + encodeURIComponent(orgName) + ']]&po=?Parent%0D%0A?Short Name%0D%0A?Long Name%0D%0A?Website%0D%0A?Logo Link&p[format]=json',
			dataType: 'json',
			beforeSend: function(jqXHR, settings) {
				self.log("url of query: "+settings.url);
			},
			success: function(data, textStatus, jqXHR) {
				result = data["results"][orgName]["printouts"];
				var newOrg = {
					"name" : result["Short Name"][0],
					"longName" : result["Long Name"][0],
					"website" : result["Website"][0],
					"img" : result["Logo Link"][0],
//					"children" : [ orgChartData ]
				};
				if(orgChartData)
					newOrg["children"] = [ orgChartData ];

				orgChartData = newOrg;

				if(result["Parent"][0]) {
					orgChartData = self.queryForParents(result["Parent"][0]["fulltext"], orgChartData);
				}

			},
			failure: function(jqXHR, textStatus, errorThrown) {
				alert("failed query to Special:Ask");
			}
		});

		return orgChartData;
	}

	OrgChart.prototype.queryForChildren = function(orgObject) {
		// query for children on orgObject.name
		// for each result:
		// 	result = { name, children = [] }
		//	orgObject.children.push(result)
		//	queryForChildren(result) - to get any children of this result
		//	queryChild(result) - to get page info ABOUT this result

	}

	OrgChart.prototype.drawChart = function(orgName, graphDiv, width, height) {
		var self = this;

		self.assembleData(orgName);

		self.width = width;
		self.height = height;

		// set up the zoom behavior.
		self.zoom = d3.behavior.zoom().translate([600,200]).scale(0.7)
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
		     .attr("transform", "translate(600,200) scale(0.7)");	
	  
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
		.attr("id", "titleLabel");

		allNodes.append("svg:text")
		.attr("text-anchor", "start")
		.text(function(d) { return d.longName; })
		.style("font-family", "Verdana")
		.style("font-size", "11pt")
		.style("font-style", "italic")
		.attr("y", function(d) {
			var node = d3.select(this.parentNode);
			var topText = node.select("#titleLabel").node();
			var textbox = topText.getBBox();
			return -1*self.nodeHeight/4 + textbox.height;

		})
		.call(self.textWrap, this.nodeWidth-this.imageWidth, -1*self.nodeWidth/2 + self.imageWidth + padding);

	}

	// this method adapted from bl.ocks.org/mbostock/7555321
	OrgChart.prototype.textWrap = function(text, width, x) {	
		text.each(function() {
			var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1.1, // ems
				y = text.attr("y"),
				dy = parseFloat(text.attr("dy")) || 0,
				tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					line.pop();
					tspan.text(line.join(" "));
					line = [word];
					tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
				}
			}
		});
	}

	OrgChart.prototype.redrawZoom = function() {	
		self.Zoompos = d3.event.scale;
		d3.select("#moveable").attr("transform", "translate("+d3.event.translate+")" + " scale("+self.Zoompos+")");
	}

	OrgChart.prototype.log = function(text) {
		if( (window['console'] !== undefined) )
			console.log( text );
	}
}
