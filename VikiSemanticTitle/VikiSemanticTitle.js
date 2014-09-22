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
			node = parameters[0];
			node.semanticTitle = node.pageTitle;
			if(!node.semanticQueried && !node.dynamicPage)
				this.queryForSemanticTitle(vikiObject, node);
		},

		queryForSemanticTitle : function(vikiObject, node) {
			var self = this;
			jQuery.ajax({
	            url: node.apiURL,
				dataType: node.sameServer ? 'json' : 'jsonp',
	            data: {
	               action: 'getDisplayTitle',
	               format: 'json',
	               pageTitle: node.semanticTitle
	            },
	            beforeSend: function(jqXHR, settings) {
	            },
	            success: function(data, textStatus, jqXHR) {
	            	self.processDisplayTitle(vikiObject, data, node);

	            },
	            error: function(jqXHR, textStatus, errorThrown) {
	            	vikiObject.showError("Error fetching display title data for "+node.pageTitle+". errorThrown = "+errorThrown);
					vikiObject.hookCompletion(self.hookName);
	            }
			});
		},

		processDisplayTitle : function(vikiObject, data, node) {
			semanticTitle = data["getDisplayTitle"]["result"];
			if(node.semanticTitle !== semanticTitle) {

				// node.pageTitle = data["getDisplayTitle"]["result"];
				node.displayName = semanticTitle.length < 15 ? semanticTitle : semanticTitle.substring(0,15)+"...";
				node.fullDisplayName = semanticTitle + " ("+node.pageTitle+")";
			}
			node.semanticQueried = true;

			// vikiObject.redrawNode(node);
			vikiObject.hookCompletion(VIKI.VikiSemanticTitle.hookName, { "redrawNode" : true, "node" : node });
		}
	};

	return my;
}(window.VIKI || {}));