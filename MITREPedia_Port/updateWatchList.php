#!/usr/bin/php

<?php

fclose(STDOUT);
$STDOUT = fopen('/tmp/update_watchlist_application.log', 'wb');

echo ("Start of updateWatchlist log..." . "\n");
//Set path to your MediaWiki installation
$install_path = '/GESTALT/MEDIAWIKI/mediawiki-1.23';
chdir( $install_path );

//Load Mediawiki Stuff
# Define us as being in MediaWiki
$_SERVER['WIKI_NAME']="mitrepedia";

require_once( 'maintenance/commandLine.inc');
require_once( 'maintenance/importImages.inc' );

echo ("Beginning update...\n");
echo (date('l jS \of F Y h:i:s A'). "\n");
chdir( "/GESTALT/WES/mitrepediaport" );

$watchlist = file_get_contents("./mitrepedia_watchlist.sql");

$users = file("./mitrepedia_user_table.txt");
$usersArray = array();

foreach($users as $line) {
	$user = explode(",", trim($line));
	array_push($usersArray, $user);
}

$records = explode("),", $watchlist);

$newWatchlist = "";

foreach($records as $record) {

	foreach($usersArray as $user) {
		$needle = "(" . $user[1] . ",";
		if(strpos($record, $needle) === 0) {
			$replace = "(" . $user[2] . ",";

			//echo "Gonna update: " . $record . "), with $user[2]\n";
			$record = str_replace($needle, $replace, $record);
			break;
		}
	}

	$newWatchlist = $newWatchlist . $record . "),";

}

$filename = "./updated_mitrepedia_watchlist.sql";
file_put_contents($filename, $newWatchlist);

//echo "\n\n\n-----------------------------------------\n\n\n$newWatchlist";
echo "Done with update";
