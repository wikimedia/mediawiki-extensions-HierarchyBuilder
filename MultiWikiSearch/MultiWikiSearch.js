window.MultiWikiSearch = function(purpose, apiURL) {

	this.excludedWikis = [];
	this.includedWikis= [];
	this.allWikisList= [];
	this.namespacesList= {};
	this.searchTitle=true;
	this.searchText=false;
	this.searchTerms= "";
	this.totalWikiSearchCount= 0;
	this.searchedWikiCount= 0;
	this.apiurl= apiURL;
	this.maxWidth = -1;
	this.snippets = true;

	if(purpose === "diff" || purpose === "addNodes")
		this.searchPurpose = purpose;
	else
		this.searchPurpose = "diff";

	MultiWikiSearch.prototype.showSnippets = function(show) {
		this.snippets = show ? true : false;
	}

	MultiWikiSearch.prototype.setMaxWidth = function(width) {
		this.maxWidth = width;
	}

	MultiWikiSearch.prototype.initializeMWS = function(divID) {
		var self = this;

		div = $(""+divID);

		html = "\
<div id=\"MultiWikiSearch\">\
	<div id=\"searchTermsDiv\">\
		<fieldset>\
			<legend>Search Parameters</legend>\
			<p>Enter at least one search term and at least one wiki to be included in the search:</p>\
			<table><tbody>\
				<tr><td id=\"searchTermsTd\">Search terms:</td><td><input type=\"text\" name=\"searchTerms\" id=\"searchTerms\"></td>\
				<tr><td>Scope:</td><td>\
					<select name=\"scope\" id=\"scope\">\
						<option value=\"title\">Title only</option>\
						<option value=\"text\">Text only</option>\
						<option value=\"both\">Title and text</option>\
					</select></td></tr>\
				<tr><td id=\"wikisTd\">Wikis:</td><td>\
					<table><tbody>\
						<tr><td>\
							<fieldset>\
								<legend>Included Wikis</legend>\
								<select name=\"wikis\" id=\"includedWikis\" multiple=\"multiple\"></select>\
							</fieldset>\
						<td>\
							<button type=\"button\" id=\"moveLeft\">Move Left</button>\
							<button type=\"button\" id=\"moveRight\">Move Right</button>\
						</td>\
						</td><td>\
							<fieldset>\
								<legend>Excluded Wikis</legend>\
								<select name=\"wikis\" id=\"excludedWikis\" multiple=\"multiple\"></select>\
							</fieldset>\
						</td></tr>\
					</tbody></table>\
				</td></tr>\
				<tr><td>Namespaces:</td><td>\
					<fieldset>\
						<legend>Namespaces</legend>\
						<div id=\"namespacesDiv\"></div>\
					</fieldset>\
				</td></tr>\
				<tr><td><button type=\"button\" id=\"MWS_searchButton\">Search</button></td></tr>\
			</tbody></table>\
		</fieldset>\
	</div>\
	<div id=\"searchResultsDiv\">\
		<fieldset>\
			<legend>Search Results</legend>\
			<div id=\"progressbar\"></div>\
			<div id=\"searchResultsSection\"></div>\
			<button type=\"button\" id=\"diffButton\">Diff</button>\
		</fieldset>\
	</div>\
";

		if(self.searchPurpose === 'diff') {
			html += "\
	<div id=\"diffDiv\">\
		<fieldset>\
			<legend>Diff Results</legend>\
			<div id=\"diffResultsSection\"></div>\
		</fieldset>\
	</div>\
</div>\
";
		}
		else {
			html+="</div>";
		}

		div.append(html);


		jQuery.ajax({
			url: self.apiurl,
			dataType: 'json',
			data: {
				action: "getAllWikis",
				format: "json"
			},
			success: function(data, textStatus, jqXHR) {
				self.log("success fetching");
				self.parseInitialData(data);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Unable to fetch list of wikis.");
			}
		});
		$("#searchTerms").bind("input", function() {
			self.searchTerms = $(this).val();
			self.log(self.searchTerms);
		});
		$("#searchTerms").keyup(function(event) {
			if(event.keyCode === 13) {	// the enter key
				self.beginSearch();	// triggers the start to the search
			}
		});
		$("#scope").change(self.scopeHandler);		
		$("#diffButton").click(function() { self.beginDiff(); });
		$("#moveLeft").click(function() { console.log("#moveLeft clicked"); self.moveOptionsLeft(); });
		$("#moveRight").click(function() { console.log("#moveRight clicked"); self.moveOptionsRight(); });
		$("#MWS_searchButton").click(function() { console.log("#MWS_searchButton"); self.beginSearch(); });
		


	}

	MultiWikiSearch.prototype.parseInitialData = function(data) {
		var self = this;

		allWikis = data["getAllWikis"]["results"];

		$(document).ready(function() {
			for(var i in allWikis) {
				var title = allWikis[i]["fulltext"];
				self.log(allWikis[i]);
				
				if(allWikis[i]["printouts"]["Gestalt Community Searchable"].length > 0 && allWikis[i]["printouts"]["Gestalt Community Searchable"][0] === 't') {
					$("#excludedWikis").append("<option class=\"excludedOption\" value=\""+title+"\" id=\""+title+"\" >"+title+"</option>");
					self.excludedWikis[title] = allWikis[i];
					self.allWikisList.push(allWikis[i]);
				}
			}
			$("#includedWikis").attr("size", 10);
			$("#includedWikis").change(function() { self.namespaceHandler(); });
			$("#excludedWikis").attr("size", 10);
		});

	}

	MultiWikiSearch.prototype.scopeHandler = function() {
		var self = this;

		var option = $("#scope option:selected");
		if(option.text()==="Title only") {
			self.log("Title only selected");
			self.searchTitle = true;
			self.searchText = false;
		}
		else if(option.text()==="Text only") {
			self.log("Text only selected");
			self.searchTitle = false;
			self.searchText = true;
		}
		else {
			self.log("Title and text selected");
			self.searchTitle = true;
			self.searchText = true;
		}

	}

	MultiWikiSearch.prototype.moveOptionsLeft = function() {
		var self = this;

		var newItems = $("#excludedWikis option:selected");
		for(i = 0; i < newItems.length; i++) {
			newItems[i].selected = false;

			var includedWikis = $("#includedWikis").children();
			var text = $(newItems[i]).text();
			newItemIndex = self.indexOfObject(text);
//			newItemIndex = self.indexOfObject($(newItems[i]).text());
			self.log($(newItems[i]).text()+" at "+newItemIndex);
			self.log("Included Wikis (length= "+includedWikis.length+":");
			for(j = 0; j < includedWikis.length; j++) {
				var found = false;
				includedWikiIndex = self.indexOfObject($(includedWikis[j]).text());
				self.log("\t"+$(includedWikis[j]).text()+" at "+includedWikiIndex);
				if(parseInt(newItemIndex) < parseInt(includedWikiIndex)) {
					self.log("newItemIndex "+newItemIndex+" is less than includedWikiIndex "+includedWikiIndex);
					$(newItems[i]).detach();
					$(includedWikis[j]).before($(newItems[i]));

					var thisWiki = self.allWikisList[newItemIndex];
					delete self.excludedWikis[thisWiki["fulltext"]];
					self.includedWikis[thisWiki["fulltext"]] = thisWiki;

					found = true;
					break;
				}
			}
			if(!found) {
				$(newItems[i]).detach();
				$("#includedWikis").append($(newItems[i]));

				var thisWiki = self.allWikisList[newItemIndex];
				delete self.excludedWikis[thisWiki["fulltext"]];
				self.includedWikis[thisWiki["fulltext"]] = thisWiki;
			}
		}

		for(i = 0; i < newItems.length; i++) {
			title = $(newItems[i]).text();
			self.log("about to attempt to get namespace for "+title);
			if(self.namespacesList[title] === undefined)
				self.getNamespacesForWiki(title, function(title) {
					self.log("in callback method for "+title);
					if(!("searchable" in self.namespacesList[title]["0"])) {
						self.log("searchable not found for "+title+", "+self.namespacesList[title]["0"]["*"]);
						self.namespacesList[title]["0"]["searchable"] = true;
					}

				});
		}
	}

	MultiWikiSearch.prototype.moveOptionsRight = function() {
		var self = this;

		var newItems = $("#includedWikis option:selected");
		for(i = 0; i < newItems.length; i++) {
			newItems[i].selected=false;

			var excludedWikis = $("#excludedWikis").children();
			newItemIndex = self.indexOfObject($(newItems[i]).text());
			self.log($(newItems[i]).text()+" at "+newItemIndex);
			self.log("Excluded Wikis (length= "+excludedWikis.length+":");
			for(j =	0; j < excludedWikis.length; j++) {
				var found = false;
				excludedWikiIndex = self.indexOfObject($(excludedWikis[j]).text());
				self.log("\t"+$(excludedWikis[j]).text()+" at "+excludedWikiIndex);
				if(parseInt(newItemIndex) < parseInt(excludedWikiIndex)) {
					self.log("newItemIndex "+newItemIndex+" is less than excludedWikiIndex "+excludedWikiIndex);
					$(newItems[i]).detach();
					$(excludedWikis[j]).before($(newItems[i]));

					var thisWiki = self.allWikisList[newItemIndex];
					delete self.includedWikis[thisWiki["fulltext"]];
					self.excludedWikis[thisWiki["fulltext"]] = thisWiki;

					found =	true;
					break;
				}
			}
			if(!found) {
				$(newItems[i]).detach();
				$("#excludedWikis").append($(newItems[i]));
				var thisWiki = self.allWikisList[newItemIndex];
				delete self.includedWikis[thisWiki["fulltext"]];
				self.excludedWikis[thisWiki["fulltext"]] = thisWiki;
			}
		}

		self.clearNamespacesDiv();

	}

	MultiWikiSearch.prototype.indexOfObject = function(title) {
		var self = this;

		for(var i in self.allWikisList) {
			if(title === self.allWikisList[i]["fulltext"])
				return i;
		}
		return -1;
	}

	MultiWikiSearch.prototype.namespaceHandler = function() {
		var self = this;

		self.log("namespace handler called");
		self.clearNamespacesDiv();
		
		var selectedItems = $("#includedWikis option:selected");
		if(selectedItems.length == 1) {
			self.log("only one selected item, so show namespaces");
			var title = $(selectedItems[0]).text();
			self.log(title);
			var x = self.namespacesList[title];
			if(self.namespacesList[title] === undefined) {
				self.getNamespacesForWiki(title, self.loadNamespacesDiv);
			}
			else
				self.loadNamespacesDiv(title);

		}
	}

	MultiWikiSearch.prototype.clearNamespacesDiv = function() {
		var self = this;

		namespaceItems = $("#namespacesDiv").children();
			for(var i = 0; i < namespaceItems.length; i++)
				$(namespaceItems[i]).remove();
	}

	MultiWikiSearch.prototype.loadNamespacesDiv = function(title) {
		var self = this;

		self.log("loading namespaces div...");
		var namespaces = self.namespacesList[title];
		var html = "<table><tbody><tr>";
		var count = 0;
		for(var item in namespaces) {
			if(parseInt(item) < 0)	// namespaces with id<0 are unsearchable.
				continue;
			var namespaceTitle = namespaces[item]["*"];
			if(namespaceTitle === "") namespaceTitle = "Main";
			html += '<td><input type="checkbox" class="namespaceCheckbox" id="'+namespaceTitle+'" name="'+namespaceTitle+'" value="'+item+'"><label for="'+namespaceTitle+'">'+namespaceTitle+'</label></td>';
			if((parseInt(count)+1) % 4 == 0)
				html += "</tr><tr>";
			count++;
		}
		html += "</tr></tbody></table>";

		$("#namespacesDiv").append(html);
		$(".namespaceCheckbox").each(function() {
			var checkbox = $(this);
			var namespaceTitle = checkbox.attr("name");
			var item = checkbox.attr("value");
			checkbox.click(function() {
				self.namespaceCheckboxHandler(title, namespaceTitle, item);
			});
		});
		
		for(var item in namespaces) {
			var namespaceTitle = namespaces[item]["*"];
			if(namespaceTitle === "") namespaceTitle = "Main";

			if(!("searchable" in self.namespacesList[title][item])) {
				self.log("searchable not found for "+title+", "+namespaceTitle);
				self.namespacesList[title][item]["searchable"] = (parseInt(item)==0? true : false);
				//self.log("searchable is now "+self.namespacesList[title][item]["searchable"]);
				$('.namespaceCheckbox#'+namespaceTitle).prop('checked', self.namespacesList[title][item]["searchable"]);
			}
			else {
				self.log("searchable found for "+title+", "+namespaceTitle+" and it was "+self.namespacesList[title][item]["searchable"]);
				$('.namespaceCheckbox#'+namespaceTitle).prop('checked', self.namespacesList[title][item]["searchable"]);
			}
		}

	}

	MultiWikiSearch.prototype.getNamespacesForWiki = function(title, callback) {
		var self = this;

		self.log("getting namespaces for wiki: "+title);
		apiurl = self.includedWikis[title]["printouts"]["Wiki API URL"];
		apiurl = apiurl + "?action=query&meta=siteinfo&siprop=namespaces&format=json&callback=callback";
		self.log("api url = "+apiurl);
                jQuery.ajax({
                        url: apiurl,
                        dataType: 'jsonp',
                        success: function(data, textStatus, jqXHR) {
                                self.log("success fetching");
                                self.namespacesList[title] = data["query"]["namespaces"];
				callback(title);
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                                alert("Unable to fetch list of namespaces for "+title+".");
                        }
		});
	}

	MultiWikiSearch.prototype.namespaceCheckboxHandler = function(wiki_title, namespace_title, namespace_id_number) {
		var self = this;

		self.log(wiki_title+" "+namespace_title+" "+namespace_id_number);
		if($('.namespaceCheckbox#'+namespace_title).prop('checked')) {
			self.log("checked");
			self.namespacesList[wiki_title][namespace_id_number]["searchable"] = true;
		}
		else {
			self.log("unchecked");
			self.namespacesList[wiki_title][namespace_id_number]["searchable"] = false;
		}
	}

	MultiWikiSearch.prototype.beginSearch = function() {
		var self = this;

		self.log("begin search!");
		var includedWikis = $("#includedWikis option");

		self.searchTerms = $("#searchTerms").val();

		// dummy check.
		if(self.searchTerms === undefined || self.searchTerms === "") {
			alert("You must enter search terms.");
			return;
		}
		if(includedWikis.length === 0) {
			alert("You must select a wiki to search.");
			return;
		}
		// clear out any tables that might already be there.
		self.clearSearchResultsDiv();

		// construct a table for the search results.
		$("#searchResultsDiv").css("display", "block");
		self.totalWikiSearchCount = (self.searchText && self.searchTitle ? includedWikis.length*2 : includedWikis.length);
		self.log("total searches to execute = "+self.totalWikiSearchCount);
		self.searchedWikiCount = 0;
		$("#progressbar").progressbar({ max:self.totalWikiSearchCount, value:0 });

		var html = '<table id="searchResultsTable"><thead><tr><th>Wiki</th><th>Page Name</th>';

		if(self.snippets) 
			html += '<th>Snippet</th>';

		if(self.searchPurpose === 'diff')
			html += '<th>1st</th><th>2nd</th>';
		else
			html += '<th>Add</th>';

		html += '</tr></thead>';

		for(var i = 0; i < includedWikis.length; i++) {
			var title = $(includedWikis[i]).text();
			html += '<tbody class="searchResults" id="'+title+'"></tbody>';
		}
		html +='</table>';
		self.log("html:\n"+html);
		$("#searchResultsSection").append(html);

		// construct search URLs and start searches.
		for(var i = 0; i < includedWikis.length; i++) {
			var title = $(includedWikis[i]).text();
			var contentURL = self.includedWikis[title]["printouts"]["Wiki Content URL"];
			baseApiUrl = self.includedWikis[title]["printouts"]["Wiki API URL"];
			if(self.searchTitle) {
				fullApiURL = self.constructSearchURL(title, baseApiUrl, "searchTitle");
				self.log("DEBUG: will search title on "+fullApiURL);
				self.executeSearch(fullApiURL, contentURL, title);
			}
			if(self.searchText) {
				fullApiURL = self.constructSearchURL(title, baseApiUrl, "searchText");
				self.log("DEBUG: will search text on "+fullApiURL);

				self.executeSearch(fullApiURL, contentURL, title);
			}
		}
	
	}
	MultiWikiSearch.prototype.executeSearch = function(fullApiURL, contentURL, wikiTitle) {
		// note: beyond modularity, this is a separate function to preserve the scope of wikiTitle for the ajax call.
		var self = this;

		jQuery.ajax({
			url: fullApiURL,
			dataType: 'jsonp',
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				self.log("success fetching for "+wikiTitle);
				self.searchResultHandler(wikiTitle, contentURL, data);
                        },
			error: function(jqXHR, textStatus, errorThrown) {
				alert("failed to search "+wikiTitle+" for "+self.searchTerms+": "+textStatus+", "+errorThrown);
			}
		});

	}
	MultiWikiSearch.prototype.clearSearchResultsDiv = function() {
		var self = this;

		if($("#searchResultsTable") !== undefined)
			$("#searchResultsTable").remove();

	}

	MultiWikiSearch.prototype.constructSearchURL = function(title, baseApiURL, searchType) {
		var self = this;

		if(searchType==="searchTitle")
			fullApiURL = baseApiURL + "?action=query&list=search&srwhat=title&srsearch="+self.searchTerms+"&srnamespace=";
		else
			fullApiURL = baseApiURL + "?action=query&list=search&srwhat=text&srsearch="+self.searchTerms+"&srnamespace=";
		for(ns_id_number in self.namespacesList[title])
			if(self.namespacesList[title][ns_id_number]["searchable"])
				fullApiURL += ns_id_number+"|";
		fullApiURL = fullApiURL.substring(0, fullApiURL.length-1);
		fullApiURL += "&srlimit=50&format=json&callback=callback";
		return fullApiURL;
	}
	MultiWikiSearch.prototype.searchResultHandler = function(title, contentURL, jsonData) {
		var self = this;

		// Note: due to how jQuery forces a browser to avoid caching, an extra "_" parameter is sent with the AJAX call,
		// and the JSON object returned by MediaWiki API complains about this. But we will ignore it. :) See:
			// http://stackoverflow.com/questions/19892179/search-a-mediawiki,
			// http://datatables.net/forums/discussiion/5850/strange-variable-sent-with-ajax-request/p1,
		// and the jQuery documentation regarding cache.

		self.log("in searchResultHandler("+title+", "+jsonData+")");
		self.log("the content URL is "+contentURL);
		results = jsonData["query"]["search"];
		self.searchedWikiCount++;

		$("#progressbar").progressbar("value", self.searchedWikiCount);
		self.log("updating progress bar, value = "+self.searchedWikiCount);
		var row = $(".searchResults#"+title);
		self.log("row = "+row);
		for(i = 0; i < results.length; i++) {
			var pageTitle = results[i]["title"];
			var pageURL = contentURL + pageTitle.split(' ').join('_');
			self.log("page title is "+pageTitle);
			self.log("page URL is "+pageURL);
			var snippet = results[i]["snippet"];
			if(snippet === undefined)
				snippet = "(snippet unavailable)";

			var html = "<tr><td>"+title+"</td><td><a href='"+pageURL+"'>"+pageTitle+"</a></td>";
			if(self.snippets)
				html += "<td>"+snippet+"</td>";

			if(self.searchPurpose === 'diff')
				html += "<td><input type='radio' name='firstPage' data-wiki='"+title+"' data-pageName='"+pageTitle+"'></td><td><input type='radio' name='secondPage' data-wiki='"+title+"' data-pageName='"+pageTitle+"'></td></tr>";
			else
				html += "<td><input type='checkbox'></td></tr>";

			row.append(html);

//			row.append("<tr><td>"+title+"</td><td><a href=\""+pageURL+"\">"+pageTitle+"</a></td><td>"+snippet+"</td><td><input type='radio' name='firstPage' data-wiki='"+title+"' data-pageName='"+pageTitle+"'></td><td><input type='radio' name='secondPage' data-wiki='"+title+"' data-pageName='"+pageTitle+"'></td></tr>");
		}
	}

	MultiWikiSearch.prototype.beginDiff = function() {
		var self = this;

		self.log("begin diff");

		self.clearDiffDiv();

		wikiTitle1 = $("input[name='firstPage']:checked").attr("data-wiki");
		wikiTitle2 = $("input[name='secondPage']:checked").attr("data-wiki");
		pageTitle1 = $("input[name='firstPage']:checked").attr("data-pageName");
		pageTitle2 = $("input[name='secondPage']:checked").attr("data-pageName");
		self.log("wikiTitle1="+wikiTitle1+", pageTitle1="+pageTitle1);
		self.log("wikiTitle2="+wikiTitle2+", pageTitle2="+pageTitle2);

		var wikiTextURL1 = self.getWikitextURL(wikiTitle1, pageTitle1);
		var wikiTextURL2 = self.getWikitextURL(wikiTitle2, pageTitle2);
		self.log("wikiTextURL1 = "+wikiTextURL1);
		self.log("wikiTextURL2 = "+wikiTextURL2);

		self.executeDiv(self.apiurl, wikiTextURL1, wikiTextURL2, wikiTitle1, pageTitle1, wikiTitle2, pageTitle2);

	}
	MultiWikiSearch.prototype.clearDiffDiv = function() {
		var self = this;

		if($("#diffTable") !== undefined)
			$("#diffTable").remove();
	}
	MultiWikiSearch.prototype.executeDiv = function(apiurl, wikiTextURL1, wikiTextURL2, wikiTitle1, pageTitle1, wikiTitle2, pageTitle2) {
		var self = this;

		jQuery.ajax({
			url: apiurl,
			dataType: 'jsonp',
			data: {
				action: "compareDifferentWikiPages",
				url1: encodeURIComponent(wikiTextURL1),
				url2: encodeURIComponent(wikiTextURL2),
				format: "json"
			},
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				self.log("success fetching");
				self.diffSuccessHandler(data["compareDifferentWikiPages"]["diff"], wikiTitle1, pageTitle1, wikiTitle2, pageTitle2);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Unable to diff these pages. jqXHR="+jqXHR+", textStatus="+textStatus+", errorThrown="+errorThrown);
			}
		});

	}

	MultiWikiSearch.prototype.getWikitextURL = function(wikiTitle, pageTitle) {
	// example: wikiTitle="DARPApedia", pageTitle="MultiDimensional Mobility Robot (MDMR)"
	// would return: http://darpapedia.mitre.org/.mediawiki/index.php?action=raw&title=MultiDimensional_Mobility_Robot_(MDMR)

		var self = this;

		var contentURL = self.includedWikis[wikiTitle]["printouts"]["Wiki Content URL"];
		var pageURL = contentURL + pageTitle.split(' ').join('_');
		var wikitextURL = pageURL.replace("wiki/", ".mediawiki/index.php?action=raw&title=");
		return wikitextURL;
	}

	MultiWikiSearch.prototype.diffSuccessHandler = function(diffHTML, wikiTitle1, pageTitle1, wikiTitle2, pageTitle2) {
		//Note: same MediaWiki API warning as in the search div (see searchResultHandler note above).

		var self = this;

		var pageURL1 = self.includedWikis[wikiTitle1]["printouts"]["Wiki Content URL"] + pageTitle1.split(' ').join('_');
		var pageURL2 = self.includedWikis[wikiTitle2]["printouts"]["Wiki Content URL"] + pageTitle2.split(' ').join('_');
		$("#diffDiv").css("display", "block");
		$("#diffResultsSection").append("<table id='diffTable'><tbody><tr><th>"+wikiTitle1+": <a href='"+pageURL1+"'>"+pageTitle1+"</a></th><th></th><th>"+wikiTitle2+": <a href='"+pageURL2+"'>"+pageTitle2+"</a></th><th></th></tr></tbody></table>");
		$("#diffTable tbody").append(diffHTML);
		self.log("done handling diff");
	}

	MultiWikiSearch.prototype.log = function(text) {
		if( (window['console'] !== undefined) )
			console.log( text );
	}
}
