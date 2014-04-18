window.OrgChart = function() {
	this.width = 0;
	this.height = 0;
	this.nodeWidth = 370;
	this.nodeHeight = 100;
	this.imagePadding = 20;
	this.imageWidth = this.nodeHeight-this.imagePadding;

	this.MIN_SCALE = .1;
	this.MAX_SCALE = 3;
	this.Zoompos = 1;

	this.tree = null;
	this.apiURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath") + "/api.php";
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
		// now currentOrg should point to the bottom org in the tree (also the originally passed-in org)
		currentOrg["focused"] = true;
		currentOrg["children"] = self.queryForChildren(currentOrg);
		if(!currentOrg["children"])
			delete currentOrg["children"];

		//self.log(orgChartData);
		this.orgTreeData = orgChartData;

		return currentOrg;
	}

	OrgChart.prototype.queryForParents = function(orgName, orgChartData) {
		var self = this;

		var regExp = /1.2[0-9]/g;
		var mwVersion = mw.config.get("wgVersion").match(regExp)[0];

		if(mwVersion === "1.22") {

			jQuery.ajax({
				async: false,
				url: self.apiURL,
				data: {
					action : "askargs", 
					conditions : orgName,
					printouts : "Parent|Short Name|Long Name|Website|Logo Link",
					format : "json"
				},
				success: function(data, textStatus, jqXHR) {
					if(data) {
						result = data["query"]["results"][orgName]["printouts"];
						var newOrg = {
							"name" : result["Short Name"][0],
							"longName" : result["Long Name"][0],
							"website" : result["Website"][0],
							"img" : result["Logo Link"][0]
						};
						if(orgChartData)
							newOrg["children"] = [ orgChartData ];

						orgChartData = newOrg;

						if(result["Parent"][0]) {
							orgChartData = self.queryForParents(result["Parent"][0]["fulltext"], orgChartData);
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("failed query to Special:Ask for parent");
				}
			});

		}
		else {

			jQuery.ajax({
				async: false,
				url: 'http://gestalt-dev.mitre.org/bispr/index.php?title=Special:Ask&q=[[' + encodeURIComponent(orgName) + ']]&po=?Parent%0D%0A?Short Name%0D%0A?Long Name%0D%0A?Website%0D%0A?Logo Link&p[format]=json',
				dataType: 'json',
				beforeSend: function(jqXHR, settings) {
					//self.log("url of parent query: "+settings.url);
				},
				success: function(data, textStatus, jqXHR) {
					if(data) {
						result = data["results"][orgName]["printouts"];
						var newOrg = {
							"name" : result["Short Name"][0],
							"longName" : result["Long Name"][0],
							"website" : result["Website"][0],
							"img" : result["Logo Link"][0]
						};
						if(orgChartData)
							newOrg["children"] = [ orgChartData ];

						orgChartData = newOrg;

						if(result["Parent"][0]) {
							orgChartData = self.queryForParents(result["Parent"][0]["fulltext"], orgChartData);
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("failed query to Special:Ask for parent");
				}
			});
	
		}

		return orgChartData;
	}

	OrgChart.prototype.queryForChildren = function(orgObject) {
		var self = this;
		var children = [];

		var regExp = /1.2[0-9]/g;
		var mwVersion = mw.config.get("wgVersion").match(regExp)[0];

		if(mwVersion === "1.22") {

			jQuery.ajax({
				async: false,
				url: self.apiURL,
				data: {
					action : "askargs",
					conditions : "Parent::"+orgObject.name,
					printouts : "Short Name|Long Name|Website|Logo Link",
					format : "json"
				},
				success: function(data, textStatus, jqXHR) {
					if(data) {
						for(var childOrg in data["query"]["results"]) {
							result = data["query"]["results"][childOrg]["printouts"];
							//self.log(childOrg);
							newOrg = {
								"name" : result["Short Name"][0],
								"longName" : result["Long Name"][0],
								"website" : result["Website"][0],
								"img" : result["Logo Link"][0]
							}
							children.push(newOrg);
							newOrg["children"] = self.queryForChildren(newOrg);
							if(!newOrg["children"])
								delete newOrg["children"];
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("failed query to Special:Ask for children");
				}

			});

		}
		else {

			jQuery.ajax({
				async: false,
				url: 'http://gestalt-dev.mitre.org/bispr/index.php?title=Special:Ask&q=[[Parent::' + encodeURIComponent(orgObject.name) + ']]&po=?Short Name%0D%0A?Long Name%0D%0A?Website%0D%0A?Logo Link&p[format]=json',
				dataType: 'json',
				beforeSend: function(jqXHR, settings) {
					//self.log("url of children query: "+settings.url);
				},
				success: function(data, textStatus, jqXHR) {
					if(data) {
						for(var childOrg in data["results"]) {
							result = data["results"][childOrg]["printouts"];
							//self.log(childOrg);
							newOrg = {
								"name" : result["Short Name"][0],
								"longName" : result["Long Name"][0],
								"website" : result["Website"][0],
								"img" : result["Logo Link"][0]
							}
							children.push(newOrg);
							newOrg["children"] = self.queryForChildren(newOrg);
							if(!newOrg["children"])
								delete newOrg["children"];
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("failed query to Special:Ask for children");
				}
			});

		}

		return (children.length > 0 ? children : null);
	}

	OrgChart.prototype.queryForImage = function(imgName, imageElement) {
		var self = this;

		jQuery.ajax({
			url: self.apiURL,
			dataType: 'json',
			data: {
				"action" : "query",
				"titles" : "File:"+imgName,
				"prop" : "imageinfo",
				"iiprop" : "url",
				"format" : "json"
			},
			beforeSend: function(jqXHR, settings) {
				//self.log("url of image query: "+settings.url);
			},
			success: function(data, textStatus, jqXHR) {
				//self.log(data);
				pageKey = Object.keys(data["query"]["pages"])[0]; 
				//self.log(pageKey);
				imgURL = data["query"]["pages"][pageKey]["imageinfo"][0]["url"];
				//self.log(imgURL);

				imageElement.attr("xlink:href",imgURL);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("failed query for image");
			}
		});

	}

	OrgChart.prototype.drawChart = function(orgName, graphDiv, width, height, alignment) {
		var self = this;

		self.width = width;
		self.height = height;
		self.alignment = (alignment === "vertical" ? "vertical" : "horizontal");
//		self.alignment = "vertical";
	
		// set up the zoom behavior.
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
	  
		d3.select("#moveable").append("svg:g").attr("id", "links");
		d3.select("#moveable").append("svg:g").attr("id", "nodes");

		// initialize the tree.
		self.tree = d3.layout.tree()
		  .separation(function(a,b) {
			return a.parent == b.parent ? 1 : 3;
		  });
		
		if(self.alignment === "vertical")
			self.tree.nodeSize([self.nodeWidth, self.nodeHeight*4]);
		else
			self.tree.nodeSize([self.nodeWidth/4, self.nodeHeight*8]);

	    // change x and y (for the left to right tree)
		// or don't change them for the top-to-bottom tree
		var diagonal = d3.svg.diagonal()
		    .projection(function(d) { return self.alignment === "vertical" ? [d.x, d.y] : [d.y, d.x]; });
		
		// query for data.
		var currentOrg = self.assembleData(orgName);

		// set up the nodes (from the JSON data) and the links (from the nodes)
		// this is on the data side, not on the drawing side
		var nodes = self.tree.nodes(self.orgTreeData);
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
		.attr("transform", function(d) { return self.alignment === "vertical" ? "translate("+d.x+", "+d.y+")" : "translate("+d.y+", "+d.x+")"})
		.attr("class", "node");

		// draw stuff inside the node.
//		var padding = 2;

		allNodes.append("svg:rect")
		.attr("x", function(d) { return -1*self.nodeWidth/2; })
		.attr("y", function(d) { return -1*self.nodeHeight/2; })
		.attr("width", self.nodeWidth)
		.attr("height", self.nodeHeight)
		.attr("fill", function(d) { return d.focused ? "#2ecc71" : "white"; })
		.attr("stroke", "black")
		.attr("stroke-width", 1);

		allNodes.append("svg:image")
		.attr("width", this.imageWidth)
		.attr("height", this.imageWidth)
		.attr("x", -1*self.nodeWidth/2+this.imagePadding/2)
		.attr("y", -1*self.nodeHeight/2+this.imagePadding/2)
		.each(function(d) {
			self.queryForImage(d.img, d3.select(this));
		});		

		allNodes.append("svg:text")
		.attr("text-anchor", "start")
		.text(function(d) { return d.name; })
		.style("font-family", "Verdana")
		.style("font-size", "20pt")
		.style("font-weight", "bold")
		.attr("fill", function(d) { return d.focused ? "white" : "black"; })
		.attr("x", -1*self.nodeWidth/2 + self.imageWidth + self.imagePadding)
		.attr("y", -1*self.nodeHeight/4)
		.attr("dy", ".5em")	// see bost.ocks.org/mike/d3/workshop/#114
		.attr("id", "titleLabel");

		allNodes.append("svg:text")
		.attr("text-anchor", "start")
		.text(function(d) { return d.longName; })
		.style("font-family", "Verdana")
		.style("font-size", "11pt")
		.style("font-style", "italic")
		.attr("fill", function(d) { return d.focused ? "white" : "black"; })
		.attr("y", function(d) {
			var node = d3.select(this.parentNode);
			var topText = node.select("#titleLabel").node();
			var textbox = topText.getBBox();
			return -1*self.nodeHeight/4 + textbox.height;

		})
		.call(self.textWrap, 0.9*(this.nodeWidth-this.imageWidth), -1*self.nodeWidth/2 + self.imageWidth + self.imagePadding);

		// do some calculations to get proper zoom and translate

		var regExp = /-*[0-9]+(.[0-9]+)*/g;

		focusedNode = allNodes.filter(function(d,i) {
			return d.name === currentOrg.name;
		});

		transform = focusedNode.attr("transform");
		var focus_x = transform.match(regExp)[0];
		focus_x = +focus_x;
		var focus_y = transform.match(regExp)[1];
		focus_y = +focus_y;	// focus_y should typically be 0 because of the structure of this org chart (straight line through parent nodes)

		xVals = [];
		yVals = [];

		nodes = d3.selectAll(".node");
		nodes.each(function(d, i) {
		
			transform = d3.select(this).attr("transform");
			xVals.push(+transform.match(regExp)[0]);
			yVals.push(+transform.match(regExp)[1]);

		});

		xMax = d3.max(xVals);
		xMin = d3.min(xVals);
		yMax = d3.max(yVals);
		yMin = d3.min(yVals);
		centerX = (xMax - xMin)/2 + xMin;
		centerY = (yMax - yMin)/2 + yMin;

		self.log(xMax+", "+xMin+", "+yMax+", "+yMin);
		self.log("(centerX, centerY) = ("+centerX+", "+centerY+")");

		// do proper zoom and translate from calculation result
		
		var scaleFactor = 0.3;
		var translate_x, translate_y;

		if(self.alignment === "vertical") {
			var translate_x = self.width/2 - focus_x*scaleFactor;
			var translate_y = self.height/2 - focus_y*scaleFactor;
		}
		else {
			var translate_x = self.width/2 - focus_x*scaleFactor;
			var translate_y = self.height/2 + focus_y*scaleFactor;	
		}
		self.zoom.translate([translate_x, translate_y]);
		self.zoom.scale(scaleFactor);

		d3.select("#moveable").attr("transform", "translate("+translate_x+", "+translate_y+") scale("+scaleFactor+")");

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
		var self = this;	
		self.Zoompos = d3.event.scale;
		d3.select("#moveable").attr("transform", "translate("+d3.event.translate+")" + " scale("+self.Zoompos+")");
	}

	OrgChart.prototype.log = function(text) {
		if( (window['console'] !== undefined) )
			console.log( text );
	}
}
