// Hook functions

window.MITRE_VIKI = function() {
	this.searchableCount = 0;
	this.contentNamespacesFetched = 0;
}

window.mitre_getSearchableWikis = function(vikiObject, parameters) {
// parameters = []
	apiURL = vikiObject.myApiURL;
	searchableWikisArray = vikiObject.searchableWikis;
	
	// for(var i = 0; i < 100; i ++) {
	// 	jQuery.ajax({
	// 		url: apiURL,
	// 		async: false,
	// 		dataType: 'json',
	// 		data: {
	// 			action: 'getSearchableWikis',
	// 			format: 'json'
	// 		},
	// 		success: function(data, textStatus, jqXHR) {
	// 			hook_log("success fetching another request..");
	// 		},
	// 		error: function(jqXHR, textStatus, errorThrown) {
	// 			alert("Unable to fetch list of wikis.");
	// 		}
	// 	});
	// }
	
	jQuery.ajax({
		url: apiURL,
		// async: false,
		dataType: 'json',
		data: {
			action: 'getSearchableWikis',
			format: 'json'
		},
		success: function(data, textStatus, jqXHR) {
			parseSearchableWikisList(data, searchableWikisArray);
			hook_log("success getting searchable wikis");
			vikiObject.fetchContentNamespaces();
			// vikiObject.populateInitialGraph();
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("Unable to fetch list of wikis.");
		}
	});
}
/*
window.getContentNamespace = function(vikiObject, searchableWikis, index, mitreVikiObject) {

	var wiki = searchableWikis[index];
	var wikiTitle = wiki.wikiTitle;

	var sameServer = wiki.contentURL.indexOf(vikiObject.serverURL) > -1;
	jQuery.ajax({
		url : wiki.apiURL,
		dataType : sameServer ? 'json' : 'jsonp',
		data : {
			action : 'getContentNamespaces',
			format : 'json'
		},
		beforeSend: function (jqXHR, settings) {
			url = settings.url;
			hook_log("url of ajax call: "+url);
		},
		success: function(data, textStatus, jqXHR) {
			hook_log("success callback in AJAX call of getContentNamespaces("+wikiTitle+")");
			if(data["error"] && data["error"]["code"] && data["error"]["code"]=== "unknown_action") {
				hook_log("WARNING: The wiki "+wikiTitle+" did not support getContentNamespaces. Likely an older production wiki. Defaulting to just NS 0 (main).");
				searchableWikis[index].contentNamespaces = [0];
			}
			else {
				searchableWikis[index].contentNamespaces = data["getContentNamespaces"];
			}
			
			mitreVikiObject.contentNamespacesFetched++;
			hook_log("mitreVikiObject records " + mitreVikiObject.contentNamespacesFetched + " wikis' content namespaces fetched");
			if(mitreVikiObject.contentNamespacesFetched == mitreVikiObject.searchableCount) {
				hook_log("all namespaces fetched; now populating graph");
				vikiObject.populateInitialGraph();				
			}

		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("Error fetching inside getContentNamespaces for "+wikiTitle+" - AJAX request. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
		}
	});
	
	hook_log("end of getContentNamespaces("+wikiTitle+")");
}
*/

window.mitre_matchMIIPhonebook = function(vikiObject, parameters) {
//parameters = [ new external nodes ]
	nodes = parameters[0];

	for(var i = 0; i < nodes.length; i++) {
		node = nodes[i];
		if(node.URL.indexOf("info.mitre.org/people") != -1) {
			var pattern = /[0-9]+/;
			employeeNum = node.URL.match(pattern)[0];
			hook_log("found employeeNum "+employeeNum);

			self.queryPhonebook(vikiObject, node, employeeNum);
		}
		else if(node.URL.indexOf("info.mitre.org/phonebook/organization") != -1) {
			deptNum = "Department "+node.URL.substring(node.URL.indexOf("=")+1) + " (MII)";
			node.pageTitle = deptNum;
			node.displayName = node.pageTitle;
			node.fullDisplayName = node.displayName;
			node.info = vikiObject.formatNodeInfo(node.fullDisplayName);
			
			node.hookIconURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/extensions/MITRE_VIKI/mitre_m.png";
			hook_log("setting hookIconURL to "+node.hookIconURL);
		}
		else if(node.URL.indexOf("mitre.org") != -1) {
			node.hookIconURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/extensions/MITRE_VIKI/mitre_m.png";
			hook_log("setting hookIconURL to "+node.hookIconURL);
		}
	}
}

// Helper functions

window.parseSearchableWikisList = function(data, searchableWikisArray) {
	hook_log("Retrieved searchableWikisList");
	allWikis = data["getSearchableWikis"]["results"];

	for(var i in allWikis) {
		var title = allWikis[i]["fulltext"];
		var wiki = {
				wikiTitle: title,
				apiURL: allWikis[i]["printouts"]["Wiki API URL"][0],
				contentURL: allWikis[i]["printouts"]["Wiki Content URL"][0],
				logoURL: allWikis[i]["printouts"]["Small Wiki Logo"][0],
			   };
			   if(allWikis[i]["printouts"]["Gestalt Community Searchable"].length > 0 && allWikis[i]["printouts"]["Gestalt Community Searchable"][0] === 't')
				   wiki.searchableWiki = true;
			   else
				   wiki.searchableWiki = false;
			   
		searchableWikisArray.push(wiki);

	}

	// var testWiki = {
	// 	wikiTitle : 'US MC Net Ops (gestalt-ed test)',
	// 	apiURL : 'http://gestalt-ed.mitre.org/usmcnetops/api.php',
	// 	contentURL : 'http://gestalt-ed.mitre.org/usmcnetops/index.php/',
	// 	logoURL : 'http://gestalt-dev.mitre.org/usmcnetops/branding/logo.png',
	// 	searchableWiki : false
	// 	
	// }
	// 
	// searchableWikisArray.push(testWiki);
	// 
	hook_log("searchableWikisArray.length = "+searchableWikisArray.length);
}

window.queryPhonebook = function(vikiObject, node, employeeNum) {
	jQuery.ajax({
		// async: false,
		url: vikiObject.myApiURL,
		dataType: 'json',
		data: {
			action: 'mitrePhonebookAPILookup',
			format: 'json',
			empNum: employeeNum
		},
		beforeSend: function(jqXHR, settings) {
			hook_log("url of phonebook lookup: "+settings.url);
		},
		success: function(data, textStatus, jqXHR) {
			parsePhonebookData(vikiObject, data, node);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("Error fetching phonebook data. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);

		}
	});
}

window.parsePhonebookData = function(vikiObject, data, node) {
	result = data["mitrePhonebookAPILookup"]["result"];
	node.pageTitle = result["lastName"] + ", "+result["firstName"] + " (MII)";
	node.displayName = node.pageTitle;
	node.fullDisplayName = node.displayName;
	node.info = vikiObject.formatNodeInfo(node.fullDisplayName);

	node.hookIconURL = "http://static.mitre.org/people/photos/big/"+data["mitrePhonebookAPILookup"]["empNum"]+".jpg";
	hook_log(node.hookIconURL);
}

hook_log = function(text) {
	if( (window['console'] !== undefined) )
		console.log( text );
}
// 
// window.sleep = function(milliseconds) {
// 	var start = new Date().getTime();
// 
// 	var timer = true;
// 	while (timer) {
// 		if ((new Date().getTime() - start)> milliseconds) {
// 			timer = false;
// 		}
// 	}
// }
