angular.module('attendanceApp', ['ngRoute'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/login.html',
        controller: 'LoginController'
      })
      .when('/dashboard', {
        templateUrl: 'partials/dashboard.html',
        controller: 'DashboardController'
      })
      .when('/admin', {
        templateUrl: 'partials/admin.html',
        controller: 'AdminController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
