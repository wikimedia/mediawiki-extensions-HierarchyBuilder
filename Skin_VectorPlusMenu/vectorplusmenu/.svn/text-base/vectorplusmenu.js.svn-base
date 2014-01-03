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

// The following is closely adapted from VectorMenu.js from the original VectorMenu extension.

function minimumRequiredHeight(div) {
// childElements should be an array of jQuery('div') elements.

	minimumHeight = 0;

	childElements = [];
	div.children().each(function() {
		childElements.push($(this));
	});

	for(x in childElements) {
		if(minimumHeight < childElements[x].height())
			minimumHeight = childElements[x].height();
	}

	return minimumHeight;
}


jQuery(document).ready(function() {

	// Move p-search from wherever it was before and into the logsearch div.
	var search = jQuery('#p-search').detach();
	jQuery('#p-search-cell').append(search);

	// Calculate the minimum required height of any of the submenus.
	minimumHeight = minimumRequiredHeight(jQuery('#submenuBarItems'));
	minimumHeight+='px';

	// Hide the submenu bar, but set the height of its container div (submenuBarItems)
	// to be the relevant minimum height. 
	jQuery('.submenubar').hide();
	jQuery('#submenuBarItems').css('min-height', minimumHeight, '!important');

	// Set height of mw-page-base div to height of mw-head div. mw-page-base exists to
	// ensure the proper placement of the content div (right below it).
//	jQuery('#mw-page-base').css('height', jQuery('#mw-head').height());

	// Set mouse events.
	jQuery('.menubutton').click(function(e) {
		e.preventDefault();
	});
	jQuery('.menubutton').mouseenter(function() {
		jQuery('.menubutton').removeClass('menubutton-selected');
		jQuery('.menubutton').addClass('menubutton-not-selected');
		jQuery('.topmenubutton').addClass('menubutton-not-selected');
		jQuery(this).removeClass('menubutton-not-selected');
		jQuery(this).addClass('menubutton-selected');
		var href = jQuery(this).attr('href');
		jQuery('.submenubar').hide();
		jQuery(href).show();
	});
	jQuery('.topmenubutton').mouseenter(function() {
		jQuery('.menubutton').removeClass('menubutton-selected');
		jQuery('.menubutton').addClass('menubutton-not-selected');
		jQuery('.topmenubutton').addClass('menubutton-not-selected');
		jQuery(this).removeClass('menubutton-not-selected');
		jQuery('.submenubar').hide();
	});
	jQuery('.menu').mouseleave(function() {
		jQuery('.submenubar').hide();
		jQuery('.menubutton').removeClass('menubutton-selected');
		jQuery('.menubutton').removeClass('menubutton-not-selected');
		jQuery('.topmenubutton').removeClass('menubutton-not-selected');
	});
});


jQuery(window).load(function() {
	// This is present to avoid the case where DOM is ready before content is ready,
	// which causes misplacement of content.

	// If mw-page-base isn't the same height as mw-head,
	// set height of mw-page-base div to height of mw-head div. mw-page-base exists to
	// ensure the proper placement of the content div (right below it).

	//alert("window loaded");

	if(jQuery('#mw-page-base').height() !== jQuery('#mw-head').height())
		jQuery('#mw-page-base').css('height', jQuery('#mw-head').height());

});


/**
 * Vector-specific scripts (copied from vector.js)
 */
jQuery( function ( $ ) {
	$( 'div.vectorMenu' ).each( function () {
		var $el = $( this );
		$el.find( 'h3:first a:first' )
			// For accessibility, show the menu when the hidden link in the menu is clicked (bug 24298)
			.click( function ( e ) {
				$el.find( '.menu:first' ).toggleClass( 'menuForceShow' );
				e.preventDefault();
			} )
			// When the hidden link has focus, also set a class that will change the arrow icon
			.focus( function () {
				$el.addClass( 'vectorMenuFocus' );
			} )
			.blur( function () {
				$el.removeClass( 'vectorMenuFocus' );
			} );
	} );
} );
