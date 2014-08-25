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
		parseDynamicPagePropertyName : function(propertyName) {
			this.propertyName = propertyName;
		},

		processQueryString : function(vikiObject, parameters, hookName) {
			this.hookName = hookName;
			node = parameters[0];

			if(node.pageTitle.indexOf("?") != -1) {
				node.searchable = false;
				
				queryString = node.pageTitle.substring(node.pageTitle.indexOf("?")+1, node.pageTitle.length).split("+").join(" ");
				node.pageTitle = node.pageTitle.substring(0, node.pageTitle.indexOf("?"));

				rawParameters = queryString.split("&");
				queryParameters = {};
				rawParameters.forEach(function(element, index, array) {
					parameterTuple = element.split("=");
					queryParameters[parameterTuple[0]] = parameterTuple[1];
				});

				this.queryForDisplayFormula(vikiObject, node, queryParameters);
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

	            },
	            error: function(jqXHR, textStatus, errorThrown) {
	            	vikiObject.showError("Error fetching display title data for "+node.pageTitle+". errorThrown = "+errorThrown);
					vikiObject.hookCompletion(this.hookName, { "redraw" : false });
	            }
			});
		},

		processDisplayFormula : function(vikiObject, data, node, queryParameters) {
			var formula = data.query.results[node.pageTitle].printouts[VIKI.VikiDynamicPages.propertyName][0];

			if(typeof formula !== 'string') {
				if(typeof VIKI.VikiDynamicPages.errorFlags[node.wikiTitle] === 'undefined') {
					vikiObject.showError("Error: wiki "+node.wikiTitle+" does not have a property named "+VIKI.VikiDynamicPages.propertyName+".");
					VIKI.VikiDynamicPages.errorFlags[node.wikiTitle] = 'YES';
				}
				vikiObject.hookCompletion(this.hookName, { "redraw" : false });
				return;
			}

			Object.keys(queryParameters).forEach(function(element, index, array) {
				formula = formula.replace("$"+element, queryParameters[element]);
			});

			// console.log("formula is now: "+formula);

			node.displayName = formula.length < 15 ? formula : formula.substring(0,15)+"...";
			node.fullDisplayName = formula;

			vikiObject.hookCompletion(VIKI.VikiDynamicPages.hookName, { "redraw" : true });
		}
	};

	return my;
}(window.VIKI || {}));