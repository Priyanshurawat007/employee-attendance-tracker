angular.module("attendanceApp").factory("employeeDataService", function(dataService) {
  return {
    getAll: () => dataService.getAll(),
    findByUsername: (u) => dataService.findByUsername(u),
    login: (u, p) => dataService.login(u, p),
    logout: () => dataService.logout(),
    setCurrentUser: (u) => dataService.setCurrentUser(u),
    getCurrentUser: () => dataService.getCurrentUser(),
    update: (emp) => dataService.update(emp),
    addEmployee: (emp) => dataService.addEmployee(emp),
    deleteEmployeeRecords: (uname) => dataService.deleteEmployeeRecords(uname),
    clearAllRecords: () => dataService.clearAllRecords(),
    addLeaveRequest: (u, l) => dataService.addLeaveRequest(u, l),
    getLeaveRequests: () => dataService.getLeaveRequests(),
    updateLeaveStatus: (u, meta, s) => dataService.updateLeaveStatus(u, meta, s)
  };
});
