const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'students.json');
const COURSES_FILE = path.join(__dirname, 'courses.json');
const ENROLLMENTS_FILE = path.join(__dirname, 'enrollments.json');

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

async function loadEnrollments() {
    try {
        const data = await fs.promises.readFile(ENROLLMENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function saveEnrollments(enrollments) {
    await fs.promises.writeFile(ENROLLMENTS_FILE, JSON.stringify(enrollments, null, 2), 'utf8');
}

app.get('/students', async (req, res) => {
    try {
        res.send(await loadStudents());
    } catch (error) {
        console.error('Error loading students:', error);
        res.status(500).send({ error: 'Unable to load students' });
    }
});

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

app.get('/enrollments', async (req, res) => {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId.trim() : '';
    if (!courseId) {
        return res.status(400).send({ error: 'Course ID is required to list its enrolled students' });
    }

    try {
        const [courses, students, enrollments] = await Promise.all([
            loadCourses(),
            loadStudents(),
            loadEnrollments()
        ]);
        const course = courses.find((item) => item.id === courseId);
        if (!course) {
            return res.status(404).send({ error: 'Course not found' });
        }

        const studentIds = new Set(
            enrollments
                .filter((enrollment) => enrollment.courseId === courseId)
                .map((enrollment) => String(enrollment.studentId))
        );
        res.send(students.filter((student) => studentIds.has(String(student.id))));
    } catch (error) {
        console.error('Error loading course roster:', error);
        res.status(500).send({ error: 'Unable to load course roster' });
    }
});

app.post('/enrollments', async (req, res) => {
    const studentId = typeof req.body.studentId === 'string' ? req.body.studentId.trim() : '';
    const courseId = typeof req.body.courseId === 'string' ? req.body.courseId.trim() : '';
    if (!studentId || !courseId) {
        return res.status(400).send({ error: 'Student and course are required' });
    }

    try {
        const [students, courses, enrollments] = await Promise.all([
            loadStudents(),
            loadCourses(),
            loadEnrollments()
        ]);
        const student = students.find((item) => String(item.id) === studentId);
        if (!student) {
            return res.status(404).send({ error: 'Student not found' });
        }

        const course = courses.find((item) => item.id === courseId);
        if (!course) {
            return res.status(404).send({ error: 'Course not found' });
        }

        const duplicate = enrollments.some((enrollment) =>
            String(enrollment.studentId) === studentId && enrollment.courseId === courseId
        );
        if (duplicate) {
            return res.status(409).send({ error: 'This student is already enrolled in this course' });
        }

        const enrollment = { studentId, courseId };
        enrollments.push(enrollment);
        await saveEnrollments(enrollments);
        res.status(201).send({ message: 'Student enrolled successfully', enrollment, student, course });
    } catch (error) {
        console.error('Error creating enrollment:', error);
        res.status(500).send({ error: 'Unable to create enrollment' });
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
        const enrollments = await loadEnrollments();
        await saveEnrollments(enrollments.filter((enrollment) => enrollment.courseId !== course.id));
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
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
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
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const rawId = req.body.id;
        const id = typeof rawId === 'string' || typeof rawId === 'number'
            ? String(rawId).trim()
            : '';
        const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
        const zip = typeof req.body.zip === 'string' ? req.body.zip.trim() : '';
        if (!name || !id || !phone || !zip) {
            return res.status(400).send({ error: 'All fields (name, id, phone, zip) are required' });
        }

        const students = await loadStudents();
        if (students.some((student) =>
            String(student.id).trim().toLowerCase() === id.toLowerCase()
        )) {
            return res.status(409).send({ error: 'A student with this ID already exists' });
        }

        const newStudent = { name, id, phone, zip };
        students.push(newStudent);
        await saveStudents(students);

        res.status(201).send({ message: 'Student added successfully', student: newStudent });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.delete('/students/:id', async (req, res) => {
    try {
        const id = req.params.id.trim();
        const students = await loadStudents();
        const index = students.findIndex((student) => String(student.id).trim() === id);
        if (index === -1) {
            return res.status(404).send({ error: 'Student not found' });
        }

        const [deletedStudent] = students.splice(index, 1);
        const enrollments = await loadEnrollments();
        await saveEnrollments(enrollments.filter((enrollment) =>
            String(enrollment.studentId) !== String(deletedStudent.id)
        ));
        await saveStudents(students);
        res.send({ message: 'Student deleted successfully', student: deletedStudent });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Endpoint to delete a student by name
app.post('/delete-student', async (req, res) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
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
