// If you want the treemap to automatically dispalay the category structure
// of a particular wiki, provide the URL of that wiki's API as the third argument in the wiki function call
// example: http://gestalt.mitre.org/gestalt/api.php


window.WikiTreeMap = function() {
    var jsonData = {"name":"allcategories", "children" : []};
    var elmData;
}






WikiTreeMap.prototype.drawChart = function(graphDiv, divwidth, divheight, wiki) {
	
	window.onload = function(e){        
		if (wiki !== ""){
//			$('#selectAWiki').hide();						
			var elmDiv = wiki;
			elmData = elmDiv;        
			jsonData = {"name":"allcategories", "children" : []};

//			$('div.wikitreemap-graph-container').append("<h2>" + elmData + "</h2>");

			var vikiObject = [];
				vikiObject.graphDiv = graphDiv;
				vikiObject.divwidth = divwidth;
				vikiObject.divheight = divheight;

			vikiObject.wUrl = elmData + "?action=query&list=allcategories&format=json&acprop=size&aclimit=500&acmin=1"
			vikiObject.unusedUrl = elmData + "?action=query&list=querypage&qppage=Unusedcategories&format=json"
			vikiObject.wantedUrl = elmData + "?action=query&list=querypage&qppage=Wantedcategories&format=json";
			getWanted(vikiObject);
			getUnused(vikiObject);
		} else {
			var vikiObject = [];
				vikiObject.graphDiv = graphDiv;
				vikiObject.divwidth = divwidth;
				vikiObject.divheight = divheight;
			mitre_getAllWikis(vikiObject) 
		}
    }; 

}







function fillDropdown(dropdownName, vikiObject) {
	
	// Creating the Treemap dropdown menu
    $('#selectAWiki').append('<select id="wikis" style="width:500px;"></select>');		
    $(dropdownName).prepend("<option value='0' selected='true'>" +"--Select a Wiki--"+ "</option>");
    $(dropdownName).find("option:first")[0].selected = true;
    $('#selectAWiki').append('<p><button id="loadData" type="button">Load Data</button></p>');		
    $(dropdownName).append('<option value="' + "http://mitrepedia.mitre.org/api.php" + '">' + "MITREpedia" + '</option>');

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
//    $('#wiki2').append('<p><button id="loadVersionData" type="button">Load Version Data</button></p>');		
    $('#wiki2').append('<p><button id="loadVersionData" type="button">Load Version Data</button></p>');		


    $('#wiki1text').append('<h3>Or enter a wiki API URL</h3>');		
    $('#wiki1text').append('<input type="text" name="wiki1URL" id="wiki1URL">');		
    $('#wiki2text').append('<input type="text" name="wiki2URL" id="wiki2URL">');		
    $('#wiki2text').append('<p><button id="loadVersionText" type="button">Load Version Data</button></p>');		


    $('#clearButton').append('<p><button id="clearData" type="button">clear</button></p>');		

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






  	vikiObject.activeWikis.forEach(function(d) {
		if(d.wikiTitle==="CTS" ^ d.wikiTitle==="J85d-jobs" ^ d.wikiTitle==="Energy Tools"){
			console.log(d.wikiTitle);
		} else {
	        $(dropdownName).append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
	        $('#wiki1s').append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
	        $('#wiki2s').append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
		}
    });
	
	$('#clearData').click(function(e){
		$('svg').remove(); 
		$('h2').remove();
		$('.datagrid').remove();		
	})

	$('#loadData').click(function(e){
	    var elmDiv = $('#wikis');
	    elmValue = elmDiv[0].value;        
		elmLabel = elmDiv[0]['selectedOptions'][0]['label'];
	    jsonData = {"name":"allcategories", "children" : []};
		$('div.wikitreemap-graph-container').append("<h2>" + elmLabel + "</h2>");
		vikiObject.elmLabel = elmLabel;
//		console.log(elmValue);
		vikiObject.wUrl = elmValue + "?action=query&list=allcategories&format=json&acprop=size&aclimit=500&acmin=1"
		vikiObject.unusedUrl = elmValue + "?action=query&list=querypage&qppage=Unusedcategories&format=json"
		vikiObject.wantedUrl = elmValue + "?action=query&list=querypage&qppage=Wantedcategories&format=json";
		  if(vikiObject.elmLabel === "MITREpedia"){
			recursiveQuery(vikiObject);			
		  } else {
			getWanted(vikiObject);  
			getUnused(vikiObject);
		  }
	  });     

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

