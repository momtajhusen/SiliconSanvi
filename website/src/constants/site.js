import {
  GraduationCap, Cctv, Cpu, Home, Store, Building2, Warehouse, Eye, MoonStar, Smartphone, HardDrive, Wifi, Wrench,
  MapPinned, ClipboardList, Hammer, ShieldCheck, Laptop, Monitor, Printer, Keyboard, Router, BatteryCharging,
  PcCase, MemoryStick, PackageCheck, Receipt, FileText, Tag, Truck, BadgeIndianRupee,
} from 'lucide-react';

export const BUSINESSES = {
  institute: {
    key: 'institute',
    name: 'Silicon Computer Institute',
    short: 'Silicon',
    kind: 'Computer Institute',
    home: '/silicon',
    to: '/courses',
    icon: GraduationCap,
    tone: 'blue',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-700',
    tagline: 'Learn computers. Build your career.',
    text: 'Our computer training institute. Practical, job-ready courses in a modern lab — from basic computer and MS Office to Tally with GST, DCA/ADCA, web development, Python and graphic design.',
    services: ['Basic computer & MS Office', 'Tally Prime with GST', 'DCA / ADCA diploma', 'Web development & Python', 'Graphic design & typing'],
    billing: 'Admission forms, fee receipts and course certificates',
    billingIcon: Receipt,
    cta: 'Explore courses',
  },
  traders: {
    key: 'traders',
    name: 'Sanvi Computer and Traders',
    short: 'Sanvi',
    kind: 'Computer & Traders',
    home: '/sanvi',
    to: '/products',
    icon: Store,
    tone: 'amber',
    accent: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600',
    tagline: 'Computers, CCTV & accessories.',
    text: 'Our computer sales and service business. Laptops, desktops, parts and accessories, plus CCTV supply and installation, networking, repair, upgrades and AMC for homes, shops and offices.',
    services: ['Laptops, desktops & custom PCs', 'Computer parts & accessories', 'CCTV supply & installation', 'Printers, networking & UPS', 'Repair, upgrades & AMC'],
    billing: 'Sales bills, quotations and installation invoices',
    billingIcon: FileText,
    cta: 'Browse products',
  },
};

export const SITE = {
  name: `${BUSINESSES.institute.name} & ${BUSINESSES.traders.name}`,
  shortName: `${BUSINESSES.institute.short} & ${BUSINESSES.traders.short}`,
  email: 'sanvicomputerandtraders765@gmail.com',
  phone: '+977 981-4869311',
  phoneHref: 'tel:+9779814869311',
  whatsapp: '+977 981-4869311',
  whatsappHref: 'https://wa.me/9779814869311',
  hours: 'Mon–Sat, 7 AM – 7 PM',
  address: 'Godaita- 7 Sarlahi',
  mapUrl: '',
  favicon: '',
  social: {},
};

export const SOCIAL_NETWORKS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'linkedin', label: 'LinkedIn' },
];

const CONTACT_FIELDS = ['phone', 'whatsapp', 'email', 'address', 'mapUrl', 'hours', 'favicon'];
const IDENTITY_FIELDS = ['name', 'short', 'kind', 'tagline', 'text', 'logo', 'registration'];

for (const info of Object.values(BUSINESSES)) {
  Object.assign(info, { logo: '', registration: '', social: {} });
  for (const field of CONTACT_FIELDS) info[field] = SITE[field];
  info.phoneHref = SITE.phoneHref;
  info.whatsappHref = SITE.whatsappHref;
}

const DEFAULTS = JSON.parse(JSON.stringify({ institute: BUSINESSES.institute, traders: BUSINESSES.traders, site: SITE }));

const digits = (value) => String(value || '').replace(/[^\d+]/g, '');

/** Applies company details saved in the admin "Company setup" page over the built-in defaults (blank = default). */
export function applyCompanyProfile(profiles = {}) {
  const targets = { institute: BUSINESSES.institute, traders: BUSINESSES.traders, site: SITE };
  for (const [key, target] of Object.entries(targets)) {
    const saved = profiles[key] || {};
    const fields = key === 'site' ? CONTACT_FIELDS : [...IDENTITY_FIELDS, ...CONTACT_FIELDS];
    for (const field of fields) target[field] = saved[field] || DEFAULTS[key][field];
    target.social = Object.fromEntries(SOCIAL_NETWORKS.map(({ key: network }) => [network, saved.social?.[network] || '']));
    target.phoneHref = `tel:${digits(target.phone)}`;
    target.whatsappHref = `https://wa.me/${digits(target.whatsapp || target.phone).replace(/^\+/, '')}`;
  }
  SITE.name = `${BUSINESSES.institute.name} & ${BUSINESSES.traders.name}`;
  SITE.shortName = `${BUSINESSES.institute.short} & ${BUSINESSES.traders.short}`;
}

export function companyDefaults(key) {
  return DEFAULTS[key];
}

/** The part of the full name after the short brand word, e.g. "Computer Institute". */
export function brandRest(info) {
  return info.name.startsWith(info.short) ? info.name.slice(info.short.length).trim() : info.name;
}

export const DIVISIONS = [
  {
    key: 'institute',
    business: 'institute',
    to: '/courses',
    icon: GraduationCap,
    tone: 'blue',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-700',
    title: 'Computer Institute',
    tagline: 'Learn job-ready skills',
    text: 'Basic computer, MS Office, Tally with GST, DCA/ADCA, web development, Python, graphic design and typing.',
    points: ['Certified courses', '1 student, 1 computer', 'Placement help'],
    cta: 'Explore courses',
  },
  {
    key: 'cctv',
    business: 'traders',
    to: '/cctv',
    icon: Cctv,
    tone: 'amber',
    accent: 'bg-gradient-to-r from-amber-400 to-orange-500',
    title: 'CCTV Installation',
    tagline: 'Secure your home & business',
    text: 'HD and night-vision cameras for homes, shops, offices, schools and warehouses — with live view on your phone.',
    points: ['Free site visit', 'Mobile live view', 'Service & AMC'],
    cta: 'View CCTV solutions',
  },
  {
    key: 'products',
    business: 'traders',
    to: '/products',
    icon: Cpu,
    tone: 'orange',
    accent: 'bg-gradient-to-r from-orange-400 to-orange-700',
    title: 'Computer Parts & Accessories',
    tagline: 'Genuine products, fair prices',
    text: 'Laptops, desktops, custom PCs, monitors, printers, storage, networking, UPS and every accessory you need.',
    points: ['Genuine brands', 'Warranty support', 'Upgrades & repair'],
    cta: 'Browse products',
  },
];

export const CCTV_SOLUTIONS = [
  { slug: 'home', icon: Home, tone: 'blue', accent: 'bg-blue-600', title: 'Home security', text: 'Keep an eye on your door, parking and family from anywhere using your phone.', points: ['2–4 cameras', 'Night vision', 'Phone alerts'] },
  { slug: 'shop', icon: Store, tone: 'amber', accent: 'bg-amber-400', title: 'Shops & showrooms', text: 'Cover the counter, cash desk and entrance to prevent theft and settle disputes.', points: ['Counter coverage', 'Clear face capture', '30-day recording'] },
  { slug: 'office', icon: Building2, tone: 'violet', accent: 'bg-violet-400', title: 'Offices & schools', text: 'Multi-camera setups for corridors, classrooms, reception and entry gates.', points: ['8–16 cameras', 'Central monitoring', 'Audio options'] },
  { slug: 'warehouse', icon: Warehouse, tone: 'slate', accent: 'bg-slate-500', title: 'Warehouses & factories', text: 'Long-range and IP cameras for large areas, gates and loading bays.', points: ['IP / NVR systems', 'Long-range IR', 'Weatherproof'] },
];

export const CCTV_FEATURES = [
  { icon: Eye, title: 'Full HD clarity', text: '2MP to 5MP cameras that capture faces and number plates clearly.' },
  { icon: MoonStar, title: 'Night vision', text: 'Infrared and colour night-vision cameras for 24×7 coverage.' },
  { icon: Smartphone, title: 'Live view on mobile', text: 'Watch live and recorded video on your phone — we set up the app for you.' },
  { icon: HardDrive, title: 'DVR / NVR recording', text: 'Continuous recording with the right hard disk for 15–30 days of footage.' },
  { icon: Wifi, title: 'Wi-Fi & IP cameras', text: 'Wireless and IP cameras where running cables is difficult.' },
  { icon: Wrench, title: 'Service & AMC', text: 'Quick repairs, health checks and annual maintenance contracts.' },
];

export const CCTV_PACKAGES = [
  { slug: '2-camera', title: 'Starter', cameras: '2 cameras', ideal: 'Small home or shop', features: ['2 HD cameras', '4-channel DVR', '500 GB hard disk', 'Mobile app setup'] },
  { slug: '4-camera', title: 'Standard', cameras: '4 cameras', ideal: 'Home, shop or clinic', popular: true, features: ['4 HD night-vision cameras', '4-channel DVR', '1 TB hard disk', 'Mobile app setup'] },
  { slug: '8-camera', title: 'Business', cameras: '8 cameras', ideal: 'Office, school or showroom', features: ['8 HD night-vision cameras', '8-channel DVR', '2 TB hard disk', 'Monitor connection'] },
  { slug: 'custom', title: 'Custom / IP', cameras: '16+ cameras', ideal: 'Warehouse, factory or campus', features: ['IP cameras & NVR', 'Long-range / PTZ options', 'Networking & cabling', 'Site survey & design'] },
];

export const CCTV_STEPS = [
  { icon: MapPinned, label: 'Free site visit', hint: 'We check your space', tone: 'from-blue-500 to-blue-700' },
  { icon: ClipboardList, label: 'Plan & quote', hint: 'Right cameras, clear price', tone: 'from-blue-700 to-blue-900' },
  { icon: Hammer, label: 'Installation', hint: 'Neat wiring, same day', tone: 'from-amber-400 to-orange-500' },
  { icon: Smartphone, label: 'Mobile setup', hint: 'Live view on your phone', tone: 'from-violet-500 to-purple-500' },
  { icon: ShieldCheck, label: 'Service & AMC', hint: 'Support after install', tone: 'from-blue-900 to-blue-600' },
];

export const CCTV_BRANDS = ['CP Plus', 'Hikvision', 'Dahua', 'Godrej', 'Honeywell', 'Seagate SkyHawk', 'WD Purple'];

export const PRODUCT_CATEGORIES = [
  { slug: 'laptops-desktops', icon: Laptop, tone: 'blue', title: 'Laptops & Desktops', items: ['New laptops', 'Branded desktops', 'Refurbished options'] },
  { slug: 'components', icon: Cpu, tone: 'violet', title: 'PC Components', items: ['Processors & motherboards', 'RAM & SSD', 'Cabinets & SMPS'] },
  { slug: 'monitors', icon: Monitor, tone: 'sky', title: 'Monitors', items: ['LED / IPS monitors', 'Gaming monitors', 'Stands & cables'] },
  { slug: 'printers', icon: Printer, tone: 'amber', title: 'Printers & Ink', items: ['Ink tank & laser', 'Ink & toner', 'Scanners'] },
  { slug: 'accessories', icon: Keyboard, tone: 'rose', title: 'Keyboards & Mice', items: ['Keyboards & mice', 'Webcams & headsets', 'Speakers'] },
  { slug: 'storage', icon: HardDrive, tone: 'slate', title: 'Storage', items: ['SSD & hard disks', 'Pen drives', 'Memory cards'] },
  { slug: 'networking', icon: Router, tone: 'emerald', title: 'Networking', items: ['Wi-Fi routers', 'Switches & LAN cable', 'Range extenders'] },
  { slug: 'power', icon: BatteryCharging, tone: 'orange', title: 'UPS & Power', items: ['UPS & inverters', 'Batteries', 'Surge protectors'] },
];

export const PRODUCT_SERVICES = [
  { icon: PcCase, title: 'Custom PC build', text: 'Office, student, gaming or editing PCs assembled to your budget.' },
  { icon: MemoryStick, title: 'Upgrades', text: 'Make old computers fast again with SSD and RAM upgrades.' },
  { icon: Wrench, title: 'Repair & servicing', text: 'Laptop and desktop repair, OS installation and cleaning.' },
  { icon: PackageCheck, title: 'Genuine & warranty', text: 'Original products with bill and brand warranty support.' },
];

export const PRODUCT_PROMISES = [
  { icon: ShieldCheck, label: 'Genuine products with bill' },
  { icon: BadgeIndianRupee, label: 'Fair, transparent prices' },
  { icon: Tag, label: 'Brand warranty support' },
  { icon: Truck, label: 'Local delivery & setup' },
];

export const PRODUCT_BRANDS = ['HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Canon', 'Epson', 'Logitech', 'TP-Link', 'Kingston', 'Seagate', 'WD'];

export const ENQUIRY_TYPES = [
  { value: 'course', label: 'Course admission', business: 'institute' },
  { value: 'cctv', label: 'CCTV installation', business: 'traders' },
  { value: 'products', label: 'Computer parts & accessories', business: 'traders' },
];

export function businessForEnquiry(type) {
  const match = ENQUIRY_TYPES.find((item) => item.value === type);
  return BUSINESSES[match?.business || 'institute'];
}

export const PROPERTY_TYPES = ['Home', 'Shop / showroom', 'Office', 'School / institute', 'Warehouse / factory', 'Other'];
