window.getIWLinksTable = function(vikiObject){
	
   jQuery.ajax({
      url: 'http://gestalt-ed.mitre.org/robopedia/api.php?action=iwtable&format=json',
      dataType: 'jsonp',
      beforeSend: function (jqXHR, settings) {
         url = settings.url;
         // hook_log("url of ajax call: "+url);
      },
      success: function(data, textStatus, jqXHR) {
  //      parseAllWikisResults(data, vikiObject);
	//	fillDropdown('#wikis', vikiObject);
	//			 console.log(data);

				 allWikis = data["iwtable"]["wikiIWArray"];
				 allWikisArray = [];

				 for(var i in allWikis) {
						var title = allWikis[i]["wikiTitle"];
						var wiki = {
									wikiTitle: title,
									apiURL: allWikis[i]["apiURL"],
									contentURL: allWikis[i]["contentURL"],
									logoURL: allWikis[i]["logoURL"],
									searchableWiki : allWikis[i]["searchableWiki"],
								  };
						if(allWikis[i]['searchableWiki']!== undefined ){

							var searchable = allWikis[i]['searchableWiki']

							if(searchable.length > 0 && searchable=== 'false'){
								 wiki.searchableWiki = true;
							} else {
								 wiki.searchableWiki = false;
							}		        

							allWikisArray.push(wiki);
	
						} else {
							// console.log(allWikis[i])
						}


		
				}

				vikiObject.allWikis = allWikisArray;
				vikiObject.activeWikis = []
				vikiObject.allWikis.forEach(function(d){
					if(d.searchableWiki===false){
							vikiObject.activeWikis.push(d)
					}
				})
				vikiObject.selectMsg = "Select a Wiki from the Inter-Wiki Table";
				fillDropdown('#IWwikis', vikiObject);
    },
      error: function(jqXHR, textStatus, errorThrown) {
         alert("Unable to fetch list of wikis. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown="+errorThrown);
      }
   });

}




window.MITRE_VIKI = {
	GESTALT_API_URL : "http://gestalt.mitre.org/gestalt/api.php"
}

window.mitre_getAllWikis = function(vikiObject, parameters, hookName) {
   MITRE_VIKI.hookName = hookName;

   queryForAllWikis(vikiObject, null);
}




window.queryForAllWikis = function(vikiObject, offset) {
// TODO: use offset if it exists to craft next query  
//   hook_log("url: "+MITRE_VIKI.GESTALT_API_URL);
   jQuery.ajax({
      url: MITRE_VIKI.GESTALT_API_URL,
      dataType: 'jsonp',
      data: {
         action: 'askargs',
         conditions: 'Category:Gestalt Communities',
         printouts: 'Wiki API URL|Wiki Content URL|Small Wiki Logo|Gestalt Community Searchable|Wiki Type',
         parameters: 'limit=500',
         format: 'json'
      },
      beforeSend: function (jqXHR, settings) {
         url = settings.url;
         // hook_log("url of ajax call: "+url);
      },
      success: function(data, textStatus, jqXHR) {
        parseAllWikisResults(data, vikiObject);
	//	fillDropdown('#wikis', vikiObject);
      },
      error: function(jqXHR, textStatus, errorThrown) {
         alert("Unable to fetch list of wikis. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown="+errorThrown);
      }
   });
}




window.parseAllWikisResults = function(data, vikiObject) {
   allWikis = data["query"]["results"];
   allWikisArray = [];

   for(var i in allWikis) {
      var title = allWikis[i]["fulltext"];
      var wiki = {
            wikiTitle: title,
            apiURL: allWikis[i]["printouts"]["Wiki API URL"][0],
            contentURL: allWikis[i]["printouts"]["Wiki Content URL"][0],
            logoURL: allWikis[i]["printouts"]["Small Wiki Logo"][0],
						wikiType : allWikis[i]["printouts"]["Wiki Type"][0],
           };
            if(allWikis[i]["printouts"]["Gestalt Community Searchable"].length > 0 && allWikis[i]["printouts"]["Gestalt Community Searchable"][0] === 't')
               wiki.searchableWiki = true;
            else
               wiki.searchableWiki = false;
            
      allWikisArray.push(wiki);

   }

vikiObject.allWikis = allWikisArray;
vikiObject.activeWikis = []
vikiObject.allWikis.forEach(function(d){
	if(d.wikiType=="Production"){
			vikiObject.activeWikis.push(d)
	}
})
vikiObject.selectMsg = "Select a Wiki from the Gestalt Menu"
fillDropdown('#wikis', vikiObject);
}


