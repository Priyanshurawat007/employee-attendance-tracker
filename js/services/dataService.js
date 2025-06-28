angular.module("attendanceApp").factory("dataService", function ($http) {

  const useBackend = false; // switch between backend and localStorage

  // Load initial local data or set fallback
  let fallbackData = JSON.parse(localStorage.getItem("employeeData") || "null") || [
    {
      username: "john",
      name: "John Doe",
      password: "1234",
      role: "employee",
      records: {},
      leaves: { casual: 4, sick: 2 },
      leaveRequests: []
    },
    {
      username: "admin",
      name: "Admin",
      password: "admin123",
      role: "admin",
      records: {},
      leaves: { casual: 0, sick: 0 },
      leaveRequests: []
    }
  ];

  function saveToLocal() {
    localStorage.setItem("employeeData", JSON.stringify(fallbackData));
  }

  return {
    getAll: function () {
      return useBackend
        ? $http.get("/api/employees").then(res => res.data)
        : Promise.resolve(fallbackData);
    },

    findByUsername: function (username) {
      if (useBackend) {
        return $http.get(`/api/employees/${username}`).then(res => res.data);
      } else {
        const user = fallbackData.find(e => e.username === username);
        return Promise.resolve(user);
      }
    },

    login: function (username, password) {
      if (useBackend) {
        return $http.post("/api/employees/login", { username, password }).then(res => res.data);
      } else {
        const user = fallbackData.find(
          e => e.username === username && e.password === password
        );
        return Promise.resolve(user || null);
      }
    },

    addEmployee: function (emp) {
      if (useBackend) {
        return $http.post("/api/employees", emp).then(res => res.data);
      } else {
        if (fallbackData.find(e => e.username === emp.username)) {
          return Promise.resolve(false);
        }
        emp.records = {};
        emp.leaveRequests = [];
        fallbackData.push(emp);
        saveToLocal();
        return Promise.resolve(true);
      }
    },

    update: function (emp) {
      if (useBackend) {
        return $http.put(`/api/employees/${emp.username}`, emp).then(res => res.data);
      } else {
        const index = fallbackData.findIndex(e => e.username === emp.username);
        if (index !== -1) {
          fallbackData[index] = emp;
          saveToLocal();
        }
        return Promise.resolve(true);
      }
    },

    clearAllRecords: function () {
      if (useBackend) {
        return $http.post("/api/employees/clearAll").then(res => res.data);
      } else {
        fallbackData.forEach(emp => emp.records = {});
        saveToLocal();
        return Promise.resolve(true);
      }
    },

    deleteEmployeeRecords: function (username) {
      if (useBackend) {
        return $http.put(`/api/employees/${username}/all`, {}).then(res => res.data);
      } else {
        const emp = fallbackData.find(e => e.username === username);
        if (emp) {
          emp.records = {};
          emp.leaveRequests = [];
          saveToLocal();
        }
        return Promise.resolve(true);
      }
    },

    addLeaveRequest: function (username, leave) {
      if (useBackend) {
        return $http.post(`/api/employees/${username}/leave`, leave).then(res => res.data);
      } else {
        const emp = fallbackData.find(e => e.username === username);
        if (emp) {
          emp.leaveRequests = emp.leaveRequests || [];
          emp.leaveRequests.push(leave);
          saveToLocal();
        }
        return Promise.resolve(true);
      }
    },

    getLeaveRequests: function () {
      if (useBackend) {
        return $http.get(`/api/employees/leaves`).then(res => res.data);
      } else {
        const all = fallbackData.flatMap(emp =>
          (emp.leaveRequests || []).map((lr, i) => ({
            ...lr,
            index: i,
            name: emp.name,
            username: emp.username,
            role: emp.role
          }))
        );
        return Promise.resolve(all);
      }
    },

    updateLeaveStatus: function (username, leaveMeta, status) {
      if (useBackend) {
        return $http.put(`/api/employees/${username}/leave/${leaveMeta.index}`, { status }).then(res => res.data);
      } else {
        const emp = fallbackData.find(e => e.username === username);
        if (emp && emp.leaveRequests) {
          const req = emp.leaveRequests.find(lr =>
            lr.date === leaveMeta.date &&
            lr.appliedAt === leaveMeta.appliedAt &&
            lr.type === leaveMeta.type &&
            lr.reason === leaveMeta.reason
          );
          if (req) {
            req.status = status;
            saveToLocal();
          }
        }
        return Promise.resolve(true);
      }
    },

    logout: () => Promise.resolve(localStorage.removeItem("loggedInUser")),

    setCurrentUser: (user) => localStorage.setItem("loggedInUser", JSON.stringify(user)),

    getCurrentUser: () => {
      try {
        return JSON.parse(localStorage.getItem("loggedInUser")) || null;
      } catch {
        return null;
      }
    }
  };
});

