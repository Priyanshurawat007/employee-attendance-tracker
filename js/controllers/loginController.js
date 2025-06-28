angular.module('attendanceApp')
  .controller('LoginController', function ($scope, $location, employeeDataService) {

    $('#logout').hide();

    $scope.username = '';
    $scope.password = '';
    $scope.error = '';

    $scope.login = function () {
      employeeDataService.login($scope.username, $scope.password).then(function (user) {
        if (user) {
          employeeDataService.setCurrentUser(user);
          $location.path(user.role === 'admin' ? '/admin' : '/dashboard');
        } else {
          $scope.error = 'Invalid credentials';
        }
      });
    };

    $scope.adminView = function () {
      const user = employeeDataService.getCurrentUser();
      if (user?.role === 'admin') {
        $location.path('/admin');
      } else {
        alert('Admin access only');
      }
    };
  });
