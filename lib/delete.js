

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
    console.log(`------------------------------------------------------------------\nDeleted employees ${deletedEmployees}.`);
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
    console.log(`------------------------------------------------------------------\nDeleted the ${deletedDepartments} department${plural}.`);
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
    console.log(`------------------------------------------------------------------\nDeleted the ${deletedRoles} role${plural}.`);
    await main();
  }
}