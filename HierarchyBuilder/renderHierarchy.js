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

/**
 * Display the hierarchy
 * divId is the name of the div to render the hierarchy into
 * hierarchy is a 2 dimensional array of the data
 * - for each row in hierarchy, the first column is the level of indentation,
 *	 the second column is the name of the page, and the third column is
 *	 the URL of the page
 * collapsed is a Boolean that indicates if the tree should start collapsed
 * numbered is a boolean that indicates if the hierarchy should be auto-numbered
 */
( function( $ ) {
	window.renderHierarchy = function( divId, hierarchy, collapsed, numbered ) {
		( {
			render: function( divId, hierarchy, collapsed, numbered ) {
				if ( hierarchy.length < 1 ) {
					return;
				}

				if ( numbered ) {
					var $hierarchy = $( hierarchy );
					$hierarchy = this.numberHtml( $hierarchy );
					hierarchy = $hierarchy[ 0 ].outerHTML;
				}

				var jqDivId = "#" + divId;
				$( jqDivId )
					.html( hierarchy );
				$( jqDivId + " * li" )
					.css( "list-style-image", "none" );
				$( jqDivId )
					.bind( "loaded.jstree", function( event, data ) {
						if ( collapsed ) {
							$( jqDivId )
								.jstree( "close_all" );
						} else {
							$( jqDivId )
								.jstree( "open_all" );
						}
					} );
				$( jqDivId )
					.bind( "refresh.jstree", function( event, data ) {
						if ( collapsed ) {
							$( jqDivId )
								.jstree( "close_all" );
						} else {
							$( jqDivId )
								.jstree( "open_all" );
						}
					} );
				$( jqDivId )
					.jstree( {
						"themes": {
							"theme": "apple",
							"dots": true,
							"icons": false
						},
						"plugins": [ "themes", "html_data" ]
					} );
			},

			/**
			 * uListRoot is a jquery object, representing the top level <ul>
			 *     element of the entire HTML hierarchy.
			 *
			 * This function takes an HTML hierarchy and applies section numbers
			 * to each row of the hierarchy. The resulting HTML hierarchy with
			 * section numbers applied is then returned.
			 */
			numberHtml: function( uListRoot ) {
				var list = uListRoot.clone();
				return this.numberHtmlHelper( list, "" );
			},

			/**
			 * uListRoot is a jquery object, representing the <ul> element of a list.
			 * numberPrefix is a string containing the immediate parent's complete
			 *     section number. (ex: 1.1) This is used to construct the child's
			 *     complete section number by using the numberPrefix as a suffix.
			 *     (ex: 1.1 is used to create 1.1.1)
			 */
			numberHtmlHelper: function( uListRoot, numberPrefix ) {
				var that = this;

				var $numberSuffix = 1; // this is the subsection number for a particular child. It starts at one because the first child is numbered 1.

				var cur = uListRoot[ 0 ];
				$( cur )
					.children( $( "li" ) )
					.each( function() {
						var $children = $( this )
							.contents();

						var childNumber = numberPrefix === "" ? $numberSuffix++ : numberPrefix + "." + $numberSuffix++;
						var numberedChild = childNumber + " " + $children.first()
							.text();
						$children.first()
							.text( numberedChild );

						var $sublist = $children.filter( "ul" );
						if ( $sublist.size() > 0 ) {
							that.numberHtmlHelper( $sublist, childNumber ); // recurse on the sublist
						}
					} );
				return uListRoot;
			}
		} )
		.render( divId, hierarchy, collapsed, numbered );
	};
}( jQuery ) );
