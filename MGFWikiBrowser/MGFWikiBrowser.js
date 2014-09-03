window.MGFWikiBrowser = {
	allWikis : new Array(),
	initWithWikiData : function(data) {
		// parse wiki data
		allWikis = jQuery.parseJSON(data);
		for(var i = 0; i < allWikis.length; i++) {
			allWikis[i].viki_searchable = (allWikis[i].viki_searchable == "1");
			allWikis[i].mgf_wiki = (allWikis[i].mgf_wiki == "1");
		}

		// add table to the output
		console.log(allWikis);

		var html = "<table><tbody>";
		for(var i = 0; i < allWikis.length; i++) {
			html += "<tr>";
			html += "<td>"+allWikis[i].wikiTitle+"</td>";
			html += "<td>"+allWikis[i].server+"</td>";
			html += "<td>"+allWikis[i].contentURL+"</td>";
			html += "<td>"+allWikis[i].logoURL+"</td>";
			html += "<td>"+allWikis[i].viki_searchable+"</td>";
			html += "</tr>";
		}
		html += "</tbody></table>";

		$("#MGFWikiBrowser").append(html);
	}
};