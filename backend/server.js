const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Student, Course, Enrollment } = require('./models');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
const frontendRoutes = new Set(['/courses', '/enrollments']);
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
        req.isApiRequest = true;
        req.url = req.url.replace(/^\/api(?=\/|$)/, '') || '/';
    }
    next();
});

function normalizeId(value) {
    return value.trim().toLocaleLowerCase('en-US');
}

function publicRecord(document) {
    const record = document.toObject({ versionKey: false });
    delete record.idKey;
    return record;
}

app.use((req, res, next) => {
    const acceptsHtml = (req.get('accept') || '').includes('text/html');
    if (
        req.method === 'GET' &&
        !req.isApiRequest &&
        acceptsHtml &&
        frontendRoutes.has(req.path)
    ) {
        return res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
            if (error) {
                next(error);
            }
        });
    }
    next();
});

app.get('/students', async (req, res) => {
    const students = await Student.find().sort({ name: 1 });
    res.send(students.map(publicRecord));
});

app.get('/courses', async (req, res) => {
    const courses = await Course.find().sort({ id: 1 });
    res.send(courses.map(publicRecord));
});

app.post('/courses', async (req, res) => {
    const id = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!id || !name) {
        return res.status(400).send({ error: 'Course ID and course name are required' });
    }

    const course = await Course.create({ id, idKey: normalizeId(id), name });
    res.status(201).send({
        message: 'Course added successfully',
        course: publicRecord(course)
    });
});

app.get('/enrollments', async (req, res) => {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId.trim() : '';
    if (!courseId) {
        return res.status(400).send({ error: 'Course ID is required to list its enrolled students' });
    }

    const course = await Course.findOne({ id: courseId });
    if (!course) {
        return res.status(404).send({ error: 'Course not found' });
    }

    const enrollments = await Enrollment.find({ courseId: course._id }).select('studentId');
    const students = await Student.find({
        _id: { $in: enrollments.map((enrollment) => enrollment.studentId) }
    }).sort({ name: 1 });
    res.send(students.map(publicRecord));
});

app.post('/enrollments', async (req, res) => {
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : '';
    const courseId = typeof req.body?.courseId === 'string' ? req.body.courseId.trim() : '';
    if (!studentId || !courseId) {
        return res.status(400).send({ error: 'Student and course are required' });
    }

    const [student, course] = await Promise.all([
        Student.findOne({ id: studentId }),
        Course.findOne({ id: courseId })
    ]);
    if (!student) {
        return res.status(404).send({ error: 'Student not found' });
    }
    if (!course) {
        return res.status(404).send({ error: 'Course not found' });
    }

    const enrollment = await Enrollment.create({
        studentId: student._id,
        courseId: course._id
    });
    res.status(201).send({
        message: 'Student enrolled successfully',
        enrollment: { studentId: student.id, courseId: course.id },
        student: publicRecord(student),
        course: publicRecord(course)
    });
});

app.delete('/courses/:id', async (req, res) => {
    const course = await Course.findOne({ id: req.params.id });
    if (!course) {
        return res.status(404).send({ error: 'Course not found' });
    }

    await Enrollment.deleteMany({ courseId: course._id });
    await course.deleteOne();
    res.send({ message: 'Course deleted successfully', course: publicRecord(course) });
});

app.post('/find-student', async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
        return res.status(400).send({ error: 'Student name is required' });
    }

    const student = await Student.findOne({ name });
    if (!student) {
        return res.status(404).send({ error: 'Student not found' });
    }

    res.send(publicRecord(student));
});

app.post('/add-student', async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const rawId = req.body?.id;
    const id = typeof rawId === 'string' || typeof rawId === 'number'
        ? String(rawId).trim()
        : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const zip = typeof req.body?.zip === 'string' ? req.body.zip.trim() : '';
    if (!name || !id || !phone || !zip) {
        return res.status(400).send({ error: 'All fields (name, id, phone, zip) are required' });
    }

    const student = await Student.create({
        name,
        id,
        idKey: normalizeId(id),
        phone,
        zip
    });
    res.status(201).send({
        message: 'Student added successfully',
        student: publicRecord(student)
    });
});

app.delete('/students/:id', async (req, res) => {
    const student = await Student.findOne({ id: req.params.id.trim() });
    if (!student) {
        return res.status(404).send({ error: 'Student not found' });
    }

    await Enrollment.deleteMany({ studentId: student._id });
    await student.deleteOne();
    res.send({ message: 'Student deleted successfully', student: publicRecord(student) });
});

app.use(express.static(frontendDist));
app.use((req, res, next) => {
    if (req.isApiRequest) {
        return res.status(404).send({ error: 'API endpoint not found' });
    }
    if (req.method === 'GET' && req.accepts('html')) {
        return res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
            if (error) {
                next(error);
            }
        });
    }
    next();
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    if (error.code === 11000) {
        if (error.keyPattern?.studentId && error.keyPattern?.courseId) {
            return res.status(409).send({ error: 'This student is already enrolled in this course' });
        }
        return res.status(409).send({ error: 'A record with this ID already exists' });
    }
    if (
        error.name === 'ValidationError' ||
        error.name === 'CastError' ||
        error.type === 'entity.parse.failed'
    ) {
        return res.status(400).send({ error: 'The submitted data is invalid' });
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).send({ error: 'Database is unavailable; try again shortly' });
    }
    console.error('Request failed:', error);
    res.status(500).send({ error: 'Internal server error' });
});

async function startServer() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is missing from the repository .env file');
    }

    await mongoose.connect(mongoUri);
    await Promise.all([Student.init(), Course.init(), Enrollment.init()]);

    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
        console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);
    });
}

startServer().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exitCode = 1;
});
