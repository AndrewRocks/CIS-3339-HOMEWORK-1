const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'students.json');
const COURSES_FILE = path.join(__dirname, 'courses.json');

async function loadStudents() {
    try {
        const data = await fs.promises.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Error reading students file:', error);
        return [];
    }
}

async function saveStudents(students) {
    try {
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(students, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing students file:', error);
        throw error;
    }
}

async function loadCourses() {
    try {
        const data = await fs.promises.readFile(COURSES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function saveCourses(courses) {
    await fs.promises.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2), 'utf8');
}

app.get('/courses', async (req, res) => {
    try {
        res.send(await loadCourses());
    } catch (error) {
        console.error('Error loading courses:', error);
        res.status(500).send({ error: 'Unable to load courses' });
    }
});

app.post('/courses', async (req, res) => {
    try {
        const id = typeof req.body.id === 'string' ? req.body.id.trim() : '';
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        if (!id || !name) {
            return res.status(400).send({ error: 'Course ID and course name are required' });
        }

        const courses = await loadCourses();
        if (courses.some((course) => course.id.toLowerCase() === id.toLowerCase())) {
            return res.status(409).send({ error: 'A course with this ID already exists' });
        }

        const course = { id, name };
        courses.push(course);
        await saveCourses(courses);
        res.status(201).send({ message: 'Course added successfully', course });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).send({ error: 'Unable to add course' });
    }
});

app.delete('/courses/:id', async (req, res) => {
    try {
        const courses = await loadCourses();
        const index = courses.findIndex((course) => course.id === req.params.id);
        if (index === -1) {
            return res.status(404).send({ error: 'Course not found' });
        }

        const [course] = courses.splice(index, 1);
        await saveCourses(courses);
        res.send({ message: 'Course deleted successfully', course });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).send({ error: 'Unable to delete course' });
    }
});

// Endpoint to search for a student by name
app.post('/find-student', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).send({ error: 'Student name is required' });
        }

        const students = await loadStudents();
        const student = students.find((item) => item.name === name);
        if (!student) {
            return res.status(404).send({ error: 'Student not found' });
        }

        res.send(student);
    } catch (error) {
        console.error('Error finding student:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Endpoint to save a student
app.post('/add-student', async (req, res) => {
    try {
        const { name, id, phone, zip } = req.body;
        if (!name || !id || !phone || !zip) {
            return res.status(400).send({ error: 'All fields (name, id, phone, zip) are required' });
        }

        const students = await loadStudents();
        const newStudent = { name, id, phone, zip };
        students.push(newStudent);
        await saveStudents(students);

        res.status(201).send({ message: 'Student added successfully', student: newStudent });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Endpoint to delete a student by name
app.post('/delete-student', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).send({ error: 'Student name is required' });
        }

        const students = await loadStudents();
        const index = students.findIndex((item) => item.name === name);
        if (index === -1) {
            return res.status(404).send({ error: 'Student not found' });
        }

        const deletedStudent = students.splice(index, 1)[0];
        await saveStudents(students);

        res.send({ message: 'Student deleted successfully', student: deletedStudent });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
