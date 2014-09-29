# OrgChart

## Configuration
The files listed below are located in the config directory.

#### endpoints.json
Configuration 
- Options: These options will be available for use in the template. To use these options, call the key exactly how it appears in the json data.

- Properties: The actual properties that will be queried via the mediawiki api. The results will be stored and made available for use like the options in the form of json key value pairs. The format of the keys will be altered such that the keys are stripped of all spaces and the first characters casing will be lowered. i.e. "Short Name" will become "shortName".


- Metadata: Extra data to be queried. i.e. people of an organization. Like properties and options, the results should be made available to a template. One option exists to make the data available to the tooltip. Note, since the option is boolean, the queried data should only go to either the node, or tooltip and not both.
	- NOTE: Metadata has not been fully implemented. The query exists, and code snippets exist throughout to build the functionality.

#### template.html
The html for a node template. Can be changed from local file to url.

#### tooltip.html
The html for a tooltip template. Can be changed from local file to url. 

## Thoughts

#### IE
In the original fixes, there was an issue processing some data within the code that caused the extension to crash in IE. One of the datatypes being passed back was supposed to be a string (and is in chrome/safari/firefox) and was an object in IE.
The extension is still broken in IE 10. After clearing the cache before the page loads (every time), the extension will load properly.

#### Generics with Recursion
Originally, to solve the issue with endless recursive calls, the property "Short Name" would be stored and checked against to see if the organizations name has been used before. Since switching the codebase to a generic manner, there is no guarantee of such a property that (for the most part) is acting like a unique identifier. Thus, the entire query of the object is converted from a json object to a string to make sure that the object is indeed exactly the same no matter the properties. The only issue with this, is if and only if a property changes in between queries i.e. a property updates in between the calls. 

#### Mustache Templates?
https://github.com/janl/mustache.js/

I figured that pure html/javascript/css that has been preprocessed should not be passed in directly the extension to be rendered for the node/tooltip. So within endpoints.js exists all of the items to be queried. And template.html is the actual html template. The theory was a configurable template where there is only one query for the template, and one for each property reducing the data sent across each query as a whole. But in using ractive.js, a templating engine that has full support for mustache templates has some issues that needs to be addressed.

So the templating engines usually take two arguments, the template itself, in the form of html with some sections that need to be parsed, and json data with the properties to fill those sections. Some of these properties are functions that can be passed in the json object. There exist two issues with using mustache templates thus far. 

The first is javascript. It seems as though one cannot place a script tag in the template html and have it run. This seems odd, but the only way to pass in javascript functions is again, through the json properties.

The second issue is with d3. Due to the workings of both d3 and a templating engine (explained above), d3 does not work in a clean manner. I was able to get most of the functionality working in the template by calling inline style, attributes and even inline javascript calls via onclick/onmouseover/etc. Even though this is ugly, it can still work. However, the only functionality that cannot be rendered thus far is the library d3-tip (for the d3 tooltip). This library generally is invoked via
.on('mouseover', tip.show)

The only issue is that since you cannot pass in raw javascript, you have to select the element through d3 select and then add the event listener. This has yet to work, though I could have been using d3 select and selectAll improperly.

Unless there is a way to get this working through a mustache template, the easiest way to get all of this working is passing in json arguments since most of the properties are still the same (style, . 
"image":{
	"x" : function (args){},
	"y" : 7
}

Another method is using the eval() function is a possible vunerability. If code is somehow injected.

Some libraries for templating are Ractivejs, Mustachejs, Handlebarsjs

