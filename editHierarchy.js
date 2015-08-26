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

( function( $ ) {
	/**
	 * Global function to initialize the edit hierarchy user interface.
	 *
	 * @param {string} inputId The id of a hidden form field in the
	 *  document that is used to pass the possibly modified hierarchy
	 *  back when the form is saved.
	 * @param {Object} params Object containing the following named
	 *  parameters necessary for initializing and customizing the edit
	 *  hierarchy interface.
	 *  The params object contains the following fields:
	 *
	 *   - divId - is the name of the div to render the hierarchy into
	 *   - hierarchy - is a 2 dimensional array of the data. For each row
	 *      in hierarchy, the first column is the level of indentation,
	 *      the second column is the name of the page, and the third
	 *      column is the URL of the page
	 *   - pages - is a list of the pages that are candidates to be added
	 *      to the hierarchy
	 *   - isDisabled - indicates whether editing should be disabled
	 *   - isMandatory - indicates whether it is mandatory for a value to
	 *      be returned (currently not implemented)
	 */
	window.editHierarchyInit = function( inputId, params ) {
		/**
		 * @class EditHierarchy
		 *
		 * Object literal implementing edit hierarchy.
		 *
		 * This is actually an object literal which is defined and used by the
		 * global editHierarchyInit function which contains all of the necessary
		 * functions for implementing the edit hierarchy functionality of the
		 * HierarchyBuilder extension.
		 */
		( {
			/**
			 * Initialize the edit hierarchy user interface.
			 *
			 * @param {string} inputId The id of a hidden form field in the
			 *  document that is used to pass the possibly modified hierarchy
			 *  back when the form is saved.
			 * @param {Object} params Object containing the following named
			 *  parameters necessary for initializing and customizing the edit
			 *  hierarchy interface.
			 *  The params object contains the following fields:
			 *
			 *   - divId - is the name of the div to render the hierarchy into
			 *   - hierarchy - is a 2 dimensional array of the data. For each row
			 *      in hierarchy, the first column is the level of indentation,
			 *      the second column is the name of the page, and the third
			 *      column is the URL of the page
			 *   - pages - is a list of the pages that are candidates to be added
			 *      to the hierarchy
			 *   - isDisabled - indicates whether editing should be disabled
			 *   - isMandatory - indicates whether it is mandatory for a value to
			 *      be returned (currently not implemented)
			 */
			init: function( inputId, params ) {
				var hierarchy = params.hierarchy;
				var unusedpages = params.unusedpages;

				/*if ( hierarchy.length < 1 ) {
					return;
				}*/

				hierarchy = this.parseWikiTextToHtml( params.hierarchyroot, hierarchy );

				var jqDivId = params.divId;
				var hierarchyDivId = jqDivId + "_hierarchy";
				var pageListDivId = jqDivId + "_pagelist";

				var innerframeattr = "class='hierarchy_inner' width='50%;'";
				var html = "<div class='hierarchy_outer' dir='ltr'>";

				console.log("[editHierarchy][init]: hierarchy length = " + params.hierarchy.length);
				console.log("[editHierarchy][init]: unusedpages length = " + params.unusedpages.length);

				if ( (params.hierarchy.length < 1) && (params.pages.length < 1) ) {
					html += "<p>" + params.errormessage + "</p>";
				} else {
					html += "<p>" + params.message + "</p>";
					html += "<table width='100%;'><tr><td " + innerframeattr + ">" +
							"<div id='" + hierarchyDivId + "'></div></td>" +
							"<td " + innerframeattr + ">" +
							"<div id='" + pageListDivId + "'></div></td></tr></table>";
				}
				html += "</div>";

				jqDivId = "#" + jqDivId;
				$( jqDivId )
					.html( html );

				if ( (params.hierarchy.length < 1) && (params.pages.length < 1) ) {
					return;
				}

				hierarchyDivId = "#" + hierarchyDivId;
				$( hierarchyDivId )
					.html( hierarchy );

				var obj = this;

				$( hierarchyDivId + " * li" )
					.css( "list-style-image", "none" );
				$( hierarchyDivId )
					.bind( "loaded.jstree", function( event, data ) {
						$( hierarchyDivId )
							.jstree( "open_all" );
					} );
				$( hierarchyDivId )
					.bind( "refresh.jstree", function( event, data ) {
						$( hierarchyDivId )
							.jstree( "open_all" );
					} );
				$( hierarchyDivId )
					.bind( "move_node.jstree", function( event, data ) {
						obj.saveList( inputId, hierarchyDivId );
					} );

				var plugins;
				if ( params.isDiabled ) {
					plugins = [ "themes", "html_data" ];
				} else {
					plugins = [ "themes", "html_data", "dnd", "crrm" ];
				}

				$( hierarchyDivId )
					.jstree( {
						"themes": {
							"theme": "apple",
							"dots": true,
							"icons": false
						},
						"crrm": {
							"move": {
								"check_move": function( m ) {
									if ( m.o.hasClass( 'hierarchy_root' ) ) {
										// don't let the user move the root node
										return false;
									}
									if ( m.r.hasClass( 'hierarchy_root' ) ) {
										// don't let the user move the node before or
										// after the root node
										if ( m.p === "before" || m.p === "after" ) {
											return false;
										}
									}
									return true;
								}
							}
						},
						"dnd": {
							"drop_target": false,
							"drag_target": false
						},
						"plugins": plugins
					} );

				var pagelist = "<ul><li class='hierarchy_root'><a>" +
					params.unusedpages + "</a><ul>";
				for ( var pagename in params.pages ) {
					pagelist += "<li><a>" + params.pages[ pagename ] +
						"<span style='display:none'>" + pagename +
						"</span></a></li>";
				}
				pagelist += "</ul></li></ul>";

				pageListDivId = "#" + pageListDivId;
				$( pageListDivId )
					.html( pagelist );

				$( pageListDivId + " * li" )
					.css( "list-style-image", "none" );
				$( pageListDivId )
					.bind( "loaded.jstree", function( event, data ) {
						$( pageListDivId )
							.jstree( "open_all" );
					} );
				$( pageListDivId )
					.bind( "refresh.jstree", function( event, data ) {
						$( pageListDivId )
							.jstree( "open_all" );
					} );
				$( pageListDivId )
					.bind( "move_node.jstree", function( event, data ) {
						var mylist = $( pageListDivId + " .hierarchy_root > ul" );
						var listitems = mylist.find( "li" )
							.get();
						mylist.children()
							.detach();
						listitems.sort( function( a, b ) {
							var compA = $( a )
								.text()
								.toUpperCase();
							var compB = $( b )
								.text()
								.toUpperCase();
							return ( compA < compB ) ? -1 : ( compA > compB ) ? 1 : 0;
						} );
						$.each( listitems, function( idx, itm ) {
							itm.removeAttribute( "class" );
							mylist.append( itm );
						} );
						$( pageListDivId )
							.jstree( "refresh" );
						obj.saveList( inputId, hierarchyDivId );
					} );

				$( pageListDivId )
					.jstree( {
						"themes": {
							"theme": "apple",
							"dots": true,
							"icons": false
						},
						"crrm": {
							"move": {
								"check_move": function( m ) {
									if ( m.o.hasClass( 'hierarchy_root' ) ) {
										// don't let the user move the root node
										return false;
									}
									if ( m.r.hasClass( 'hierarchy_root' ) ) {
										// don't let the user move the node before or
										// after the root node
										if ( m.p === "before" || m.p === "after" ) {
											return false;
										}
									}
									return true;
								}
							}
						},
						"dnd": {
							"drop_target": false,
							"drag_target": false
						},
						"plugins": plugins
					} );
			},

			/**
			 * Save the modified hierarchy in wikitext format.
			 *
			 * @param {string} inputId The id of a hidden field in which the
			 *  hierarchy is stored so it can be saved when the save button
			 *  is pressed.
			 * @param {string} divId The id of the div element which contains
			 *  the hierarchy which is being edited.
			 */
			saveList: function( inputId, divId ) {
				var list = $( divId + " .hierarchy_root > ul" )
					.clone();

				list.find( "ins" )
					.remove();
				list.find( "li" )
					.removeAttr( "class" );
				list.find( "li" )
					.removeAttr( "style" );
				list.find( "ul" )
					.removeAttr( "class" );
				list.find( "ul" )
					.removeAttr( "style" );
				list.find( "a" )
					.replaceWith( function() {
						var pageName = $( this )
							.children( 'span' )
							.first()
							.text();
						var pageLink = "[[" + pageName + "]]";
						return pageLink;
					} );

				var wikiText = this.parseHtmlToWikiText( list, "*" );

				document.getElementById( inputId )
					.value = wikiText;
			},

			/**
			 * Convert an HTML formatted hierarchy into wikitext.
			 *
			 * @param {Object} uListRoot A jquery object representing the ul
			 *  element of an unordered list.
			 * @param {string} depth A string composed of * characters denoting
			 *  the current depth within the hierarchy.
			 *  (ex: "*" is the hierarchy root, "**" is for the direct children
			 *  of the root)
			 * @return {string} Wikitext formatted hierarchy.
			 */
			parseHtmlToWikiText: function( uListRoot, depth ) {
				var that = this;
				var returnString = "";

				var cur = uListRoot[ 0 ];
				$( cur )
					.children( $( "li" ) )
					.each( function() {
						var $children = $( this )
							.contents();

						returnString += depth + $children.first()
							.text() + "\n";

						var $sublist = $children.filter( "ul" );
						if ( $sublist.size() > 0 ) {
							returnString += that.parseHtmlToWikiText( $sublist, depth + "*" ); // recurse on the sublist
						}
					} );
				return returnString;
			},

			/**
			 * Convert a wikitext formatted hierarchy into HTML.
			 *
			 * Note: the given hierarchy must be well-formed.
			 *
			 * @param {string} wikiTextHierarchy is a string containing a
			 *  hierarchy in WikiText format.
			 * @return {string} HTML formatted hierarchy.
			 */
			parseWikiTextToHtml: function( hierarchyRoot, wikiTextHierarchy ) {
				// make sure to remove the leading * from the root node before starting the process
				var hierarchyHtml = "<ul>" + this.parseWikiTextToHtmlHelper( "[[" + hierarchyRoot + " | " + hierarchyRoot + "]]" + "\n" + wikiTextHierarchy, "" ) + "</ul>";
				return hierarchyHtml;
			},

			/**
			 * Recursive helper method for converting a wikitext formatted
			 * hierarchy into HTML.
			 *
			 * @param {string} wikiTextHierarchy A hierarchy in modified wikitext
			 *  format. Specifically, the root node has no leading *s.
			 * @param {string} depth A string composed of * characters denoting
			 *  the current depth within the hierarchy.
			 * @return {string} HTML formatted hierarchy without the outer most
			 *  ul HTML tags.
			 */
			parseWikiTextToHtmlHelper: function( wikiTextHierarchy, depth ) {
				// split the hierarchy into a list with the root and each child hierarchy in a list
				// this constructs a regular expression to search for lines with exactly depth+1 leading *s
				var nextDepth = "\n" + depth + "*";
				var r1 = new RegExp( "\\*", "g" );
				var regex = nextDepth.replace( r1, "\\*" ) + "(?!\\*)";
				var r2 = new RegExp( regex );
				// actually split the hierarchy into root and children
				var rootAndChildren = wikiTextHierarchy.split( r2 );

				var root = rootAndChildren[ 0 ]; // this is just the root row of this hierarchy
				var children = rootAndChildren.slice( 1 ); // this is a list of direct children hierarchies of the root. It might be an empty list though

				// take the root eleent and make a list item for it but don't close the list item yet incase there are nested kids
				var html = "";
				if ( depth === "" ) {
					html = "<li class='hierarchy_root'>";
				} else {
					html = "<li>";
				}

				var pageLinkRegex = new RegExp( "(\\[\\[)(.*)(\\]\\])", "g" ); // regex to find a link ([[pageName | displayName]])
				var pageLinkMatches = pageLinkRegex.exec( root );
				var pageLink = ( pageLinkMatches.length > 0 ? pageLinkMatches[ 2 ] : "" );
				var pageName = pageLink.split( " | " )[ 0 ];
				var displayName = pageLink.split( " | " )[ 1 ] ? pageLink.split( " | " )[ 1 ] : pageName;
				var rootRow = "<a>" +
					displayName +
					"<span style=display:none>" + pageName + "</span>" +
					"</a>";
				html += rootRow;

				// if there are children, add an unordered-list element to contain them and recurse on each child
				if ( children.length > 0 ) {
					html += "<ul>";
					// add the html for each child to our string
					for ( var i = 0; i < children.length; i++ ) {
						html += this.parseWikiTextToHtmlHelper( children[ i ], depth + "*" );
					}
					html += "</ul>";
				}

				html += "</li>";

				// now that our html has the root and the list with the children in html format we can finally return it.
				return html;
			}

		} )
		.init( inputId, params );
	};
}( jQuery ) );
