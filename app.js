const connection = require('./config/connection');
const tbl = require('console.table');
const chalk = require ('chalk');
const inq = require('inquirer');
const util = require('util');
const figlet = require('figlet');
connection.query = util.promisify(connection.query);

console.clear();
console.log(chalk.red.inverse('                                                                    '));
figlet('Employee', (err, data) => {
  if (err) {
    console.log('Something went wrong...');
    console.dir(err);
    return;
  }
  console.log(chalk.red(data));
  console.log(chalk.rgb(15, 100, 204).inverse('                                                                    '));
  figlet('Management', (err, data) => {
    if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
    }
    console.log(chalk.rgb(15, 100, 204)(data));
    console.log(chalk.green.inverse('                                                                    '));
    figlet('System', (err, data) => {
      if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
      }
      console.log(chalk.green(data));
      //First main call
      main();
    });
  });
});

// Function viewData takes uses data parameter in a switch to the proper query 
async function viewData(data) {
  let query;
  switch(data) {
  case('Departments'):
    query = 'SELECT id AS ID, name AS DEPARTMENT FROM department';
    console.log('--------------------------------------------------------------------');
    break;
  case('Employees'):
    query = 'SELECT t1.id AS ID, CONCAT(t1.first_name, \' \', t1.last_name) AS NAME, t3.title AS TITLE, t4.name AS DEPARTMENT, t3.salary AS SALARY, CONCAT(t2.first_name, \' \', t2.last_name) as MANAGER FROM employee t1 LEFT JOIN employee t2 ON t1.manager_id = t2.id LEFT JOIN role t3 ON t1.role_id = t3.id LEFT JOIN department t4 ON t3.department_id = t4.id ORDER BY t1.id';
    console.log('--------------------------------------------------------------------\nEMPLOYEES\n--------------------------------------------------------------------');
    break;
  case('Employees by Manager'):
    query = await viewByManager();
    console.log('--------------------------------------------------------------------\nBY MANAGER\n--------------------------------------------------------------------');
    break;
  case('Roles'):
    query = 'SELECT DISTINCT t1.id AS ID, title AS TITLE, t3.name AS DEPARTMENT, salary AS SALARY FROM role t1 LEFT JOIN employee t2 ON t1.id = t2.role_id LEFT JOIN department t3 ON t1.department_id = t3.id';
    console.log('--------------------------------------------------------------------\nROLES\n--------------------------------------------------------------------');
    break;
  }
  connection.query(query, (err, result) => {
    if (err) {throw err;}
    console.table(result);
    main();
  });	
}

// Function is to display employees by manager after user chooses the manager
async function viewByManager() {
  const managerData = await queryManagers();
  //Rearrange managerData into object for easier use in inquirer/mysql
  const list = {};
  for (const packet of managerData) {
    list[packet.id] = {
      id: packet.id,
      name: packet.name,
      title: packet.title,
      managerID: packet.manager_id
    };
  }
  const {manager} = await inq.prompt([
    {
      type: 'list',
      name: 'manager',
      message: 'View employees managed by: ',
      choices: function() {
        if (!managerData) {
          return ['No Managers'];
        } 
        return Object.keys(list).map(key => list[key].name);
      }
    },
  ]);
  //Find id of manager
  let managerID;
  for(const key of Object.keys(list)) {
    if(list[key].name === manager) {
      managerID = list[key].id;
      break;
    }
  }
  return `SELECT t2.id AS ID, concat(t2.first_name, ' ', t2.last_name) as EMPLOYEE, t3.title AS TITLE, concat(t1.first_name, ' ', t1.last_name) as 'MANAGED BY' FROM employee t1 LEFT JOIN employee t2 ON t1.id = t2.manager_id LEFT JOIN role t3 ON t2.role_id = t3.id WHERE t2.manager_id = ${managerID}`;
}
//  Function addData uses data param in a switch to call the proper add function
function addData(data) {
  switch(data) {
  case('Departments'):
    addDepartment();
    break;
  case('Employees'):
    addEmployee();
    break;
  case('Roles'):
    addRole();
    break;
  }
  //  Function addEmployee uses mysql connection to query the already
  //  existing data and assigns them to an array.
  //  Then the user is prompted with inquirer.
  //  Finally the inquirer results are used to query and insert
  //  new employee data into the employee table on employee_db
  async function addEmployee() {
    const managerData = await queryManagers();
    const managerArray = managerData.map(packet => packet.name);
    const roleData = await queryRole();
    const roleArray = roleData.map(packet => packet.role);
    console.log('--------------------------------------------------------------------\nEnter information for a new employee');
    let {firstName, lastName, role, isManager} = await inq.prompt([
      {
        type: 'input',
        name: 'firstName',
        message: 'First name: ',
        validate: function (input) {
          const done = this.async();
          if(input.includes('.') || input.includes(' ')) {
            done('Spaces and periods are not allowed in name.');
            return;
          }
          done(null, true);
        }
      },
      {
        type: 'input',
        name: 'lastName',
        message: 'Last name: ',
        validate: function (input) {
          const done = this.async();
          if(input.includes('.') || input.includes(' ')) {
            done('Spaces and periods are not allowed in name.');
            return;
          }
          done(null, true);
        }
      },
      {
        type: 'list',
        name: 'role',
        message: 'Role:',
        choices: roleArray
      },
      {
        type: 'list',
        name: 'isManager',
        message: function(input) {
          return `Is ${input.firstName} ${input.lastName} a Manager?`;
        },
        choices:  ['Yes', 'No']
      }
    ]);
    let managerID = null;
    let manager = null;
    if (isManager === 'No') {
      const answer = await inq.prompt([{
        type: 'list',
        name: 'manager',
        message: `Assign a manager to ${firstName} ${lastName}`,
        choices: managerArray
      }]);
      manager = answer.manager;
      for(const packet of managerData) {
        if(packet.name === manager) {
          managerID = packet.id;
        }
      }
    }
    const roleID = role.split(' ')[0];
    const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES(?, ?, ?, ?)';
    connection.query(query, [firstName, lastName, roleID, managerID], (err, result) => {
      if (err) {throw err;}
      const truncRole = role.split(' ');
      truncRole.shift();
      role = truncRole.join(' ');
      if(manager) {
        console.log(`------------------------------------------------------------------\n${chalk.bold.magenta(firstName)} ${chalk.bold.magenta(lastName)} added to the roster \nas a ${chalk.bold.magenta(role)} managed by ${chalk.bold.magenta(manager)}`);
      }
      else {
        console.log(`------------------------------------------------------------------\n${chalk.bold.magenta(firstName)} ${chalk.bold.magenta(lastName)} added to the roster \nas a ${chalk.bold.magenta('Manager')} and ${chalk.bold.magenta(role)}.`);
      }
      main();
    });
  }
  //  Function addDepartment prompts user with inquirer.
  //  Then uses a mysql connection to insert values from inquirer results
  //  into the department table of the employee_db database.
  async function addDepartment() {
    const dPrompt = [
      {
        type: 'input',
        name: 'department',
        message: 'Enter a new department to add: ',
      }
    ];
    const {department} = await inq.prompt(dPrompt);
    const queryString = 'INSERT INTO department (name) VALUES (?)';
    connection.query(queryString, department, (err) => {
      if (err) {throw err;}
      console.log(`--------------------------------------------------------------------\nThe ${chalk.bold.magenta(department)} department has been added.`);
      main();
    });
  }
}

//  Function addRole uses mysql connection to query the already
//  existing departments and assigns them to an array.
//  Then the user is prompted with inquirer.
//  Finally the inquirer results are used to query and insert
//  The new role data into the role table on employee_db
async function addRole() {
  const departmentData = await queryDepartment();
  const departmentArray = [];
  departmentData.forEach((packet) => {
    departmentArray.push(packet.name);
  });
  const rPrompt = [
    {
      type: 'input',
      name: 'role',
      message: 'Title: ',
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Salary: ',
      validate: function (input) {
        const done = this.async();
        if(isNaN(parseInt(input)) || isNaN(Number(input))) {
          done('Enter a number');
          return;
        }
        done(null, true);
      }
    },
    {
      type: 'list',
      name: 'department',
      message: 'Department: ',
      choices: departmentArray
    }
  ];
  console.log('--------------------------------------------------------------------\nEnter new role: ');
  // Call Inquirer and deconstruct answers into variables
  const {role, salary, department} = await inq.prompt(rPrompt);
  let deptID;
  for(let i = 0; i < departmentData.length; i++) {
    if(departmentData[i].name === department) {
      deptID = departmentData[i].id;
    }
  }
  const queryString = 'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)';
  connection.query(queryString, [role, salary, deptID], (err, results) => {
    if (err) {throw err;}
    console.log(`--------------------------------------------------------------------\nNew role ${chalk.bold.magenta(role)} added to the ${chalk.bold.magenta(department)} department, \nwith a salary of $${chalk.bold.green(salary)}.`);
    main();
  });
}
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

async function deleteData(data) {
  switch(data) {
  case 'Departments':
    deleteDepartment();
    break;
  case('Employees'):
    deleteEmployee();
    break;
  case('Roles'):
    deleteRole();
    break;
  }
  async function deleteEmployee() {
    const employeeData = await queryEmployee();
    const list = {};
    for(const packet of employeeData) {
      list[`${packet.first_name} ${packet.last_name}`] = {
        id: packet.id,
        name: `${packet.first_name} ${packet.last_name}`,
        title: packet.title
      };
    }
    let {employees} = await inq.prompt([
      {
        type: 'checkbox',
        name: 'employees',
        message: 'Choose one or more: ',
        choices: function() {
          return Object.keys(list).map(key => list[key].name);
        }
      }
    ]);
    const query = 'DELETE FROM employee WHERE id = ?';
    employees.forEach((name) => {
      connection.query(query, list[name].id, (err) => {
        if (err) {throw err;}
      });
    });
    let deletedEmployees;
    if (employees.length === 1) {
      deletedEmployees = chalk.bold.magenta(employees[0]);
    }
    else if (employees.length === 2) {
      employees = employees.map(x => chalk.bold.magenta(x));
      deletedEmployees = employees.join(' and ');
    } else if (employees.length > 2) {
      const last = `and ${chalk.bold.magenta(employees.pop())}`;
      deletedEmployees = `${chalk.bold.magenta(employees.join(', '))}, ${last}`;
    }
    else {
      console.log('No employees deleted');
      await main();
    }
    console.log(`--------------------------------------------------------------------\nDeleted employees ${deletedEmployees}.`);
    await main();
  }

  async function deleteDepartment() {
    const departmentData = await queryDepartment();
    //Rearrange Department Data for ease of access
    const list = {};
    for (const packet of departmentData) {
      list[packet.id] = {
        id: packet.id,
        name: packet.name
      };
    }
    let {departments} = await inq.prompt([
      {
        type: 'checkbox',
        name: 'departments',
        message: 'Choose one or more: ',
        choices: function() {
          return Object.keys(list).map(key => list[key].name);
        }
      }
    ]);
    //  Delete each department in the departments array.
    const query = 'DELETE FROM department WHERE name = ?';
    departments.forEach(async (name) => {
      connection.query(query, name, (err) => {
        if (err) {throw err;}
      });
    });
    let plural = '';
    let deletedDepartments;
    if (departments.length === 1) {
      deletedDepartments = chalk.bold.magenta(departments[0]);
    }
    else if (departments.length === 2) {
      plural = 's';
      departments = departments.map(x => chalk.bold.magenta(x));
      deletedDepartments = departments.join(' and ');
    } else if (departments.length > 2) {
      plural = 's';
      const last = `and ${chalk.bold.magenta(departments.pop())}`;
      deletedDepartments = `${chalk.bold.magenta(departments.join(', '))}, ${last}`;
    }
    else {
      console.log('No departments deleted');
      await main();
    }
    console.log(`--------------------------------------------------------------------\nDeleted the ${deletedDepartments} department${plural}.`);
    await main();
  }

  async function deleteRole() {
    const roleData = await queryRole();
    const list = {};
    for(const packet of roleData) {
      list[packet.title] = {
        id: packet.id,
        title: packet.title
      };
    }
    let {roles} = await inq.prompt([
      {
        type: 'checkbox',
        name: 'roles',
        message: 'Choose one or more roles: ',
        choices: function () {
          return Object.keys(list).map(key => list[key].title);
        }
      }
    ]);
    //  Delete records in database that correspond with the roles array.
    const query = 'DELETE FROM role WHERE id = ?';
    roles.forEach(async (title) => {
      connection.query(query, list[title].id, (err) => {
        if (err) {throw err}
      });
    });
    let plural = '';
    let deletedRoles;
    if (roles.length === 1) {
      deletedRoles = chalk.bold.magenta(roles[0]);
    }
    else if (roles.length === 2) {
      plural = 's';
      roles = roles.map(x => chalk.bold.magenta(x));
      deletedRoles = roles.join(' and ');
    } else if (roles.length > 2) {
      plural = 's';
      const last = `and ${chalk.bold.magenta(roles.pop())}`;
      deletedRoles = `${chalk.bold.magenta(roles.join(', '))}, ${last}`;
    }
    else {
      console.log('No roles deleted');
      await main();
    }
    console.log(`--------------------------------------------------------------------\nDeleted the ${deletedRoles} role${plural}.`);
    await main();
  }
}

async function main() {
  const mPrompt = [
    {
      type: 'list',
      name: 'action',
      message: `${chalk.bgYellow('                                                                  ')}\nSelect an action: `,
      choices: ['View', 'Add', 'Update', new inq.Separator(), 'Delete', new inq.Separator, chalk.red('Quit')]
    },
    {
      type: 'list',
      name: 'data',
      message : function(input) {
        switch(input.action) {
        case 'View':
          return '------------------------------------------------------------------\nView: ';
        case 'Add':
          return '------------------------------------------------------------------\nAdd: ';
        case 'Update':
          return '------------------------------------------------------------------\nUpdate: ';
        case 'Delete':
          return '------------------------------------------------------------------\nDelete: ';
        case chalk.red('Quit'):
          return '------------------------------------------------------------------\nAre you sure you want to quit?';
        }
      },
      choices: function(input) {
        switch(input.action) {
        case 'View':
          return ['Employees', 'Employees by Manager', 'Roles', 'Departments'];
        case 'Add':
          return ['Employees', 'Roles', 'Departments'];
        case 'Update':
          return ['Employee role', 'Employee manager'];
        case 'Delete':
          return ['Employees', 'Roles', 'Departments'];
        case chalk.red('Quit'):
          return ['Yes', 'No'];
        }
      }
    }
  ];
  const {action, data} = await inq.prompt(mPrompt);
  if(data === 'Yes') {
    console.log('Goodbye!');
    connection.end();
    process.exit();
  }
  else if(data === 'No') {
    await main();
  }
  else {
    switch (action) {
    case 'View':
      viewData(data);
      break;
    case 'Add':
      addData(data);
      break;
    case 'Update':
      if (data === 'Employee role') {
        updateRole();
      }
      else if (data === 'Employee manager') {
        updateManager();
      }
      break;
    case 'Delete':
      deleteData(data);
      break;
    }
  }
}

//  Reusable queries
async function queryRole() {
  return connection.query('SELECT id, title, concat(id, \' \', title) as role FROM role');
}

async function queryDepartment() {
  return connection.query('SELECT DISTINCT name, id FROM department');
}

async function queryEmployee() {
  return connection.query('SELECT t1.id, t2.id as role_id, t1.first_name, t1.last_name, t2.title FROM employee t1 LEFT JOIN role t2 ON t1.role_id = t2.id ORDER BY t1.id');
}

async function queryManagers() {
  return connection.query('SELECT t1.id, concat(t1.first_name, \' \', t1.last_name) as name, t2.title, t1.manager_id, concat(t1.id, \' \', t1.first_name, \' \', t1.last_name) as manager from employee t1 LEFT JOIN role t2 ON t2.id = t1.role_id  WHERE manager_id IS NULL');
}