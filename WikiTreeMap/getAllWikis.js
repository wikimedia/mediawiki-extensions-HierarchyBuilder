
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
         printouts: 'Wiki API URL|Wiki Content URL|Small Wiki Logo|Gestalt Community Searchable',
         parameters: 'limit=500',
         format: 'json'
      },
      beforeSend: function (jqXHR, settings) {
         url = settings.url;
         // hook_log("url of ajax call: "+url);
      },
      success: function(data, textStatus, jqXHR) {
        parseAllWikisResults(data, vikiObject);
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
            };
            if(allWikis[i]["printouts"]["Gestalt Community Searchable"].length > 0 && allWikis[i]["printouts"]["Gestalt Community Searchable"][0] === 't')
               wiki.searchableWiki = true;
            else
               wiki.searchableWiki = false;
            
      allWikisArray.push(wiki);

   }

vikiObject.allWikis = allWikisArray;
//   hook_log("allWikisArray.length = "+allWikisArray.length);
//   hook_log("allWikisArray: ");
//   hook_log(allWikisArray);
   if(data["query-continue-offset"]) {
      offset = data["query-continue-offset"];
      queryForAllWikis(allWikisArray, offset);
   }
   else {
//      vikiObject.hookCompletion(MITRE_VIKI.hookName, null);
   }
}


// arbitrary comment
