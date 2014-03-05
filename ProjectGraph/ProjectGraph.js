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
function ProjectGraph(){
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
	this.STANDARD_BOX = 400;
	this.ZOOM_MULTIPLIER = -0.0005;
	this.ZOOM_CONSTANT = 1.2;
	this.HUB_LINK_LENGTH = 500;
	this.LEAF_LINK_LENGTH = 75;

	this.FiscalYear = null;
	this.GraphDiv = null;
	this.DetailsDiv = null;
	this.SelectedNode = null;
	this.Nodes = new Array();
	this.Links = new Array();
	this.LinkMap = new Array();
	this.Force = null;
	this.LinkSelection = null;
	this.NodeSelection = null;
	this.ImagePath = null;
	this.Zoompos = 1; // to store values for zoom scale
	this.NodeCounter = 0;
	this.HiddenNodes = new Array();
	this.HiddenLinks = new Array();
	this.HiddenLinkMap = new Array();
	var self = this;
	ProjectGraph.prototype.drawGraph = function(chargeNumbers, employeeNumbers, fiscalYear, graphDiv,
		detailsDiv, imagePath, personNames, initialWidth, initialHeight) {
		var self = this;
		personNames = eval("("+personNames+")");
		employeeNumbers = eval("("+employeeNumbers+")");

		var dig = new RegExp("[0-9]",'g');
        this.ID = graphDiv.match(dig)[0];
		this.FiscalYear = fiscalYear;
		this.GraphDiv = graphDiv;
		this.DetailsDiv = detailsDiv;		
		this.SliderDiv = this.DetailsDiv.substring(0, this.DetailsDiv.length - 5)+"_zoom_slider";
		this.ImagePath = imagePath;

		this.INITIAL_HEIGHT = initialHeight;
		this.INITIAL_WIDTH = initialWidth;
		this.height = this.INITIAL_HEIGHT;
		this.width = this.INITIAL_WIDTH;
		
		// to set the widths of the details divider and the horizontal zoom slider
		// the margin is a value used to accumulate all maring, padding and other
		// space that the .detail-panel class uses.
		var margin = 10;
		$("#"+this.SliderDiv).css("top","-38px");
        $("#"+this.SliderDiv).css("float","right");
		// the details divider will get 3/5 of the space
		$("#"+this.DetailsDiv).width((this.width - margin)* 3/5);
		// the slider will get 2/5 of the space
		$("#"+this.SliderDiv).width((this.width - margin) * 2/5);
		// set the entire detail-panel to the width of the input minus the size of
		// the paddings, margins and other values to align with the graph.
		$(".projectgraph-detail-panel").width(this.width - margin);
		
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

		$('body').append("<div class=\"contextMenu\" id=\"menu-"+this.ID+"\"><ul>"
		+"<li id=\"freeze\">Freeze</li>"
        +"<li id=\"getinfo\">Get Info</li>"
		+"<li id=\"elaborate\">Elaborate</li>"
		+"<li id=\"hide\">Hide</li>"
        +"<li id=\"showall\">Show All</li>"
		+"<li id=\"zoomtofit\">Zoom To Fit</li>"
	    +"</ul></div>");

		if ((chargeNumbers == null || chargeNumbers.length == 0) &&
			(employeeNumbers == null || employeeNumbers.length == 0)) {
			alert("No charge number or employee number provided");
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
			alert("You must supply a fiscal year.");
			return;
		} else {
			var yearpattern = /^[0-9]{4}$/;
			if (!yearpattern.test(this.FiscalYear)) {
				alert("Year invalid. Must be of the form YYYY.");
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
			  // .scale(ProjectGraph.Zoompos)
			   .scaleExtent([self.MIN_SCALE, self.MAX_SCALE]);
			
			var svg = d3.select("#" + self.GraphDiv)
			   .append("svg:svg")
			      .attr("width", self.width)
			      .attr("height", self.height)
			      .attr("pointer-events", "all")
			   .append("svg:g")
			      .call(self.zoom)
			      .on("dblclick.zoom", null)
			self.SVG = svg
			svg.append("svg:rect")
			   .attr("width", self.width)
			   .attr("height", self.height)
			   .attr("fill", "white");

			svg.append("svg:g")
			      .attr("id", "moveable-"+self.ID);

			d3.select("#moveable-"+self.ID).append("svg:g").attr("id", "links-"+self.ID);
			d3.select("#moveable-"+self.ID).append("svg:g").attr("id", "nodes-"+self.ID);
				
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
				svg.select("#links-"+self.ID).selectAll(".link-"+self.ID);

			self.NodeSelection =
				svg.select("#nodes-"+self.ID).selectAll(".node-"+self.ID);

			
	
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
		d3.select("#moveable-"+this.ID).attr("transform",
	        "translate(" + self.zoom.translate() + ")" +
	        "scale(" + self.zoom.scale() + ")"
	    );
	}
	ProjectGraph.prototype.redrawZoom = function() {		
		self.Zoompos = d3.event.scale;
		d3.select("#moveable-"+self.ID).attr("transform", "translate("+d3.event.translate+")" + " scale("+self.Zoompos+")");
		// if you scroll via a scrollwheel inside the graph, then set the slider to the current scale 
		$("#"+self.SliderDiv).slider("value",self.Zoompos);
	}

	ProjectGraph.prototype.redraw = function(layout) {
		var self = this;
		this.LinkSelection = 
		this.LinkSelection.data(this.Links, function(d){
			return self.Links.indexOf(d);
		});
		this.LinkSelection.exit().remove();

		var newLinks = this.LinkSelection.enter().append("svg:line");
		newLinks.attr("class", "link-"+this.ID);
		newLinks.style("stroke", "#23A4FF");

		this.LinkSelection.style("stroke-width", function(d) {
			if (typeof d.source.index !== 'undefined') {
				return d.source.index == self.SelectedNode ||
					d.target.index == self.SelectedNode ? 2 : 1;
			} else {
				return d.source == self.SelectedNode ||
					d.target == self.SelectedNode ? 2 : 1;
			}
		});
		this.LinkSelection.style("opacity", function(d) {
			if (typeof d.source.index !== 'undefined') {
				return d.source.index == self.SelectedNode ||
					d.target.index == self.SelectedNode ? 1 : self.LINK_OPACITY;
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
		
		newNodes.attr("class", "node-"+this.ID);
		newNodes.on("click", function(d) {
			self.SelectedNode = d.index;
			self.displayNodeInfo(d);
			self.redraw(false);			
		});
		newNodes.on("dblclick", function(d) {
			d.fixed = !d.fixed;
		});
		// Trigger right click context menu
		newNodes.on("contextmenu", function(d) {
			self.SelectedNode = d.index;
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
			if (d.index != self.SelectedNode) {
				var link = self.findLink(d.index,
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
		newImages.attr("class", "icon");
		newImages.attr("xlink:href", function(d) {
			return d.imageURL;
		});
		newImages.attr("onerror", "window.ProjectGraph.setDefaultImage(this);");

		//var allImages = d3.selectAll(".icon");
		var allImages = this.NodeSelection.selectAll(".icon");
		allImages.attr("x", function(d) {
			return d.index == self.SelectedNode ? -1*self.SELECTED_IMAGE_DIMENSION/2: -1*self.UNSELECTED_IMAGE_DIMENSION/2;
		});
		allImages.attr("y", function(d) {
			return d.index == self.SelectedNode ? -1*self.SELECTED_IMAGE_DIMENSION/2 : -1*self.UNSELECTED_IMAGE_DIMENSION/2;
		});

		allImages.attr("width", function(d) {
			return d.index == self.SelectedNode ? self.SELECTED_IMAGE_DIMENSION : self.UNSELECTED_IMAGE_DIMENSION;
		});
		allImages.attr("height", function(d) {
			return d.index == self.SelectedNode ? self.SELECTED_IMAGE_DIMENSION : self.UNSELECTED_IMAGE_DIMENSION;
		});

		allImages.style("opacity", function(d) {
			if (d.index == self.SelectedNode) {
				return 1;
			} else if (self.findLink(self.SelectedNode,
				d.position) != null) {
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
				return d.index == self.SelectedNode ? 25 : 15;
		});
		newLabels.attr("text-anchor", function(d) {
			return (d.type == self.PROJECT_TYPE ? "middle" : "right");
		});
		newLabels.text(function(d) { return d.displayName });

		var newHourBarBacks = newNodes.append("svg:rect");
		var newHourBarFills = newNodes.append("svg:rect");
		newHourBarBacks.attr("class", "hourbarback-"+this.ID);
		newHourBarFills.attr("class", "hourbarfill-"+this.ID);
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
		var selected = this.findNode('index',this.SelectedNode);
		var allHourBarBacks = d3.selectAll(".hourbarback-"+this.ID);
		var allHourBarFills = d3.selectAll(".hourbarfill-"+this.ID);
		var backcolor = function(d) {

			var link = self.findLink(d.position,
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
			var link = self.findLink(d.position,
				self.SelectedNode);
			if (link == null) {
				return "none";
			}
			return "#0000FF";
		}
		allHourBarFills.style("fill", fillcolor);
		var width = function(d) {
			var link = self.findLink(d.position,
				self.SelectedNode);
			if (link == null) {
				return "none";
			}
			var selectedNode = self.Nodes[self.SelectedNode];
			var scaledHoursPct = 0;
			
			if (d.type == self.PROJECT_TYPE) {
				if (typeof link.personHoursPct === 'undefined' ||
					typeof selectedNode.maxHoursPct === 'undefined') {
					return 0;
				}
				scaledHoursPct = link.personHoursPct /
					selectedNode.maxHoursPct * 100.0;
			} else if (d.type == self.PERSON_TYPE) {
				if (typeof link.taskHoursPct === 'undefined' ||
					typeof selectedNode.maxHoursPct === 'undefined') {
					return 0;
				}
				scaledHoursPct = link.taskHoursPct /
					selectedNode.maxHoursPct * 100.0;
			} else {
				return 0;
			}
			return scaledHoursPct * self.MAX_BAR_WIDTH / 100.0;
		}
		allHourBarFills.attr("width", width);
		d3.selectAll(".link-"+this.ID).filter(function(l){
			if((self.HiddenNodes.indexOf(l.source)>-1)||(self.HiddenNodes.indexOf(l.target)>-1)){
				self.HiddenLinks.push(l);
				return l;
			}
		}).remove();

		if (layout) {
			this.Force.start();
		}
	}

	ProjectGraph.prototype.addProjectNode = function(displayName, chargeNumber) {
		var node = this.findNode("chargeNumber", chargeNumber);
		if (node != null) {
			return node;
		}
		node = this.newNode();
		node.displayName = displayName;
		node.chargeNumber = chargeNumber;
		node.info = this.formatNodeInfo(displayName);
		node.type = this.PROJECT_TYPE;
		node.imageURL = this.ImagePath + 'project.png';
		node.projectPagesURL =
			"http://info.mitre.org/phonebook/project.do?projectNumber=" +
			chargeNumber + "&fiscalYear=" + this.FiscalYear;
		node.maxHoursPct = 0;
		this.addNode(node);
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
		node.personPagesURL =
			"http://info.mitre.org/people/app/person/" + employeeNumber;
		this.addNode(node);
		return node;
	}
	ProjectGraph.prototype.newNode = function() {
		var node = {
			elaborated: false,
			fix: false,
			position: this.NodeCounter,
		};
		this.NodeCounter++;
		return node;
	}
	ProjectGraph.prototype.findNode = function(property, value) {
		for (var i = 0; i < this.Nodes.length; i++) {
			if (typeof this.Nodes[i][property] !== 'undefined' &&
				this.Nodes[i][property] === value) {
				return this.Nodes[i];
			}
		}
		return null;
	}
	ProjectGraph.prototype.addNode = function(node) {
		node.index = this.Nodes.push(node) - 1;
		if (node.index == 0) {
			this.SelectedNode = 0;
		}
	}

	ProjectGraph.prototype.addLink = function(node1, node2) {
		var link = {
			source: node1,
			target: node2
		};
		this.Links.push(link);
		this.LinkMap[node1 + "," + node2] = link;
		this.LinkMap[node2 + "," + node1] = link;
		return link;
	}

	ProjectGraph.prototype.findLink = function(from, to) {
		var link = this.LinkMap[from + "," + to];
		if (typeof link === 'undefined') {
			return null;
		}
		return link;
	}
	ProjectGraph.prototype.elaborateNode = function(node) {
		if (node.type == this.PROJECT_TYPE) {
			this.elaborateProjectNode(node);
		} else if (node.type == this.PERSON_TYPE) {
			this.elaboratePersonNode(node);
		}
	}

	ProjectGraph.prototype.elaborateProjectNode = function(node) {
		var name = this.getTaskDelivery(node.index);
		if (name != null) {
			node.displayName = name;
		}		
		node.info = this.formatNodeInfo(node.displayName);

		this.displayNodeInfo(node);
	}

	ProjectGraph.prototype.elaboratePersonNode = function(node) {
		this.getStaffTasks(node.index);
	}
	ProjectGraph.prototype.formatNodeInfo = function(name) {
		var info = "<h4 id='projectgraph-header'>" + name + "</h4>";
		return info;
	}
	ProjectGraph.prototype.displayNodeInfo = function(node) {
		var self = this;
		if (this.SelectedNode !== node.index) {
			return;
		}
		jQuery("#" + this.DetailsDiv).html(node.info);
		if (node.type == this.PROJECT_TYPE) {
			var buttons = " <a href='" + node.projectPagesURL +
				"' target='_blank'><img src='" + this.ImagePath +
				"info.png' /></a>";
			if (node.elaborated == false) {
				buttons += " <a id="+node.index+" class='icon infopanel'><img src = '" +
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
				buttons += " <a id="+node.index+" class='icon infopanel'><img src = '" +
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

	ProjectGraph.prototype.getTaskDelivery = function(index) {
		var taskNode = this.Nodes[index];
		taskNode.elaborated = true;
		taskNode.info = this.formatNodeInfo(taskNode.displayName);
		this.displayNodeInfo(taskNode);
		var delivery = queryTaskDelivery(taskNode.chargeNumber,
			this.FiscalYear);
		if (delivery == null) {
			$("#projectgraph-errors-panel").css("visibility", "visible");
			$("#projectgraph-errors-panel").html("<p>Error getting data for task "+taskNode.chargeNumber+" for fiscal year "+this.FiscalYear+"</p>");
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
					person.employeeNumber);
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
				var link = this.findLink(personNode.index,
				taskNode.index);
				if (link == null) {
					link = this.addLink(personNode.index,
					taskNode.index);
				}
				link.taskHoursPct = person.delivery;
				link.taskHours = person.hours;
				if (person.delivery > taskNode.maxHoursPct) {
					taskNode.maxHoursPct = person.delivery;
				}
			}
		}
	}		

	ProjectGraph.prototype.getStaffTasks = function(index) {
		var personNode = this.Nodes[index];
		personNode.elaborated = true;
		personNode.info =
			this.formatNodeInfo(personNode.displayName);
		this.displayNodeInfo(personNode);
		var tasks = queryStaffTasks(personNode.employeeNumber,
			this.FiscalYear);
		if (tasks == null) {
			alert("Error getting data for employee " + node.employeeNumber +
				" for fiscal year " + this.FiscalYear);
		} else {
			this.parseStaffTasks(personNode, tasks);
		}

	}
	ProjectGraph.prototype.parseStaffTasks = function(personNode, tasks) {
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			var taskNode =
				this.findNode("chargeNumber", task.chargeNumber);
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
			var link = this.findLink(personNode.index,
				taskNode.index);
			if (link == null) {
				link = this.addLink(personNode.index,
					taskNode.index);
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
		// find the node according to the index and set it locally
		var node = this.findNode('index',this.SelectedNode);
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
		// toggle the menu option between freeze and unfreeze
		$('#freeze').html(freeze.toggle);
        $('.node-'+this.ID).contextMenu('menu-'+this.ID, {
        	onShowMenu: function(e, menu) {
		        if (node.elaborated) {
		          $('#elaborate', menu).remove();
		        }
		        return menu;
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
					if(node.type==self.PROJECT_TYPE){
						self.getTaskDelivery(self.SelectedNode);
						self.redraw(true);
					}
					else if (node.type == self.PERSON_TYPE) {
						self.getStaffTasks(self.SelectedNode);
						self.redraw(true);
					}
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
		        }

	        }
		});
	}
	ProjectGraph.prototype.hide = function(node){
		var self = this;
		d3.selectAll(".link-"+this.ID).filter(function(l){
			if((node.displayName == l.source.displayName)||(node.displayName == l.target.displayName)){
				// store the link in an array to be re-added later
				self.Links.splice(self.Links.indexOf(l),1);
				self.HiddenLinks.push(l);				
			}
		});
		// if the node is a central part of a hub
		// remove all of its children unless its child has been elaborated
		if(node.elaborated){
			var hub = new Array();
			this.HiddenLinks.forEach(function(l){
				if(hub.indexOf(l.source)==-1){
					hub.push(l.source);
				}
				if(hub.indexOf(l.target)==-1){
					hub.push(l.target);
				}
			});
			hub.forEach(function(n){
				var pos = self.Nodes.indexOf(n);
				if(pos > -1){
					if((n.displayName == node.displayName)||(n.elaborated == false)){
						self.HiddenNodes.push(self.Nodes[pos]);
						self.Nodes.splice(pos,1);						
					}
				}
			});
		}
		else{
			// select all of the nodes
			var pos = this.Nodes.indexOf(node);
			if (pos > -1) {
				this.HiddenNodes.push(this.Nodes[pos]);
	    		this.Nodes.splice(pos, 1);
			}
		}
		// Properly remove the nodes from the graph
		this.redraw(true);
	}
	ProjectGraph.prototype.showAll = function(){
		// cycle through all of the nodes and re-add them back to a list
		// to get added back to the graph
		for(var npos = 0; npos<this.HiddenNodes.length; npos++){
			var node = this.HiddenNodes[npos];
			this.Nodes.push(node);
		}
		// cycle through all of the links and re-add them back to a list
		// to get added back to the graph
		for(var lpos = 0; lpos<this.HiddenLinks.length; lpos++){
			var l = this.HiddenLinks[lpos];
			var link = {target:l.target.index, index:l.source.index};
			this.Links.push(l);
		}		

		this.HiddenNodes = new Array();
		this.HiddenLinks = new Array();

		this.Nodes.sort(compare);
		// redraw
		this.redraw(true);
		// clear out hidden arrays
		function compare(a,b) {
		  if (a.position < b.position)
		     return -1;
		  if (a.position > b.position)
		    return 1;
		  return 0;
		}
	}
	ProjectGraph.prototype.zoomToFit = function(node){

		// initialize the following variables of minimum x and y, and maximum x and y
		// with the x and y index of the first node in ProjectGraph.Nodes
		var minx=this.Nodes[0].x; var maxx=this.Nodes[0].x; 
		var miny=this.Nodes[0].y; var maxy=this.Nodes[0].y;
		var d={x:0, y:0, count:0};
		// go through the array of nodes
		this.Nodes.forEach(function(node){
			// check to see if the current nodes x or y index is
			// greater than or less than any of the four domain/range variables
			d.x += node.x;
			d.y += node.y;
			d.count++;
			if(node.x>maxx){maxx = node.x;}
			if(node.x<minx){minx = node.x;}
			if(node.y>maxy){maxy = node.y;}
			if(node.y<miny){miny = node.y;}
		});	
		var avgx = d.x/d.count;
		var avgy = d.y/d.count;
		// scale is used as a tolerance buffer
		var padding = 0.075;
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
		this.calculateTranslation(avgx,avgy);
		// zoom
		this.slide();
		// set the slider
		$("#"+this.SliderDiv).slider("value",this.Zoompos);
		this.redraw(true);
	}
	ProjectGraph.prototype.calculateTranslation = function(x,y){
		// get the scale
		var scale = this.zoom.scale();
		// calculate the centers depending on the scale and viewport
        var scaledCenterX = (this.width / scale) / 2;
        var scaledCenterY = (this.height / scale) / 2;
        // calculate the translation vectors
        var panx = -(x - scaledCenterX);
        var pany = -(y - scaledCenterY);
        // set the translation vectors and the scale
		this.zoom.translate([panx, pany]);
	}
}