angular.module("attendanceApp").controller("MainController", function($scope, $location, employeeDataService) {
  const user = employeeDataService.getCurrentUser();
  $scope.isLoggedIn = !!(user && user.username);

  $scope.logout = function () {
    employeeDataService.logout();
    $scope.isLoggedIn = false;
    $location.path("/");
  };
});
