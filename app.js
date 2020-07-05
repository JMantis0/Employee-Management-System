const connection = require('./config/connection');
const tbl = require('console.table');
const chalk = require ('chalk');
const inq = require('inquirer');
const util = require("util");
const { listenerCount } = require('process');
var figlet = require('figlet');
connection.query = util.promisify(connection.query);

console.clear();
console.log(chalk.red.inverse('                                                                    '));
figlet('Employee', function(err, data) {
	if (err) {
			console.log('Something went wrong...');
			console.dir(err);
			return;
	}
	console.log(chalk.red(data));
	console.log(chalk.rgb(15, 100, 204).inverse('                                                                    '));
	figlet('Management', function(err, data) {
		if (err) {
				console.log('Something went wrong...');
				console.dir(err);
				return;
		}
		console.log(chalk.rgb(15, 100, 204)(data));
		console.log(chalk.green.inverse('                                                                    '));
		figlet('System', function(err, data) {
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
      query = `SELECT id AS ID, name AS DEPARTMENT FROM department`;
      console.log("--------------------------------------------------------------------");
      break;
		case('Employees'):
      query = "SELECT t1.id AS ID, CONCAT(t1.first_name, ' ', t1.last_name) AS NAME, t3.title AS TITLE, t4.name AS DEPARTMENT, t3.salary AS SALARY, CONCAT(t2.first_name, ' ', t2.last_name) as MANAGER FROM employee t1 LEFT JOIN employee t2 ON t1.manager_id = t2.id LEFT JOIN role t3 ON t1.role_id = t3.id LEFT JOIN department t4 ON t3.department_id = t4.id ORDER BY t1.id";
      console.log("--------------------------------------------------------------------\nEMPLOYEES\n--------------------------------------------------------------------");
      break;
    case('Employees by Manager'):
     query = await viewByManager();
     console.log("--------------------------------------------------------------------\nBY MANAGER\n--------------------------------------------------------------------");
     break;
		case('Roles'):
      query = `SELECT DISTINCT t1.id AS ID, title AS TITLE, t3.name AS DEPARTMENT, salary AS SALARY FROM role t1 LEFT JOIN employee t2 ON t1.id = t2.role_id LEFT JOIN department t3 ON t1.department_id = t3.id`;
      console.log("--------------------------------------------------------------------\nROLES\n--------------------------------------------------------------------");
      break;
		
	}

	connection.query(query, function(err, result) {
    if (err) throw err;
		console.table(result);
		main()
	});	
}

// Function is to display employees by manager after user chooses the manager
async function viewByManager() {
  let managerData = await queryManagers();
  //Rearrange managerData into object for easier use in inquirer/mysql
  let list = {};
  for (packet of managerData) {
    list[packet.id] = {
      id: packet.id,
      name: packet.name,
      title: packet.title,
      managerID: packet.manager_id
    }
  }

  let {manager} = await inq.prompt([
    {
      type: 'list',
      name: 'manager',
      message: 'View employees managed by: ',
      choices: function() {
        return Object.keys(list).map(key => list[key].name);
      }
    },
  ]);

  //Find id of manager
  let managerID;
  for(key of Object.keys(list)) {
    if(list[key].name === manager) {
      managerID = list[key].id;
      break
    }
  }
  return `SELECT t2.id AS ID, concat(t2.first_name, ' ', t2.last_name) as EMPLOYEE, t3.title AS TITLE, concat(t1.first_name, ' ', t1.last_name) as 'MANAGED BY' FROM employee t1 LEFT JOIN employee t2 ON t1.id = t2.manager_id LEFT JOIN role t3 ON t1.role_id = t3.id WHERE t2.manager_id = ${managerID}`;
}

//  Function addData uses data param in a switch to call the proper add function
function addData(data) {
	let query;
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
}

//  Function addEmployee uses mysql connection to query the already
//  existing data and assigns them to an array.
//  Then the user is prompted with inquirer.
//  Finally the inquirer results are used to query and insert
//  new employee data into the employee table on employee_db
async function addEmployee() {
	let managerData = await queryManagers();
	let managerArray = managerData.map(packet => packet.name);
	
	let roleData = await queryRole();
  let roleArray = roleData.map(packet => packet.role);
  console.log("--------------------------------------------------------------------\nEnter information for a new employee");
	let {firstName, lastName, role, isManager} = await inq.prompt([
    {
      type: 'input',
      name: 'firstName',
      message: "First name: ",
      validate: function (input) {
        var done = this.async();
        if(input.includes('.') || input.includes(" ")) {
          done('Spaces and periods are not allowed in name.');
          return;
        }
        done(null, true);
      }
    },
    {
      type: 'input',
      name: 'lastName',
      message: "Last name: ",
      validate: function (input) {
        var done = this.async();
        if(input.includes('.') || input.includes(" ")) {
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
      choices: function (input) {
        return [`Yes`, `No`];
      }
    }
  ]);
  let managerID = null;
  let manager = null;
  if (isManager === `No`) {
    let answer = await inq.prompt([{
      type: 'list',
      name: 'manager',
      message: `Assign a manager to ${firstName} ${lastName}`,
      choices: managerArray
    }]);
    manager = answer.manager;
    for(packet of managerData) {
      if(packet.name === manager) {
        managerID = packet.id;
      }
    }
  }

	let roleID = role.split(' ')[0];
	query = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES(?, ?, ?, ?)`;
	connection.query(query, [firstName, lastName, roleID, managerID], function(err, result) {
		if (err) throw err;
		let truncRole = role.split(' ');
		let trash = truncRole.shift();
    role = truncRole.join(' ');
		if(manager) {
			console.log(`------------------------------------------------------------------\n${chalk.bold.magenta(firstName)} ${chalk.bold.magenta(lastName)} added to the roster \nas a ${chalk.bold.magenta(role)} managed by ${chalk.bold.magenta(manager)}`)
		}
		else {
			console.log(`------------------------------------------------------------------\n${chalk.bold.magenta(firstName)} ${chalk.bold.magenta(lastName)} added to the roster \nas a ${chalk.bold.magenta('Manager')} and ${chalk.bold.magenta(role)}.`);
		}
		main();
	})
}

//  Function addRole uses mysql connection to query the already
//  existing departments and assigns them to an array.
//  Then the user is prompted with inquirer.
//  Finally the inquirer results are used to query and insert
//  The new role data into the role table on employee_db
async function addRole() {
	let departmentData = await queryDepartment();
	let departmentArray = [];
	departmentData.forEach(function(packet) {
		departmentArray.push(packet.name);
	});

	let rPrompt = [
		{
			type: 'input',
			name: 'role',
			message: 'Title: ',
		},
		{
			type: 'input',
			name: 'salary',
			message: function(input) {
				return `Salary: `
			},
			validate: function (input) {
				var done = this.async();
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
	console.log("--------------------------------------------------------------------\nEnter new role: ")

	// Call Inquirer and deconstruct answers into variables
	let {role, salary, department} = await inq.prompt(rPrompt);
	let deptID;
	for(let i = 0; i < departmentData.length; i++) {
		if(departmentData[i].name === department) {
			deptID = departmentData[i].id;
		}
	}

	let queryString = `INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`;
	connection.query(queryString, [role, salary, deptID], function(err, results) {
		if (err) throw err;
	
		console.log(`--------------------------------------------------------------------\nNew role ${chalk.bold.magenta(role)} added to the ${chalk.bold.magenta(department)} department, \nwith a salary of $${chalk.bold.green(salary)}.`);
		main();
	});
}


//  Function addDepartment prompts user with inquirer.
//  Then uses a mysql connection to insert values from inquirer results
//  into the department table of the employee_db database.
async function addDepartment() {
	let dPrompt = [
		{
			type: 'input',
			name: 'department',
			message: 'Enter a new department to add: ',
		}
	];

	let {department} = await inq.prompt(dPrompt);
	let queryString = `INSERT INTO department (name) VALUES (?)`
	connection.query(queryString, department, function(err, results) {
		if (err) throw err;
		console.log(`--------------------------------------------------------------------\nThe ${chalk.bold.magenta(department)} department has been added.`);
		main();
	});
}


//  Update Employee Role
async function updateRole() {

	let employeeData = await queryEmployee();
  let roleData = [];
  let roleID;
  let oldRole;
  let employeeArray = employeeData.map(packet => `${packet.id} ${packet.first_name} ${packet.last_name}`)


	let uePrompt = [
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
				for (packet of employeeData) {

					if (packet.id.toString() === input.employee.split(' ')[0]) {
            oldRole = `${packet.title}`;
						return `${chalk.bold.magenta(packet.first_name)} ${chalk.bold.magenta(packet.last_name)}'s current role: ${chalk.bold.magenta(packet.title)}\n  ${chalk.bold.magenta(packet.first_name)}'s new role: `;
					}
				}
				
			},
			choices: async function () {
				roleData = await connection.query("SELECT id, title FROM role");
        let choices = roleData.map(packet => `${packet.title}`);
				return choices.filter(role => role !== oldRole);
			}
		}
	];
	let {employee, newRole} = await inq.prompt(uePrompt);
  let empID = employee.split(" ")[0];
  for (packet of roleData) {
    if (packet.title === newRole) {
      roleID = packet.id;
    }
  }
	
	employee = `${employee.split(" ")[1]} ${employee.split(" ")[2]}`; 


	//  Update the record
	connection.query(`UPDATE employee SET role_id = ? WHERE id = ?`, [roleID, empID], function(err, result) {
		if (err) throw err;
		
		console.log(`------------------------------------------------------------------\nEmployee role for ${chalk.bold.magenta(employee)} changed from ${chalk.bold.magenta(oldRole)} to ${chalk.bold.magenta(newRole)}`)
		main();
	});

}

// function updateManager() displays assigns a new manager to a non-management employee
async function updateManager() {
	let oldManager;
	let employeeData = [];
	let managerData = [];
	let {employee, newManager} = await inq.prompt([
		{
			type: 'list',
			name: 'employee',
			message: 'Choose employee: ',
			choices: async function(input) {
				let query = "SELECT t1.id, concat(t1.first_name, ' ', t1.last_name) as employee , concat(t2.first_name, ' ', t2.last_name) as manager FROM employee t1 LEFT JOIN employee t2 ON t1.manager_id = t2.id WHERE t1.manager_id IS NOT NULL";
				employeeData = await connection.query(query);
				return employeeData.map(packet => packet.employee);
			}
		},
		{
			type: 'list',
			name: 'newManager',
			message: function(input) {
				// Assign selected employee's manager to variable manager
				for (packet of employeeData) {
					if (input.employee === packet.employee) {
						oldManager = packet.manager;
					}
				}
				return `${chalk.bold.magenta(input.employee)}'s current manager: ${chalk.bold.magenta(oldManager)}.\n  ${chalk.bold.magenta(input.employee.split(' ')[0])}'s new manager: `
			},
			choices: async function(input) {
				let query = "SELECT t1.id, concat(t1.first_name, ' ', t1.last_name) as manager FROM employee t1 WHERE t1.manager_id IS NULL";
				managerData = await connection.query(query);
				let choices = managerData.map(packet => packet.manager);
				// Return managers except the current
				return choices.filter(x => x !== oldManager);
			}
		}
	]);

	//  Get id that corresponds with user choice
	let employeeID;
	for (packet of employeeData) {
		if(employee === packet.employee) {
			employeeID = packet.id;
		}
	}
	//  Get manager_id that corresponds with user choice
	let managerID;
	for (packet of managerData) {
		if(newManager === packet.manager) {
			managerID = packet.id;
		}
	}

	connection.query(`UPDATE employee SET manager_id = ? WHERE id = ?`, [managerID, employeeID], function(err, result) {
		if (err) throw err;
		
		console.log(`------------------------------------------------------------------\nManager for ${chalk.bold.magenta(employee)} changed from ${chalk.bold.magenta(oldManager)} to ${chalk.bold.magenta(newManager)}.`)
		main();
	});
}

async function main() {
	let mPrompt = [
		{
			type: 'list',
			name: 'action',
			message: `${chalk.bgYellow('                                                                  ')}\nSelect an action: `,
			choices: ['View', 'Add', 'Update', chalk.red('Quit')]
		},
		{
			type: 'list',
			name: 'data',
			message : function(input) {
				switch(input.action) {
					case "View":
						return "------------------------------------------------------------------\nView: ";
					case "Add":
						return "------------------------------------------------------------------\nAdd: ";
					case "Update":
						return "------------------------------------------------------------------\nUpdate: ";
					case chalk.red("Quit"):
						return "------------------------------------------------------------------\nAre you sure you want to quit?";
				}
			},
			choices: function(input) {
				switch(input.action) {
          case "View":
            return ['Employees', 'Employees by Manager', 'Roles', 'Departments'];
          case "Add":
            return ['Employees', 'Roles', 'Departments']
					case "Update":
						return ['Employee role', 'Employee manager'];
					case chalk.red("Quit"):
						return ['Yes', 'No'];
				}
			}
		}
	];

	let {action, data} = await inq.prompt(mPrompt);
	if(data === "Yes") {
		console.log("Goodbye!");
		connection.end();
		process.exit();
	}
	else if(data === "No") {
		main();
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
		}
	}
}

//  Reusable queries
async function queryRole() {
	return connection.query("SELECT id, concat(id, ' ', title) as role FROM role");
}

async function queryDepartment() {
	return connection.query("SELECT DISTINCT name, id FROM department");
}

async function queryEmployee() {
	return connection.query("SELECT t1.id, t2.id as role_id, t1.first_name, t1.last_name, t2.title FROM employee t1 LEFT JOIN role t2 ON t1.role_id = t2.id ORDER BY t1.id");
}

async function queryManagers() {

	return connection.query("SELECT t1.id, concat(t1.first_name, ' ', t1.last_name) as name, t2.title, t1.manager_id, concat(t1.id, ' ', t1.first_name, ' ', t1.last_name) as manager from employee t1 LEFT JOIN role t2 ON t2.id = t1.role_id  WHERE manager_id IS NULL");

}
