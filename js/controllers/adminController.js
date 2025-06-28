angular.module('attendanceApp')
  .controller('AdminController', function ($scope, $location, employeeDataService, $timeout) {
    $('#logout').show();
    $scope.isLoggedIn = false;
    $scope.showModal = false;
    $scope.adminDate = new Date();
    $scope.adminCalendar = { days: [], selected: '', startOffset: 0 };

    $scope.newEmployee = {
      username: '',
      name: '',
      password: '',
      role: 'employee',
      records: {},
      leaves: { casual: 0, sick: 0 }
    };

    $timeout(() => {
      const user = employeeDataService.getCurrentUser();
      if (!user || user.role !== 'admin') {
        $location.path('/');
        return;
      }

      $scope.isLoggedIn = true;
      $scope.updateDashboard();
      $scope.generateCalendar();
      $scope.$applyAsync();
    });

    $scope.openAddModal = () => { $scope.showModal = true; };
    $scope.closeAddModal = () => {
      $scope.showModal = false;
      $scope.newEmployee = {
        username: '',
        name: '',
        password: '',
        role: 'employee',
        records: {},
        leaves: { casual: 0, sick: 0 }
      };
    };

    $scope.addEmployee = function () {
      if (!$scope.newEmployee.username || !$scope.newEmployee.name || !$scope.newEmployee.password || !$scope.newEmployee.role) {
        alert("All fields required");
        return;
      }

      $scope.newEmployee.username = $scope.newEmployee.username.toLowerCase();
      const copy = angular.copy($scope.newEmployee);

      Promise.resolve(employeeDataService.addEmployee(copy)).then(success => {
        if (success) {
          alert('Employee added');
          $scope.closeAddModal();
          $scope.updateDashboard();
        } else {
          alert('Username already exists');
        }
      });
    };

    $scope.clearAllRecords = function () {
      if (confirm('Clear all records?')) {
        Promise.resolve(employeeDataService.clearAllRecords()).then(() => {
          $scope.updateDashboard();
        });
      }
    };

    $scope.deleteEmployeeRecords = function (username) {
      if (confirm("Delete records for this user?")) {
        Promise.resolve(employeeDataService.deleteEmployeeRecords(username)).then(() => {
          $scope.updateDashboard();
        });
      }
    };

    $scope.viewEmployeeDetails = function (username) {
      $location.path('/dashboard').search({ user: username });
    };

    $scope.changeDate = function () {
      if (!($scope.adminDate instanceof Date)) {
        $scope.adminDate = new Date($scope.adminDate);
      }
      $scope.updateDashboard();
      $scope.generateCalendar();
    };

    $scope.selectAdminDate = function (dateStr) {
      $scope.adminDate = new Date(dateStr);
      $scope.adminCalendar.selected = dateStr;
      $scope.updateDashboard();
    };

    $scope.generateCalendar = function () {
      const selectedDate = $scope.adminDate;
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const lastDay = new Date(year, month + 1, 0).getDate();

      Promise.resolve(employeeDataService.getAll()).then(employees => {
        const dayList = [];

        for (let d = 1; d <= lastDay; d++) {
          const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          let isPresent = false;
          for (let emp of employees) {
            if (emp.records?.[fullDate]?.checkIn) {
              isPresent = true;
              break;
            }
          }
          dayList.push({ day: d, full: fullDate, present: isPresent });
        }

        $scope.adminCalendar.days = dayList;
        $scope.adminCalendar.startOffset = firstDay;
        $scope.adminCalendar.selected = moment($scope.adminDate).format('YYYY-MM-DD');
         $scope.$applyAsync();
      });
      $scope.$applyAsync();
    };

    $scope.updateDashboard = function () {
      Promise.resolve(employeeDataService.getAll()).then(employees => {
        const dateStr = moment($scope.adminDate).format('YYYY-MM-DD');
        $scope.updateLeaveTable();

        $scope.totalEmployees = employees.length;
        $scope.totalAdmins = _.filter(employees, { role: 'admin' }).length;
        $scope.totalManagers = _.filter(employees, { role: 'manager' }).length;

        const data = employees.map(emp => {
          const rec = emp.records?.[dateStr] || {};
          const isPresent = !!rec.checkIn;
          const checkInTime = rec.checkIn ? moment(rec.checkIn).format('LT') : '-';
          const checkOutTime = rec.checkOut ? moment(rec.checkOut).format('LT') : '-';
          const hoursWorked = parseFloat(rec.hoursWorked) || 0;
          const totalDaysPresent = Object.values(emp.records || {}).filter(r => r.checkIn).length;

          return [
            emp.name,
            emp.username,
            emp.role,
            isPresent ? '✔ Present' : '✖ Absent',
            checkInTime,
            checkOutTime,
            hoursWorked.toFixed(2) + ' hrs',
            totalDaysPresent
          ];
        });
        

        $scope.hotSettings = {
          data,
          colHeaders: [
            'Name', 'Username', 'Role', 'Status',
            'Check-in', 'Check-out', 'Hours Worked', 'Present Days'
          ],
          stretchH: 'all',
          readOnly: true,
          rowHeaders: true,
          height: '600px',
          width: '100%',
          className: 'htCenter htMiddle',
          licenseKey: 'non-commercial-and-evaluation',
          colWidths: [170, 170, 140, 140, 150, 150, 160, 150],
          rowHeights: 50,
          renderer: 'text',
          cells: function () {
            return {
              renderer: function (instance, td, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                td.style.background = 'rgba(15, 128, 241, 0.1)';
                td.style.border = '1.5px solid black';
                td.style.color = 'black';
                td.style.fontWeight = '500';
                td.style.fontSize = '16px';
                td.style.padding = '12px';
              }
            };
          }
        };
       
      });
      
    };

    $scope.updateLeaveTable = function () {
      Promise.resolve(employeeDataService.getLeaveRequests()).then(leaveRequests => {
        const renderData = () => leaveRequests.map((req) => [
          req.name,
          req.username,
          req.role,
          moment(req.date).format('YYYY-MM-DD'),
          req.type,
          req.reason,
          req.status,
          moment(req.appliedAt).format('YYYY-MM-DD HH:mm'),
          req.status === 'Pending' ? 'Approve' : 'Approved'
        ]);

        $scope.leaveTableSettings = {
          data: renderData(),
          colHeaders: [
            'Name', 'Username', 'Role', 'Date',
            'Type', 'Reason', 'Status', 'Applied At', 'Action'
          ],
          stretchH: 'all',
          readOnly: true,
          rowHeaders: true,
          width: '100%',
          height: 'auto',
          licenseKey: 'non-commercial-and-evaluation',
          afterOnCellMouseDown: function (e, coords, td) {
            const colIndex = coords.col;
            const rowIndex = coords.row;

            if (colIndex === 8 && td.innerText === 'Approve') {
              const req = leaveRequests[rowIndex];
              employeeDataService.updateLeaveStatus(req.username, req, 'Approved');
              req.status = 'Approved';
              $scope.leaveTableSettings.data = renderData();
              alert(`Leave approved for ${req.name}`);
              $scope.$apply();
            }
          },
          cells: function () {
            return {
              renderer: function (instance, td, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                td.style.background = 'rgba(15, 128, 241, 0.1)';
                td.style.border = '1.5px solid black';
                td.style.color = 'black';
                td.style.fontWeight = '500';
                td.style.fontSize = '16px';
                td.style.padding = '12px';

                if (col === 8 && value === 'Approve') {
                  td.style.color = 'white';
                  td.style.background = 'green';
                  td.style.cursor = 'pointer';
                  td.style.textAlign = 'center';
                  td.style.borderRadius = '6px';
                }
              }
            };
          }
        };
        $scope.$applyAsync();
      });
    };

    $scope.logout = function () {
      employeeDataService.logout();
      $location.path('/');
    };
  });
