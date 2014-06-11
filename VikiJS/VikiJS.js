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

window.VikiJS = function() {

	this.ID = null;
	this.loadingView = null;
	this.WIKI_PAGE_TYPE = 0;
	this.EXTERNAL_PAGE_TYPE = 1;
	this.MAX_BAR_WIDTH = 60;
	this.BAR_HEIGHT = 6;
	this.UNSELECTED_IMAGE_DIMENSION = 25;
	this.THIS_WIKI = "THIS WIKI";

	this.searchableCount = 0;
	this.contentNamespacesFetched = 0;

	this.MIN_SCALE = .2;
	this.MAX_SCALE = 5;
	this.LINK_OPACITY = 0.2;
	this.HUB_LINK_LENGTH = 400;
	this.LEAF_LINK_LENGTH = 100;
	// NOTE = all these colors are from flatuicolors.com
	// amethyst = #9b59b6
	// peter river = #3498db
	// emerald = #2ecc71
	// sunflower = #f1c40f
	// Cindy's original light blue = #23a4ff
	this.INCOMING_LINK_COLOR = "#3498db";
	this.OUTGOING_LINK_COLOR = "#f1c40f";

	this.initialPageTitles = null;
	this.Hooks = null;
	this.hasHooks = false;
	this.GraphDiv = null;
	this.DetailsDiv = null;
	this.SliderDiv = null;
	this.SelectedNode = null;
	this.Nodes = new Array();
	this.Links = new Array();
	this.LinkMap = new Array();
	this.Force = null;
	this.LinkSelection = null;
	this.NodeSelection = null;
	this.ImagePath = null;
	this.Zoompos = 1; // to store values for zoom scale
	this.serverURL = mw.config.get("wgServer");;
	this.myApiURL = this.serverURL + mw.config.get("wgScriptPath")+"/api.php";
	this.myContentURL = this.serverURL + mw.config.get("wgScript") + "/";
	this.contentNamespaces = mw.config.get("wgContentNamespaces");

	this.myLogoURL = null;
	this.allWikis = new Array();
	
	this.thisWikiData = {
				wikiTitle : this.THIS_WIKI,
				apiURL : this.myApiURL,
				contentURL : this.myContentURL,
				logoURL : this.myLogoURL,
				searchableWiki : true
			}
	
	this.namespaceIds = mw.config.get("wgNamespaceIds");

	var self = this;

	VikiJS.prototype.drawGraph = function(pageTitles, graphDiv, detailsDiv, imagePath, initialWidth, initialHeight, hooks) {
		var self = this;
		self.log("very start of drawGraph");

		// get this graph div's ID (support for multiple VIKI graphs on one page in the future)
		var dig = new RegExp("[0-9]", 'g');
		this.ID = graphDiv.match(dig)[0];

		// parse passed in parameters and initialize div settings.

		this.GraphDiv = graphDiv;
		this.DetailsDiv = detailsDiv + "_data";
		this.SliderDiv = detailsDiv + "_zoom_slider";
		this.ImagePath = imagePath;

		this.INITIAL_HEIGHT = initialHeight;
		this.INITIAL_WIDTH = initialWidth;
		this.height = self.INITIAL_HEIGHT;
		this.width = self.INITIAL_WIDTH;

		// to set the widths of the details divider and the horizontal zoom slider
		// the margin is a value used to accumulate all maring, padding and other
		// space that the .detail-panel class uses.
		var margin = 10;
		// the details divider will get 3/5 of the space
		$("#"+self.DetailsDiv).width((self.width - margin)* 3/5);
		// the slider will get 2/5 of the space
		$("#"+self.SliderDiv).width((self.width - margin) * 2/5);
		// set the entire detail-panel to the width of the input minus the size of
		// the paddings, margins and other values to align with the graph.
		$(".vikijs-detail-panel").width(self.width - margin);
		// create a new zoom slider
		var zoom_slider = $("#"+self.SliderDiv).slider(
		{
		  orientation: "horizontal",//make the slider horizontal
		  min: this.MIN_SCALE , // set the lowest value
		  max: this.MAX_SCALE, // set the highest value
		  step: .001, // set the value for each individual increment
		  value: this.Zoompos, // set the starting value
		  slide: function( event, ui ) {
			// set the zoom scale equal to the current value of the slider
			// which is the current position
		        self.Zoompos = ui.value;
			// call the slide function to zoom/pan using the slider
		        self.slide();
		  }
		});

		// Set up the loading spinner
		vex.defaultOptions.className = 'vex-theme-default';

		var loadingContent = '\
<div id="loadingDiv">\
	<div id="textDiv">Loading...</div>\
	<div id="spinnerDiv"></div>\
</div>';

		var loadingStyle = '\
<style>\
	#textDiv {\
		text-align: center;\
	}\
	#spinnerDiv {\
		height: 75px;\
	}\
</style>';
		
		var opts = {
		  lines: 11, // The number of lines to draw
		  length: 8, // The length of each line
		  width: 4, // The line thickness
		  radius: 8, // The radius of the inner circle
		  corners: 1, // Corner roundness (0..1)
		  rotate: 0, // The rotation offset
		  direction: 1, // 1: clockwise, -1: counterclockwise
		  color: '#000', // #rgb or #rrggbb or array of colors
		  speed: 1, // Rounds per second
		  trail: 60, // Afterglow percentage
		  shadow: false, // Whether to render a shadow
		  hwaccel: false, // Whether to use hardware acceleration
		  className: 'spinner', // The CSS class to assign to the spinner
		  zIndex: 2e9, // The z-index (defaults to 2000000000)
		  top: '60%', // Top position relative to parent
		  left: '50%' // Left position relative to parent
		};
		
		self.log("showing load screen");
		self.loadingView = vex.open({
			content: loadingContent,
			contentCSS: {
				width : '150px'
			},
			afterOpen: function($vexContent) {
				$vexContent.append(loadingStyle);
				spinner = new Spinner(opts).spin(document.getElementById('spinnerDiv'));
			},
			showCloseButton: false
		});

		// Set up the context menu

		// ensure the entire graph div doesn't trigger context menu - only nodes
		foo = $('#'+this.GraphDiv);
		$('#'+this.GraphDiv).on('contextmenu', function() {
			return false;
		});

		$('body').append(
			"<div class=\"contextMenu\" id=\"menu-"+this.ID+"\"><ul>"+
			// the dynamic menu title (node name)
			"<li id=\"name-"+this.ID+"\"  class=\"header\" style=\"text-align: center;\">Name</li>"+
			// actual navigable menu
			"<div class=\"options\" >"+
			"<li id=\"freeze\" class=\"freeze-"+this.ID+"\">Freeze</li>"+
        	"<li id=\"getinfo\" >Get Info</li>"+
			"<li id=\"elaborate\" class=\"elaborate-"+this.ID+"\">Elaborate</li>"+
			"<li id=\"hide\">Hide</li>"+
			"<hr>"+// separator
        	"<li id=\"showall\">Show All</li>"+
	    	"</ul></div></div>"
			);
		
		$("#name").css("text-align", "center");

		// get hooks available
		this.Hooks = jQuery.parseJSON(hooks);
		this.hasHooks = (self.Hooks != null);
		this.serverURL = mw.config.get("wgServer");
		this.initialPageTitles = eval("("+pageTitles+")");
		
		if(this.initialPageTitles === null) {
			alert("You must supply a page title.");
			return;
		}
		


		$("#addNodesButton").click(function() {
			setTimeout(function() {
				var newNodesWindow = self.showNewNodesWindow();
			}, 0);
		});

		initializeGraph();

		// initialize the list of searchable wikis,
		// get this wiki's own logo URL,
		// and do initial graph population.

		calledGetAllWikisHook = this.callHooks("GetAllWikisHook", []);
		if(!calledGetAllWikisHook)
			self.hookCompletion("GetAllWikisHook");

		function initializeGraph() {
			var padding = 20;

			self.zoom = d3.behavior.zoom()
			   .on("zoom", self.redrawZoom)
			   .scaleExtent([self.MIN_SCALE, self.MAX_SCALE]);
			
			var svg = d3.select("#" + self.GraphDiv)
			   .append("svg:svg")
			      .attr("width", self.width)
			      .attr("height", self.height)
			      .attr("id", self.ID)
			      .attr("pointer-events", "all")
			   .append("svg:g")
			      .call(self.zoom)
			      .on("dblclick.zoom", null)
			self.SVG = svg
			svg.append("svg:rect")
			   .attr("id", self.ID)
			   .attr("width", self.width)
			   .attr("height", self.height)
			   .attr("fill", "white");

			svg.append("svg:g")
			   .attr("id", "moveable-"+self.ID);

			defs = svg.append("defs");

			defs.append("marker")
			   .attr("id", "arrowHead")
			   .attr("viewBox", "0 -8 20 20")
			   .attr("refX", 16)
			   .attr("refY", 0)
			   .attr("markerWidth", 12)
			   .attr("markerHeight", 12)
			   .attr("markerUnits", "userSpaceOnUse")
			   .attr("orient", "auto")
			   .attr("fill", self.OUTGOING_LINK_COLOR)
			   .attr("stroke-width", "2")
			.append("path")
			   .attr("d", "M0,-8L20,0L0,8");

			defs.append("marker")
			   .attr("id", "arrowHead2")
			   .attr("viewBox", "0 -8 20 20")
			   .attr("refX", 16)
			   .attr("refY", 0)
			   .attr("markerWidth", 12)
			   .attr("markerHeight", 12)
			   .attr("markerUnits", "userSpaceOnUse")
			   .attr("orient", "auto")
			   .attr("fill", self.INCOMING_LINK_COLOR)
			   .attr("stroke-width", "2")
			.append("path")
			   .attr("d", "M0,-8L20,0L0,8");

			defs.append("marker")
			   .attr("id", "arrowHead3")
			   .attr("viewBox", "0 -8 20 20")
			   .attr("refX", 16)
			   .attr("refY", 0)
			   .attr("markerWidth", 12)
			   .attr("markerHeight", 12)
			   .attr("markerUnits", "userSpaceOnUse")
			   .attr("orient", "auto")
			   .attr("fill", "black")
			   .attr("stroke-width", "2")
			.append("path")
			   .attr("d", "M0,-8L20,0L0,8");

			d3.select("#moveable-"+self.ID).append("svg:g").attr("id", "links-"+self.ID);
			d3.select("#moveable-"+self.ID).append("svg:g").attr("id", "nodes-"+self.ID);
				
			self.Force = d3.layout.force();
			self.Force.gravity(0.4)
			self.Force.linkStrength(1.25)
			// link distance was made dynamic in respect to the increase in charge. As the nodes form a cluster, the edges are less likely to cross.
			// The edge between to clusters is stretched from the polarity between the adjacent clusters.
			self.Force.linkDistance(
				function(n){
					// if the source and target has been elaborated, set the variable child to true
					var child = (n.source.elaborated && n.target.elaborated);
					if(child){return self.HUB_LINK_LENGTH;}// if this node is the parent or the center of a cluster of nodes
					else{return self.LEAF_LINK_LENGTH;}// if this node is the child or the outer edge of a cluster of nodes

				}
			)
			// Original value of charge was -3000. Increasing the charge maximizes polarity between nodes causing each node to repel.
			// This will decrease edge crossings for the nodes. 	
			self.Force.charge(-7500)
			self.Force.friction(.675)
			self.Force.size([self.width, self.height])
			self.Force.on("tick", tick);

			self.LinkSelection =
				svg.select("#links-"+self.ID).selectAll(".link-"+self.ID);

			self.NodeSelection =
				svg.select("#nodes-"+self.ID).selectAll(".node-"+self.ID);
	
			function tick() {

				// var boundaryRadius = 12;

				self.NodeSelection.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});

				// rather than return the (x,y) of the source and target node directly,
				// which would cause the links to stab through the node text,
				// we create an imaginary parabola around the node (a, b = node width, height)
				// and make the links connect to points on this parabola which would extend
				// the line into the center of the node, if possible.
				// (x,y) depend on (r, theta) and because this is an ellipse, r is a function of
				// a, b, and theta.

				self.LinkSelection.attr("x1", function(d) {

					var dy = d.target.y - d.source.y;
					var dx = d.target.x - d.source.x;
					var angle = Math.atan2(dy, dx);
					var width = d.source.nodeWidth;
					var height = d.source.nodeHeight;

					var a = width/2;
					var b = height/2;

					// value of r is from wikipedia article on ellipses: r as a function of theta, a, b.
					var r = a*b / Math.sqrt( (b*b*Math.cos(angle)*Math.cos(angle)) + (a*a*Math.sin(angle)*Math.sin(angle)) );

					return d.source.x + r*Math.cos(angle);
					//return d.source.x + (width/2)*Math.cos(angle);
					//return d.source.x + boundaryRadius*Math.cos(angle);
				});
				self.LinkSelection.attr("y1", function(d) {

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
				self.LinkSelection.attr("x2", function(d) {

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
				self.LinkSelection.attr("y2", function(d) {

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
	}
	
	VikiJS.prototype.fetchContentNamespaces = function() {
		var self = this;
		
		actuallySearchableWikis = self.allWikis.filter(function(wiki) {
			return wiki.searchableWiki;
		});
		
		self.searchableCount = actuallySearchableWikis.length;
		self.log("searchableCount = "+self.searchableCount);
		if(self.searchableCount ==0)
			self.populateInitialGraph();
		else
			for(var i = 0; i < actuallySearchableWikis.length; i++) {
				self.getContentNamespaceForWikiAtIndex(actuallySearchableWikis, i);
		}
	}
	
	VikiJS.prototype.getContentNamespaceForWikiAtIndex = function(actuallySearchableWikis, index) {
		var self = this;
		var wiki = actuallySearchableWikis[index];
		var wikiTitle = wiki.wikiTitle;

		var sameServer = wiki.contentURL.indexOf(self.serverURL) > -1;
		jQuery.ajax({
			url : wiki.apiURL,
			dataType : sameServer ? 'json' : 'jsonp',
			data : {
				action : 'getContentNamespaces',
				format : 'json'
			},
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				self.log("success callback in AJAX call of getContentNamespaces("+wikiTitle+")");
				if(data["error"] && data["error"]["code"] && data["error"]["code"]=== "unknown_action") {
					self.log("WARNING: The wiki "+wikiTitle+" did not support getContentNamespaces. Likely an older production wiki. Defaulting to just NS 0 (main).");
					actuallySearchableWikis[index].contentNamespaces = [0];
				}
				else {
					actuallySearchableWikis[index].contentNamespaces = data["getContentNamespaces"];
				}
			
				self.contentNamespacesFetched++;
				self.log("" + self.contentNamespacesFetched + " wikis' content namespaces fetched");
				if(self.contentNamespacesFetched == self.searchableCount) {
					self.log("all namespaces fetched; now populating graph");
					self.populateInitialGraph();				
				}

			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching inside getContentNamespaces for "+wikiTitle+" - AJAX request. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
	
	}
	
	VikiJS.prototype.populateInitialGraph = function() {
		var self = this;
		
		vex.close(self.loadingView.data().vex.id);
		self.log("closed load screen");
		self.log("now will get site logo and do graph population");

		//visit self node to get categories

		jQuery.ajax({
			url: self.myApiURL,
			dataType: 'json',
			data: {
				action: 'getSiteLogo',
				format: 'json'
			},
			success: function(data, textStatus, jqXHR) {

				self.myLogoURL = mw.config.get("wgServer") + data["getSiteLogo"];
				self.thisWikiData.logoURL = self.myLogoURL;
				// do initial graph population
				for(var i = 0; i < self.initialPageTitles.length; i++) {
					// self.addWikiNode(pageTitles[i], self.myApiURL, null, self.myLogoURL, true);
					node = self.addWikiNodeFromWiki(self.initialPageTitles[i], self.THIS_WIKI)
					self.visitNode(node);
				}

				for(var i = 0; i < self.initialPageTitles.length; i++)
					self.elaborateNode(self.Nodes[i]);

				self.Force.nodes(self.Nodes);
				self.Force.links(self.Links);

				self.redraw(true);

			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Unable to fetch list of wikis.");
			}
		});
		
	}

	VikiJS.prototype.slide = function() {	
		var self = this;	
		
		// set target_zoom to the logged zoom position
	        target_zoom = this.Zoompos,
		// calculate the center of the graph by dividing the width and height by two
	        center = [this.width / 2, this.height / 2],
		// set the scale extent
	        extent = this.zoom.scaleExtent(),
		// and the translation vectors
	        translate = this.zoom.translate(),
	        translation = [],
	        l = [],
		// setup a json object with the translation x and y values with the zoom scale
	        view = {
			x: translate[0], 
			y: translate[1], 
			k: this.zoom.scale()
		};

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
		this.interpolateZoom([view.x, view.y], view.k);

	}

	VikiJS.prototype.interpolateZoom = function(translate, scale) {
		var self = this;
		// zoom with the set scale and translation values
		return d3.transition().duration(50).tween("zoom", function () {
	        var iTranslate = d3.interpolate(self.zoom.translate(), translate),
	            iScale = d3.interpolate(self.zoom.scale(), scale);
	        return function (t) {
	            self.zoom
	                .scale(iScale(t))
	                .translate(iTranslate(t));
	            self.zoomed();
	        };
	    });
	}

	VikiJS.prototype.zoomed = function() {
		var self = this;
		// access the element movable and move to the scale and translation vectors
		d3.select("#moveable-"+this.ID).attr("transform",
		        "translate(" + self.zoom.translate() + ")" +
		        "scale(" + self.zoom.scale() + ")"
		    );
	}

	VikiJS.prototype.redrawZoom = function() {		
		self.Zoompos = d3.event.scale;
		d3.select("#moveable-"+self.ID).attr("transform", "translate("+d3.event.translate+")" + " scale("+self.Zoompos+")");
		// if you scroll via a scrollwheel inside the graph, then set the slider to the current scale 
		$("#"+self.SliderDiv).slider("value",self.Zoompos);
	}

	VikiJS.prototype.redraw = function(restartGraph) {
		var self = this;

		self.LinkSelection =
			self.LinkSelection.data(self.Links);

		var newLinks = self.LinkSelection.enter().append("svg:line");
		newLinks.attr("class", "link-"+this.ID);
		self.LinkSelection.style("stroke-width", function(d) {
			if (typeof d.source.index !== 'undefined') {
				return d.source.index == self.SelectedNode ||
					d.target.index == self.SelectedNode ? 2 : 1;
			} else {
				return d.source == self.SelectedNode ||
					d.target == self.SelectedNode ? 2 : 1;
			}
		});
		self.LinkSelection.style("opacity", function(d) {
			if (typeof d.source.index !== 'undefined') {
				return d.source.index == self.SelectedNode ||
					d.target.index == self.SelectedNode ? 1 : self.LINK_OPACITY;
			} else {
				return d.source == self.SelectedNode ||
					d.target == self.SelectedNode ? 1 : self.LINK_OPACITY;
			}
		});
		self.LinkSelection.style("stroke", function(d) {
			if(typeof d.source.index !== 'undefined') {
				if(d.source.index == self.SelectedNode)
					return self.OUTGOING_LINK_COLOR;
				else if(d.target.index == self.SelectedNode)
					return self.INCOMING_LINK_COLOR;
				else return "black";
			}
			else {
				if(d.source == self.SelectedNode)
					return self.OUTGOING_LINK_COLOR;
				else if(d.target == self.SelectedNode)
					return self.INCOMING_LINK_COLOR;
				else return "black";
			}
		});
		self.LinkSelection.attr("marker-end", function(d) {
			if(typeof d.source.index !== 'undefined') {
				if(d.source.index == self.SelectedNode)
					return "url(#arrowHead)";
				else if(d.target.index == self.SelectedNode)
					return "url(#arrowHead2)";
				else return "url(#arrowHead3)";
			}
			else {
				if(d.source == self.SelectedNode)
					return "url(#arrowHead)";
				else if(d.target == self.SelectedNode)
					return "url(#arrowHead2)";
				else return "url(#arrowHead3)";
			}
		});

		self.NodeSelection =
			self.NodeSelection.data(self.Nodes);

		var newNodes = self.NodeSelection.enter().append("svg:g");
		
		newNodes.attr("class", "node-"+this.ID);
		newNodes.on("click", function(d) {
			self.SelectedNode = d.index;
			self.displayNodeInfo(d);
			self.redraw(false);
		});
		newNodes.on("dblclick", function(d) {
			d.fixed = !d.fixed;
		});

		newNodes.on("contextmenu", function(d) {
			self.SelectedNode = d.index;
			self.redraw(false);
			self.menu();
		});

		var drag = self.Force.drag()
		   .on("dragstart", function() { d3.event.sourceEvent.stopPropagation(); });

		newNodes.call(self.Force.drag);
		
		var newToolTips = newNodes.append("svg:title");
		newToolTips.attr("class", "tooltip");
		var allToolTips = d3.selectAll(".tooltip");
		allToolTips.text(function(d) {
			return d.displayName;
		});

		var newLabels = newNodes.append("svg:text");
		newLabels.text(function(d) { return d.displayName })
			.attr("text-anchor", "middle")
			.attr("dy", ".25em")	// see bost.ocks.org/mike/d3/workshop/#114
			.attr("dx", 1*self.UNSELECTED_IMAGE_DIMENSION/2)
			//.attr("x", 20)
			.each(function() {
				var textbox = this.getBBox();

				var node = d3.select(this.parentNode).datum();
				node.nodeWidth = textbox.width + self.UNSELECTED_IMAGE_DIMENSION + 10;	// the 2 is a magic number to improve appearance
				node.nodeHeight = Math.max(textbox.height, self.UNSELECTED_IMAGE_DIMENSION) + 5;
			});


		var texts = self.NodeSelection.select("text");
		texts.text(function(d) { return d.displayName });
		
		texts.each(function() {
			var textbox = this.getBBox();
			var node = d3.select(this.parentNode).datum();
			node.nodeWidth = textbox.width + self.UNSELECTED_IMAGE_DIMENSION + 10;
			node.nodeHeight = Math.max(textbox.height, self.UNSELECTED_IMAGE_DIMENSION) + 5;
		});
		
		texts.attr("font-weight", function(d) {
			return d.index == self.SelectedNode ? "bold" : "normal";
		});
		texts.attr("fill", function(d) {
			return d.nonexistentPage ? "red" : "black";
		});

		var newImages = newNodes.append("svg:image");
		newImages.attr("class", "icon");


		var allImages = self.NodeSelection.selectAll(".icon");

		allImages.attr("xlink:href", function(d) {
			// go through the hierarchy of possible icons in order of preference
			// Title Icons > Hook Icons > Site Logo Icons > External Node Icons > info.png
			if(d.titleIconURL)
				return d.titleIconURL;
			else if(d.hookIconURL)
				return d.hookIconURL;
			else if(d.logoURL)
				return d.logoURL;
			else if(d.externalNodeIconURL)
				return d.externalNodeIconURL;
			else
				return self.ImagePath+"info.png";
		});
		allImages
		   .attr("x", function(d) {
			text = d3.select(this.parentNode).select("text");
			textbox = d3.select(this.parentNode).select("text").node().getBBox();
			nodeWidth = textbox.width + self.UNSELECTED_IMAGE_DIMENSION;
			return -1 * nodeWidth/2 - 2;	// this -2 is a magic number
		   })
		   .attr("y", function(d) {
			return -1 * self.UNSELECTED_IMAGE_DIMENSION/2;
		   })
		   .attr("width", self.UNSELECTED_IMAGE_DIMENSION)
		   .attr("height", self.UNSELECTED_IMAGE_DIMENSION);

		if (restartGraph) {
			self.Force.start();
		}

	}
	
	VikiJS.prototype.addWikiNode = function(pageTitle, apiURL, contentURL, logoURL, searchable) {
		var self = this;
		self.log("addWikiNode - pageTitle = "+pageTitle);
		node = self.newNode();
		node.displayName = pageTitle;
		node.pageTitle = pageTitle;
		node.type = self.WIKI_PAGE_TYPE;
		if(contentURL && typeof contentURL !== 'undefined') {
			node.URL = contentURL+(pageTitle.split(" ").join("_"));
			node.contentURL = contentURL;
		}
		else {
			node.URL = self.serverURL+mw.config.get("wgArticlePath").replace("$1", pageTitle.split(" ").join("_"));
			node.contentURL = self.serverURL+mw.config.get("wgArticlePath").replace("$1", "");
		}
		node.apiURL = apiURL;
		node.logoURL = logoURL;
		node.searchable = searchable;
		node.sameServer = node.contentURL.indexOf(self.serverURL) > -1;	// if the node's content URL contains my server, it should have the same server

		node.info = node.searchable ? self.formatNodeInfo(pageTitle, node.nonexistentPage) : self.formatNodeInfo(pageTitle + " (Unsearchable Wiki)");
		
		self.checkForTitleIcon(node);
		self.addNode(node);
		
		return node;
		
	}
	VikiJS.prototype.addWikiNodeFromWiki = function(pageTitle, wikiTitle) {
		var self = this;
		
		var wiki = null;
		if(wikiTitle === self.THIS_WIKI)
			wiki = self.thisWikiData;
		else
			wiki = self.allWikis[ self.searchableWikiIndexForName(wikiTitle) ];	
			
		// for(var i = 0; i < self.allWikis.length; i++)
		// if(self.allWikis[i].wikiTitle === wikiTitle) {
		// 	wiki = self.allWikis[i];
		// 	break;
		// }
		// 
		// if(wikiTitle === self.THIS_WIKI) {
		// 	wiki = self.thisWikiData;
		// }
		
		if(!wiki)		// should never happen...
			return null;
			
		node = self.newNode();
		node.displayName = pageTitle;
		node.pageTitle = pageTitle;
		node.type = self.WIKI_PAGE_TYPE;
		node.contentURL = wiki.contentURL;
		node.URL = node.contentURL + (pageTitle.split(" ").join("_"));
		node.apiURL = wiki.apiURL;
		node.logoURL = wiki.logoURL;
		node.searchable = wiki.searchableWiki;
		node.sameServer = node.contentURL.indexOf(self.serverURL) > -1;	// if the node's content URL contains my server, it should have the same server
		node.wikiTitle = wikiTitle;
		
		node.info = node.searchable ? self.formatNodeInfo(pageTitle, node.nonexistentPage) : self.formatNodeInfo(pageTitle + " (Unsearchable Wiki)");
		
		self.checkForTitleIcon(node);
		self.addNode(node);
		
		return node;
	}
	
	VikiJS.prototype.addExternalNode = function(url) {
		var self = this;

		node = self.newNode();
		shortURL = url.replace("http://", "").replace("https://", "").replace("www.", "");
		node.displayName = (shortURL.length < 15 ? shortURL : shortURL.substring(0,15)+"...");
		node.fullDisplayName = url;
		node.info = self.formatNodeInfo(node.fullDisplayName);
		node.type = self.EXTERNAL_PAGE_TYPE;
		node.URL = url;
		node.externalNodeIconURL = self.ImagePath + "internet.png";
		self.addNode(node);
		return node;
	}
	
	VikiJS.prototype.addExternalWikiNode = function(url, wikiIndex) {
		var self = this;

		pageTitle = url.replace(self.allWikis[wikiIndex]["contentURL"], "").split("_").join(" ");

		node = self.newNode();
		node.displayName = pageTitle;
		node.pageTitle = pageTitle;
		node.type = self.WIKI_PAGE_TYPE;
		node.URL = url;
		node.wikiIndex = wikiIndex;
		node.apiURL = self.allWikis[wikiIndex]["apiURL"];
		node.contentURL = self.allWikis[wikiIndex]["contentURL"];
		node.logoURL = self.allWikis[wikiIndex]["logoURL"];
		node.searchable = self.allWikis[wikiIndex]["searchableWiki"];
		node.sameServer = node.contentURL.indexOf(self.serverURL) > -1;	// if the node's content URL contains my server, it should have the same server
		node.wikiTitle = self.allWikis[wikiIndex].wikiTitle;
		
		node.info = node.searchable ? self.formatNodeInfo(pageTitle, node.nonexistentPage) : self.formatNodeInfo(pageTitle + " (Unsearchable Wiki)");

		
		self.checkForTitleIcon(node);
		self.addNode(node);
		
		return node;
	}
	VikiJS.prototype.checkForTitleIcon = function(node) {
		
		jQuery.ajax({
			url: node.apiURL,
			dataType: node.sameServer ? 'json' : 'jsonp',
			data: {
				action: 'getTitleIcons',
				format: 'json',
				pageTitle: node.pageTitle
			},
			beforeSend: function(jqXHR, settings) {
				self.log("url of TitleIcon lookup: "+settings.url);
			},
			success: function(data, textStatus, jqXHR) {
				self.titleIconSuccessHandler(data, node);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching title icon data. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
		
	}
	VikiJS.prototype.titleIconSuccessHandler = function(data, node) {
		if(data["error"] && data["error"]["code"] && data["error"]["code"]=== "unknown_action") {
			self.log("WARNING: The wiki for page "+node.pageTitle+" did not support getTitleIcons. Likely an older production wiki.");
			return;
		}

		var titleIconURLs = data["getTitleIcons"]["titleIcons"];
		if(titleIconURLs.length == 0) {
			self.log("No title icons here.");
			return;
		}
		else {
			self.log("Found a title icon! For page: "+node.pageTitle+", URL = "+titleIconURLs[0]);
			node.titleIconURL = titleIconURLs[0];
			self.redraw(false);
		}
	}
	VikiJS.prototype.newNode = function() {
		var self = this;

		var node = {
			elaborated: false,
			fixed: false
		};
		return node;
	}

	VikiJS.prototype.findNode = function(property, value) {
		var self = this;

		for (var i = 0; i < self.Nodes.length; i++) {
			if(property === 'pageTitle') {
				// a specific check for page titles - the first letter is case insensitive
				var oldString = self.Nodes[i][property];
				if(oldString) {
					var newString = self.replaceAt(oldString, oldString.indexOf(":")+1, oldString.charAt(oldString.indexOf(":")+1).toLowerCase());
					var newValue = self.replaceAt(value, value.indexOf(":")+1, value.charAt(value.indexOf(":")+1).toLowerCase());
					if(newString === newValue)
						return self.Nodes[i];
				}
			}
			else if (typeof self.Nodes[i][property] !== 'undefined' && self.Nodes[i][property] === value) {
				return self.Nodes[i];
			}
		}
		return null;
	}

	VikiJS.prototype.addNode = function(node) {
		var self = this;

		node.index = self.Nodes.push(node) - 1;
		if (node.index == 0) {
			self.SelectedNode = 0;
		}
	}

	VikiJS.prototype.addLink = function(node1, node2) {
		var self = this;

		var link = {
			source: node1,
			target: node2
		};
		self.Links.push(link);
		self.LinkMap[node1 + "," + node2] = link;
		self.LinkMap[node2 + "," + node1] = link;
		return link;
	}

	VikiJS.prototype.findLink = function(from, to) {
		var self = this;
		var link = self.LinkMap[from + "," + to];
		if (typeof link === 'undefined') {
			return null;
		}
		return link;
	}
	VikiJS.prototype.elaborateNode = function(node) {
		var self = this;
		if(node.type === self.WIKI_PAGE_TYPE)
			self.elaborateWikiNode(node);
		// if node is a non-wiki page, there is no way to elaborate it.
	}
	VikiJS.prototype.elaborateNodeAtIndex = function(index) {
		var self = this;
		var node = self.Nodes[index];
		if(node.type == self.WIKI_PAGE_TYPE)
			self.elaborateWikiNode(node);
	}
	VikiJS.prototype.elaborateWikiNode = function(node) {
		var self = this;
		//var apiURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/api.php";

		// get external links OUT from page	

		jQuery.ajax({
			url: node.apiURL,
			dataType: node.sameServer ? 'json' : 'jsonp',
			data: {
				action: 'query',
				prop: 'extlinks',
				titles: node.pageTitle,
				ellimit: 'max',
				format: 'json'
			},
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of extlinks ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				self.externalLinksSuccessHandler(data, textStatus, jqXHR, node);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching inside elaborateWikiNode - AJAX request (external links OUT). jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
		
		// get intra-wiki links OUT from page
		jQuery.ajax({
			url: node.apiURL,
			dataType: node.sameServer ? 'json' : 'jsonp',
			data: {
				action: 'query',
				prop: 'links',
				titles: node.pageTitle,
				pllimit: 'max',
				format: 'json'
			},
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of intrawiki OUT ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				self.intraWikiOutSuccessHandler(data, textStatus, jqXHR, node);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching inside elaborateWikiNode - AJAX request (intra-wiki links OUT). jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
		// get intra-wiki links IN to this page
		jQuery.ajax({
			url: node.apiURL,
			dataType: node.sameServer ? 'json' : 'jsonp',
			data: {
				action: 'query',
				list: 'backlinks',
				bltitle: node.pageTitle,
				bllimit: 'max',
				format: 'json'
			},
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of intrawiki IN ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				self.intraWikiInSuccessHandler(data, textStatus, jqXHR, node);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching inside elaborateWikiNode - AJAX request (intra-wiki links IN). jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
		node.elaborated = true;
		node.info = self.formatNodeInfo(node.displayName);
		self.displayNodeInfo(node);
	}
	VikiJS.prototype.externalLinksSuccessHandler = function(data, textStatus, jqXHR, originNode) {
		var self = this;

		var externalLinks = data.query.pages[ Object.keys(data.query.pages)[0] ]["extlinks"];
		if(externalLinks) {
			var newExternalNodes = [];
			for(var i = 0; i < externalLinks.length; i++) {
				// some of these external links are actually links to other searchable wikis.
				// these should be recognized as wiki nodes, not just external nodes.

				// index of the searchable wiki in list of searchable wikis, or -1 if this is not a searchable wiki page.
				var index = self.indexOfWiki(externalLinks[i]["*"]);
				isWikiPage = (index != -1);

				if(isWikiPage) {
					externalWikiNode = self.findNode("URL", externalLinks[i]["*"]);
					if(!externalWikiNode) {
							externalWikiNode = self.addExternalWikiNode(externalLinks[i]["*"], index);	
					}
						
					var link = self.findLink(originNode.index, externalWikiNode.index);
					if(!link)
						link = self.addLink(originNode.index, externalWikiNode.index);
					
					self.visitNode(externalWikiNode);

				}
				else {
					externalNode = self.findNode("URL", externalLinks[i]["*"]);
					if(!externalNode)
						externalNode = self.addExternalNode(externalLinks[i]["*"]);		
					
					var link = self.findLink(originNode.index, externalNode.index);
					if(!link)
						link = self.addLink(originNode.index, externalNode.index);

					newExternalNodes.push(externalNode);
					
				}
			}
			// now call hooks on these nodes to see if any other special way to handle it (e.g. MII Phonebook)
			self.callHooks("ExternalNodeHook", [newExternalNodes]);
		}
		self.redraw(true);
	}
	VikiJS.prototype.intraWikiOutSuccessHandler = function(data, textStatus, jqXHR, originNode) {
		var self = this;

		var intraLinks = data.query.pages[ Object.keys(data.query.pages)[0] ]["links"];
		if(intraLinks) {
			// get list of namespaces, or fetch with AJAX if required.

			var wiki = null;
			if(originNode.wikiTitle === self.THIS_WIKI) {
				wiki = self.thisWikiData;
			}
			else {
				wiki = self.allWikis[ self.searchableWikiIndexForName(originNode.wikiTitle) ];
			}
			if(!wiki.contentNamespaces)
				self.getContentNamespaces(wiki.wikiTitle);						
				
			var contentNamespaces = wiki.contentNamespaces;
			
			self.log("contentNamespaces for "+originNode.wikiTitle+": "+ contentNamespaces);
			
			for(var i = 0; i < intraLinks.length; i++) {
				intraNode = self.findNode("pageTitle", intraLinks[i]["title"]);
				if(!intraNode || (intraNode.apiURL !== originNode.apiURL)) {
					// add the node to the graph immediately if it is within the wiki's content namespaces.
					
					if(contentNamespaces.indexOf(intraLinks[i].ns) > -1)
						intraNode = self.addWikiNodeFromWiki(intraLinks[i]["title"], originNode.wikiTitle);
					else
						continue;

				}
				if(intraNode) {
					var link = self.findLink(originNode.index, intraNode.index);
					if(!link) {
						link = self.addLink(originNode.index, intraNode.index);
					}
					// now visit the wiki page to get more info (does it exist? does it have a LogoLink?)
					self.visitNode(intraNode);
				}
			}
		}
		self.redraw(true);
	}
	VikiJS.prototype.intraWikiInSuccessHandler = function(data, textStatus, jqXHR, originNode) {
		var self = this;

		var intraLinks = data.query.backlinks;
		if(intraLinks) {
			// get list of namespaces, or fetch with AJAX if required.

			var wiki = null;
			if(originNode.wikiTitle === self.THIS_WIKI) {
				wiki = self.thisWikiData;
			}
			else {
				wiki = self.allWikis[ self.searchableWikiIndexForName(originNode.wikiTitle) ];
			}
			if(!wiki.contentNamespaces)
				self.getContentNamespaces(wiki.wikiTitle);						
				
			var contentNamespaces = wiki.contentNamespaces;
			
			self.log("contentNamespaces for "+originNode.wikiTitle+": "+ contentNamespaces);
			
			for(var i = 0; i < intraLinks.length; i++) {
				intraNode = self.findNode("pageTitle", intraLinks[i]["title"]);
				if(!intraNode  || (intraNode.apiURL !== originNode.apiURL)) {					
					// add the node to the graph immediately if it is within the wiki's content namespaces.
					
					if(contentNamespaces.indexOf(intraLinks[i].ns) > -1)
						intraNode = self.addWikiNodeFromWiki(intraLinks[i]["title"], originNode.wikiTitle);					
					else
						continue;

				}
				if(intraNode) {
					var link = self.findLink(intraNode.index, originNode.index);
					if(!link)
						link = self.addLink(intraNode.index, originNode.index);	// opposite order because these are pages coming IN
				}
			}
		}
		self.redraw(true);
	}
	
	VikiJS.prototype.getContentNamespaces = function(wikiTitle) {
		var wiki = null;
		var index = null;
		if(wikiTitle == self.THIS_WIKI) {
			wiki = self.thisWikiData;
		}
		else {
			index = self.searchableWikiIndexForName(wikiTitle);
			wiki = self.allWikis[index];			
		}
		var sameServer = wiki.contentURL.indexOf(self.serverURL) > -1;
		jQuery.ajax({
			url : wiki.apiURL,
			async: false,
			dataType : sameServer ? 'json' : 'jsonp',
			data : {
				action : 'getContentNamespaces',
				format : 'json'
			},
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				self.log("success callback in AJAX call of getContentNamespaces("+wikiTitle+")");
				if(data["error"] && data["error"]["code"] && data["error"]["code"]=== "unknown_action") {
					self.log("WARNING: The wiki "+wikiTitle+" did not support getContentNamespaces. Likely an older production wiki. Defaulting to just NS 0 (main).");
					if(wikiTitle === self.THIS_WIKI)
						self.thisWikiData.contentNamespaces = [0];
					else
						self.allWikis[index].contentNamespaces = [0];
				}
				else {
					if(wikiTitle === self.THIS_WIKI)
						self.thisWikiData.contentNamespaces = data["getContentNamespaces"];
					else
						self.allWikis[index].contentNamespaces = data["getContentNamespaces"];
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching inside getContentNamespaces for "+wikiTitle+" - AJAX request. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
		
		self.log("end of getContentNamespaces("+wikiTitle+")");
	}
	
	VikiJS.prototype.visitNode = function(intraNode) {
		var self = this;
		// note: beyond modularity, this is a separate function to preserve the scope of intraNode for the ajax call.

		jQuery.ajax({
			url: intraNode.apiURL,
			dataType: intraNode.sameServer ? 'json' : 'jsonp',
			data: {
				action: 'query',
				prop: 'categories',
				titles: intraNode.pageTitle,
				format: 'json'
			},
/*			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of ajax call: "+url);
			},
*/			success: function(data, textStatus, jqXHR) {
				self.wikiPageCheckHandler(data, textStatus, jqXHR, intraNode);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Error fetching inside visitNode - AJAX request (query page). jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
			}
		});
	}
	
	VikiJS.prototype.wikiPageCheckHandler = function(data, textStatus, jqXHR, originNode) {
		var self = this;

		if(data.query.pages["-1"]) {
			// check if the page is nonexistent
			originNode.nonexistentPage = true;
			originNode.info = self.formatNodeInfo(originNode.pageTitle, true);
			self.redraw(true);	
		}
		else {
			// get the categories
			page = data.query.pages[ Object.keys(data.query.pages)[0] ];
			if(page.categories) {
				// if originNode doesn't already have a categories array, make one
				if(!originNode.categories)
						originNode.categories = new Array();

				for(var i = 0; i < page.categories.length; i++) {
					categoryTitle = page.categories[i].title;
					// the category title is of the form "Category:Foo" so must remove the "Category:" part
					categoryTitle = categoryTitle.replace("Category:", "");
					self.log("Found the category called: " +categoryTitle);
					originNode.categories.push(categoryTitle);
				}
			}
		}
	}
	
	VikiJS.prototype.indexOfWiki = function(url) {
		var self = this;
		for(var i = 0; i < self.allWikis.length; i++)
			if(url.indexOf(self.allWikis[i]["contentURL"]) != -1)
				return i;
		return -1;
	}
	
	VikiJS.prototype.searchableWikiIndexForName = function(wikiTitle) {
		var self = this;
		
		for(var i = 0; i < self.allWikis.length; i++)
			if(self.allWikis[i].wikiTitle === wikiTitle)
				return i;
		
		return null;
	}
	
	VikiJS.prototype.formatNodeInfo = function(name, isNonexistentPage) {
		var self = this;
		var info;
		if(isNonexistentPage)
			info = "<h4 id='vikijs-header'>" + name + " (Page Does Not Exist) </h4>";
		else
			info = "<h4 id='vikijs-header'>" + name + "</h4>";
		return info;
	}

	VikiJS.prototype.displayNodeInfo = function(node) {
		var self = this;
		
		if (self.SelectedNode !== node.index) {
			return;
		}
		jQuery("#" + self.DetailsDiv).html(node.info);
		if(node.nonexistentPage)
			return;
		if (node.type == self.WIKI_PAGE_TYPE) {
			var buttons = " <a href='" + node.URL +
				"' target='_blank'><img src='" + self.ImagePath +
				"info.png' /></a>";
			if (!node.elaborated && node.searchable)	// only show the + for searchable nodes
				buttons += " <a id = "+node.index+" class='icon elaborate'><img src= '"+ self.ImagePath+"plus.png' /></a>";
			var h4 = jQuery("#" + self.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);

		} 
		else if(node.type == self.EXTERNAL_PAGE_TYPE) {
			var buttons = " <a href='" + node.URL +
				"' target='_blank'><img src='" + self.ImagePath +
				"info.png' /></a>";
			var h4 = jQuery("#" + self.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		}
		$(".elaborate").click(function() {
			self.elaborateNodeAtIndex(this.id);
			self.redraw(true);
		});
	}
	
	VikiJS.prototype.showNewNodesWindow = function() {
		var self = this;


		var style = "\
<style>\
	#MultiWikiSearch {\
		font-family: sans-serif;\
		font-size: 0.8em;\
		padding: 1.25em 1.5em 1.5em 1.25em;\
	}\
</style>\
";

		var mws;

		content = vex.dialog.open({
			message: "Search For Nodes",
			contentCSS: {
				"width" : "750px"
			},
			afterOpen: function($vexContent) {
				mws = new MultiWikiSearch("addNodes", self.myApiURL);
				mws.showSnippets(false);
				mws.initializeMWS(".vex-dialog-input");
				$vexContent.append(style);
			},
			input: null,
			callback: function(data) {
				self.closeNewNodesWindowCallback(mws.searchResultNodes);
			}
		});

	}
	
	VikiJS.prototype.closeNewNodesWindowCallback = function(nodes) {
		
		for(var i = 0; i < nodes.length; i++)
			if(nodes[i].checked) {
				self.log(nodes[i].pageTitle+" from wiki "+nodes[i].wikiTitle+" should be added to graph");
				self.addWikiNodeFromWiki(nodes[i].pageTitle, nodes[i].wikiTitle);
			}
			
		self.redraw(true);		
	}
	
	VikiJS.prototype.replaceAt = function(string, index, character) {
		return string.substr(0, index) + character + string.substr(index+character.length);
	}

	VikiJS.prototype.callHooks = function(hookName, parameters) {
		var self = this;
		if(this.hasHooks) {
			if(this.Hooks[hookName]) {
				self.log("About to call hooks for "+hookName+"...");
				for(var i = 0; i < self.Hooks[hookName].length; i++) {
					window[ self.Hooks[hookName][i] ](self, parameters, hookName);
				}
				self.log("Done with hooks for "+hookName);
				
				self.redraw(true);
				return true;
			}
		}
		return false;
	}

	VikiJS.prototype.hookCompletion = function(hookName, parameters) {
		var self = this;
		// let VikiJS know that the hook was completed, so VikiJS can perform actions if needed.
		if(hookName === "GetAllWikisHook") {
			self.fetchContentNamespaces();
		}
	}

	VikiJS.prototype.menu = function() {
		var self = this;
		self.Force.stop();
		// find the node according to the index and set it locally
		var node = self.findNode('index', this.SelectedNode);
		//var node = this.findNode('index',this.SelectedNode, this);
		// create a json object to store the variable settings
		var freeze = {
			toggle : "",
			fix : false
		};
		
		// if the node has been fixed, then display "unfreeze" as a menu
		// option and if unfreeze is selected, unfreeze the node
		// note: the weird syntax here is due to some strange issue with
		// node.fixed taking on integer values instead of true/false
		// after they have been moused over at some point.

		freeze.fix = node.fix ? false : true;
		freeze.toggle = node.fix ? "Unfreeze" : "Freeze";

		// set the title of the menu to the name
		$('#name-'+this.ID).html(node.displayName);
		// toggle the menu option between freeze and unfreeze
		$('.freeze-'+this.ID).html(freeze.toggle);
		// toggle the project on staff and projects 
		$('.elaborate-'+this.ID).html("Elaborate");
		// the actual menu code
        $('.node-'+this.ID).contextMenu('menu-'+this.ID, {
        	// activate before the menu shows
        	onShowMenu: function(e, menu) {
		        if (node.elaborated || node.type === self.EXTERNAL_PAGE_TYPE || node.nonexistentPage) {
		          $('.elaborate-'+self.ID, menu).remove();
		        }
		        if(node.nonexistentPage) {
		        	$('#getinfo', menu).remove();
		        }
		        return menu;
	      	},
	      	// activate after the menu shows
	      	onExitMenu: function(e,menu) {
	      		self.Force.start();
	      	},
	      	// style the menu
	      	itemStyle: {
		        fontFamily : 'Trebuchet MS',
		        backgroundColor : '#EEEEEE',
	        },
			bindings: {
		        'freeze': function(t) {
		        	self.log("freeze() clicked");
		        	// freeze/unfreeze the node
					node.fixed = freeze.fix;
					// store these settings in the metadata
					node.fix = freeze.fix;
		        },
		        'getinfo': function(t) {
		        	self.log("getInfo() clicked");
		        	window.open(node.URL, "_blank");
		        },
		        'elaborate': function(t) {

		        	self.log("elaborate() clicked");
					self.elaborateNodeAtIndex(self.SelectedNode);
					// self.elaborateNode(node);
					// self.indexReset();
					// self.redraw(true);
		        },
		        'hide': function(t) {
		        	// when hide is selected, call the hide function
					//self.hide(node);
					self.log("hide() clicked");
		        },
		        'showall': function(t) {
		        	// when Show All is selcted, call the showAll function
					//self.showAll();
					self.log("showAll() clicked");
		        }
	        }
		});
	}

	VikiJS.prototype.log = function(text) {
		if( (window['console'] !== undefined) )
			console.log( text );
	}
}

