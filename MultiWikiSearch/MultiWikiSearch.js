function multiWikiSearchFunction() {
	console.log("multiWikiSearchFunction called!");

	jQuery.ajax({
		url: "http://gestalt.mitre.org/.mediawiki/api.php?action=query&list=categorymembers&cmtitle=Category:Branded_Wiki&format=json&cmlimit=500&callback=test",
		dataType: 'jsonp',
		success: function(data, textStatus, jqXHR) {
			console.log("data: "+data);
			parseData(data);
			console.log("textStatus: "+textStatus);
			console.log("jqXHR: "+jqXHR);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("jqXHR: "+jqXHR);
			console.log("textStatus: "+textStatus);
			console.log("errorThrown: "+errorThrown);
		}
	});
}

function parseData(data) {

	query = data["query"];
	categoryMembers = query["categorymembers"];

//	access categoryMember title via categoryMembers[i]["title"]

	console.log("hi2");

	$(window).load(function () {
		for(var i in categoryMembers) {
			$("#nonIncludedWikis").append("<option>"+categoryMembers[i]["title"]+"</option>");
		}
		$("#includedWikis").attr("size", 10);
		$("#nonIncludedWikis").attr("size", 10);
	});


}
