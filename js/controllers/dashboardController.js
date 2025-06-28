angular.module('attendanceApp')
.controller('DashboardController', function ($scope, $location, employeeDataService) {
  $('#logout').show();

  const current = employeeDataService.getCurrentUser();
  if (!current || !current.username) {
    return $location.path('/');
  }

  $scope.employee = null;
  $scope.summaryDateObj = new Date();
  $scope.summaryDate = moment().format("YYYY-MM-DD");
  $scope.calendarDays = [];
  $scope.todaysLog = '';
  $scope.buttonStates = {};
  $scope.showLeaveModal = false;
  $scope.leaveForm = { date: '', type: '', reason: '' };

  // Step 1: Load employee record
  employeeDataService.findByUsername(current.username).then(emp => {
    if (!emp || emp.role === 'admin') {
      return $location.path('/');
    }

    $scope.employee = emp;
    initializeDashboard();
    $scope.$applyAsync();
    console.log("Logged in as:", current.username);
  });

  function initializeDashboard() {
  $scope.updateSummary($scope.summaryDateObj);
  $scope.generateCalendarData();
  $scope.updateButtonStates();
  renderInsights();
  renderBarChart(); // 🔥 Add this line
}

  function recordFor(dateStr) {
    return $scope.employee?.records?.[dateStr] || {};
  }

  $scope.updateSummary = function (dateObj) {
 $scope.summaryDate = new Date(dateObj); 
$scope.summaryDateObj = new Date(dateObj);

const dateStr = moment($scope.summaryDate).format("YYYY-MM-DD");

  const record = recordFor(dateStr);
  if (!record.checkIn) {
    $scope.todaysLog = `No attendance for ${dateStr}`;
  } else {
    $scope.todaysLog = `Check-in: ${moment(record.checkIn).format("LT")}\n` +
      (record.breakStart ? `Break Start: ${moment(record.breakStart).format("LT")}\n` : '') +
      (record.breakEnd ? `Break End: ${moment(record.breakEnd).format("LT")}\n` : '') +
      (record.checkOut ? `Check-out: ${moment(record.checkOut).format("LT")}\n` : '') +
      (record.hoursWorked ? `Hours Worked: ${parseFloat(record.hoursWorked).toFixed(2)} hrs` : '');
  }
};

$scope.selectCalendarDate = function (dateStr) {
  const date = new Date(dateStr);
  $scope.updateSummary(date);
};



  $scope.generateCalendarData = function () {
    const year = $scope.summaryDateObj.getFullYear();
    const month = $scope.summaryDateObj.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const records = $scope.employee.records || {};

    $scope.calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      $scope.calendarDays.push(null);
    }

    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPresent = !!records[dateStr]?.checkIn;
      $scope.calendarDays.push({ day: d, dateStr, isPresent });
    }
    $scope.$applyAsync();
  };

  $scope.updateButtonStates = function () {
    const todayStr = moment().format("YYYY-MM-DD");
    const record = recordFor(todayStr);
    $scope.buttonStates = {
      checkIn: !!record.checkIn,
      breakStart: !!record.breakStart,
      breakEnd: !!record.breakEnd,
      checkOut: !!record.checkOut,
    };
  };

  function renderInsights() {
    const records = $scope.employee.records || {};
    const dates = Object.keys(records);

    const total = _.reduce(dates, (sum, d) =>
      sum + parseFloat(records[d].hoursWorked || 0), 0
    );
    const avg = total / (dates.length || 1);
    const leaves = $scope.employee.leaves || { casual: 0, sick: 0 };

    $scope.totalWorkHours = `${total.toFixed(2)} hrs`;
    $scope.avgWorkHours = `${avg.toFixed(2)} hrs`;
    $scope.attendanceDays = dates.length;
    $scope.casualLeaves = leaves.casual;
    $scope.sickLeaves = leaves.sick;
    $scope.$applyAsync();
  }

  function renderBarChart() {
  const ctx = document.getElementById("attendanceChart").getContext("2d");
  const today = moment();
  const records = $scope.employee.records || {};

  const labels = [];
  const totalHours = [];
  const overtimeHours = [];

  for (let i = 6; i >= 0; i--) {
    const date = today.clone().subtract(i, 'days');
    const dateStr = date.format('YYYY-MM-DD');
    const label = date.format('ddd');

    const rec = records[dateStr] || {};
    const hrs = parseFloat(rec.hoursWorked || 0);
    const overtime = hrs > 9 ? hrs - 9 : 0;

    labels.push(label);
    totalHours.push(hrs);
    overtimeHours.push(overtime);
  }

  if (window.attendanceChartInstance) {
    window.attendanceChartInstance.destroy();
  }

  window.attendanceChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Hours',
          data: totalHours,
          backgroundColor: 'rgba(0, 123, 255, 0.7)',
        },
        {
          label: 'Overtime (>9 hrs)',
          data: overtimeHours,
          backgroundColor: 'rgba(0, 82, 204, 0.9)',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'Work Hours (Last 7 Days)',
          color: '#004080',
          font: { size: 18 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours',
            color: '#007bff'
          },
          ticks: { color: '#004080' }
        },
        x: { ticks: { color: '#004080' } }
      }
    }
  });
}


  // Attendance actions
  $scope.checkIn = function () {
    const today = moment().format("YYYY-MM-DD");
    if (!$scope.employee.records[today]) $scope.employee.records[today] = {};
    $scope.employee.records[today].checkIn = new Date();
    employeeDataService.update($scope.employee).then(() => {
      $scope.updateButtonStates();
      $scope.updateSummary(new Date());
      renderInsights();
      $scope.showToast("Checked in successfully.");
    });
  };

  $scope.breakStart = function () {
    const today = moment().format("YYYY-MM-DD");
    $scope.employee.records[today].breakStart = new Date();
    employeeDataService.update($scope.employee).then(() => {
      $scope.updateButtonStates();
      $scope.showToast("Break started.");
    });
  };

  $scope.breakEnd = function () {
    const today = moment().format("YYYY-MM-DD");
    $scope.employee.records[today].breakEnd = new Date();
    employeeDataService.update($scope.employee).then(() => {
      $scope.updateButtonStates();
      $scope.showToast("Break ended.");
    });
  };

  $scope.checkOut = function () {
    const today = moment().format("YYYY-MM-DD");
    const record = $scope.employee.records[today];
    record.checkOut = new Date();

    const checkIn = moment(record.checkIn);
    const breakStart = record.breakStart ? moment(record.breakStart) : null;
    const breakEnd = record.breakEnd ? moment(record.breakEnd) : null;
    const checkOut = moment(record.checkOut);

    let duration = moment.duration(checkOut.diff(checkIn)).asHours();
    if (breakStart && breakEnd) {
      duration -= moment.duration(breakEnd.diff(breakStart)).asHours();
    }
    record.hoursWorked = duration;

    employeeDataService.update($scope.employee).then(() => {
      $scope.updateButtonStates();
      $scope.updateSummary(new Date());
      renderInsights();
      $scope.showToast("Checked out successfully.");
    });
  };

  // Leave Modal
  $scope.openLeaveModal = function () {
    $scope.showLeaveModal = true;
    $scope.leaveForm = { date: '', type: '', reason: '' };
  };

  $scope.closeLeaveModal = function () {
    $scope.showLeaveModal = false;
  };

  $scope.submitLeave = function () {
    if (!$scope.leaveForm.date || !$scope.leaveForm.type || !$scope.leaveForm.reason) {
      alert("All fields are required");
      return;
    }

    const leave = {
      date: $scope.leaveForm.date,
      type: $scope.leaveForm.type,
      reason: $scope.leaveForm.reason,
      status: "Pending",
      appliedAt: new Date()
    };

    employeeDataService.addLeaveRequest($scope.employee.username, leave).then(() => {
      $scope.showToast("Leave request submitted.");
      $scope.closeLeaveModal();
    });
  };

  $scope.logout = function () {
    employeeDataService.logout();
    $location.path('/');
  };

  $scope.showToast = function (message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  };
});
