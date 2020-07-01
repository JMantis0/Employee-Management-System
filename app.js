const connection = require('./config/connection');
const tbl = require('console.table');
const chalk = require ('chalk');
const inq = require('inquirer');
const util = require("util");
const { listenerCount } = require('process');
connection.query = util.promisify(connection.query);


async function main() {
	let mPrompt = [
		{
			type: 'list',
			name: 'action',
			message: 'Select an action: ',
			choices: ['View', 'Add', 'Update']
		},
		{
			type: 'list',
			name: 'data',
			message : function(input) {
				switch(input.action) {
					case "View":
						return "What would you like to view?";
					case "Add":
						return "What would you like to add?";
					case "Update":
						return "What would you like to update?";
				}
			},
			choices: ['Departments', 'Roles', 'Employees']
		}
	];

	let {action, data} = await inq.prompt(mPrompt);
	console.log(action, data)

	switch (action) {
		case 'View':
			viewData(data);
			break;
		case 'Add':
			console.log('Code to add data here')
			break;
		case 'Update':
			console.log('Code to update data here')
			break;
	}
}
main();

async function queryRole() {
	return connection.query("SELECT * FROM role");
}

async function queryDepartment() {
	return connection.query("SELECT DISTINCT name, id FROM department");
}

async function queryManager() {
	console.log(connection.query("SELECT * from employee WHERE manager_id IS NULL"), "17");
	return connection.query("SELECT * from employee WHERE manager_id IS NULL");
}

//  Function addDepartments prompts user with inquirer.
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
		console.log(`New department, "${department}" added to DB`);
	});
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
				return `Salary of a ${input.role}`
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
			message: 'Department',
			choices: departmentArray
		}
	];
	console.log("Enter new role information: ")

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
		console.log(`New role "${role}" added to the ${department} department, with salary of $${salary}.`);
	});
}


//  Function add employee

async function addEmployee() {
	let managerData = await queryManager();
	let managerArray = [];
	managerData.forEach(function(packet) {
		managerArray.push(`${packet.first_name} ${packet.last_name}`);
	});
	
	let roleData = await queryRole();
	let roleArray = [];
	roleData.forEach(function(packet) {
		roleArray.push(packet.title)
	})

	let ePrompt = [
		{
			type: 'input',
			name: 'firstName',
			message: "First name: "
		},
		{
			type: 'input',
			name: 'lastName',
			message: "Last name: "
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
				return `Is ${input.firstName} ${input.lastName} a manager?`;
			},
			choices: function (input) {
				return [`Yes, ${input.firstName} a manager`, `No, ${input.firstName} is not a manager`];
			}
		}
	];

	console.log("**Add Employee**\nEnter information for a new employee");
	let {firstName, lastName, role, isManager} = await inq.prompt(ePrompt);

	let managerID = null;
	if (isManager === `No, ${firstName} is not a manager`) {
		let {manager} = await inq.prompt([{
			type: 'list',
			name: 'manager',
			message: `Assign a manager to ${firstName} ${lastName}`,
			choices: managerArray
		}]);
		for(let i = 0; i < managerData.length; i++) {
			if(`${managerData[i].first_name} ${managerData[i].last_name}` === manager) {
				managerID = managerData[i].id;
			}
		}
	}
	
	let roleID;
	for(let i = 0; i < roleData.length; i++) {
		if(roleData[i].title === role) {
			roleID = roleData[i].id;
		}
	}
	query = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES(?, ?, ?, ?)`;
	connection.query(query, [firstName, lastName, roleID, managerID], function(err, result) {
		if (err) throw err;
		console.log(`${firstName} ${lastName} added to the roster as a ${role}`)
	})
}
//  Update Employee Role

// View Data
async function viewData(data) {
	let query;
	switch(data) {
		case('Departments'):
		query = `SELECT name AS DEPARTMENT FROM department`;
		break;
		case('Employees'):
		query = "SELECT CONCAT(t1.last_name, ', ', t1.first_name) AS NAME, t3.title AS TITLE, t4.name AS DEPARTMENT, t3.salary AS SALARY, CONCAT(t2.first_name, ' ', t2.last_name) as MANAGER FROM employee t1 LEFT JOIN employee t2 ON t1.manager_id = t2.id LEFT JOIN role t3 ON t1.role_id = t3.id LEFT JOIN department t4 ON t3.department_id = t4.id ORDER BY NAME";
		break;
		case('Roles'):
		query = `SELECT title AS TITLE, t3.name AS DEPARTMENT, salary AS SALARY FROM role t1 LEFT JOIN employee t2 ON t1.id = t2.role_id LEFT JOIN department t3 ON t1.department_id = t3.id`;
		break;
	}

	connection.query(query, function(err, result) {
		if (err) throw err;
		console.table('\n\n', result, '\n\n');

	});
	

}
