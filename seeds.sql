
INSERT INTO department (name)
VALUES
("Marketing"),
("Finance"),
("Sales"),
("Technology");

INSERT INTO role (title, salary, department_id)
VALUES 
("Coordinator", 100000, 1),
("Consultant", 120000, 1),
("Analyst", 90000, 2),
("Auditor", 100000, 2),
("Account Executive", 150000, 3),
("Sales Representative", 110000, 3),
("Software Engineer", 130000, 4),
("Data Scientist", 150000, 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES 
("Willow", "Yu", 2, null),
("James", "Monro", 1, 1),
("Miles", "Alford", 4, null),
("Cammille", "Bassett", 3, 3),
("Rafi", "Rose", 5, null),
("Lilly-Mai", "Caldwell", 6, 1),
("William", "Shea", 8, 3),
("Roberta", "Davenport", 7, 3),
("Archer", "Alexander", 1, 5),
("Miriam", "Weaver", 2, 1),
("Weronika", "Crawford", 3, 3),
("Lacy", "Redfern", 4, 5),
("Kaitlin", "Burnett", 5, 1),
("Rikki", "Frank", 6, 5),
("Chante", "Bateman", 7, 3),
("Lynda", "Brooks", 8, 1);