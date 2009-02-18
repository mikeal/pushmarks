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

var EXPORTED_SYMBOLS = ['Service', 'refreshFromPrefs']

var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);

var taggingSvc = Components.classes["@mozilla.org/browser/tagging-service;1"]
                    .getService(Components.interfaces.nsITaggingService);

var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                    .getService(Components.interfaces.nsINavBookmarksService);
var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                    .getService(Components.interfaces.nsIConsoleService);
var livemarkService = Components.classes["@mozilla.org/browser/livemark-service;2"]
                    .getService(Components.interfaces.nsILivemarkService);
var hwindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
                .getService(Components.interfaces.nsIAppShellService)
                .hiddenDOMWindow;
var historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"]
                .getService(Components.interfaces.nsINavHistoryService);
var uuidgen = Components.classes["@mozilla.org/uuid-generator;1"]
                .getService(Components.interfaces.nsIUUIDGenerator);


var withs = {}; Components.utils.import('resource://pushmarks/modules/withs.js', withs);
var arrays = {}; Components.utils.import('resource://pushmarks/modules/arrays.js', arrays);
var utils = {}; Components.utils.import('resource://pushmarks/modules/utils.js', utils);

var Service = {};
Service.add = function (bookmark) {
  if (Service.deliciousEnabled) {
    
    Service.deliciousAdd(bookmark);
  }
}
Service.getFromDelicious = function (bookmark) {
  
}
Service._deliciousAdd = function (bookmark) {
  var XMLHttpRequest = utils.getMethodInWindows('XMLHttpRequest');
  var req = new XMLHttpRequest();  
  var url = 'https://api.del.icio.us/v1/posts/add?';
  url += '&url='+bookmark.uri.split('#')[0];
  url += '&description='+bookmark.title;
  url += '&extended='+bookmark.title;
  url += '&tags='+bookmark.tags.join(' ');
  req.open('GET', url, false, Service.deliciousUsername, Service.deliciousPassword);
  req.setRequestHeader('User-Agent', 'pushmarks-0.1');
  req.send(null);
  if (req.status != 200) {
    throw "Request to delicious failed, status code "+req.status+". Message: "+String(req.responseText);
  }
  return req
}
Service._deliciousAddQueue = [];
Service.deliciousAdd = function (bookmark) {
  Service._deliciousAddQueue.push(bookmark);
  if (Service.timeoutSet == false) {
    Service.setTimeoutQueue();
  }
}
Service.timeoutSet = false;
Service.queueDo = function () {
  if (Service._deliciousAddQueue.length == 0) {
    hwindow.clearInterval(Service.timeoutSet);
    Service.timeoutSet = false;
  } else {
    Service._deliciousAdd(Service._deliciousAddQueue.pop())
  }
}
Service.setTimeoutQueue  = function () {
  hwindow.Service = Service;
  Service.timeoutSet = hwindow.setInterval("Service.queueDo()", 5000);
}
Service.deliciousUsername = null;
Service.deliciousPassword = null;


var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
prefs = prefs.getBranch("extensions.pushmarks.");

var refreshFromPrefs = function () {
  Service.deliciousEnabled  = prefs.getBoolPref('delicious.enabled');
  Service.deliciousUsername = prefs.getCharPref('delicious.username');
  Service.deliciousPassword = prefs.getCharPref('delicious.password');
}
refreshFromPrefs();
