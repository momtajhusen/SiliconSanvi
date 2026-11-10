export const USER_ROLE = ['admin', 'staff'];
/** `institute` = Silicon, `traders` = Sanvi, `site` = shared contact on the combined landing page. */
export const COMPANY_KEY = ['institute', 'traders', 'site'];
export const SOCIAL_NETWORKS = ['facebook', 'instagram', 'youtube', 'x', 'linkedin'];
export const ENTITY_STATUS = ['active', 'inactive'];
export const COURSE_TYPE = ['certificate', 'diploma', 'short_course'];
export const COURSE_LEVEL = ['beginner', 'intermediate', 'advanced'];

export const BATCH_TYPE = ['regular', 'weekend', 'fast_track'];
export const BATCH_STATUS = ['upcoming', 'active', 'completed', 'cancelled'];
export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const GENDER = ['male', 'female', 'other'];
export const ENQUIRY_TYPE = ['course', 'cctv', 'products'];
export const WEB_FORM = ['contact', 'online-admission'];
export const LEAD_SOURCE = ['walk-in', 'phone', 'whatsapp', 'website', 'reference', 'social-media', 'other'];
export const LEAD_PRIORITY = ['hot', 'warm', 'cold'];
export const INQUIRY_STATUS = ['new', 'in-process', 'converted', 'closed'];
export const PREFERRED_BATCH = ['Morning', 'Afternoon', 'Evening'];

export const STUDENT_STATUS = ['active', 'completed', 'dropped', 'on_hold'];
export const STUDENT_SOURCE = ['office', 'inquiry', 'online-admission'];
export const DOCUMENT_TYPE = ['photo', 'id_proof', 'birth_certificate', 'academic_certificate', 'other'];

export const ENROLLMENT_STATUS = ['enrolled', 'in_progress', 'completed', 'dropped', 'suspended'];
export const ACTIVE_ENROLLMENT = ['enrolled', 'in_progress', 'suspended'];

export const FEE_STATUS = ['pending', 'partial', 'paid', 'overdue'];

/** Payment methods used in Nepal. */
export const PAYMENT_MODE = ['cash', 'esewa', 'khalti', 'fonepay', 'connect_ips', 'mobile_banking', 'bank_transfer', 'cheque', 'card'];
export const PAYMENT_FOR = ['course_fee', 'admission', 'exam', 'certificate', 'installment', 'other'];
export const PAYMENT_STATUS = ['success', 'pending', 'failed', 'refunded'];

/** Sanvi Computer and Traders (`traders`). Category slugs match the public website categories. */
export const PRODUCT_CATEGORY = ['laptops-desktops', 'components', 'monitors', 'printers', 'accessories', 'storage', 'networking', 'power', 'cctv', 'other'];
/** `purchase_return` = stock taken back off a purchase bill (bill edited, deleted or goods returned). */
export const STOCK_MOVE_TYPE = ['opening', 'purchase', 'purchase_return', 'adjustment', 'job', 'job_return'];
export const JOB_STATUS = ['scheduled', 'installed', 'cancelled'];
export const JOB_PAYMENT_STATUS = ['unpaid', 'partial', 'paid'];
