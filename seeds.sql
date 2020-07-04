
INSERT INTO department (name)
VALUES
("Marketing"),
("Finance"),
("Sales"),
("Technology");

INSERT INTO role (title, salary, department_id)
VALUES 
("Coordinator", 60000, 1),
("Consultant", 90000, 1),
("Analyst", 70000, 2),
("Auditor", 70000, 2),
("Account Executive", 120000, 3),
("Sales Representative", 100000, 3),
("Software Engineer", 80000, 4),
("Data Scientist", 100000, 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES 
("Willow", "Yu", 2, null),
("James", "Monro", 1, 2),
("Miles", "Alford", 4, null),
("Cammille", "Bassett", 3, 3),
("Rafi", "Rose", 5, null),
("Lilly-Mai", "Caldwell", 6, 5),
("William", "Shea", 8, null),
("Roberta", "Davenport", 7, 7);
