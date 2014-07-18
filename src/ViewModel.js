// Licensing details are in the source of the HTML file.
function AminoglycosidePharmacokineticsViewModel() {
  var self = this;

  var timeOfDayFormat = 'HH:mm';

  var doseDigits = 0;
  var durationDigits = 1;
  var weightDigits = 1;
  var dosePerWeightDigits = 1;
  var levelDigits = 2;
  var parameterDigits = 3;

  function durationBetween(firstTime,secondTime) {
    var firstTimeValue = moment(ko.utils.unwrapObservable(firstTime),timeOfDayFormat);
    var secondTimeValue = moment(ko.utils.unwrapObservable(secondTime),timeOfDayFormat);
    if(secondTimeValue.isBefore(firstTimeValue))
      secondTimeValue.add('days',1);
    return moment.duration(secondTimeValue.diff(firstTimeValue));
  }
  function hoursBetween(firstTime,secondTime) {
    return durationBetween(firstTime,secondTime).asHours();
  }

  this.modes = ['Initial', 'Peak-Trough', 'Zaske'];
  this.sexes = ['Female', 'Male'];
  this.medications = ['Gentamicin', 'Tobramycin', 'Amikacin'];

  this.mode = ko.observable(self.modes[0]);
  // NOTE: An important consequence of this initial value combined with the imperative nature of this method-as-constructor style is that
  // properties dependent on other properties must be defined without forward references _in the Initial mode_.
  // It's fine if they have forward references in other modes because every property will exist before the mode can change.

  // patient inputs
  this.age = ko.observable(30).extend({numericSet: 0});
  this.sex = ko.observable(self.sexes[0]);
  this.height = ko.observable(66).extend({numericSet: 0});
  this.weight = ko.observable(70).extend({numericSet: weightDigits});
  this.dosingWeight = ko.observable(60).extend({numericSet: weightDigits});
  this.serumCreatinine = ko.observable(0.7).extend({numericSet: 2});
  this.inputVolumeOfDistribution = ko.observable(0.25).extend({numericSet: 2});

  // computed from patient inputs alone
  this.idealWeight = ko.computed(function(){
    var idealForBaseHeight;
    switch(self.sex()) {
      case 'Female':
        idealForBaseHeight = 45.5;
        break;
      case 'Male':
        idealForBaseHeight = 50;
        break;
      default:
        return NaN;
    }
    return idealForBaseHeight + 2.3*(self.height() - 60);
  });
  this.displayIdealWeight = this.idealWeight.extend({numericGet: weightDigits});
  this.adjustedWeight = ko.computed(function(){
    return 0.6*self.idealWeight() + 0.4*self.weight();
  });
  this.displayAdjustedWeight = this.adjustedWeight.extend({numericGet: weightDigits});
  this.dosingWeightStatus = ko.computed(function(){
    if( self.weight() < self.idealWeight() ) {
      return 'DosingWeightShouldBeActualWeight';
    }
    else if( self.weight() < 1.2*self.idealWeight() ) {
      return 'DosingWeightShouldBeIdealWeight';
    }
    else {
      return 'DosingWeightShouldBeAdjustedWeight';
    }
  });
  this.creatinineClearance = ko.computed(function(){
    var sexScalar;
    switch(self.sex()) {
      case 'Female':
        sexScalar = 0.85;
        break;
      case 'Male':
        sexScalar = 1.00;
        break;
      default:
        return NaN;
    }
    return ( 140 - self.age() )
         * self.dosingWeight()
         / 72
         / Math.max(0.7,self.serumCreatinine());
  });
  this.displayCreatinineClearance = this.creatinineClearance.extend({numericGet: -1});

  // medication inputs
  this.medication = ko.observable(self.medications[0]);
  this.dose = ko.observable(560).extend({numericSet: doseDigits});
  this.interval = ko.observable(24).extend({numericSet: durationDigits});
  this.start = ko.observable('09:00').extend({momentSet: timeOfDayFormat});
  this.end = ko.observable('10:00').extend({momentSet: timeOfDayFormat});

  // computed from patient and medication inputs alone
  this.dosePerWeight = ko.computed(function(){
    return self.dose()/self.weight();
  });
  this.displayDosePerWeight = this.dosePerWeight.extend({numericGet: dosePerWeightDigits});
  this.dosePerIdealWeight = ko.computed(function(){
    return self.dose()/self.idealWeight();
  });
  this.displayDosePerIdealWeight = this.dosePerIdealWeight.extend({numericGet: dosePerWeightDigits});
  this.dosePerAdjustedWeight = ko.computed(function(){
    return self.dose()/self.adjustedWeight();
  });
  this.displayDosePerAdjustedWeight = this.dosePerAdjustedWeight.extend({numericGet: dosePerWeightDigits});
  this.dosePerDosingWeight = ko.computed(function(){
    return self.dose()/self.dosingWeight();
  });
  this.displayDosePerDosingWeight = this.dosePerDosingWeight.extend({numericGet: dosePerWeightDigits});
  this.levelFloor = ko.computed(function(){
    switch(self.medication()) {
      case 'Gentamicin':
      case 'Tobramycin':
        return 1;
      case 'Amikacin':
        return 4;
    }
  });
  this.displayLevelFloor = this.levelFloor.extend({numericGet: 0});

  // level inputs
  this.troughLevelTime = ko.observable('08:00').extend({momentSet: timeOfDayFormat});
  this.troughLevelValue = ko.observable(0.05).extend({numericSet: levelDigits, numericMinimum: 0.01});
  this.firstLevelTime = ko.observable('11:00').extend({momentSet: timeOfDayFormat});
  this.firstLevelValue = ko.observable(9).extend({numericSet: levelDigits});
  this.secondLevelTime = ko.observable('21:00').extend({momentSet: timeOfDayFormat});
  this.secondLevelValue = ko.observable(0.6).extend({numericSet: levelDigits});

  // pharmacokinetic parameters and intermediates
  this.volumeOfDistribution = ko.computed(function(){
    switch(self.mode()){
      case 'Initial':
        return self.inputVolumeOfDistribution();
      case 'Peak-Trough':
      case 'Zaske':
        return self.clearance()
             / self.firstOrderDispositionRate()
             / self.weight();
    }
  });
  this.displayVolumeOfDistribution = this.volumeOfDistribution.extend({numericGet: parameterDigits});
  this.infusionTimeInHours = ko.computed(function(){
    return hoursBetween(self.start,self.end);
  });
  this.displayInfusionTimeInHours = this.infusionTimeInHours.extend({numericGet: durationDigits});
  this.clearance = ko.computed(function(){
    switch(self.mode()){
      case 'Initial': // ((0.73*(CICR/DosingWeight)+0.06)*DosingWeight*0.06)
        return 0.0036*self.dosingWeight() + 0.0438*self.creatinineClearance();
      case 'Peak-Trough':
        return self.dose()
             * (1 - Math.exp(-self.firstOrderDispositionRate()*self.infusionTimeInHours()))
             * Math.exp(-self.firstOrderDispositionRate()*hoursBetween(self.end,self.firstLevelTime))
             / self.infusionTimeInHours()
             / self.firstLevelValue()
             / (1 - Math.exp(-self.firstOrderDispositionRate()*self.interval()))
      case 'Zaske':
        var troughToDoseInHours = hoursBetween(self.troughLevelTime,self.start);
        return self.dose()
             * (1 - Math.exp(-self.firstOrderDispositionRate()*self.infusionTimeInHours()))
             / self.infusionTimeInHours()
             / (self.calculatedPeak() - self.troughLevelValue()*Math.exp( -self.firstOrderDispositionRate()*(self.infusionTimeInHours() + troughToDoseInHours) ));
    }
  });
  this.displayClearance = this.clearance.extend({numericGet: parameterDigits});
  this.firstOrderDispositionRate = ko.computed(function(){
    switch(self.mode()){
      case 'Initial':
        return self.clearance()
             / self.volumeOfDistribution()
             / self.dosingWeight();
      case 'Peak-Trough':
        return Math.log(self.firstLevelValue()/self.troughLevelValue())
             / ( self.interval() - hoursBetween(self.troughLevelTime,self.firstLevelTime) ); // interval less time between trough and peak approximates time between peak and next trough.
      case 'Zaske':
        return Math.log(self.firstLevelValue()/self.secondLevelValue())
             / hoursBetween(self.firstLevelTime,self.secondLevelTime); // This assumes the first level is after the true peak.
    }
  });
  this.displayFirstOrderDispositionRate = this.firstOrderDispositionRate.extend({numericGet: parameterDigits});
  this.halflife = ko.computed(function(){
    return Math.log(2)
         / self.firstOrderDispositionRate();
  });
  this.displayHalflife = this.halflife.extend({numericGet: durationDigits});
  this.calculatedPeak = ko.computed(function(){
    return self.firstLevelValue()
         * Math.exp(self.firstOrderDispositionRate()*hoursBetween(self.end,self.firstLevelTime));
  });
  this.displayCalculatedPeak = this.calculatedPeak.extend({numericGet: levelDigits});
  this.calculatedTrough = ko.computed(function(){
    return self.calculatedPeak()
         * Math.exp( -self.firstOrderDispositionRate() * (self.interval() - hoursBetween(self.start,self.end)) );
  });
  this.displayCalculatedTrough = this.calculatedTrough.extend({numericGet: levelDigits});

  // dose & infusion determination inputs and computed
  this.desiredPeak = ko.observable(30).extend({numericSet: levelDigits});
  this.desiredTrough = ko.observable(0.5).extend({numericSet: levelDigits});
  this.newInfusionDuration = ko.observable(1).extend({numericSet: durationDigits});
  this.bestLoadingDose = ko.computed(function(){
    return self.desiredPeak()
         * self.clearance()
         * self.newInfusionDuration()
         / (1 - Math.exp(-self.firstOrderDispositionRate()*self.newInfusionDuration()));
  });
  this.displayBestLoadingDose = this.bestLoadingDose.extend({numericGet: doseDigits});
  this.bestLoadingDosePerWeight = ko.computed(function(){
    return self.bestLoadingDose()/self.weight();
  });
  this.displayBestLoadingDosePerWeight = this.bestLoadingDosePerWeight.extend({numericGet: dosePerWeightDigits});
  this.bestLoadingDosePerIdealWeight = ko.computed(function(){
    return self.bestLoadingDose()/self.idealWeight();
  });
  this.displayBestLoadingDosePerIdealWeight = this.bestLoadingDosePerIdealWeight.extend({numericGet: dosePerWeightDigits});
  this.bestLoadingDosePerAdjustedWeight = ko.computed(function(){
    return self.bestLoadingDose()/self.adjustedWeight();
  });
  this.displayBestLoadingDosePerAdjustedWeight = this.bestLoadingDosePerAdjustedWeight.extend({numericGet: dosePerWeightDigits});
  this.bestLoadingDosePerDosingWeight = ko.computed(function(){
    return self.bestLoadingDose()/self.dosingWeight();
  });
  this.displayBestLoadingDosePerDosingWeight = this.bestLoadingDosePerDosingWeight.extend({numericGet: dosePerWeightDigits});
  this.bestInterval = ko.computed(function(){
    return Math.log(self.desiredPeak()/self.desiredTrough())/self.firstOrderDispositionRate() + self.infusionTimeInHours();
  });
  this.displayBestInterval = this.bestInterval.extend({numericGet: durationDigits});
  this.newInterval = ko.observable(24).extend({numericSet: durationDigits});
  this.bestMaintenanceDose = ko.computed(function(){
    return self.bestLoadingDose()
         * (1 - Math.exp(-self.firstOrderDispositionRate()*self.newInterval()));
  });
  this.displayBestMaintenanceDose = this.bestMaintenanceDose.extend({numericGet: doseDigits});
  this.bestMaintenanceDosePerWeight = ko.computed(function(){
    return self.bestMaintenanceDose()/self.weight();
  });
  this.displayBestMaintenanceDosePerWeight = this.bestMaintenanceDosePerWeight.extend({numericGet: dosePerWeightDigits});
  this.bestMaintenanceDosePerIdealWeight = ko.computed(function(){
    return self.bestMaintenanceDose()/self.idealWeight();
  });
  this.displayBestMaintenanceDosePerIdealWeight = this.bestMaintenanceDosePerIdealWeight.extend({numericGet: dosePerWeightDigits});
  this.bestMaintenanceDosePerAdjustedWeight = ko.computed(function(){
    return self.bestMaintenanceDose()/self.adjustedWeight();
  });
  this.displayBestMaintenanceDosePerAdjustedWeight = this.bestMaintenanceDosePerAdjustedWeight.extend({numericGet: dosePerWeightDigits});
  this.bestMaintenanceDosePerDosingWeight = ko.computed(function(){
    return self.bestMaintenanceDose()/self.dosingWeight();
  });
  this.displayBestMaintenanceDosePerDosingWeight = this.bestMaintenanceDosePerDosingWeight.extend({numericGet: dosePerWeightDigits});

  // prediction inputs and computed
  this.hypotheticalDose = ko.observable(650).extend({numericSet: doseDigits});
  this.hypotheticalDosePerWeight = ko.computed(function(){
    return self.hypotheticalDose()/self.weight();
  });
  this.displayHypotheticalDosePerWeight = this.hypotheticalDosePerWeight.extend({numericGet: dosePerWeightDigits});
  this.hypotheticalDosePerIdealWeight = ko.computed(function(){
    return self.hypotheticalDose()/self.idealWeight();
  });
  this.displayHypotheticalDosePerIdealWeight = this.hypotheticalDosePerIdealWeight.extend({numericGet: dosePerWeightDigits});
  this.hypotheticalDosePerAdjustedWeight = ko.computed(function(){
    return self.hypotheticalDose()/self.adjustedWeight();
  });
  this.displayHypotheticalDosePerAdjustedWeight = this.hypotheticalDosePerAdjustedWeight.extend({numericGet: dosePerWeightDigits});
  this.hypotheticalDosePerDosingWeight = ko.computed(function(){
    return self.hypotheticalDose()/self.dosingWeight();
  });
  this.displayHypotheticalDosePerDosingWeight = this.hypotheticalDosePerDosingWeight.extend({numericGet: dosePerWeightDigits});
  this.hypotheticalInterval = ko.observable(24).extend({numericSet: durationDigits});
  this.predictedPeak = ko.computed(function(){
    return self.hypotheticalDose()*( 1 - Math.exp(-self.firstOrderDispositionRate()*self.newInfusionDuration() ) )
         / self.newInfusionDuration()
         / self.clearance()
         / ( 1 - Math.exp( -self.firstOrderDispositionRate()*self.hypotheticalInterval() ) );
  });
  this.displayPredictedPeak = this.predictedPeak.extend({numericGet: levelDigits});
  this.predictedTrough = ko.computed(function(){
    return self.predictedPeak()
         * Math.exp(-self.firstOrderDispositionRate()*(self.hypotheticalInterval() - self.newInfusionDuration()));
  });
  this.displayPredictedTrough = this.predictedTrough.extend({numericGet: levelDigits});
  this.predictedDurationUnderLevelFloor = ko.computed(function(){
    return self.hypotheticalInterval() - self.newInfusionDuration() - Math.log(self.predictedPeak()/self.levelFloor())/self.firstOrderDispositionRate();
  });
  this.displayPredictedDurationUnderLevelFloor = this.predictedDurationUnderLevelFloor.extend({numericGet: levelDigits});

  // UI-specific
  this.bodyClasses = ko.computed(function(){
    return [ self.mode().replace(/[- &]/g,'') + 'Mode', self.dosingWeightStatus() ].join(' ');
  });

  // hash module
  (function() {
    function invertObject(original) {
      var inverted = {};
      for( var property in original ) {
        if( original.hasOwnProperty( property ) ) {
          if( inverted.hasOwnProperty( original[property] ) )
            throw 'invertObject() called on non-invertible object; repeated value was "' + original[property] + '"';
          inverted[original[property]] = property;
        }
      }
      return inverted;
    }

    var valueBindingPartPrefix = 'value: ';
    var partSeparator = '&';
    var keyValueSeparator = '=';
    var abbreviations = {
                          mode: 'm',
                          age: 'a',
                          sex: 'sx', // avoiding 'sex' to dodge angering work filters
                          height: 'h',
                          weight: 'w',
                          dosingWeight: 'dw',
                          serumCreatinine: 'SCr',
                          inputVolumeOfDistribution: 'Vd',
                          medication: 'med',
                          dose: 'd',
                          interval: 'i',
                          start: 's',
                          end: 'e',
                          troughLevelTime: 'tt',
                          troughLevelValue: 'tv',
                          firstLevelTime: '1t',
                          firstLevelValue: '1v',
                          secondLevelTime: '2t',
                          secondLevelValue: '2v',
                          desiredPeak: 'dp',
                          desiredTrough: 'dt',
                          newInfusionDuration: 'nit',
                          newInterval: 'ni',
                          hypotheticalDose: 'hd',
                          hypotheticalInterval: 'hi',
                          Initial: 'I',
                          'Peak-Trough': 'PT',
                          Zaske: 'Z',
                          Female: 'F',
                          Male: 'M',
                          Gentamicin: 'G',
                          Tobramycin: 'T',
                          Amikacin: 'A'
                        };
    var abbreviationsInverted = invertObject(abbreviations);

    var _artificialDependencyForHash = ko.observable();
    self.forceHashRefresh = function(){
      _artificialDependencyForHash.notifySubscribers();
    };

    self.hash = ko.computed({
      read: function(){
        var unused = self.bodyClasses(); // establish indirect dependency
        unused = _artificialDependencyForHash(); // allow forced refreshes

        var visibleBindings = $('input, select, textarea','#ValueBlocks').filter(':visible')
                                                                         .map(function(){
                                                                                return $(this).attr('data-bind'); // .data('bind') would attempt to convert
                                                                              })
                                                                         .get();
        var boundValues = visibleBindings.map(function(binding){
                                                var valueParts = binding.split(',')
                                                                        .map(function(bindingPart) {
                                                                               return bindingPart.trim();
                                                                             })
                                                                        .filter(function(bindingPart) {
                                                                                  return bindingPart.startsWith(valueBindingPartPrefix);
                                                                                });
                                                switch(valueParts.length) {
                                                  case 0:
                                                    throw 'no value parts in data-bind attribute';
                                                  case 1:
                                                    return valueParts[0].substr(valueBindingPartPrefix.length);
                                                  default:
                                                    throw 'multiple value parts in data-bind attribute { "' + valueParts.join('", "') + '" }';
                                                }
                                              });

        var hash = boundValues.map(function(boundValueString) {
                                      var shortName = abbreviations[boundValueString] || boundValueString;
                                      var value = ko.utils.unwrapObservable(self[boundValueString]);
                                      var shortValue = abbreviations[value] || value;
                                      return shortName + keyValueSeparator + shortValue;
                                   })
                              .join(partSeparator);
        return hash;
      },
      write: function(updatedValue){
        var cleanValue = updatedValue.startsWith('#') ? updatedValue.substr(1) : updatedValue;
        var hashParts = cleanValue.split(partSeparator);
        if(hashParts.length == 1 && hashParts[0].length == 0 )
          return;
        for(var hashPartIndex in hashParts) {
          var hashPart = hashParts[hashPartIndex];
          var hashPartParts = hashPart.split(keyValueSeparator);
          if(hashPartParts.length == 2) {
            var key = abbreviationsInverted[hashPartParts[0]] || hashPartParts[0];
            var value = abbreviationsInverted[hashPartParts[1]] || hashPartParts[1];
            self[key](value);
          }
          else {
            console.log('Could not parse hash part "' + hashPart + '"');
          }
        }
      }
      });
    self.displayHash = ko.computed(function(){
      return self.hash().split('&').join('&amp;&#8203;'); // zero-width space
    });
  })();
}