-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ticktack;
USE ticktack;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id INT NOT NULL, -- Added user_id column
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- Foreign key to users table
);

-- Create tasks table 
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    project_id INT NOT NULL,
    status ENUM('todo', 'in-work', 'in-progress', 'completed') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high') DEFAULT 'low',
    due_date DATE,
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- -- Insert sample tasks
-- INSERT INTO tasks (title, description, project_id, status, priority, due_date, tags) VALUES
-- -- Website Redesign tasks
-- ('Homepage Design', 'Create new homepage mockup', 1, 'todo', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), 'design,ui'), -- Replace 1 with a valid user ID
-- ('User Research', 'Conduct user interviews and surveys', 1, 'in-work', 'medium', DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 'research'), -- Replace 1 with a valid user ID
-- ('Content Migration', 'Move content to new CMS', 1, 'todo', 'low', DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY), 'content'), -- Replace 1 with a valid user ID

-- -- Mobile App Development tasks (project_id 2)
-- ('UI/UX Design', 'Design user interface for mobile app', 2, 'in-progress', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), 'design,mobile'), -- Replace 1 with a valid user ID
-- ('API Development', 'Create RESTful API endpoints', 2, 'in-work', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 'backend,api'), -- Replace 1 with a valid user ID
-- ('User Authentication', 'Implement OAuth2 authentication', 2, 'todo', 'medium', DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'security'), -- Replace 1 with a valid user ID

-- -- Marketing Campaign tasks (project_id 3)
-- ('Social Media Plan', 'Develop social media strategy', 3, 'completed', 'medium', DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), 'social,planning'), -- Replace 1 with a valid user ID
-- ('Content Creation', 'Create campaign content', 3, 'in-progress', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 8 DAY), 'content,creative'), -- Replace 1 with a valid user ID
-- ('Analytics Setup', 'Set up tracking and reporting', 3, 'todo', 'low', DATE_ADD(CURRENT_DATE, INTERVAL 12 DAY), 'analytics'); -- Replace 1 with a valid user ID
