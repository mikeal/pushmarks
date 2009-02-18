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


var EXPORTED_SYMBOLS = ['getDelicious', 'fullSync', 'addedByExtension', 'Service', 'Bookmark', 'getAllBookmarks'];

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

if (!JSON) {
  Components.utils.import("resource://gre/modules/JSON.jsm");
  Components.utils.import("resource://pushmarks/modules/service.js")
}                

var withs = {}; Components.utils.import('resource://pushmarks/modules/withs.js', withs);
var arrays = {}; Components.utils.import('resource://pushmarks/modules/arrays.js', arrays);
var utils = {}; Components.utils.import('resource://pushmarks/modules/utils.js', utils);

backstage = this;
addedCallback = null;

function makeBaseAuth(user, pass) {
  var tok = user + ':' + pass;
  var hash = Base64.encode(tok);
  return "Basic " + hash;
}

var unfiledFolder = bmsvc.unfiledBookmarksFolder 


var Bookmark = function (uri, title, tags) {
  this.uri = uri;
  this._uri = ios.newURI(this.uri, null, null);
  if (title == undefined) {
    this.title = null;
  } else {
    this.title = title;
  }
  if (tags == undefined) {
    this.tags = null;
  } else {
    this.tags = tags;
  }
}
Bookmark.prototype.add = function () {
  var bmark = bmsvc.insertBookmark(unfiledFolder, this._uri, bmsvc.DEFAULT_INDEX, this.title);
  addedByExtension.push(bmark);
  if (this.tags) {
    taggingSvc.tagURI(this._uri, this.tags, 1);
  }
  return bmark;
}
Bookmark.prototype.exists = function () {
  // Return true or false if bookmark is in store.
  if (!bmsvc.isBookmarked(this._uri)) {
   return false;
  }
  return true;
}
Bookmark.prototype.save = function () {
  if (!this.exists()) {
    this.add();
  } else {
    bmarkId = bmsvc.getBookmarkIdsForURI(this._uri, {})[0];
    if (this.title) {
      bmsvc.setItemTitle(bmarkId, this.title);
    }
    if (this.tags) {
      taggingSvc.tagURI(this._uri, this.tags, 1);
    }
  };
}
Bookmark.prototype.push = function() {
  Service.add(this);
}

var getDelicious = function (username, password) {
  var XMLHttpRequest = utils.getMethodInWindows('XMLHttpRequest');
  var req = new XMLHttpRequest();  
  req.open('GET', 'https://api.del.icio.us/v1/posts/all', false, username, password);
  req.setRequestHeader('User-Agent', 'pushmarks-0.1')
  req.send(null);
  if (req.status != 200) {
    throw "Request to delicious fails, status code "+req.status+". Message: "+String(req.responseText)
  }
  return req.responseXML;
}


var readFile = function (file) {
  var data = "";
  var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                          createInstance(Components.interfaces.nsIFileInputStream);
  var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"].
                          createInstance(Components.interfaces.nsIScriptableInputStream);
  fstream.init(file, -1, 0, 0);
  sstream.init(fstream); 

  var str = sstream.read(4096);
  while (str.length > 0) {
    data += str;
    str = sstream.read(4096);
  }

  sstream.close();
  fstream.close();
  return data;
}
// 
var getDelicious = function(username, password) {
  // var file = Components.classes["@mozilla.org/file/local;1"].
  //                      createInstance(Components.interfaces.nsILocalFile);
  // file.initWithPath("/Users/mikeal/Documents/git/pushmarks/all.xml");
  // // |file| is nsIFile
  // data = readFile(file)
  var XMLHttpRequest = utils.getMethodInWindows('XMLHttpRequest');
  var req = new XMLHttpRequest();  
  req.open('GET', 'https://api.del.icio.us/v1/posts/all', false, username, password);
  req.setRequestHeader('User-Agent', 'pushmarks-0.1')
  req.send(null);
  if (req.status != 200) {
    throw "Request to delicious fails, status code "+req.status+". Message: "+String(req.responseText)
  }
  // return 
  // var data = req.responseXML;
  // var parser = new utils.getMethodInWindows('DOMParser')();
  // var dom = parser.parseFromString(data, "text/xml");
  posts = req.responseXML.getElementsByTagName('post');
  bookmarks = []
  for each(post in posts) {
    if (post.getAttribute != undefined) {
      var uri = post.getAttribute('href');
      var title = post.getAttribute('extended');
      if (title == "") {
        var title = post.getAttribute('description');
      }
      var tags = post.getAttribute('tag');
      if (tags == "") {
        var tags = [];
      } else {
        tags = tags.split(' ');
      }
      var bookmark = new Bookmark(uri, title, tags);
      bookmarks.push(bookmark);
    }
  }
  return bookmarks;
}

importing = false;

var fullSync = function() {
  importing = true;
  var deliciousBookmarks = getDelicious(Service.deliciousUsername, Service.deliciousPassword);
  var localBookmarks = getAllBookmarks();
  for each(bookmark in deliciousBookmarks) {
    bookmark.save();
  }
  for each(bookmark in localBookmarks) {
    if (deliciousBookmarks[bookmark.uri] == undefined) {
      Service.deliciousAdd(bookmark);
    }
  }
  importing = false;
}

// pushmarks = {}; Components.utils.import('resource://pushmarks/modules/init.js', pushmarks)

var addedByExtension = []

var isAddedByExtension = function(index) {
  for each(i in addedByExtension) {
    if (i == index) {
      return true;
    }
  }
  return false;
}

var ignoreBookmarks = [
  "http://en-us.www.mozilla.com/en-US/firefox/central/",
  "http://en-us.www.mozilla.com/en-US/firefox/about/",
  "http://en-us.www.mozilla.com/en-US/firefox/community/",
  "http://en-us.www.mozilla.com/en-US/firefox/customize/",
  "http://en-us.www.mozilla.com/en-US/firefox/help/",
  "https://en-us.add-ons.mozilla.com/en-US/firefox/bookmarks/",
  ]

var getAllBookmarks = function () {
  var f = utils.tempfile()
  var PlacesUtils = utils.getMethodInWindows('PlacesUtils');
  PlacesUtils.backupBookmarksToFile(f);
  
  var recursizeChildAdd = function(node, hash) {
    for each(n in node.children) {
      if (n.title == 'Most Visited' || n.title == 'Latest Headlines' ||
          n.title == 'Tags') {
            // Do Nothing
      } else if (n.type == 'text/x-moz-place-container') {
        recursizeChildAdd(n, hash);
      } else if (n.type == 'text/x-moz-place' && 
                 withs.startsWith(n.uri, 'http') &&
                 !arrays.inArray(ignoreBookmarks, n.uri)) {
        uri = ios.newURI(n.uri, null, null);
        hash[n.uri] = new Bookmark(n.uri, n.title, taggingSvc.getTagsForURI(uri, {}))
      }
    }
    return hash
  }
  
  return recursizeChildAdd(JSON.fromString(readFile(f)), {});
}

// An nsINavBookmarkObserver
var myExt_bookmarkListener = {
  onBeginUpdateBatch: function() {},
  onEndUpdateBatch: function() {},
  onItemAdded: function(aItemId, aFolder, aIndex) {
    MyExtension.itemAdded(aItemId, aFolder, aIndex);
  },
  onItemRemoved: function(aItemId, aFolder, aIndex) {},
  onItemChanged: function(aBookmarkId, aProperty, aIsAnnotationProperty, aValue) {
  },
  onItemVisited: function(aBookmarkId, aVisitID, time) {},
  onItemMoved: function(aItemId, aOldParent, aOldIndex, aNewParent, aNewIndex) {},
  QueryInterface: utils.getMethodInWindows('XPCOMUtils').generateQI([Components.interfaces.nsINavBookmarkObserver])
};

// An extension
var MyExtension = {
  // This function is called when my add-on is loaded
  onLoad: function() {
    bmsvc.addObserver(myExt_bookmarkListener, false);
  },
  // This function is called when my add-on is unloaded
  onUnLoad: function() {
    bmsvc.removeObserver(myExt_bookmarkListener);
  },
  callbackArgs: [],
  _itemAdded: function (aItemId, aFolder, aIndex) {
    if (!livemarkService.isLivemark(aFolder) && 
        !isAddedByExtension(aItemId) &&
        bmsvc.getItemType(aItemId) == 1) {
      var uri = bmsvc.getBookmarkURI(aItemId);
      var title = bmsvc.getItemTitle(aItemId);
      if (title != null && title != 'History' && title != 'Tags') {
        var bookmark = new Bookmark(uri.spec, title, taggingSvc.getTagsForURI(uri, {}));
        consoleService.logStringMessage(String(bmsvc.getItemTitle(aItemId)))
        bookmark.push();
      }
    }
    
  },
  doAllImport: function() {
    for each(args in MyExtension.callbackArgs) {
      MyExtension._itemAdded(args[0], args[1], args[2]);
    }
    MyExtension.callbackArgs = [];
  },
  itemAdded: function (aItemId, aFolder, aIndex) {
    
    if (importing == true) {
      MyExtension.callbackArgs.push([aItemId, aFolder, aIndex]);
      if (addedCallback == null) {
        addedCallback = MyExtension.doAllImport
  
        function doit(){
          this.backstage = backstage
        }
        doit.prototype.timeoutInterval = null  
        doit.prototype.do = function () {
          if (this.backstage.importing == false) {
            this.backstage.MyExtension.doAllImport();
            hwindow.clearInterval(this.timeoutInterval);
            this.backstage.addedCallback = null;
          }
        }
        
        waiter = new doit()
        hwindow.waiter = waiter;
        var timeoutInterval = hwindow.setInterval("waiter.do", 200);
        doit.timeoutInterval = timeoutInterval;
      }
    } else {
    MyExtension._itemAdded(aItemId, aFolder, aIndex);
    }
  }
};

MyExtension.onLoad();

