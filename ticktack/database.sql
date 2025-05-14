-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ticktack;
USE ticktack;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;

-- Create projects table
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create tasks table with new fields
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

-- Insert sample projects
INSERT INTO projects (name, description) VALUES
('Website Redesign', 'Complete overhaul of company website with modern design'),
('Mobile App Development', 'New mobile app for customer engagement'),
('Marketing Campaign', 'Q3 digital marketing campaign planning and execution');

-- Insert sample tasks
INSERT INTO tasks (title, description, project_id, status, priority, due_date, tags) VALUES
-- Website Redesign tasks
('Homepage Design', 'Create new homepage mockup', 1, 'todo', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), 'design,ui'),
('User Research', 'Conduct user interviews and surveys', 1, 'in-work', 'medium', DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 'research'),
('Content Migration', 'Move content to new CMS', 1, 'todo', 'low', DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY), 'content'),

-- Mobile App Development tasks
('UI/UX Design', 'Design user interface for mobile app', 2, 'in-progress', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), 'design,mobile'),
('API Development', 'Create RESTful API endpoints', 2, 'in-work', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 'backend,api'),
('User Authentication', 'Implement OAuth2 authentication', 2, 'todo', 'medium', DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'security'),

-- Marketing Campaign tasks
('Social Media Plan', 'Develop social media strategy', 3, 'completed', 'medium', DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), 'social,planning'),
('Content Creation', 'Create campaign content', 3, 'in-progress', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 8 DAY), 'content,creative'),
('Analytics Setup', 'Set up tracking and reporting', 3, 'todo', 'low', DATE_ADD(CURRENT_DATE, INTERVAL 12 DAY), 'analytics');
