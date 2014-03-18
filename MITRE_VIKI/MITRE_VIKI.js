function mitre_getSearchableWikis(apiURL, searchableWikisArray) {

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
			self.log("success getting searchable wikis");
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("Unable to fetch list of wikis.");
		}
	});

}

function parseSearchableWikisList(data, searchableWikisArray) {
	self.log("Retrieved searchableWikisList");
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

	self.log("searchableWikisArray.length = "+searchableWikisArray.length);

}
