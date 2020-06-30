let connection = require('./config/connection')
const inq = require('inquirer');

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
	let departmentArray = [];
	let departmentData;
	connection.query("SELECT DISTINCT name, id FROM department", function(err, result) {
		result.forEach(function(packet) {
			departmentArray.push(packet.name);
		});
		departmentData = result;
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
			message: 'Salary: '
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
	console.log(deptID);
	let queryString = `INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`;
	connection.query(queryString, [role, salary, deptID], function(err, results) {
		if (err) throw err;
		console.log(`New role "${role}" added to the ${department} department, with salary of $${salary}.`);
	});

}

addRole();

//  Function add employee

async function addEmployee() {

}

//  Update Employee Role

