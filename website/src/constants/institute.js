export const GENDERS = ['male', 'female', 'other'];
export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const COURSE_TYPES = ['certificate', 'diploma', 'short_course'];
export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'];
export const ENTITY_STATUSES = ['active', 'inactive'];

export const BATCH_TYPES = ['regular', 'weekend', 'fast_track'];
export const BATCH_STATUSES = ['upcoming', 'active', 'completed', 'cancelled'];

export const ENQUIRY_TYPES = [
  { value: 'course', label: 'Course' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'products', label: 'Computer parts' },
];
export const LEAD_SOURCES = ['walk-in', 'phone', 'whatsapp', 'website', 'reference', 'social-media', 'other'];
export const LEAD_PRIORITIES = ['hot', 'warm', 'cold'];
export const INQUIRY_STATUSES = ['new', 'in-process', 'converted', 'closed'];
export const PREFERRED_BATCHES = ['Morning', 'Afternoon', 'Evening'];

export const STUDENT_STATUSES = ['active', 'completed', 'dropped', 'on_hold'];
export const STUDENT_SOURCES = ['office', 'inquiry', 'online-admission'];
export const GUARDIAN_RELATIONS = ['Father', 'Mother', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother', 'Husband', 'Wife', 'Guardian', 'Other'];
export const QUALIFICATIONS = [
  'Below Class 5', 'Class 5–9', 'Class 10 (running)', 'Class 10 passed', 'Class 11', 'Class 12',
  'Diploma', 'Bachelor (running)', 'Bachelor (complete)', 'Master', 'Other',
];
export const DOCUMENT_TYPES = [
  { value: 'photo', label: 'Passport photo' },
  { value: 'id_proof', label: 'ID proof (Aadhaar etc.)' },
  { value: 'birth_certificate', label: 'Birth certificate' },
  { value: 'academic_certificate', label: 'Academic certificate / marksheet' },
  { value: 'other', label: 'Other' },
];

export const ENROLLMENT_STATUSES = ['enrolled', 'in_progress', 'completed', 'dropped', 'suspended'];
export const FEE_STATUSES = ['pending', 'partial', 'paid', 'overdue'];

/** Payment methods used in Nepal; keep in sync with the backend `PAYMENT_MODE`. */
export const PAYMENT_MODE_LABELS = {
  cash: 'Cash',
  esewa: 'eSewa',
  khalti: 'Khalti',
  fonepay: 'Fonepay QR',
  connect_ips: 'connectIPS',
  mobile_banking: 'Mobile banking',
  bank_transfer: 'Bank deposit / transfer',
  cheque: 'Cheque',
  card: 'Card (POS)',
};
export const PAYMENT_MODES = Object.keys(PAYMENT_MODE_LABELS);
export const paymentModeLabel = (mode) => PAYMENT_MODE_LABELS[mode] || String(mode || '').replace(/_/g, ' ');
export const PAYMENT_FOR = ['course_fee', 'installment', 'admission', 'exam', 'certificate', 'other'];
export const PAYMENT_STATUSES = ['success', 'pending', 'failed', 'refunded'];

export const FEE_COMPONENTS = [
  { key: 'courseFee', label: 'Course fee' },
  { key: 'admissionFee', label: 'Admission fee' },
  { key: 'examFee', label: 'Exam fee' },
  { key: 'certificateFee', label: 'Certificate fee' },
  { key: 'otherFees', label: 'Other fees' },
];
