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
// divId is the name of the div to render the hierarchy into
// hierarchy is a 2 dimensional array of the data
// - for each row in hierarchy, the first column is the level of indentation,
//	 the second column is the name of the page, and the third column is
//	 the URL of the page
// collapsed is a Boolean that indicates if the tree should start collapsed
(function($) {
	window.renderHierarchy = function(divId, hierarchy, collapsed) {
		//console.log("[renderHierarchy] " + hierarchy);
		if (hierarchy.length < 1) {
			return;
		}
	
		var jqDivId = "#" + divId;
		$(jqDivId).html(hierarchy);
		$(jqDivId + " * li").css("list-style-image", "none");
		$(jqDivId).bind("loaded.jstree", function (event, data) {
			if (collapsed) {
				$(jqDivId).jstree("close_all");
			} else {
				$(jqDivId).jstree("open_all");
			}
		});
		$(jqDivId).bind("refresh.jstree", function (event, data) {
			if (collapsed) {
				$(jqDivId).jstree("close_all");
			} else {
				$(jqDivId).jstree("open_all");
			}
		});
		$(jqDivId).jstree({
			"themes" : {
				"theme": "apple",
				"dots": true,
				"icons": false
			},
			"plugins" : [ "themes", "html_data" ]
		});
	}
}(jQuery));
