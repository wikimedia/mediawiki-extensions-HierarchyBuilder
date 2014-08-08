/*
 * Copyright (c) 2014 The MITRE Corporation
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

window.VIKI = (function(my) {
   my.MITRE_VIKI = {

      hookName : "",
      ajaxCalls : 0,
      mitre_matchIcons : function(vikiObject, parameters, hookName) {
      //parameters = [ new external nodes ]
         this.hookName = hookName;
      	nodes = parameters[0];
         needsRedraw = false;

         this.ajaxCalls = nodes.filter(function(i) { return i.URL.indexOf("info.mitre.org/people") != -1; }).length;

      	for(var i = 0; i < nodes.length; i++) {
      		node = nodes[i];
      		if(node.URL.indexOf("info.mitre.org/people") != -1) {
      			var pattern = /[0-9]+/;
      			employeeNum = node.URL.match(pattern)[0];

      		   this.queryPhonebook(vikiObject, node, employeeNum);
      		}
      		else if(node.URL.indexOf("info.mitre.org/phonebook/organization") != -1) {
      			deptNum = "Department "+node.URL.substring(node.URL.indexOf("=")+1) + " (MII)";
      			node.pageTitle = deptNum;
      			node.displayName = node.pageTitle;
      			node.fullDisplayName = node.displayName;
      			node.info = vikiObject.formatNodeInfo(node.fullDisplayName);
      			
      			node.hookIconURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/extensions/MITRE_VIKI/mitre_m.png";
               needsRedraw = true;
      		}
      		else if(node.URL.indexOf("mitre.org") != -1) {
      			node.hookIconURL = mw.config.get("wgServer")+mw.config.get("wgScriptPath")+"/extensions/MITRE_VIKI/mitre_m.png";
               needsRedraw = true;
      		}
      	}
      	
         if(this.ajaxCalls == 0)
            vikiObject.hookCompletion(hookName, {"redraw" : needsRedraw});
      	
      },

      queryPhonebook : function(vikiObject, node, employeeNum) {
         var self = this;
         jQuery.ajax({
            url: vikiObject.myApiURL,
            dataType: 'json',
            data: {
               action: 'mitrePhonebookAPILookup',
               format: 'json',
               empNum: employeeNum
            },
            timeout : 5000,
            beforeSend: function(jqXHR, settings) {
            },
            success: function(data, textStatus, jqXHR) {
               self.parsePhonebookData(vikiObject, data, node);
            },
            error: function(jqXHR, textStatus, errorThrown) {
               alert("Error fetching phonebook data. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown = "+errorThrown);
               this.ajaxCalls--;
               if(this.ajaxCalls == 0)
                  vikiObject.hookCompletion(this.hookName, { "redraw" : true });

            }
         });
      },

      parsePhonebookData : function(vikiObject, data, node) {
         result = data["mitrePhonebookAPILookup"]["result"];
         node.pageTitle = result["lastName"] + ", "+result["firstName"] + " (MII)";
         node.displayName = node.pageTitle;
         node.fullDisplayName = node.displayName;
         node.info = vikiObject.formatNodeInfo(node.fullDisplayName);

         node.hookIconURL = "http://static.mitre.org/people/photos/big/"+data["mitrePhonebookAPILookup"]["empNum"]+".jpg";
         // vikiObject.redraw(true);

         this.ajaxCalls--;
         if(this.ajaxCalls == 0)
            vikiObject.hookCompletion(this.hookName, { "redraw" : true });
      },

      hook_log : function(text) {
         if( (window['console'] !== undefined) )
            console.log( text );
      }
   };

   return my;
}(window.VIKI || {}));

// window.mitre_getAllWikis = function(vikiObject, parameters, hookName) {
//    MITRE_VIKI.hookName = hookName;

//    queryForAllWikis(vikiObject, null);
// }

// window.queryForAllWikis = function(vikiObject, offset) {
// // TODO: use offset if it exists to craft next query  
//    this.hook_log("url: "+MITRE_VIKI.GESTALT_API_URL);
//    jQuery.ajax({
//       url: MITRE_VIKI.GESTALT_API_URL,
//       dataType: 'jsonp',
//       data: {
//          action: 'askargs',
//          conditions: 'Category:Gestalt Communities',
//          printouts: 'Wiki API URL|Wiki Content URL|Small Wiki Logo|Gestalt Community Searchable',
//          parameters: 'limit=500',
//          format: 'json'
//       },
//       beforeSend: function (jqXHR, settings) {
//          url = settings.url;
//          // this.hook_log("url of ajax call: "+url);
//       },
//       success: function(data, textStatus, jqXHR) {
//          parseAllWikisResults(data, vikiObject);
//       },
//       error: function(jqXHR, textStatus, errorThrown) {
//          alert("Unable to fetch list of wikis. jqXHR = "+jqXHR+", textStatus = "+textStatus+", errorThrown="+errorThrown);
//       }
//    });
// }
// window.parseAllWikisResults = function(data, vikiObject) {
//    allWikisArray = vikiObject.allWikis;
//    allWikis = data["query"]["results"];

//    for(var i in allWikis) {
//       var title = allWikis[i]["fulltext"];
//       var wiki = {
//             wikiTitle: title,
//             apiURL: allWikis[i]["printouts"]["Wiki API URL"][0],
//             contentURL: allWikis[i]["printouts"]["Wiki Content URL"][0],
//             logoURL: allWikis[i]["printouts"]["Small Wiki Logo"][0],
//             };
//             if(allWikis[i]["printouts"]["Gestalt Community Searchable"].length > 0 && allWikis[i]["printouts"]["Gestalt Community Searchable"][0] === 't')
//                wiki.searchableWiki = true;
//             else
//                wiki.searchableWiki = false;
            
//       allWikisArray.push(wiki);

//    }

//    this.hook_log("allWikisArray.length = "+allWikisArray.length);
//    this.hook_log("allWikisArray: ");
//    this.hook_log(allWikisArray);
//    if(data["query-continue-offset"]) {
//       offset = data["query-continue-offset"];
//       queryForAllWikis(allWikisArray, offset);
//    }
//    else {
//       vikiObject.hookCompletion(MITRE_VIKI.hookName, null);
//    }
// }