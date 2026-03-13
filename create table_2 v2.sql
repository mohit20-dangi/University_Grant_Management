Create Table Research_Projects(
	project_id varchar(5) Primary Key,
	title varchar(50) not null unique,
	abstract varchar(200),
	start_date DATE not null,
	end_date DATE,
    leader_id varchar(5)
);

Create Table Publications(
	publication_id varchar(5) Primary Key,
	title varchar(40) not null,
	journal varchar(30),
	publication_date DATE,
	DOI varchar(30) unique not null
);

Create Table Researchers(
	researcher_id varchar(5) Primary Key,
	name varchar(40) not null,
	email varchar(40) unique,
	position varchar(20),
    department varchar(5)
);

Alter Table Research_Projects
add constraint c1
Foreign Key (leader_id) References Researchers(researcher_id)
ON Delete set null;

Create Table Departments(
	department_id varchar(5) Primary Key,
	department_name varchar(30) not null unique,
	hod varchar(5) unique,
	Foreign Key (hod) References Researchers(researcher_id)
	ON Delete set null
);

Alter Table Researchers
add constraint c2
Foreign Key (department) References Departments(department_id)
ON Delete Restrict;

Create Table Equipments(
	equipment_id varchar(5) Primary Key,
	equipment_name varchar(40) not null,
	model varchar(40),
    managed_by varchar(5),
    Foreign Key (managed_by) References Departments(department_id)
    On Delete Restrict
);

Create Table Agencies(
	agency_id varchar(5) Primary Key,
	name varchar(40),
	type varchar(30),
	contact int not null unique
);

Create Table Grants(
	grant_id varchar(5) Primary Key,
	title varchar(30),
	amount decimal(9,2) not null,
	year integer,
    given_by varchar(5),
    Foreign Key (given_by) References Agencies(agency_id)
    ON Delete Restrict
);

Create Table Funded_By(
	project_id varchar(5),
	grant_id varchar(5),
	amount decimal(9,2),
	Primary Key (project_id, grant_id),
	Foreign Key (grant_id) References Grants(grant_id)
	On Delete Cascade,
	Foreign Key (project_id) References Research_Projects(project_id)
	On Delete Restrict
);

Create Table Result_in(
	project_id varchar(5),
	publication_id varchar(5),
	Primary Key (project_id, publication_id),
	Foreign Key (project_id) References Research_Projects(project_id)
	On Delete Restrict,
	Foreign Key (publication_id) References Publications(publication_id)
	On Delete Cascade
);

Create Table Members(
	project_id varchar(5),
	researcher_id varchar(5),
	role varchar(40),
	Primary Key (project_id, researcher_id),
	Foreign Key (project_id) References Research_Projects(project_id)
	On Delete Cascade,
	Foreign Key (researcher_id) References Researchers(researcher_id)
	On Delete Cascade
);

Create Table Authors(
	publication_id varchar(5),
	researcher_id varchar(5),
	re_order int,
	Primary Key (publication_id, researcher_id),
	Foreign Key (publication_id) References Publications(publication_id)
	On Delete Cascade,
	Foreign Key (researcher_id) References Researchers(researcher_id)
	On Delete Cascade
);

Create Table Usage(
	equipment_id varchar(5),
	researcher_id varchar(5),
	project_id varchar(5),
	start_timestamp Timestamp,
	end_timestamp Timestamp,
	Primary Key (equipment_id, project_id, researcher_id, start_timestamp),
	Foreign Key (equipment_id) References Equipments(equipment_id)
	On Delete Cascade,
	Foreign Key (project_id) References Research_Projects(project_id)
	On Delete Cascade,
	Foreign Key (researcher_id) References Researchers(researcher_id)
	On Delete Cascade
);