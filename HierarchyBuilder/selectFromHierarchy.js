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

// Display the hierarchy
// div_id is the name of the div to render the hierarchy into
// hierarchy is a 2 dimensional array of the data
// - for each row in hierarchy, the first column is the level of indentation,
//	 the second column is the name of the page, and the third column is
//	 the URL of the page
// input_id is the id of a hidden form field in the document that is used
//	 to pass the possibly modified list of selected pages back when the form
//	 is saved
// is_disabled indicates whether editing should be disabled
// is_mandatory indicates whether it is mandatory for a value to be returned
//	 (currently not implemented)
(function($) {
	window.SelectFromHierarchy_init = function(input_id, params) {
		({
			init: function(input_id, params) {
				if (params.hierarchy.length < 1) {
					return;
				}
			
				var selected_components =
					this.getSelectedHierarchyComponents(input_id);
			
				var hierarchy = $(params.hierarchy);
				var html = hierarchy.html();
				var ulId = params.div_id + "ul";
				html = "<ul id='" + ulId + "'>" + html.replace(/&nbsp;/gi, " ") +
					"</ul>";
			
				var jqDivId = "#" + params.div_id;
				$(jqDivId).html(html);
				$(jqDivId + " * li").css("list-style-image", "none");
				var updated_selected_components = new Array();
				var obj = this;
				$(jqDivId + "* li").each(function() {
					var parent = $(this);
					$(this).children("a").each(function() {
						var element_name = $(this).children("span:first").text();
						if (obj.isSelectedHierarchyComponent(element_name,
							selected_components)) {
							updated_selected_components.push(
								"[[" + element_name + "]]");
						}
					});
				});
				selected_components = updated_selected_components;
			 	$("#" + input_id).val(selected_components.join(","));
				$(jqDivId).bind("loaded.jstree", function (event, data) {
					obj.initializeTree(jqDivId, params.is_disabled,
						selected_components, true, input_id, params.collapsed);
				});
				$(jqDivId).bind("refresh.jstree", function (event, data) {
					obj.initializeTree(jqDivId, params.is_disabled,
						selected_components, false, input_id, params.collapsed);
				});
				$(jqDivId).jstree({
					"themes" : {
						"theme": "apple",
						"dots": true,
						"icons": false
					},
					"checkbox" : {
						"two_state": true
					},
					"types" : {
						"types" : {
							 "disabled" : {
								 "check_node": false,
								 "uncheck_node": false
							 }
						}
					},
					"plugins" : [ "themes", "html_data", "checkbox", "types" ]
				});
			},
			
			getSelectedHierarchyComponents: function(input_id) {
				var cur_value = $("#" + input_id).val();
				cur_value = $.trim(cur_value);
				if (cur_value.length > 0) {
					return cur_value.split(",");
				} else {
					return [];
				}
			},
			
			initializeTree: function(jqDivId, is_disabled, selected_components,
				init, input_id, collapsed) {
				var obj = this;
				if (collapsed) {
					$(jqDivId).jstree("close_all");
				} else {
					$(jqDivId).jstree("open_all");
				}
				$(jqDivId + "* li").each(function() {
					var parent = $(this);
					$(this).children("a").each(function() {
						var element_name = $(this).children("span:first").text();
						if (obj.isSelectedHierarchyComponent(element_name,
							selected_components)) {
							$(jqDivId).jstree("check_node", parent);
						}
					});
				});
				if (is_disabled) {
					$(jqDivId + "* li").each(function() {
						$.jstree._reference(jqDivId).set_type("disabled",
							$(this));
					});
				}
				if (init) {
					$(jqDivId).bind("check_node.jstree", function (event, data) {
						data.rslt.obj.children("a").each(function() {
							var element_name =
								$(this).children("span:first").text();
							obj.checkNode(element_name, input_id);
						});
					});
					$(jqDivId).bind("uncheck_node.jstree", function (event, data) {
						data.rslt.obj.children("a").each(function() {
							var element_name =
								$(this).children("span:first").text();
							obj.uncheckNode(element_name, input_id);
						});
					});
				}
			},
			
			isSelectedHierarchyComponent: function(element_name,
				selected_components) {
				if (selected_components && selected_components.length > 0) {
					var page_name = "[[" + element_name + "]]";
					var index = $.inArray(page_name, selected_components);
					if (index != -1) {
						return true;
					}
				}
				return false;
			},
			
			checkNode: function(element_name, input_id) {
				var selected_components =
					this.getSelectedHierarchyComponents(input_id);
				var page_name = "[[" + element_name + "]]";
				var cur_value = page_name;
				if (selected_components.length > 0) {
					var index = $.inArray(page_name, selected_components);
					if (index == -1) {
						selected_components.push(page_name);
						selected_components.sort();
					}
					cur_value = selected_components.join(",");
				}
				$("#" + input_id).val(cur_value);
			},
			
			uncheckNode: function(element_name, input_id) {
				var selected_components =
					this.getSelectedHierarchyComponents(input_id);
				var page_name = "[[" + element_name + "]]";
				var cur_value = "";
				if (selected_components.length > 0) {
					var index = $.inArray(page_name, selected_components);
					if (index != -1) {
						selected_components.splice(index, 1);
					}
					cur_value = selected_components.join(",");
				}
				$("#" + input_id).val(cur_value);
			}
		}).init(input_id, params);
	}
}(jQuery));
