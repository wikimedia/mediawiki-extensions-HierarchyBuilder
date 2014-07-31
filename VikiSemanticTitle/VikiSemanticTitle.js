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
	my.VikiSemanticTitle = {
		displayNames : {},
		hookName: "",

		checkForSemanticTitle : function(vikiObject, parameters, hookName) {
			this.hookName = hookName;

			nodes = parameters[0];

			for(var i = 0; i < nodes.length; i++)
				this.queryForSemanticTitle(vikiObject, nodes[i]);
		},

		queryForSemanticTitle : function(vikiObject, node) {

			jQuery.ajax({
	            url: vikiObject.myApiURL,
	            dataType: 'json',
	            data: {
	               action: 'getDisplayTitle',
	               format: 'json',
	               pageTitle: node.pageTitle
	            },
	            beforeSend: function(jqXHR, settings) {
	            	console.log(settings.url);
	            },
	            success: function(data, textStatus, jqXHR) {
	            	console.log(data);
	            	processDisplayTitle(vikiObject, data, node);

	            },
	            error: function(jqXHR, textStatus, errorThrown) {
	               alert("Error fetching getDisplayTitle data. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
	            }
			});

			function processDisplayTitle(vikiObject, data, node) {
				displayTitle = data["getDisplayTitle"]["result"];

				node.pageTitle = data["getDisplayTitle"]["result"];
				node.displayName = node.pageTitle;
				node.fullDisplayName = node.displayName;
				node.info = vikiObject.formatNodeInfo(node.fullDisplayName);

				vikiObject.redraw(true);
				vikiObject.hookCompletion(this.hookName, null);
			}
		}
	};

	return my;
}(window.VIKI || {}));