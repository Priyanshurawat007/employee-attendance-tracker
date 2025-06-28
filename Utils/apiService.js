angular.module("attendanceApp").factory("apiService", function($http) {
  return {
    getAll: () => $http.get("/api/employees").then(res => res.data),
    findByUsername: (uname) => $http.get(`/api/employees/${uname}`).then(res => res.data),
    login: (uname, pwd) => $http.post(`/api/employees/login`, { username: uname, password: pwd }).then(res => res.data),
    logout: () => {},
    setCurrentUser: () => {},
    getCurrentUser: () => {},
    addEmployee: (emp) => $http.post("/api/employees", emp).then(res => res.data),
    update: (emp) => $http.put(`/api/employees/${emp.username}`, emp).then(res => res.data),
    deleteRecords: (uname) => $http.put(`/api/employees/${uname}/records`, {}).then(res => res.data),
    deleteEmployeeRecords: (uname) => $http.put(`/api/employees/${uname}/all`, {}).then(res => res.data),
    addLeaveRequest: (username, leave) => $http.post(`/api/employees/${username}/leave`, leave).then(res => res.data),
    getLeaveRequests: () => $http.get(`/api/employees/leaves`).then(res => res.data),
    updateLeaveStatus: (username, index, status) =>$http.put(`/api/employees/${username}/leave/${index}`, { status }).then(res => res.data),
    clearAllRecords: () => $http.post(`/api/employees/clearAll`).then(res => res.data)
  };
});
