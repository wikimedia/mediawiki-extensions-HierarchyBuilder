<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/MIIBanner/MIIBanner.php");
*/

$wgExtensionCredits['parserhook'][] = array (
  'name' => 'MII Banner',
  'version' => '1.1',
  'author' => 'Cindy Cicalese',
  'description' => 'Displays MII Banner at top of each wiki page'
);

if (!isset($MIIBanner_useEnterpriseBanner)) {
  $MIIBanner_useEnterpriseBanner = false;
}

$wgHooks['BeforePageDisplay'][] = 'MIIBanner::addBanner';

class MIIBanner {

  static function addBanner(&$out, &$skin) {
    global $MIIBanner_useEnterpriseBanner;
    if ($MIIBanner_useEnterpriseBanner === true) {
      $banner_text =<<<END
<iframe src='http://info.mitre.org/.includes/iframeheader_ent/mii_header_ent_iframe.html'  scrolling='no' width='100%' height='30' name='mii_header_iframe' id='mii_header_iframe' marginheight='0' marginwidth='0' frameborder='0'></iframe>
END;
    } else {
      $banner_text =<<<END
<iframe src='http://info.mitre.org/.includes/iframeheader/mii_header_iframe.html'  scrolling='no' width='100%' height='30' name='mii_header_iframe' id='mii_header_iframe' marginheight='0' marginwidth='0' frameborder='0'></iframe>
END;
    }
    $script =<<<END
      jQuery(document).ready(function() {
        var banner = jQuery("$banner_text").insertBefore('#mw-page-base');
        var height = parseInt(banner.height());
        var top = parseInt(jQuery('#mw-head').css('top'));
        var newTop = top + height;
        jQuery('#mw-head').css('top', newTop + 'px');
        top = parseInt(jQuery('#mw-panel').css('top'));
        newTop = top + height;
        jQuery('#mw-panel').css('top', newTop + 'px');
        if (jQuery.browser.msie) {
          jQuery('#bodyContent').css('position', 'relative');
        }
      });
END;
    $script = '<script type="text/javascript">' . $script . "</script>";
    global $wgOut;
    $wgOut->addScript($script);
    return true;
  }
}
