window.MultiWikiSearch = {

	excludedWikis : [],
	includedWikis: [],
	allWikisList: [],
	namespacesList: {},
	searchTitle:true,
	searchText:false,
	searchTerms: "",
	totalWikiSearchCount: 0,
	searchedWikiCount: 0,
	initializeMWS: function(apiurl) {

		mw.loader.load('jquery.ui.progressbar');
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
		$("#diffButton").attr("onclick", "MultiWikiSearch.beginDiff()");
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

		MultiWikiSearch.searchTerms = $("#searchTerms").val();

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
		MultiWikiSearch.totalWikiSearchCount = (MultiWikiSearch.searchText && MultiWikiSearch.searchTitle ? includedWikis.length*2 : includedWikis.length);
		self.log("total searches to execute = "+MultiWikiSearch.totalWikiSearchCount);
		MultiWikiSearch.searchedWikiCount = 0;
		$("#progressbar").progressbar({ max: MultiWikiSearch.totalWikiSearchCount, value:0});
		var html = '<table id="searchResultsTable"><thead><tr><th>Wiki</th><th>Page Name</th><th>Snippet</th><th>1st</th><th>2nd</th></tr></thead>';

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
			var contentURL = MultiWikiSearch.includedWikis[title]["printouts"]["Wiki Content URL"];
			baseApiUrl = MultiWikiSearch.includedWikis[title]["printouts"]["Wiki API URL"];
			if(MultiWikiSearch.searchTitle) {
				fullApiURL = MultiWikiSearch.constructSearchURL(title, baseApiUrl, "searchTitle");
				self.log("DEBUG: will search title on "+fullApiURL);
				MultiWikiSearch.executeSearch(fullApiURL, contentURL, title);
			}
			if(MultiWikiSearch.searchText) {
				fullApiURL = MultiWikiSearch.constructSearchURL(title, baseApiUrl, "searchText");
				self.log("DEBUG: will search text on "+fullApiURL);

				MultiWikiSearch.executeSearch(fullApiURL, contentURL, title);
			}
		}
	
	},
	executeSearch: function(fullApiURL, contentURL, wikiTitle) {
		// note: beyond modularity, this is a separate function to preserve the scope of wikiTitle for the ajax call.
		jQuery.ajax({
			url: fullApiURL,
			dataType: 'jsonp',
			beforeSend: function (jqXHR, settings) {
				url = settings.url;
				self.log("url of ajax call: "+url);
			},
			success: function(data, textStatus, jqXHR) {
				self.log("success fetching for "+wikiTitle);
				MultiWikiSearch.searchResultHandler(wikiTitle, contentURL, data);
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
	searchResultHandler: function(title, contentURL, jsonData) {
			// Note: due to how jQuery forces a browser to avoid caching, an extra "_" parameter is sent with the AJAX call,
			// and the JSON object returned by MediaWiki API complains about this. But we will ignore it. :) See:
				// http://stackoverflow.com/questions/19892179/search-a-mediawiki,
				// http://datatables.net/forums/discussiion/5850/strange-variable-sent-with-ajax-request/p1,
			// and the jQuery documentation regarding cache.

		self.log("in searchResultHandler("+title+", "+jsonData+")");
		self.log("the content URL is "+contentURL);
		results = jsonData["query"]["search"];
		MultiWikiSearch.searchedWikiCount++;

		$("#progressbar").progressbar("value", MultiWikiSearch.searchedWikiCount);
		self.log("updating progress bar, value = "+MultiWikiSearch.searchedWikiCount);
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
			row.append("<tr><td>"+title+"</td><td><a href=\""+pageURL+"\">"+pageTitle+"</a></td><td>"+snippet+"</td><td><input type='radio' name='firstPage' data-wiki='"+title+"' data-pageName='"+pageTitle+"'></td><td><input type='radio' name='secondPage' data-wiki='"+title+"' data-pageName='"+pageTitle+"'></td></tr>");
		}
	},
	beginDiff: function() {
		self.log("begin diff");

		MultiWikiSearch.clearDiffDiv();

		wikiTitle1 = $("input[name='firstPage']:checked").attr("data-wiki");
		wikiTitle2 = $("input[name='secondPage']:checked").attr("data-wiki");
		pageTitle1 = $("input[name='firstPage']:checked").attr("data-pageName");
		pageTitle2 = $("input[name='secondPage']:checked").attr("data-pageName");
		self.log("wikiTitle1="+wikiTitle1+", pageTitle1="+pageTitle1);
		self.log("wikiTitle2="+wikiTitle2+", pageTitle2="+pageTitle2);

		var wikiTextURL1 = MultiWikiSearch.getWikitextURL(wikiTitle1, pageTitle1);
		var wikiTextURL2 = MultiWikiSearch.getWikitextURL(wikiTitle2, pageTitle2);
		self.log("wikiTextURL1 = "+wikiTextURL1);
		self.log("wikiTextURL2 = "+wikiTextURL2);

		apiurl = "http://gestalt-dev.mitre.org/robopedia/api.php";

		MultiWikiSearch.executeDiv(apiurl, wikiTextURL1, wikiTextURL2, wikiTitle1, pageTitle1, wikiTitle2, pageTitle2);

	},
	clearDiffDiv: function() {
		if($("#diffTable") !== undefined)
			$("#diffTable").remove();
	},
	executeDiv: function(apiurl, wikiTextURL1, wikiTextURL2, wikiTitle1, pageTitle1, wikiTitle2, pageTitle2) {
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
				MultiWikiSearch.diffSuccessHandler(data["compareDifferentWikiPages"]["diff"], wikiTitle1, pageTitle1, wikiTitle2, pageTitle2);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Unable to diff these pages. jqXHR="+jqXHR+", textStatus="+textStatus+", errorThrown="+errorThrown);
			}
		});

	},
	getWikitextURL: function(wikiTitle, pageTitle) {
	// example: wikiTitle="DARPApedia", pageTitle="MultiDimensional Mobility Robot (MDMR)"
	// would return: http://darpapedia.mitre.org/.mediawiki/index.php?action=raw&title=MultiDimensional_Mobility_Robot_(MDMR)

		var contentURL = MultiWikiSearch.includedWikis[wikiTitle]["printouts"]["Wiki Content URL"];
		var pageURL = contentURL + pageTitle.split(' ').join('_');
		var wikitextURL = pageURL.replace("wiki/", ".mediawiki/index.php?action=raw&title=");
		return wikitextURL;
	},
	diffSuccessHandler: function(diffHTML, wikiTitle1, pageTitle1, wikiTitle2, pageTitle2) {
		//Note: same MediaWiki API warning as in the search div (see searchResultHandler note above).
		var pageURL1 = MultiWikiSearch.includedWikis[wikiTitle1]["printouts"]["Wiki Content URL"] + pageTitle1.split(' ').join('_');
		var pageURL2 = MultiWikiSearch.includedWikis[wikiTitle2]["printouts"]["Wiki Content URL"] + pageTitle2.split(' ').join('_');
		$("#diffDiv").css("display", "block");
		$("#diffResultsSection").append("<table id='diffTable'><tbody><tr><th>"+wikiTitle1+": <a href='"+pageURL1+"'>"+pageTitle1+"</a></th><th></th><th>"+wikiTitle2+": <a href='"+pageURL2+"'>"+pageTitle2+"</a></th><th></th></tr></tbody></table>");
		$("#diffTable tbody").append(diffHTML);
		self.log("done handling diff");
	}
}

self.log = function(text) {
	if( (window['console'] !== undefined) )
		console.log( text );
}
