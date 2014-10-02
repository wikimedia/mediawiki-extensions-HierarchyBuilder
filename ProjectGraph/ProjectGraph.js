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
window.ProjectGraph = function() {
	this.ID = null;
	this.PROJECT_TYPE = 0;
	this.PERSON_TYPE = 1;

	this.MAX_BAR_WIDTH = 60;
	this.BAR_HEIGHT = 6;
	this.SELECTED_IMAGE_DIMENSION = 30;
	this.UNSELECTED_IMAGE_DIMENSION = 20;

	this.MIN_SCALE = .3;
	this.MAX_SCALE = 2;
	this.LINK_OPACITY = 0.4;
	this.STANDARD_BOX = 400;// standard box width/height
	this.ZOOM_MULTIPLIER = -0.0005;// a multiplier for calculating zoom scope
	this.ZOOM_CONSTANT = 1.2;
	this.HUB_LINK_LENGTH = 500;
	this.LEAF_LINK_LENGTH = 75;
	// threshold values for minimum height/width of a 
	this.MIN_HEIGHT = 200;
	this.MIN_WIDTH = 200;
	this.DELAY = 50;// number of milliseconds to delay loading of nodes

	this.FiscalYear = null;
	this.GraphDiv = null;
	this.DetailsDiv = null;
	this.Resize = null;// is the graph resizable
	this.SelectedNode = null;
	this.Nodes = new Array();
	this.Links = new Array();
	this.LinkMap = new Array();
	this.Force = null;
	this.LinkSelection = null;
	this.NodeSelection = null;
	this.ImagePath = null;
	this.CURRENT_NODE_ID = 0;
	this.Zoompos = 1; // to store values for zoom scale
	this.Hidden = {Nodes: new Array(), Links: new Array()};// store for hiding and showing nodes/links
	this.Filter = {Nodes: new Array(), Links: new Array()};// store for a searchable graph
	var self = this;
	ProjectGraph.prototype.drawGraph = function(chargeNumbers, employeeNumbers, fiscalYear, graphDiv,
		detailsDiv, imagePath, personNames, initialWidth, initialHeight, resize) {
		var self = this;	
				
		personNames = eval("("+personNames+")");
		employeeNumbers = eval("("+employeeNumbers+")");
		// regular expression to find the first numeric digit
		var dig = new RegExp("[0-9]",'g');
		// search graphDiv for the first numeric digit and se this as the ID
		// doubt that the id will go over 9 (more than 10 graphs on a page)
        this.ID = graphDiv.match(dig)[0];

		this.FiscalYear = fiscalYear;
		this.GraphDiv = graphDiv;
		this.Resize = resize;	
		// generate the details div by appending '_data' to the end of detailsDiv
		this.DetailsDiv = detailsDiv+'_data';
		// generate the slider div by appending '_zoom_slider' to the end of detailsDiv
		this.SliderDiv = detailsDiv+'_zoom_slider';
		this.ImagePath = imagePath;
		this.INITIAL_HEIGHT = initialHeight;
		this.INITIAL_WIDTH = initialWidth;
		this.height = this.INITIAL_HEIGHT;
		this.width = this.INITIAL_WIDTH;

		var margin = 10;

/***************************************************************************************/
		// For now, hide the search bar because this section of code is untested.
		// We want to prevent users from using the search bar until a future version
		// of ProjectGraph where we're more comfortable with the tag search.
		$("#projectgraph-searchbar_"+this.ID).css("display", "none");		

/***************************************************************************************/	

		// if the graph is resizable?
		if(resize){
			// calculate the inverses for height and width (simple math?)
			var height_inverse = (self.height * ((window.innerHeight) / (self.height)));
			var width_inverse = (self.width * ((window.innerWidth) / (self.width)));
			// listen for when the 
			$( window ).resize(function() {
				// use a combination of the inverses and other values to determine what the calculated height/width should be
				// this equation may need to be improved upon...
				var calculated_height = Math.round((self.height / height_inverse) *(self.height * ((window.innerHeight) / (self.height))));
				var calculated_width =  Math.round((self.width / width_inverse) * (self.width * ((window.innerWidth) / (self.width))));
				var height = calculated_height;
				var width = calculated_width;

				// if the calculated values fall below a specified threshold
				if(calculated_height< self.MIN_HEIGHT){height = self.MIN_HEIGHT;}
				if(calculated_width< self.MIN_WIDTH){width = self.MIN_WIDTH;}

				$("#"+self.GraphDiv+" ,#"+self.ID).height(height).width(width);
				$("#"+self.DetailsDiv).width((width-margin)* 3/5);
				$("#"+self.SliderDiv).width((width - margin) * 2/5);
				$("#"+self.DetailsDiv.substring(0, self.DetailsDiv.length-5)).width((width-margin));				
			});
		}
		// to set the widths of the details divider and the horizontal zoom slider
		// the margin is a value used to accumulate all maring, padding and other
		// space that the .detail-panel class uses.
		
		// the details divider will get 3/5 of the space
		$("#"+this.DetailsDiv).width((this.width - margin)* 3/5);
		// the slider will get 2/5 of the space
		$("#"+this.SliderDiv).width((this.width - margin) * 2/5);
		// set the entire detail-panel to the width of the input minus the size of
		// the paddings, margins and other values to align with the graph.
		$(".projectgraph-detail-panel").width(this.width - margin);
		// set everything within the graphDiv to not have a context menu
		// this does not work with nodes, only the canvas
		$('#'+this.GraphDiv).on('contextmenu', function(){
  			return false;
		});
		// Listener for keyup to launch searchFilter rendering the graph searchable via the api tags. 
		// Look at searchFilter method for more information.
		$('#searchbar').keyup(function(event){
			self.searchFilter($(this).val());
		});

		// The below if and else statement scaled the initial zoom level. This is calculated by
		// relations to the standard size. The standard size is a 400px by 400px box with a zoom level 1;
		// The lowest value of width or height is divided by 400 (standard) and then multiplied by the result
		// of an equation formed from gathering data from several different view boxes (300px to 700px). 
		// The input of this equation is also the lowest value of either height or width.
		if(this.height>this.width){
			this.Zoompos = this.width*(
				this.width*this.ZOOM_MULTIPLIER
				+this.ZOOM_CONSTANT)/this.STANDARD_BOX;
		}
		else{
			this.Zoompos = this.height*(
				this.height*this.ZOOM_MULTIPLIER
				+this.ZOOM_CONSTANT)/this.STANDARD_BOX;
		}
		// create a new zoom slider
		var zoom_slider = $("#"+this.SliderDiv).slider(
		{
		  orientation: "horizontal",//make the slider horizontal
		  min: this.MIN_SCALE , // set the lowest value
		  max: this.MAX_SCALE, // set the highest value
		  step: .001, // set the value for each individual increment
		  value: this.Zoompos,
		  slide: function( event, ui ) {
			// set the zoom scale equal to the current value of the slider
			// which is the current index
		        self.Zoompos = ui.value;
			// call the slide function to zoom/pan using the slider
		        self.slide();
		  }
		});
		// the html for the context menu
		$('body').append(
			"<div class=\"contextMenu\" id=\"projectgraph_menu-"+this.ID+"\"><ul>"+
			// the dynamic menu title (node name)
			"<li id=\"projectgraph_name-"+this.ID+"\"  class=\"header\" style=\"text-align: center;\">Name</li>"+
			// actual navigable menu
			"<div class=\"options\" >"+
			"<li id=\"freeze\" class=\"projectgraph_freeze-"+this.ID+"\">Freeze</li>"+
        	"<li id=\"getinfo\" >Get Info</li>"+
			"<li id=\"tags\">Display Tags</li>"+
			"<li id=\"elaborate\" class=\"projectgraph_elaborate-"+this.ID+"\">Elaborate</li>"+
			"<li id=\"hide\">Hide</li>"+
			"<hr>"+// separator
        	"<li id=\"showall\">Show All</li>"+
			"<li id=\"zoomtofit\">Zoom To Fit</li>"+
	    	"</ul></div></div>"
	    );
	    // center the title of the context menu
		$("#name").css("text-align","center");
		

		if ((chargeNumbers == null || chargeNumbers.length == 0) &&
			(employeeNumbers == null || employeeNumbers.length == 0)) {
			self.errorAlert("No charge number or employee number provided");
			return;
		}

		var chargeNumberArray;
		if (chargeNumbers != null && chargeNumbers.length > 0) {
			chargeNumberArray = chargeNumbers.split(",");
		} else {
			chargeNumberArray = new Array();
		}

		var employeeNumberArray;
		if (employeeNumbers != null && employeeNumbers.length > 0) {
			employeeNumberArray = employeeNumbers;
		} else {
			employeeNumberArray = new Array();
		}

		if (this.FiscalYear == null ||
			this.FiscalYear.length == 0) {
			self.errorAlert("You must supply a fiscal year.");
			return;
		} else {
			var yearpattern = /^[0-9]{4}$/;
			if (!yearpattern.test(this.FiscalYear)) {
				self.errorAlert("Year invalid. Must be of the form YYYY.");
				return;
			}
		}

		for (var i = 0; i < chargeNumberArray.length; i++) {
			this.addProjectNode(chargeNumberArray[i], chargeNumberArray[i]);
		}
				
		for (var i = 0; i < employeeNumberArray.length; i++) {
			this.addPersonNode(personNames[i], employeeNumberArray[i]);
		}
		
		var nodes = new Array();
		for (var i = 0; i < this.Nodes.length; i++) {
			nodes.push(this.Nodes[i]);
		}
		
		for (var i = 0; i < nodes.length; i++) {
			this.elaborateNode(nodes[i]);
		}

		initializeGraph();

		this.Force.nodes(this.Nodes)
		this.Force.links(this.Links)

		this.redraw(true);

		function initializeGraph() {
			var padding = 20;

			self.zoom = d3.behavior.zoom()
			   .on("zoom", self.redrawZoom)
			   .scaleExtent([self.MIN_SCALE, self.MAX_SCALE]);
			
			var svg = d3.select("#" + self.GraphDiv)
			   .append("svg:svg")
			      .attr("width", self.width)
			      .attr("height", self.height)
			      .attr("id", "projectgraph_"+self.ID)
			      .attr("pointer-events", "all")
			   .append("svg:g")
			      .call(self.zoom)
			      .on("dblclick.zoom", null)
			self.SVG = svg
			svg.append("svg:rect")
			   .attr("id", "projectgraph_"+self.ID)
			   .attr("width", self.width)
			   .attr("height", self.height)
			   .attr("fill", "white");

			svg.append("svg:g")
			      .attr("id", "projectgraph_moveable-"+self.ID);

			d3.select("#projectgraph_moveable-"+self.ID).append("svg:g").attr("id", "projectgraph_links-"+self.ID);
			d3.select("#projectgraph_moveable-"+self.ID).append("svg:g").attr("id", "projectgraph_nodes-"+self.ID);
				
			self.Force = d3.layout.force();
			self.Force.gravity(0.02)
			self.Force.linkStrength(1.25)
			// link distance was made dynamic in respect to the increase in charge. As the nodes form a cluster, the edges are less likely to cross.
			// The edge between to clusters is stretched from the polarity between the adjacent clusters.
			self.Force.linkDistance(
				function(n){
					// if the source and target has been elaborated, set the variable child to true
					var child = (n.source.elaborated && n.target.elaborated);
					// if this node is the parent or the center of a cluster of nodes
					if(child){return self.HUB_LINK_LENGTH;}
					// if this node is the child or the outer edge of a cluster of nodes
					else{return self.LEAF_LINK_LENGTH;}
				}
			)
			self.Force.charge(-3000)
			self.Force.friction(.675)
			self.Force.size([self.width, self.height])
			self.Force.on("tick", tick);

			self.LinkSelection =
				svg.select("#projectgraph_links-"+self.ID).selectAll(".projectgraph_link-"+self.ID);

			self.NodeSelection =
				svg.select("#projectgraph_nodes-"+self.ID).selectAll(".projectgraph_node-"+self.ID);

			
	
			function tick() {

				self.NodeSelection.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});
				self.LinkSelection.attr("x1", function(d) {
					return d.source.x;
				});
				self.LinkSelection.attr("y1", function(d) {
					return d.source.y;
				});
				self.LinkSelection.attr("x2", function(d) {
					return d.target.x;
				});
				self.LinkSelection.attr("y2", function(d) {
					return d.target.y;
				});
			}
			// Autozoom on startup
			self.slide();
		}
	}
	ProjectGraph.prototype.slide = function(){		
		// set target_zoom to the logged zoom index
        target_zoom = this.Zoompos;
	
        if(target_zoom>this.MAX_SCALE){target_zoom = this.MAX_SCALE;}
        if(target_zoom<this.MIN_SCALE){target_zoom = this.MIN_SCALE;}

		// calculate the center of the graph by dividing the width and height by two
        center = [this.width / 2, this.height / 2];
		// set the scale extent
        extent = this.zoom.scaleExtent();
		// and the translation vectors
        translate = this.zoom.translate();
        translation = [];
        l = [];
		// setup a json object with the translation x and y values with the zoom scale
        view = {x: translate[0], y: translate[1], k: this.zoom.scale()};

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

	ProjectGraph.prototype.interpolateZoom = function(translate, scale) {
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

	ProjectGraph.prototype.zoomed = function() {
		var self = this;
	// access the element movable and move to the scale and translation vectors
		d3.select("#projectgraph_moveable-"+this.ID).attr("transform",
	        "translate(" + self.zoom.translate() + ")" +
	        "scale(" + self.zoom.scale() + ")"
	    );
	}
	ProjectGraph.prototype.redrawZoom = function() {		
		self.Zoompos = d3.event.scale;
		d3.select("#projectgraph_moveable-"+self.ID).attr("transform", "translate("+d3.event.translate+")" + " scale("+self.Zoompos+")");
		// if you scroll via a scrollwheel inside the graph, then set the slider to the current scale 
		$("#"+self.SliderDiv).slider("value",self.Zoompos);
	}

	ProjectGraph.prototype.redraw = function(layout) {
		var self = this;

		var queue = new Array();
		this.Links.forEach(function(l){
			// find the new source and target via the 
			// findNode command by the unique identifier
			var src = self.findNode('id', l.source.id, self);
			var tar = self.findNode('id', l.target.id, self);
			// as long as both nodes exist on the graph
			if((src==null)||(tar==null)){
				if((self.nodeExist(l.source,4))||(self.nodeExist(l.target,4))){
					queue.push(l);
				}
			}
		});
		// hide all lingering links that are not attached to both nodes.
		queue.forEach(function(l){
			self.Links.splice(self.Links.indexOf(l),1);
			self.Hidden.Links.push(l);				
		});


		// The reason this logic differs from NodeSelection is due to a bug.
		this.LinkSelection = 
		this.LinkSelection.data(this.Links);
		this.LinkSelection.exit().remove();

		var newLinks = this.LinkSelection.enter().append("svg:line");
		newLinks.attr("class", "projectgraph_link-"+this.ID);
		newLinks.style("stroke", "#23A4FF");
		this.LinkSelection.style("stroke-width", function(d) {
			if (typeof d.source.id !== 'undefined') {
				return d.source.id == self.SelectedNode ||
					d.target.id == self.SelectedNode ? 2 : 1;
			} else {
				return d.source == self.SelectedNode ||
					d.target == self.SelectedNode ? 2 : 1;
			}
		});
		this.LinkSelection.style("opacity", function(d) {
			if (typeof d.source.id !== 'undefined') {
				return d.source.id == self.SelectedNode ||
					d.target.id == self.SelectedNode ? 1 : self.LINK_OPACITY;
			} else {
				return d.source == self.SelectedNode ||
					d.target == self.SelectedNode ? 1 : self.LINK_OPACITY;
			}
		});
		this.NodeSelection =
			this.NodeSelection.data(this.Nodes, function(d){
				return self.Nodes.indexOf(d);
			});
		
		this.NodeSelection.exit().remove();
	
		var newNodes = this.NodeSelection.enter().append("svg:g");
		
		newNodes.attr("class", "projectgraph-node projectgraph_node-"+this.ID);
		newNodes.on("click", function(d) {
			self.SelectedNode = d.id;
			self.displayNodeInfo(d);
			self.redraw(false);			
		});
		newNodes.on("dblclick", function(d) {
			d.fixed = !d.fixed;
		});
		// Trigger right click context menu
		newNodes.on("contextmenu", function(d) {
			// get the node before launching the context menu
			self.SelectedNode = d.id;
			// show the selected node
			self.redraw(false);		
			// launch the menu	
			self.menu();
		});

		var drag = this.Force.drag()
		   .on("dragstart", function() { d3.event.sourceEvent.stopPropagation(); });

		newNodes.call(this.Force.drag);

		var newToolTips = newNodes.append("svg:title");
		newToolTips.attr("class", "tooltip");
		var allToolTips = d3.selectAll(".tooltip");
		allToolTips.text(function(d) {
			var title = d.displayName;
			if (d.id != self.SelectedNode) {
				var link = self.findLink(d.id,
					self.SelectedNode);
				if (link != null) {
					if (d.type == self.PERSON_TYPE) {
						if (typeof link.taskHours !== 'undefined' &&
							link.taskHours != null &&
							typeof link.taskHoursPct !== 'undefined' &&
							link.taskHoursPct != null) {
							title += " (" + link.taskHours +
								" hours/" + link.taskHoursPct + "%)]";
						}
					} else if (d.type == self.PROJECT_TYPE) {
						if (typeof link.personHours !== 'undefined' &&
							link.personHours != null &&
							typeof link.personHoursPct !== 'undefined' &&
							link.personHoursPct != null) {
							title += " (" + link.personHours +
								" hours/" + link.personHoursPct + "%)]";
						}
					}
				}
			}
			return title;
		});
		
		var newImages = newNodes.append("svg:image");
		newImages.attr("class", "projectgraph-icon icon");
		newImages.attr("xlink:href", function(d) {
			return d.imageURL;
		});
		newImages.attr("onerror", "window.ProjectGraph.setDefaultImage(this);");

		//var allImages = d3.selectAll(".icon");
		var allImages = this.NodeSelection.selectAll(".icon");
		allImages.attr("x", function(d) {
			return d.id == self.SelectedNode ? -1*self.SELECTED_IMAGE_DIMENSION/2: -1*self.UNSELECTED_IMAGE_DIMENSION/2;
		});
		allImages.attr("y", function(d) {
			return d.id == self.SelectedNode ? -1*self.SELECTED_IMAGE_DIMENSION/2 : -1*self.UNSELECTED_IMAGE_DIMENSION/2;
		});

		allImages.attr("width", function(d) {
			return d.id == self.SelectedNode ? self.SELECTED_IMAGE_DIMENSION : self.UNSELECTED_IMAGE_DIMENSION;
		});
		allImages.attr("height", function(d) {
			return d.id == self.SelectedNode ? self.SELECTED_IMAGE_DIMENSION : self.UNSELECTED_IMAGE_DIMENSION;
		});
		allImages.style("opacity", function(d) {
			var link = self.findLink(d.id,self.SelectedNode);			
			if (d.id == self.SelectedNode) {
				return 1;
			} else if ((link != null)||(self.findLink(self.SelectedNode,
				d.id) != null)) {
				return 1;
			} else {
				return self.LINK_OPACITY;
			}
		});

		var newLabels = newNodes.append("svg:text");
		// dx, dy: magic numbers that help make pretty indexing!
		newLabels.attr("dy", function(d) {
			return d.type == self.PROJECT_TYPE ? 20 : -2;
		});
		newLabels.attr("dx", function(d) {
			if(d.type == self.PROJECT_TYPE)
				return 0;
			else
				return d.id == self.SelectedNode ? 25 : 15;
		});
		newLabels.attr("text-anchor", function(d) {
			return (d.type == self.PROJECT_TYPE ? "middle" : "right");
		});
		newLabels.text(function(d) { return d.displayName });

		var newHourBarBacks = newNodes.append("svg:rect");
		var newHourBarFills = newNodes.append("svg:rect");
		newHourBarBacks.attr("class", "projectgraph_hourbarback-"+this.ID);
		newHourBarFills.attr("class", "projectgraph_hourbarfill-"+this.ID);
		var x = function(d) {			
			if (d.type == self.PROJECT_TYPE) {
				return -1*self.MAX_BAR_WIDTH/2;		// center bar under folder
			} else {
				return 15;					// magic number - put bar to right of image 
			}
		}
		newHourBarBacks.attr("x", x);
		newHourBarFills.attr("x", x);
		var y = function(d) {
			return d.type == self.PROJECT_TYPE ? 25 : 3;	// another magic number
		}
		newHourBarBacks.attr("y", y);
		newHourBarFills.attr("y", y);
		newHourBarBacks.attr("height", this.BAR_HEIGHT);
		newHourBarFills.attr("height", this.BAR_HEIGHT);
		newHourBarBacks.attr("width", this.MAX_BAR_WIDTH);
		newHourBarBacks.style("stroke", "none");
		newHourBarFills.style("stroke", "none");

		// get the selected node
		var selected = this.findNode('id',this.SelectedNode, this);
		var allHourBarBacks = d3.selectAll(".projectgraph_hourbarback-"+this.ID);
		var allHourBarFills = d3.selectAll(".projectgraph_hourbarfill-"+this.ID);
		var backcolor = function(d) {

			var link = self.findLink(d.id,
				self.SelectedNode);			
			// if the link is null, or the node has not been elaborated
			// do not display the bar
			if ((link == null)||(selected == null)||(!selected.elaborated)) {
				return "none";
			}
			return "#CCCCCC";
		}
		allHourBarBacks.style("fill", backcolor);
		var fillcolor = function(d) {
			var link = self.findLink(d.id,
				self.SelectedNode);
			if (link == null) {
				return "none";
			}
			return "#0000FF";
		}
		allHourBarFills.style("fill", fillcolor);
		var width = function(d) {
			var link = self.findLink(d.id,
				self.SelectedNode);
			if (link == null) {
				return 0;
			}
			var SelectedNode = self.Nodes[self.SelectedNode];
			var scaledHoursPct = 0;
			
			if (d.type == self.PROJECT_TYPE) {
				if (typeof link.personHoursPct === 'undefined' ||
					typeof SelectedNode.maxHoursPct === 'undefined') {
					return 0;
				}
				scaledHoursPct = link.personHoursPct /
					SelectedNode.maxHoursPct * 100.0;
			} else if (d.type == self.PERSON_TYPE) {
				if (typeof link.taskHoursPct === 'undefined' ||
					typeof SelectedNode.maxHoursPct === 'undefined') {
					return 0;
				}
				scaledHoursPct = link.taskHoursPct /
					SelectedNode.maxHoursPct * 100.0;
			} else {
				return 0;
			}
			return scaledHoursPct * self.MAX_BAR_WIDTH / 100.0;
		}
		allHourBarFills.attr("width", width);

		if (layout) {
			this.Force.start();
		}
	}
	ProjectGraph.prototype.addProjectNode = function(displayName, chargeNumber) {
		var node = this.findNode("chargeNumber", chargeNumber, this);
		if (node != null) {
			return node;
		}
		node = this.newNode();
		node.displayName = displayName;
		node.chargeNumber = chargeNumber;
		node.info = this.formatNodeInfo(displayName);
		node.type = this.PROJECT_TYPE;
		node.imageURL = this.ImagePath + 'project.png';
//		node.uid = node.chargeNumber;
		node.tags = null;
		node.projectPagesURL =
			"http://info.mitre.org/phonebook/project.do?projectNumber=" +
			chargeNumber + "&fiscalYear=" + this.FiscalYear;
		node.maxHoursPct = 0;
		this.addNode(node);
		this.queryTags('project',node.id);
		return node;
	}

	ProjectGraph.prototype.addPersonNode = function(displayName, employeeNumber) {
		var node = this.findNode("employeeNumber", employeeNumber);
		if (node != null) {
			return node;
		}
		node = this.newNode();
		node.displayName = displayName;
		node.employeeNumber = employeeNumber;
		node.info = this.formatNodeInfo(displayName);
		node.type = this.PERSON_TYPE;
		node.imageURL = "http://info.mitre.org/phonebook/photos/big/" +
			employeeNumber + ".jpg";
//		node.uid = node.employeeNumber;
		node.tags = null;
		node.personPagesURL =
			"http://info.mitre.org/people/app/person/" + employeeNumber;
		this.addNode(node);
		this.queryTags('employee',node.id);
		return node;
	}
	ProjectGraph.prototype.newNode = function() {
		var node = {
			elaborated: false,
			fix: false,
		};
		return node;
	}
	// search for a node given a property and a value. The property could be
	// 'id' and the value could be 'ajx3'. A search will be run 'ajx3' on a store (an array)
	// to see if it contains a node with the specified value for the given property.
	// else, return null
	ProjectGraph.prototype.findNode = function(property, value, store) {
		if(typeof store != 'undefined'){
			// loop through store
			for (var i = 0; i < store.Nodes.length; i++) {
				// if the node is not undefined and matches property and value
				// return node, else return null
				if (typeof store.Nodes[i][property] !== 'undefined' &&
					store.Nodes[i][property] === value) {
					return store.Nodes[i];
				}
			}
		}
		return null;
	}
	ProjectGraph.prototype.addNode = function(node) {
		// see if the node exists on the graph
		if(this.nodeExist(node,0)==false){
			node.id = this.CURRENT_NODE_ID;
			this.CURRENT_NODE_ID++;
			this.Nodes.push(node);
			if (node.id == 0) {
				this.SelectedNode = 0;
			}
		}
	}

	// Warnding! If you are hiding clusters, you must use the method 'hideLinks' before
	// you can invoke 'hideNodes'
	ProjectGraph.prototype.hideNodes = function(node, store, cluster){
		var self = this;
		// is the node elaborated, and do you wish to hide the entire cluster
		// if possible?
		if(node.elaborated && cluster){
			var hub = new Array();
			// go through every link that is within a store. For example, if
			// the store is an array of links that are removed from the graph,
			// then store both target and source into the 'hub' array. But do not
			// store duplicates.
			store.Links.forEach(function(l){
				if(hub.indexOf(l.source)==-1){
					hub.push(l.source);
				}
				if(hub.indexOf(l.target)==-1){
					hub.push(l.target);
				}
			});
			// then go through every node, and if it exists on the graph,
			// then push it to the store
			hub.forEach(function(n){
				var pos = self.Nodes.indexOf(n);
				if(pos > -1){
					if((n.id == node.id)||(n.elaborated == false)){
						store.Nodes.push(self.Nodes[pos]);
						self.Nodes.splice(pos,1);						
					}
				}
			});
		}
		else{
			// Remove the single node from the graph
			var pos = this.Nodes.indexOf(node);
			if (pos > -1) {
				store.Nodes.push(this.Nodes[pos]);
	    		this.Nodes.splice(pos, 1);
			}
		}
	}
	ProjectGraph.prototype.addLink = function(node1, node2) {
		var link = {
			source: node1,
			target: node2,
		};
		this.Links.push(link);
		this.LinkMap[node1.id + "," + node2.id] = link;
		this.LinkMap[node2.id + "," + node1.id] = link;
		return link;
	}
	ProjectGraph.prototype.hideLinks = function(node, store){
		var self = this;
		// use d3 to select all of the links (can be rebuilt as a loop?)
		d3.selectAll(".projectgraph_link-"+this.ID).filter(function(l){
			// if the node id matches either the source id, or the target id
			if((node.id == l.source.id)||(node.id == l.target.id)){
				// store the link in an array (store) to be re-added later
				self.Links.splice(self.Links.indexOf(l),1);
				store.Links.push(l);				
			}
		});
	}
	ProjectGraph.prototype.findLink = function(from, to) {
		var link = this.LinkMap[from + "," + to];
		if (typeof link === 'undefined') {
			return null;
		}
		return link;
	}
	// search a specific store for a link that has a matching target or source node
	ProjectGraph.prototype.linkSearch = function(node, store){
		if(typeof store != 'undefined'){
			// go through the entire store
			for (var i = 0; i < store.Links.length; i++) {
				// get the link
				var link = store.Links[i];
				// if the node id matches either the source id or the target id
				// return the link
				if((link.source.id == node.id)||(link.target.id == node.id)){
					return link;
				}
			}
		}
		// return null if not found
		return null;
	}
	ProjectGraph.prototype.elaborateNode = function(node) {
		if (node.type == this.PROJECT_TYPE) {
			this.elaborateProjectNode(node);
		} else if (node.type == this.PERSON_TYPE) {
			this.elaboratePersonNode(node);
		}
	}

	ProjectGraph.prototype.elaborateProjectNode = function(node) {
		var name = this.getTaskDelivery(node.id);
		if (name != null) {
			node.displayName = name;
		}		
		node.info = this.formatNodeInfo(node.displayName);

		this.displayNodeInfo(node);
	}

	ProjectGraph.prototype.elaboratePersonNode = function(node) {
		this.getStaffTasks(node.id);
	}
	ProjectGraph.prototype.formatNodeInfo = function(name) {
		var info = "<h4 id='projectgraph-header'>" + name + "</h4>";
		return info;
	}
	ProjectGraph.prototype.displayNodeInfo = function(node) {
		var self = this;
		if (this.SelectedNode !== node.id) {
			return;
		}
		jQuery("#" + this.DetailsDiv).html(node.info);
		if (node.type == this.PROJECT_TYPE) {
			var buttons = " <a href='" + node.projectPagesURL +
				"' target='_blank'><img src='" + this.ImagePath +
				"info.png' /></a>";
			if (node.elaborated == false) {
				buttons += " <a id="+node.id+" class='icon infopanel'><img src = '" +
					this.ImagePath + "plus.png' /></a>";
				$(".infopanel").click("Calling hello world");
			}
			var h4 = jQuery("#" + this.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		} else if (node.type == this.PERSON_TYPE) {
			var buttons = " <a href='" + node.personPagesURL +
				"' target='_blank'><img src='" + this.ImagePath +
				"info.png' /></a>";
			if (node.elaborated == false) {
				buttons += " <a id="+node.id+" class='icon infopanel'><img src = '" +
					this.ImagePath + "plus.png' /></a>";
				$(".infopanel").click("Calling hello world");
			}
			var h4 = jQuery("#" + this.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		}
		$(".infopanel").click(function(){
			var node = self.Nodes[this.id];
			if(node.type==self.PROJECT_TYPE){
				self.getTaskDelivery(self.SelectedNode);
				self.redraw(true);
			}
			else if (node.type == self.PERSON_TYPE) {
				self.getStaffTasks(self.SelectedNode);
				self.redraw(true);
			}
		});
	}

	ProjectGraph.prototype.getTaskDelivery = function(id) {
		var self = this;
		var taskNode = this.Nodes[id];
		taskNode.elaborated = true;
		taskNode.info = this.formatNodeInfo(taskNode.displayName);
		this.displayNodeInfo(taskNode);
		var delivery = self.queryTaskDelivery(taskNode.chargeNumber,
			self.FiscalYear);

		if (delivery == null) {
			self.errorAlert("Error getting data for task "+taskNode.chargeNumber+" for fiscal year "+this.FiscalYear);
			return null;
		} else {
			this.parseTaskStaff(taskNode, delivery);
			return delivery.taskName;
		}
	}
	ProjectGraph.prototype.parseTaskStaff = function(taskNode, delivery) {
		if (typeof delivery.staff == 'object' &&
			delivery.staff instanceof Array) {
			for (var i = 0; i < delivery.staff.length; i++) {
				var person = delivery.staff[i];
				var personNode =
					this.findNode("employeeNumber",
					person.employeeNumber, this);
				if (personNode == null) {
					personNode =
						this.addPersonNode(person.personName,
						person.employeeNumber);
				} else {
					if (personNode.displayName !== person.personName) {
						personNode.displayName = person.personName;
						personNode.info =
							this.formatNodeInfo(person.personName);
					}
				}
				var link = this.findLink(personNode.id,
				taskNode.id);
				if (link == null) {
					link = this.addLink(personNode,
					taskNode);
				}
				link.taskHoursPct = person.delivery;
				link.taskHours = person.hours;
				if (person.delivery > taskNode.maxHoursPct) {
					taskNode.maxHoursPct = person.delivery;
				}
			}
		}
	}

	ProjectGraph.prototype.getStaffTasks = function(id) {
		var self = this;
		var personNode = this.Nodes[id];
		personNode.elaborated = true;
		personNode.info =
			this.formatNodeInfo(personNode.displayName);
		this.displayNodeInfo(personNode);
		var tasks = self.queryStaffTasks(personNode.employeeNumber, 
			self.FiscalYear);
		if (tasks == null) {
			self.errorAlert("Unable to fetch data for employee " + personNode.employeeNumber +
				" for fiscal year " + this.FiscalYear+". This is typically due to an MII data stream outage.");
		} else {
			this.parseStaffTasks(personNode, tasks);
		}
		
	}
	ProjectGraph.prototype.parseStaffTasks = function(personNode, tasks) {
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			var taskNode =
				this.findNode("chargeNumber", task.chargeNumber, this);
			if (taskNode == null) {
				taskNode =
					this.addProjectNode(task.taskName,
					task.chargeNumber);
				taskNode.info = this.formatNodeInfo(taskNode.displayName);
				this.displayNodeInfo(taskNode);
			}
			if (typeof personNode.maxHoursPct === 'undefined' ||
				personNode.maxHoursPct == null ||
				task.percent > personNode.maxHoursPct) {
				personNode.maxHoursPct = task.percent;
			}
			var link = this.findLink(personNode.id,
				taskNode.id);
			if (link == null) {
				link = this.addLink(personNode,
					taskNode);
			}
			link.personHoursPct = task.percent;
			link.personHours = task.hours;
		}
	}
	ProjectGraph.prototype.setDefaultImage = function(d) {
		var newURL = this.ImagePath + 'nophoto.png';
		d.removeAttribute("onerror");
		d.setAttribute("href", newURL);
	}
	ProjectGraph.prototype.menu = function(){
		var self = this;
		this.pause(true);
		// find the node according to the index and set it locally
		var node = this.findNode('id',this.SelectedNode, this);
		// create a json object to store the variable settings
		var freeze = {toggle:"",fix:false};
		// if the node has been fixed, then display "unfreeze" as a menu
		// option and if unfreeze is selected, unfreeze the node
		if(node.fix){
			freeze.toggle = "Unfreeze";
			freeze.fix = false;
		}
		// if the node has not been fixed, then display "freeze" as a menu
		// option and if freeze is selected, freeze the node
		else if(!node.fix){
			freeze.toggle = "Freeze";
			freeze.fix = true;
		}
		// set the title of the menu to the name
		$('#projectgraph_name-'+this.ID).html(node.displayName);
		// toggle the menu option between freeze and unfreeze
		$('.projectgraph_freeze-'+this.ID).html(freeze.toggle);
		// toggle the project on staff and projects 
		if(node.type==this.PROJECT_TYPE){ 
			$('.projectgraph_elaborate-'+this.ID).html("Get Staff");
		}
		else if (node.type == this.PERSON_TYPE) { 
			$('.projectgraph_elaborate-'+this.ID).html("Get Projects");
		}
		// the actual menu code
        $('.projectgraph_node-'+this.ID).contextMenu('projectgraph_menu-'+this.ID, {
        	// activate before the menu shows
        	onShowMenu: function(e, menu) {
		        if (node.elaborated) {
		          $('.projectgraph_elaborate-'+self.ID, menu).remove();
		        }
		        return menu;
	      	},
	      	// activate after the menu shows
	      	onExitMenu: function(e,menu) {
	      		self.pause(false);
	      	},
	      	// style the menu
	      	itemStyle: {
		        fontFamily : 'Trebuchet MS',
		        backgroundColor : '#EEEEEE',
	        },
			bindings: {
		        'freeze': function(t) {
		        	// freeze/unfreeze the node
					node.fixed = freeze.fix;
					// store these settings in the metadata
					node.fix = freeze.fix;
		        },
		        'getinfo': function(t) {
					if(node.type==self.PROJECT_TYPE){
                        window.open(node.projectPagesURL,'_blank'); 
                    }
                    else if (node.type == self.PERSON_TYPE) {	                    	
                        window.open(node.personPagesURL,'_blank');
                    }
		        },
		        'elaborate': function(t) {
					self.elaborateNode(node);
					self.redraw(true);
		        },
		        'hide': function(t) {
		        	// when hide is selected, call the hide function
					self.hide(node);
		        },
		        'showall': function(t) {
		        	// when Show All is selcted, call the showAll function
					self.showAll();
		        },
		        'zoomtofit': function(t) {
		        	// when zoom to fit is selected, call the zoom to fit function
					self.zoomToFit(node);
		        },
		        'tags': function(t){
					if(node.tags==null)
						self.errorAlert("Tags have not been loaded yet");
		        	else
						alert(node.tags.join());
		        }
	        }
		});
	}
	// take in a boolean value. If true, then pause the graph,
	// else unpause the graph.
	ProjectGraph.prototype.pause = function(stop){
		if(stop) { this.Force.stop(); }
		if(!stop){ this.Force.start(); }
	}

	ProjectGraph.prototype.hide = function(node){
		var self = this;
		this.hideLinks(node, this.Hidden);
		// if the node is a central part of a hub
		// remove all of its children unless its child has been elaborated
		this.hideNodes(node, this.Hidden, true);
		// Properly remove the nodes from the graph
		this.redraw(true);
	}
	ProjectGraph.prototype.showAll = function(){
		// cycle through all of the nodes and re-add them back to a list
		// to get added back to the graph
		for(var npos = 0; npos<this.Hidden.Nodes.length; npos++){
			var node = this.Hidden.Nodes[npos];
			if(this.nodeExist(node,0)==false){
				this.Nodes.push(node);
			}
		}
		// cycle through all of the links and re-add them back to a list
		// to get added back to the graph
		for(var link_pos = 0; link_pos<this.Hidden.Links.length; link_pos++){
			var link = this.Hidden.Links[link_pos];
			this.Links.push(link);
			self.LinkMap[link.target.index+","+link.source.index] = link;
			self.LinkMap[link.source.index+","+link.target.index] = link;
		}		

		this.Hidden.Nodes = new Array();
		this.Hidden.Links = new Array();

		this.redraw(true);
	}
	// general switch method to pull in if a node exists within a different stores. 
	// There may be a better way to do this? For loop perhaps?
	ProjectGraph.prototype.nodeExist = function(node, level){		
		var exist = false;
		switch(level){
			case 0:
				exist = (this.findNode('id', node.id, this)!=null);
			break;
			case 1:
				exist = (this.findNode('id', node.id, this.Hidden)!=null);
			break;
			case 2:
				exist = (this.findNode('id', node.id, this.Filter)!=null);
			break;
			case 3:
				exist = ((this.findNode('id', node.id, this)!=null)||
						 (this.findNode('id', node.id, this.Hidden)!=null));
			break;
			case 4:
				exist = ((this.findNode('id', node.id, this.Hidden)!=null)||
						 (this.findNode('id', node.id, this.Filter)!=null));
			break;
			case 5:
				exist = ((this.findNode('id', node.id, this)!=null)||
						 (this.findNode('id', node.id, this.Filter)!=null));
			break;
			case 6:
				exist = ((this.findNode('id', node.id, this)!=null)||
						 (this.findNode('id', node.id, this.Hidden)!=null)||
						 (this.findNode('id', node.id, this.Filter)!=null));
			break;
		}
		return exist;	
	}
	ProjectGraph.prototype.searchFilter = function(lookup){
		var self = this;
		var hide = new Array();
		// loop through all of the nodes, if none of the tags
		// match, then hide the link, and push the node to an array
		// to be removed later.
		this.Nodes.forEach(function(n){
			if(!isEqual(lookup,n.tags)){
				self.hideLinks(n, self.Filter);
				hide.push(n);
			}
		});
		// removing the node later to not disrupt loop
		hide.forEach(function(n){
			self.hideNodes(n, self.Filter, false);
		});
		var show = {node:new Array(),link:new Array()};
		// go through all of the nodes in the store
		for(var npos=0; npos<this.Filter.Nodes.length; npos++){
			// if the node is what you are looking for, add it to the graph
			var n = this.Filter.Nodes[npos];			
			if(isEqual(lookup,n.tags)){
				this.Nodes.push(n);
				show.node.push(n);
			}
		}
		// search through all of the ndoes on the graph
		this.Nodes.forEach(function(n){
			// find a link via a node
			var link = self.linkSearch(n, self.Filter);
			// pull the source and the target from the graph
			var src = self.findNode('id', link.source.id, self);
            var tar = self.findNode('id', link.target.id, self);
			// if either is null, that means both nodes are not on the graph
			// and the link should not be added			
			if((src != null)&&( tar != null)){
				// otherwise, add the link to the graph
		        self.Links.push(link);
                show.link.push(link);
			}
		});
		// remove the node and link from the filter store (spring cleaning)
		show.node.forEach(function(n){
			self.Filter.Nodes.splice(self.Filter.Nodes.indexOf(n),1);
		});
		show.link.forEach(function(l){
			self.Filter.Links.splice(self.Filter.Links.indexOf(l),1);
		});
		this.redraw(true);
		// the core fuction behind searchable graphs
    	function isEqual(lookup, tags){
    		// if the lookup is an empty string
    		// then return true (to add all nodes/links to the graph)
			if(lookup==''){return true;}
			// else => strip all spaces (to make it easier) from lookup
			var search = lookup.replace(/\s/g, "");
			// loop through all of the tags
			for(var index=0; index<tags.length; index++){
				// pull every tag and strip all of the spaces from the tag
				var t = tags[index].replace(/\s/g,"");
				// see if the length of the tag being searched upon is less then or equal to
				// the length of the text, if so, then continue, else, return false automatically				
				if(t.length>=search.length){
					// see if the tag matches
					var tag = t.slice(0,search.length);
					if(search===tag){
						return true;
					}
				}
			};
        	return false;
        }
	}
	ProjectGraph.prototype.zoomToFit = function(node){

		// initialize the following variables of minimum x and y, and maximum x and y
		// with the x and y index of the first node in ProjectGraph.Nodes
		var minx=this.Nodes[0].x; var maxx=this.Nodes[0].x; 
		var miny=this.Nodes[0].y; var maxy=this.Nodes[0].y;
		// go through the array of nodes
		this.Nodes.forEach(function(node){
			// check to see if the current nodes x or y index is
			// greater than or less than any of the four domain/range variables
			if(node.x>maxx){maxx = node.x;}
			if(node.x<minx){minx = node.x;}
			if(node.y>maxy){maxy = node.y;}
			if(node.y<miny){miny = node.y;}
		});	
		// scale is used as a tolerance buffer
		var padding = 0;//0.075;
		//calculate the zoom for the domain and the zoom for the range
		var dzoom = this.width/(maxx-minx);
		var rzoom = this.height/(maxy-miny);
		// whichever zoom is smaller (to fit it in the viewscreen)
		if(dzoom<rzoom){
			this.Zoompos = dzoom - padding;
		}
		else{
			this.Zoompos = rzoom - padding;
		}	
		// Calculate Translation
		zoom_scale = this.zoom.scale();
		graph_x = (this.width/2.0/zoom_scale) - (maxx+minx)/2;
		graph_y = (this.height/2.0/zoom_scale) - (maxy+miny)/2;

		this.zoom.translate([graph_x, graph_y]);

		this.slide();
		$("#"+this.SliderDiv).slider("value",this.Zoompos);
		this.redraw(true);
	}
	
	ProjectGraph.prototype.errorAlert = function(msg){
		$("#projectgraph-errors-panel").css("visibility", "visible");
		$("#projectgraph-errors-panel").html("<p>"+msg+"</p>");	
	}

	ProjectGraph.prototype.log = function(text) {
		if( (window['console'] !== undefined) )
			console.log( text );
	}
	
	ProjectGraph.prototype.queryStaffTasks = function(employeeNumber, fiscalYear) {
		var tasks = null;
		var request =
	'<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
	'	<soap12:Body>' +
	'		<GetMyProjectCharges xmlns="http://Mitre.IWWeb.Data.Service.ProjectCharges">' +
	'			<Employee>' + employeeNumber + '</Employee>' +
	'			<FiscalYear>' + fiscalYear + '</FiscalYear>' +
	'		</GetMyProjectCharges>' +
	'	</soap12:Body>' +
	'</soap12:Envelope>';
		jQuery.ajax({
			url: '/IWWebService/ProjectCharges.asmx?op=GetMyProjectCharges',
			type: 'POST',
			dataType: 'xml',
			contentType: 'text/xml; charset="utf-8"',
			async: false,
			data: request,
			success: function (data, textStatus, jqXHR) {
				tasks = [];
				var xml = jqXHR.responseText;
				jQuery(xml).find('MyProjectCharges').each(function() {
					var chargeNumber = $(this).find('ProjectNumber').text();
					var taskName = $(this).find('ProjectName').text();
					var hours = $(this).find('Hours').text();
					var percent = $(this).find('Percent').text();
					tasks.push({
						chargeNumber: chargeNumber,
						taskName: taskName,
						hours: Number(hours),
						percent: Number(percent)
					});
				});
			},
			error: function(jqXHR, textStatus, errorThrown) {
				self.errorAlert("Unable to fetch project charges. This is typically due to an MII data stream outage.");
			}
		});
		return tasks;
	}

	ProjectGraph.prototype.queryTaskDelivery = function(chargeNumber, fiscalYear) {
		var taskName = null;
		var staff = null;
		var request =
	'<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
	'	<soap12:Body>' +
	'		<GetTaskPhonebookInfo xmlns="http://Mitre.IWWeb.Data.Service.TaskInformation">' +
	'			<TaskNo>' + chargeNumber + '</TaskNo>' +
	'			<fiscalPeriod>' + fiscalYear + '</fiscalPeriod>' +
	'		</GetTaskPhonebookInfo>' +
	'	</soap12:Body>' +
	'</soap12:Envelope>';
		jQuery.ajax({
			url: '/IWWebService/TaskInformation.asmx?op=GetTaskPhonebookInfo',
			type: 'POST',
			dataType: 'xml',
			contentType: 'text/xml; charset="utf-8"',
			async: false,
			data: request,
			success: function (data, textStatus, jqXHR) {
				staff = [];
				var xml = jqXHR.responseText;
				taskName = jQuery(xml).find('ProjectName').text();
				jQuery(xml).find('TotalStaffList StaffTI').each(function() {
					var departmentNumber = $(this).find('DepartmentNumber').text();
					var temp = $(this).find('Delivery');
					delivery = temp.text();
					var hours = $(this).find('Hours').text();
					var FTEs = $(this).find('FTEs').text();
					var personName = $(this).find('PersonName').text();
					var expenditureCat = $(this).find('ExpenditureCat').text();
					var employeeNumber = $(this).find('Empnum').text();
					staff.push({
						departmentNumber: departmentNumber,
						delivery: Number(delivery),
						hours: Number(hours),
						FTEs: FTEs,
						personName: personName,
						expenditureCat: expenditureCat,
						employeeNumber: employeeNumber
					});
				});
			}
		});
		if (taskName == null || staff == null) {
			return null;
		}
		return {
			taskName: taskName,
			staff: staff
		};
	}
	
	ProjectGraph.prototype.queryTags = function(type, id) {
		// simple get request interfacing with proxy script
		// proxy.php take in one parameter 'url' with the url you are trying to access
		// both ajax request and proxy script is get requests
		var node = this.findNode('id', id, this);
		var uid = ((type=='employee') ? node.employeeNumber : node.chargeNumber);
		var processor = setInterval(function(){
	    	$.ajax({
				// url: '../proxy.php?url=http://info.mitre.org/tags/entity/'+type+'/'+id+'.json',
				url: '/MITRETagInterface/entity/'+type+'/'+uid+'.json',
				type: 'GET',
				dataType: 'json',
				async: true,
				success: function(data){
					node.tags = data.tags;
				}		
			});			
			clearInterval(processor);
		},this.DELAY);

	}
}
