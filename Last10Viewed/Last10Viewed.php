<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/Last10Visits/Last10Visits.php");
*/

$wgExtensionCredits['parserhook'][] = array(
	'name' => 'Last 10 Viewed',
	'version' => '1.0',
	'author' => 'Lauren Hastings',
	'description' => "Displays the user's last ten visits on the site under the Toolbox as a dropdown .",
);

$wgHooks['BeforePageDisplay'][] = 'Last10Visits::addLast10VisitsJS';

class Last10Visits {

	static function addLast10VisitsJS(&$out, &$skin) {
		$script = <<<END
$(document).ready(function() {
	var recentVisitArray = getCookieArray("recentVisits");
	if(skin == "vector") {
		postVector();
	}
	else if(skin == "modern") {
		postOther('#mw_portlets');
	}
	else if(skin == "monobook") {
		postOther('#column-one');
	}
	else if(skin == "cologneblue") {
		postOther('#quickbar');
	}
	for (var i=0; recentVisitArray[i]!=null; i++) {
		var MIN_START=11;
		var startIndex=recentVisitArray[i].indexOf("title=",MIN_START)+6;
		if (startIndex<MIN_START){
			startIndex=MIN_START;
		}
		var endIndex = recentVisitArray[i].indexOf("?",startIndex);
		if (endIndex<startIndex){
			endIndex=recentVisitArray[i].indexOf("&",startIndex);
		}
		if (endIndex<startIndex){
			endIndex=recentVisitArray[i].length;
		}
		var regExp = new RegExp("[\/:_?-]", "g");
		var displayString=recentVisitArray[i].substring(startIndex,endIndex).replace(regExp, " ");
		var startString = window.location.href.substring(0, window.location.href.indexOf("/index.php"));
		console.log(recentVisitArray[i]);
		$("#p-rv-list").append('<li><a href="'+startString + recentVisitArray[i]+'">'+ displayString+'</a></li>');
	}
	addPageToCookieArray("recentVisits",365);
});
function postVector() {
	$("#mw-panel").append("<div class='portal persistent' role='navigation' id='p-rv' aria-labelledby='p-rv-label'></div>");
	$("#p-rv").append("<h3 id='p-rv-label' tabindex='3'><a href='#' aria-haspopup='true' aria-controls='p-rv-list' role='button' aria-pressed='false' aria-expanded='true'>Last 10 Pages Viewed</a></h3>");
	$("#p-rv").append("<div class='body' style='display: block;'><ul id='p-rv-list'></ul>");
}
function postOther(id) {
	$(id).append("<div class='portlet' id='p-rv' role='navigation'></div>");
	$("#p-rv").append("<h3>Last 10 Pages Viewed</h3><div class='pBody'><ul id='p-rv-list'></ul></div>");
}
//removes leading and trailing whitespace
String.prototype.trim =function(){
	//return this.replace(/^\s*(\b.*\b|)\s*$/, '');
	return this.replace(/^\s*/, '').replace(/\s*$/, '');
}
//returns the value of the name parameter from the URL 
function getParameter(name){
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null )
		return "";
	else
	return results[1];
}
//removes the parameter name from the url and returns the new url
function removeParameter(name, url){
	var startIndex=url.indexOf("&"+name+"=");
	if (startIndex<0) startIndex=url.indexOf(name+"=");
	if (startIndex<0) return url;
	var endIndex=url.substring(startIndex).indexOf("&")+startIndex;
	if (endIndex<=startIndex) endIndex=url.length-1;
	url=url.substring(0,startIndex)+url.substring(endIndex+1);
	if (url.lastIndexOf("?")==url.length-1) url=url.substring(0,url.length-1);
	return url;
}

//creates name cookie with value expring after days time
function createCookie(name,value,days) {
	if (days) {
	var date = new Date();
	date.setTime(date.getTime()+(days*24*60*60*1000));
	var expires = "; expires="+date.toGMTString();
}
else var expires = "";
	document.cookie = name+"="+escape(value)+expires+"; path=/";
}
//adds value to the cookie name[0], expiring in days
// the name[] stores max values with specified name
function addPageToCookieArray(name, days, max){
	if (null==max) max=10;
	var cookieArray=getCookieArray(name);
	startIndex=document.location.href.indexOf("/index.php/");
	var startStringLength="/index.php".length;

	if (-1==startIndex) startIndex=document.location.href.indexOf("/index.php?");
	value=decodeURI(document.location.href.substring(startIndex));
	//alert("viewing page "+value);
	if (getParameter("title").length>0) value=value.substring(0,startStringLength)+"/"+getParameter("title");
	//+removeParameter("title",value).substring(startStringLength);
	//value=decodeURI(removeParameter("action",value));
	//value=decodeURI(removeParameter("section",value));
	else if (value.indexOf("?")>0)
	value=value.substring(0,value.indexOf("?"));
	if (cookieArray[0]==value) return;
	for (var i=1;i<=cookieArray.length && i<max;i++){
		createCookie(name+"["+i+"]",cookieArray[i-1],365);
		if (cookieArray[i]==value) break;
	}
	createCookie(name+"[0]",value,365);
}
//gets the cookie val with the specified name
function getCookie(name){
	var startIndex=document.cookie.indexOf(name);
	if (startIndex!=-1){
		endIndex=document.cookie.indexOf(";",startIndex)
		if (endIndex==-1)endIndex=document.cookie.length;
		return unescape(document.cookie.substring(startIndex+name.length,endIndex));
	}
	return null;
}
//reads cookies for @length items named @name
//this function may have errors if there is another item in the cookie called XXXname
function getCookieArray(name){
	var cookieArray = new Array();
	var cookieVal;
	var i=0;
	while ((cookieVal=getCookie(name+"["+i+"]="))!=null)
	{
		cookieArray[i++]=cookieVal;
	}
	return cookieArray;
}
//erases cookie by setting expiration to neg number
function eraseCookie(name) {
	createCookie(name,"",-1);
}
END;
	$script = '<script type="text/javascript">' . $script . "</script>";
	global $wgOut;
	$wgOut->addScript($script);
	return true;
	}

}

?>