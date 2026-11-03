const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    id: { type: String, required: true, trim: true },
    idKey: { type: String, required: true, unique: true, select: false },
    phone: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true }
}, { versionKey: false });

const courseSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    idKey: { type: String, required: true, unique: true, select: false },
    name: { type: String, required: true, trim: true }
}, { versionKey: false });

const enrollmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
}, { versionKey: false });

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = {
    Student: mongoose.models.Student || mongoose.model('Student', studentSchema),
    Course: mongoose.models.Course || mongoose.model('Course', courseSchema),
    Enrollment: mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema)
};
