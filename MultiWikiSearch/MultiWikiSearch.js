window.MultiWikiSearch = {

	excludedWikis : [],
	includedWikis: [],
	categoryMembers : null,

	initializeMWS: function() {

		jQuery.ajax({
			url: "http://gestalt.mitre.org/.mediawiki/api.php?action=query&list=categorymembers&cmtitle=Category:Gestalt_Communities&format=json&cmlimit=500&callback=test",
			dataType: 'jsonp',
			success: function(data, textStatus, jqXHR) {
				self.log("success fetching");
				MultiWikiSearch.parseInitialData(data);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Unable to fetch list of wikis.");
			}
		});

		$("#moveLeft").attr("onclick", "MultiWikiSearch.moveOptionsLeft()");
		$("#moveRight").attr("onclick", "MultiWikiSearch.moveOptionsRight()");
	},

	parseInitialData: function(data) {

		query = data["query"];
		MultiWikiSearch.categoryMembers = query["categorymembers"];

		$(document).ready(function() {
			for(var i in MultiWikiSearch.categoryMembers) {
				var title = MultiWikiSearch.categoryMembers[i]["title"];
				$("#excludedWikis").append("<option class=\"excludedOption\" value=\""+title+"\" id=\""+title+"\" >"+MultiWikiSearch.categoryMembers[i]["title"]+"</option>");
				MultiWikiSearch.excludedWikis[title] = title;
			}
			$("#includedWikis").attr("size", 10);
			$("#excludedWikis").attr("size", 10);
		});

	},
	moveOptionsLeft: function() {

		var newItems = $("#excludedWikis option:selected");
		for(i = 0; i < newItems.length; i++) {
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
					found = true;
					break;
				}
			}
			if(!found) {
				$(newItems[i]).detach();
				$("#includedWikis").append($(newItems[i]));
			}
		}
	},
	moveOptionsRight: function() {

		var newItems = $("#includedWikis option:selected");
                for(i = 0; i < newItems.length; i++) {
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
                                        found =	true;
                                        break;
                                }
                        }
                        if(!found) {
                                $(newItems[i]).detach();
                                $("#excludedWikis").append($(newItems[i]));
                        }
                }

	},
	alphabeticalSort: function(a, b) {
	// sort function for two jQuery elements
		return ($(b).text()) < ($(a).text()) ? 1 : -1;
	},
	indexOfObject: function(title) {
		for(var i in MultiWikiSearch.categoryMembers) {
			if(title === MultiWikiSearch.categoryMembers[i]["title"])
				return i;
		}
		return -1;
	}
}

self.log = function(text) {
	if( (window['console'] !== undefined) )
		console.log( text );
}
