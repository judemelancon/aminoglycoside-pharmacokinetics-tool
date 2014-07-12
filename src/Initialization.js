// Licensing details are in the source of the HTML file.
$(document).ready(function() {
  $('input, select, textarea').after(function(){
                                       var dataBindValue = $(this).attr('data-bind')
                                                                  .replace('value', 'text')
                                                                  .replace(/options[:] \w+[,] /, '');
                                       return '<span class="InputPrint" data-bind="' + dataBindValue + '"></span>';
                                     });

  var viewModel = new AminoglycosidePharmacokineticsViewModel();
  hasher.changed.add(viewModel.hash);
  hasher.initialized.add(viewModel.hash);
  hasher.init();
  ko.applyBindings(viewModel);
  viewModel.hash.subscribe(function(value) {
                             hasher.changed.active = false;
                             hasher.setHash(value);
                             hasher.changed.active = true;
                             $('#QRCode').qrcode({
                                                    render: 'canvas',
                                                    width: 200,
                                                    height: 200,
                                                    text: window.location.href
                                                 });
                           });
  viewModel.forceHashRefresh();

  $('input, select, textarea').addClass('Untouched')
                              .on('blur.TouchTracking change.TouchTracking keypress.TouchTracking paste.TouchTracking',
                                   function() {
                                     $(this).removeClass('Untouched')
                                            .off('blur.TouchTracking change.TouchTracking keypress.TouchTracking paste.TouchTracking');
                                   });

  $('input.TimeInput').timepicker({
                                     timeFormat: 'HH:mm',
                                     timeOnlyTitle: '',
                                     showTime: false,
                                     currentText: '',
                                     hourGrid: 2,
                                     minuteGrid: 5,
                                     beforeShow: function(input,inst) {
                                                   setTimeout(function () { // override default by executing after
                                                     inst.dpDiv.position({
                                                                            my: 'center top',
                                                                            at: 'center bottom+3px',
                                                                            of: input,
                                                                            collision: 'fit flipfit'
                                                     });
                                                   });
                                                 }
                                  });
});