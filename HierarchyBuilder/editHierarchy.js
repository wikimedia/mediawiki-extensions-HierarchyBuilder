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

// Edit the hierarchy
// divId is the name of the div to render the hierarchy into
// hierarchy is a 2 dimensional array of the data
// - for each row in hierarchy, the first column is the level of indentation,
//	 the second column is the name of the page, and the third column is
//	 the URL of the page
// pages is a list of the pages that are candidates to be added to the
//	 hierarchy
// input_id is the id of a hidden form field in the document that is used
//	 to pass the possibly modified hierarchy back when the form is saved
// is_disabled indicates whether editing should be disabled
// is_mandatory indicates whether it is mandatory for a value to be returned
//	 (currently not implemented)
(function($) {
	window.EditHierarchy_init = function (input_id, params) {
		({
			init: function(input_id, params) {
				var hierarchy = params.hierarchy;
				if (hierarchy.length < 1) {
					return;
				}
				var hierarchy = "<ul><li class='hierarchy_root'><a>" +
					params.hierarchyroot + "</a>" + hierarchy + "</li></ul>";
			
				var jqDivId = params.div_id;
				var hierarchyDivId = jqDivId + "_hierarchy";
				var pageListDivId = jqDivId + "_pagelist";
			
				var innerframeattr = "class='hierarchy_inner' width='50%;'";
				var html = "<div class='hierarchy_outer'>";
				html += params.message;
				html += "<table width='100%;'><tr><td " + innerframeattr + ">" +
					"<div id='" + hierarchyDivId + "'></div></td>" +
					"<td " + innerframeattr + ">" +
					"<div id='" + pageListDivId + "'></div></td></tr></table>";
			
				html += "</div>";
			
				jqDivId = "#" + jqDivId;
				$(jqDivId).html(html);
			
				hierarchyDivId = "#" + hierarchyDivId;
				$(hierarchyDivId).html(hierarchy);
			
				var obj = this;
	
				$(hierarchyDivId + " * li").css("list-style-image", "none");
				$(hierarchyDivId).bind("loaded.jstree", function (event, data) {
					$(hierarchyDivId).jstree("open_all");
				});
				$(hierarchyDivId).bind("refresh.jstree", function (event, data) {
					$(hierarchyDivId).jstree("open_all");
				});
				$(hierarchyDivId).bind("move_node.jstree", function (event, data) {
					obj.saveList(input_id, hierarchyDivId);
				});
			
				var plugins;
				if (params.is_diabled) {
					plugins = [ "themes", "html_data" ];
				} else {
					plugins = [ "themes", "html_data", "dnd", "crrm" ];
				}
			
				$(hierarchyDivId).jstree({
					"themes" : {
						"theme": "apple",
						"dots": true,
						"icons": false
					},
					"crrm" : {
						"move": {
							"check_move": function(m) {
								if (m.o.hasClass('hierarchy_root')) {
									// don't let the user move the root node
									return false;
								}
								if (m.r.hasClass('hierarchy_root')) {
									// don't let the user move the node before or
									// after the root node
									if (m.p == "before" || m.p == "after") {
										return false;
									}
								}
								return true;
							}
						}
					},
					"dnd" : {
						"drop_target" : false,
						"drag_target" : false
					},
					"plugins" : plugins
				});
			
				var pagelist = "<ul><li class='hierarchy_root'><a>" +
					params.unusedpages + "</a><ul>";
				for (var pagename in params.pages) {
					pagelist += "<li><a>" + params.pages[pagename] +
						"<span style='display:none'>" + pagename +
						"</span></a></li>";
				}
				pagelist += "</ul></li></ul>";
			
				pageListDivId = "#" + pageListDivId;
				$(pageListDivId).html(pagelist);
			
				$(pageListDivId + " * li").css("list-style-image", "none");
				$(pageListDivId).bind("loaded.jstree", function (event, data) {
					$(pageListDivId).jstree("open_all");
				});
				$(pageListDivId).bind("refresh.jstree", function (event, data) {
					$(pageListDivId).jstree("open_all");
				});
				$(pageListDivId).bind("move_node.jstree", function (event, data) {
					var mylist = $(pageListDivId + " .hierarchy_root > ul");
					var listitems = mylist.find("li").get();
					mylist.children().detach();
					listitems.sort(function(a, b) {
						var compA = $(a).text().toUpperCase();
						var compB = $(b).text().toUpperCase();
						return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
					})
					$.each(listitems, function(idx, itm) {
						itm.removeAttribute("class");
						mylist.append(itm);
					});
					$(pageListDivId).jstree("refresh");
					obj.saveList(input_id, hierarchyDivId);
				});
			
				$(pageListDivId).jstree({
					"themes" : {
						"theme": "apple",
						"dots": true,
						"icons": false
					},
					"crrm" : {
						"move": {
							"check_move": function(m) {
								if (m.o.hasClass('hierarchy_root')) {
									// don't let the user move the root node
									return false;
								}
								if (m.r.hasClass('hierarchy_root')) {
									// don't let the user move the node before or
									// after the root node
									if (m.p == "before" || m.p == "after") {
										return false;
									}
								}
								return true;
							}
						}
					},
					"dnd" : {
						"drop_target" : false,
						"drag_target" : false
					},
					"plugins" : plugins
				});
			},
			
			saveList: function(input_id, divId) {
				var list = $(divId + " .hierarchy_root > ul").clone();
				list.find("ins").remove();
				list.find("li").removeAttr("class");
				list.find("li").removeAttr("style");
				list.find("ul").removeAttr("class");
				list.find("ul").removeAttr("style");
				list.find("a").replaceWith(function() {
					return "<a>" + $(this).find("span").first().text() + "</a>";
				});
				document.getElementById(input_id).value = "<ul>" + list.html() +
					"</ul>";
			}
		}).init(input_id, params);
	}
}(jQuery));
