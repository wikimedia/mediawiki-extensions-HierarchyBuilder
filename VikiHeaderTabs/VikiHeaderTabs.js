/*
 * Copyright (c) 2014 The MITRE Corporation
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
 */

window.VIKI = (function(my) {
   my.VikiHeaderTabs = {

      hookName : "",
      setupHeaderTabsListener : function(vikiObject, parameters, hookName) {
         vikiObject.containingDiv = $("#VikiJS_"+vikiObject.ID).parent();
         if(vikiObject.containingDiv.css("display") === 'none') {
            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
            var target = document.querySelector("#VikiJS_"+vikiObject.ID).parentElement;
            vikiObject.divObserver = new MutationObserver(function(mutations) {
               mutations.forEach(function(m) {
                  if(m.type === 'attributes' && m.attributeName === 'class') {
                     if(vikiObject.containingDiv.css("display") !== 'none') {
                        vikiObject.redraw();
                        vikiObject.divObserver.disconnect();
                     }
                     
                  }
               });
            });

            var config = {
               attributes:true
            };

            vikiObject.divObserver.observe(target, config);
         }
      }
   };

   return my;
}(window.VIKI || {}));