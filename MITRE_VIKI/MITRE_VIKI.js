// Hook functions

window.mitre_getSearchableWikis = function(vikiObject, parameters) {
// parameters = []
	apiURL = vikiObject.myApiURL;
	searchableWikisArray = vikiObject.searchableWikis;
	jQuery.ajax({
		url: apiURL,
		async: false,
		dataType: 'json',
		data: {
			action: 'getSearchableWikis',
			format: 'json'
		},
		success: function(data, textStatus, jqXHR) {
			parseSearchableWikisList(data, searchableWikisArray);
			hook_log("success getting searchable wikis");
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
				logoURL: allWikis[i]["printouts"]["Small Wiki Logo"][0]
			   };
		searchableWikisArray.push(wiki);

	}

	hook_log("searchableWikisArray.length = "+searchableWikisArray.length);
}

window.queryPhonebook = function(vikiObject, node, employeeNum) {
	jQuery.ajax({
		async: false,
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

	node.logoURL = "http://static.mitre.org/people/photos/big/"+data["mitrePhonebookAPILookup"]["empNum"]+".jpg";
	hook_log(node.logoURL);
}

hook_log = function(text) {
	if( (window['console'] !== undefined) )
		console.log( text );
}

