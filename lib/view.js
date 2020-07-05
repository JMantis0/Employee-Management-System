
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