
//  Update Employee Role
async function updateRole() {
  const employeeData = await queryEmployee();
  let roleData = [];
  let roleID;
  let oldRole;
  const employeeArray = employeeData.map(packet => `${packet.id} ${packet.first_name} ${packet.last_name}`);
  const uePrompt = [
    {
      type: 'list',
      name: 'employee',
      message: 'Select employee: ',
      choices: employeeArray
    },
    {
      type: 'list',
      name: 'newRole',
      message: function(input) {
        for (const packet of employeeData) {
          if (packet.id.toString() === input.employee.split(' ')[0]) {
            oldRole = `${packet.title}`;
            return `${chalk.bold.magenta(packet.first_name)} ${chalk.bold.magenta(packet.last_name)}'s current role: ${chalk.bold.magenta(packet.title)}\n  ${chalk.bold.magenta(packet.first_name)}'s new role: `;
          }
        }
				
      },
      choices: async function () {
        roleData = await connection.query('SELECT id, title FROM role');
        const choices = roleData.map(packet => `${packet.title}`);
        return choices.filter(role => role !== oldRole);
      }
    }
  ];
  let {employee, newRole} = await inq.prompt(uePrompt);
  const empID = employee.split(' ')[0];
  for (const packet of roleData) {
    if (packet.title === newRole) {
      roleID = packet.id;
    }
  }
  employee = `${employee.split(' ')[1]} ${employee.split(' ')[2]}`; 
  //  Update the record
  connection.query('UPDATE employee SET role_id = ? WHERE id = ?', [roleID, empID], (err) => {
    if (err) {throw err;}
    console.log(`------------------------------------------------------------------\nEmployee role for ${chalk.bold.magenta(employee)} changed from ${chalk.bold.magenta(oldRole)} to ${chalk.bold.magenta(newRole)}`);
    main();
  });
}

// function updateManager() displays assigns a new manager to a non-management employee
async function updateManager() {
  let oldManager;
  let employeeData = [];
  let managerData = [];
  const {employee, newManager} = await inq.prompt([
    {
      type: 'list',
      name: 'employee',
      message: 'Choose employee: ',
      choices: async function() {
        const query = 'SELECT t1.id, concat(t1.first_name, \' \', t1.last_name) as employee , concat(t2.first_name, \' \', t2.last_name) as manager FROM employee t1 LEFT JOIN employee t2 ON t1.manager_id = t2.id WHERE t1.manager_id IS NOT NULL';
        employeeData = await connection.query(query);
        return employeeData.map(packet => packet.employee);
      }
    },
    {
      type: 'list',
      name: 'newManager',
      message: function(input) {
        // Assign selected employee's manager to variable manager
        for (const packet of employeeData) {
          if (input.employee === packet.employee) {
            oldManager = packet.manager;
          }
        }
        return `${chalk.bold.magenta(input.employee)}'s current manager: ${chalk.bold.magenta(oldManager)}.\n  ${chalk.bold.magenta(input.employee.split(' ')[0])}'s new manager: `;
      },
      choices: async function() {
        const query = 'SELECT t1.id, concat(t1.first_name, \' \', t1.last_name) as manager FROM employee t1 WHERE t1.manager_id IS NULL';
        managerData = await connection.query(query);
        const choices = managerData.map(packet => packet.manager);
        // Return managers except the current
        return choices.filter(x => x !== oldManager);
      }
    }
  ]);
  //  Get id that corresponds with user choice
  let employeeID;
  for (const packet of employeeData) {
    if(employee === packet.employee) {
      employeeID = packet.id;
    }
  }
  //  Get manager_id that corresponds with user choice
  let managerID;
  for (const packet of managerData) {
    if(newManager === packet.manager) {
      managerID = packet.id;
    }
  }
  connection.query('UPDATE employee SET manager_id = ? WHERE id = ?', [managerID, employeeID], (err) => {
    if (err) {throw err;}
		
    console.log(`------------------------------------------------------------------\nManager for ${chalk.bold.magenta(employee)} changed from ${chalk.bold.magenta(oldManager)} to ${chalk.bold.magenta(newManager)}.`);
    main();
  });
}