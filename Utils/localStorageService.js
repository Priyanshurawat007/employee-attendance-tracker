angular.module("attendanceApp").factory("localStorageService", function () {
  const fallbackData = [
    {
      username: "john",
      name: "John Doe",
      password: "1234",
      role: "employee",
      records: {},
      leaves: { casual: 5, sick: 2 },
      leaveRequests: []
    },
    {
      username: "emma",
      name: "Emma Watson",
      password: "abcd",
      role: "employee",
      records: {},
      leaves: { casual: 4, sick: 1 },
      leaveRequests: []
    },
    {
      username: "admin",
      name: "Admin User",
      password: "admin123",
      role: "admin",
      records: {},
      leaves: { casual: 4, sick: 0 },
      leaveRequests: []
    }
  ];

  let employeeData = (() => {
    try {
      const stored = localStorage.getItem("employeeData");
      if (stored) {
        return JSON.parse(stored);
      } else {
        localStorage.setItem("employeeData", JSON.stringify(fallbackData));
        return fallbackData;
      }
    } catch {
      localStorage.setItem("employeeData", JSON.stringify(fallbackData));
      return fallbackData;
    }
  })();

  function save() {
    localStorage.setItem("employeeData", JSON.stringify(employeeData));
  }

  return {
    getAll: () => Promise.resolve(employeeData),

    findByUsername: (uname) =>
      Promise.resolve(_.findWhere(employeeData, { username: uname.toLowerCase() })),

    login: (uname, pwd) => {
      const user = _.findWhere(employeeData, { username: uname.toLowerCase() });
      return Promise.resolve(user && user.password === pwd ? user : null);
    },

    setCurrentUser: (user) =>
      localStorage.setItem("loggedInUser", JSON.stringify(user)),

    getCurrentUser: () => {
      try {
        return JSON.parse(localStorage.getItem("loggedInUser")) || null;
      } catch {
        return null;
      }
    },

    logout: () => localStorage.removeItem("loggedInUser"),

    update: (emp) => {
      const index = _.findIndex(employeeData, { username: emp.username });
      if (index !== -1) {
        employeeData[index] = JSON.parse(JSON.stringify(emp)); // Deep clone
        save();
      }
      return Promise.resolve(true);
    },

    clearAllRecords: () => {
      employeeData.forEach(emp => emp.records = {});
      save();
      return Promise.resolve(true);
    },

    addEmployee: (emp) => {
      if (_.findWhere(employeeData, { username: emp.username })) {
        return Promise.resolve(false);
      }
      emp.leaveRequests = [];
      employeeData.push(emp);
      save();
      return Promise.resolve(true);
    },

    deleteRecords: (uname) => {
      const emp = _.findWhere(employeeData, { username: uname });
      if (emp) {
        emp.records = {};
        save();
      }
      return Promise.resolve(true);
    },

    deleteEmployeeRecords: (uname) => {
      const emp = _.findWhere(employeeData, { username: uname });
      if (emp) {
        emp.records = {};
        emp.leaveRequests = [];
        save();
      }
      return Promise.resolve(true);
    },

    addLeaveRequest: (username, leave) => {
      const emp = employeeData.find(e => e.username === username);
      if (!emp.leaveRequests) emp.leaveRequests = [];
      emp.leaveRequests.push(leave);
      save();
      return Promise.resolve(true);
    },

    getLeaveRequests: () => {
      return Promise.resolve(
        employeeData.flatMap(emp =>
          (emp.leaveRequests || []).map((req, index) => ({
            ...req,
            index,
            name: emp.name,
            username: emp.username,
            role: emp.role
          }))
        )
      );
    },

    updateLeaveStatus: (username, leaveMeta, status) => {
      const emp = employeeData.find(e => e.username === username);
      if (!emp || !emp.leaveRequests) return Promise.resolve(false);

      const req = emp.leaveRequests.find(lr =>
        lr.date === leaveMeta.date &&
        lr.appliedAt === leaveMeta.appliedAt &&
        lr.type === leaveMeta.type &&
        lr.reason === leaveMeta.reason
      );

      if (req) {
        req.status = status;
        save();
        return Promise.resolve(true);
      }

      return Promise.resolve(false);
    }
  };
});
