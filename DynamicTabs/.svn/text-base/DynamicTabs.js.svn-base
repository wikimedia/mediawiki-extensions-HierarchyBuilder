function DynamicTabs_show(event, ui) {
  if (ui.panel.innerHTML.length > 0) {
    return;
  }
  var tab = jQuery("#" + ui.panel.id);
  var apiurl = tab.attr("apiurl");
  var text = tab.attr("template");
  jQuery.ajax({
    type: "POST",
    url: apiurl,
    async: false,
    data:  {
      action: "parse",
      format: "json",
      prop: "text",
      text: text
    },
    dataType: "json",
    success: function(data)  {
      ui.panel.innerHTML = data.parse.text["*"];
    }
  });
}

function DynamicTabs_init(divname) {
  jQuery("#" + divname).tabs({
    show: DynamicTabs_show,
    activate: DynamicTabs_show
  });
}
