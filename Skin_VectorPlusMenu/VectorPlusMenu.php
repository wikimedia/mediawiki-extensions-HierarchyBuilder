<?php
/**
 * VectorPlusMenu - JYJ edit of Vector to include enhanced menu from
 * VectorMenu extension.
 *
 * Copyright (c) 2013 The MITRE Corporation
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
 * 
 * @file
 * @ingroup Skins
 */


if( !defined( 'MEDIAWIKI' ) ) {
	die( -1 );
}


/**
 * SkinTemplate class for VectorPlusMenu skin
 * @ingroup Skins
 */
class SkinVectorPlusMenu extends SkinTemplate {

	protected static $bodyClasses = array( 'vector-animateLayout' );

	var $skinname = 'vectorplusmenu', $stylename = 'vectorplusmenu',
		$template = 'VectorPlusMenuTemplate', $useHeadElement = true;

	/**
	 * Initializes output page and sets up skin-specific parameters
	 * @param $out OutputPage object to initialize
	 */
	public function initPage( OutputPage $out ) {
		global $wgLocalStylePath;

		parent::initPage( $out );

		// Append CSS which includes IE only behavior fixes for hover support -
		// this is better than including this in a CSS fille since it doesn't
		// wait for the CSS file to load before fetching the HTC file.
		$min = $this->getRequest()->getFuzzyBool( 'debug' ) ? '' : '.min';
		$out->addHeadItem( 'csshover',
			'<!--[if lt IE 7]><style type="text/css">body{behavior:url("' .
				htmlspecialchars( $wgLocalStylePath ) .
				"/{$this->stylename}/csshover{$min}.htc\")}</style><![endif]-->"
		);

		$out->addModules( 'skins_vectorplusmenu_only.vectorplusmenu.js' );
//		$out->addModules('skins.vectorplusmenu.js');
	}

	/**
	 * Load skin and user CSS files in the correct order
	 * fixes bug 22916
	 * @param $out OutputPage object
	 */
	function setupSkinUserCss( OutputPage $out ) {
		parent::setupSkinUserCss( $out );
		$out->addModuleStyles( 'skins_vectorplusmenu_only.vectorplusmenu' );
//		$out->addModuleStyles('skins.vectorplusmenu');
	}

	/**
	 * Adds classes to the body element.
	 *
	 * @param $out OutputPage object
	 * @param &$bodyAttrs Array of attributes that will be set on the body element
	 */
	function addToBodyAttributes( $out, &$bodyAttrs ) {
		if ( isset( $bodyAttrs['class'] ) && strlen( $bodyAttrs['class'] ) > 0 ) {
			$bodyAttrs['class'] .= ' ' . implode( ' ', static::$bodyClasses );
		} else {
			$bodyAttrs['class'] = implode( ' ', static::$bodyClasses );
		}
	}
}

/**
 * QuickTemplate class for VectorPlusMenu skin
 * @ingroup Skins
 */
class VectorPlusMenuTemplate extends BaseTemplate {

	static $VectorPlusMenu_MenuPage = "MediaWiki:Menu";

	/* Functions */

	/**
	 * Outputs the entire contents of the (X)HTML page
	 */
	public function execute() {
		global $wgVectorUseIconWatch;

		// Build additional attributes for navigation urls
		$nav = $this->data['content_navigation'];

		if ( $wgVectorUseIconWatch ) {
			$mode = $this->getSkin()->getUser()->isWatched( $this->getSkin()->getRelevantTitle() ) ? 'unwatch' : 'watch';
			if ( isset( $nav['actions'][$mode] ) ) {
				$nav['views'][$mode] = $nav['actions'][$mode];
				$nav['views'][$mode]['class'] = rtrim( 'icon ' . $nav['views'][$mode]['class'], ' ' );
				$nav['views'][$mode]['primary'] = true;
				unset( $nav['actions'][$mode] );
			}
		}

		$xmlID = '';
		foreach ( $nav as $section => $links ) {
			foreach ( $links as $key => $link ) {
				if ( $section == 'views' && !( isset( $link['primary'] ) && $link['primary'] ) ) {
					$link['class'] = rtrim( 'collapsible ' . $link['class'], ' ' );
				}

				$xmlID = isset( $link['id'] ) ? $link['id'] : 'ca-' . $xmlID;
				$nav[$section][$key]['attributes'] =
					' id="' . Sanitizer::escapeId( $xmlID ) . '"';
				if ( $link['class'] ) {
					$nav[$section][$key]['attributes'] .=
						' class="' . htmlspecialchars( $link['class'] ) . '"';
					unset( $nav[$section][$key]['class'] );
				}
				if ( isset( $link['tooltiponly'] ) && $link['tooltiponly'] ) {
					$nav[$section][$key]['key'] =
						Linker::tooltip( $xmlID );
				} else {
					$nav[$section][$key]['key'] =
						Xml::expandAttributes( Linker::tooltipAndAccesskeyAttribs( $xmlID ) );
				}
			}
		}
		$this->data['namespace_urls'] = $nav['namespaces'];
		$this->data['view_urls'] = $nav['views'];
		$this->data['action_urls'] = $nav['actions'];
		$this->data['variant_urls'] = $nav['variants'];

		// Reverse horizontally rendered navigation elements
		if ( $this->data['rtl'] ) {
			$this->data['view_urls'] =
				array_reverse( $this->data['view_urls'] );
			$this->data['namespace_urls'] =
				array_reverse( $this->data['namespace_urls'] );
			$this->data['personal_urls'] =
				array_reverse( $this->data['personal_urls'] );
		}
		// Output HTML Page
		$this->html( 'headelement' );
?>
		<div id="mw-page-base" class="noprint"></div>
		<div id="mw-head-base" class="noprint"></div>
<?php
//======================================================================================================================
// This is the menu area, transplanted out of mw-navigation
			$menuHTML = self::showNewMenu($this->getSkin());
			//("Contents of menuHTML:\n$menuHTML\n", "/var/www/html/DEBUG_vectorPlusMenu.out");
			echo($menuHTML);
			$this -> renderNavigation( array( 'SEARCH'));
// This is the firstHeading area, transplanted out of bodyContent.
?>
			<!-- firstHeading -->
			<h1 id="firstHeading" class="firstHeading" lang="<?php
				$this->data['pageLanguage'] = $this->getSkin()->getTitle()->getPageViewLanguage()->getCode();
				$this->html( 'pageLanguage' );
			?>"><span dir="auto"><?php $this->html( 'title' ) ?></span></h1>
			<!-- /firstHeading --> 
<?php
//======================================================================================================================
?>
		<!-- content -->
		<div id="content" class="mw-body" role="main">
			<a id="top"></a>
			<div id="mw-js-message" style="display:none;"<?php $this->html( 'userlangattributes' ) ?>></div>
			<?php if ( $this->data['sitenotice'] ): ?>
			<!-- sitenotice -->
			<div id="siteNotice"><?php $this->html( 'sitenotice' ) ?></div>
			<!-- /sitenotice -->
			<?php endif; ?>
<?php
//======================================================================================================================
// firstHeading used to live here
//======================================================================================================================
?>
			<!-- bodyContent -->
			<div id="bodyContent">
				<?php if ( $this->data['isarticle'] ): ?>
				<!-- tagline -->
				<div id="siteSub"><?php $this->msg( 'tagline' ) ?></div>
				<!-- /tagline -->
				<?php endif; ?>
				<!-- subtitle -->
				<div id="contentSub"<?php $this->html( 'userlangattributes' ) ?>><?php $this->html( 'subtitle' ) ?></div>
				<!-- /subtitle -->
				<?php if ( $this->data['undelete'] ): ?>
				<!-- undelete -->
				<div id="contentSub2"><?php $this->html( 'undelete' ) ?></div>
				<!-- /undelete -->
				<?php endif; ?>
				<?php if( $this->data['newtalk'] ): ?>
				<!-- newtalk -->
				<div class="usermessage"><?php $this->html( 'newtalk' )  ?></div>
				<!-- /newtalk -->
				<?php endif; ?>
				<?php if ( $this->data['showjumplinks'] ): ?>
				<!-- jumpto -->
				<div id="jump-to-nav" class="mw-jump">
					<?php $this->msg( 'jumpto' ) ?>
					<a href="#mw-navigation"><?php $this->msg( 'jumptonavigation' ) ?></a><?php $this->msg( 'comma-separator' ) ?>
					<a href="#p-search"><?php $this->msg( 'jumptosearch' ) ?></a>
				</div>
				<!-- /jumpto -->
				<?php endif; ?>
				<!-- bodycontent -->
				<?php $this->html( 'bodycontent' ) ?>
				<!-- /bodycontent -->
				<?php if ( $this->data['printfooter'] ): ?>
				<!-- printfooter -->
				<div class="printfooter">
				<?php $this->html( 'printfooter' ); ?>
				</div>
				<!-- /printfooter -->
				<?php endif; ?>
				<?php if ( $this->data['catlinks'] ): ?>
				<!-- catlinks -->
				<?php $this->html( 'catlinks' ); ?>
				<!-- /catlinks -->
				<?php endif; ?>
				<?php if ( $this->data['dataAfterContent'] ): ?>
				<!-- dataAfterContent -->
				<?php $this->html( 'dataAfterContent' ); ?>
				<!-- /dataAfterContent -->
				<?php endif; ?>
				<div class="visualClear"></div>
				<!-- debughtml -->
				<?php $this->html( 'debughtml' ); ?>
				<!-- /debughtml -->
			</div>
			<!-- /bodyContent -->
		</div>
		<!-- /content -->
		<div id="mw-navigation">
			<h2><?php $this->msg( 'navigation-heading' ) ?></h2>
			<!-- header -->
			<div id="mw-head">
<?php 
//================================================================================================
// the menu area inside mw-head has been moved up to just above the content!

//================================================================================================
 ?>
			</div>
			<!-- /header -->
			<!-- panel -->
			<div id="mw-panel">
<?php /*	this commented code would show the sidebar.
				<!-- logo -->
					<div id="p-logo" role="banner"><a style="background-image: url(<?php $this->text( 'logopath' ) ?>);" href="<?php echo htmlspecialchars( $this->data['nav_urls']['mainpage']['href'] ) ?>" <?php echo Xml::expandAttributes( Linker::tooltipAndAccesskeyAttribs( 'p-logo' ) ) ?>></a></div>
				<!-- /logo -->
				<?php $this->renderPortals( $this->data['sidebar'] ); ?>
*/?>
			</div>
			<!-- /panel -->
		</div>
		<!-- footer -->
		<div id="footer" role="contentinfo"<?php $this->html( 'userlangattributes' ) ?>>
			<?php foreach( $this->getFooterLinks() as $category => $links ): ?>
				<ul id="footer-<?php echo $category ?>">
					<?php foreach( $links as $link ): ?>
						<li id="footer-<?php echo $category ?>-<?php echo $link ?>"><?php $this->html( $link ) ?></li>
					<?php endforeach; ?>
				</ul>
			<?php endforeach; ?>
			<?php $footericons = $this->getFooterIcons("icononly");
			if ( count( $footericons ) > 0 ): ?>
				<ul id="footer-icons" class="noprint">
<?php			foreach ( $footericons as $blockName => $footerIcons ): ?>
					<li id="footer-<?php echo htmlspecialchars( $blockName ); ?>ico">
<?php				foreach ( $footerIcons as $icon ): ?>
						<?php echo $this->getSkin()->makeFooterIcon( $icon ); ?>

<?php				endforeach; ?>
					</li>
<?php			endforeach; ?>
				</ul>
			<?php endif; ?>
			<div style="clear:both"></div>
		</div>
		<!-- /footer -->
		<?php $this->printTrail(); ?>

	</body>
</html>
<?php

	}

	/**
	 * Render a series of portals
	 *
	 * @param $portals array
	 */
	protected function renderPortals( $portals ) {
		// Force the rendering of the following portals
		if ( !isset( $portals['SEARCH'] ) ) {
			$portals['SEARCH'] = true;
		}
		if ( !isset( $portals['TOOLBOX'] ) ) {
			$portals['TOOLBOX'] = true;
		}
		if ( !isset( $portals['LANGUAGES'] ) ) {
			$portals['LANGUAGES'] = true;
		}
		// Render portals
		foreach ( $portals as $name => $content ) {
			if ( $content === false )
				continue;

			echo "\n<!-- {$name} -->\n";
			switch( $name ) {
				case 'SEARCH':
					break;
				case 'TOOLBOX':
					$this->renderPortal( 'tb', $this->getToolbox(), 'toolbox', 'SkinTemplateToolboxEnd' );
					break;
				case 'LANGUAGES':
					if ( $this->data['language_urls'] ) {
						$this->renderPortal( 'lang', $this->data['language_urls'], 'otherlanguages' );
					}
					break;
				default:
					$this->renderPortal( $name, $content );
				break;
			}
			echo "\n<!-- /{$name} -->\n";
		}
	}

	/**
	 * @param $name string
	 * @param $content array
	 * @param $msg null|string
	 * @param $hook null|string|array
	 */
	protected function renderPortal( $name, $content, $msg = null, $hook = null ) {
		if ( $msg === null ) {
			$msg = $name;
		}
		?>
<div class="portal" role="navigation" id='<?php echo Sanitizer::escapeId( "p-$name" ) ?>'<?php echo Linker::tooltip( 'p-' . $name ) ?>>
	<h3<?php $this->html( 'userlangattributes' ) ?>><?php $msgObj = wfMessage( $msg ); echo htmlspecialchars( $msgObj->exists() ? $msgObj->text() : $msg ); ?></h3>
	<div class="body">
<?php
		if ( is_array( $content ) ): ?>
		<ul>
<?php
			foreach( $content as $key => $val ): ?>
			<?php echo $this->makeListItem( $key, $val ); ?>

<?php
			endforeach;
			if ( $hook !== null ) {
				wfRunHooks( $hook, array( &$this, true ) );
			}
			?>
		</ul>
<?php
		else: ?>
		<?php echo $content; /* Allow raw HTML block to be defined by extensions */ ?>
<?php
		endif; ?>
	</div>
</div>
<?php
	}

	/**
	 * Render one or more navigations elements by name, automatically reveresed
	 * when UI is in RTL mode
	 *
	 * @param $elements array
	 */
	protected function renderNavigation( $elements ) {
		global $wgVectorUseSimpleSearch;

		// If only one element was given, wrap it in an array, allowing more
		// flexible arguments
		if ( !is_array( $elements ) ) {
			$elements = array( $elements );
		// If there's a series of elements, reverse them when in RTL mode
		} elseif ( $this->data['rtl'] ) {
			$elements = array_reverse( $elements );
		}
		// Render elements
		foreach ( $elements as $name => $element ) {
			echo "\n<!-- {$name} -->\n";
			switch ( $element ) {
				case 'NAMESPACES':
?>
<div id="p-namespaces" role="navigation" class="vectorTabs<?php if ( count( $this->data['namespace_urls'] ) == 0 ) echo ' emptyPortlet'; ?>">
	<h3><?php $this->msg( 'namespaces' ) ?></h3>
	<ul<?php $this->html( 'userlangattributes' ) ?>>
		<?php foreach ( $this->data['namespace_urls'] as $link ): ?>
			<li <?php echo $link['attributes'] ?>><span><a href="<?php echo htmlspecialchars( $link['href'] ) ?>" <?php echo $link['key'] ?>><?php echo htmlspecialchars( $link['text'] ) ?></a></span></li>
		<?php endforeach; ?>
	</ul>
</div>
<?php
				break;
				case 'VARIANTS':
?>
<div id="p-variants" role="navigation" class="vectorMenu<?php if ( count( $this->data['variant_urls'] ) == 0 ) echo ' emptyPortlet'; ?>">
	<h3 id="mw-vector-current-variant">
	<?php foreach ( $this->data['variant_urls'] as $link ): ?>
		<?php if ( stripos( $link['attributes'], 'selected' ) !== false ): ?>
			<?php echo htmlspecialchars( $link['text'] ) ?>
		<?php endif; ?>
	<?php endforeach; ?>
	</h3>
	<h3><span><?php $this->msg( 'variants' ) ?></span><a href="#"></a></h3>
	<div class="menu">
		<ul>
			<?php foreach ( $this->data['variant_urls'] as $link ): ?>
				<li<?php echo $link['attributes'] ?>><a href="<?php echo htmlspecialchars( $link['href'] ) ?>" lang="<?php echo htmlspecialchars( $link['lang'] ) ?>" hreflang="<?php echo htmlspecialchars( $link['hreflang'] ) ?>" <?php echo $link['key'] ?>><?php echo htmlspecialchars( $link['text'] ) ?></a></li>
			<?php endforeach; ?>
		</ul>
	</div>
</div>
<?php
				break;
				case 'VIEWS':
?>
<div id="p-views" role="navigation" class="vectorTabs<?php if ( count( $this->data['view_urls'] ) == 0 ) { echo ' emptyPortlet'; } ?>">
	<h3><?php $this->msg('views') ?></h3>
	<ul<?php $this->html('userlangattributes') ?>>
		<?php foreach ( $this->data['view_urls'] as $link ): ?>
			<li<?php echo $link['attributes'] ?>><span><a href="<?php echo htmlspecialchars( $link['href'] ) ?>" <?php echo $link['key'] ?>><?php
				// $link['text'] can be undefined - bug 27764
				if ( array_key_exists( 'text', $link ) ) {
					echo array_key_exists( 'img', $link ) ?  '<img src="' . $link['img'] . '" alt="' . $link['text'] . '" />' : htmlspecialchars( $link['text'] );
				}
				?></a></span></li>
		<?php endforeach; ?>
	</ul>
</div>
<?php
				break;
				case 'ACTIONS':
?>
<div id="p-cactions" role="navigation" class="vectorMenu<?php if ( count( $this->data['action_urls'] ) == 0 ) echo ' emptyPortlet'; ?>">
	<h3><span><?php $this->msg( 'actions' ) ?></span><a href="#"></a></h3>
	<div class="menu">
		<ul<?php $this->html( 'userlangattributes' ) ?>>
			<?php foreach ( $this->data['action_urls'] as $link ): ?>
				<li<?php echo $link['attributes'] ?>><a href="<?php echo htmlspecialchars( $link['href'] ) ?>" <?php echo $link['key'] ?>><?php echo htmlspecialchars( $link['text'] ) ?></a></li>
			<?php endforeach; ?>
		</ul>
	</div>
</div>
<?php
				break;
				case 'PERSONAL':
?>
<div id="p-personal" role="navigation" class="<?php if ( count( $this->data['personal_urls'] ) == 0 ) echo ' emptyPortlet'; ?>">
	<h3><?php $this->msg( 'personaltools' ) ?></h3>
	<ul<?php $this->html( 'userlangattributes' ) ?>>
<?php
					$personalTools = $this->getPersonalTools();
					foreach ( $personalTools as $key => $item ) {
						echo $this->makeListItem( $key, $item );
					}
?>
	</ul>
</div>
<?php
				break;
				case 'SEARCH':
?>
<div id="p-search" role="search">
	<h3<?php $this->html( 'userlangattributes' ) ?>><label for="searchInput"><?php $this->msg( 'search' ) ?></label></h3>
	<form action="<?php $this->text( 'wgScript' ) ?>" id="searchform">
		<?php if ( $wgVectorUseSimpleSearch && $this->getSkin()->getUser()->getOption( 'vector-simplesearch' ) ): ?>
		<div id="simpleSearch">
			<?php if ( $this->data['rtl'] ): ?>
			<?php echo $this->makeSearchButton( 'image', array( 'id' => 'searchButton', 'src' => $this->getSkin()->getSkinStylePath( 'images/search-rtl.png' ), 'width' => '12', 'height' => '13' ) ); ?>
			<?php endif; ?>
			<?php echo $this->makeSearchInput( array( 'id' => 'searchInput', 'type' => 'text' ) ); ?>
			<?php if ( !$this->data['rtl'] ): ?>
			<?php echo $this->makeSearchButton( 'image', array( 'id' => 'searchButton', 'src' => $this->getSkin()->getSkinStylePath( 'images/search-ltr.png' ), 'width' => '12', 'height' => '13' ) ); ?>
			<?php endif; ?>
		<?php else: ?>
		<div>
			<?php echo $this->makeSearchInput( array( 'id' => 'searchInput' ) ); ?>
			<?php echo $this->makeSearchButton( 'go', array( 'id' => 'searchGoButton', 'class' => 'searchButton' ) ); ?>
			<?php echo $this->makeSearchButton( 'fulltext', array( 'id' => 'mw-searchButton', 'class' => 'searchButton' ) ); ?>
		<?php endif; ?>
			<input type='hidden' name="title" value="<?php $this->text( 'searchtitle' ) ?>"/>
		</div>
	</form>
</div>
<?php

				break;
			}
			echo "\n<!-- /{$name} -->\n";
		}
	}

	function showMenu(&$skin) {
		$currentaction = "";
		$values = $skin->getRequest()->getValues();
		if (array_key_exists("action", $values)) {
			$currentaction = $values["action"];
		}
 
		global $wgArticlePath;
		$mainpage = Title::newMainPage()->getPrefixedURL();
		$mainpage = str_replace('$1', $mainpage, $wgArticlePath);
		$logo = $skin->getLogo();
		$menu =<<<EOT
<div id='menu-area'>
  <table>
    <tr>
      <td><a href="$mainpage"><image src="$logo" /*width="90px"*/ width="386px"/></a></td>
      <td style="width:100%;vertical-align:top;">
        <div class="menu">
          <table style="width:100%">
            <tr>
              <td class="menubar">
EOT;



		$currentpage = $skin->getTitle();
		$menu .= self::createMenubar($currentpage, $currentaction);

		$menu .=<<<EOT
              </td>
            </tr>
            <tr>
              <td id="p-search-cell" class="menubar">
EOT;
		$menu.=<<<EOT
			$this->renderNavigation( array( 'SEARCH' ) );
EOT;
		$menu.<<<EOT
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>
</div>
EOT;
		return $menu;
	}

	function showNewMenu(&$skin) {
		$currentaction = "";
		$values = $skin->getRequest()->getValues();
		if (array_key_exists("action", $values)) {
			$currentaction = $values["action"];
		}
 
		global $wgArticlePath;
		$mainpage = Title::newMainPage()->getPrefixedURL();
		$mainpage = str_replace('$1', $mainpage, $wgArticlePath);
		$logo = $skin->getLogo();
		$menu=<<<EOT
<div id='menu-area'>
	<table style="width:100%">
		<tr>
			<td style=><a href="$mainpage"><img id="logoImage" src="$logo" width="369px"/></a></td>
			<td id="p-search-cell" class="menubar"></td>
		</tr>
		<tr>
			<td style="colspan:2;vertical-align:top;">
				<div class="menu">
					<table style="width:100%">
						<tr>
							<td class="menubar">
EOT;

		$currentpage = $skin->getTitle();
		$menu .= self::createMenubar($currentpage, $currentaction);

		$menu .=<<<EOT
							</td>
						</tr>
					</table>
				</div>
			</td>
		</tr>
	</table>
</div>
EOT;
		return $menu;
	}

	private function createMenubar($currentpage, $currentaction) {
		$title = Title::newFromText(self::$VectorPlusMenu_MenuPage);
		if ($title->exists()) {
			$wikipage = WikiPage::factory($title);
			$menutemplate = $wikipage->getText(Revision::FOR_THIS_USER);
			$menuitems = preg_split("/\r\n|\n|\r/", $menutemplate);
			$submenuindex = 1;
			$menu = "";
			$submenus = "";
			foreach ($menuitems as $menuitem) {
				$fields = array_map("trim", explode("|", $menuitem));
				$label = array_shift($fields);
				if (strlen($label) > 0) {
					self::parseFields($fields, $fieldvalues);
					if (array_key_exists("page", $fieldvalues)) {
						$button = self::createButton($currentpage,
							$currentaction, $label, $fieldvalues, true);
						if ($button !== null) {
							$menu .= $button;
						}
					} else {
						$submenu = self::createSubmenuButton($currentpage,
							$currentaction, $submenuindex, $label,
							$fieldvalues);
						if ($submenu !== null) {
							$menu .= $submenu[0];
							$submenus .= $submenu[1];
							$submenuindex++;
						}
					}
				}
			}
			$currentpagename = $currentpage->getPrefixedURL();
			global $wgUser;
			global $wgArticlePath;
			if ($wgUser->isAnon()) {
				$login = str_replace('$1', 'Special:UserLogin', $wgArticlePath) .
					'?returnto=' . $currentpagename;
				$menu .=<<<EOT
<a class="topmenubutton" href="$login">Log in</a>

EOT;
			} else {
				$logout = str_replace('$1', 'Special:UserLogout', $wgArticlePath) .
					'?returnto=' . $currentpagename;
				$menu .=<<<EOT
<a class="topmenubutton" href="$logout">Log out $wgUser->mName</a>

EOT;
			}
			$menu .=<<<EOT
              </td>
            </tr>
            <tr>
              <td class="menubar" id="submenurow">

EOT;
	    $submenus = "<div id='submenuBarItems'>".$submenus."</div>";
            $menu .= $submenus;
			return $menu;
		} else {
			return "Menu definition page " . self::$VectorPlusMenu_MenuPage .
				" does not exist";
		}
	}

	private function parseFields($fields, &$fieldvalues) {
		$fieldvalues = array();
		foreach ($fields as $field) {
			$fieldarray = array_map("trim", explode("=", $field));
			if (strlen($fieldarray[0]) > 0) {
				$fieldvalues[$fieldarray[0]] =
					(count($fieldarray) > 1) ? $fieldarray[1] : "";
			}
		}
	}

	private function createButton($currentpage, $currentaction, $label,
		$fieldvalues, $toprow) {
		if (array_key_exists("groups", $fieldvalues)) {
			if (!self::userInGroup($fieldvalues["groups"])) {
				return null;
			}
		}
		if (array_key_exists("page", $fieldvalues)) {
			$pagename = $fieldvalues["page"];
			if ($currentpage->isSpecialPage()) {
				if (strpos($pagename, '__CURRENTPAGE__')) {
					return null;
				}
				if (strpos($pagename, '__TALKPAGE__')) {
					return null;
				}
			} else {
				$pagename = str_replace('__CURRENTPAGE__',
					$currentpage->getSubjectPage()->getPrefixedURL(),
					$pagename);
				$pagename = str_replace('__TALKPAGE__',
					$currentpage->getTalkPage()->getPrefixedURL(), $pagename);
				global $wgUser;
				if (!$wgUser->isAnon()) {
					$pagename = str_replace('__MYPAGE__',
						$wgUser->getUserPage()->getPrefixedURL(), $pagename);
				}
			}
		} else {
			$pagename = strtr($label, " ", "_");
		}
		if (array_key_exists("action", $fieldvalues)) {
			$action = $fieldvalues["action"];
		} else {
			$action = null;
		}
		if (array_key_exists("params", $fieldvalues)) {
			$params = $fieldvalues["params"];
		} else {
			$params = null;
		}
		if (array_key_exists("allowcreate", $fieldvalues)) {
			$allowcreate = true;
		} else {
			$allowcreate = false;
		}
		$pagetitle = Title::newFromText($pagename);
		if ($pagetitle === null) {
			return null;
		}
		if ($allowcreate === false && !$pagetitle->exists() &&
			!$pagetitle->isSpecialPage()) {
			return null;
		}
		if ($action == "formedit") {
			$formnames = SFFormLinker::getDefaultFormsForPage($pagetitle);
			if (count($formnames) == 0) {
				$action = "edit";
			}
		}
		$currentpagename = $currentpage->getPrefixedURL();
		if ($pagename == $currentpagename && $action == $currentaction) {
			return null;
		}
		global $wgUser;
		$errors = $currentpage->getUserPermissionsErrors(
			($action === null) ? "read" : (($action == "formedit") ? "edit" :
			$action), $wgUser); 
		if (count($errors) !== 0) {
			// getUserPermissionsErrors() seems not to work for watch and history actions,
			// so the following is a check for these cases.
			if(!($action == "watch" || $action == "history"))
				return null;
		}
		global $wgArticlePath;
		$url = str_replace('$1', $pagename, $wgArticlePath);
		if ($action !== null) {
			$url .= "?action=" . $action;
		}
		if ($params !== null) {
			if ($actions === null) {
				$url .= "?";
			}
			$url .= $params;
		}
		if ($toprow === true) {
			$buttonclass = "topmenubutton";
		} else {
			$buttonclass = "submenubutton";
		}
		return "<a class='$buttonclass' href='" . $url . "'>$label</a>";
	}

	private function createSubmenuButton($currentpage, $currentaction,
		$submenuindex, $label, $fieldvalues) {
		if (array_key_exists("groups", $fieldvalues)) {
			if (!self::userInGroup($fieldvalues["groups"])) {
				return null;
			}
		}
		if (array_key_exists("submenu", $fieldvalues)) {
			$submenupage = $fieldvalues["submenu"];
		} else {
			$submenupage = $label;
		}
		$submenu = self::createSubmenu($currentpage,
			$currentaction, $submenuindex, $submenupage);
		if ($submenu === null) {
			return null;
		}
		return array(
			"<a class='menubutton' href='#tabs-" . $submenuindex .
				"'>$label</a>",
			$submenu
		);
	}

	private function createSubmenu($currentpage, $currentaction, $submenuindex,
		$submenupage) {
		$submenu = "";
		$title = Title::newFromText("MediaWiki:" . $submenupage);
		if ($title !== null && $title->exists()) {
			$wikipage = WikiPage::factory($title);
			$menutemplate = $wikipage->getText(Revision::FOR_THIS_USER);
			$menuitems = preg_split("/\r\n|\n|\r/", $menutemplate);
			foreach ($menuitems as $menuitem) {
				$fields = array_map("trim", explode("|", $menuitem));
				$label = array_shift($fields);
				if (strlen($label) > 0) {
					self::parseFields($fields, $fieldvalues);
					$button = self::createButton($currentpage,
						$currentaction, $label, $fieldvalues, false);
					if ($button !== null) {
						$submenu .= $button;
					}
				}
			}
		} else {
			return null;
		}
		if (strlen($submenu) > 0) {
			$submenu = "<div id='tabs-$submenuindex' class='submenubar'>" .$submenu . "</div>";
			return $submenu;
		} else {
			return null;
		}
	}

	private function userInGroup($grouplist) {
		global $wgUser;
		$usergroups = $wgUser->getGroups();
		$menuitemgroups = array_map("trim", explode(",", $grouplist));
		foreach ($menuitemgroups as $group) {
			if (in_array($group, $usergroups)) {
				return true;
			}
		}
		return false;
	}
}

