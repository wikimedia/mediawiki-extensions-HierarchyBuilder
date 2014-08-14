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
	my.VikiTitleIcon = {
		hookName: "",

		checkForTitleIcon : function(vikiObject, parameters, hookName) {
			this.hookName = hookName;
			node = parameters[0];

			this.queryForTitleIcon(vikiObject, node);
		},

		queryForTitleIcon: function(vikiObject, node) {
			var self = this;
			jQuery.ajax({
				url: node.apiURL,
				dataType: node.sameServer ? 'json' : 'jsonp',
				data: {
					action: 'getTitleIcons',
					format: 'json',
					pageTitle: node.pageTitle
				},
				beforeSend: function(jqXHR, settings) {
				},
				success: function(data, textStatus, jqXHR) {
					self.titleIconSuccessHandler(vikiObject, data, node);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					// alert("Error fetching title icon data. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
					vikiObject.showError("Error fetching title icon data for "+node.pageTitle+". errorThrown = "+errorThrown);
				}
			});
		},

		titleIconSuccessHandler :function(vikiObject, data, node) {
			if(data["error"] && data["error"]["code"] && data["error"]["code"]=== "unknown_action") {
				vikiObject.hookCompletion(VIKI.VikiTitleIcon.hookName, {"redraw" : false});
				return;
			}

			var titleIconURLs = data["getTitleIcons"]["titleIcons"];
			if(titleIconURLs.length == 0) {
				vikiObject.hookCompletion(VIKI.VikiTitleIcon.hookName, {"redraw" : false});
				return;
			}
			else {
				node.titleIconURL = titleIconURLs[0];
			}

			vikiObject.hookCompletion(VIKI.VikiTitleIcon.hookName, {"redraw" : true});
		}

	};

	return my;
}(window.VIKI || {}));