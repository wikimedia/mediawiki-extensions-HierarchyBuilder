/*
 * Copyright (c) 2013 The MITRE Corporation
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

window.VikiJS = {

	WIKI_PAGE_TYPE: 0,
	EXTERNAL_PAGE_TYPE: 1,

	MAX_BAR_WIDTH: 60,
	BAR_HEIGHT: 6,
	SELECTED_IMAGE_DIMENSION: 30,
	UNSELECTED_IMAGE_DIMENSION: 20,

	MIN_SCALE: .3,
	MAX_SCALE: 4,
	LINK_OPACITY: 0.2,

	// NOTE: all these colors are from flatuicolors.com
	// amethyst: #9b59b6
	// peter river: #3498db
	// emerald: #2ecc71
	// sunflower: #f1c40f
	// Cindy's original light blue: #23a4ff
	INCOMING_LINK_COLOR: "#3498db",
	OUTGOING_LINK_COLOR: "#f1c40f",

	GraphDiv: null,
	DetailsDiv: null,
	SelectedNode: null,
	Nodes: new Array(),
	Links: new Array(),
	LinkMap: new Array(),
	Force: null,
	LinkSelection: null,
	NodeSelection: null,
	ImagePath: null,
	Zoompos: 1, // to store values for zoom scale
	serverURL: null,
	myApiURL: mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/api.php",
	myLogoURL: null,
	searchableWikis: new Array(),
	drawGraph: function(pageTitles, graphDiv, detailsDiv, imagePath, initialWidth, initialHeight) {

		VikiJS.serverURL = mw.config.get("wgServer");
		pageTitles = eval("("+pageTitles+")");
		
		if(pageTitles === null) {
			alert("You must supply a page title.");
			return;
		}

		// initialize graph settings.

		VikiJS.GraphDiv = graphDiv;
		VikiJS.DetailsDiv = detailsDiv;
		VikiJS.ImagePath = imagePath;

		VikiJS.INITIAL_HEIGHT = initialHeight;
		VikiJS.INITIAL_WIDTH = initialWidth;
		VikiJS.height = VikiJS.INITIAL_HEIGHT;
		VikiJS.width = VikiJS.INITIAL_WIDTH;
		
		// to set the widths of the details divider and the horizontal zoom slider
		// the margin is a value used to accumulate all maring, padding and other
		// space that the .detail-panel class uses.
		var margin = 10;
		// the details divider will get 3/5 of the space
		$("#"+VikiJS.DetailsDiv).width((VikiJS.width - margin)* 3/5);
		// the slider will get 2/5 of the space
		$("#vikijs-zoom-slider").width((VikiJS.width - margin) * 2/5);
		// set the entire detail-panel to the width of the input minus the size of
		// the paddings, margins and other values to align with the graph.
		$(".vikijs-detail-panel").width(VikiJS.width - margin);
		// create a new zoom slider
		var zoom_slider = $("#vikijs-zoom-slider").slider(
		{
		  orientation: "horizontal",//make the slider horizontal
		  min: VikiJS.MIN_SCALE , // set the lowest value
		  max: VikiJS.MAX_SCALE, // set the highest value
		  step: .001, // set the value for each individual increment
		  value: 1, // set the starting value
		  slide: function( event, ui ) {
			// set the zoom scale equal to the current value of the slider
			// which is the current position
		        VikiJS.Zoompos = ui.value;
			// call the slide function to zoom/pan using the slider
		        VikiJS.slide();
		  }
		});

		initializeGraph();

		// initialize the list of searchable wikis,
		// get this wiki's own logo URL,
		// and do initial graph population.

		jQuery.ajax({
			url: VikiJS.myApiURL,
			dataType: 'json',
			data: {
				action: 'getSearchableWikis',
				format: 'json'
			},
			success: function(data, textStatus, jqXHR) {
				VikiJS.parseSearchableWikisList(data, pageTitles);
				jQuery.ajax({

					url: VikiJS.myApiURL,
					dataType: 'json',
					data: {
						action: 'getSiteLogo',
						format: 'json'
					},
					success: function(data, textStatus, jqXHR) {

						VikiJS.myLogoURL = mw.config.get("wgServer") + data["getSiteLogo"];
						self.log("myLogoURL = "+VikiJS.myLogoURL);
						// do initial graph population
						for(var i = 0; i < pageTitles.length; i++)
							VikiJS.addWikiNode(pageTitles[i], VikiJS.myApiURL, null, VikiJS.myLogoURL);

						for(var i = 0; i < pageTitles.length; i++)
							VikiJS.elaborateNode(VikiJS.Nodes[i]);

						VikiJS.Force.nodes(VikiJS.Nodes);
						VikiJS.Force.links(VikiJS.Links);

						VikiJS.redraw(true);

					},
					error: function(jqXHR, textStatus, errorThrown) {
						alert("Unable to fetch list of wikis.");
					}


				});

			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Unable to fetch list of wikis.");
			}
		});

		function initializeGraph() {
			var padding = 20;

			VikiJS.zoom = d3.behavior.zoom()
			   .on("zoom", VikiJS.redrawZoom)
			   .scaleExtent([VikiJS.MIN_SCALE, VikiJS.MAX_SCALE]);
			
			var svg = d3.select("#" + VikiJS.GraphDiv)
			   .append("svg:svg")
			      .attr("width", VikiJS.width)
			      .attr("height", VikiJS.height)
			      .attr("pointer-events", "all")
			   .append("svg:g")
			      .call(VikiJS.zoom)
			      .on("dblclick.zoom", null)
			VikiJS.SVG = svg
			svg.append("svg:rect")
			   .attr("width", VikiJS.width)
			   .attr("height", VikiJS.height)
			   .attr("fill", "white");

			svg.append("svg:g")
			   .attr("id", "moveable");

			defs = svg.append("defs");

			defs.append("marker")
			   .attr("id", "arrowHead")
			   .attr("viewBox", "0 -8 20 20")
			   .attr("refX", 18)
			   .attr("refY", 0)
			   .attr("markerWidth", 12)
			   .attr("markerHeight", 12)
			   .attr("markerUnits", "userSpaceOnUse")
			   .attr("orient", "auto")
			   .attr("fill", VikiJS.OUTGOING_LINK_COLOR)
			   .attr("stroke-width", "2")
			.append("path")
			   .attr("d", "M0,-8L20,0L0,8");

			defs.append("marker")
			   .attr("id", "arrowHead2")
			   .attr("viewBox", "0 -8 20 20")
			   .attr("refX", 18)
			   .attr("refY", 0)
			   .attr("markerWidth", 12)
			   .attr("markerHeight", 12)
			   .attr("markerUnits", "userSpaceOnUse")
			   .attr("orient", "auto")
			   .attr("fill", VikiJS.INCOMING_LINK_COLOR)
			   .attr("stroke-width", "2")
			.append("path")
			   .attr("d", "M0,-8L20,0L0,8");

			defs.append("marker")
			   .attr("id", "arrowHead3")
			   .attr("viewBox", "0 -8 20 20")
			   .attr("refX", 18)
			   .attr("refY", 0)
			   .attr("markerWidth", 12)
			   .attr("markerHeight", 12)
			   .attr("markerUnits", "userSpaceOnUse")
			   .attr("orient", "auto")
			   .attr("fill", "black")
			   .attr("stroke-width", "2")
			.append("path")
			   .attr("d", "M0,-8L20,0L0,8");

			d3.select("#moveable").append("svg:g").attr("id", "links");
			d3.select("#moveable").append("svg:g").attr("id", "nodes");
				
			VikiJS.Force = d3.layout.force();
			VikiJS.Force.gravity(0.4)
			//VikiJS.Force.linkStrength(1.25)
			VikiJS.Force.linkStrength(0.2);
			// link distance was made dynamic in respect to the increase in charge. As the nodes form a cluster, the edges are less likely to cross.
			// The edge between to clusters is stretched from the polarity between the adjacent clusters.
			VikiJS.Force.linkDistance(
				function(n){
					// if the source and target has been elaborated, set the variable child to true
					var child = (n.source.elaborated && n.target.elaborated);
					if(child){return 500;}// if this node is the parent or the center of a cluster of nodes
					else{return 75;}// if this node is the child or the outer edge of a cluster of nodes

				}
			)
			// Original value of charge was -3000. Increasing the charge maximizes polarity between nodes causing each node to repel.
			// This will decrease edge crossings for the nodes. 	
			VikiJS.Force.charge(-7500)
			VikiJS.Force.friction(.675)
			VikiJS.Force.size([VikiJS.width, VikiJS.height])
			VikiJS.Force.on("tick", tick);

			VikiJS.LinkSelection =
				svg.select("#links").selectAll(".link");

			VikiJS.NodeSelection =
				svg.select("#nodes").selectAll(".node");
	
			function tick() {

				var boundaryRadius = 12;

				VikiJS.NodeSelection.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});

				// rather than return the (x,y) of the source and target node directly,
				// which would cause the links to stab through the node text,
				// we create an imaginary parabola around the node (a, b = node width, height)
				// and make the links connect to points on this parabola which would extend
				// the line into the center of the node, if possible.
				// (x,y) depend on (r, theta) and because this is an ellipse, r is a function of
				// a, b, and theta.

				VikiJS.LinkSelection.attr("x1", function(d) {

					var dy = d.target.y - d.source.y;
					var dx = d.target.x - d.source.x;
					var angle = Math.atan2(dy, dx);
					var width = d.source.nodeWidth;
					var height = d.source.nodeHeight;

					var a = width/2;
					var b = height/2;

					var r = a*b / Math.sqrt( (b*b*Math.cos(angle)*Math.cos(angle)) + (a*a*Math.sin(angle)*Math.sin(angle)) );

					return d.source.x + r*Math.cos(angle);
					//return d.source.x + (width/2)*Math.cos(angle);
					//return d.source.x + boundaryRadius*Math.cos(angle);
				});
				VikiJS.LinkSelection.attr("y1", function(d) {

					var dy = d.target.y - d.source.y;
					var dx = d.target.x - d.source.x;
					var angle = Math.atan2(dy, dx);
					var width = d.source.nodeWidth;
					var height = d.source.nodeHeight;

					var a = width/2;
					var b = height/2;

					var r = a*b / Math.sqrt( (b*b*Math.cos(angle)*Math.cos(angle)) + (a*a*Math.sin(angle)*Math.sin(angle)) );

					return d.source.y + r*Math.sin(angle);
					//return d.source.y + (height/2)*Math.sin(angle);
					//return d.source.y + boundaryRadius*Math.sin(angle);
				});
				VikiJS.LinkSelection.attr("x2", function(d) {

					var dy = d.target.y - d.source.y;
					var dx = d.target.x - d.source.x;
					var angle = Math.atan2(dy, dx);
					var width = d.target.nodeWidth;
					var height = d.target.nodeHeight;

					var a = width/2;
					var b = height/2;

					var r = a*b / Math.sqrt( (b*b*Math.cos(Math.PI+angle)*Math.cos(Math.PI+angle)) + (a*a*Math.sin(Math.PI+angle)*Math.sin(Math.PI+angle)) );

					return d.target.x + r*Math.cos(Math.PI+angle);
					//return d.target.x + (width/2)*Math.cos(Math.PI + angle);
					//return d.target.x + boundaryRadius*Math.cos(Math.PI + angle);
				});
				VikiJS.LinkSelection.attr("y2", function(d) {

					var dy = d.target.y - d.source.y;
					var dx = d.target.x - d.source.x;
					var angle = Math.atan2(dy, dx);
					var width = d.target.nodeWidth;
					var height = d.target.nodeHeight;

					var a = width/2;
					var b = height/2;

					var r = a*b / Math.sqrt( (b*b*Math.cos(Math.PI+angle)*Math.cos(Math.PI+angle)) + (a*a*Math.sin(Math.PI+angle)*Math.sin(Math.PI+angle)) );
					return d.target.y + r*Math.sin(Math.PI + angle);
					return d.target.y + (height/2)*Math.sin(Math.PI + angle);
					//return d.target.y + boundaryRadius*Math.sin(Math.PI + angle);
				});
			}
		}
	},

	parseSearchableWikisList: function(data, pageTitles) {
		self.log("Retrieved searchableWikisList");
		allWikis = data["getSearchableWikis"]["results"];
		$(document).ready(function() {
			for(var i in allWikis) {
				var title = allWikis[i]["fulltext"];
				var wiki = {
						wikiTitle: title,
						apiURL: allWikis[i]["printouts"]["Wiki API URL"][0],
						contentURL: allWikis[i]["printouts"]["Wiki Content URL"][0],
						logoURL: allWikis[i]["printouts"]["Small Wiki Logo"][0]
					   };
				VikiJS.searchableWikis.push(wiki);

			}
		});
		self.log("searchableWikis.length = "+VikiJS.searchableWikis.length);

	},

	slide: function(){		
	// set target_zoom to the logged zoom position
        target_zoom = VikiJS.Zoompos,
	// calculate the center of the graph by dividing the width and height by two
        center = [VikiJS.width / 2, VikiJS.height / 2],
	// set the scale extent
        extent = VikiJS.zoom.scaleExtent(),
	// and the translation vectors
        translate = VikiJS.zoom.translate(),
        translation = [],
        l = [],
	// setup a json object with the translation x and y values with the zoom scale
        view = {x: translate[0], y: translate[1], k: VikiJS.zoom.scale()};

	    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

	    translation = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
	    view.k = target_zoom;
	    // generate the translation calculations by multiplying a transition value with the zoom value
	    // and adding the appropriate view value
	    l = [translation[0] * view.k + view.x, translation[1] * view.k + view.y];
	    // set the view x and y values ( the pan x and pan y) equal to the center values
	    // minus the transition calculations
	    view.x += center[0] - l[0];
	    view.y += center[1] - l[1];
	    // now that the values have been calculated, call the controls and zoom
	    VikiJS.interpolateZoom([view.x, view.y], view.k);

	},

	interpolateZoom: function(translate, scale) {
	    var self = this;
	    // zoom with the set scale and translation values
	    return d3.transition().duration(50).tween("zoom", function () {
	        var iTranslate = d3.interpolate(VikiJS.zoom.translate(), translate),
	            iScale = d3.interpolate(VikiJS.zoom.scale(), scale);
	        return function (t) {
	            VikiJS.zoom
	                .scale(iScale(t))
	                .translate(iTranslate(t));
	            VikiJS.zoomed();
	        };
	    });
	},

	zoomed: function() {
	// access the element movable and move to the scale and translation vectors
	d3.select("#moveable").attr("transform",
	        "translate(" + VikiJS.zoom.translate() + ")" +
	        "scale(" + VikiJS.zoom.scale() + ")"
	    );
	},

	redrawZoom: function() {		
		VikiJS.Zoompos = d3.event.scale;
		d3.select("#moveable").attr("transform", "translate("+d3.event.translate+")" + " scale("+VikiJS.Zoompos+")");
		// if you scroll via a scrollwheel inside the graph, then set the slider to the current scale 
		$("#vikijs-zoom-slider").slider("value",VikiJS.Zoompos);
	},

	redraw: function(restartGraph) {
	
		VikiJS.LinkSelection =
			VikiJS.LinkSelection.data(VikiJS.Links);

		var newLinks = VikiJS.LinkSelection.enter().append("svg:line");
		newLinks.attr("class", "link");
		VikiJS.LinkSelection.style("stroke-width", function(d) {
			if (typeof d.source.index !== 'undefined') {
				return d.source.index == VikiJS.SelectedNode ||
					d.target.index == VikiJS.SelectedNode ? 2 : 1;
			} else {
				return d.source == VikiJS.SelectedNode ||
					d.target == VikiJS.SelectedNode ? 2 : 1;
			}
		});
		VikiJS.LinkSelection.style("opacity", function(d) {
			if (typeof d.source.index !== 'undefined') {
				return d.source.index == VikiJS.SelectedNode ||
					d.target.index == VikiJS.SelectedNode ? 1 : VikiJS.LINK_OPACITY;
			} else {
				return d.source == VikiJS.SelectedNode ||
					d.target == VikiJS.SelectedNode ? 1 : VikiJS.LINK_OPACITY;
			}
		});
		VikiJS.LinkSelection.style("stroke", function(d) {
			if(typeof d.source.index !== 'undefined') {
				if(d.source.index == VikiJS.SelectedNode)
					return VikiJS.OUTGOING_LINK_COLOR;
				else if(d.target.index == VikiJS.SelectedNode)
					return VikiJS.INCOMING_LINK_COLOR;
				else return "black";
			}
			else {
				if(d.source == VikiJS.SelectedNode)
					return VikiJS.OUTGOING_LINK_COLOR;
				else if(d.target == VikiJS.SelectedNode)
					return VikiJS.INCOMING_LINK_COLOR;
				else return "black";
			}
		});
		VikiJS.LinkSelection.attr("marker-end", function(d) {
			if(typeof d.source.index !== 'undefined') {
				if(d.source.index == VikiJS.SelectedNode)
					return "url(#arrowHead)";
				else if(d.target.index == VikiJS.SelectedNode)
					return "url(#arrowHead2)";
				else return "url(#arrowHead3)";
			}
			else {
				if(d.source == VikiJS.SelectedNode)
					return "url(#arrowHead)";
				else if(d.target == VikiJS.SelectedNode)
					return "url(#arrowHead2)";
				else return "url(#arrowHead3)";
			}
		});

		VikiJS.NodeSelection =
			VikiJS.NodeSelection.data(VikiJS.Nodes);

		var newNodes = VikiJS.NodeSelection.enter().append("svg:g");
		
		newNodes.attr("class", "node");
		newNodes.on("click", function(d) {
			VikiJS.SelectedNode = d.index;
			VikiJS.displayNodeInfo(d);
			VikiJS.redraw(false);
		});
		newNodes.on("dblclick", function(d) {
			d.fixed = !d.fixed;
		});

		var drag = VikiJS.Force.drag()
		   .on("dragstart", function() { d3.event.sourceEvent.stopPropagation(); });

		newNodes.call(VikiJS.Force.drag);
		
		var newToolTips = newNodes.append("svg:title");
		newToolTips.attr("class", "tooltip");
		var allToolTips = d3.selectAll(".tooltip");
		allToolTips.text(function(d) {
			return d.displayName;
		});
		
/*		var newImages = newNodes.append("svg:image");
		newImages.attr("class", "icon");
		newImages.attr("xlink:href", function(d) {
			return d.imageURL;
		});
		newImages.attr("onerror", "window.VikiJS.setDefaultImage(this);");

		//var allImages = d3.selectAll(".icon");
		var allImages = VikiJS.NodeSelection.selectAll(".icon");
		allImages.attr("x", function(d) {
			return d.index == VikiJS.SelectedNode ? -1*VikiJS.SELECTED_IMAGE_DIMENSION/2: -1*VikiJS.UNSELECTED_IMAGE_DIMENSION/2;
		});
		allImages.attr("y", function(d) {
			return d.index == VikiJS.SelectedNode ? -1*VikiJS.SELECTED_IMAGE_DIMENSION/2 : -1*VikiJS.UNSELECTED_IMAGE_DIMENSION/2;
		});

		allImages.attr("width", function(d) {
			return d.index == VikiJS.SelectedNode ? VikiJS.SELECTED_IMAGE_DIMENSION : VikiJS.UNSELECTED_IMAGE_DIMENSION;
		});
		allImages.attr("height", function(d) {
			return d.index == VikiJS.SelectedNode ? VikiJS.SELECTED_IMAGE_DIMENSION : VikiJS.UNSELECTED_IMAGE_DIMENSION;
		});

		allImages.style("opacity", function(d) {
			if (d.index == VikiJS.SelectedNode) {
				return 1;
			} else if (VikiJS.findLink(VikiJS.SelectedNode,
				d.index) != null) {
				return 1;
			} else {
				return VikiJS.LINK_OPACITY;
			}
		});
*/

		var newLabels = newNodes.append("svg:text");
		newLabels.text(function(d) { return d.displayName })
			.attr("text-anchor", "middle")
			.attr("dy", ".25em")	// see bost.ocks.org/mike/d3/workshop/#114
			.attr("dx", 1*VikiJS.UNSELECTED_IMAGE_DIMENSION/2)
			//.attr("x", 20)
			.each(function() {
				var textbox = this.getBBox();

/*				d3.select(this.parentNode).insert("svg:rect", "text")
				   .attr("class", "whiteBackgroundRect")
				   .attr("x", textbox.x)
				   .attr("y", textbox.y)
				   .attr("width", textbox.width)
				   .attr("height", textbox.height)
				   .style("fill", "white");
*/
				var node = d3.select(this.parentNode).datum();
				node.nodeWidth = textbox.width + VikiJS.UNSELECTED_IMAGE_DIMENSION + 10;	// the 2 is a magic number to improve appearance
				node.nodeHeight = Math.max(textbox.height, VikiJS.UNSELECTED_IMAGE_DIMENSION) + 5;
			});


		var texts = VikiJS.NodeSelection.select("text");
		texts.attr("font-weight", function(d) {
			return d.index == VikiJS.SelectedNode ? "bold" : "normal";
		});
		texts.attr("fill", function(d) {
			return d.nonexistentPage ? "red" : "black";
		});

		var newImages = newNodes.append("svg:image");
		newImages.attr("class", "icon");
		//newImages.attr("xlink:href", VikiJS.ImagePath+"info.png");
		newImages.attr("xlink:href", function(d) {
			return (d.logoURL ? d.logoURL : VikiJS.ImagePath+"info.png");
		});
		newImages
		   .attr("x", function(d) {
			text = d3.select(this.parentNode).select("text");
			textbox = d3.select(this.parentNode).select("text").node().getBBox();
			nodeWidth = textbox.width + VikiJS.UNSELECTED_IMAGE_DIMENSION;
			return -1 * nodeWidth/2 - 2;	// this -2 is a magic number
		   })
		   .attr("y", function(d) {
			return -1 * VikiJS.UNSELECTED_IMAGE_DIMENSION/2;
		   })
		   .attr("width", VikiJS.UNSELECTED_IMAGE_DIMENSION)
		   .attr("height", VikiJS.UNSELECTED_IMAGE_DIMENSION);

		/*
		// dx, dy: magic numbers that help make pretty positioning!
		newLabels.attr("dy", function(d) {
			return d.type == VikiJS.PROJECT_TYPE ? 20 : -2;
		});
		newLabels.attr("dx", function(d) {
			if(d.type == VikiJS.PROJECT_TYPE)
				return 0;
			else
				return d.index == VikiJS.SelectedNode ? 25 : 15;
		});
		newLabels.attr("text-anchor", function(d) {
			return (d.type == VikiJS.PROJECT_TYPE ? "middle" : "right");
		});
		
		var newHourBarBacks = newNodes.append("svg:rect");
		var newHourBarFills = newNodes.append("svg:rect");
		newHourBarBacks.attr("class", "hourbarback");
		newHourBarFills.attr("class", "hourbarfill");
		var x = function(d) {
			if (d.type == VikiJS.PROJECT_TYPE) {
				return -1*VikiJS.MAX_BAR_WIDTH/2;		// center bar under folder
			} else {
				return 15;					// magic number - put bar to right of image 
			}
		}
		newHourBarBacks.attr("x", x);
		newHourBarFills.attr("x", x);

		var y = function(d) {
			return d.type == VikiJS.PROJECT_TYPE ? 25 : 3;	// another magic number
		}
		newHourBarBacks.attr("y", y);
		newHourBarFills.attr("y", y);
		newHourBarBacks.attr("height", VikiJS.BAR_HEIGHT);
		newHourBarFills.attr("height", VikiJS.BAR_HEIGHT);
		newHourBarBacks.attr("width", VikiJS.MAX_BAR_WIDTH);
		newHourBarBacks.style("stroke", "none");
		newHourBarFills.style("stroke", "none");

		var allHourBarBacks = d3.selectAll(".hourbarback");
		var allHourBarFills = d3.selectAll(".hourbarfill");
		var backcolor = function(d) {
			var link = VikiJS.findLink(d.index,
				VikiJS.SelectedNode);
			if (link == null) {
				return "none";
			}
			return "#CCCCCC";
		}
		allHourBarBacks.style("fill", backcolor);
		var fillcolor = function(d) {
			var link = VikiJS.findLink(d.index,
				VikiJS.SelectedNode);
			if (link == null) {
				return "none";
			}
			return "#0000FF";
		}
		allHourBarFills.style("fill", fillcolor);

		var width = function(d) {
			var link = VikiJS.findLink(d.index,
				VikiJS.SelectedNode);
			if (link == null) {
				return "none";
			}
			var selectedNode = VikiJS.Nodes[VikiJS.SelectedNode];
			var scaledHoursPct = 0;
			if (d.type == VikiJS.PROJECT_TYPE) {
				if (typeof link.personHoursPct === 'undefined' ||
					typeof selectedNode.maxHoursPct === 'undefined') {
					return 0;
				}
				scaledHoursPct = link.personHoursPct /
					selectedNode.maxHoursPct * 100.0;
			} else if (d.type == VikiJS.PERSON_TYPE) {
				if (typeof link.taskHoursPct === 'undefined' ||
					typeof selectedNode.maxHoursPct === 'undefined') {
					return 0;
				}
				scaledHoursPct = link.taskHoursPct /
					selectedNode.maxHoursPct * 100.0;
			} else {
				return 0;
			}
			return scaledHoursPct * VikiJS.MAX_BAR_WIDTH / 100.0;
		}
		allHourBarFills.attr("width", width);
*/
		if (restartGraph) {
			VikiJS.Force.start();
		}

	},
	
	addWikiNode:function(pageTitle, apiURL, contentURL, logoURL) {
		
//		node = VikiJS.findNode("pageTitle", pageTitle);
//		if(node)
//			return node;

		node = VikiJS.newNode();
		node.displayName = pageTitle;
		node.pageTitle = pageTitle;
		node.info = VikiJS.formatNodeInfo(pageTitle, node.nonexistentPage);
		node.type = VikiJS.WIKI_PAGE_TYPE;
		if(contentURL && typeof contentURL !== 'undefined') {
			node.URL = contentURL+(pageTitle.split(" ").join("_"));
			node.contentURL = contentURL;
		}
		else {
			node.URL = VikiJS.serverURL+mw.config.get("wgArticlePath").replace("$1", pageTitle.split(" ").join("_"));
			node.contentURL = VikiJS.serverURL+mw.config.get("wgArticlePath").replace("$1", "");
		}
		node.apiURL = apiURL;
		node.logoURL = logoURL;
		self.log("addWikiNode - node.URL = "+node.URL);
		self.log("addWikiNode - node.logoURL = "+node.logoURL);
		VikiJS.addNode(node);
		return node;
		
	},
	addExternalNode: function(url) {
		
//		node = VikiJS.findNode("URL", url);
//		if(node)
//			return node;

		node = VikiJS.newNode();
		node.displayName = (url.length < 15 ? url : url.substring(0,15)+"...");
		node.fullDisplayName = url;
		node.info = VikiJS.formatNodeInfo(node.fullDisplayName);
		node.type = VikiJS.EXTERNAL_PAGE_TYPE;
		self.log("addExternalNode - node.URL = "+url);
		node.URL = url;
		node.logoURL = VikiJS.ImagePath + "internet.png";
		VikiJS.addNode(node);
		return node;
	},
	addExternalWikiNode: function(url, wikiIndex) {
//		node = VikiJS.findNode("URL", url);
//		if(node)
//			return node;

		pageTitle = url.replace(VikiJS.searchableWikis[wikiIndex]["contentURL"], "").split("_").join(" ");
		self.log("addExternalWikiNode - extracted pageTitle = "+pageTitle);

		node = VikiJS.newNode();
		node.displayName = pageTitle;
		node.pageTitle = pageTitle;
		node.info = VikiJS.formatNodeInfo(pageTitle, node.nonexistentPage);
		node.type = VikiJS.WIKI_PAGE_TYPE;
		node.URL = url;
		node.apiURL = VikiJS.searchableWikis[wikiIndex]["apiURL"];
		node.contentURL = VikiJS.searchableWikis[wikiIndex]["contentURL"];
		node.logoURL = VikiJS.searchableWikis[wikiIndex]["logoURL"];
		VikiJS.addNode(node);
		return node;
	},
	/*
	addProjectNode: function(displayName, chargeNumber) {
		var node = VikiJS.findNode("chargeNumber", chargeNumber);
		if (node != null) {
			return node;
		}
		node = VikiJS.newNode();
		node.displayName = displayName;
		node.chargeNumber = chargeNumber;
		node.info = VikiJS.formatNodeInfo(displayName);
		node.type = VikiJS.PROJECT_TYPE;
		node.imageURL = VikiJS.ImagePath + 'project.png';
		node.projectPagesURL =
			"http://info.mitre.org/phonebook/project.do?projectNumber=" +
			chargeNumber + "&fiscalYear=" + VikiJS.FiscalYear;
		node.maxHoursPct = 0;
		VikiJS.addNode(node);
		return node;
	},

	addPersonNode: function(displayName, employeeNumber) {
		var node = VikiJS.findNode("employeeNumber", employeeNumber);
		if (node != null) {
			return node;
		}
		node = VikiJS.newNode();
		node.displayName = displayName;
		node.employeeNumber = employeeNumber;
		node.info = VikiJS.formatNodeInfo(displayName);
		node.type = VikiJS.PERSON_TYPE;
		node.imageURL = "http://info.mitre.org/phonebook/photos/big/" +
			employeeNumber + ".jpg";
		node.personPagesURL =
			"http://info.mitre.org/people/app/person/" + employeeNumber;
		VikiJS.addNode(node);
		return node;
	},
*/
	newNode: function() {
		var node = {
			elaborated: false,
			fixed: false
		};
		return node;
	},

	findNode: function(property, value) {
		self.log("findNode("+property+", "+value+") - VikiJS.Nodes.length = "+VikiJS.Nodes.length);
		for (var i = 0; i < VikiJS.Nodes.length; i++) {
			if(property === 'pageTitle') {
				// a specific check for page titles - the first letter is case insensitive
				var oldString = VikiJS.Nodes[i][property];
				if(oldString) {
					var newString = VikiJS.replaceAt(oldString, oldString.indexOf(":")+1, oldString.charAt(oldString.indexOf(":")+1).toLowerCase());
					var newValue = VikiJS.replaceAt(value, value.indexOf(":")+1, value.charAt(value.indexOf(":")+1).toLowerCase());
					if(newString === newValue)
						return VikiJS.Nodes[i];
				}
			}
			else if (typeof VikiJS.Nodes[i][property] !== 'undefined' && VikiJS.Nodes[i][property] === value) {
				return VikiJS.Nodes[i];
			}
		}
		return null;
	},

	addNode: function(node) {
		node.index = VikiJS.Nodes.push(node) - 1;
		if (node.index == 0) {
			VikiJS.SelectedNode = 0;
		}
	},

	addLink: function(node1, node2) {
		var link = {
			source: node1,
			target: node2
		};
		VikiJS.Links.push(link);
		VikiJS.LinkMap[node1 + "," + node2] = link;
		VikiJS.LinkMap[node2 + "," + node1] = link;
		return link;
	},

	findLink: function(from, to) {
		var link = VikiJS.LinkMap[from + "," + to];
		if (typeof link === 'undefined') {
			return null;
		}
		return link;
	},
	elaborateNode: function(node) {
		if(node.type === VikiJS.WIKI_PAGE_TYPE)
			VikiJS.elaborateWikiNode(node);
		// if node is a non-wiki page, there is no way to elaborate it.
	},
	elaborateNodeAtIndex: function(index) {
		var node = VikiJS.Nodes[index];
		if(node.type == VikiJS.WIKI_PAGE_TYPE)
			VikiJS.elaborateWikiNode(node);
	},
	elaborateWikiNode: function(node) {
		//var apiURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/api.php";

		// get external links OUT from page	
		self.log("elaborateWikiNode - API URL = "+node.apiURL);	
		self.log("firing first AJAX request (external links OUT)");
		jQuery.ajax({
			url: node.apiURL,
			dataType: 'jsonp',
			data: {
				action: 'query',
				prop: 'extlinks',
				titles: node.pageTitle,
				ellimit: 'max',
				format: 'json'
			},
			success: function(data, textStatus, jqXHR) {
				VikiJS.externalLinksSuccessHandler(data, textStatus, jqXHR, node);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
		
		// get intra-wiki links OUT from page
		self.log("firing second AJAX request (intra-wiki links OUT)");
		jQuery.ajax({
			url: node.apiURL,
			dataType: 'jsonp',
			data: {
				action: 'query',
				prop: 'links',
				titles: node.pageTitle,
				pllimit: 'max',
				format: 'json'
			},
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				VikiJS.intraWikiOutSuccessHandler(data, textStatus, jqXHR, node);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
		// get intra-wiki links IN to this page
		self.log("firing third AJAX request (intra-wiki links IN)");
		jQuery.ajax({
			url: node.apiURL,
			dataType: 'jsonp',
			data: {
				action: 'query',
				list: 'backlinks',
				bltitle: node.pageTitle,
				bllimit: 'max',
				format: 'json'
			},
			success: function(data, textStatus, jqXHR) {
				VikiJS.intraWikiInSuccessHandler(data, textStatus, jqXHR, node);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
		node.elaborated = true;
		node.info = VikiJS.formatNodeInfo(node.displayName);
		VikiJS.displayNodeInfo(node);
	},
	externalLinksSuccessHandler: function(data, textStatus, jqXHR, originNode) {
		self.log("external links OUT success handler");
		var externalLinks = data.query.pages[ Object.keys(data.query.pages)[0] ]["extlinks"];
		if(externalLinks) {
			for(var i = 0; i < externalLinks.length; i++) {
				// some of these external links are actually links to other searchable wikis.
				// these should be recognized as wiki nodes, not just external nodes.

				// index of the searchable wiki in list of searchable wikis, or -1 if this is not a searchable wiki page.
				var index = VikiJS.indexOfSearchableWiki(externalLinks[i]["*"]);
				isWikiPage = (index != -1);
				self.log(externalLinks[i]["*"] + " - " + (isWikiPage ? "Yes, is a wiki page" : "No, is not a wiki page"));

				if(isWikiPage) {
					externalWikiNode = VikiJS.findNode("URL", externalLinks[i]["*"]);
					if(!externalWikiNode) {
						externalWikiNode = VikiJS.addExternalWikiNode(externalLinks[i]["*"], index);
						var link = VikiJS.addLink(originNode.index, externalWikiNode.index);
					}
				}
				else {
					externalNode = VikiJS.findNode("URL", externalLinks[i]["*"]);
					if(!externalNode) {
						externalNode = VikiJS.addExternalNode(externalLinks[i]["*"]);		
						var link = VikiJS.addLink(originNode.index, externalNode.index);
					}
				}
			}
		}
		VikiJS.redraw(true);
	}, 
	intraWikiOutSuccessHandler: function(data, textStatus, jqXHR, originNode) {
		self.log("intra-wiki OUT success handler");
		var intraLinks = data.query.pages[ Object.keys(data.query.pages)[0] ]["links"];
		if(intraLinks) {
			for(var i = 0; i < intraLinks.length; i++) {
				intraNode = VikiJS.findNode("pageTitle", intraLinks[i]["title"]);
				if(!intraNode) {
					// add the node to the graph immediately.
					intraNode = VikiJS.addWikiNode(intraLinks[i]["title"], originNode.apiURL, originNode.contentURL, originNode.logoURL);
					var link = VikiJS.addLink(originNode.index, intraNode.index);

					// now visit the wiki page to get more info (does it exist? does it have a LogoLink?)
					VikiJS.visitNode(intraNode);

				}
			}
		}
		VikiJS.redraw(true);
	},
	intraWikiInSuccessHandler: function(data, textStatus, jqXHR, originNode) {
		self.log("intra-wiki IN success handler");
		var intraLinks = data.query.backlinks;
		if(intraLinks) {
			for(var i = 0; i < intraLinks.length; i++) {
				intraNode = VikiJS.findNode("pageTitle", intraLinks[i]["title"]);
				if(!intraNode) {
					intraNode = VikiJS.addWikiNode(intraLinks[i]["title"], originNode.apiURL, originNode.contentURL, originNode.logoURL);
					var link = VikiJS.addLink(intraNode.index, originNode.index);	// opposite order because these are pages coming IN
				}
			}
		}
		VikiJS.redraw(true);
	},
	visitNode: function(intraNode) {
		// note: beyond modularity, this is a separate function to preserve the scope of intraNode for the ajax call.
		var indexPHPURL = intraNode.apiURL.replace("api.php", "index.php");
		self.log("indexPHPURL = "+indexPHPURL);

		jQuery.ajax({
			url: indexPHPURL,
			dataType: 'text',
			data: {
				action: 'raw',
				title: intraNode.pageTitle,
				format: 'json'
			},
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				VikiJS.wikiPageCheckHandler(data, textStatus, jqXHR, intraNode);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if(errorThrown === "Not Found") 
					VikiJS.wikiPageCheckErrorHandler(jqXHR, textStatus, errorThrown, intraNode);
				else
					alert("Error fetching. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});

	},
	wikiPageCheckHandler: function(data, textStatus, jqXHR, originNode) {
		self.log("wikiPageCheckHandler");
		
	},
	wikiPageCheckErrorHandler: function(jqXHR, textStatus, errorThrown, node) {
		node.nonexistentPage = true;
		self.log("node: "+node.pageTitle+" is nonexistent");
		node.info = VikiJS.formatNodeInfo(node.pageTitle, true);
		VikiJS.redraw(true);
	},
	indexOfSearchableWiki: function(url) {
		for(var i = 0; i < VikiJS.searchableWikis.length; i++)
			if(url.indexOf(VikiJS.searchableWikis[i]["contentURL"]) != -1)
				return i;
		return -1;
	},
	formatNodeInfo: function(name, isNonexistentPage) {
		var info;
		if(isNonexistentPage)
			info = "<h4 id='vikijs-header'>" + name + " (Page Does Not Exist) </h4>";
		else
			info = "<h4 id='vikijs-header'>" + name + "</h4>";
		return info;
	},

	displayNodeInfo: function(node) {
		
		if (VikiJS.SelectedNode !== node.index) {
			return;
		}
		jQuery("#" + VikiJS.DetailsDiv).html(node.info);
		if(node.nonexistentPage)
			return;
		if (node.type == VikiJS.WIKI_PAGE_TYPE) {
			var buttons = " <a href='" + node.URL +
				"' target='_blank'><img src='" + VikiJS.ImagePath +
				"info.png' /></a>";
			if (!node.elaborated) {
				buttons += " <a class='icon' onclick='VikiJS.elaborateNodeAtIndex("+node.index+"); VikiJS.redraw(true);'><img src= '"+ VikiJS.ImagePath+"plus.png' /></a>";
			}
			var h4 = jQuery("#" + VikiJS.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		} 
		else if(node.type == VikiJS.EXTERNAL_PAGE_TYPE) {
			var buttons = " <a href='" + node.URL +
				"' target='_blank'><img src='" + VikiJS.ImagePath +
				"info.png' /></a>";
			var h4 = jQuery("#" + VikiJS.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		}
	},
	replaceAt: function(string, index, character) {
		return string.substr(0, index) + character + string.substr(index+character.length);
	}
}

self.log = function(text) {
	if( (window['console'] !== undefined) )
		console.log( text );
}
