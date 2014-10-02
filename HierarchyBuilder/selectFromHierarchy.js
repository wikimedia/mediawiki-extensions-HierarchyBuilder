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

// Display the hierarchy
// div_id is the name of the div to render the hierarchy into
// hierarchy is a 2 dimensional array of the data
// - for each row in hierarchy, the first column is the level of indentation,
//	 the second column is the name of the page, and the third column is
//	 the URL of the page
// inputId is the id of a hidden form field in the document that is used
//	 to pass the possibly modified list of selected pages back when the form
//	 is saved
// is_disabled indicates whether editing should be disabled
// is_mandatory indicates whether it is mandatory for a value to be returned
//	 (currently not implemented)
( function( $ ) {
	window.SelectFromHierarchy_init = function( inputId, params ) {
		( {
			init: function( inputId, params ) {
				//console.log("[selectFromHierarchy.js][init] " + inputId);
				//console.log("[selectFromHierarchy.js][init] ");
				//console.log(JSON.stringify(params));
				//console.log("[selectFromHierarchy.js][init] " + "selected = ");
				//console.log(params.selected_items);

				//var wikiText = "\*[[My University]]\n\*\*[[School of Arts and Sciences]]\n\*\*\*[[English Department]]\n\*\*\*[[Art Department]]\n\*\*\*[[Math Department]]\n\*\*[[School of Engineering]]\n\*\*\*[[Computer Engineering]]\n\*\*\*[[Electrical Engineering]]\n\*\*\*[[Mechanical Engineering]]";
				//console.log(this.parseWikiTextToHtml(wikiText));

				if ( params.hierarchy.length < 1 ) {
					return;
				}

				var selectedComponents = params.selected_items;

				//this.getSelectedHierarchyComponents(inputId);
				//console.log("[selectFromHierarchy][init] " + JSON.stringify(selectedComponents));

				//var hierarchy = $(params.hierarchy);
				var hierarchy = params.hierarchy;
				//console.log("[selectFromHierarchy.js][init] intput hierarchy = " + hierarchy);
				//var html = hierarchy.html();
				var html = hierarchy;
				//var ulId = params.div_id + "ul";
				//console.log("[selectFromHierarchy][init]" + html);
				//html = "<ul id='" + ulId + "'>" + html.replace(/&nbsp;/gi, " ") +
				//	"</ul>";
				//html = html.replace(/&nbsp;/gi, " ");
				//html = html.replace(/&amp;#160;/gi, " ");
				html = this.parseWikiTextToHtml( html );
				//console.log("[selectFromHierarchy.js][init] output hierarchy = " + html);

				var jqDivId = "#" + params.div_id;
				$( jqDivId )
					.html( html );
				$( jqDivId + " * li" )
					.css( "list-style-image", "none" );
				//alert("after css on jqDivId");

				//console.log($(jqDivId).html());

				var updatedSelectedComponents = [];
				var obj = this;
				$( jqDivId + "* li" )
					.each( function() {
						//var parent = $(this);
						$( this )
							.children( "a" )
							.each( function() {
								//console.log("[selectFromHierarchy.js][init] anchor text " + $(this).text());
								//var elementName = $(this).text().trim();
								//console.log("ALDSJFALSKDJFALSKDJFALSKDJFALSDJF:\t" + $(this).first().text());
								var elementName = $( this )
									.children( "span:first" )
									.text();
								//console.log("[selectFromHierarchy.js][init] " + elementName);
								if ( obj.isSelectedHierarchyComponent( elementName, selectedComponents ) && $.inArray( "[[" + elementName + "]]", updatedSelectedComponents ) === -1 ) {
									updatedSelectedComponents.push(
										"[[" + elementName + "]]" );
								}
							} );
					} );
				//alert("after updated components");
				selectedComponents = updatedSelectedComponents;
				//console.log("[selectFromHierarchy][init] " + JSON.stringify(selectedComponents));
				$( "#" + inputId )
					.val( selectedComponents.join( "," ) );
				$( jqDivId )
					.bind( "loaded.jstree", function( event, data ) {
						//alert("in loaded.jstree binding" + $(jqDivId).html());
						obj.initializeTree( jqDivId, params.is_disabled,
							selectedComponents, true, inputId, params.collapsed );
						$( jqDivId )
							.jstree( "open_all" );
					} );
				//alert("after loaded.jstree binding");
				$( jqDivId )
					.bind( "refresh.jstree", function( event, data ) {
						//alert("in refresh.jstree binding" + $(jqDivId).html());
						obj.initializeTree( jqDivId, params.is_disabled,
							selectedComponents, false, inputId, params.collapsed );
					} );
				//alert("after refresh.jstree binding");

				$( jqDivId )
					.jstree( {
						"themes": {
							"theme": "apple",
							"dots": true,
							"icons": false
						},
						"checkbox": {
							"two_state": true
						},
						"types": {
							"types": {
								"disabled": {
									"check_node": false,
									"uncheck_node": false
								}
							}
						},
						"plugins": [ "themes", "html_data", "checkbox", "types" ]
					} );

				//alert("end of init" + $(jqDivId).html());
			},

			getSelectedHierarchyComponents: function( inputId ) {
				//alert("getSelectedHierarchyComponents");
				var curValue = $( "#" + inputId )
					.val();
				curValue = $.trim( curValue );
				if ( curValue.length > 0 ) {
					return curValue.split( "," );
				} else {
					return [];
				}
			},

			initializeTree: function( jqDivId, is_disabled, selectedComponents,
				init, inputId, collapsed ) {
				//alert("initializeTree");
				var obj = this;
				if ( collapsed ) {
					$( jqDivId )
						.jstree( "close_all" );
				} else {
					$( jqDivId )
						.jstree( "open_all" );
				}
				$( jqDivId + "* li" )
					.each( function() {
						var parent = $( this );
						$( this )
							.children( "a" )
							.each( function() {
								//var elementName = $(this).text().trim();
								var elementName = $( this )
									.children( "span:first" )
									.text();
								if ( obj.isSelectedHierarchyComponent( elementName,
									selectedComponents ) ) {
									$( jqDivId )
										.jstree( "check_node", parent );
								}
							} );
					} );
				if ( is_disabled ) {
					$( jqDivId + "* li" )
						.each( function() {
							$.jstree._reference( jqDivId )
								.set_type( "disabled",
									$( this ) );
						} );
				}
				if ( init ) {
					$( jqDivId )
						.bind( "check_node.jstree", function( event, data ) {
							data.rslt.obj.children( "a" )
								.each( function() {
									var elementName =
										//$(this).text().trim();
										$( this )
										.children( "span:first" )
										.text();
									obj.checkNode( elementName, inputId );
									obj.processDups( jqDivId, elementName, "check" );
								} );
						} );
					$( jqDivId )
						.bind( "uncheck_node.jstree", function( event, data ) {
							data.rslt.obj.children( "a" )
								.each( function() {
									var elementName =
										//$(this).text().trim();
										$( this )
										.children( "span:first" )
										.text();
									obj.uncheckNode( elementName, inputId );
									obj.processDups( jqDivId, elementName, "uncheck" );
								} );
						} );
				}
			},

			isSelectedHierarchyComponent: function( elementName,
				selectedComponents ) {
				//console.log("[selectFromHierarchy.js][isSelectedHierarchyComponent] elementName = " + elementName);
				if ( selectedComponents && selectedComponents.length > 0 ) {
					var pageName = "[[" + elementName + "]]";
					//console.log("[selectFromHierarchy.js][isSelectedHierarchyComponent] " + pageName + "\t" + JSON.stringify(selectedComponents));
					//console.log("[selectFromHierarchy.js][isSelectedHierarchyComponent] " +  $.inArray(pageName, selectedComponents));
					var index = $.inArray( pageName, selectedComponents );
					if ( index !== -1 ) {
						//console.log("********************************************************************************************");
						return true;
					}
				}
				return false;
			},

			checkNode: function( elementName, inputId ) {
				//alert("checkNode");
				var selectedComponents =
					this.getSelectedHierarchyComponents( inputId );
				var pageName = "[[" + elementName + "]]";
				var curValue = pageName;
				if ( selectedComponents.length > 0 ) {
					var index = $.inArray( pageName, selectedComponents );
					if ( index === -1 ) {
						selectedComponents.push( pageName );
						selectedComponents.sort();
					}
					//console.log("[checkNode] " + "selectedComponents = ");
					//console.log(selectedComponents);
					curValue = selectedComponents.join( "," );
				}
				$( "#" + inputId )
					.val( curValue );
				//console.log("[selectFromHierarchy.js][checkNode] curValue = " + curValue);
			},

			uncheckNode: function( elementName, inputId ) {
				//alert("uncheckNode");				
				var selectedComponents =
					this.getSelectedHierarchyComponents( inputId );
				var pageName = "[[" + elementName + "]]";
				var curValue = "";
				if ( selectedComponents.length > 0 ) {
					var index = $.inArray( pageName, selectedComponents );
					if ( index !== -1 ) {
						selectedComponents.splice( index, 1 );
					}
					curValue = selectedComponents.join( "," );
				}
				$( "#" + inputId )
					.val( curValue );
			},

			/**
			 * jqDivId is the divId of the hierarchy or something like that.
			 * elementName is the name of the element who's duplicates we're
			 *     trying to handle.
			 * inputId is the id of the input thing we hide stuff in.
			 * action is a string either "check" or "uncheck" which indicates
			 *     how duplicate rows should be processed.
			 *
			 * This function will run through all the other unselected hierarchy
			 * elements searching for duplicates of the given element. If any
			 * are found then we check those elements too.
			 */
			processDups: function( jqDivId, elementName, action ) {
				action = action === "check" ? "check_node" : "uncheck_node";
				var status = action === "check_node" ? "jstree-unchecked" : "jstree-checked";
				$( jqDivId + "* li" )
					.each( function() {
						var parent = $( this );
						$( this )
							.children( "a" )
							.each( function() {
								//var curElementName = $(this).text().trim();
								var curElementName = $( this )
									.children( "span:first" )
									.text();
								if ( curElementName === elementName && parent.hasClass( status ) ) {
									$( jqDivId )
										.jstree( action, parent );
								}
							} );
					} );
			},

			/**
			 * wikiTextHierarchy is a string containing a hierarchy in WikiText format.
			 * Note: the given hierarchy must be well-formed.
			 */
			parseWikiTextToHtml: function( wikiTextHierarchy ) {
				var hierarchyHtml = this.parseWikiTextToHtmlHelper( wikiTextHierarchy, "" );
				return hierarchyHtml;
			},

			/**
			 * wikiTextHierarchy is a string containing a hierarchy in modified
			 *     WikiText format. Specifically, the root node has no leading *s.
			 * depth is a string composed of * characters denoting the current depth
			 *     within the hierarchy.
			 */
			parseWikiTextToHtmlHelper: function( wikiTextHierarchy, depth ) {
				// split the hierarchy into a list with the root and each child hierarchy in a list
				// this constructs a regular expression to search for lines with exactly depth+1 leading *s
				var nextDepth = "^" + depth + "*";
				var r1 = new RegExp( "\\*", "g" );
				var regex = nextDepth.replace( r1, "\\*" ) + "(?!\\*)";
				var r2 = new RegExp( regex, "mi" );
				// actually split the hierarchy into root and children
				var rootAndChildren = wikiTextHierarchy.split( r2 );

				var root = rootAndChildren[ 0 ]; // this is just the root row of this hierarchy
				var children = rootAndChildren.slice( 1 ); // this is a list of direct children hierarchies of the root. It might be an empty list though

				// take the root eleent and make a list item for it but don't close the list item yet incase there are nested kids
				var html = "";
				if ( depth !== "" ) {
					html = "<li>"; // + root.replace("[[","<a>").replace("]]","</a>");

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
				}

				// if there are children, add an unordered-list element to contain them and recurse on each child
				if ( children.length > 0 ) {
					html += "<ul>";
					// add the html for each child to our string
					for ( var i = 0; i < children.length; i++ ) {
						html += this.parseWikiTextToHtmlHelper( children[ i ], depth + "*" );
					}
					html += "</ul>";
				}

				if ( depth !== "" ) {
					html += "</li>";
				}

				// now that our html has the root and the list with the children in html format we can finally return it.
				return html;
			}
		} )
		.init( inputId, params );
	};
}( jQuery ) );