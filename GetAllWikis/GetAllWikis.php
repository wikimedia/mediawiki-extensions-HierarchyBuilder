<?php
/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/GetAllWikis/GetAllWikis.php");
*/

define('GET_ALL_WIKIS_VERSION', '1.1');

$wgExtensionCredits['api'][] = array(

'path' => __FILE__,
'name' => 'Get All Wikis',
'descriptionmsg' => 'getallwikis-desc',
'version' => GET_ALL_WIKIS_VERSION,
'author' => 'Jason Ji'

);

$wgAutoloadClasses['ApiGetAllWikis'] = __DIR__ . '/ApiGetAllWikis.php';
$wgAPIModules['getAllWikis'] = 'ApiGetAllWikis';
$wgExtensionMessagesFiles['getallwikis'] = __DIR__ . '/GetAllWikis.i18n.php';

return true;
