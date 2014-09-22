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
	my.VikiDynamicPages = {
		hookName: "",
		propertyName: "",
		errorFlags: {},
		visitedPages: {},
		parseDynamicPagePropertyName : function(propertyName) {
			this.propertyName = propertyName;
		},

		checkForSelfLink : function(vikiObject, parameters, hookName) {
			newNode = parameters[0];
			originNode = parameters[1];

			if(node.pageTitle.indexOf("?") != -1) {
				newNodePageTitle = newNode.pageTitle.substring(0, node.pageTitle.indexOf("?"));
				if(newNodePageTitle === originNode.pageTitle)
					newNode.unadded = true;
			}

			vikiObject.hookCompletion(hookName);
		},

		processQueryString : function(vikiObject, parameters, hookName) {
			this.hookName = hookName;
			node = parameters[0];

			if(node.pageTitle.indexOf("?") != -1) {
				node.searchable = false;
				node.dynamicPage = true;				
				queryString = node.pageTitle.substring(node.pageTitle.indexOf("?")+1, node.pageTitle.length).split("+").join(" ");
				node.pageTitle = node.pageTitle.substring(0, node.pageTitle.indexOf("?"));

				rawParameters = queryString.split("&");
				queryParameters = {};
				rawParameters.forEach(function(element, index, array) {
					parameterTuple = element.split("=");
					queryParameters[parameterTuple[0]] = parameterTuple[1];
				});

				if(!this.visitedPages[node.pageTitle]) {
					this.queryForDisplayFormula(vikiObject, node, queryParameters);
				}
				else {
					this.processDisplayFormula(vikiObject, this.visitedPages[node.pageTitle], node, queryParameters);
				}
			}
		},

		queryForDisplayFormula : function(vikiObject, node, queryParameters) {
			var self = this;

			jQuery.ajax({
	            url: node.apiURL,
				dataType: node.sameServer ? 'json' : 'jsonp',
	            data: {
	               action: 'askargs',
	               conditions: node.pageTitle,
	               printouts: self.propertyName,
	               format: 'json',
	            },
	            beforeSend: function(jqXHR, settings) {
	            },
	            success: function(data, textStatus, jqXHR) {
	            	self.processDisplayFormula(vikiObject, data, node, queryParameters);
	            	self.visitedPages[node.pageTitle] = data;

	            },
	            error: function(jqXHR, textStatus, errorThrown) {
	            	vikiObject.showError("Error fetching "+VIKI.VikiDynamicPages.propertyName+" data for "+node.pageTitle+" on "+node.wikiTitle+". errorThrown = "+errorThrown);
					vikiObject.hookCompletion(this.hookName);
	            }
			});
		},

		processDisplayFormula : function(vikiObject, data, node, queryParameters) {
			var formula = data.query.results[node.pageTitle].printouts[VIKI.VikiDynamicPages.propertyName][0];

			if(typeof formula !== 'string') {
					if(!VIKI.VikiDynamicPages.errorFlags[node.wikiTitle] || !VIKI.VikiDynamicPages.errorFlags[node.wikiTitle][node.pageTitle]) {
					vikiObject.showError("Error: "+node.wikiTitle+" does not have a property '"+VIKI.VikiDynamicPages.propertyName+"' defined for page "+node.pageTitle+".");

					
					if(!VIKI.VikiDynamicPages.errorFlags[node.wikiTitle])
						VIKI.VikiDynamicPages.errorFlags[node.wikiTitle] = {};
					VIKI.VikiDynamicPages.errorFlags[node.wikiTitle][node.pageTitle] = true;

				}
				vikiObject.hookCompletion(this.hookName, { "redraw" : false });
				return;
			}

			Object.keys(queryParameters).forEach(function(element, index, array) {
				formula = formula.replace("$"+element, queryParameters[element]);
			});

			node.displayName = formula;
			node.fullDisplayName = formula;
			// vikiObject.redrawNode(node);
			vikiObject.hookCompletion(VIKI.VikiDynamicPages.hookName, { "redrawNode" : true, "node" : node });
		}
	};

	return my;
}(window.VIKI || {}));