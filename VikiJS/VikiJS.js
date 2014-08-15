/*
 * Copyright (c) 2014 The MITRE Corporation
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

window.VIKI = (function(my) {
	my.VikiJS = function() {

		/****************************************************************************************************************************
		 * Global Constants. Note: all colors except "LIGHT_BLUE" are from flatuicolors.com
		 ****************************************************************************************************************************/
		this.ID = null;
		this.loadingView = null;
		this.WIKI_PAGE_TYPE = 0;
		this.EXTERNAL_PAGE_TYPE = 1;
		this.MAX_BAR_WIDTH = 60;
		this.BAR_HEIGHT = 6;
		this.UNSELECTED_IMAGE_DIMENSION = 25;
		this.THIS_WIKI = "THIS WIKI";
		this.MIN_SCALE = .2;
		this.MAX_SCALE = 5;
		this.LINK_OPACITY = 0.2;
		this.HUB_LINK_LENGTH = 400;
		this.LEAF_LINK_LENGTH = 150;
		this.AMETHYST_COLOR = "#9b59b6";
		this.PETER_RIVER_COLOR = "#3498db";
		this.EMERALD_COLOR = "#2ecc71";
		this.SUNFLOWER_COLOR = "#f1c40f";
		this.LIGHT_BLUE = "#23a4ff";	
		this.INCOMING_LINK_COLOR = this.PETER_RIVER_COLOR;
		this.OUTGOING_LINK_COLOR = this.SUNFLOWER_COLOR;
		this.BIDIRECTIONAL_LINK_COLOR = this.EMERALD_COLOR;

		/****************************************************************************************************************************
		 * Mutable Global Variables
		 ****************************************************************************************************************************/
		this.CURRENT_IDENTIFIER = 0;
		this.searchableCount = 0;
		this.contentNamespacesFetched = 0;
		this.initialPageTitles = null;
		this.Hooks = null;
		this.hasHooks = false;
		this.GraphDiv = null;
		this.SubDetailsDiv = null;
		this.ErrorsDiv = null;
		this.SliderDiv = null;
		this.SelectedNodeIndex = null;
		this.Nodes = new Array();
		this.Links = new Array();
		this.LinkMap = {};
		this.HiddenNodes = new Array();
		this.HiddenLinks = new Array();
		this.Force = null;
		this.LinkSelection = null;
		this.NodeSelection = null;
		this.ImagePath = null;
		this.Zoompos = 1; // to store values for zoom scale	
		this.serverURL = mw.config.get("wgServer");;
		this.myApiURL = this.serverURL + mw.config.get("wgScriptPath")+"/api.php";
		this.allWikis = new Array();

		var self = this;


		/****************************************************************************************************************************
		 * Initialization Functions
		 ****************************************************************************************************************************/

		my.VikiJS.prototype.initialize = function(pageTitles, divs, parameters) {
			var self = this;

			// Parse passed in parameters and initialize div settings.
			// this.ID = this graph div's ID (support for multiple VIKI graphs on one page in the future)
			allDivs = jQuery.parseJSON(divs);
			allParameters = jQuery.parseJSON(parameters);

			this.GraphDiv = allDivs[0];
			this.SubDetailsDiv = allDivs[1];
			this.SliderDiv = allDivs[2];
			this.ErrorsDiv = allDivs[3];
			this.ID = this.GraphDiv.match( new RegExp("[0-9]", 'g') )[0];
			this.INITIAL_WIDTH = allParameters["width"];
			this.INITIAL_HEIGHT = allParameters["height"];
			this.height = self.INITIAL_HEIGHT;
			this.width = self.INITIAL_WIDTH;
			this.Hooks = allParameters["hooks"];
			this.hasHooks = (self.Hooks != null);
			this.serverURL = mw.config.get("wgServer");
			this.ImagePath = allParameters["imagePath"];
			this.initialPageTitles = jQuery.parseJSON(pageTitles);

			if(this.initialPageTitles === null) {
				alert("You must supply a page title.");
				return;
			}

			myLogoURL = allParameters["logoURL"];

			// Add this wiki's data to self.allWikis first.
			thisWikiData = {
				wikiTitle : this.THIS_WIKI,
				apiURL : this.myApiURL,
				contentURL : this.serverURL + mw.config.get("wgScript") + "/",
				logoURL : myLogoURL,
				searchableWiki : true
			}

			self.allWikis.push(thisWikiData);

			// Set up the slider div.
			initializeSliderDiv();

			// Set up the error div.
			initializeErrorDiv();

			// Set up the loading spinner
			initializeLoadingSpinner();

			// Set up the context menu.
			initializeContextMenu();

			// Set up the "Add Nodes" button to bring up the nodes modal view.
			$("#addNodesButton").click(function() {
				setTimeout(function() {
					var newNodesWindow = self.showNewNodesWindow();
				}, 0);
			});

			// Initialize the D3 graph.
			initializeGraph();

			// End of initialization; call the GetAllWikis hook at this point.

			calledGetAllWikisHook = this.callHooks("GetAllWikisHook", []);
			if(!calledGetAllWikisHook)
				self.hookCompletion("GetAllWikisHook");

			// Initialization functions

			function initializeSliderDiv() {
				// The details div gets 3/5 of the space, while the slider gets 2/5.
				// The detail-panel width is equal to the input width - size of paddings.
				var margin = 10;
				$("#"+self.SubDetailsDiv).width((self.width - margin)* 3/5);
				$("#"+self.SliderDiv).width((self.width - margin) * 2/5);
				$(".vikijs-detail-panel").width(self.width - margin);
				// create a new zoom slider
				var zoom_slider = $("#"+self.SliderDiv).slider(
				{
				  orientation: "horizontal",//make the slider horizontal
				  min: self.MIN_SCALE , // set the lowest value
				  max: self.MAX_SCALE, // set the highest value
				  step: .001, // set the value for each individual increment
				  value: self.Zoompos, // set the starting value
				  slide: function( event, ui ) {
					// set the zoom scale equal to the current value of the slider
					// which is the current position
				        self.Zoompos = ui.value;
					// call the slide function to zoom/pan using the slider
				        self.slide();
				  }
				});
			}

			function initializeErrorDiv() {
				$("#"+self.ErrorsDiv).append("<p><strong>Error:</strong></p>");
			}

			function initializeLoadingSpinner() {
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
			}

			function initializeContextMenu() {
				// Ensure the entire graph div doesn't trigger context menu - only nodes.
				foo = $('#'+self.GraphDiv);
				$('#'+self.GraphDiv).on('contextmenu', function() {
					return false;
				});

				$('body').append(
					"<div class=\"contextMenu\" id=\"menu-"+self.ID+"\"><ul>"+
					// the dynamic menu title (node name)
					"<li id=\"name-"+self.ID+"\"  class=\"header\" style=\"text-align: center; font-weight: bold;\">Name</li>"+
					"<hr>"+ // separator
					// actual navigable menu
					"<div class=\"options\" >"+
					"<li id=\"freeze\" class=\"freeze-"+self.ID+"\">Freeze</li>"+
		        	"<li id=\"getinfo\" >Visit Page</li>"+
					"<li id=\"elaborate\" class=\"elaborate-"+self.ID+"\">Elaborate</li>"+
					"<li id=\"categories\">Show Categories</li>"+
					"<li id=\"hide\">Hide Node</li>"+
					"<li id=\"hideHub\">Hide Hub</li>"+
					"<hr>"+// separator
		        	"<li id=\"showall\">Show All</li>"+
			    	"</ul></div></div>"
					);
				
				$("#name").css("text-align", "center");
			}

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

				svg.append("svg:rect")
				   .attr("id", self.ID)
				   .attr("width", self.width)
				   .attr("height", self.height)
				   .attr("fill", "white");

				svg.append("svg:g")
				   .attr("id", "moveable-"+self.ID);

				defs = svg.append("defs");

				defs.append("marker")
				   .attr("id", "arrowHeadOutgoing")
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
				   .attr("id", "arrowHeadIncoming")
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
				   .attr("id", "arrowHeadBidirectional")
				   .attr("viewBox", "0 -8 20 20")
				   .attr("refX", 16)
				   .attr("refY", 0)
				   .attr("markerWidth", 12)
				   .attr("markerHeight", 12)
				   .attr("markerUnits", "userSpaceOnUse")
				   .attr("orient", "auto")
				   .attr("fill", self.BIDIRECTIONAL_LINK_COLOR)
				   .attr("stroke-width", "2")
				.append("path")
				   .attr("d", "M0,-8L20,0L0,8");

				defs.append("marker")
				   .attr("id", "arrowHeadBlack")
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

				defs.append("marker")
				   .attr("id", "backArrowHeadBidirectional")
				   .attr("viewBox", "-20 -8 20 20")
				   .attr("refX", -16)
				   .attr("refY", 0)
				   .attr("markerWidth", 12)
				   .attr("markerHeight", 12)
				   .attr("markerUnits", "userSpaceOnUse")
				   .attr("orient", "auto")
				   .attr("fill", self.BIDIRECTIONAL_LINK_COLOR)
				   .attr("stroke-width", "2")
				.append("path")
				   .attr("d", "M0,-8L-20,0L0,8");

				defs.append("marker")
				   .attr("id", "backArrowHeadBlack")
				   .attr("viewBox", "-20 -8 20 20")
				   .attr("refX", -16)
				   .attr("refY", 0)
				   .attr("markerWidth", 12)
				   .attr("markerHeight", 12)
				   .attr("markerUnits", "userSpaceOnUse")
				   .attr("orient", "auto")
				   .attr("fill", "black")
				   .attr("stroke-width", "2")
				.append("path")
				   .attr("d", "M0,-8L-20,0L0,8");

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
		
		my.VikiJS.prototype.fetchContentNamespaces = function() {
			var self = this;
			
			actuallySearchableWikis = self.allWikis.filter(function(wiki) {
				return wiki.searchableWiki;
			});
			
			self.searchableCount = actuallySearchableWikis.length;

			if(self.searchableCount == 0) {
				self.populateInitialGraph();
			}
			else
				for(var i = 0; i < actuallySearchableWikis.length; i++) {
					self.getContentNamespacesForWikiAtIndex(actuallySearchableWikis, i);
			}
		}
		
		my.VikiJS.prototype.getContentNamespacesForWikiAtIndex = function(actuallySearchableWikis, index) {
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
				timeout: 5000,
				beforeSend: function (jqXHR, settings) {
					url = settings.url;
				},
				success: function(data, textStatus, jqXHR) {
					if(data["error"] && data["error"]["code"] && data["error"]["code"]=== "unknown_action") {
						actuallySearchableWikis[index].contentNamespaces = [0];
					}
					else {
						actuallySearchableWikis[index].contentNamespaces = data["getContentNamespaces"];
					}
				
					self.contentNamespacesFetched++;
					if(self.contentNamespacesFetched == self.searchableCount) {
						self.populateInitialGraph();				
					}

				},
				error: function(jqXHR, textStatus, errorThrown) {
					if(errorThrown === 'timeout') {
						// do something about this error, but then increment contentNamespacesFetched so it can continue to work.
						// default to just NS 0 (main).
						self.showError("Timeout for content namespace fetch for "+wikiTitle+". Defaulting to NS 0 (main).");
						actuallySearchableWikis[index].contentNamespaces = [0];
						self.contentNamespacesFetched++;
						if(self.contentNamespacesFetched == self.searchableCount) {
							self.populateInitialGraph();				
						}
					}
					else {
						alert("Error fetching inside getContentNamespacesForWikiAtIndex for "+wikiTitle+" - AJAX request. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
					}
				}
			});
		
		}
		
		my.VikiJS.prototype.populateInitialGraph = function() {
			var self = this;
			
			vex.close(self.loadingView.data().vex.id);

			for(var i = 0; i < self.initialPageTitles.length; i++) {
				node = self.addWikiNodeFromWiki(self.initialPageTitles[i], self.THIS_WIKI)
				self.visitNode(node);
			}

			for(var i = 0; i < self.initialPageTitles.length; i++)
				self.elaborateNode(self.Nodes[i]);

			self.Force.nodes(self.Nodes);
			self.Force.links(self.Links);

			self.redraw(true);

			// after initial population, by default select the first node.
			self.SelectedNodeIndex = 0;
			self.displayNodeInfo(self.Nodes[0]);
			self.redraw(false);
			
		}

		/****************************************************************************************************************************
		 * Graph Display and D3 Functions
		 ****************************************************************************************************************************/

		 my.VikiJS.prototype.redraw = function(restartGraph) {
			var self = this;

			self.NodeSelection =
				self.NodeSelection.data(self.Nodes, function(d) { return d.identifier});
			self.LinkSelection =
				self.LinkSelection.data(self.Links);


			var newNodes = self.NodeSelection.enter().append("svg:g");

			self.NodeSelection.exit().remove();
			self.LinkSelection.exit().remove();

			newNodes.attr("class", "node-"+this.ID);
			newNodes.on("click", function(d) {
				self.SelectedNodeIndex = d.index;
				self.displayNodeInfo(d);
				self.redraw(false);
			});
			newNodes.on("dblclick", function(d) {
				d.fixed = !d.fixed;
			});

			newNodes.on("contextmenu", function(d) {
				self.SelectedNodeIndex = d.index;
				self.redraw(false);
			});

			self.prepareContextMenu();

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
				return d.index == self.SelectedNodeIndex ? "bold" : "normal";
			});
			texts.attr("fill", function(d) {
				// return d.nonexistentPage ? "red" : "black";
				if(d.nonexistentPage)
					return "red";
				else if(!d.searchable)
					return "grey";
				else
					return "black";
			});

			var newImages = newNodes.append("svg:image");
			newImages.attr("class", "icon");


			var allImages = self.NodeSelection.selectAll(".icon");

			allImages.attr("xlink:href", function(d) {
				// go through the hierarchy of possible icons in order of preference
				// Hook Icons > Site Logo Icons > External Node Icons > info.png
				
				if(d.hookIconURL)
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

			var newLinks = self.LinkSelection.enter().append("svg:line");
			newLinks.attr("class", "link-"+this.ID);
			self.LinkSelection.style("stroke-width", function(d) {
				if (typeof d.source.index !== 'undefined') {
					return d.source.index == self.SelectedNodeIndex ||
						d.target.index == self.SelectedNodeIndex ? 2 : 1;
				} else {
					return d.source == self.Nodes[self.SelectedNodeIndex] ||
						d.target == self.Nodes[self.SelectedNodeIndex] ? 2 : 1;
				}
			});
			self.LinkSelection.style("opacity", function(d) {
				if (typeof d.source.index !== 'undefined') {
					return d.source.index == self.SelectedNodeIndex ||
						d.target.index == self.SelectedNodeIndex ? 1 : self.LINK_OPACITY;
				} else {
					return d.source == self.Nodes[self.SelectedNodeIndex] ||
						d.target == self.Nodes[self.SelectedNodeIndex] ? 1 : self.LINK_OPACITY;
				}
			});
			self.LinkSelection.style("stroke", function(d) {
				if(typeof d.source.index !== 'undefined') {
					if(d.source.index == self.SelectedNodeIndex)
						return d.bidirectional? self.BIDIRECTIONAL_LINK_COLOR : self.OUTGOING_LINK_COLOR;
					else if(d.target.index == self.SelectedNodeIndex)
						return d.bidirectional ? self.BIDIRECTIONAL_LINK_COLOR : self.INCOMING_LINK_COLOR;
					else return "black";
				}
				else {
					if(d.source == self.Nodes[self.SelectedNodeIndex])
						return d.bidirectional ? self.BIDIRECTIONAL_LINK_COLOR : self.OUTGOING_LINK_COLOR;
					else if(d.target == self.Nodes[self.SelectedNodeIndex])
						return d.bidirectional ? self.BIDIRECTIONAL_LINK_COLOR : self.INCOMING_LINK_COLOR;
					else return "black";
				}
				
			});
			self.LinkSelection.attr("marker-end", function(d) {
				if(typeof d.source.index !== 'undefined') {
					if(d.source.index == self.SelectedNodeIndex)
						return d.bidirectional ? "url(#arrowHeadBidirectional)" : "url(#arrowHeadOutgoing)";
					else if(d.target.index == self.SelectedNodeIndex)
						return d.bidirectional ? "url(#arrowHeadBidirectional)" : "url(#arrowHeadIncoming)";
					else return "url(#arrowHeadBlack)";
				}
				else {
					if(d.source == self.Nodes[self.SelectedNodeIndex])
						return d.bidirectional ? "url(#arrowHeadBidirectional)" : "url(#arrowHeadOutgoing)";
					else if(d.target == self.Nodes[self.SelectedNodeIndex])
						return d.bidirectional ? "url(#arrowHeadBidirectional)" : "url(#arrowHeadIncoming)";
					else return d.bidirectional ? "url(#arrowHeadBidirectional)" : "url(#arrowHeadBlack)";
				}
			});

			self.LinkSelection.attr("marker-start", function(d) {
				if(d.bidirectional) {
					if(typeof d.source.index !== 'undefined') {
						return d.source.index == self.SelectedNodeIndex || d.target.index == self.SelectedNodeIndex ? "url(#backArrowHeadBidirectional)" : "url(#backArrowHeadBlack)";
					}
					else {
						return d.source == self.Nodes[self.SelectedNodeIndex] || d.target == self.Nodes[self.SelectedNodeIndex] ? "url(#backArrowHeadBidirectional)" : "url(#backArrowHeadBlack)";
					}
				}
			});

			if (restartGraph) {
				self.Force.start();
			}

		}

		my.VikiJS.prototype.prepareContextMenu = function() {
	        $('.node-'+self.ID).contextMenu('menu-'+this.ID, {
	        	// activate before the menu shows
	        	onShowMenu: function(e, menu) {
					self.Force.stop();
					// find the node according to the index and set it locally
					var node = self.findNode('index', self.SelectedNodeIndex);
					if(typeof node.fix === 'undefined')
						node.fix = false;
					//var node = this.findNode('index',this.SelectedNodeIndex, this);
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
					$('#name-'+self.ID).html(node.displayName);
					// toggle the menu option between freeze and unfreeze
					$('.freeze-'+self.ID).html(node.fix ? 'Unfreeze' : 'Freeze');
					// the actual menu code


			        if (node.elaborated || node.type === self.EXTERNAL_PAGE_TYPE || node.nonexistentPage || (node.type === self.WIKI_PAGE_TYPE && !node.searchable)) {
			          $('.elaborate-'+self.ID, menu).remove();
			        }
			        if(!node.elaborated)
			        	$('#hideHub', menu).remove();
			        if(node.nonexistentPage) {
			        	$('#getinfo', menu).remove();
			        	$('#categories', menu).remove();
			        }
			        if(node.type == self.EXTERNAL_PAGE_TYPE)
			        	$('#categories', menu).remove();

			        return menu;
		      	},
		      	// activate after the menu shows
		      	onExitMenu: function(e,menu) {
		      		self.Force.start();
		      	},
		      	// style the menu
		      	itemStyle: {
			        fontFamily : 'sans serif',
			        fontSize: '13px',
			        backgroundColor : '#FFFFFF',
		        },
				bindings: {
			        'freeze': function(t) {
			        	node = d3.select(t).datum();

						if(typeof node.fix === 'undefined')
							node.fix = false;

						node.fixed = !node.fix;
						node.fix = !node.fix;
			        },
			        'getinfo': function(t) {
			        	node = d3.select(t).datum();
			        	window.open(node.URL, "_blank");
			        },
			        'elaborate': function(t) {
						self.elaborateNodeAtIndex(self.SelectedNodeIndex);
			        },
			        'categories': function(t) {
			        	node = d3.select(t).datum();

			        	var categories = "Categories: ";
			        	for(var i = 0; i < node.categories.length; i++) {
			        		categories+= node.categories[i]+", ";
			        	}
			        	if(node.categories.length == 0) {
			        		categories += "No categories";
			        	}
			        	else {
				        	categories = categories.substring(0, categories.length-2);
				        }
			        	alert(categories);
			        },
			        'hide': function(t) {
			        	node = d3.select(t).datum();

						self.hideNodeAndRedraw(node);
			        },
			        'hideHub': function(t) {
			        	node = d3.select(t).datum();

			        	self.hideHub(node);
			        },
			        'showall': function(t) {
						self.showAllNodes();
			        }
		        }
			});

		}

		my.VikiJS.prototype.slide = function() {	
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

		my.VikiJS.prototype.interpolateZoom = function(translate, scale) {
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

		my.VikiJS.prototype.zoomed = function() {
			var self = this;
			// access the element movable and move to the scale and translation vectors
			d3.select("#moveable-"+this.ID).attr("transform",
			        "translate(" + self.zoom.translate() + ")" +
			        "scale(" + self.zoom.scale() + ")"
			    );
		}

		my.VikiJS.prototype.redrawZoom = function() {		
			self.Zoompos = d3.event.scale;
			d3.select("#moveable-"+self.ID).attr("transform", "translate("+d3.event.translate+")" + " scale("+self.Zoompos+")");
			// if you scroll via a scrollwheel inside the graph, then set the slider to the current scale 
			$("#"+self.SliderDiv).slider("value",self.Zoompos);
		}

		my.VikiJS.prototype.displayNodeInfo = function(node) {
			var self = this;
			
			if (self.SelectedNodeIndex !== node.index) {
				return;
			}

			var info = "<h4 id='vikijs-header'>";

			info += node.fullDisplayName;

			if(node.nonexistentPage)
				info += " (Page Does Not Exist)";
			if(node.type == self.WIKI_PAGE_TYPE && !node.searchable)
				info += " (Unsearchable Wiki)";

			info += "</h4>";

			jQuery("#"+self.SubDetailsDiv).html(info);
		}
		
		my.VikiJS.prototype.visitNode = function(intraNode) {
			var self = this;
			// note: beyond modularity, this is a separate function to preserve the scope of intraNode for the ajax call.

			self.callHooks("BeforeVisitNodeHook", [intraNode]);

			if(intraNode.visited)
				return;

			jQuery.ajax({
				url: intraNode.apiURL,
				dataType: intraNode.sameServer ? 'json' : 'jsonp',
				data: {
					action: 'query',
					prop: 'categories',
					titles: intraNode.pageTitle,
					format: 'json'
				},
				beforeSend: function (jqXHR, settings) {
					url = settings.url;
				},
				success: function(data, textStatus, jqXHR) {
					wikiPageCheckSuccessHandler(data, textStatus, jqXHR, intraNode);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("Error fetching inside visitNode - AJAX request (query page). jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
				}
			});

			function wikiPageCheckSuccessHandler(data, textStatus, jqXHR, originNode) {

				if(data.query.pages["-1"]) {
					// check if the page is nonexistent
					originNode.nonexistentPage = true;
					self.redraw(true);	
				}
				else {
					// if originNode doesn't already have a categories array, make one
					if(!originNode.categories)
							originNode.categories = new Array();

					// get the categories
					page = data.query.pages[ Object.keys(data.query.pages)[0] ];
					if(page.categories) {

						for(var i = 0; i < page.categories.length; i++) {
							categoryTitle = page.categories[i].title;
							// the category title is of the form "Category:Foo" so must remove the "Category:" part
							categoryTitle = categoryTitle.replace("Category:", "");
							originNode.categories.push(categoryTitle);
						}
					}
				}

				originNode.visited = true;
			}
		}

		/****************************************************************************************************************************
		 * Node Management Methods
		 ****************************************************************************************************************************/
		
		my.VikiJS.prototype.addExternalNode = function(url) {
			var self = this;

			node = self.newNode();
			shortURL = url.replace("http://", "").replace("https://", "").replace("www.", "");
			node.displayName = (shortURL.length < 15 ? shortURL : shortURL.substring(0,15)+"...");
			node.fullDisplayName = url;
			node.type = self.EXTERNAL_PAGE_TYPE;
			node.URL = url;
			node.externalNodeIconURL = self.ImagePath + "internet.png";
			self.addNode(node);

			self.callHooks("NewExternalNodeAddedHook", [node]);
			return node;
		}

		my.VikiJS.prototype.addWikiNodeFromWiki = function(pageTitle, wikiTitle) {
			var self = this;
			
			index = self.searchableWikiIndexForName(wikiTitle);
			var wiki = self.allWikis[index];
			url = wiki.contentURL + (pageTitle.split(" ").join("_"));

			return self.addWikiNode(pageTitle, url, wiki);
		}

		my.VikiJS.prototype.addWikiNodeFromExternalLink = function(url, wikiIndex) {
			var self = this;

			pageTitle = url.replace(self.allWikis[wikiIndex]["contentURL"], "").split("_").join(" ");
			var wiki = self.allWikis[wikiIndex];

			return self.addWikiNode(pageTitle, url, wiki);
		}

		my.VikiJS.prototype.addWikiNode = function(pageTitle, url, wiki) {
			node = self.newNode();
			node.pageTitle = pageTitle;
			node.displayName = pageTitle;
			node.fullDisplayName = node.displayName;
			node.type = self.WIKI_PAGE_TYPE;
			node.URL = url;
			node.wikiIndex = index;
			node.apiURL = wiki.apiURL;
			node.contentURL = wiki.contentURL;
			node.logoURL = wiki.logoURL;
			node.searchable = wiki.searchableWiki;
			node.sameServer = node.contentURL.indexOf(self.serverURL) > -1;	// if the node's content URL contains my server, it should have the same server
			node.wikiTitle = wiki.wikiTitle;
			
			self.addNode(node);

			self.callHooks("NewWikiNodeAddedHook", [node]);
			
			return node;
		}

		my.VikiJS.prototype.newNode = function() {
			var self = this;

			var node = {
				elaborated: false,
				fixed: false,
				hidden: false
			};
			return node;
		}

		my.VikiJS.prototype.findNode = function(property, value) {
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

			for(var i = 0; i < self.HiddenNodes.length; i++) {
				if(property === 'pageTitle') {
					// a specific check for page titles - the first letter is case insensitive
					var oldString = self.HiddenNodes[i][property];
					if(oldString) {
						var newString = self.replaceAt(oldString, oldString.indexOf(":")+1, oldString.charAt(oldString.indexOf(":")+1).toLowerCase());
						var newValue = self.replaceAt(value, value.indexOf(":")+1, value.charAt(value.indexOf(":")+1).toLowerCase());
						if(newString === newValue)
							return self.HiddenNodes[i];
					}
				}
				else if (typeof self.HiddenNodes[i][property] !== 'undefined' && self.HiddenNodes[i][property] === value) {
					return self.HiddenNodes[i];
				}
			}
			return null;
		}

		my.VikiJS.prototype.addNode = function(node) {
			var self = this;

			node.identifier = self.CURRENT_IDENTIFIER;
			self.CURRENT_IDENTIFIER++;
			self.Nodes.push(node);
			if (self.Nodes.length == 1) {
				self.SelectedNodeIndex = 0;
			}
		}

		my.VikiJS.prototype.addLink = function(node1, node2) {
			var self = this;

			var link = {
				source: node1,
				target: node2,
				bidirectional: false
			};
			self.Links.push(link);
			self.LinkMap[node1.identifier + "," + node2.identifier] = link;
			self.LinkMap[node2.identifier + "," + node1.identifier] = link;
			return link;
		}

		my.VikiJS.prototype.findLink = function(from, to) {
			var self = this;
			var link = self.LinkMap[from + "," + to];
			if (typeof link === 'undefined') {
				return null;
			}
			return link;
		}

		/****************************************************************************************************************************
		 * Graph Modification Methods
		 ****************************************************************************************************************************/

		my.VikiJS.prototype.elaborateNode = function(node) {
			var self = this;
			if(node.type === self.WIKI_PAGE_TYPE)
				self.elaborateWikiNode(node);
			// if node is a non-wiki page, there is no way to elaborate it.
		}
		my.VikiJS.prototype.elaborateNodeAtIndex = function(index) {
			var self = this;
			var node = self.Nodes[index];
			if(node.type == self.WIKI_PAGE_TYPE)
				self.elaborateWikiNode(node);
		}
		my.VikiJS.prototype.elaborateWikiNode = function(node) {
			var self = this;

			// 1. Get external links OUT from page.

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
				},
				success: function(data, textStatus, jqXHR) {
					externalLinksSuccessHandler(data, textStatus, jqXHR, node);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("Error fetching inside elaborateWikiNode - AJAX request (external links OUT). jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
				}
			});
			
			// 2. Get intra-wiki links OUT from page.
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
				},
				success: function(data, textStatus, jqXHR) {
					intraWikiOutSuccessHandler(data, textStatus, jqXHR, node);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("Error fetching inside elaborateWikiNode - AJAX request (intra-wiki links OUT). jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
				}
			});
			// 3. Get intra-wiki links IN to this page.
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
				},
				success: function(data, textStatus, jqXHR) {
					intraWikiInSuccessHandler(data, textStatus, jqXHR, node);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert("Error fetching inside elaborateWikiNode - AJAX request (intra-wiki links IN). jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
				}
			});
			node.elaborated = true;
			self.displayNodeInfo(node);

			function externalLinksSuccessHandler(data, textStatus, jqXHR, originNode) {

				var externalLinks = data.query.pages[ Object.keys(data.query.pages)[0] ]["extlinks"];
				if(externalLinks) {
					var newExternalNodes = [];
					for(var i = 0; i < externalLinks.length; i++) {
						// some of these external links are actually links to other searchable wikis.
						// these should be recognized as wiki nodes, not just external nodes.

						var thisURL = externalLinks[i]["*"];

						// index of the searchable wiki in list of searchable wikis, or -1 if this is not a searchable wiki page.
						var index = self.indexOfWikiForURL(externalLinks[i]["*"]);
						// handle the case where the URL has the form "index.php?title=..." rather than "index.php/..."
						var alternativeIndex = self.indexOfWikiForURL( thisURL.replace("?title=", "/") );

						isWikiPage = (index != -1 || alternativeIndex !=-1);

						if(isWikiPage) {
							// if "index.php?title=..." form was used, swap it with "index.php/..." form.
							if(alternativeIndex != -1) {  
								thisURL = thisURL.replace("?title=", "/");
								index = alternativeIndex;
							}

							externalNode = null;
							externalWikiNode = self.findNode("URL", thisURL);
							if(!externalWikiNode) {
									externalWikiNode = self.addWikiNodeFromExternalLink(thisURL, index);	
							}
							if(externalWikiNode.hidden) {
								self.unhideNode(externalWikiNode.identifier);
							}
							var link = self.findLink(originNode.identifier, externalWikiNode.identifier);
							if(!link)
								link = self.addLink(originNode, externalWikiNode);
							else {
								link.bidirectional = true;
							}
							
							self.visitNode(externalWikiNode);
						}
						else {
							externalNode = self.findNode("URL", thisURL);
							if(!externalNode)
								externalNode = self.addExternalNode(thisURL);		
							if(externalNode.hidden) {
								self.unhideNode(externalNode.identifier);
							}
							var link = self.findLink(originNode.identifier, externalNode.identifier);
							if(!link)
								link = self.addLink(originNode, externalNode);
							else {
								link.bidirectional = true;
							}
						}
						if(externalNode)
							newExternalNodes.push(externalNode);
					}
					// now call hooks on these nodes to see if any other special way to handle it (e.g. MII Phonebook)
					self.callHooks("ExternalNodeHook", [newExternalNodes]);
				}
				self.redraw(true);
			}

			function intraWikiOutSuccessHandler(data, textStatus, jqXHR, originNode) {

				var intraLinks = data.query.pages[ Object.keys(data.query.pages)[0] ]["links"];
				if(intraLinks) {
					// get list of namespaces, or fetch with AJAX if required.

					var wiki = self.allWikis[originNode.wikiIndex];		
						
					var contentNamespaces = wiki.contentNamespaces;
					
					var newIntraOutNodes = [];
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
							if(intraNode.hidden)
								self.unhideNode(intraNode.identifier);
							var link = self.findLink(originNode.identifier, intraNode.identifier);
							if(!link) {
								link = self.addLink(originNode, intraNode);
							}
							else {
								// if the found link has this originNode as the SOURCE, this is an already known link OUT; disregard.
								// if the found link has this originNode as the TARGET, this is a NEW link out; set as bidirectional.
								if(!link.bidirectional && link.target.identifier == originNode.identifier)
									link.bidirectional = true;
							}
							// now visit the wiki page to get more info (does it exist? what categories?)
							self.visitNode(intraNode);
						}
						newIntraOutNodes.push(intraNode);
					}
					// now call hooks on these nodes
					self.callHooks("IntraOutNodeHook", [newIntraOutNodes]);
				}
				self.redraw(true);
			}

			function intraWikiInSuccessHandler(data, textStatus, jqXHR, originNode) {

				var intraLinks = data.query.backlinks;
				if(intraLinks) {
					// get list of namespaces, or fetch with AJAX if required.

					var wiki = self.allWikis[originNode.wikiIndex];				
					var contentNamespaces = wiki.contentNamespaces;
					
					var newIntraInNodes = [];
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
							if(intraNode.hidden)
								self.unhideNode(intraNode.identifier);
							var link = self.findLink(intraNode.identifier, originNode.identifier);
							if(!link)
								link = self.addLink(intraNode, originNode);	// opposite order because these are pages coming IN
							else {
								// if the found link has this originNode as the TARGET, this is an already known link IN; disregard.
								// if the found link has this originNode as the SOURCE, this is a NEW link in; set as bidirectional.
								if(!link.bidirectional && link.source.identifier == originNode.identifier)
									link.bidirectional = true;
							}
							self.visitNode(intraNode);
						}
						
						newIntraInNodes.push(intraNode);
					}
					// now call hooks on these nodes
					self.callHooks("IntraInNodeHook", [newIntraInNodes]);

				}
				self.redraw(true);
			}
		}

		my.VikiJS.prototype.hideNode = function(node) {
			var recentHiddenLinks = Array();

			// 1. Remove node from Nodes array and store into hidden nodes array.
			node.hidden = true;
			self.HiddenNodes.push(node);
			self.Nodes.splice(node.index, 1);

			// 2. Remove any associated links from Links array and store into hidden links array.
			// Also store into recentHiddenLinks so we can remove them from LinkMap.
			for(var i = self.Links.length-1; i >= 0; i--) {
				var link = self.Links[i];
				if(link.source == node || link.target == node) {
					self.HiddenLinks.push(link);
					recentHiddenLinks.push(link);
					self.Links.splice(i, 1);
				}
			}

			// 3. Remove links from LinkMap.
			var linkMapKeys = Object.keys(self.LinkMap);

			for(var i = 0; i < linkMapKeys.length; i++) {
				var linkMapKey = linkMapKeys[i].split(",");
				for(var j = 0; j < recentHiddenLinks.length; j++) {
					if(parseInt(linkMapKey[0]) == recentHiddenLinks[j].source.identifier || parseInt(linkMapKey[1]) == recentHiddenLinks[j].target.identifier) {
						delete self.LinkMap[linkMapKeys[i]];
					}
				}
			}

			// 4. Set selected node to the first node in the array (arbitrarily) to avoid possibility that the selected node index is now out of bounds!
			self.SelectedNodeIndex = 0;
			self.displayNodeInfo(self.Nodes[self.SelectedNodeIndex]);

		}

		my.VikiJS.prototype.hideNodeAndRedraw = function(node) {
			self.hideNode(node);

			self.redraw(true);
		}

		my.VikiJS.prototype.hideHub = function(node) {
			if(!node.elaborated)
				return;

			// Iterate Links to identify all nodes connected to this node which aren't connected to any others (i.e. leaf nodes).

			var nodesToRemove = new Array();
			nodesToRemove.push(node);

			for(var i = 0; i < self.Links.length; i++) {
				link = self.Links[i];
				if(link.source === node) {
					if(self.numberOfConnections(link.target) == 1)
						nodesToRemove.push(link.target);
				}
				else if(link.target === node) {
					if(self.numberOfConnections(link.source) == 1)
						nodesToRemove.push(link.source);
				}
			}

			for(var i = 0; i < nodesToRemove.length; i++) {
				self.hideNode(nodesToRemove[i]);
				self.redraw(true);
			}

			self.redraw(true);
		}

		my.VikiJS.prototype.unhideNode = function(identifier) {

			var index = -1;
			for(var i = 0; i < self.HiddenNodes.length; i++) {
				if(self.HiddenNodes[i].identifier == identifier) {
					index = i;
					break;
				}
			}
			
			if(index == -1)
				return;

			self.Nodes.push(self.HiddenNodes[index]);
			self.HiddenNodes.splice(index, 1);

			self.redraw(true);

		}

		my.VikiJS.prototype.showAllNodes = function() {
			// 1. Add all hidden nodes back into main Nodes array, then destroy hidden nodes array.

			for(var i = 0; i < self.HiddenNodes.length; i++) {
				self.Nodes.push(self.HiddenNodes[i]);
				self.HiddenNodes[i].hidden = false;
			}
			self.HiddenNodes = new Array();

			// 2. Add all hidden links back into main Links array. Also add all hidden links back into the LinkMap.
			// Then destroy hidden links array.
			for(var i = 0; i < self.HiddenLinks.length; i++) {
				link = self.HiddenLinks[i];
				self.Links.push(link);
				self.LinkMap[link.source.identifier + "," + link.target.identifier] = link;
				self.LinkMap[link.source.identifier + "," + link.target.identifier] = link;
			}

			self.HiddenLinks = new Array();

			self.redraw(true);

		}

		/****************************************************************************************************************************
		 * Helper Methods
		 ****************************************************************************************************************************/
		
		my.VikiJS.prototype.indexOfWikiForURL = function(url) {
			var self = this;
			for(var i = 0; i < self.allWikis.length; i++)
				if(url.indexOf(self.allWikis[i]["contentURL"]) != -1)
					return i;
			return -1;
		}
		
		my.VikiJS.prototype.searchableWikiIndexForName = function(wikiTitle) {
			var self = this;
			
			for(var i = 0; i < self.allWikis.length; i++)
				if(self.allWikis[i].wikiTitle === wikiTitle)
					return i;
			
			return null;
		}
		
		my.VikiJS.prototype.replaceAt = function(string, index, character) {
			return string.substr(0, index) + character + string.substr(index+character.length);
		}

		my.VikiJS.prototype.numberOfConnections = function(node) {
			var connections = self.Links.filter(function(link) { return link.source.identifier == node.identifier || link.target.identifier == node.identifier});

			return connections.length;
		}

		my.VikiJS.prototype.log = function(text) {
			if( (window['console'] !== undefined) )
				console.log( text );
		}

		my.VikiJS.prototype.showError = function(errorText) {
			$("#"+self.ErrorsDiv).css("visibility", "visible");
			$("#"+self.ErrorsDiv).append("<p>"+ errorText + "</p>");
		}

		/****************************************************************************************************************************
		 * VikiJS Hook Structure Methods
		 ****************************************************************************************************************************/
		
		my.VikiJS.prototype.callHooks = function(hookName, parameters) {
			var self = this;
			if(this.hasHooks) {
				if(this.Hooks[hookName]) {
					for(var i = 0; i < self.Hooks[hookName].length; i++) {
						// Determine appropriate scope and call function.
						// http://stackoverflow.com/questions/912596/how-to-turn-a-string-into-a-javascript-function-call

						hookFunction = self.Hooks[hookName][i];

						var scope = window;
						var scopeSplit = hookFunction.split('.');
	    				for (j = 0; j < scopeSplit.length - 1; j++) {
	        				scope = scope[scopeSplit[j]];

	        				if (scope == undefined) return false;
					    }

	    				scope[scopeSplit[scopeSplit.length - 1]](self, parameters, hookName);
					}
					
					self.redraw(true);
					return true;
				}
			}
			return false;
		}

		my.VikiJS.prototype.hookCompletion = function(hookName, parameters) {
			var self = this;
			// let VikiJS know that the hook was completed, so VikiJS can perform actions if needed.

			parameters = parameters || {};
			if(hookName === "GetAllWikisHook") {
				self.fetchContentNamespaces();
			}
			if(parameters["redraw"] && parameters["redraw"] == true)
				self.redraw(true);
		}
	}

	return my;
}(window.VIKI || {}));