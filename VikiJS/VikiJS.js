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
	NON_WIKI_PAGE_TYPE: 1,

	MAX_BAR_WIDTH: 60,
	BAR_HEIGHT: 6,
//	SELECTED_IMAGE_DIMENSION: 30,
//	UNSELECTED_IMAGE_DIMENSION: 20,

	MIN_SCALE: .3,
	MAX_SCALE: 2,
	LINK_OPACITY: 0.4,

//	FiscalYear: null,
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
	
	drawGraph: function(pageTitles, fiscalYear, graphDiv,
		detailsDiv, imagePath, personNames, initialWidth, initialHeight) {

		pageTitles = eval("("+pageTitles+")");
		self.log("pageTitles: "+pageTitles);
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

		/*
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

		if (ProjectGraph.FiscalYear == null ||
			ProjectGraph.FiscalYear.length == 0) {
			alert("You must supply a fiscal year.");
			return;
		} else {
			var yearpattern = /^[0-9]{4}$/;
			if (!yearpattern.test(ProjectGraph.FiscalYear)) {
				alert("Year invalid. Must be of the form YYYY.");
				return;
			}
		}

		for (var i = 0; i < chargeNumberArray.length; i++) {
			ProjectGraph.addProjectNode(chargeNumberArray[i], chargeNumberArray[i]);
		}
		for (var i = 0; i < employeeNumberArray.length; i++) {
			ProjectGraph.addPersonNode(personNames[i], employeeNumberArray[i]);
		}
		
		var nodes = new Array();
		for (var i = 0; i < ProjectGraph.Nodes.length; i++) {
			nodes.push(ProjectGraph.Nodes[i]);
		}
		for (var i = 0; i < nodes.length; i++) {
			ProjectGraph.elaborateNode(nodes[i]);
		}
		*/
		initializeGraph();

		VikiJS.Force.nodes(VikiJS.Nodes)
		VikiJS.Force.links(VikiJS.Links)

		VikiJS.redraw(true);

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

			d3.select("#moveable").append("svg:g").attr("id", "links");
			d3.select("#moveable").append("svg:g").attr("id", "nodes");
				
			VikiJS.Force = d3.layout.force();
			VikiJS.Force.gravity(0.4)
			VikiJS.Force.linkStrength(1.25)
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

				VikiJS.NodeSelection.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});
				VikiJS.LinkSelection.attr("x1", function(d) {
					return d.source.x;
				});
				VikiJS.LinkSelection.attr("y1", function(d) {
					return d.source.y;
				});
				VikiJS.LinkSelection.attr("x2", function(d) {
					return d.target.x;
				});
				VikiJS.LinkSelection.attr("y2", function(d) {
					return d.target.y;
				});
			}
		}
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

	redraw: function(layout) {
	
		VikiJS.LinkSelection =
			VikiJS.LinkSelection.data(VikiJS.Links);

		var newLinks = VikiJS.LinkSelection.enter().append("svg:line");
		newLinks.attr("class", "link");
		newLinks.style("stroke", "#23A4FF");

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
		newNodes.on("contextmenu", function(d) {
			//console.log("right click");
			//var position = d3.mouse(this);
			//console.log("x,y = "+position[0]+", "+position[1]);
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
/*		
		var newImages = newNodes.append("svg:image");
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
		newLabels.text(function(d) { return d.displayName });
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
		if (layout) {
			VikiJS.Force.start();
		}

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
		for (var i = 0; i < VikiJS.Nodes.length; i++) {
			if (typeof VikiJS.Nodes[i][property] !== 'undefined' &&
				VikiJS.Nodes[i][property] === value) {
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
	/*
	elaborateNode: function(node) {
		//console.log("elaborateNode");
		if (node.type == VikiJS.PROJECT_TYPE) {
			VikiJS.elaborateProjectNode(node);
		} else if (node.type == VikiJS.PERSON_TYPE) {
			VikiJS.elaboratePersonNode(node);
		}
	},

	elaborateProjectNode: function(node) {
		var name = VikiJS.getTaskDelivery(node.index);
		if (name != null) {
			node.displayName = name;
		}

		node.info = VikiJS.formatNodeInfo(node.displayName);
		VikiJS.displayNodeInfo(node);
	},

	elaboratePersonNode: function(node) {
		//console.log("elaboratePersonNode");
		VikiJS.getStaffTasks(node.index);
	},
*/
	formatNodeInfo: function(name) {
		var info = "<h4 id='vikijs-header'>" + name + "</h4>";
		return info;
	},

	displayNodeInfo: function(node) {
		/*
		if (VikiJS.SelectedNode !== node.index) {
			return;
		}
		jQuery("#" + VikiJS.DetailsDiv).html(node.info);
		if (node.type == VikiJS.PROJECT_TYPE) {
			var buttons = " <a href='" + node.projectPagesURL +
				"' target='_blank'><img src='" + VikiJS.ImagePath +
				"info.png' /></a>";
			if (node.elaborated == false) {
				buttons += " <a class='icon'" +
					"onclick='VikiJS.getTaskDelivery(" + node.index +
					"); VikiJS.redraw(true);'><img src = '" +
					VikiJS.ImagePath + "plus.png' /></a>";
			}
			var h4 = jQuery("#" + VikiJS.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		} else if (node.type == VikiJS.PERSON_TYPE) {
			var buttons = " <a href='" + node.personPagesURL +
				"' target='_blank'><img src='" + VikiJS.ImagePath +
				"info.png' /></a>";
			if (node.elaborated == false) {
				buttons += " <a class='icon'" +
					"onclick='VikiJS.getStaffTasks(" + node.index +
					"); VikiJS.redraw(true);'><img src = '" +
					VikiJS.ImagePath + "plus.png' /></a>";
			}
			var h4 = jQuery("#" + VikiJS.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		}
		*/
	},
	/*
	getTaskDelivery: function(index) {
		var taskNode = VikiJS.Nodes[index];
		taskNode.elaborated = true;
		taskNode.info = VikiJS.formatNodeInfo(taskNode.displayName);
		VikiJS.displayNodeInfo(taskNode);
		var delivery = queryTaskDelivery(taskNode.chargeNumber,
			VikiJS.FiscalYear);
		if (delivery == null) {
			//alert("Error getting data for task " + taskNode.chargeNumber + " for fiscal year " + VikiJS.FiscalYear);
			$("#vikijs-errors-panel").css("visibility", "visible");
			$("#vikijs-errors-panel").html("<p>Error getting data for task "+taskNode.chargeNumber+" for fiscal year "+VikiJS.FiscalYear+"</p>");
			return null;
		} else {
			parseTaskStaff(taskNode, delivery);
			return delivery.taskName;
		}

		function parseTaskStaff(taskNode, delivery) {
			if (typeof delivery.staff == 'object' &&
				delivery.staff instanceof Array) {
				for (var i = 0; i < delivery.staff.length; i++) {
					var person = delivery.staff[i];
					var personNode =
						VikiJS.findNode("employeeNumber",
						person.employeeNumber);
					if (personNode == null) {
						personNode =
							VikiJS.addPersonNode(person.personName,
							person.employeeNumber);
					} else {
						if (personNode.displayName !== person.personName) {
							personNode.displayName = person.personName;
							personNode.info =
								VikiJS.formatNodeInfo(person.personName);
						}
					}
					var link = VikiJS.addLink(taskNode.index,
						personNode.index);
					link.taskHoursPct = person.delivery;
					link.taskHours = person.hours;
					if (person.delivery > taskNode.maxHoursPct) {
						taskNode.maxHoursPct = person.delivery;
					}
				}
			}
		}
	},

	getStaffTasks: function(index) {
		//console.log("calling getStaffTasks");
		var personNode = VikiJS.Nodes[index];
		personNode.elaborated = true;
		personNode.info =
			VikiJS.formatNodeInfo(personNode.displayName);
		VikiJS.displayNodeInfo(personNode);
		var tasks = queryStaffTasks(personNode.employeeNumber,
			VikiJS.FiscalYear);
		if (tasks == null) {
			alert("Error getting data for employee " + node.employeeNumber +
				" for fiscal year " + VikiJS.FiscalYear);
		} else {
			parseStaffTasks(personNode, tasks);
		}

		function parseStaffTasks(personNode, tasks) {
			for (var i = 0; i < tasks.length; i++) {
				var task = tasks[i];
				var taskNode =
					VikiJS.findNode("chargeNumber", task.chargeNumber);
				if (taskNode == null) {
					taskNode =
						VikiJS.addProjectNode(task.taskName,
						task.chargeNumber);
					taskNode.info = VikiJS.formatNodeInfo(taskNode.displayName);
					VikiJS.displayNodeInfo(taskNode);

				}
				if (typeof personNode.maxHoursPct === 'undefined' ||
					personNode.maxHoursPct == null ||
					task.percent > personNode.maxHoursPct) {
					personNode.maxHoursPct = task.percent;
				}
				var link = VikiJS.findLink(personNode.index,
					taskNode.index);
				if (link == null) {
					var link = VikiJS.addLink(personNode.index,
						taskNode.index);
					link.personHoursPct = task.percent;
					link.personHours = task.hours;
				} else {
					link.personHoursPct = task.percent;
					link.personHours = task.hours;
				}
			}
		}
	},

	setDefaultImage: function(d) {
		var newURL = VikiJS.ImagePath + 'nophoto.png';
		d.removeAttribute("onerror");
		d.setAttribute("href", newURL);
	}
	*/
}

self.log = function(text) {
	if( (window['console'] !== undefined) )
		console.log( text );
}
