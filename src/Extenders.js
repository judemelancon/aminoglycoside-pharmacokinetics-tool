// Licensing details are in the source of the HTML file.
(function() {
  ko.extenders.logChanges = function(target, name) {
    target.subscribe(function(updatedValue) {
      console.log(name+" -> "+updatedValue);
    });
    return target;
  };
  
  function getRounded(value,precision) {
    var numericValue = parseFloat(+value);
    var roundingScalar = Math.pow(10,precision);
    return Math.round(numericValue*roundingScalar)/roundingScalar;
  }

  ko.extenders.numericGet = function(target, precision) {
    return ko.computed({ read: function() {
      var rounded = getRounded(target(),precision)
      return precision >= 0 ? rounded.toFixed(precision) : rounded;
    }});
  };
  ko.extenders.numericSet = function(target, precision) {
    var result = ko.computed({ read: target, write: function(updatedValue) {
      var significantChange = false;
      var currentValue = target();
      if(!isNaN(updatedValue)) {
        var roundedValue = getRounded(updatedValue,precision);
        significantChange = roundedValue !== currentValue;
        if(significantChange)
          target(roundedValue);
      }
      if(updatedValue !== currentValue && !significantChange) // Notify for insignificant change; notification for significant changes was already done as part of the set.
        target.notifySubscribers(currentValue);
    }}).extend({ notify: 'always' }); // so that notifySubscribers call will work
    result(target()); // initialize
    return result;
  };

  ko.extenders.numericMinimum = function(target, minimum) {
    var result = ko.computed({ read: target, write: function(updatedValue) {
      var significantChange = false;
      var currentValue = target();
      if(!isNaN(updatedValue)) {
        var constrainedValue = updatedValue < minimum ? minimum : updatedValue;
        significantChange = constrainedValue !== currentValue;
        if(significantChange)
          target(constrainedValue);
      }
      if(updatedValue !== currentValue && !significantChange) // Notify for insignificant change; notification for significant changes was already done as part of the set.
        target.notifySubscribers(currentValue);
    }}).extend({ notify: 'always' }); // so that notifySubscribers call will work
    result(target()); // initialize
    return result;
  };

  ko.extenders.momentSet = function(target, momentFormat) {
    var result = ko.computed({ read: target, write: function(updatedValue) {
      var parsedValue = moment(updatedValue,momentFormat); // lenient
      if(parsedValue.isValid()){
        target(parsedValue.format(momentFormat)); // tidy on write
      }
      else {
        target.notifySubscribers(target());
      }
    }}).extend({ notify: 'always' }); // so that notifySubscribers call will work;
    result(target()); // initialize
    return result;
  };
})();