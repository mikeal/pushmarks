// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
// 
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
// 
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
// 
// The Original Code is Mozilla Corporation Code.
// 
// The Initial Developer of the Original Code is
// Mikeal Rogers.
// Portions created by the Initial Developer are Copyright (C) 2009
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
//  Mikeal Rogers <mikeal.rogers@gmail.com>
// 
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the "GPL"), or
// the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.


/* Misc Data from UI */

var EXPORTED_SYMBOLS = ['sync'];

var Base64 = {}; Components.utils.import('resource://pushmarks/modules/base64.js', Base64);
var Base64 = Base64.Base64;

function getWindows(type) {
  if (type == undefined) {
      var type = "";
  }
  var windows = []
  var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator)
                     .getEnumerator(type);
  while(enumerator.hasMoreElements()) {
    windows.push(enumerator.getNext());
  }
  return windows;
}

function getMethodInWindows (methodName) {
  for each(w in getWindows()) {
    if (w[methodName] != undefined) {
      return w[methodName];
    }
  }
  throw "Method with name: '"+methodName+"' is not in any open window.";
}

function makeBaseAuth(user, pass) {
  var tok = user + ':' + pass;
  var hash = Base64.encode(tok);
  return "Basic " + hash;
}

var sync = function () {
  var req = new getMethodInWindows('XMLHttpRequest')();  
  // var auth = makeBaseAuth('mikeal', 'vulga00');
  // req.setRequestHeader('Authorization', auth);
  // req.open('GET', 'https://api.del.icio.us/v1/posts/all', false);   
  // return req;
}

// x = {}; Components.utils.import('resource://pushmarks/modules/init.js', x)

