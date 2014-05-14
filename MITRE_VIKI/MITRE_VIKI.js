// Hook functions

window.MITRE_VIKI = function() {
	this.searchableCount = 0;
	this.contentNamespacesFetched = 0;
}

window.mitre_getAllWikis = function(vikiObject, parameters) {

	apiURL = vikiObject.myApiURL;
	allWikisArray = vikiObject.allWikis;
	
	jQuery.ajax({
		url: apiURL,
		// async: false,
		dataType: 'json',
		data: {
			action: 'getAllWikis',
			format: 'json'
		},
		success: function(data, textStatus, jqXHR) {
			parseAllWikisList(data, allWikisArray);
			hook_log("success getting all wikis");
			vikiObject.fetchContentNamespaces();
			// vikiObject.populateInitialGraph();
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("Unable to fetch list of wikis.");
		}
	});
}

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
	
	vikiObject.redraw(true);
}

// Helper functions

window.parseAllWikisList = function(data, allWikisArray) {
	hook_log("Retrieved allWikisList");
	allWikis = data["getAllWikis"]["results"];

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
			   
		allWikisArray.push(wiki);

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
	// allWikisArray.push(testWiki);
	// 
	hook_log("allWikisArray.length = "+allWikisArray.length);
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
