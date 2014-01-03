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

mw.extInactivityTimeout = {

	setup: function(timeout, message) {

		var timer = null;
		var startTime = new Date().getTime();
		var one_minute = 60 * 1000;
		var warning = false;
		var duration_warning = one_minute;
		var duration_activity;
		if (timeout > duration_warning) {
			duration_activity = timeout - duration_warning;
		} else {
			duration_activity = one_minute;
		}
		var warning_message = message;

		function reset() {
			if (typeof(mw.user.isAnon) != 'undefined' && mw.user.isAnon()) {
				if (timer != null) {
					clearTimeout(timer);
				}
				return;
			}
			var now = new Date().getTime();
			if (now - startTime > duration_activity + duration_warning) {
				logout();
			}
			startTime = now;
			hideWarning();
			if (timer != null) {
				clearTimeout(timer);
			}
			timer = setTimeout(expire, duration_activity);
		}
	
		function expire() {
			if (typeof(mw.user.isAnon) != 'undefined' && mw.user.isAnon()) {
				if (timer != null) {
					clearTimeout(timer);
				}
				return;
			}
			if (warning) {
				logout();
			} else {
				showWarning();
				timer = setTimeout(expire, duration_warning);
			}
		}
	
		function hideWarning() {
			warning = false;
			jQuery(".InactivityTimeoutWarning").css("display", "none");
		}
	
		function showWarning() {
			warning = true;
			jQuery(".InactivityTimeoutWarning").css("display", "block");
		}
	
		function logout() {
			new mw.Api().get(
			{
				action:"logout"
			},
			{
				dataType: "jsonp",
				async: false
			}).
			always(function() {
				window.location.reload();
			});
		}

		jQuery("body").append(
			"<div style='display:none' class='InactivityTimeoutWarning'><p>" +
			warning_message + "</p></div>");
		reset();
		var body = jQuery("body");
		body.mousemove(reset);
		body.mouseup(reset);
		body.mousedown(reset);
		body.keyup(reset);
		body.keydown(reset);
	}
}
