#!/usr/bin/php

<?php

fclose(STDOUT);
$STDOUT = fopen('/tmp/importXML_application.log', 'wb');

echo ("Start of importXML log..." . "\n");

//Set path to your MediaWiki installation
$install_path = '/GESTALT/MEDIAWIKI/mediawiki-1.23';
chdir( $install_path );

//Load Mediawiki Stuff
# Define us as being in MediaWiki
$_SERVER['WIKI_NAME']="mitrepedia";

require_once( 'maintenance/commandLine.inc');
require_once( 'maintenance/importImages.inc' );

echo ("Beginning import...\n");
echo (date('l jS \of F Y h:i:s A'). "\n");
$globalStartIndex = 0;
$globalLimitCount = 500;

$startPage = "!";
//$startPage = "!exploitable";
$urlPagesBase = "http://mitrepedia.mitre.org/api.php?action=query&format=xml&apnamespace=10&list=allpages&aplimit=" . $globalLimitCount . "&apfrom=";
$urlBase = "http://mitrepedia.mitre.org/index.php/Special:Export?pages=";


while($globalStartIndex < 1000000) {

echo ("Migrating pages: " . $globalStartIndex . " to " . ($globalStartIndex + $globalLimitCount) . "\n");


$urlPages = $urlPagesBase . $startPage;

$xmlPages = file_get_contents($urlPages);

$pagesP = xml_parser_create();
xml_parse_into_struct($pagesP, $xmlPages, $pagesValues, $pagesTags);
xml_parser_free($pagesP);

//echo "Index array\n";
//print_r($pagesTags);
//echo "\nVals array\n";
//print_r($pagesValues);

$size = sizeof($pagesTags['P']);
for($index=0; $index < $size; $index++) {
   	$title = urlencode($pagesValues[$pagesTags['P'][$index]]['attributes']['TITLE']);
   	//echo ("Page title:" . $title .  "\n");

	$startPage = $title;
   	$url = $urlBase . $title;
   	$xml = file_get_contents($url);

	$p = xml_parser_create();
	xml_parse_into_struct($p, $xml, $values, $tags);
	xml_parser_free($p);

	$title =  $values[$tags['TITLE'][0]]['value'];
	if (isset($tags['USERNAME'])) {
		$username = $values[$tags['USERNAME'][0]]['value'];
	} else {
		$username = "Charlie MITRE";
	}

	if (isset( $values[$tags['TEXT'][0]]['value'])) {
		$text = $values[$tags['TEXT'][0]]['value'];
	} else {
		$text = "";
	}

	$user = User::newFromName( $username );
	if( is_object( $user ) ) {
    	$wgUser =& $user;
	}

	global $wgTitle;
	$wgTitle = Title::newFromText( $title, 0 );

	if( is_object( $wgTitle ) ) {
    	$comment = 'importXML.php upload.';
	    $flags = 0;
    	$article = new WikiPage( $wgTitle );
    
	    $article->doEdit( $text, $comment, $flags );

		echo("Added/Editted: " . $title . "\n");

	}

}

$globalStartIndex += $size;

if( $size < $globalLimitCount) {
	break;
}

}

echo ("Migration Complete. Processed " . $globalStartIndex . " pages."); 
echo (date('l jS \of F Y h:i:s A'). "\n");

