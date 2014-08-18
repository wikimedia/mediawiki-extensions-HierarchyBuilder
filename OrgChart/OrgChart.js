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
	this.redundancy = false;
	this.focusedNode = null;
	this.errorNode = null;
	this.Visited = new Array();
	this.orgTreeData = null;
	this.Leaves = new Array();
	this.apiURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath") + "/api.php";
	this.imagePath = mw.config.get("wgServer")+mw.config.get("wgScriptPath") + "/extensions/OrgChart/";
	OrgChart.prototype.assembleData = function(orgName) {

		var self = this;
		self.redundancy = true;
		// gets all parents
		var orgChartData = self.queryForParents(orgName, null);
		var currentOrg = orgChartData;
		var index = self.Visited.indexOf(orgName);
		if (index > -1)
		    self.Visited.splice(index, 1);
		while(currentOrg["children"]) {
			currentOrg = currentOrg["children"][0];
		}
		// now currentOrg should point to the bottom org in the tree (also the originally passed-in org)
		currentOrg["status"] = "focused";
		self.focusedNode = self.redundancy ? orgName.toLowerCase() : orgName;
		var children = self.queryForChildren(currentOrg, false);
		currentOrg["children"] = children;
		if(!currentOrg["children"])
			delete currentOrg["children"];
		self.Visited = new Array();
		this.orgTreeData = orgChartData;
		this.orgTreeData = self.flag(orgChartData,false,false,false);
		return currentOrg;
	}

	OrgChart.prototype.queryForParents = function(orgName, orgChartData) {
		var self = this;
		var regExp = /1.2[0-9]/g;
		var mwVersion = mw.config.get("wgVersion").match(regExp)[0];
		var seen = self.isVisited(orgName);
		if(!seen) {
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
							"img" : result["Logo Link"][0],
							"wikiurl" : data["query"]["results"][orgName]["fullurl"],
							"status":"normal",
							"local":false
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
			self.Visited = new Array();//self.errorNode = orgName;
		}
		return orgChartData;
	}

	OrgChart.prototype.queryForChildren = function(orgObject, childOfRepeated) {		
		var self = this;
		var children = [];
		var regExp = /1.2[0-9]/g;
		var mwVersion = mw.config.get("wgVersion").match(regExp)[0];		
		// seen set to false if isVisited cannot find node in Visited array
		var seen = self.isVisited(orgObject.name);
		if(seen){
			self.errorNode = orgObject.name;
		}
		if(!seen){
			if(seen){childOfRepeated = !childOfRepeated;}
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
							var childName = result["Short Name"][0];
							var status = seen ? "error" : "normal";
							newOrg = {
								"name" : result["Short Name"][0],
								"longName" : result["Long Name"][0],
								"website" : result["Website"][0],
								"img" : result["Logo Link"][0],
								"wikiurl" : data["query"]["results"][childOrg]["fullurl"],
								"status":"normal",
								"local":false
							}

							children.push(newOrg);
							newOrg["children"] = self.queryForChildren(newOrg, childOfRepeated);
							if(!newOrg["children"])
								delete newOrg["children"];
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("failed query to Special:Ask for children");
				}
			});
			if(children.length==0){
				self.Leaves.push(orgObject.name);							
			}
		}
		return (children.length > 0 ? children : null);
	}

	OrgChart.prototype.queryForImage = function(imgName, imageElement, isLocal) {
		var self = this;		
		if(isLocal){
			imageElement.attr("xlink:href",imgName);
		}
		else{
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
	}

	OrgChart.prototype.drawChart = function(orgName, graphDiv, width, height, alignment, color) {
		var self = this;
		self.width = width;
		self.height = height;
		self.alignment = (alignment === "vertical" ? "vertical" : "horizontal");

		$(".orgchart-graph-container").css("border", "1px solid "+color);

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
		d3.select("#moveable").append("svg:g").attr("id", "markers")
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
		var markers = new Array();
		if(self.errorNode != null){
			for(var errorNodeIndex = 0; errorNodeIndex < nodes.length; errorNodeIndex++){
				if(nodes[errorNodeIndex].name == 'Error'){
					var source = nodes[0], 
					target = nodes[errorNodeIndex];
					var half_x_diff = (target.x - source.x)/2;
					var midy = ((source.y + target.y) /2);
			    	var coords = [{
			            x: target.x,
			            y: target.y + (self.nodeHeight)/2
			        },{
			            x: target.x,
			            y: target.y + (self.nodeHeight)
			        },{
			    	    x: target.x - half_x_diff/2,
			            y: target.y + (self.nodeHeight)
			        },{
			    		x:source.x + half_x_diff,
			    		y:midy
			    	},{
			            x: source.x + half_x_diff,
			            y: source.y + (-1*self.nodeHeight)
			        },{
			    	    x: source.x,
			            y: source.y + (-1*self.nodeHeight*3/2)
			        },{
			    	    x: source.x,
			            y: source.y + (-1*self.nodeHeight/2)
			        }];						        
					var errlink = {source: nodes[0],target: nodes[errorNodeIndex], curve: coords};
					errlink.type = 'disconnected';
					links.push(errlink);
					markers.push(errlink);
				}
			}

			var allMarkers = svg.select("#markers").selectAll("pathlink")
			.data(markers)
			.enter().append("svg:polyline")
			.attr("class","marker")
			.attr("points", function(d){
				if(!(typeof d.type === 'undefined')){
					var last = d.curve.length-1;
					var x = d.curve[last].x, y = d.curve[last].y;
					return x+','+(y+15)+' '+(x+20)+','+(y-40)+' '+(x-20)+','+(y-40);
				}
			});			

		}
		var curved = d3.svg.line()
		    .x(function(d) { return d.x; })
		    .y(function(d) { return d.y; })
	   		.interpolate("basis")
	    	.tension(0.75);
		var allLinks = svg.select("#links").selectAll("pathlink")
		.data(links)
		.enter().append("svg:path")
		.attr("class", "link")
     	.style("stroke-width", function(l){
	    	return (typeof l.type === 'undefined' ? 4 : 10);
     	})
    	.style("stroke", function(l){
	    	return (typeof l.type === 'undefined' ? 'black' : 'red');
	    })
		.style("stroke-dasharray", function(l){
	    	return (typeof l.type === 'undefined' ? ('none') : ('16, 12'));
	    })
		.attr("d", function(d){
			if(typeof d.type === 'undefined')
				return diagonal(d);				
			else{
			    return curved(d.curve);
			}
		});

		// do a data-join to draw things for all nodes
		var allNodes = svg.select("#nodes").selectAll(".node")
		.data(nodes)
		.enter().append("svg:g")
		.attr("transform", function(d) { 
			var align = self.alignment === "vertical" ? "translate("+d.x+", "+d.y+")" : "translate("+d.y+", "+d.x+")"
			return align;
		})
		.attr("class", "node");

		// draw stuff inside the node.
//		var padding = 2;
		allNodes.append("svg:rect")
		.attr("x", function(d) { return -1*self.nodeWidth/2; })
		.attr("y", function(d) { return -1*self.nodeHeight/2; })
		.attr("width", self.nodeWidth)
		.attr("height", self.nodeHeight)
		.attr("fill", function(d) {
			var color;
			// switch between status to determine
			// the color to fill the box
			switch(d.status){
				case "focused":
					color = "#2ecc71";
					break;
				case "error":
					color = "red";
					break;
				default:
					color = "white";
					break;
			}
			return color;
		})
		.attr("stroke", "black")
		.attr("stroke-width", 1)
		.on("click", function(d){
			if (d.name != 'Error'){
				var wiki_url = d.wikiurl;
	            window.open(wiki_url,'_blank'); 			
			}
		});

		allNodes.append("svg:image")
		.attr("width", this.imageWidth)
		.attr("height", this.imageWidth)
		.attr("x", -1*self.nodeWidth/2+this.imagePadding/2)
		.attr("y", -1*self.nodeHeight/2+this.imagePadding/2)
		.each(function(d) {
			self.queryForImage(d.img, d3.select(this),d.local);
		})
		.on("click", function(d) {
			if (d.name != 'Error'){
				// filter the url. Url surrounded by brackets
				var url = self.urlFilter(d.website);
    	        window.open(url,'_blank');
	        }
		});

		allNodes.append("svg:text")
		.attr("text-anchor", "start")
		.text(function(d) { return d.name; })
		.style("font-family", "Verdana")
		.style("font-size", "20pt")
		.style("font-weight", "bold")
		.attr("fill", function(d) { return d.focused ? "white" : "black"; })
		.attr("x", -1*self.nodeWidth/2 + self.imageWidth + self.imagePadding)
		.attr("y", (-1*self.nodeHeight/4))
		.attr("dy", ".5em")	// see bost.ocks.org/mike/d3/workshop/#114
		.attr("id", "titleLabel");

		var list = allNodes.append("svg:text")
		.attr("text-anchor", "start")
		.text(function(d) {
			return d.longName;
		})
		.style("font-family", "Verdana")
		.style("font-size", "11pt")
		.style("font-style", "italic")
		.attr("fill", function(d) { return d.focused ? "white" : "black"; })
		.attr("y", function(d) {
			// Issue exists in IE that constructs different heights for text. 
			// Selected arbitrary static number that seems to be setting a fixed text height for chrome and IE
			return 7;
		})
		.call(self.textWrap, 0.9*(this.nodeWidth-this.imageWidth), -1*self.nodeWidth/2 + self.imageWidth + self.imagePadding);
		// do some calculations to get proper zoom and translate

		var regExp = /-*[0-9]+(.[0-9]+)*/g;
		for(var list_index=0; list_index<list.length; list_index++){
			var item = list[list_index];
		}
		focusedNode = allNodes.filter(function(d,i) {
			return d.name === currentOrg.name;
		});

		transform = focusedNode.attr("transform");
		var coord = transform.match(regExp);
		// odd bug in IE 
		if (typeof coord === 'object' ){
			coord = JSON.stringify(coord).replace(/\(|\)|\"|\[|\]/g, "").split(/[.,\/ -]/);
		}
		var focus_x = coord[0];
		focus_x = +focus_x;
		var focus_y = coord[1];
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
		self.zoom.scale(scaleFactor);
		self.zoom.translate([translate_x, translate_y]);
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
		d3.select("#moveable").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}

	OrgChart.prototype.log = function(text) {
		if( (window['console'] !== undefined) )
			console.log( text );
	}	

	OrgChart.prototype.isVisited = function(orgName){
		var self = this;
		// get the index of the organization in the Visited list
		var index = self.Visited.indexOf(orgName);
		// if the organization does not exist in the Visited list
		if(index==-1){
			// add the organization to the Visited list
			// and return true
			self.Visited.push(orgName);
			return false;
		}
		// if the organization exists within the Visited list
		// return false
		return true;
	}

	OrgChart.prototype.flag = function(org,flagged, setFocused, repeated){
		var self = this;		
		// Has the current node and 
		if(repeated && (self.isVisited(org.name)) && (org.name == self.errorNode)){
			repeated = false;
			return self.errorMsg();
		}
		//
		else if(!repeated){
			repeated = self.isVisited(org.name);
		}
		// If 
		if(!flagged && (self.errorNode != null)){
			org["status"] = "error";
			flagged = !flagged;
			if(org.name == self.focusedNode)
				setFocused = !setFocused;
		}
		//
		else if((org.name==self.focusedNode)&&setFocused){
			org["status"] = "focused";
			setFocused = !setFocused;
		}
		// if children exist
		if("children" in org){
			// and the children are not null
			if(org["children"]!=null){
				// generate an array to store the children
				var children = new Array();
				// for all children
				for(var sibling = 0; sibling<org["children"].length; sibling++){
					// recursivly call flag to flag any issues in the tree
					child = self.flag(org["children"][sibling],flagged, setFocused, repeated);
					children.push(child);
				}
				// rebuilt the children of the parent
				org["children"] = children;				
			}
		}
		else if((org.name == self.errorNode)&&(typeof org.children == 'undefined')){
			return self.errorMsg();
		}
		return org;
	}

	OrgChart.prototype.errorMsg = function(parent){
		var self = this;
		var msg = {
				"name" : "Error",
				"longName" : "The "+self.errorNode+" organization is the parent orgnization of: "+self.orgTreeData.name ,
				"website" : "#",
				"img" : self.imagePath+"exclamation.png",
				"status":"error",
				"local":true				
			};
		return msg;
	}
	// filter a url
	OrgChart.prototype.urlFilter = function(url){
		// if the url is undefined, then it has not been set and
		// no link was provided, link to the current page via '#'
		if(typeof url == 'undefined'){
			return '#';
		}
		// a link was provided, but was formatted with surrounding brackets
		// i.e. [http://www.google.com DCGS Integrated Backbone]
		// strip both brackets and return the actual link
		url = url.replace('[','');
		url = url.replace(']','');
		return url.split(' ')[0];
	}
}
