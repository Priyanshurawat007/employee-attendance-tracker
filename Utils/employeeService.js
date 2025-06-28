
angular.module("attendanceApp").factory("employeeService", function () {
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
    },
  ];

  let employeeData = (() => {
    try {
      const stored = localStorage.getItem("employeeData");
      return stored ? JSON.parse(stored) : fallbackData;
    } catch {
      return fallbackData;
    }
  })();

  function save() {
    localStorage.setItem("employeeData", JSON.stringify(employeeData));
  }

  return {
    getAll: () => employeeData,

    findByUsername: function (uname) {
      return _.findWhere(employeeData, { username: uname.toLowerCase() });
    },

    login: function (uname, pwd) {
      const user = _.findWhere(employeeData, { username: uname.toLowerCase() });
      return user && user.password === pwd ? user : null;
    },

    setCurrentUser: function (user) {
      localStorage.setItem("loggedInUser", JSON.stringify(user));
    },

    getCurrentUser: function () {
      try {
        return JSON.parse(localStorage.getItem("loggedInUser")) || null;
      } catch {
        return null;
      }
    },

    logout: function () {
      localStorage.removeItem("loggedInUser");
    },

    update: function (emp) {
      const index = _.findIndex(employeeData, { username: emp.username });
      if (index !== -1) {
        employeeData[index] = JSON.parse(JSON.stringify(emp));
        save();
      }
    },

    clearAllRecords: function () {
      employeeData.forEach(emp => emp.records = {});
      save();
    },

    addEmployee: function (emp) {
      if (_.findWhere(employeeData, { username: emp.username })) return false;
      emp.leaveRequests = [];
      employeeData.push(emp);
      save();
      return true;
    },

    deleteRecords: function (uname) {
      const emp = _.findWhere(employeeData, { username: uname });
      if (emp) {
        emp.records = {};
        save();
      }
    },

    deleteEmployeeRecords: function (uname) {
      const emp = _.findWhere(employeeData, { username: uname });
      if (emp) {
        emp.records = {};
        emp.leaveRequests = [];
        save();
      }
    },

    addLeaveRequest: function (username, leave) {
      const emp = employeeData.find(e => e.username === username);
      if (!emp.leaveRequests) emp.leaveRequests = [];
      emp.leaveRequests.push(leave);
      save();
    },

    getLeaveRequests: function () {
      return employeeData.flatMap(emp =>
        (emp.leaveRequests || []).map((req, index) => ({
          ...req,
          index: index,
          name: emp.name,
          username: emp.username,
          role: emp.role
        }))
      );
    },

  updateLeaveStatus: function (username, leaveMeta, status) {
  const emp = this.findByUsername(username);
  if (!emp || !emp.leaveRequests) return;

  const req = emp.leaveRequests.find(lr =>
    lr.date === leaveMeta.date &&
    lr.appliedAt === leaveMeta.appliedAt &&
    lr.type === leaveMeta.type &&
    lr.reason === leaveMeta.reason
  );

  if (req) {
    req.status = status;
    this.update(emp);
  }
}

  };
});