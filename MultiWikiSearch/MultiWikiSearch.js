window.MultiWikiSearch = {

	excludedWikis : [],
	includedWikis: [],
	allWikisList: [],
	namespacesList: {},
	searchTitle:true,
	searchText:false,
	searchTerms: "",
	initializeMWS: function(apiurl) {

	self.log("received apiurl: "+apiurl);

		jQuery.ajax({
			url: apiurl,
			dataType: 'json',
			data: {
				action: "getSearchableWikis",
				format: "json"
			},
			success: function(data, textStatus, jqXHR) {
				self.log("success fetching");
				MultiWikiSearch.parseInitialData(data);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Unable to fetch list of wikis.");
			}
		});
		$("#searchTerms").bind("input", function() {
			MultiWikiSearch.searchTerms = $(this).val();
			self.log(MultiWikiSearch.searchTerms);
		});
		$("#searchTerms").keyup(function(event) {
			if(event.keyCode === 13) {	// the enter key
				MultiWikiSearch.beginSearch();	// triggers the start to the search
			}
		});
		$("#scope").change(MultiWikiSearch.scopeHandler);
		$("#moveLeft").attr("onclick", "MultiWikiSearch.moveOptionsLeft()");
		$("#moveRight").attr("onclick", "MultiWikiSearch.moveOptionsRight()");
		$("#searchButton").attr("onclick", "MultiWikiSearch.beginSearch()");
	},

	parseInitialData: function(data) {
		allWikis = data["getSearchableWikis"]["results"];

		$(document).ready(function() {
			for(var i in allWikis) {
				var title = allWikis[i]["fulltext"];
				self.log(allWikis[i]);

				$("#excludedWikis").append("<option class=\"excludedOption\" value=\""+title+"\" id=\""+title+"\" >"+title+"</option>");
				MultiWikiSearch.excludedWikis[title] = allWikis[i];
				MultiWikiSearch.allWikisList.push(allWikis[i]);
			}
			$("#includedWikis").attr("size", 10);
			$("#includedWikis").change(MultiWikiSearch.namespaceHandler);
			$("#excludedWikis").attr("size", 10);
		});

	},
	scopeHandler: function() {
		var option = $("#scope option:selected");
		if(option.text()==="Title only") {
			self.log("Title only selected");
			MultiWikiSearch.searchTitle = true;
			MultiWikiSearch.searchText = false;
		}
		else if(option.text()==="Text only") {
			self.log("Text only selected");
			MultiWikiSearch.searchTitle = false;
			MultiWikiSearch.searchText = true;
		}
		else {
			self.log("Title and text selected");
			MultiWikiSearch.searchTitle = true;
			MultiWikiSearch.searchText = true;
		}

	},
	moveOptionsLeft: function() {

		var newItems = $("#excludedWikis option:selected");
		for(i = 0; i < newItems.length; i++) {
			newItems[i].selected = false;

			var includedWikis = $("#includedWikis").children();
			newItemIndex = MultiWikiSearch.indexOfObject($(newItems[i]).text());
			self.log($(newItems[i]).text()+" at "+newItemIndex);
			self.log("Included Wikis (length= "+includedWikis.length+":");
			for(j = 0; j < includedWikis.length; j++) {
				var found = false;
				includedWikiIndex = MultiWikiSearch.indexOfObject($(includedWikis[j]).text());
				self.log("\t"+$(includedWikis[j]).text()+" at "+includedWikiIndex);
				if(parseInt(newItemIndex) < parseInt(includedWikiIndex)) {
					self.log("newItemIndex "+newItemIndex+" is less than includedWikiIndex "+includedWikiIndex);
					$(newItems[i]).detach();
					$(includedWikis[j]).before($(newItems[i]));

					var thisWiki = MultiWikiSearch.allWikisList[newItemIndex];
					delete MultiWikiSearch.excludedWikis[thisWiki["fulltext"]];
					MultiWikiSearch.includedWikis[thisWiki["fulltext"]] = thisWiki;

					found = true;
					break;
				}
			}
			if(!found) {
				$(newItems[i]).detach();
				$("#includedWikis").append($(newItems[i]));

				var thisWiki = MultiWikiSearch.allWikisList[newItemIndex];
				delete MultiWikiSearch.excludedWikis[thisWiki["fulltext"]];
				MultiWikiSearch.includedWikis[thisWiki["fulltext"]] = thisWiki;
			}
		}

		for(i = 0; i < newItems.length; i++) {
			title = $(newItems[i]).text();
			self.log("about to attempt to get namespace for "+title);
			if(MultiWikiSearch.namespacesList[title] === undefined)
				MultiWikiSearch.getNamespacesForWiki(title, function(title) {
					self.log("in callback method for "+title);
					if(!("searchable" in MultiWikiSearch.namespacesList[title]["0"])) {
						self.log("searchable not found for "+title+", "+MultiWikiSearch.namespacesList[title]["0"]["*"]);
						MultiWikiSearch.namespacesList[title]["0"]["searchable"] = true;
					}

				});
		}
	},
	moveOptionsRight: function() {

		var newItems = $("#includedWikis option:selected");
		for(i = 0; i < newItems.length; i++) {
			newItems[i].selected=false;

			var excludedWikis = $("#excludedWikis").children();
			newItemIndex = MultiWikiSearch.indexOfObject($(newItems[i]).text());
			self.log($(newItems[i]).text()+" at "+newItemIndex);
			self.log("Excluded Wikis (length= "+excludedWikis.length+":");
			for(j =	0; j < excludedWikis.length; j++) {
				var found = false;
				excludedWikiIndex = MultiWikiSearch.indexOfObject($(excludedWikis[j]).text());
				self.log("\t"+$(excludedWikis[j]).text()+" at "+excludedWikiIndex);
				if(parseInt(newItemIndex) < parseInt(excludedWikiIndex)) {
					self.log("newItemIndex "+newItemIndex+" is less than excludedWikiIndex "+excludedWikiIndex);
					$(newItems[i]).detach();
					$(excludedWikis[j]).before($(newItems[i]));

					var thisWiki = MultiWikiSearch.allWikisList[newItemIndex];
					delete MultiWikiSearch.includedWikis[thisWiki["fulltext"]];
					MultiWikiSearch.excludedWikis[thisWiki["fulltext"]] = thisWiki;

					found =	true;
					break;
				}
			}
			if(!found) {
				$(newItems[i]).detach();
				$("#excludedWikis").append($(newItems[i]));
				var thisWiki = MultiWikiSearch.allWikisList[newItemIndex];
				delete MultiWikiSearch.includedWikis[thisWiki["fulltext"]];
				MultiWikiSearch.excludedWikis[thisWiki["fulltext"]] = thisWiki;
			}
		}

		MultiWikiSearch.clearNamespacesDiv();

	},

	indexOfObject: function(title) {
		for(var i in MultiWikiSearch.allWikisList) {
			if(title === MultiWikiSearch.allWikisList[i]["fulltext"])
				return i;
		}
		return -1;
	},
	namespaceHandler: function() {
		self.log("namespace handler called");
		MultiWikiSearch.clearNamespacesDiv();
		
		var selectedItems = $("#includedWikis option:selected");
		if(selectedItems.length == 1) {
			self.log("only one selected item, so show namespaces");
			var title = $(selectedItems[0]).text();
			self.log(title);
			var x = MultiWikiSearch.namespacesList[title];
			if(MultiWikiSearch.namespacesList[title] === undefined) {
				MultiWikiSearch.getNamespacesForWiki(title, MultiWikiSearch.loadNamespacesDiv);
			}
			else
				MultiWikiSearch.loadNamespacesDiv(title);

		}
	},
	clearNamespacesDiv: function() {

		namespaceItems = $("#namespacesDiv").children();
			for(var i = 0; i < namespaceItems.length; i++)
				$(namespaceItems[i]).remove();
	},
	loadNamespacesDiv: function(title) {
		self.log("loading namespaces div...");
		var namespaces = MultiWikiSearch.namespacesList[title];
		var html = "<table><tbody><tr>";
		var count = 0;
		for(var item in namespaces) {
			if(parseInt(item) < 0)	// namespaces with id<0 are unsearchable.
				continue;
			var namespaceTitle = namespaces[item]["*"];
			if(namespaceTitle === "") namespaceTitle = "Main";
			html += '<td><input type="checkbox" class="namespaceCheckbox" id="'+namespaceTitle+'" name="'+namespaceTitle+'" value="'+namespaces[item]["id"]+'" onclick="MultiWikiSearch.namespaceCheckboxHandler(\''+title+'\', \''+namespaceTitle+'\', \''+item+'\')"><label for="'+namespaceTitle+'">'+namespaceTitle+'</label></td>';
			if((parseInt(count)+1) % 4 == 0)
				html += "</tr><tr>";
			count++;
		}
		html += "</tr></tbody></table>";

		$("#namespacesDiv").append(html);
		
		for(var item in namespaces) {
			var namespaceTitle = namespaces[item]["*"];
			if(namespaceTitle === "") namespaceTitle = "Main";

			if(!("searchable" in MultiWikiSearch.namespacesList[title][item])) {
				self.log("searchable not found for "+title+", "+namespaceTitle);
				MultiWikiSearch.namespacesList[title][item]["searchable"] = (parseInt(item)==0? true : false);
				//self.log("searchable is now "+MultiWikiSearch.namespacesList[title][item]["searchable"]);
				$('.namespaceCheckbox#'+namespaceTitle).prop('checked', MultiWikiSearch.namespacesList[title][item]["searchable"]);
			}
			else {
				self.log("searchable found for "+title+", "+namespaceTitle+" and it was "+MultiWikiSearch.namespacesList[title][item]["searchable"]);
				$('.namespaceCheckbox#'+namespaceTitle).prop('checked', MultiWikiSearch.namespacesList[title][item]["searchable"]);
			}
		}

	},
	getNamespacesForWiki: function(title, callback) {
		self.log("getting namespaces for wiki: "+title);
		apiurl = MultiWikiSearch.includedWikis[title]["printouts"]["Wiki API URL"];
		apiurl = apiurl + "?action=query&meta=siteinfo&siprop=namespaces&format=json&callback=callback";
		self.log("api url = "+apiurl);
                jQuery.ajax({
                        url: apiurl,
                        dataType: 'jsonp',
                        success: function(data, textStatus, jqXHR) {
                                self.log("success fetching");
                                MultiWikiSearch.namespacesList[title] = data["query"]["namespaces"];
				callback(title);
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                                alert("Unable to fetch list of namespaces for "+title+".");
                        }
		});
	},

	namespaceCheckboxHandler: function(wiki_title, namespace_title, namespace_id_number) {
		self.log(wiki_title+" "+namespace_title+" "+namespace_id_number);
		if($('.namespaceCheckbox#'+namespace_title).prop('checked')) {
			self.log("checked");
			MultiWikiSearch.namespacesList[wiki_title][namespace_id_number]["searchable"] = true;
		}
		else {
			self.log("unchecked");
			MultiWikiSearch.namespacesList[wiki_title][namespace_id_number]["searchable"] = false;
		}
	},
	beginSearch: function() {
		self.log("begin search!");
		var includedWikis = $("#includedWikis option");

		// dummy check.
		if(MultiWikiSearch.searchTerms === undefined || MultiWikiSearch.searchTerms === "") {
			alert("You must enter search terms.");
			return;
		}
		if(includedWikis.length === 0) {
			alert("You must select a wiki to search.");
			return;
		}
		// clear out any tables that might already be there.
		MultiWikiSearch.clearSearchResultsDiv();

		// construct a table for the search results.
		$("#searchResultsDiv").css("display", "block");
		var html = '<table id="searchResultsTable"><thead><tr><th>Wiki</th><th>Page Name</th><th>Snippet</th></tr></thead>';

		for(var i = 0; i < includedWikis.length; i++) {
			var title = $(includedWikis[i]).text();
			html += '<tbody class="searchResults" id="'+title+'"></tbody>';
		}
		html +='</table>';
		self.log("html:\n"+html);
		$("#searchResultsDiv fieldset").append(html);

		// construct search URLs and start searches.
		for(var i = 0; i < includedWikis.length; i++) {
			var title = $(includedWikis[i]).text();
			baseApiUrl = MultiWikiSearch.includedWikis[title]["printouts"]["Wiki API URL"];
			if(MultiWikiSearch.searchTitle) {
				fullApiURL = MultiWikiSearch.constructSearchURL(title, baseApiUrl, "searchTitle");
				self.log("DEBUG: will search title on "+fullApiURL);
				MultiWikiSearch.executeSearch(fullApiURL, title);
			}
			if(MultiWikiSearch.searchText) {
				fullApiURL = MultiWikiSearch.constructSearchURL(title, baseApiUrl, "searchText");
				self.log("DEBUG: will search text on "+fullApiURL);

				MultiWikiSearch.executeSearch(fullApiURL, title);
			}
		}
	
	},
	executeSearch: function(fullApiURL, wikiTitle) {
		// note: beyond modularity, this is a separate function to preserve the scope of wikiTitle for the ajax call.
		jQuery.ajax({
			url: fullApiURL,
			dataType: 'jsonp',
			// apparently suppresses unrecognized parameter '_' warning, see: http://stackoverflow.com/questions/19892179/search-a-mediawiki
			cache: true,
			success: function(data, textStatus, jqXHR) {
				self.log("success fetching for "+wikiTitle);
				MultiWikiSearch.searchResultHandler(wikiTitle, data);
                        },
			error: function(jqXHR, textStatus, errorThrown) {
				alert("failed to search "+wikiTitle+" for "+MultiWikiSearch.searchTerms+": "+textStatus+", "+errorThrown);
			}
		});

	},
	clearSearchResultsDiv: function() {

		if($("#searchResultsTable") !== undefined)
			$("#searchResultsTable").remove();

	},
	constructSearchURL: function(title, baseApiURL, searchType) {
		if(searchType==="searchTitle")
			fullApiURL = baseApiURL + "?action=query&list=search&srwhat=title&srsearch="+MultiWikiSearch.searchTerms+"&srnamespace=";
		else
			fullApiURL = baseApiURL + "?action=query&list=search&srwhat=text&srsearch="+MultiWikiSearch.searchTerms+"&srnamespace=";
		for(ns_id_number in MultiWikiSearch.namespacesList[title])
			if(MultiWikiSearch.namespacesList[title][ns_id_number]["searchable"])
				fullApiURL += ns_id_number+"|";
		fullApiURL = fullApiURL.substring(0, fullApiURL.length-1);
		fullApiURL += "&srlimit=50&format=json&callback=callback";
		return fullApiURL;
	},
	searchResultHandler: function(title, jsonData) {
		self.log("in searchResultHandler("+title+", "+jsonData+")");
		results = jsonData["query"]["search"];

		var row = $(".searchResults#"+title);
		self.log("row = "+row);
		for(i = 0; i < results.length; i++) {
			var pageTitle = results[i]["title"];
			var snippet = results[i]["snippet"];
			if(snippet === undefined)
				snippet = "(snippet unavailable)";
			row.append("<tr><td>"+title+"</td><td>"+pageTitle+"</td><td>"+snippet+"</td></tr>");
		}

	}
}

self.log = function(text) {
	if( (window['console'] !== undefined) )
		console.log( text );
}
