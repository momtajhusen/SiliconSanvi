import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';
import * as courses from '../controllers/courses.controller.js';
import * as batches from '../controllers/batches.controller.js';
import * as inquiries from '../controllers/inquiries.controller.js';
import * as students from '../controllers/students.controller.js';
import * as enrollments from '../controllers/enrollments.controller.js';
import * as fees from '../controllers/fees.controller.js';
import * as payments from '../controllers/payments.controller.js';
import * as dashboard from '../controllers/dashboard.controller.js';
import * as pub from '../controllers/public.controller.js';
import * as uploads from '../controllers/uploads.controller.js';
import * as company from '../controllers/company.controller.js';
import * as traders from '../controllers/traders.controller.js';
import * as tradersReports from '../controllers/traders.reports.controller.js';
import * as tradersPurchases from '../controllers/traders.purchases.controller.js';
import * as instituteReports from '../controllers/institute.reports.controller.js';
import * as siteImages from '../controllers/siteImages.controller.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many login attempts. Try again in a few minutes.' } });
const formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many submissions. Please call us instead.' } });
const generateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many images generated. Wait a few minutes and try again.' } });

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Silicon Computer Institute & Sanvi Computer and Traders',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

router.post('/auth/login', loginLimiter, auth.login);
router.get('/auth/me', requireAuth, auth.me);

router.get('/public/courses', pub.publicCourses);
router.get('/public/company', company.publicCompany);
router.get('/public/products', traders.publicProducts);
router.get('/public/site-images', siteImages.publicSiteImages);
router.post('/public/inquiries', formLimiter, pub.publicInquiry);
router.post('/public/admissions', formLimiter, pub.publicAdmission);

const admin = Router();
admin.use(requireAuth);

admin.get('/dashboard', dashboard.getDashboard);
admin.get('/institute/overview', instituteReports.instituteOverview);
admin.get('/institute/reports', instituteReports.instituteReport);

admin.post('/uploads/image', uploadImage, uploads.uploadImage);
admin.post('/uploads/file', uploadImage, uploads.uploadImage);

admin.get('/site-images', siteImages.listSiteImages);
admin.put('/site-images/:key', siteImages.saveSiteImage);
admin.patch('/site-images/:key', siteImages.updateSiteImage);
admin.delete('/site-images/:key', siteImages.deleteSiteImage);
admin.post('/site-images/:key/generate', generateLimiter, siteImages.generateSiteImage);

admin.get('/company', company.getCompany);
admin.put('/company/:key', company.updateCompany);

admin.get('/courses', courses.listCourses);
admin.post('/courses', courses.createCourse);
admin.get('/courses/:id', courses.getCourse);
admin.patch('/courses/:id', courses.updateCourse);
admin.delete('/courses/:id', courses.deleteCourse);

admin.get('/batches', batches.listBatches);
admin.post('/batches', batches.createBatch);
admin.get('/batches/:id', batches.getBatch);
admin.patch('/batches/:id', batches.updateBatch);
admin.delete('/batches/:id', batches.deleteBatch);
admin.post('/batches/:id/complete', batches.completeBatch);

admin.get('/inquiries', inquiries.listInquiries);
admin.post('/inquiries', inquiries.createInquiry);
admin.get('/inquiries/:id', inquiries.getInquiry);
admin.patch('/inquiries/:id', inquiries.updateInquiry);
admin.delete('/inquiries/:id', inquiries.deleteInquiry);
admin.post('/inquiries/:id/convert', inquiries.convertInquiry);
admin.post('/inquiries/:id/follow-ups', inquiries.addFollowUp);
admin.get('/admissions/online', inquiries.onlineAdmissionQueue);

admin.get('/students', students.listStudents);
admin.post('/students', students.createStudent);
admin.get('/students/:id', students.getStudent);
admin.patch('/students/:id', students.updateStudent);
admin.delete('/students/:id', students.deleteStudent);
admin.post('/students/:id/documents', students.addDocument);
admin.delete('/students/:id/documents/:docId', students.removeDocument);

admin.get('/enrollments', enrollments.listEnrollments);
admin.post('/enrollments', enrollments.createEnrollment);
admin.get('/enrollments/:id', enrollments.getEnrollment);
admin.patch('/enrollments/:id', enrollments.updateEnrollment);
admin.delete('/enrollments/:id', enrollments.deleteEnrollment);

admin.get('/fees', fees.listFees);
admin.get('/fees/dues', fees.feeDues);
admin.post('/fees', fees.createFee);
admin.get('/fees/:id', fees.getFee);
admin.patch('/fees/:id', fees.updateFee);
admin.delete('/fees/:id', fees.deleteFee);

admin.get('/payments', payments.listPayments);
admin.post('/payments', payments.createPayment);
admin.get('/payments/:id', payments.getPayment);
admin.patch('/payments/:id', payments.updatePayment);
admin.delete('/payments/:id', payments.deletePayment);

admin.get('/traders/overview', traders.tradersOverview);
admin.get('/traders/reports', tradersReports.tradersReport);

admin.get('/traders/products', traders.listProducts);
admin.post('/traders/products', traders.createProduct);
admin.get('/traders/products/:id', traders.getProduct);
admin.patch('/traders/products/:id', traders.updateProduct);
admin.delete('/traders/products/:id', traders.deleteProduct);
admin.post('/traders/products/:id/stock', traders.addStock);
admin.get('/traders/stock/moves', traders.listStockMoves);

admin.get('/traders/suppliers', tradersPurchases.listSuppliers);
admin.post('/traders/suppliers', tradersPurchases.createSupplier);
admin.patch('/traders/suppliers/:id', tradersPurchases.updateSupplier);
admin.delete('/traders/suppliers/:id', tradersPurchases.deleteSupplier);

admin.get('/traders/purchases', tradersPurchases.listPurchases);
admin.post('/traders/purchases', tradersPurchases.createPurchase);
admin.get('/traders/purchases/:id', tradersPurchases.getPurchase);
admin.patch('/traders/purchases/:id', tradersPurchases.updatePurchase);
admin.delete('/traders/purchases/:id', tradersPurchases.deletePurchase);
admin.post('/traders/purchases/:id/payments', tradersPurchases.addPurchasePayment);
admin.delete('/traders/purchases/:id/payments/:paymentId', tradersPurchases.deletePurchasePayment);

admin.get('/traders/partners', traders.listPartners);
admin.post('/traders/partners', traders.createPartner);
admin.get('/traders/partners/:id', traders.getPartner);
admin.patch('/traders/partners/:id', traders.updatePartner);
admin.delete('/traders/partners/:id', traders.deletePartner);

admin.get('/traders/jobs', traders.listJobs);
admin.post('/traders/jobs', traders.createJob);
admin.get('/traders/jobs/:id', traders.getJob);
admin.patch('/traders/jobs/:id', traders.updateJob);
admin.delete('/traders/jobs/:id', traders.deleteJob);
admin.post('/traders/jobs/:id/payments', traders.addJobPayment);
admin.delete('/traders/jobs/:id/payments/:paymentId', traders.deleteJobPayment);

router.use('/admin', admin);

export default router;
