module.exports = {
  addData: addData,
  addEmployee: addEmployee,
  addDepartment: addDepartment,
  addRole: addRole
};
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