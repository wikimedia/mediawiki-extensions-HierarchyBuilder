// Hook functions

window.MITRE_VIKI = {
	GESTALT_API_URL : "http://gestalt.mitre.org/gestalt/api.php"
}

window.mitre_getAllWikis = function(vikiObject, parameters, hookName) {
   MITRE_VIKI.hookName = hookName;

   queryForAllWikis(vikiObject, null);
}

window.queryForAllWikis = function(vikiObject, offset) {
// TODO: use offset if it exists to craft next query  
   hook_log("url: "+MITRE_VIKI.GESTALT_API_URL);
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
         hook_log("url of ajax call: "+url);
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
   allWikisArray = vikiObject.allWikis;
   allWikis = data["query"]["results"];

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

   hook_log("allWikisArray.length = "+allWikisArray.length);

   if(data["query-continue-offset"]) {
      offset = data["query-continue-offset"];
      queryForAllWikis(allWikisArray, offset);
   }
   else {
      vikiObject.hookCompletion(MITRE_VIKI.hookName, null);
   }
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
			deptNum = "Department "+node.URL.substring(node.URL.indexOf("=")+1) + " (MII)";
			node.pageTitle = deptNum;
			node.displayName = node.pageTitle;
			node.fullDisplayName = node.displayName;
			node.info = vikiObject.formatNodeInfo(node.fullDisplayName);
			
			node.hookIconURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/extensions/MITRE_VIKI/mitre_m.png";
			hook_log("setting hookIconURL to "+node.hookIconURL);
		}
		else if(node.URL.indexOf("mitre.org") != -1) {
			node.hookIconURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/extensions/MITRE_VIKI/mitre_m.png";
			hook_log("setting hookIconURL to "+node.hookIconURL);
		}
	}
	
	vikiObject.redraw(true);
}

window.queryPhonebook = function(vikiObject, node, employeeNum) {
   jQuery.ajax({
      // async: false,
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

   node.hookIconURL = "http://static.mitre.org/people/photos/big/"+data["mitrePhonebookAPILookup"]["empNum"]+".jpg";
   hook_log(node.hookIconURL);
   vikiObject.redraw(true);
}

hook_log = function(text) {
   if( (window['console'] !== undefined) )
      console.log( text );
}

// Deprecated/outdated functions

// window.mitre_getAllWikis = function(vikiObject, parameters, hookName) {

//    MITRE_VIKI.hookName = hookName;
//    apiURL = vikiObject.myApiURL;
//    allWikisArray = vikiObject.allWikis;
   
//    jQuery.ajax({
//       url: apiURL,
//       // async: false,
//       dataType: 'json',
//       data: {
//          action: 'getAllWikis',
//          format: 'json'
//       },
//       success: function(data, textStatus, jqXHR) {
//          parseAllWikisList(data, allWikisArray);
//          hook_log("success getting all wikis");
//          vikiObject.hookCompletion(MITRE_VIKI.hookName, parameters);
//       },
//       error: function(jqXHR, textStatus, errorThrown) {
//          alert("Unable to fetch list of wikis.");
//       }
//    });
// }

// Helper functions

// window.parseAllWikisList = function(data, allWikisArray) {
// 	hook_log("Retrieved allWikisList");
// 	// allWikis = data["getAllWikis"]["results"];
// 	this.dummyJSON = {
//    "printrequests":[
//       {
//          "label":"",
//          "typeid":"_wpg",
//          "mode":2
//       },
//       {
//          "label":"Wiki API URL",
//          "typeid":"_uri",
//          "mode":1
//       },
//       {
//          "label":"Wiki Content URL",
//          "typeid":"_uri",
//          "mode":1
//       },
//       {
//          "label":"Small Wiki Logo",
//          "typeid":"_uri",
//          "mode":1
//       },
//       {
//          "label":"Gestalt Community Searchable",
//          "typeid":"_boo",
//          "mode":1
//       }
//    ],
//    "results":{
//       "Agile Work":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/agilework.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/agilework.mitre.org"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/agilework\/branding\/small_logo.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Agile Work",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Agile_Work"
//       },
//       "Answerswiki":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/answerswiki\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"Answerswiki",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Answerswiki"
//       },
//       "Awareness":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/awareness\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/awareness\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/awareness\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"Awareness",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Awareness"
//       },
//       "BISPR":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-dev.mitre.org\/bispr\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-dev.mitre.org\/bispr\/index.php\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-dev.mitre.org\/bispr\/branding\/logo.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"BISPR",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/BISPR"
//       },
//       "Biopedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/biopedia\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/biopedia\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/biopedia\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Biopedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Biopedia"
//       },
//       "Bronze":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-wd.mitre.org\/bronze\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-wd.mitre.org\/bronze\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt\/.mediawiki\/img_auth.php\/6\/63\/Bronzex32.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Bronze",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Bronze"
//       },
//       "Campaign":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/campaign\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Campaign",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Campaign"
//       },
//       "Cioc":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/cioc\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Cioc",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Cioc"
//       },
//       "Cnsdtm":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/cnsdtm.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/cnsdtm.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/cnsdtm.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Cnsdtm",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Cnsdtm"
//       },
//       "Compass":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/compass\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/compass\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/compass\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"Compass",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Compass"
//       },
//       "Courtroom":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/courtroom\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Courtroom",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Courtroom"
//       },
//       "Cyber":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/cyber\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/cyber\/wiki"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/cyber\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Cyber",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Cyber"
//       },
//       "Cyber-Ecosystem":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/cyber-ecosystem\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/cyber-ecosystem"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/cyber-ecosystem\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Cyber-Ecosystem",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Cyber-Ecosystem"
//       },
//       "DSTC-Devel":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/dstc-devel.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/dstc-devel.mitre.org"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/dstc-devel.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"DSTC-Devel",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/DSTC-Devel"
//       },
//       "Dcem":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/dcem\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/dcem\/\/wiki"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/dcem\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Dcem",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Dcem"
//       },
//       "Dexman":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/dexman\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/dexman\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/dexman\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Dexman",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Dexman"
//       },
//       "Enable":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/enable.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/enable.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/enable.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Enable",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Enable"
//       },
//       "Energy Tools":{
//          "printouts":{
//             "Wiki API URL":[
//                "https:\/\/energytools.esmap.org\/oet\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "https:\/\/energytools.esmap.org\/oet\/index.php\/Main_Page"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt\/.mediawiki\/img_auth.php\/1\/12\/Energy_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"Energy Tools",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Energy_Tools"
//       },
//       "Eresearch":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/eresearch\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Eresearch",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Eresearch"
//       },
//       "Eseteam":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/eseteam.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/eseteam.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/eseteam.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Eseteam",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Eseteam"
//       },
//       "Examples":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/examples.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/examples.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/examples.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Examples",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Examples"
//       },
//       "GCLR":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gclr-dev.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gclr-dev.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"GCLR",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/GCLR"
//       },
//       "GCLR-Dev":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gclr-dev.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gclr-dev.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gclr-dev.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"GCLR-Dev",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/GCLR-Dev"
//       },
//       "Geopedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/geopedia.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/geopedia.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/geopedia.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"Geopedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Geopedia"
//       },
//       "GestaltD":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestaltd.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestaltd.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestaltd.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"GestaltD",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/GestaltD"
//       },
//       "Globaltracker":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/globaltracker\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Globaltracker",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Globaltracker"
//       },
//       "Goalmarks":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/goalmarks\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"Goalmarks",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Goalmarks"
//       },
//       "Healthcareanalytics":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/healthcareanalytics.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/healthcareanalytics.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/healthcareanalytics.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Healthcareanalytics",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Healthcareanalytics"
//       },
//       "Icfn":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/icfn\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/icfn\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/icfn\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Icfn",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Icfn"
//       },
//       "Identity":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/identity\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/identity\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/identity\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Identity",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Identity"
//       },
//       "Infrapedia":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/infrapedia\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Infrapedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Infrapedia"
//       },
//       "Innovision":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/innovision\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/innovision\/index.php\/Main_Page"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/innovision\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Innovision",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Innovision"
//       },
//       "Iocpedia":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/iocpedia\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Iocpedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Iocpedia"
//       },
//       "Irseapedia":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/irseapedia\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Irseapedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Irseapedia"
//       },
//       "J850MIP":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/j850mip.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/j850mip.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/j850mip.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"J850MIP",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/J850MIP"
//       },
//       "J85D":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/j85d.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/j85d.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/j85d.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"J85D",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/J85D"
//       },
//       "J85d-jobs":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/j85d-jobs.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/j85d-jobs.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/j85d-jobs.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "f"
//             ]
//          },
//          "fulltext":"J85d-jobs",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/J85d-jobs"
//       },
//       "JCREW-Connect":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/jcrew-connect.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/jcrew-connect.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/jcrew-connect.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"JCREW-Connect",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/JCREW-Connect"
//       },
//       "Languapedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/languapedia.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/languapedia.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/languapedia.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Languapedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Languapedia"
//       },
//       "Map":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/map.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/map.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/map.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Map",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Map"
//       },
//       "Mobilepedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/mobilepedia.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/mobilepedia.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/mobilepedia.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Mobilepedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Mobilepedia"
//       },
//       "Needcapability":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/needcapability\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/needcapability\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/needcapability\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Needcapability",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Needcapability"
//       },
//       "PHAT":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/phatwiki.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/phatwiki.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/phatwiki.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"PHAT",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/PHAT"
//       },
//       "Ppw-dev":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/ppw-dev\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Ppw-dev",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Ppw-dev"
//       },
//       "Radarpedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/radarpedia\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/radarpedia\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/radarpedia\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Radarpedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Radarpedia"
//       },
//       "Reading":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/reading.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/reading.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/reading.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Reading",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Reading"
//       },
//       "Roadmap":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/roadmap.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/roadmap.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/roadmap\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Roadmap",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Roadmap"
//       },
//       "Robopedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/robopedia.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/robopedia.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/robopedia.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Robopedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Robopedia"
//       },
//       "Sentipedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/sentipedia\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/sentipedia\/wiki"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/sentipedia\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Sentipedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Sentipedia"
//       },
//       "Simpedia":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/simpedia\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Simpedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Simpedia"
//       },
//       "Socialmedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/socialmedia.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/socialmedia.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/socialmedia.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Socialmedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Socialmedia"
//       },
//       "Sosewiki":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/sosewiki\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Sosewiki",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Sosewiki"
//       },
//       "TGE":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/tge.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/tge.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/tge.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"TGE",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/TGE"
//       },
//       "TRMCpedia":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/gestalt-archive.mitre.org\/trmcpedia\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/gestalt-archive.mitre.org\/trmcpedia\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/trmcpedia\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"TRMCpedia",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/TRMCpedia"
//       },
//       "Technology Management Framework":{
//          "printouts":{
//             "Wiki API URL":[

//             ],
//             "Wiki Content URL":[

//             ],
//             "Small Wiki Logo":[
//                "http:\/\/gestalt-archive.mitre.org\/tmf\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[

//             ]
//          },
//          "fulltext":"Technology Management Framework",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Technology_Management_Framework"
//       },
//       "Tools":{
//          "printouts":{
//             "Wiki API URL":[
//                "http:\/\/tools.mitre.org\/.mediawiki\/api.php"
//             ],
//             "Wiki Content URL":[
//                "http:\/\/tools.mitre.org\/wiki\/"
//             ],
//             "Small Wiki Logo":[
//                "http:\/\/tools.mitre.org\/branding\/logo_small.png"
//             ],
//             "Gestalt Community Searchable":[
//                "t"
//             ]
//          },
//          "fulltext":"Tools",
//          "fullurl":"http:\/\/gestalt.mitre.org\/wiki\/Tools"
//       }
//   }
// };

// 	allWikis = this.dummyJSON["results"];

// 	for(var i in allWikis) {
// 		var title = allWikis[i]["fulltext"];
// 		var wiki = {
// 				wikiTitle: title,
// 				apiURL: allWikis[i]["printouts"]["Wiki API URL"][0],
// 				contentURL: allWikis[i]["printouts"]["Wiki Content URL"][0],
// 				logoURL: allWikis[i]["printouts"]["Small Wiki Logo"][0],
// 			   };
// 			   if(allWikis[i]["printouts"]["Gestalt Community Searchable"].length > 0 && allWikis[i]["printouts"]["Gestalt Community Searchable"][0] === 't')
// 				   wiki.searchableWiki = true;
// 			   else
// 				   wiki.searchableWiki = false;
			   
// 		allWikisArray.push(wiki);

// 	}

// 	// var testWiki = {
// 	// 	wikiTitle : 'US MC Net Ops (gestalt-ed test)',
// 	// 	apiURL : 'http://gestalt-ed.mitre.org/usmcnetops/api.php',
// 	// 	contentURL : 'http://gestalt-ed.mitre.org/usmcnetops/index.php/',
// 	// 	logoURL : 'http://gestalt-dev.mitre.org/usmcnetops/branding/logo.png',
// 	// 	searchableWiki : false
// 	// 	
// 	// }
// 	// 
// 	// allWikisArray.push(testWiki);
// 	// 
// 	hook_log("allWikisArray.length = "+allWikisArray.length);
// }


// 
// window.sleep = function(milliseconds) {
// 	var start = new Date().getTime();
// 
// 	var timer = true;
// 	while (timer) {
// 		if ((new Date().getTime() - start)> milliseconds) {
// 			timer = false;
// 		}
// 	}
// }
