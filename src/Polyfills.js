// Licensing details are in the source of the HTML file.
(function() {
  // polyfills
  if(!Array.prototype.filter) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
    Array.prototype.filter = function(fun) {
      "use strict";
      if(this === void 0 || this === null)
        throw new TypeError();
      var t = Object(this);
      var len = t.length >>> 0;
      if(typeof fun !== "function")
        throw new TypeError();
      var res = [];
      var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
      for (var i = 0; i < len; i++) {
        if(i in t) {
          var val = t[i];
          if(fun.call(thisArg, val, i, t))
            res.push(val);
        }
      }
      return res;
    };
  }
  if (!Array.prototype.map) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
    Array.prototype.map = function (callback, thisArg) {
      var T, A, k;
      if (this == null)
        throw new TypeError(" this is null or not defined");
      var O = Object(this);
      var len = O.length >>> 0;
      if (typeof callback !== "function")
        throw new TypeError(callback + " is not a function");
      if (arguments.length > 1)
        T = thisArg;
      A = new Array(len);
      k = 0;
      while (k < len) {
        var kValue, mappedValue;
        if (k in O) {
          kValue = O[k];
          mappedValue = callback.call(T, kValue, k, O);
          A[k] = mappedValue;
        }
        k++;
      }
      return A;
    };
  }
  if(!String.prototype.startsWith) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    Object.defineProperty(String.prototype, 'startsWith', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
      }
    });
  }
  if (!String.prototype.trim) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }
})();