<?php
/**

* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/GetSearchableWikis/GetSearchableWikis.php");
*/

$wgExtensionCredits['api'][] = array(

'path' => __FILE__,
'name' => 'Get Searchable Wikis',
'descriptionmsg' => 'getsearchablewikis-desc',
'version' => '1.0.1',
'author' => 'Jason Ji'

);

$wgAutoloadClasses['ApiGetSearchableWikis'] = __DIR__ . '/ApiGetSearchableWikis.php';
$wgAPIModules['getSearchableWikis'] = 'ApiGetSearchableWikis';
$wgExtensionMessagesFiles['getsearchablewikis'] = __DIR__ . '/GetSearchableWikis.i18n.php';

return true;
