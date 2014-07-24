// If you want the treemap to automatically dispalay the category structure
// of a particular wiki, provide the URL of that wiki's API as the third argument in the wiki function call
// example: http://gestalt.mitre.org/gestalt/api.php


// If a wiki is not previously specified, mitre_getAllWikis is called to get the list of wikis
// mitre_getAllWikis calls fillDropdown, populating the dropdown menu

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


	// populates the wiki dropdown menu for version comparisons, except for non-working wikis
  	vikiObject.activeWikis.forEach(function(d) {
		if(d.wikiTitle==="CTS" || d.wikiTitle==="J85d-jobs" || d.wikiTitle==="Energy Tools"){
		} else {
	        $(dropdownName).append('<option value="' + d.apiURL + '">' + d.wikiTitle + '</option>');
		}
    });




	// adds a 'clear' button to clear out previous chart
    $('#clearButton').append('<p><button id="clearData" type="button">clear</button></p>');		

	// provides functionality for the click data
	$('#clearData').click(function(e){
		$('svg').remove(); 
		$('h2').remove();
		$('.datagrid').remove();		
	})

	// once a wiki is selected and the user clicks 'Load Data', category data is queried	
	$('#loadData').click(function(e){
	    var elmDiv = $('#wikis');
	    elmValue = elmDiv[0].value;        
		elmLabel = elmDiv[0]['selectedOptions'][0]['label'];
	    jsonData = {"name":"allcategories", "children" : []};
		$('div.wikitreemap-graph-container').append("<h2>" + elmLabel + "</h2>");
		vikiObject.elmLabel = elmLabel;
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
}

