jQuery(document).ready(function() {

  jQuery('body').find('.miisui').each(function() {

    function split(val) {
      return val.split(/,\s*/);
    }

    function extractLast(term) {
      return split(term).pop();
    }

    var apiurl = jQuery(this).attr("apiurl");
    if ( typeof apiurl === 'undefined' ) {
      return;
    }

    var is_list = false;
    var list = jQuery(this).attr("list");
    if ( typeof list !== 'undefined' ) {
      if (list == true) {
        is_list = true;
      }
    }

    if (is_list) {
      jQuery(this)
      // don't navigate away from the field on tab when selecting an item
      .bind("keydown", function(event) {
        if (event.keyCode === jQuery.ui.keyCode.TAB &&
            jQuery(this).data("autocomplete").menu.active) {
          event.preventDefault();
        }
      })
      .autocomplete({
        delay: 400,
        source: function(request, response) {
          var substr = extractLast(request.term);
          jQuery.ajax({
            type: "POST",
            url: apiurl,
            data:  {
              action: "miisui",
              format: "json",
              substr: substr
            },
            dataType: "json",
            success: function(data)  {
              response(data.miisui);
            }
          });
        },
        search: function() {
          var term = extractLast(this.value);
          if (term.length < 3) {
            return false;
          }
        },
        focus: function() {
          return false;
        },
        select: function(event, ui) {
          var terms = split(this.value);
          terms.pop();
          terms.push(ui.item.value);
          terms.push("");
          this.value = terms.join(", ");
          return false;
        }
      });
    } else {
      jQuery(this)
      .autocomplete({
        minLength: 3,
        delay: 400,
        source: function(request, response) {
          jQuery.ajax({
            type: "POST",
            url: apiurl,
            data:  {
              action: "miisui",
              format: "json",
              substr: request.term
            },
            dataType: "json",
            success: function(data)  {
              response(data.miisui);
            }
          });
        }
      });
    }
  });
});
