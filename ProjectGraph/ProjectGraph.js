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

window.ProjectGraph = {

	PROJECT_TYPE: 0,
	PERSON_TYPE: 1,

	MAX_BAR_WIDTH: 60,
	BAR_HEIGHT: 6,
	SELECTED_IMAGE_DIMENSION: 30,
	UNSELECTED_IMAGE_DIMENSION: 20,

	MIN_SCALE: .3,
	MAX_SCALE: 2,
	LINK_OPACITY: 0.4,

	FiscalYear: null,
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

	drawGraph: function(chargeNumbers, employeeNumbers, fiscalYear, graphDiv,
		detailsDiv, imagePath, personNames, initialWidth, initialHeight) {

		personNames = eval("("+personNames+")");
		employeeNumbers = eval("("+employeeNumbers+")");
		console.log("personNames: "+personNames);
		console.log("employeeNumbers: "+employeeNumbers);
		ProjectGraph.FiscalYear = fiscalYear;
		ProjectGraph.GraphDiv = graphDiv;
		ProjectGraph.DetailsDiv = detailsDiv;
		ProjectGraph.ImagePath = imagePath;

		ProjectGraph.INITIAL_HEIGHT = initialHeight;
		ProjectGraph.INITIAL_WIDTH = initialWidth;
		ProjectGraph.height = ProjectGraph.INITIAL_HEIGHT;
		ProjectGraph.width = ProjectGraph.INITIAL_WIDTH;

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

		initializeGraph();

		ProjectGraph.Force.nodes(ProjectGraph.Nodes)
		ProjectGraph.Force.links(ProjectGraph.Links)

		ProjectGraph.redraw(true);

		function initializeGraph() {
			var padding = 20;

			ProjectGraph.zoom = d3.behavior.zoom()
			   .on("zoom", ProjectGraph.redrawZoom)
			   .scaleExtent([ProjectGraph.MIN_SCALE, ProjectGraph.MAX_SCALE]);

			var svg = d3.select("#" + ProjectGraph.GraphDiv)
			   .append("svg:svg")
			      .attr("width", ProjectGraph.width)
			      .attr("height", ProjectGraph.height)
			      .attr("pointer-events", "all")
			   .append("svg:g")
			      .call(ProjectGraph.zoom)

			svg.append("svg:rect")
			   .attr("width", ProjectGraph.width)
			   .attr("height", ProjectGraph.height)
			   .attr("fill", "white");

			svg.append("svg:g")
			      .attr("id", "moveable");

			d3.select("#moveable").append("svg:g").attr("id", "links");
			d3.select("#moveable").append("svg:g").attr("id", "nodes");

			ProjectGraph.Force = d3.layout.force();
			ProjectGraph.Force.gravity(.4)
			ProjectGraph.Force.distance(200)
			ProjectGraph.Force.charge(-3000)
			ProjectGraph.Force.friction(.675)
			ProjectGraph.Force.size([ProjectGraph.width, ProjectGraph.height])
			ProjectGraph.Force.on("tick", tick);

			ProjectGraph.LinkSelection =
				svg.select("#links").selectAll(".link");

			ProjectGraph.NodeSelection =
				svg.select("#nodes").selectAll(".node");
				
			function tick() {

				ProjectGraph.NodeSelection.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});
				ProjectGraph.LinkSelection.attr("x1", function(d) {
					return d.source.x;
				});
				ProjectGraph.LinkSelection.attr("y1", function(d) {
					return d.source.y;
				});
				ProjectGraph.LinkSelection.attr("x2", function(d) {
					return d.target.x;
				});
				ProjectGraph.LinkSelection.attr("y2", function(d) {
					return d.target.y;
				});
			}
		}
	},

	redrawZoom: function() {
//		console.log("translate (x,y)=("+d3.event.translate[0]+","+d3.event.translate[1]+")+ scale("+d3.event.scale+"), 1.0/scale = "+(1.0/d3.event.scale));

		// transform the moveable g appropriately, which automatically transforms all the nodes inside.
		d3.select("#moveable").attr("transform", "translate("+d3.event.translate+")" + " scale("+d3.event.scale+")");

	},

	redraw: function(layout) {
		ProjectGraph.LinkSelection =
			ProjectGraph.LinkSelection.data(ProjectGraph.Links);

		var newLinks = ProjectGraph.LinkSelection.enter().append("svg:line");
		newLinks.attr("class", "link");
		newLinks.style("stroke", "#23A4FF");

		ProjectGraph.LinkSelection.style("stroke-width", function(d) {
			if (typeof d.source.index !== 'undefined') {
				return d.source.index == ProjectGraph.SelectedNode ||
					d.target.index == ProjectGraph.SelectedNode ? 2 : 1;
			} else {
				return d.source == ProjectGraph.SelectedNode ||
					d.target == ProjectGraph.SelectedNode ? 2 : 1;
			}
		});
		ProjectGraph.LinkSelection.style("opacity", function(d) {
			if (typeof d.source.index !== 'undefined') {
				return d.source.index == ProjectGraph.SelectedNode ||
					d.target.index == ProjectGraph.SelectedNode ? 1 : ProjectGraph.LINK_OPACITY;
			} else {
				return d.source == ProjectGraph.SelectedNode ||
					d.target == ProjectGraph.SelectedNode ? 1 : ProjectGraph.LINK_OPACITY;
			}
		});
		
		ProjectGraph.NodeSelection =
			ProjectGraph.NodeSelection.data(ProjectGraph.Nodes);

		var newNodes = ProjectGraph.NodeSelection.enter().append("svg:g");
		newNodes.attr("class", "node");
		newNodes.on("click", function(d) {
			ProjectGraph.SelectedNode = d.index;
			ProjectGraph.displayNodeInfo(d);
			ProjectGraph.redraw(false);
		});
		newNodes.on("dblclick", function(d) {
			d.fixed = !d.fixed;
		});

		var drag = ProjectGraph.Force.drag()
		   .on("dragstart", function() { d3.event.sourceEvent.stopPropagation(); });

		newNodes.call(ProjectGraph.Force.drag);
		var newToolTips = newNodes.append("svg:title");
		newToolTips.attr("class", "tooltip");
		var allToolTips = d3.selectAll(".tooltip");
		allToolTips.text(function(d) {
			var title = d.displayName;
			if (d.index != ProjectGraph.SelectedNode) {
				var link = ProjectGraph.findLink(d.index,
					ProjectGraph.SelectedNode);
				if (link != null) {
					if (d.type == ProjectGraph.PERSON_TYPE) {
						if (typeof link.taskHours !== 'undefined' &&
							link.taskHours != null &&
							typeof link.taskHoursPct !== 'undefined' &&
							link.taskHoursPct != null) {
							title += " (" + link.taskHours +
								" hours/" + link.taskHoursPct + "%)]";
						}
					} else if (d.type == ProjectGraph.PROJECT_TYPE) {
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

		var allImages = d3.selectAll(".icon");
		allImages.attr("x", function(d) {
			return d.index == ProjectGraph.SelectedNode ? -1*ProjectGraph.SELECTED_IMAGE_DIMENSION/2: -1*ProjectGraph.UNSELECTED_IMAGE_DIMENSION/2;
		});
		allImages.attr("y", function(d) {
			return d.index == ProjectGraph.SelectedNode ? -1*ProjectGraph.SELECTED_IMAGE_DIMENSION/2 : -1*ProjectGraph.UNSELECTED_IMAGE_DIMENSION/2;
		});

		allImages.attr("width", function(d) {
			return d.index == ProjectGraph.SelectedNode ? ProjectGraph.SELECTED_IMAGE_DIMENSION : ProjectGraph.UNSELECTED_IMAGE_DIMENSION;
		});
		allImages.attr("height", function(d) {
			return d.index == ProjectGraph.SelectedNode ? ProjectGraph.SELECTED_IMAGE_DIMENSION : ProjectGraph.UNSELECTED_IMAGE_DIMENSION;
		});
		allImages.style("opacity", function(d) {
			if (d.index == ProjectGraph.SelectedNode) {
				return 1;
			} else if (ProjectGraph.findLink(ProjectGraph.SelectedNode,
				d.index) != null) {
				return 1;
			} else {
				return 0.7;
			}
		});

		var newLabels = newNodes.append("svg:text");
		// dx, dy: magic numbers that help make pretty positioning!
		newLabels.attr("dy", function(d) {
			return d.type == ProjectGraph.PROJECT_TYPE ? 20 : -2;
		});
		newLabels.attr("dx", function(d) {
			if(d.type == ProjectGraph.PROJECT_TYPE)
				return 0;
			else
				return d.index == ProjectGraph.SelectedNode ? 25 : 15;
		});
		newLabels.attr("text-anchor", function(d) {
			return (d.type == ProjectGraph.PROJECT_TYPE ? "middle" : "right");
		});
		newLabels.text(function(d) { return d.displayName });
		
		var newHourBarBacks = newNodes.append("svg:rect");
		var newHourBarFills = newNodes.append("svg:rect");
		newHourBarBacks.attr("class", "hourbarback");
		newHourBarFills.attr("class", "hourbarfill");
		var x = function(d) {
			if (d.type == ProjectGraph.PROJECT_TYPE) {
				return -1*ProjectGraph.MAX_BAR_WIDTH/2;		// center bar under folder
			} else {
				return 15;					// magic number - put bar to right of image 
			}
		}
		newHourBarBacks.attr("x", x);
		newHourBarFills.attr("x", x);

		var y = function(d) {
			return d.type == ProjectGraph.PROJECT_TYPE ? 25 : 3;	// another magic number
		}
		newHourBarBacks.attr("y", y);
		newHourBarFills.attr("y", y);
		newHourBarBacks.attr("height", ProjectGraph.BAR_HEIGHT);
		newHourBarFills.attr("height", ProjectGraph.BAR_HEIGHT);
		newHourBarBacks.attr("width", ProjectGraph.MAX_BAR_WIDTH);
		newHourBarBacks.style("stroke", "none");
		newHourBarFills.style("stroke", "none");

		var allHourBarBacks = d3.selectAll(".hourbarback");
		var allHourBarFills = d3.selectAll(".hourbarfill");
		var backcolor = function(d) {
			var link = ProjectGraph.findLink(d.index,
				ProjectGraph.SelectedNode);
			if (link == null) {
				return "none";
			}
			return "#CCCCCC";
		}
		allHourBarBacks.style("fill", backcolor);
		var fillcolor = function(d) {
			var link = ProjectGraph.findLink(d.index,
				ProjectGraph.SelectedNode);
			if (link == null) {
				return "none";
			}
			return "#0000FF";
		}
		allHourBarFills.style("fill", fillcolor);

		var width = function(d) {
			var link = ProjectGraph.findLink(d.index,
				ProjectGraph.SelectedNode);
			if (link == null) {
				return "none";
			}
			var selectedNode = ProjectGraph.Nodes[ProjectGraph.SelectedNode];
			var scaledHoursPct = 0;
			if (d.type == ProjectGraph.PROJECT_TYPE) {
				if (typeof link.personHoursPct === 'undefined' ||
					typeof selectedNode.maxHoursPct === 'undefined') {
					return 0;
				}
				scaledHoursPct = link.personHoursPct /
					selectedNode.maxHoursPct * 100.0;
			} else if (d.type == ProjectGraph.PERSON_TYPE) {
				if (typeof link.taskHoursPct === 'undefined' ||
					typeof selectedNode.maxHoursPct === 'undefined') {
					return 0;
				}
				scaledHoursPct = link.taskHoursPct /
					selectedNode.maxHoursPct * 100.0;
			} else {
				return 0;
			}
			return scaledHoursPct * ProjectGraph.MAX_BAR_WIDTH / 100.0;
		}
		allHourBarFills.attr("width", width);

		if (layout) {
			ProjectGraph.Force.start();
		}
	},

	addProjectNode: function(displayName, chargeNumber) {
		var node = ProjectGraph.findNode("chargeNumber", chargeNumber);
		if (node != null) {
			return node;
		}
		node = ProjectGraph.newNode();
		node.displayName = displayName;
		node.chargeNumber = chargeNumber;
		node.info = ProjectGraph.formatNodeInfo(displayName);
		node.type = ProjectGraph.PROJECT_TYPE;
		node.imageURL = ProjectGraph.ImagePath + 'project.png';
		node.projectPagesURL =
			"http://info.mitre.org/phonebook/project.do?projectNumber=" +
			chargeNumber + "&fiscalYear=" + ProjectGraph.FiscalYear;
		node.maxHoursPct = 0;
		ProjectGraph.addNode(node);
		return node;
	},

	addPersonNode: function(displayName, employeeNumber) {
		var node = ProjectGraph.findNode("employeeNumber", employeeNumber);
		if (node != null) {
			return node;
		}
		node = ProjectGraph.newNode();
		node.displayName = displayName;
		node.employeeNumber = employeeNumber;
		node.info = ProjectGraph.formatNodeInfo(displayName);
		node.type = ProjectGraph.PERSON_TYPE;
		node.imageURL = "http://info.mitre.org/phonebook/photos/big/" +
			employeeNumber + ".jpg";
		node.personPagesURL =
			"http://info.mitre.org/people/app/person/" + employeeNumber;
		ProjectGraph.addNode(node);
		return node;
	},

	newNode: function() {
		var node = {
			elaborated: false,
			fixed: false
		};
		return node;
	},

	findNode: function(property, value) {
		for (var i = 0; i < ProjectGraph.Nodes.length; i++) {
			if (typeof ProjectGraph.Nodes[i][property] !== 'undefined' &&
				ProjectGraph.Nodes[i][property] === value) {
				return ProjectGraph.Nodes[i];
			}
		}
		return null;
	},

	addNode: function(node) {
		node.index = ProjectGraph.Nodes.push(node) - 1;
		if (node.index == 0) {
			ProjectGraph.SelectedNode = 0;
		}
	},

	addLink: function(node1, node2) {
		var link = {
			source: node1,
			target: node2
		};
		ProjectGraph.Links.push(link);
		ProjectGraph.LinkMap[node1 + "," + node2] = link;
		ProjectGraph.LinkMap[node2 + "," + node1] = link;
		return link;
	},

	findLink: function(from, to) {
		var link = ProjectGraph.LinkMap[from + "," + to];
		if (typeof link === 'undefined') {
			return null;
		}
		return link;
	},

	elaborateNode: function(node) {
		//console.log("elaborateNode");
		if (node.type == ProjectGraph.PROJECT_TYPE) {
			ProjectGraph.elaborateProjectNode(node);
		} else if (node.type == ProjectGraph.PERSON_TYPE) {
			ProjectGraph.elaboratePersonNode(node);
		}
	},

	elaborateProjectNode: function(node) {
		var name = ProjectGraph.getTaskDelivery(node.index);
		if (name != null) {
			node.displayName = name;
		}

		node.info = ProjectGraph.formatNodeInfo(node.displayName);
		ProjectGraph.displayNodeInfo(node);
	},

	elaboratePersonNode: function(node) {
		//console.log("elaboratePersonNode");
		ProjectGraph.getStaffTasks(node.index);
	},

	formatNodeInfo: function(name) {
		var info = "<h4>" + name + "</h4>";
		return info;
	},

	displayNodeInfo: function(node) {
		if (ProjectGraph.SelectedNode !== node.index) {
			return;
		}
		jQuery("#" + ProjectGraph.DetailsDiv).html(node.info);
		if (node.type == ProjectGraph.PROJECT_TYPE) {
			var buttons = " <a href='" + node.projectPagesURL +
				"' target='_blank'><img src='" + ProjectGraph.ImagePath +
				"info.png' /></a>";
			if (node.elaborated == false) {
				buttons += " <a class='icon'" +
					"onclick='ProjectGraph.getTaskDelivery(" + node.index +
					"); ProjectGraph.redraw(true);'><img src = '" +
					ProjectGraph.ImagePath + "plus.png' /></a>";
			}
			var h4 = jQuery("#" + ProjectGraph.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		} else if (node.type == ProjectGraph.PERSON_TYPE) {
			var buttons = " <a href='" + node.personPagesURL +
				"' target='_blank'><img src='" + ProjectGraph.ImagePath +
				"info.png' /></a>";
			if (node.elaborated == false) {
				buttons += " <a class='icon'" +
					"onclick='ProjectGraph.getStaffTasks(" + node.index +
					"); ProjectGraph.redraw(true);'><img src = '" +
					ProjectGraph.ImagePath + "plus.png' /></a>";
			}
			var h4 = jQuery("#" + ProjectGraph.DetailsDiv + " h4");
			h4.html(h4.html() + buttons);
		}
	},

	getTaskDelivery: function(index) {
		var taskNode = ProjectGraph.Nodes[index];
		taskNode.elaborated = true;
		taskNode.info = ProjectGraph.formatNodeInfo(taskNode.displayName);
		ProjectGraph.displayNodeInfo(taskNode);
		var delivery = queryTaskDelivery(taskNode.chargeNumber,
			ProjectGraph.FiscalYear);
		if (delivery == null) {
			alert("Error getting data for task " + taskNode.chargeNumber +
				" for fiscal year " + ProjectGraph.FiscalYear);
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
						ProjectGraph.findNode("employeeNumber",
						person.employeeNumber);
					if (personNode == null) {
						personNode =
							ProjectGraph.addPersonNode(person.personName,
							person.employeeNumber);
					} else {
						if (personNode.displayName !== person.personName) {
							personNode.displayName = person.personName;
							personNode.info =
								ProjectGraph.formatNodeInfo(person.personName);
						}
					}
					var link = ProjectGraph.addLink(taskNode.index,
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
		var personNode = ProjectGraph.Nodes[index];
		personNode.elaborated = true;
		personNode.info =
			ProjectGraph.formatNodeInfo(personNode.displayName);
		ProjectGraph.displayNodeInfo(personNode);
		var tasks = queryStaffTasks(personNode.employeeNumber,
			ProjectGraph.FiscalYear);
		if (tasks == null) {
			alert("Error getting data for employee " + node.employeeNumber +
				" for fiscal year " + ProjectGraph.FiscalYear);
		} else {
			parseStaffTasks(personNode, tasks);
		}

		function parseStaffTasks(personNode, tasks) {
			for (var i = 0; i < tasks.length; i++) {
				var task = tasks[i];
				var taskNode =
					ProjectGraph.findNode("chargeNumber", task.chargeNumber);
				if (taskNode == null) {
					taskNode =
						ProjectGraph.addProjectNode(task.taskName,
						task.chargeNumber);
					taskNode.info = ProjectGraph.formatNodeInfo(taskNode.displayName);
					ProjectGraph.displayNodeInfo(taskNode);

				}
				if (typeof personNode.maxHoursPct === 'undefined' ||
					personNode.maxHoursPct == null ||
					task.percent > personNode.maxHoursPct) {
					personNode.maxHoursPct = task.percent;
				}
				var link = ProjectGraph.findLink(personNode.index,
					taskNode.index);
				if (link == null) {
					var link = ProjectGraph.addLink(personNode.index,
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
		var newURL = ProjectGraph.ImagePath + 'nophoto.png';
		d.removeAttribute("onerror");
		d.setAttribute("href", newURL);
	}
}
