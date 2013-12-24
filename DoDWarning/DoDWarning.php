<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/DoDWarning/DoDWarning.php");
*/

$wgExtensionCredits['parserhook'][] = array (
  'name' => 'DoD Warning',
  'version' => '1.1',
  'author' => 'Cindy Cicalese',
  'description' => 'Displays DoD warning on MediaWiki login page'
);

$wgHooks['UserLoginForm'][] = 'DoDWarning::addWarning';
$wgHooks['BeforePageDisplay'][] = 'DoDWarning::addBanner';

if (!$wgDoDWarning_enable_login_message) {
  $wgDoDWarning_enable_login_message = false;
}

if (!isset($wgDoDWarning_login_message)) {
  $wgDoDWarning_login_message =<<<END
<p style='text-align:center;font-weight:bold'>You are accessing a U.S.     \
Government (USG) Information System (IS) that is provided for              \
USG-authorized use only.</p>                                               \
<p> By using this IS (which includes any device attached to this IS), you  \
consent to the following conditions:<br /><br />                           \
<ul>                                                                       \
<li>The USG routinely intercepts and monitors communications on this IS    \
for purposes including, but not limited to, penetration testing, COMSEC    \
monitoring, network operations and defense, personnel misconduct (PM), law \
enforcement (LE), and counterintelligence (CI) investigations.<br /><br /> \
</li>                                                                      \
<li>At any time, the USG may inspect and seize data stored on this IS.     \
<br /><br /></li>                                                          \
<li>Communications using, or data stored on, this IS are not private, are  \
subject to routine monitoring, interception, and search, and may be        \
disclosed or used for any USG-authorized purpose<br /><br /></li>          \
<li>This IS includes security measures (e.g., authentication and access    \
controls) to protect USG interests--not for your personal benefit or       \
privacy.<br /><br /></li>                                                  \
<li>Notwithstanding the above, using this IS does not constitute consent   \
to PM, LE or CI investigative searching or monitoring of the content of    \
privileged communications, or work product, related to personal            \
representation or services by attorneys, psychotherapists, or clergy, and  \
their assistants. Such communications and work product are private and     \
confidential. See User Agreement for details.<br /><br /></li>             \
</ul>                                                                      \
</p>                                                                       \
END;
}

if (!$wgDoDWarning_enable_page_banner) {
  $wgDoDWarning_enable_page_banner = false;
}

if (!isset($wgDoDWarning_page_banner_background_color)) {
  $wgDoDWarning_page_banner_background_color = "#00FF00";
}

if (!isset($wgDoDWarning_page_banner_color)) {
  $wgDoDWarning_page_banner_color = "#FFFFFF";
}

if (!isset($wgDoDWarning_page_banner_text)) {
  $wgDoDWarning_page_banner_text = "UNCLASSIFIED";
}

class DoDWarning {

  static function addWarning(&$template) {
    global $wgDoDWarning_enable_login_message, $wgDoDWarning_login_message;
    if (!$wgDoDWarning_enable_login_message) {
      return true;
    }
    $warning =<<<END
<div style='border:1px solid grey;padding:10px;font-size:small'>           \
$wgDoDWarning_login_message                                                        \
<div style='text-align:center'>                                            \
<input type='checkbox' onClick='toggleLoginDoDWarning();'>                 \
Check box to consent to the conditions above                               \
</input>                                                                   \
</div>                                                                     \
</div>
END;
    $script =<<<END
      function toggleLoginDoDWarning() {
        var loginbutton = jQuery('.mw-submit #wpLoginAttempt');
        var disabled = loginbutton.attr('disabled');
        if (disabled === undefined) {
          loginbutton.attr('disabled', 'disabled');
        } else {
          loginbutton.removeAttr('disabled');
        }
      }

      jQuery(document).ready(function() {
        var loginbutton = jQuery('.mw-submit #wpLoginAttempt');
        loginbutton.attr('disabled', 'disabled');
        var loginform = jQuery('#userloginForm');
        var html = loginform.html();
        loginform.html("$warning" + html);
      });
END;
    $script = '<script type="text/javascript">' . $script . "</script>";
    global $wgOut;
    $wgOut->addScript($script);
    return true;
  }

  static function addBanner(&$out, &$skin) {
    global $wgDoDWarning_enable_page_banner,
      $wgDoDWarning_page_banner_background_color,
      $wgDoDWarning_page_banner_color,
      $wgDoDWarning_page_banner_text,
      $wgDoDWarning_page_banner_background_color_property,
      $wgDoDWarning_page_banner_color_property,
      $wgDoDWarning_page_banner_text_property;
    if (!$wgDoDWarning_enable_page_banner) {
      return true;
    }
    if (isset($wgDoDWarning_page_banner_background_color_property)) {
      $result = self::getPropertyValue(
        $wgDoDWarning_page_banner_background_color_property);
      if (strlen($result) > 0) {
        $wgDoDWarning_page_banner_background_color = $result;
      }
    }
    if (isset($wgDoDWarning_page_banner_color_property)) {
      $result =
        self::getPropertyValue($wgDoDWarning_page_banner_color_property);
      if (strlen($result) > 0) {
        $wgDoDWarning_page_banner_color = $result;
      }
    }
    if (isset($wgDoDWarning_page_banner_text_property)) {
      $result =
        self::getPropertyValue($wgDoDWarning_page_banner_text_property);
      if (strlen($result) > 0) {
        $wgDoDWarning_page_banner_text = $result;
      }
    }
    $page_banner =
      "<div style='width:100%;height:26px;padding-top:3px;background-color:" .
      $wgDoDWarning_page_banner_background_color . ";color:" .
      $wgDoDWarning_page_banner_color .
      ";font-size:20px;text-align:center;vertical-align:middle'>" .
      $wgDoDWarning_page_banner_text .
      "</div>";
    $script =<<<END
      function DoDWarning_resize() {
        var bottom_banner = jQuery('#dodwarning-bottom-banner');
        if (bottom_banner == null) {
          return;
        }
        var document_height = parseInt(jQuery(document).height());
        var bottom_banner_height = parseInt(bottom_banner.height());
        var top = document_height - bottom_banner_height;
        bottom_banner.css('position', 'absolute');
        bottom_banner.css('top', top + 'px');
        window.setTimeout(DoDWarning_resize, 1000);
      }

      jQuery(document).ready(function() {
        var top_banner =
          jQuery("$page_banner").insertBefore('#mw-page-base');
        var height = parseInt(top_banner.height());
        var top = parseInt(jQuery('#mw-head').css('top'));
        var newTop = top + height;
        jQuery('#mw-head').css('top', newTop + 'px');
        top = parseInt(jQuery('#mw-panel').css('top'));
        newTop = top + height;
        jQuery('#mw-panel').css('top', newTop + 'px');
        if (jQuery.browser.msie) {
          jQuery('#bodyContent').css('position', 'relative');
        }
        var bottom_banner =
          jQuery("<div style='height:20px'></div><div id='dodwarning-bottom-banner' style='width:100%'>$page_banner</div>").insertAfter('#footer');
        DoDWarning_resize();
      });
END;
    $script = '<script type="text/javascript">' . $script . "</script>";
    global $wgOut;
    $wgOut->addScript($script);
    return true;
  }

  static function getPropertyValue($property_name) {
    global $wgTitle;
    $page_title = $wgTitle->getText();
    $params = array();
    $params[] = "[[$page_title]]";
    $params[] = "mainlabel=-";
    $params[] = "headers=hide";
    $params[] = "?$property_name";
    $result = SMWQueryProcessor::getResultFromFunctionParams($params,
      SMW_OUTPUT_WIKI);
    return $result;
  }
}
