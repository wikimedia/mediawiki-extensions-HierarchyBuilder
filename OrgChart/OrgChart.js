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
	this.focusedNode = null;
	this.error = false;// is this chart cyclical?
	this.errorLinks = new Array();
	this.Visited = new Array();// contains a list of organization names visited while building the chart
	this.orgTreeData = null;// contains organization tree data built in method drawChart made global
	this.nodes = null;
	this.links = null;
	this.orgChartData = null;// contains organization chart data built in method assembleData made global
	this.apiURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath") + "/api.php";
	this.imagePath = mw.config.get("wgServer")+mw.config.get("wgScriptPath") + "/extensions/OrgChart/";
	OrgChart.prototype.assembleData = function(orgName) {

		var self = this;
		// gets all parents
		var orgChartData = self.queryForParents(orgName, null);
		var currentOrg = orgChartData;
		// since there is a search on both the parent and children of the viewed organization
		// it will appear in the Visited array twice. Find the name in the array and remove it
		var index = self.Visited.indexOf(orgName);
		if (index > -1)
		    self.Visited.splice(index, 1);
		while(currentOrg["children"]) {
			currentOrg = currentOrg["children"][0];
		}
		// set the focused node in two places for assurance
		currentOrg["status"] = "focused";
		self.focusedNode = orgName;
		// query children
		var children = self.queryForChildren(currentOrg);
		currentOrg["children"] = children;
		if(!currentOrg["children"])
			delete currentOrg["children"];
		// make orgChartData global
		self.orgChartData = orgChartData;
		return currentOrg;
	}

	OrgChart.prototype.queryForParents = function(orgName, orgChartData) {
		var self = this;
		var regExp = /1.2[0-9]/g;
		var mwVersion = mw.config.get("wgVersion").match(regExp)[0];
		// check to see if orgName has been seen before 
		var seen = self.isVisited(orgName);
		// if it has not, then query the child
		if(!seen) {
			jQuery.ajax({
				async: false,
				url: self.apiURL,
				data: {
					action : "askargs", 
					conditions : orgName,
					printouts : "Parent|Short Name|Long Name|Website|Logo Link|People",
					format : "json"
				},
				success: function(data, textStatus, jqXHR) {
					if(data) {
						result = data["query"]["results"][orgName]["printouts"];
						// get position of organization name in visited list
						var pos = self.Visited.indexOf(orgName);
						if(pos>-1)
							// remove organization name from visited list
							self.Visited.splice(pos,1);
						// see if the names match
						var case_match = (orgName != result["Short Name"][0]);
						// if not, use the orgName given, if so, use the results name
						var sname = case_match ? result["Short Name"][0] : orgName;
						// has this organization been visited before?
						var seenAgain = self.isVisited(sname);
						// if not, build the node, set the children, and query for the parent
						if(!seenAgain){
							var newOrg = self.newNode(result["Short Name"][0], orgName, data);
							self.log('people '+newOrg.people.toString());
							if(orgChartData)							
								newOrg["children"] = [ orgChartData ];
							orgChartData = newOrg;
							if(result["Parent"][0]) {
								orgChartData = self.queryForParents(result["Parent"][0]["fulltext"], orgChartData);
							}
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("failed query to Special:Ask for parent");
				}
			});

		}
		// if orgName has been seen before, then a recursive orgChart has been discovered
		else {
			// set error as true
			self.error = true;
		}
		return orgChartData;
	}

	OrgChart.prototype.queryForChildren = function(orgObject) {		
		var self = this;
		var children = [];
		var regExp = /1.2[0-9]/g;
		var mwVersion = mw.config.get("wgVersion").match(regExp)[0];		
		// seen set to false if isVisited cannot find node in Visited array
		jQuery.ajax({
			async: false,
			url: self.apiURL,
			data: {
				action : "askargs",
				conditions : "Parent::"+orgObject.name,
				printouts : "Short Name|Long Name|Website|Logo Link|People",
				format : "json"
			},
			success: function(data, textStatus, jqXHR) {
				if(data) {
					for(var childOrg in data["query"]["results"]) {
						result = data["query"]["results"][childOrg]["printouts"];
						// build the child node
						var newOrg = self.newNode(result["Short Name"][0], childOrg, data);
						self.log('people '+newOrg.people.toString());
						// check to see if the child node has been visited before
						var seen = self.isVisited(newOrg.name);
						// if the child organization has been seen before
						if(seen){
							// make the child and parent a broken link respectively
							self.brokenLink(newOrg, orgObject);
							// a cyclical graph has been found
							self.error = true;
						}
						else{
							// add the child
							children.push(newOrg);
							// and query the child for children
							newOrg["children"] = self.queryForChildren(newOrg);
							if(!newOrg["children"])
								delete newOrg["children"];								
						}
					}
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("failed query to Special:Ask for children");
			}
		});
		return (children.length > 0 ? children : null);
	}

	OrgChart.prototype.newNode = function(name, displayName, data){
		var result = data["query"]["results"][displayName]["printouts"];
		return {
			"name" : name,
			"displayName": displayName,			
			"longName" : result["Long Name"][0],
			"people" : result["People"],
			"website" : result["Website"][0],
			"img" : result["Logo Link"][0],
			"wikiurl" : data["query"]["results"][displayName]["fullurl"],
			"status":"normal",
			"local":false
		}
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
		// set up the nodes (from the JSON data) and the links (from the nodes)
		// this is on the data side, not on the drawing side

		var currentOrg = self.assembleData(orgName);
//		self.spanTree(currentOrg, {'maxBreadth':0, 'maxDepth':0});

		// if an error node has been set
		if(self.error && (self.errorLinks.length > 0)){	
			// display the following message at the top of the screen
			var msg = "Error: cyclical graph detected. Child organization cannot own parent organization!";
			$("#error-panel").css("visibility", "visible");
			$("#error-panel").html("<p>"+msg+"</p>");
		}

		self.nodes = self.tree.nodes(self.orgChartData);
		self.links = self.tree.links(self.nodes);
		var markers = new Array();
		var forgedLinks = new Array();
		// go through all erro links, if none exist, then this step will be skipped
		for(var ref=0; ref<self.errorLinks.length; ref++){
			// get the link at the reference point
			var markAsErrorgedlink = self.errorLinks[ref];
			// get the source and target node objects by the findNode method
			var source = self.findNode(self.orgChartData, 'name', markAsErrorgedlink.source);
			var target = self.findNode(self.orgChartData, 'name', markAsErrorgedlink.target);
			// mark the source and targets as error Nodes and add the nodes as a link object
			// if both the source and target are not null
			if((source != null) && (target != null))
				self.markAsError(source);
				self.markAsError(target);
				forgedLinks.push({'source':source,'target':target});
		}

		// query for data.
		if(self.error){
			for(var errIndex = 0; errIndex < forgedLinks.length; errIndex++){
				// get the link
				var badlink = forgedLinks[errIndex];
				// and the source/target respectively 
				var source = badlink.source, 					
				target = badlink.target;
				// NOTE* The source node is always beneath the target on the tree.
				// So the line starts from the source (bottom of the graph) to the target (top of the graph)
				var directly_under = (target.x == source.x);// is the source directly under the target?
				// calculate a value to determine center of x values, or how far out must the curve bend
				var half_x_diff = directly_under ? (self.nodeWidth) : (target.x - source.x)/2;
				// calculate midpoint between y values of source and target
				var midy = ((source.y + target.y) /2);
				// top of the target node
				var coords = [{
		            x: target.x,
		            y: target.y + (self.nodeHeight)/2
		        },{// above the target node by half the node height
		            x: target.x,
		            y: target.y + (self.nodeHeight)
		        },{// center point between two nodes or bend curve outward
		    	    x: target.x + half_x_diff/2,
		            y: target.y + (self.nodeHeight)
		        },{// central node
		    		x:source.x + 2*half_x_diff,
		    		y:midy
		    	},{// centered x and below source node by half of node height
		            x: source.x + half_x_diff,
		            y: source.y + (-1*self.nodeHeight)
		        },{// below source node by node height
		    	    x: source.x,
		            y: source.y + (-1*self.nodeHeight*3/2)
		        },{// bottom of source node
		    	    x: source.x,
		            y: source.y + (-1*self.nodeHeight/2)
		        }];						        
		        // build actual link using the source, target, and seven point coordinates
				var errlink = {'source': source, 'target': target, 'curve': coords};
				// set the type to be disconnected, all normal links are 'undefined'
				errlink.type = 'disconnected';
				// add the broken link to both the links and to the markers
				self.links.push(errlink);
				markers.push(errlink);
			}
			// construct all markers
			var allMarkers = svg.select("#markers").selectAll("pathlink")
			.data(markers)
			.enter().append("svg:polyline")
			.attr("class","marker")
			.attr("points", function(d){
				// make sure this is a broke link
				if(!(typeof d.type === 'undefined')){
					var last = d.curve.length-1;
					// get the x and y coordinates
					var x = d.curve[last].x, y = d.curve[last].y;
					// construct an upside down triangle using raw svg points
					return x+','+(y+15)+' '+(x+20)+','+(y-40)+' '+(x-20)+','+(y-40);
				}
			});			

		}
		// set the standard calculations for a curved line
		var curved = d3.svg.line()
		    .x(function(d) { return d.x; })
		    .y(function(d) { return d.y; })
	   		.interpolate("basis")// uses a basis type line - see d3js.org
	    	.tension(0.75);// arbitrarily chosen tension
		var allLinks = svg.select("#links").selectAll("pathlink")
		.data(self.links)
		.enter().append("svg:path")
		.attr("class", "link")
		// for the next three styles and one attribute, the basis is on
		// if the link type is undefined. If it is, the link is normal and should be
		// black with no dashes, a width of 4, and a standard diagonal curve.
		// If a type has been defined, then it is an error or broken link symbolizing
		// a cyclical path that should not exist in an ordinary orgChart and thus will
		// be a red, curved dash array, with a line thickness of 10.
     	.style("stroke-width", function(l){
	    	return (typeof l.type === 'undefined' ? 4 : 10);
     	})
    	.style("stroke", function(l){
	    	return (typeof l.type === 'undefined' ? 'black' : 'red');
	    })
		.style("stroke-dasharray", function(l){
	    	return (typeof l.type === 'undefined' ? ('none') : ('16, 12'));
	    })
		.attr("d", function(l){
			if(typeof l.type === 'undefined')
				return diagonal(l);
			else{
			    return curved(l.curve);
			}
		});

		// do a data-join to draw things for all nodes
		var allNodes = svg.select("#nodes").selectAll(".node")
		.data(self.nodes)
		.enter().append("svg:g")
		.attr("transform", function(d) { 
			var align = self.alignment === "vertical" ? "translate("+d.x+", "+d.y+")" : "translate("+d.y+", "+d.x+")"
			return align;
		})
		.attr("class", "node");

		// draw stuff inside the node.
		allNodes.append("svg:rect")
		.attr("x", function(d) { return -1*self.nodeWidth/2; })
		.attr("y", function(d) { return -1*self.nodeHeight/2; })
		.attr("width", self.nodeWidth)
		.attr("height", self.nodeHeight)
		.attr("fill", function(d) {
			var color;
			// switch background color according to status
			switch(d.status){
				case "focused":
					// light green
					color = "#2ecc71";
					break;
				case "error":
					// light orange
					color = "#FF5333";
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
			// if the background is clicked
			var wiki_url = d.wikiurl;
			// open the wiki page of the organization in a new tab
            window.open(wiki_url,'_blank'); 			
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
				// filter the url as the url can be surrounded by brackets.
				var url = self.urlFilter(d.website);
				// and open the website in a new tab
    	        window.open(url,'_blank');
	        }
		});

		allNodes.append("svg:text")
		.attr("text-anchor", "start")
		.text(function(d) { 
			return d.displayName; 
		})
		.style("font-family", "Verdana")
		.style("font-size", function(d){
			// if the status type is listed as error, make the font 
			// size larger then the rest of the organization names
			return (d.status == 'error' ? "24pt" : "20pt");
		})
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
		// odd bug in IE where transform is an object instead of a string
		// if the type of the object coord is indeed an object
		if (typeof coord === 'object' ){
			// convert the object to a json string, remove all uneccessary strings, and split the string into an array
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
		if(index<0){
			// add the organization to the Visited list
			// and return false
			self.Visited.push(orgName);
			return false;
		}
		// if the organization exists within the Visited list
		// return true
		return true;
	}

	OrgChart.prototype.findNode = function(org, property, value) {
		// loop through store
		var self = this;
		// go through all nodes
		for (var i = 0; i < self.nodes.length; i++) {
			// if the node is not undefined and matches property and value
			// return node
			if (typeof self.nodes[i][property] !== 'undefined' &&
				self.nodes[i][property] === value) {
				return self.nodes[i];
			}
		}
		// if the node cannot be found, return null
		return null;
	}
/*
	OrgChart.prototype.spanTree = function(org, stats){
		var self = this;
		if("children" in org){
			if(org["children"] != null){				
				for(var sibling = 0; sibling<org["children"].length; sibling++){
					var childStats = self.spanTree(org, stats);
//					stats.maxBreadth = Math.max(5, 10);
//					stats.maxDepth = Math.max(5, 10);
				}
			}
		}
		return stats;
	}
*/
	OrgChart.prototype.markAsError = function(node){
		var self = this;
		// get the index of the node in the array of nodes
		var index = self.nodes.indexOf(node);
		// if it exists in the nodes array and the status is normal
		if((index > -1) && (node.status == 'normal')){
			var n = self.nodes[index];
			// set the status as error
			n.status = 'error';
			// and the icon as the exclamation point
			n.img = self.imagePath+"exclamation.png";
			n.local = true;
		}
	}

	OrgChart.prototype.brokenLink = function(org, parent){
		var self = this;
		self.errorLinks.push({'source':org.name,'target':parent.name});
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
