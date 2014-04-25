window.WikiTreeMap = function() {
    var jsonData = {"name":"allcategories", "children" : []};
    var elmData;
}

WikiTreeMap.prototype.drawChart = function(graphDiv, width, height) {
      var wikis = ["cnsdtm", "darpapedia", "dstc", "dstc-devel","enable", "eseteam", "examples", "experipedia",  "geopedia", "gestalt",  "gestaltd", "healthcareanalytics", "international", "j850mip", "j85d",  "jcrew-connect",  "languapedia","map",  "mitrepedia","mobilepedia", "mooc", "odp", "phatwiki", "reading",  "robopedia","socialmedia","tge", "tools","viki"];     
      fillAppropriateDropdown('#wikis', wikis);
      // var graphDiv = graphDiv;

    $('#loadData').click(function(e){
        var elmDiv = $('#wikis');
            elmData = elmDiv[0].value;        
            jsonData = {"name":"allcategories", "children" : []};
            $('svg').remove();
            $('h1').append().text(elmData);

        if(elmData==="mitrepedia"){
          var wikiUrl = "http://" + elmData + ".mitre.org/api.php?action=query&list=allcategories&acmin=1&acto=Tags&format=json&aclimit=max&acmax=max&acprop=size"
        } else {
          var wikiUrl = "http://" + elmData + ".mitre.org/.mediawiki/api.php?action=query&list=allcategories&format=json&acprop=size&acmax=500&acto=Tags"
        }
            recursiveQuery(wikiUrl, graphDiv, width, height);       
      }); 
}

      var tutorTree = function(data, graphDiv, width, height){
		// add the necessary names and values for the treemap to recognize the data          
        data.children.forEach(function(o){
          o.name = o['*'];
          o.value = o.pages;
        })
          var paddingAllowance = 2;
          var color = d3.scale.category20();

          var treemap = d3.layout.treemap()
                  .size([(width),(height)])
                  .nodes(data)

          var canvas = d3.select("#" + graphDiv).append("svg")
                      .style("position", "relative")
                      .style("width", width + "px")
                      .style("height", height + "px")
                      .append("g")
                      .attr("transform", "translate(-.5,-.5)");
                  // .attr("width", width)  // width
                  // .attr("height", height) // height



          // after calling 'treemap', it reorders the values in the object. 
          var cells = canvas.selectAll("g")
              .data(treemap)
              .enter().append("g")
              .attr("class", "cell")


          // This makes the DOM object elements a function of the treemap variables
          cells.append("rect")
              .attr("x", function (d) {return d.x; })
              .attr("y", function (d) {return d.y; })
              .attr("width", function (d) {return d.dx; })
              .attr("height", function (d) {return d.dy; })
              .attr("fill", function (d) {return d.children ? null : color(d.parent.name);})
              .attr("stroke", "white")

          // cells.append("text")
          //     .attr("x", function(d){ return d.x + d.dx / 2})
          //     .attr("y", function(d){ return d.y + d.dy / 2})
          //     .attr('text-anchor', 'middle')
          //     .text(function(d){return d.children ? null : d['*'];})
          //     // .call(self.textWrap, 0.9*(this.width), -1*self.width/2 + paddingAllowance);


          // // this method adapted from bl.ocks.org/mbostock/7555321
          //   WikiTreeMap.prototype.textWrap = function(text, width, x) {  
          //     text.each(function() {
          //       var text = d3.select(this),
          //         words = text.text().split(/\s+/).reverse(),
          //         word,
          //         line = [],
          //         lineNumber = 0,
          //         lineHeight = 1.1, // ems
          //         y = text.attr("y"),
          //         dy = parseFloat(text.attr("dy")) || 0,
          //         tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
          //       while (word = words.pop()) {
          //         line.push(word);
          //         tspan.text(line.join(" "));
          //         if (tspan.node().getComputedTextLength() > width) {
          //           line.pop();
          //           tspan.text(line.join(" "));
          //           line = [word];
          //           tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          //         }
          //       }
          //     });
          //   }


           cells.append("foreignObject")
                .attr("class", "foreignObject")
                .attr("width", function(d) {
                    return d.dx - paddingAllowance;
                })
                .attr("height", function(d) {
                    return d.dy;
                })
                .append("xhtml:body")
                .attr("class", "labelbody")
                .append("div")
                .attr("class", "label")
                .text(function(d) {
                    return d.children ? null : d['*'];
                })
                .attr("text-anchor", "middle")
      }


      function recursiveQuery(wUrl,graphDiv, width, height){
        jQuery.ajax({

            url: wUrl,
            dataType: 'jsonp',
            async: false,
            success: function (data, textStatus, jqXHR) {
              jsonData.children = jsonData.children.concat(data.query.allcategories);
              if(elmData==="mitrepedia"){
                if (data.hasOwnProperty("query-continue")){        
                  var qCont = data['query-continue'].allcategories.acfrom;
                  var newQuery = wUrl.split("&acfrom=")[0] + "&acfrom=" + qCont;
                  recursiveQuery(newQuery, graphDiv, width, height);
                } else {
                  tutorTree(jsonData, graphDiv, width, height);
                }
              } else {
                 if (data.hasOwnProperty("query-continue")){        
                  var qCont = data['query-continue'].allcategories.accontinue;
                  var newQuery = wUrl.split("&acfrom=")[0] + "&acfrom=" + qCont;
                  recursiveQuery(newQuery, graphDiv, width, height);
                } else {
                  tutorTree(jsonData, graphDiv, width, height);
                }
              }
            },
            error: function (jqXHR, textStatus, errorThrown) {
               error(textStatus);
            }
        }); 

      }

     function fillAppropriateDropdown(dropdownName, arrayToUse) {
        $.each(arrayToUse,
            function() {
            $(dropdownName).append('<option value="' + this + '">' + this + '</option>');
            });
            $(dropdownName).prepend("<option value='0' selected='true'>" +"--Select a Wiki--"+ "</option>");
            $(dropdownName).find("option:first")[0].selected = true;
    }