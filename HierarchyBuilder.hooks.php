<?php
 
class HierarchyBuilderHooks {

	public static function onRegistration () {
		if ( !defined( 'MEDIAWIKI' ) ) {
			die( '<b>Error:</b> This file is part of a MediaWiki extension and cannot' .
				' be run standalone.' );
		}

		global $wgVersion;
		if ( version_compare( $wgVersion, '1.21', 'lt' ) ) {
			die( '<b>Error:</b> This version of HierarchyBuilder is only compatible ' .
				'with MediaWiki 1.21 or above.' );
		}

		if ( !defined( 'SF_VERSION' ) ) {
			die( '<b>Error:</b> HierarchyBuilder is a Semantic Forms extension so must' .
				' be included after Semantic Forms.' );
		}

		if ( version_compare( SF_VERSION, '2.5.2', 'lt' ) ) {
			die( '<b>Error:</b> This version of HierarchyBuilder is only compatible with' .
				' Semantic Forms 2.5.2 or above.' );
		}
	}

	/**
	 * @param $parser Parser
	 * @return bool
	 */
	public static function efHierarchyBuilderSetup ( & $parser ) {
		$parser->setFunctionHook( 'hierarchyBreadcrumb', 
			'HierarchyBuilder::hierarchyBreadcrumb' );
		$parser->setFunctionHook( 'hierarchySectionNumber', 'HierarchyBuilder::hierarchySectionNumber' );
		$parser->setFunctionHook( 'hierarchyParent', 'HierarchyBuilder::hierarchyParent' );
		$parser->setFunctionHook( 'hierarchyChildren', 'HierarchyBuilder::hierarchyChildren' );
		$parser->setFunctionHook( 'hierarchySubtree', 'HierarchyBuilder::hierarchySubtree' );
		$parser->setFunctionHook( 'hierarchySelected', 'HierarchyBuilder::hierarchySelected' );

		$parser->setHook( 'hierarchy', 'HierarchyBuilder::renderHierarchy' );
		$parser->setHook( 'hierarchySelected', 'HierarchyBuilder::renderHierarchySelected' );
		global $sfgFormPrinter;
		$sfgFormPrinter->registerInputType( 'HierarchyFormInput' );
		$sfgFormPrinter->registerInputType( 'HierarchySelectFormInput' );
		return true;
	}

}