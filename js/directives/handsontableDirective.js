angular.module('attendanceApp')
  .directive('hotTable', function () {
    return {
      restrict: 'E',
      scope: {
        settings: '='
      },
      link: function (scope, element) {
        const container = document.createElement('div');
        element[0].appendChild(container);
        let hot;

        scope.$watch('settings', function (newSettings) {
          if (newSettings && newSettings.data) {
           
            if (!newSettings.licenseKey) {
              newSettings.licenseKey = 'non-commercial-and-evaluation';
            }

            if (!hot) {
              hot = new Handsontable(container, newSettings);
            } else {
              hot.updateSettings(newSettings);
            }
          }
        }, true);
      }
    };
  });

  