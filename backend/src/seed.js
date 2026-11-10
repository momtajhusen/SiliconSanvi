import bcrypt from 'bcryptjs';
import { Batch } from './models/Batch.js';
import { Course } from './models/Course.js';
import { User } from './models/User.js';
import { nextCode } from './models/Counter.js';

/** Slugs match the public website course list (website/src/constants/courses.js). */
const COURSES = [
  { courseCode: 'BCC', slug: 'basic-computer', courseName: 'Basic Computer Course', durationMonths: 3, baseFee: 4500, courseType: 'certificate', level: 'beginner' },
  { courseCode: 'MSO', slug: 'ms-office', courseName: 'MS Office (Word, Excel, PowerPoint)', durationMonths: 3, baseFee: 5000, courseType: 'certificate', level: 'beginner' },
  { courseCode: 'TALLY', slug: 'tally', courseName: 'Tally Prime with GST', durationMonths: 3, baseFee: 6500, courseType: 'certificate', level: 'intermediate' },
  { courseCode: 'DCA', slug: 'dca-adca', courseName: 'DCA / ADCA Diploma', durationMonths: 12, baseFee: 15000, courseType: 'diploma', level: 'intermediate' },
  { courseCode: 'WEB', slug: 'web-development', courseName: 'Web Development', durationMonths: 6, baseFee: 18000, courseType: 'certificate', level: 'advanced' },
  { courseCode: 'PY', slug: 'python', courseName: 'Python Programming', durationMonths: 4, baseFee: 12000, courseType: 'certificate', level: 'intermediate' },
  { courseCode: 'GD', slug: 'graphic-design', courseName: 'Graphic Design', durationMonths: 4, baseFee: 10000, courseType: 'certificate', level: 'intermediate' },
  { courseCode: 'TYP', slug: 'typing', courseName: 'Typing (English & Hindi)', durationMonths: 2, baseFee: 2000, courseType: 'short_course', level: 'beginner' },
];

const BATCHES = [
  { courseCode: 'BCC', batchName: 'Basic Computer · Morning', timingFrom: '07:00', timingTo: '08:00' },
  { courseCode: 'TALLY', batchName: 'Tally · Evening', timingFrom: '17:00', timingTo: '18:00' },
  { courseCode: 'DCA', batchName: 'DCA · Day', timingFrom: '11:00', timingTo: '12:30' },
];

export async function seed() {
  if (!(await User.estimatedDocumentCount())) {
    const email = (process.env.ADMIN_EMAIL || 'admin@silicon.in').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    await User.create({ name: process.env.ADMIN_NAME || 'SANVI Admin', email, passwordHash: await bcrypt.hash(password, 10), role: 'admin' });
    console.log(`Seeded admin user: ${email}`);
  }

  if (!(await Course.estimatedDocumentCount())) {
    await Course.insertMany(COURSES.map((course, index) => ({ ...course, admissionFee: 500, examFee: 300, sortOrder: index })));
    const byCode = new Map((await Course.find()).map((course) => [course.courseCode, course._id]));
    const startDate = new Date();
    startDate.setDate(1);
    for (const batch of BATCHES) {
      await Batch.create({
        batchCode: await nextCode('BAT', 3),
        batchName: batch.batchName,
        courseId: byCode.get(batch.courseCode),
        startDate,
        timingFrom: batch.timingFrom,
        timingTo: batch.timingTo,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        maxStrength: 20,
        status: 'active',
      });
    }
    console.log(`Seeded ${COURSES.length} courses and ${BATCHES.length} batches`);
  }
}
