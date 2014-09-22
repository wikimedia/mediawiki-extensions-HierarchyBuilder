// Code Procedure: 
// On window load, mitre_getAllWikis is called. This calls queryForAllWikis, and on success, calls parseAllWikiResults
// When a user either selects two wikis from the dropdown or inputs two wiki URLs and presses 'Load Data', 
// getComparativeWikis and getGeneralWikiInfo are called. Upon query completion, the queries call 'makeDiff' and 'makeGeneralDiff', 
// respectively. These functions diff the data and call versionTable to make the table

window.WikiVersionTool = function(){}






WikiVersionTool.prototype.drawChart = function(graphDiv, divwidth, divheight, wiki) {
	
	window.onload = function(e){        
			var vikiObject = [];
				vikiObject.graphDiv = graphDiv;
				vikiObject.divwidth = divwidth;
				vikiObject.divheight = divheight;
			getIWLinksTable(vikiObject);
//			mitre_getAllWikis(vikiObject) 
			
	}; 
}







function fillDropdown(dropdownName, vikiObject) {
	

	// Creating the Version Compare dropdown menu 1
    $('#wiki1').append('<h2>Compare Wiki Versions</h2>');		
    $('#wiki1').append('<h3>Choose from a Gestalt wiki</h3');		
    $('#wiki1').append('<select id="wiki1s" style="width:500px;"></select>');		
    $('#wiki1s').prepend("<option value='0' selected='true'>" +"--Compare Wiki 1--"+ "</option>");
    $('#wiki1s').find("option:first")[0].selected = true;

	// Creating the Version Compare dropdown menu 2
    $('#wiki2').append('<select id="wiki2s" style="width:500px;"></select>');		
    $('#wiki2s').prepend("<option value='0' selected='true'>" +"--Compare Wiki 2--"+ "</option>");
    $('#wiki2s').find("option:first")[0].selected = true;
    $('#wiki2').append('<p><button id="loadVersionData" type="button">Load Version Data</button></p>');		

	// adding text boxed for API input
    $('#wiki1text').append('<h3>Or enter a wiki API URL</h3>');
    $('#wiki1text').append("<h4>For Example:</h4>" + "<p>" + "http://gestalt-archive.mitre.org/dstc/.mediawiki/api.php?action=query&meta=siteinfo&siprop=general&format=json" +  "</p>");

		
    $('#wiki1text').append('<input type="text" name="wiki1URL" id="wiki1URL">');		
    $('#wiki2text').append('<input type="text" name="wiki2URL" id="wiki2URL">');		
    $('#wiki2text').append('<p><button id="loadVersionText" type="button">Load Version Data</button></p>');		

	// adding 'Clear' button for removing previous tables
    $('#clearButton').append('<p><button id="clearData" type="button">clear</button></p>');		

	// takes in user input into text box and gets wiki extension data and general wiki version data
	$('#loadVersionText').click(function(e){
		$('#fullTable').append('<div class="datagrid"><div id="unusedTable"></div><div id="generalWikiInfo"></div><div id="wikiVersions"></div><div id="wikiVersionTable"></div></div>');	
		var wikiVObject = [];
		wikiVObject.wiki1 = $('#wiki1URL')[0].value;
		wikiVObject.wiki2 = $('#wiki2URL')[0].value;
		wikiVObject.wiki1Name = $('#wiki1URL')[0].value;
		wikiVObject.wiki2Name = $('#wiki2URL')[0].value;
	    getComparativeWikis(wikiVObject);	
		getGeneralWikiInfo(wikiVObject);	
	})	


	// populates the wiki dropdown menu for version comparisons, except for non-working wikis
  	vikiObject.activeWikis.forEach(function(d) {
		if(d.wikiTitle==="CTS" || d.wikiTitle==="J85d-jobs" || d.wikiTitle==="Energy Tools"){
//			console.log(d.wikiTitle);
		} else {
//	        $(dropdownName).append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
	        $('#wiki1s').append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
	        $('#wiki2s').append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
		}
    });

	// 	event triggers to clear version table when user clicks 'clear'
	$('#clearData').click(function(e){
		$('svg').remove(); 
		$('h2').remove();
		$('.datagrid').remove();		
	})


	// takes in selector box data and gets wiki extension data and general wiki version data
	$('#loadVersionData').click(function(e){
		$('#fullTable').append('<div class="datagrid"><div id="unusedTable"></div><div id="generalWikiInfo"></div><div id="wikiVersions"></div><div id="wikiVersionTable"></div></div>');	
		var wikiVObject = [];
		wikiVObject.wiki1 = $('#wiki1s')[0].value;
		wikiVObject.wiki2 = $('#wiki2s')[0].value;
		wikiVObject.wiki1Name = $('#wiki1s')[0]['selectedOptions'][0]['label']
		wikiVObject.wiki2Name = $('#wiki2s')[0]['selectedOptions'][0]['label']
		getGeneralWikiInfo(wikiVObject);	
	    getComparativeWikis(wikiVObject);
	});
}



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
							console.log(allWikis[i])
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

fillDropdown('#wikis', vikiObject);
}




function makeGeneralDiff(wikiData1, wikiData2, wikiVObject){

	// creating a master list of extensions
	var allFields = [];
	allFields.push(["generator", "phpversion", "dbversion"]);

	var tObject = [];
	var n1 = wikiVObject.wiki1Name;
	var n2 = wikiVObject.wiki2Name;

	
	allFields[0].forEach(function(d){

		var rowObj = {};
			rowObj['Product'] = d;
			rowObj[n1]  = wikiData1[d];
			rowObj[n2]  = wikiData2[d];
			
		if(wikiData1[d]===wikiData2[d]){
			rowObj['same']  = "yes";			
		} else {
			rowObj['same']  = "no";						
		}		

		tObject.push(rowObj);		

	})

		var columns = ["Product", n1, n2];
		versionTable(tObject, columns, "generalWikiInfo");				

}	





