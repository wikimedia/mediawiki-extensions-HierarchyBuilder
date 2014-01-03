<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/JQScatterPlot/jqScatterPlot.php");
*/

$wgExtensionCredits['parserhook'][] = array (
  'name' => 'Scatter Plot',
  'version' => '1.4',
  'author' => 'Cindy Cicalese',
  'description' => 'Displays a scatter plot of provided data using jqPlot'
);

$wgHooks['ParserFirstCallInit'][] = 'efJQScatterPlotExtension_Setup';
$wgHooks['LanguageGetMagic'][] = 'wfJQScatterPlotExtension_Magic';

$wgResourceModules['ext.JQScatterPlot.jqplot'] = array(
  'localBasePath' => dirname(__FILE__),
  'remoteExtPath' => 'JQScatterPlot',
  'scripts' => 'jquery.jqplot.js',
  'styles' => 'jquery.jqplot.css'
);

$wgResourceModules['ext.JQScatterPlot.jqbubble'] = array(
  'localBasePath' => dirname(__FILE__),
  'remoteExtPath' => 'JQScatterPlot',
  'scripts' => 'jqplot.bubbleRenderer.js',
  'dependencies' => 'ext.JQScatterPlot.jqplot'
);

function efJQScatterPlotExtension_Setup (&$parser) {
  $parser->setFunctionHook('scatterPlot', 'scatterPlot');
  return true;
}

function wfJQScatterPlotExtension_Magic(&$magicWords, $langCode) {
  $magicWords['scatterPlot'] = array (0, 'scatterPlot');
  return true;
}

function scatterPlot($parser, $options, $data) {
  $jqscatter = new JQScatterPlot;
  $output = $jqscatter->run($options, $data);
  #$output = $parser->recursiveTagParse($output);
  $parser->disableCache();
  return array($parser->insertStripItem($output, $parser->mStripState),
    'noparse' => false);
}

class JQScatterPlot {

  protected $m_width = '500px';
  protected $m_height = '300px';
  protected $m_tooltip_color = 'rgb(15%, 15%, 15%)';
  protected $m_tooltip_background_color = 'rgba(95%, 95%, 95%, 0.8)';
  protected $m_tooltip_font_size = '12px';
  protected $m_tooltip_padding = '2px';
  protected $m_tooltip_title_color = 'rgb(50%, 50%, 100%)';
  protected $m_tooltip_title_font_size = '14px';
  protected $m_chart_title = '';
  protected $m_hyperlink_data = true;
  protected $m_show_labels = false;
  protected $m_autoscale_bubbles = false;
  protected $m_vary_bubble_colors = false;
  protected $m_x_axis_label = '';
  protected $m_y_axis_label = '';
  protected $m_x_axis_min = '';
  protected $m_y_axis_min = '';
  protected $m_x_axis_max = '';
  protected $m_y_axis_max = '';
  protected $m_x_axis_pad = '';
  protected $m_y_axis_pad = '';
  protected $m_x_axis_number_ticks = '';
  protected $m_y_axis_number_ticks = '';
  protected $m_x_axis_variables_set = false;
  protected $m_y_axis_variables_set = false;
  static protected $m_scatter_chart_num = 1;

  public function run($options, $data) {
    $this->addScriptsAndStyles();
    $this->parseOptions($options);
    return $this->parseData(array_map('trim', explode(",", $data)));
  }

  protected function parseOptions($options) {
    $optionArray = $this->createOptionArray($options);
    if (array_key_exists('width', $optionArray)) {
      $this->m_width = $optionArray['width'];
    }
    if (array_key_exists('height', $optionArray)) {
      $this->m_height = $optionArray['height'];
    }
    if (array_key_exists('tooltip_color', $optionArray)) {
      $this->m_tooltip_color = $optionArray['tooltip_color'];
    }
    if (array_key_exists('tooltip_background_color', $optionArray)) {
      $this->m_tooltip_background_color =
        $optionArray['tooltip_background_color'];
    }
    if (array_key_exists('tooltip_font_size', $optionArray)) {
      $this->m_tooltip_font_size = $optionArray['tooltip_font_size'];
    }
    if (array_key_exists('tooltip_padding', $optionArray)) {
      $this->m_tooltip_padding = $optionArray['tooltip_padding'];
    }
    if (array_key_exists('tooltip_title_color', $optionArray)) {
      $this->m_tooltip_title_color = $optionArray['tooltip_title_color'];
    }
    if (array_key_exists('tooltip_title_font_size', $optionArray)) {
      $this->m_tooltip_title_font_size =
        $optionArray['tooltip_title_font_size'];
    }
    if (array_key_exists('chart_title', $optionArray)) {
      $this->m_chart_title = $optionArray['chart_title'];
    }
    if (array_key_exists('hyperlink_data', $optionArray)) {
      $this->m_hyperlink_data = $this->isTrue($optionArray['hyperlink_data']);
    }
    if (array_key_exists('show_labels', $optionArray)) {
      $this->m_show_labels = $this->isTrue($optionArray['show_labels']);
    }
    if (array_key_exists('autoscale_bubbles', $optionArray)) {
      $this->m_autoscale_bubbles =
        $this->isTrue($optionArray['autoscale_bubbles']);
    }
    if (array_key_exists('vary_bubble_colors', $optionArray)) {
      $this->m_vary_bubble_colors =
        $this->isTrue($optionArray['vary_bubble_colors']);
    }
    if (array_key_exists('x_axis_label', $optionArray)) {
      $this->m_x_axis_label = $optionArray['x_axis_label'];
      $this->m_x_axis_variables_set = true;
    }
    if (array_key_exists('y_axis_label', $optionArray)) {
      $this->m_y_axis_label = $optionArray['y_axis_label'];
      $this->m_y_axis_variables_set = true;
    }
    if (array_key_exists('x_axis_min', $optionArray)) {
      $this->m_x_axis_min = $optionArray['x_axis_min'];
      $this->m_x_axis_variables_set = true;
    }
    if (array_key_exists('y_axis_min', $optionArray)) {
      $this->m_y_axis_min = $optionArray['y_axis_min'];
      $this->m_y_axis_variables_set = true;
    }
    if (array_key_exists('x_axis_max', $optionArray)) {
      $this->m_x_axis_max = $optionArray['x_axis_max'];
      $this->m_x_axis_variables_set = true;
    }
    if (array_key_exists('y_axis_max', $optionArray)) {
      $this->m_y_axis_max = $optionArray['y_axis_max'];
      $this->m_y_axis_variables_set = true;
    }
    if (array_key_exists('x_axis_pad', $optionArray)) {
      $this->m_x_axis_pad = $optionArray['x_axis_pad'];
      $this->m_x_axis_variables_set = true;
    }
    if (array_key_exists('y_axis_pad', $optionArray)) {
      $this->m_y_axis_pad = $optionArray['y_axis_pad'];
      $this->m_y_axis_variables_set = true;
    }
    if (array_key_exists('x_axis_number_ticks', $optionArray)) {
      $this->m_x_axis_number_ticks = $optionArray['x_axis_number_ticks'];
      $this->m_x_axis_variables_set = true;
    }
    if (array_key_exists('y_axis_number_ticks', $optionArray)) {
      $this->m_y_axis_number_ticks = $optionArray['y_axis_number_ticks'];
      $this->m_y_axis_variables_set = true;
    }
  }

  protected function createOptionArray($options) {
    $optionArray = array();
    foreach (array_map('trim', explode(',', $options)) as $option) {
      $a = explode('=', $option);
      if (count($a) == 1) {
        $optionArray[$a[0]] = true;
      } else if (count($a) > 1) {
        $optionArray[$a[0]] = $a[1];
      }
    }
    return $optionArray;
  }

  protected function isTrue($b) {
    return $b === true || strtolower($b) === 'true';
  }

  // MW 1.17 +
  protected function addScriptsAndStylesNew() {
    global $wgOut, $wgScriptPath;
    $wgOut->addModules('ext.JQScatterPlot.jqplot');
    $wgOut->addModules('ext.JQScatterPlot.jqbubble');
    $path = $wgScriptPath . '/extensions/JQScatterPlot/';
    $wgOut->addScript('<!--[if IE]><script language="javascript" type="text/javascript" src="' . $path . 'excanvas.js"></script><![endif]-->');
  }

  // MW 1.16 -
  protected function addScriptsAndStylesOld() {
    global $wgOut, $wgScriptPath;
    //$wgOut->includeJQuery(); // doesn't work with excanvas.js
    $path = $wgScriptPath . '/extensions/JQScatterPlot/';
    $wgOut->addScriptFile($path . 'jquery.js');
    $wgOut->addScript('<!--[if IE]><script language="javascript" type="text/javascript" src="' . $path . 'excanvas.js"></script><![endif]-->');
    $wgOut->addScriptFile($path . 'jquery.jqplot.js');
    $wgOut->addScriptFile($path . 'jqplot.bubbleRenderer.js');
    $wgOut->addExtensionStyle($path . 'jquery.jqplot.css');
  }

  protected function addScriptsAndStyles() {
    if (self::$m_scatter_chart_num > 1) {
      return;
    }
    if (class_exists('ResourceLoader')) {
      //$this->addScriptsAndStylesNew();
      $this->addScriptsAndStylesOld();
    } else {
      $this->addScriptsAndStylesOld();
    }
  }

  protected function parseData($data) {

    // each result row will have label, x, y, (optionally) z, and
    // (optionally) link
    $coordinates = '[';
    $links = '[';
    $first = true;
    while (count($data) > 0) {
      if ($first === true) {
        $first = false;
      } else {
        $coordinates .= ',';
        $links .= ',';
      }
      $label = array_shift($data);
      $x = array_shift($data);
      $y = array_shift($data);
      if ($this->m_autoscale_bubbles) {
        $z = array_shift($data);
        if ($this->m_hyperlink_data) {
          $links .= '"' . array_shift($data) . '"';
        }
      } else {
        $z = 10;
        if ($this->m_hyperlink_data) {
          $links .= '"' . array_shift($data) . '"';
        }
      }
      $coordinates .= '[' . $x . ',' . $y . ',' . $z . ',"' . $label . '"]';
    }
    $coordinates .= ']';
    $links .= ']';

    $scatterID = 'scatter' . self::$m_scatter_chart_num;
    $tooltipID = 'tooltip' . self::$m_scatter_chart_num;
    self::$m_scatter_chart_num++;
    
    if (strlen($this->m_chart_title) > 0) {
      $title = "title: '" . $this->m_chart_title . "',";
    } else {
      $title = '';
    }

    if ($this->m_show_labels) {
      $showlabels = 'showLabels: true';
    } else {
      $showlabels = 'showLabels: false';
    }

    if ($this->m_autoscale_bubbles) {
      $autoscale = 'autoscaleBubbles: true';
    } else {
      $autoscale = 'autoscaleBubbles: false';
    }

    if ($this->m_vary_bubble_colors) {
      $varybubbles = 'varyBubbleColors: true';
    } else {
      $varybubbles = 'varyBubbleColors: false';
    }

    $x_axis_label = 'X';
    $y_axis_label = 'Y';
    if ($this->m_x_axis_variables_set || $this->m_y_axis_variables_set) {
      $axes = ', axes: {';
      if ($this->m_x_axis_variables_set) {
        $axes .= 'xaxis: {';
        $need_comma = false;
        if (strlen($this->m_x_axis_label) > 0) {
          $need_comma = true;
          $axes .= "label: '" . $this->m_x_axis_label ."'";
          $x_axis_label = $this->m_x_axis_label;
        }
        if (strlen($this->m_x_axis_min) > 0) {
          if ($need_comma) {
            $axes .= ',';
          }
          $need_comma = true;
          $axes .= "min: " . $this->m_x_axis_min;
        }
        if (strlen($this->m_x_axis_max) > 0) {
          if ($need_comma) {
            $axes .= ',';
          }
          $need_comma = true;
          $axes .= "max: " . $this->m_x_axis_max;
        }
        if (strlen($this->m_x_axis_pad) > 0) {
          if ($need_comma) {
            $axes .= ',';
          }
          $need_comma = true;
          $axes .= "pad: " . $this->m_x_axis_pad;
        }
        if (strlen($this->m_x_axis_number_ticks) > 0) {
          if ($need_comma) {
            $axes .= ',';
          }
          $need_comma = true;
          $axes .= "numberTicks: " . $this->m_x_axis_number_ticks;
        }
        if ($this->m_y_axis_variables_set) {
          $axes .= '},';
        } else {
          $axes .= '}';
        }
      }
      if ($this->m_y_axis_variables_set) {
        $axes .= 'yaxis: {';
        $need_comma = false;
        if (strlen($this->m_y_axis_label) > 0) {
          $need_comma = true;
          $axes .= "label: '" . $this->m_y_axis_label ."'";
          $y_axis_label = $this->m_y_axis_label;
        }
        if (strlen($this->m_y_axis_min) > 0) {
          if ($need_comma) {
            $axes .= ',';
          }
          $need_comma = true;
          $axes .= "min: " . $this->m_y_axis_min;
        }
        if (strlen($this->m_y_axis_max) > 0) {
          if ($need_comma) {
            $axes .= ',';
          }
          $need_comma = true;
          $axes .= "max: " . $this->m_y_axis_max;
        }
        if (strlen($this->m_y_axis_pad) > 0) {
          if ($need_comma) {
            $axes .= ',';
          }
          $need_comma = true;
          $axes .= "pad: " . $this->m_y_axis_pad;
        }
        if (strlen($this->m_y_axis_number_ticks) > 0) {
          if ($need_comma) {
            $axes .= ',';
          }
          $need_comma = true;
          $axes .= "numberTicks: " . $this->m_y_axis_number_ticks;
        }
        $axes .= '}';
      }
      $axes .= '}';
    } else {
      $axes = '';
    }

    if ($this->m_hyperlink_data) {
      $js_click =<<<END
        jQuery('#$scatterID').bind('jqplotDataClick',
          function (ev, seriesIndex, pointIndex, data, radius) {
          window.location = links[pointIndex];
          }
        );
END;
    }

    $js_scatter =<<<END
      jQuery(document).ready(function() {

        var data = $coordinates;
        var links = $links;

        jQuery('#$tooltipID').css({
          'color': '$this->m_tooltip_color',
          'background-color': '$this->m_tooltip_background_color',
          'font-size': '$this->m_tooltip_font_size',
          'padding':'$this->m_tooltip_padding'
        });

        plot = jQuery.jqplot('$scatterID', [data], {
          $title
          seriesDefaults: {
            renderer: jQuery.jqplot.BubbleRenderer,
            rendererOptions: {
              bubbleAlpha: 0.6,
              highlightAlpha: 0.8,
              $showlabels,
              $autoscale,
              $varybubbles
            },
            shadow: true,
            shadowAlpha: 0.05
          }
          $axes
        });

        jQuery('#$scatterID').bind('jqplotDataHighlight',
          function (ev, seriesIndex, pointIndex, data, radius) {
            var chart_left = jQuery('#$scatterID').position().left;
            var chart_top = jQuery('#$scatterID').position().top;
            // convert x and y axis units to pixels on grid
            var x = plot.axes.xaxis.u2p(data[0]);
            var y = plot.axes.yaxis.u2p(data[1]);
            var color = '$this->m_tooltip_title_color';
            var font_size = '$this->m_tooltip_title_font_size';
            jQuery('#$tooltipID').css({left:chart_left+x+radius+5, top:chart_top+y});
            jQuery('#$tooltipID').html('<span style="color:'+color+';font-size:'+font_size+';font-weight:bold;">'+data[3]+'</span><br />'+'$x_axis_label: '+data[0]+'<br />'+'$y_axis_label: '+data[1]);
            jQuery('#$tooltipID').show();
          }
        );

        jQuery('#$scatterID').bind('jqplotDataUnhighlight', 
          function (ev, seriesIndex, pointIndex, data) {
            jQuery('#$tooltipID').empty();
            jQuery('#$tooltipID').hide();
          }
        );

        $js_click

      });
END;

    $js_scatter = '<script type="text/javascript">' . $js_scatter . "</script>";
    global $wgOut;
    $wgOut->addScript($js_scatter);
    $text =<<<END
      <div id="$scatterID" style="width:{$this->m_width};height:{$this->m_height};"></div>
      <div id="$tooltipID" style="position:absolute;z-index:99;display:none;"></div>
END;
    return $text;
  }
}
