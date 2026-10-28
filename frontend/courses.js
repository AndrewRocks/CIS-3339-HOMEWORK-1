const courseForm = document.getElementById('courseForm');
const courseList = document.getElementById('courseList');
const emptyMessage = document.getElementById('emptyMessage');
const statusMessage = document.getElementById('status');

function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.setAttribute('role', isError ? 'alert' : 'status');
}

async function readError(response) {
    const body = await response.json();
    return body.error || 'The request could not be completed.';
}

function renderCourses(courses) {
    courseList.replaceChildren();
    emptyMessage.hidden = courses.length > 0;

    for (const course of courses) {
        const item = document.createElement('li');
        const label = document.createElement('span');
        const deleteButton = document.createElement('button');

        label.textContent = `${course.id} — ${course.name} `;
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.dataset.courseId = course.id;

        item.append(label, deleteButton);
        courseList.append(item);
    }
}

async function loadCourses() {
    showStatus('Loading courses...');

    try {
        const response = await fetch('http://localhost:3000/courses');
        if (!response.ok) {
            throw new Error(await readError(response));
        }

        renderCourses(await response.json());
        showStatus('');
    } catch (error) {
        showStatus(`Unable to load courses: ${error.message}`, true);
    }
}

courseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(courseForm);
    const course = {
        id: formData.get('courseId').trim(),
        name: formData.get('courseName').trim()
    };

    if (!course.id || !course.name) {
        showStatus('Course ID and course name are required.', true);
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(course)
        });
        if (!response.ok) {
            throw new Error(await readError(response));
        }

        courseForm.reset();
        await loadCourses();
        showStatus('Course added successfully.');
    } catch (error) {
        showStatus(error.message, true);
    }
});

courseList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-course-id]');
    if (!button) {
        return;
    }

    const courseId = button.dataset.courseId;
    if (!window.confirm(`Delete course ${courseId}?`)) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/courses/${encodeURIComponent(courseId)}`,
            { method: 'DELETE' }
        );
        if (!response.ok) {
            throw new Error(await readError(response));
        }

        await loadCourses();
        showStatus('Course deleted successfully.');
    } catch (error) {
        showStatus(error.message, true);
    }
});

loadCourses();
