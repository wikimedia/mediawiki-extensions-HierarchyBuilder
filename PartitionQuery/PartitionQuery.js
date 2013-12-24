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

window.firstPartition = function(formname, buttonNameStem) {
	var letters = jQuery('#' + formname + ' input:hidden[name=Letters]').val(); 
	jQuery('#' + buttonNameStem + '0').click();
}

window.nextClicked = function(formname, buttonNameStem) {
	var letters = jQuery('#' + formname + ' input:hidden[name=Letters]').val(); 
	var index =
		jQuery('#' + formname + ' input:hidden[name=CurrentIndex]').val();
	if (index < 0) {
		return;
	}
	index++;
	if (index >= letters.length) {
		return;
	}
	jQuery('#' + buttonNameStem + index).click();
}

window.previousClicked = function(formname, buttonNameStem) {
	var letters = jQuery('#' + formname + ' input:hidden[name=Letters]').val();
	var index =
		jQuery('#' + formname + ' input:hidden[name=CurrentIndex]').val();
	if (index < 1) {
		return;
	}
	index--;
	if (index >= letters.length) {
		return;
	}
	jQuery('#' + buttonNameStem + index).click();
}

window.buttonClicked = function(formname, newIndex, buttonNameStem, divNameStem,
	apiurl) {

	function populateDiv(formname, letter, divName, apiurl) {
		var property =
			jQuery('#' + formname + ' input:hidden[name=PartitionProperty]').
				val();
		var query = jQuery('#' + formname + ' input:hidden[name=Query]').val();
		var params =
			jQuery('#' + formname + ' input:hidden[name=Params]').val();
		jQuery.ajax({
			type: "POST",
			url: apiurl,
			data:	{
				action: "partitionquery",
				format: "json",
				property: property,
				letter: letter,
				query: query,
				params: params
			},
			dataType: "json",
			success: function(data)	{
				jQuery('#' + divName).html(data.partitionquery);
			}
		});
	}

	var currentIndex =
		jQuery('#' + formname + ' input:hidden[name=CurrentIndex]').val();
	if (newIndex == currentIndex) {
		return;
	}

	var letters = jQuery('#' + formname + ' input:hidden[name=Letters]').val();
	var nextButton = jQuery('#' + buttonNameStem + "Next");
	if (newIndex >= letters.length - 1) {
		nextButton.attr("disabled", "disabled");
	} else {
		nextButton.removeAttr("disabled");
	}
	var previousButton =
		jQuery('#' + buttonNameStem + "Previous");
	if (newIndex <= 0) {
		previousButton.attr("disabled", "disabled");
	} else {
		previousButton.removeAttr("disabled");
	}

    if (currentIndex != -1) {
		var currentButton = jQuery('#' + buttonNameStem + currentIndex);
		currentButton.removeClass('partition-query-button-selected');
		currentButton.addClass('partition-query-button-unselected');
	}
	var newButton = jQuery('#' + buttonNameStem + newIndex);
	newButton.removeClass('partition-query-button-unselected');
	newButton.addClass('partition-query-button-selected');

	jQuery('#' + formname + ' input:hidden[name=CurrentIndex]').val(newIndex);

    if (currentIndex != -1) {
		var currentDivName = divNameStem + currentIndex;
		jQuery('#' + currentDivName).css("display", "none");
	}

	var alreadyClicked =
		jQuery('#' + formname + ' input:hidden[name=AlreadyClickedLetters]').
			val();
	var newDivName = divNameStem + newIndex;
	jQuery('#' + newDivName).css("display", "block");
	var newLetter = letters.charAt(newIndex);
	if (alreadyClicked.indexOf(newLetter) == -1) {
		jQuery('#' + formname + ' input:hidden[name=AlreadyClickedLetters]').
			val(alreadyClicked + newLetter);
		populateDiv(formname, newLetter, newDivName, apiurl);
	}
}
