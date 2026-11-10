import { Batch } from '../models/Batch.js';
import { Enrollment } from '../models/Enrollment.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Inquiry } from '../models/Inquiry.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { round2 } from '../utils/http.js';
import { withFeeState } from '../services/fees.js';

const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export async function getDashboard(_req, res) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const trendStart = new Date(now);
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - 13);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    activeStudents, runningBatches, newInquiries, pendingOnline, followUpsDue,
    monthPayments, admissionsTrend, recentStudents, unpaidFees,
  ] = await Promise.all([
    Student.countDocuments({ deletedAt: null, status: 'active' }),
    Batch.countDocuments({ deletedAt: null, status: 'active' }),
    Inquiry.countDocuments({ deletedAt: null, status: 'new' }),
    Inquiry.countDocuments({ deletedAt: null, webForm: 'online-admission', status: { $in: ['new', 'in-process'] } }),
    Inquiry.countDocuments({ deletedAt: null, status: { $in: ['new', 'in-process'] }, followUpDate: { $lte: todayEnd } }),
    Payment.aggregate([
      { $match: { deletedAt: null, status: 'success', paymentDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: { $add: ['$amount', { $ifNull: ['$lateFee', 0] }] } } } },
    ]),
    Student.aggregate([
      { $match: { deletedAt: null, admissionDate: { $gte: trendStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$admissionDate', timezone: TIME_ZONE } }, count: { $sum: 1 } } },
    ]),
    Student.find({ deletedAt: null }).populate('courseId', 'courseName').sort({ admissionDate: -1, createdAt: -1 }).limit(6),
    FeeStructure.find({ deletedAt: null, feeStatus: { $ne: 'paid' } })
      .populate('studentId', 'name studentId phone photo')
      .populate('courseId', 'courseName'),
  ]);

  const feeRows = unpaidFees.map(withFeeState).filter((fee) => fee.balance > 0);
  const pendingDues = round2(feeRows.reduce((total, fee) => total + fee.balance, 0));
  const overdue = feeRows.filter((fee) => fee.feeStatus === 'overdue').sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));

  const recentFees = await FeeStructure.find({ studentId: { $in: recentStudents.map((s) => s._id) }, deletedAt: null });
  const feeByStudent = new Map();
  for (const fee of recentFees.map(withFeeState)) {
    const key = String(fee.studentId);
    const prev = feeByStudent.get(key);
    feeByStudent.set(key, prev ? { ...prev, balance: prev.balance + fee.balance, feeStatus: fee.balance > 0 ? fee.feeStatus : prev.feeStatus } : fee);
  }
  const trendMap = new Map(admissionsTrend.map((row) => [row._id, row.count]));
  const trend = Array.from({ length: 14 }, (_, index) => {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + index);
    const key = d.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
    return { date: key, count: trendMap.get(key) || 0 };
  });

  const activeEnrollments = await Enrollment.countDocuments({ deletedAt: null, status: { $in: ['enrolled', 'in_progress'] } });

  res.json({
    kpis: {
      activeStudents,
      activeEnrollments,
      runningBatches,
      feesThisMonth: round2(monthPayments[0]?.total || 0),
      newInquiries,
      pendingOnline,
      followUpsDue,
      pendingDues,
      overdueCount: overdue.length,
    },
    trend,
    recentAdmissions: recentStudents.map((student) => {
      const fee = feeByStudent.get(student.id);
      return {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        course: student.courseId?.courseName || '—',
        admissionDate: student.admissionDate,
        feeStatus: fee ? (fee.balance > 0 ? fee.feeStatus : 'paid') : 'no_fee',
      };
    }),
    overdue: overdue.slice(0, 6).map((fee) => ({
      id: fee.id,
      student: fee.studentId,
      course: fee.courseId?.courseName,
      overdueAmount: fee.overdueAmount,
      balance: fee.balance,
      nextDueDate: fee.nextDueDate,
    })),
  });
}
