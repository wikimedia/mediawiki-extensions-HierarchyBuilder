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

				//var html = this.parseWikiTextToHtml(hierarchy);

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

				console.log(list.html());

				var wikiText = this.parseHtmlToWikiText(list, "*");
				//document.getElementById(input_id).value = wikiText;
				console.log(wikiText);
			},
			
			/**
			 * uListRoot is a jquery object, representing the <ul> element of a list.
			 * depth is a string composed of * characters denoting the current depth 
			 *     within the hierarchy. (ex: "*" is the hierarchy root, "**" is direct 
			 *     children of the root)
			 */
			parseHtmlToWikiText: function(uListRoot, depth) {
				var that = this;
				var returnString = "";
				
				var cur = uListRoot[0];
				$(cur).children($("li")).each(function() {
					var $children = $(this).children();

					returnString += depth + $children.first()[0].outerHTML.replace("<a>","[[").replace("</a>","]]") + "\n";

					var $sublist = $children.filter("ul");
					if ($sublist.size() > 0) {
						returnString += that.parseHtmlToWikiText($sublist, depth+"*");	// recurse on the sublist				
					}
				});
				return returnString;
			},

			/**
			 * wikiTextHierarchy is a string containing a hierarchy in WikiText format.
			 * Note: the given hierarchy must be well-formed.
			 */
			parseWikiTextToHtml: function(hierarchyRoot, wikiTextHierarchy) {
				// make sure to remove the leading * from the root node before starting the process
				var hierarchyHtml = "<ul>" + this.parseWikiTextToHtmlHelper(wikiTextHierarchy.substring(1), "*") + "</ul>";
				return "<ul><li class='hierarchy_root'><a>" + hierarchyRoot + "</a>" + hierarchyHtml + "</li></ul>";
			},

			/**
			 * wikiTextHierarchy is a string containing a hierarchy in modified
			 *     WikiText format. Specifically, the root node has no leading *s.
			 * depth is a string composed of * characters denoting the current depth 
			 *     within the hierarchy.
			 */
			parseWikiTextToHtmlHelper: function(wikiTextHierarchy, depth) {
				// split the hierarchy into a list with the root and each child hierarchy in a list
				// this constructs a regular expression to search for lines with exactly depth+1 leading *s
				var nextDepth = "\n" + depth + "*";
				var r1 = new RegExp("\\*", "g");
				var regex = nextDepth.replace(r1, "\\*") + "(?!\\*)";
				var r2 = new RegExp(regex);
				// actually split the hierarchy into root and children
				var rootAndChildren = wikiTextHierarchy.split(r2);
				
				var root = rootAndChildren[0];	// this is just the root row of this hierarchy
				var children = rootAndChildren.slice(1);	// this is a list of direct children hierarchies of the root. It might be an empty list though
				
				// take the root element and make a list item for it
				var html = "<li>" + root.replace("[[","<a>").replace("]]","</a>") + "</li>";

				// if there are children, add an unordered-list element to contain them and recurse on each child
				if (children.length > 0) {
					html += "<ul>"
					// add the html for each child to our string
					for (var i = 0; i < children.length; i++) {
						html += this.parseWikiTextToHtmlHelper(children[i], depth+"*");
					}
					html += "</ul>"
				}				
				
				// now that our html has the root and the list with the children in html format we can finally return it.
				return html;
			}

		}).init(input_id, params);
	}
}(jQuery));