DROP DATABASE IF EXISTS employee_db;

CREATE DATABASE employee_db;

USE employee_db;


CREATE TABLE department (
	id INT AUTO_INCREMENT,
	name VARCHAR(30),
    PRIMARY KEY (id)
);

CREATE TABLE role (
	id INT NOT NULL AUTO_INCREMENT,
	title VARCHAR(30),
	salary DECIMAL,
	department_id INT, 
	PRIMARY KEY (id),
	FOREIGN KEY (department_id) REFERENCES department(id)
);

CREATE TABLE employee (
	id INT NOT NULL AUTO_INCREMENT,
	first_name VARCHAR(30),
	last_name VARCHAR(30),
	role_id INT,
	manager_id INT,
	PRIMARY KEY (id),
	FOREIGN KEY (role_id) REFERENCES role (id),
	FOREIGN KEY (manager_id) REFERENCES employee (id)
);

INSERT INTO department (name)
VALUES ("Human Resources");
INSERT INTO department (name)
VALUES ("Labor");

INSERT INTO role (title, salary, department_id)
VALUES ("Associate", 40000, 1);
INSERT INTO role (title, salary, department_id)
VALUES ("Manager", 70000, 1);
INSERT INTO role (title, salary, department_id)
VALUES ("Counsel", 120000, 2);
INSERT INTO role (title, salary, department_id)
VALUES ("Clerk", 40000, 2);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("James", "Monro", 1, 1);
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Willow", "Yu", 2, 1);
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Cammille", "Bassett", 3, 1);
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Miles", "Alford", 1, 1);
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Rafi", "Rose", 2, 2);
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES("Lilly-Mai", "Caldwell", 3, 2);