window.OrgChart = function() {
	this.width = 0;
	this.height = 0;
	this.nodeWidth = 370;
	this.nodeHeight = 150;
	this.imagePadding = 20;
	this.imageWidth = 100-this.imagePadding;

	this.MIN_SCALE = .1;
	this.MAX_SCALE = 3;
	this.Zoompos = 1;

	this.tree = null;
	this.query = null;
	this.focusedNode = null;
	this.currentNode = null;
	this.SVG = null;
	this.error = false;// is this chart cyclical?
	this.errorLinks = new Array();
	this.Visited = new Array();// contains a list of Object names visited while building the chart
	this.nodes = null;
	this.links = null;
	this.orgChartData = null;// contains Object chart data built in method assembleData made global
	this.apiURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath") + "/api.php";
	this.localPath = mw.config.get("wgServer")+mw.config.get("wgScriptPath") + "/extensions/OrgChart/";
	OrgChart.prototype.assembleData = function(orgName) {

		var self = this;
		// gets all parents
		var orgChartData = self.queryForParents(orgName, null, Infinity);
		if(self.error){
			self.Visited = new Array();
			orgChartData = self.queryForParents(orgName, null, 2);	
			self.Visited.pop();
		}
		var currentOrg = orgChartData;
		// since there is a search on both the parent and children of the viewed Object
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

	OrgChart.prototype.queryForParents = function(orgName, orgChartData, depth) {
		var self = this;
		var regExp = /1.2[0-9]/g;
		var mwVersion = mw.config.get("wgVersion").match(regExp)[0];
		// check to see if orgName has been seen before 
		var seen = self.isVisited(orgName);
		// if it has not, then query the child
		if(depth != Infinity)
			depth--;
		if(!seen) {
			jQuery.ajax({
				async: false,
				url: self.apiURL,
				data: {
					action : "askargs", 
					conditions : orgName,
					printouts : "Parent|"+self.query.join('|'),
					format : "json"
				},
				success: function(data, textStatus, jqXHR) {
					if(data) {
						results = data["query"]["results"][orgName];
						var printouts = results["printouts"];
						// get position of Object name in visited list
						var pos = self.Visited.indexOf(orgName);
						if(pos>-1)
							// remove Object name from visited list
							self.Visited.splice(pos,1);
						// see if the names match
						var res_name = self.findValue(orgName,printouts);
						var case_match = (orgName != res_name);						
						// if not, use the orgName given, if so, use the results name
						var sname = case_match ? res_name : orgName;
						// has this Object been visited before?
						var seenAgain = self.isVisited(sname);
						// if not, build the node, set the children, and query for the parent
						if(!seenAgain && (depth > -1)){
							var newOrg = self.newNode(orgName, results);
							if(orgChartData)
								newOrg["children"] = [ orgChartData ];
							orgChartData = newOrg;
							if(printouts["Parent"][0]) {
								orgChartData = self.queryForParents(printouts["Parent"][0]["fulltext"], orgChartData, depth);
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
		else if(depth == Infinity){
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
				printouts : self.query.join('|'),
				format : "json"
			},
			success: function(data, textStatus, jqXHR) {
				if(data) {
					for(var child in data["query"]["results"]) {
						results = data["query"]["results"][child];
						// build the child node
						var newOrg = self.newNode(child, results);
						// check to see if the child node has been visited before
						var seen = self.isVisited(newOrg.name);
						// if the child Object has been seen before
						if(seen){
							// make the child and parent a broken link respectively
							self.errorLinks.push({'source':newOrg.name,'target':orgObject.name});
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

	OrgChart.prototype.newNode = function(name, data){
		var self = this;
		var template = self.template(self.localPath+'/config/template.html');
		var node = {
			"name" : name,
			"uid" : 'id_'+Math.round((new Date).getTime()/Math.random()),
			"category" : null,
			"options" : null,
			"details" : template,
			"properties" : self.strip(data["printouts"]),
			"wikipage" : data["fullurl"],
			"status" : "normal"
		}
		return node;
	}

	OrgChart.prototype.queryForImage = function(imgName, imageElement, isLocal) {
		var self = this;
		var imgURL = null;
		if(isLocal){
			imgURL = self.localPath+'/'+imgName;//imageElement.attr("xlink:href",imgName);
		}
		else{
			jQuery.ajax({
				url: self.apiURL,
				dataType: 'json',
				async: false,
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
//					imageElement.attr("xlink:href",imgURL);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("failed query for image");
				}
			});
		}
		return imgURL;
	}

	OrgChart.prototype.metaQuery = function(category, query, key){
		var self = this;
		var items = new Array();
		jQuery.ajax({
			url: self.apiURL,
			async: false,
			dataType: 'json',
			data:{
				"action" : "ask",
				"query" : 
					"[[Category:"+category+
					"]] [["+query+"::"+key+"]]",
				"format" : "json"
			},
			beforeSend: function(jqXHR, settings){

			}, 
			success: function(data, textStatus, jqXHR){
				for(var item in data["query"]["results"]){
					items.push(item);
				}
			},
			error: function(jqXHR, textStatus, errorThrown){

			}
		});
		return items;
	}

	OrgChart.prototype.template = function(path){
		var query = null;
		jQuery.ajax({
			url: path,
			async: false,
			dataType: 'text',
			success: function(data, textStatus, jqXHR){
				query = data;
			}
		});
		return query;
	}

	OrgChart.prototype.drawChart = function(orgName, graphDiv, width, height, alignment, color) {
		var self = this;
		self.width = width;
		self.height = height;
		self.alignment = (alignment === "vertical" ? "vertical" : "horizontal");
		$(".orgchart-graph-container").css("border", "1px solid "+color);
		var config = JSON.parse(self.template(self.localPath+'config/endpoints.json'));
		var tool_template = self.template(self.localPath+'config/tooltip.html');
		var options = {}, properties = [], metadata = [];
		for(var object in config){
			var param = config[object];
			if((param instanceof Array) && (param.length > 0)){
				if(typeof param[0] === 'string')
					properties = param;
				else
					metadata = param;
			}
			else
				options = param;
		}
		self.query = properties;

/*	    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d) {
  	    	return self.tooltip(d, tool_template); })
        .direction('e');*/

		// set up the zoom behavior.
		self.zoom = d3.behavior.zoom()
		   .on("zoom", function(){
		   		if(self.currentNode != null){
//		   			$('#'+self.currentNode.name).click();
		        }
		   		self.redrawZoom();		   			
		   	})
		   .scaleExtent([self.MIN_SCALE, self.MAX_SCALE]);
		// set up the SVG canvas.
		self.SVG = d3.select("#"+graphDiv)
		   .append("svg:svg")
		      .attr("width", self.width)
		      .attr("height", self.height)
		      .attr("pointer-events", "all")
		  .append("svg:g")
		      .call(self.zoom)

		      .on("dblclick.zoom", null);

		  self.SVG.append("svg:rect")
		     .attr("width", self.width)
		     .attr("height", self.height)
		     .attr("fill", "white");

		  self.SVG.append("svg:g")
		     .attr("id", "moveable");	
//	  	  self.SVG.call(tip);
		d3.select("#moveable").append("svg:g").attr("id", "links");
		d3.select("#moveable").append("svg:g").attr("id", "nodes");
		d3.select("#moveable").append("svg:g").attr("id", "markers");


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

		// if an error node has been set
		if(self.error && (self.errorLinks.length > 0)){	
			// display the following message at the top of the screen
			var msg = "Error: cyclical graph detected. Child Object cannot be the parent object of its own parent!";
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
			var forgedLink = self.errorLinks[ref];
			// get the source and target node objects by the findNode method
			var source = self.findNode(self.orgChartData, 'name', forgedLink.source);
			var target = self.findNode(self.orgChartData, 'name', forgedLink.target);
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
				if(badlink.target.y>badlink.source.y)
					var source = badlink.source, 					
					target = badlink.target;
				else
					var source = badlink.target,
						target = badlink.source;
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
			var allMarkers = self.SVG.select("#markers").selectAll("pathlink")
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

		var allLinks = self.SVG.select("#links").selectAll("pathlink")
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
		var allNodes = self.SVG.select("#nodes").selectAll(".node")
		.data(self.nodes)
		.enter().append("svg:g")
		.attr("transform", function(d) { 
			var align = self.alignment === "vertical" ? "translate("+d.x+", "+d.y+")" : "translate("+d.y+", "+d.x+")"
			return align;
		})
		.attr("class", "node")
		.attr("id", function(d){
			return d.uid;
		});

		allNodes.each(function(node){
			$.extend(node, self.helpers(node));
			$.extend(node, options);
			var ractive = new Ractive({
				el: '#'+node.uid,
				template: node.details,
				data: node
			});
		});

/*

		allNodes.append("svg:image")
		.attr("width", this.imageWidth)
		.attr("height", this.imageWidth)
		.attr("x", -1*self.nodeWidth/2+this.imagePadding/2)
		.attr("y", -1*self.nodeHeight/4)
		.each(function(d) {
			self.queryForImage(d.icon, d3.select(this),d.local);
		})
		.on("click", function(d) {
			if (d.name != 'Error'){
				// filter the url as the url can be surrounded by brackets.
				var url = self.urlFilter(d.website);
				// and open the website in a new tab
    	        window.open(url,'_blank');
	        }
		});

		allNodes.append("svg:image")
		.attr("width",this.imageWidth/3)
		.attr("height",this.imageWidth/3)
		.attr("x", self.nodeWidth/2-this.imagePadding*3/2)
		.attr("y", -1*this.imagePadding/2)
		.attr("id", function(d){return d.name;})
		.each(function(d){
			var num = 0;
			if(d.tooltip instanceof Array){
				num = d.tooltip.length;
			}
			else if(typeof d.tooltip == 'string'){
				num = 1;
			}
			if(num > 0){
				self.queryForImage(self.localPath+'person-avatar-blue.png', d3.select(this),true);
			}
			else{
				self.queryForImage(self.localPath+'person-avatar-grey.png', d3.select(this),true);
			}
		})f
        .on('mouseover', function(d){
        	self.currentNode = d;
        	tip.show(d);
        })
        .on('mouseout', function(d){
        	self.currentNode = null;
        	tip.hide(d);
        })
        .on('click', function(d){
        	tip.hide(d);
        	tip.show(d);
        });

		var list = allNodes.append("svg:text")
		.attr("text-anchor", "start")
		.text(function(d) {
			return d.description;
		})
		.style("font-family", "Verdana")
		.style("font-size", "11pt")
		.style("font-style", "italic")
		.attr("fill", function(d) { return d.focused ? "white" : "black"; })
		.attr("x", -1*self.nodeWidth/2 + self.imageWidth + self.imagePadding)
		.attr("y", function(d) {
			var node = d3.select(this.parentNode);
			var topText = node.select("#titleLabel").node();
			var textbox = topText.getBBox();
			return -1*self.nodeHeight/4 + textbox.height;

			// Issue exists in IE that constructs different heights for text. 
			// Selected arbitrary static number that seems to be setting a fixed text height for chrome and IE
//			return 7;
		})
		.attr("dy", ".5em")	// see bost.ocks.org/mike/d3/workshop/#114
		.call(self.textWrap, 0.9*(this.nodeWidth-(this.imageWidth*3/2)), -1*self.nodeWidth/2 + self.imageWidth + self.imagePadding);
*/

		// do some calculations to get proper zoom and translate
		var regExp = /-*[0-9]+(.[0-9]+)*/g;
		
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
		translate_y = 25;//translate_y - 115;
		self.zoom.scale(scaleFactor);
		self.zoom.translate([translate_x, translate_y]);
		// move top node closer to the top
		d3.select("#moveable").attr("transform", "translate("+translate_x+", "+translate_y+") scale("+scaleFactor+")");
	}
	// this method adapted from bl.ocks.org/mbostock/7555321
	OrgChart.prototype.textWrap = function(id,text, width, x) {
		return text;
/*	    var text = d3.select('#'+id),
	        words = text.text().split(/\s+/).reverse(),
	        word,
	        line = [],
	        lineNumber = 0,
	        lineHeight = 1.1, // ems
	        y = text.attr("y"),
			dy = parseFloat(element.attr("dy")) || 0,
	        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
	    while (word = words.pop()) {
	      line.push(word);
	      tspan.text(line.join(" "));
	      if (tspan.node().getComputedTextLength() > width) {
	        line.pop();
	        tspan.text(line.join(" "));
	        line = [word];
	        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
	      }
	    }*/
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

	OrgChart.prototype.isVisited = function(item){
		var self = this;
		var string = JSON.stringify(item);
		for(var index=0; index<self.Visited.length; index++){
			if(JSON.stringify(self.Visited[index]) === string){
				return true;
			}
		}
		self.Visited.push(item);
		return false;
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

	OrgChart.prototype.findValue = function(search, obj){
		var regex = new RegExp('^' + search + '$', 'i');
		for (var key in obj) {
		    if (obj.hasOwnProperty(key)) {
		    	for(item in obj[key]){
					if (regex.test(obj[key][item])) {
					    return obj[key][item];
					}
		    	}
		    }
		}
	}

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
			n.icon = self.localPath+"exclamation.png";
			n.local = true;
		}
	}

	OrgChart.prototype.helpers = function(node){
		var self = this;
		var helpers = {
			queryImage : function(image, element, local){
				return self.queryForImage(image, element, local);
			},
			textWrap : function(id,text){
				var desc = self.textWrap(id,text, 0.9*(self.nodeWidth-(self.imageWidth*3/2)), -1*self.nodeWidth/2 + self.imageWidth + self.imagePadding);
				return text;
			},
			add : function(vars){
				var val = 0;
				for(x in vars){
					val += parseInt(vars[x]);
				}
				return val;
			},
			size : function(obj){
				if(obj instanceof Array){
					return obj.length;
				}
				else if(typeof obj == 'string'){
					return 1;
				}
				else {
					return 0;
				}
			}
		}
		return helpers;
	}

	OrgChart.prototype.strip = function(obj){
		var self = this;
	    if (!obj || typeof obj !== "object") return null;
	    if (obj instanceof Array) {
	        return $.map(obj, function(value) {
	            return convertKeysToCamelCase(value);
	        });
	    }
	    var newObj = {};
	    $.each(obj, function(key, value) {
	        key = key.charAt(0).toLowerCase() + key.slice(1);
	        key = key.replace(/\W/g, '');
	        if((value instanceof Array) && value.length == 0)
	        	newObj[key] = null;
	        else if((value instanceof Array) && value.length == 1){
	        	newObj[key] = self.filter(value[0]);
	        }
	        else
		        newObj[key] = value;
	    });

	    return newObj;
	}

	// filter a url
	OrgChart.prototype.filter = function(text){
		var regex_list = [
			// url
			/((http|https):\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i,
			// email
			/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/i
		];
		var parse = text.toString().split(/\s+/);
		var res = null;
		parse.forEach(function(phrase){
			regex_list.forEach(function(exp){
				if(res == null)
					res = phrase.match(exp);
			});
		});
		if(res != null)
			return res[0];
		return text;
	}
}