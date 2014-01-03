<?php
/**
 * Recursively calls result format printers.
 */

global $smwgResultFormats;
$smwgResultFormats['multi'] = 'SMWMultiResultPrinter';

class SMWMultiResultPrinter extends SMWResultPrinter {

	private $subFormatParameters = array();
	private $globalParameters = array();
	private $formats = '';
	private $layout = '';
	private $templates = '';
	private $intro = '';
	private $outro = '';

	public function getName() {
		return 'multi result format';
	}

	private function addSubFormatParameter($index, $name, $value) {
		if (!array_key_exists($index, $this->subFormatParameters)) {
			$this->subFormatParameters[$index] = array();
		}
		$this->subFormatParameters[$index][$name] = $value;
	}

	protected function readParameters( $params, $outputmode ) {
		SMWResultPrinter::readParameters( $params, $outputmode );
		$myParams = array("formats", "layout", "templates", "intro", "outro");
		foreach ($params as $name => $value) {
			if ($name === 'headers') {
				$this->globalParameters['headers'] = $value;
			} else if ($name === 'link') {
				$this->globalParameters['link'] = $value;
			} else if ($name === 'default') {
				$this->globalParameters['default'] = $value;
			} else if ($name === 'searchlabel') {
				$this->globalParameters['searchlabel'] = $value;
			} else if (preg_match('/^(\d+)(.+)$/', $name, $matches) > 0) {
				$this->addSubFormatParameter($matches[1], $matches[2], $value);
			}
		}
		foreach ($myParams as $myParam=>$tmp) {
			$varName = "";
			if (array_key_exists("$tmp", $this->params)) {
				$varName = $varName . $tmp;
				$this->$varName = $params[$tmp];
			}
		}
	}

	public function getParameters() {
		$params = parent::getParameters();
		$params = array_merge($params, parent::textDisplayParameters());
		return $params;
	}

	public function getResult($results, $params, $outputmode) {
		$this->readParameters($params, $outputmode);
		return $this->getResultText($results, SMW_OUTPUT_WIKI);
	}

	protected function getResultText(SMWQueryResult $res, $outputmode) {

		if (strlen($this->formats) < 1 || strlen($this->layout) < 1) {
			$res->addErrors(array('ERROR: missing formats and/or layout parameter'));
			return '';
		}

		$id = Title::newFromText('Template:' . $this->layout)->getArticleId();
		if ($id === null) {
			$res->addErrors(array('ERROR: template ' . $this->layout .
        ' does not exist'));
			return '';
		}
		$article = Article::newFromId($id);
		if ($article === null) {
			$res->addErrors(array('ERROR: template ' . $this->layout .
        ' does not exist'));
			return '';
		}
		$output = $this->intro . $article->getRawText() . $this->outro;

		global $wgParser;
		$output= $wgParser->recursiveTagParse($output);
		$results = array();
		$formats = explode(",", $this->formats);
		$templates = array();
		if (strlen($this->templates) > 0) {
			$templates = explode(",", $this->templates);
		}
		$templateNum = 0;
		$resultNum = 1;
		foreach ($formats as $format) {
			if (array_key_exists($resultNum, $this->subFormatParameters)) {
				$params = $this->subFormatParameters[$resultNum];
			} else {
				$params = array();
			}
			$params = array_merge($params, $this->globalParameters);
			$format = trim($format);
			if ($format === 'template' && count($templates) > $templateNum) {
				$params['template'] = $templates[$templateNum];
				$templateNum++;
			}
			$params['format'] = $format;
			$printer = SMWQueryProcessor::getResultPrinter($format,
			SMWQueryProcessor::INLINE_QUERY);
			$result = $printer->getResult(clone $res, $params,
			SMW_OUTPUT_WIKI);
			$parse = true;
			if (is_array($result)) {
				if (array_key_exists('noparse', $result) && $result['noparse']) {
					$parse = false;
				}
				$result = $result[0];
			}
			if ($parse === true) {
				$result= $wgParser->recursiveTagParse($result);
			}
			$search = '{{{' . $resultNum . '}}}';
			$output = str_replace($search, $result, $output);
			$resultNum++;
		}
		return array($output, 'noparse' => 'true', 'isHTML' => 'false');
	}
}
