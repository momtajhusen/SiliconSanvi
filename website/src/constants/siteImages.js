// Every image slot on the public website. Keys must match backend/src/constants/siteImages.js.
// A starter photo dropped in website/public/site-images/<key>.jpg (and listed in BUNDLED) shows until an
// image is saved in the admin panel. Slots with neither keep their built-in icon / illustration design.

export const IMAGE_SHAPES = {
  landscape: { label: 'Landscape 3:2', ratio: 'aspect-[3/2]', size: '1536 × 1024' },
  square: { label: 'Square 1:1', ratio: 'aspect-square', size: '1024 × 1024' },
};

export const SITE_IMAGE_PAGES = [
  { page: 'Home', path: '/' },
  { page: 'Courses', path: '/courses' },
  { page: 'CCTV', path: '/cctv' },
  { page: 'Products', path: '/products' },
  { page: 'About', path: '/about' },
  { page: 'Contact', path: '/contact' },
  { page: 'Admission', path: '/admission' },
];

const course = (title, focus, scene) => ({
  page: 'Courses', business: 'institute', shape: 'landscape',
  section: `Course card — ${title} (Home, Courses and Silicon pages)`, alt: `${title} class at Silicon Computer Institute`, focus, scene,
});
const category = (title, focus, scene) => ({
  page: 'Products', business: 'traders', shape: 'landscape',
  section: `Category card — ${title} (Home, Products and Sanvi pages)`, alt: `${title} at Sanvi Computer and Traders`, focus, scene,
});
const solution = (title, focus, scene) => ({
  page: 'CCTV', business: 'traders', shape: 'landscape', section: `Solution card — ${title}`, alt: `CCTV for ${title.toLowerCase()} by Sanvi Computer and Traders`, focus, scene,
});

export const SITE_IMAGES = {
  'home-hero-institute': {
    page: 'Home', business: 'institute', shape: 'landscape', section: 'Page hero — large slideshow photo (Silicon slide)',
    alt: 'Students learning at Silicon Computer Institute',
    focus: 'Silicon Computer Institute — a modern, well-equipped computer training lab with one computer per student and practical, hands-on classes.',
    scene: 'Wide view of a modern computer lab: neat rows of identical desktop computers on clean white desks, one computer per seat, screens showing abstract lesson slides, spreadsheets and code, a large wall screen at the front. Royal-blue accent wall, golden-yellow chairs, bright daylight from big windows. A few students in casual T-shirts work at the computers, seen from the side or behind and softly out of focus — the lab and computers are the hero.',
  },
  'home-hero-traders': {
    page: 'Home', business: 'traders', shape: 'landscape', section: 'Page hero — large slideshow photo (Sanvi slide)',
    alt: 'Laptops and computer accessories at Sanvi Computer and Traders',
    focus: 'Sanvi Computer and Traders — a well-stocked shop for laptops, desktops, computer parts, accessories and CCTV cameras.',
    scene: 'Interior of a premium computer shop: glass display shelves full of laptops, desktop monitors, printers, boxed keyboards and mice, plus a shelf of white dome and bullet CCTV cameras with a DVR box, and a clean sales counter with an open demo laptop. Warm amber shelf lighting against a deep navy wall. A shop assistant in an orange polo appears only small in the soft-focus background.',
  },
  'home-gallery-lab': {
    page: 'Home', business: 'institute', shape: 'landscape', section: 'Photo gallery — large card: our computer lab',
    alt: 'Students learning in the Silicon Computer Institute lab',
    focus: 'Our computer lab — modern desktops, one computer per student.',
    scene: 'Inviting view along a row of desktop computers in the institute lab, each screen showing a different abstract lesson (spreadsheet grid, code blocks, design canvas), keyboards and mice neatly placed, headphones beside each seat. Students’ hands and shoulders in casual T-shirts at the keyboards, faces out of frame or blurred. Royal-blue accent wall, golden-yellow details, daylight.',
  },
  'home-gallery-cctv': {
    page: 'Home', business: 'traders', shape: 'square', section: 'Photo gallery — small card: CCTV installation',
    alt: 'Technician installing a CCTV camera',
    focus: 'Professional CCTV installation with neat wiring.',
    scene: 'Close-up of a white dome CCTV camera being fixed to a shop’s outer wall: the camera, its mounting bracket, neatly clipped cable and a screwdriver in a technician’s hand (orange sleeve visible). Warm golden late-afternoon sun, deep blue sky behind.',
  },
  'home-gallery-shop': {
    page: 'Home', business: 'traders', shape: 'square', section: 'Photo gallery — small card: our computer shop',
    alt: 'Sanvi Computer and Traders shop counter with laptops',
    focus: 'Our computer shop — genuine laptops, monitors and accessories on display.',
    scene: 'A glass sales counter with an open laptop on display, boxed accessories and neatly stacked products; shelves behind lined with laptops, monitors, keyboards, mice and printers. Warm amber lighting, dark navy wall. Only the hands of a salesman and customer appear over the laptop.',
  },
  'home-gallery-repair': {
    page: 'Home', business: 'traders', shape: 'square', section: 'Photo gallery — small card: repair & PC build',
    alt: 'Technician building a custom PC',
    focus: 'Computer repair, upgrades and custom PC builds.',
    scene: 'Close-up of a technician’s hands installing a RAM stick into the motherboard of an open desktop PC on a dark navy anti-static mat. Neat tools, a screwdriver set, an SSD and a graphics card beside it, warm amber work light.',
  },
  'home-gallery-certificate': {
    page: 'Home', business: 'institute', shape: 'square', section: 'Photo gallery — small card: certificates',
    alt: 'Student receiving a course certificate',
    focus: 'Certified courses — every student earns a course certificate.',
    scene: 'A framed course certificate (blank, no readable text) with a golden seal and ribbon, held in a student’s hands in sharp focus in the foreground; a computer lab with royal-blue walls blurred behind, warm golden light. The student’s smile only partly visible and out of focus.',
  },
  'service-institute': {
    page: 'Home', business: 'institute', shape: 'landscape', section: 'Service card — Computer Institute (Home and About)',
    alt: 'Computer class in progress',
    focus: 'Computer Institute service — practical computer classes in a modern lab.',
    scene: 'A computer class in session seen from the back of the room: a large front screen showing an abstract spreadsheet lesson, the teacher small in frame pointing at it, rows of desktop computers with students in casual T-shirts following along. Royal-blue and white room, golden-yellow accents, bright daylight.',
  },
  'service-cctv': {
    page: 'Home', business: 'traders', shape: 'landscape', section: 'Service card — CCTV Installation (Home and About)',
    alt: 'CCTV live view on a phone',
    focus: 'CCTV installation with live view on your mobile phone.',
    scene: 'Close-up of a smartphone in a hand showing a 4-camera CCTV live view grid (abstract scenes only), with a bullet CCTV camera mounted above a shop entrance sharply visible behind it. Terai market street at dusk, warm amber shop lights, deep blue sky.',
  },
  'service-products': {
    page: 'Home', business: 'traders', shape: 'landscape', section: 'Service card — Computer Parts & Accessories (Home and About)',
    alt: 'Computer parts and accessories on display',
    focus: 'Computer parts and accessories — everything for your computer.',
    scene: 'A neat flat-lay on a dark navy table: a laptop, a mechanical keyboard, a wireless mouse, an SSD, RAM sticks, a router, headphones and a webcam, arranged in a clean grid. Soft warm amber accent light. No people.',
  },

  'course-basic-computer': course('Basic Computer Course',
    'Basic Computer Course — computer fundamentals, Windows and files, internet and email, typing practice.',
    'A desktop computer on a classroom desk whose screen shows a simple Windows-style desktop with folder icons, an open file-explorer window and an email inbox layout (abstract, no text); keyboard, mouse and a beginner’s notebook beside it. A beginner student’s hand on the mouse and a teacher’s hand pointing at the screen. Royal-blue wall, golden-yellow accents.'),
  'course-ms-office': course('MS Office',
    'MS Office course — Word documents, Excel formulas and charts, PowerPoint presentations.',
    'A monitor and laptop on a desk showing three office apps: a document page with paragraph blocks, a spreadsheet with highlighted cells and a bar chart, and a presentation slide with a chart (all abstract, no readable text); printed charts and a notebook beside them. A student’s hands typing. Blue and golden-toned charts, bright classroom.'),
  'course-tally': course('Tally Prime with GST',
    'Tally Prime with GST — accounting, vouchers and ledgers, GST invoicing, reports.',
    'A computer screen showing an abstract accounting ledger and invoice layout with columns and totals (no readable text), beside it a calculator, a bill book, receipts, a printed invoice and a stamp pad. A student’s hands entering figures on the keyboard. Navy-blue desk, golden-yellow accents.'),
  'course-dca-adca': course('DCA / ADCA Diploma',
    'DCA / ADCA diploma — complete computer applications: Office, Tally, programming basics and a final project.',
    'A diploma final project shown on a large monitor in the lab: a dashboard combining a spreadsheet, a chart and a code window (abstract), with a printed project report and a diploma folder on the desk. Classmates in casual T-shirts watch from the side, softly out of focus. Royal-blue lab with golden-yellow accents.'),
  'course-web-development': course('Web Development',
    'Web Development course — HTML, CSS, JavaScript and React, building and publishing real websites.',
    'A dual-monitor developer desk: the left screen shows abstract code lines in blue and golden tones, the right screen a clean responsive website layout, with the same site on a phone propped beside it. Keyboard, mouse and sketch notes with simple wireframes (no text). A student’s hands on the keyboard. Navy-blue wall, small plant.'),
  'course-python': course('Python Programming',
    'Python Programming course — Python basics to OOP, files and data, mini projects.',
    'A laptop screen showing abstract code blocks in blue and golden tones next to a simple data chart window and a small terminal window, a notebook with flow-chart sketches beside it. A student’s hands typing. Golden desk lamp, navy-blue room.'),
  'course-graphic-design': course('Graphic Design',
    'Graphic Design course — Photoshop, Illustrator and CorelDRAW for posters, logos and social media designs.',
    'A large monitor showing an abstract design workspace with a poster layout, logo shapes and colour panels in royal blue and golden yellow, a drawing tablet with a stylus in a student’s hand, printed poster proofs and colour swatches on the desk.'),
  'course-typing': course('Typing',
    'Typing course — English and Hindi touch typing with speed tests for government exams.',
    'Close-up of hands typing on a keyboard in correct touch-typing position (fingers on the home row), a monitor in soft focus showing abstract typing-test lines and a speed gauge, a stopwatch on the desk. Navy-blue desk mat, crisp light with a golden rim.'),

  'cctv-hero': {
    page: 'CCTV', business: 'traders', shape: 'landscape', section: 'Page hero — large photo next to the title',
    alt: 'CCTV cameras protecting a home and shop',
    focus: 'CCTV cameras that keep you safe 24×7 — HD and night-vision cameras for homes and shops, with live view on your phone.',
    scene: 'A modern two-storey concrete house with a ground-floor shop in a flat Terai town at dusk, white dome and bullet CCTV cameras clearly visible at the corners with a subtle glowing detection cone; in the foreground a hand holds a phone showing a 4-camera live view (abstract). Warm amber lights in the windows, deep navy evening sky with a golden glow on the horizon.',
  },
  'cctv-home': solution('Homes',
    'Home security — watch your door, parking and family from your phone.',
    'A white dome CCTV camera mounted above the front gate of a Terai family home, sharp in the foreground; at the doorway, small and softly blurred, a mother checks the live view on her phone. Evening, warm amber porch light.'),
  'cctv-shop': solution('Shops & showrooms',
    'Shop CCTV — covers the counter, cash desk and entrance.',
    'A dome CCTV camera on a shop ceiling, sharp in the foreground, overlooking the cash counter and entrance of a small retail shop in a Madhesh market; the shopkeeper and a customer small and blurred behind. Bright, warm amber lighting.'),
  'cctv-office': solution('Offices & schools',
    'Multi-camera CCTV for offices and schools with central monitoring.',
    'A school corridor or office reception with a ceiling CCTV camera and a security desk monitor showing an abstract multi-camera grid. Clean and organised, navy walls with warm amber lights. No people.'),
  'cctv-warehouse': solution('Warehouses & factories',
    'Long-range and IP CCTV for warehouses, gates and loading bays.',
    'A large warehouse with tall racks of boxes and a long-range bullet CCTV camera mounted high on a pillar, a forklift in soft focus. Industrial but clean, warm amber overhead lights. No people.'),

  'products-hero': {
    page: 'Products', business: 'traders', shape: 'landscape', section: 'Page hero — large photo next to the title',
    alt: 'Laptops and computer accessories at Sanvi',
    focus: 'Genuine computer parts at fair prices — laptops, desktops, custom PCs, monitors, printers, storage, networking, UPS and accessories with bill and warranty.',
    scene: 'A premium computer store display wall: lit shelves with laptops, desktop monitors, a custom PC with a glass side panel, printers, Wi-Fi routers, UPS units and boxed accessories, all neatly arranged; sealed product boxes (no logos) on the counter. Warm amber shelf lighting against a deep navy backdrop. No people.',
  },
  'category-laptops-desktops': category('Laptops & Desktops', 'New laptops, branded desktops and refurbished options.', 'A sleek open laptop and an all-in-one desktop side by side on a dark surface, soft amber rim light, minimal deep navy background.'),
  'category-components': category('PC Components', 'Processors, motherboards, RAM, SSD, cabinets and SMPS.', 'A processor, a motherboard, RAM sticks, an SSD and a graphics card arranged neatly on a dark surface with dramatic warm amber lighting.'),
  'category-monitors': category('Monitors', 'LED / IPS and gaming monitors with stands and cables.', 'A wide IPS monitor on a stand showing a warm golden abstract wallpaper, with a smaller monitor beside it, on a tidy dark desk.'),
  'category-printers': category('Printers & Ink', 'Ink-tank and laser printers, ink, toner and scanners.', 'An ink-tank printer printing a golden-yellow page, with ink bottles and a ream of paper beside it on a dark office table, warm amber light.'),
  'category-accessories': category('Keyboards & Mice', 'Keyboards, mice, webcams, headsets and speakers.', 'A keyboard, a wireless mouse, a headset, a webcam and speakers arranged on a dark desk mat with amber accent lighting, product-photography style.'),
  'category-storage': category('Storage', 'SSDs, hard disks, pen drives and memory cards.', 'External hard disks, an SSD, pen drives and memory cards arranged on a dark surface with warm amber highlights, product-photography style.'),
  'category-networking': category('Networking', 'Wi-Fi routers, switches, LAN cable and range extenders.', 'A Wi-Fi router with antennas and amber status lights, a network switch and coiled LAN cables on a dark desk.'),
  'category-power': category('UPS & Power', 'UPS, inverters, batteries and surge protectors.', 'A UPS unit, an inverter battery and a surge-protector power strip next to a desktop PC, clean product setup on a dark background with warm amber light.'),

  'courses-hero': {
    page: 'Courses', business: 'institute', shape: 'landscape', section: 'Page hero — large photo next to the title',
    alt: 'Happy students at Silicon Computer Institute',
    focus: 'Practical courses, real skills — short-term and diploma computer courses taught hands-on in a lab.',
    scene: 'A hands-on lab desk filled with course work: a laptop showing an abstract spreadsheet, a second screen with code and a design canvas, course books, a certificate folder and notebooks. Three students in casual T-shirts work together around it, shown from the shoulders down or at a side angle with faces soft. Royal-blue wall, golden-yellow accents, bright daylight.',
  },
  'about-team': {
    page: 'About', business: 'both', shape: 'landscape', section: 'Page hero — large photo next to the title',
    alt: 'The Silicon and Sanvi team',
    focus: 'Learning, security and technology under one roof — a computer institute and a computer and CCTV shop run by one local team.',
    scene: 'A combined interior: on one side a bright computer lab with rows of desktops and a royal-blue wall, on the other a computer and CCTV shop counter with laptops and cameras on shelves under amber light. A small team stands in the middle, smaller in frame — teachers in royal-blue shirts and technicians in orange polos. Bright and welcoming.',
  },
  'contact-office': {
    page: 'Contact', business: 'both', shape: 'landscape', section: 'Page hero — large photo next to the title',
    alt: 'Our front desk is ready to help',
    focus: 'Contact us — send an enquiry for a course, CCTV or computer parts and the right team calls back the same day.',
    scene: 'A tidy front desk: a desk phone and a smartphone, an open enquiry register, course brochures and a CCTV leaflet (no readable text), a laptop showing an abstract enquiry form and a small counter bell. Behind, softly blurred, the computer lab on one side and shop shelves on the other, with a receptionist small and out of focus. Royal-blue wall, golden-amber accents, daylight.',
  },
  'admission-hero': {
    page: 'Admission', business: 'institute', shape: 'landscape', section: 'Page hero — large photo next to the title',
    alt: 'Students learning in class at Silicon Computer Institute',
    focus: 'Apply online and start learning this month — fill the admission form, then a counsellor calls to confirm course, batch and fee.',
    scene: 'Close-up of a laptop showing an abstract online admission form (form fields, a photo box and a submit button shape, no text), a smartphone beside it showing an incoming-call screen, a course brochure and a pen on the desk. A student’s hands typing, casual T-shirt sleeves visible. Cosy, bright room with royal-blue and golden-yellow accents.',
  },
};

export const SITE_IMAGE_KEYS = Object.keys(SITE_IMAGES);

/** Slots whose starter photo is bundled in `website/public/site-images` (free Unsplash-licence photos). */
export const BUNDLED = new Set(SITE_IMAGE_KEYS);

export const bundledSrc = (key) => (BUNDLED.has(key) ? `/site-images/${key}.jpg` : '');

const STYLE = 'Premium photorealistic editorial photograph for a local business website. Natural, flattering light, crisp focus on the main subject, shallow depth of field, clean and uncluttered, high detail.';
const SUBJECT_FIRST = 'The page content is the hero: the place, equipment, screens and products described above must be the clear main subject and fill most of the frame. People are supporting details only — small in frame, partly visible (hands, shoulders, side or back view) or softly out of focus. Never a close-up portrait or posed group photo.';
const RULES = 'The setting looks like a real, modern Terai town in Madhesh Province, Nepal — flat plains, no mountains. Strictly no text, letters, numbers, logos, brand names or watermarks anywhere; screens show only abstract shapes. No borders or frames.';
const PEOPLE = 'Any people are Madhesi from the Terai of Madhesh Province, Nepal (warm wheatish to brown skin, dark hair), natural and friendly, with realistic hands. Students are 15–23 in casual plain T-shirts and jeans; teachers are about 28 in smart-casual shirts; shop staff wear orange polos.';
const SHOWS_PEOPLE = /student|classmate|teacher|staff|team|assistant|technician|shopkeeper|salesman|customer|mother|receptionist|hand/i;
// Matches the page colours: navy site with royal blue for the institute and amber for the shop.
const PALETTES = {
  institute: 'Colour scheme (matches the Silicon Computer Institute pages — deep navy with royal blue and golden highlights): royal blue and navy as the main tones (around #1E40AF, #2563EB, #0B1B3F) on walls, furniture and screen glow, with warm golden-yellow accents (around #FCD34D, #F59E0B) on chairs, lamps and props. Clean, bright and trustworthy; avoid purple, green or teal casts.',
  traders: 'Colour scheme (matches the Sanvi Computer and Traders pages — deep navy and charcoal with amber highlights): warm amber, golden yellow and orange (around #F59E0B, #FCD34D, #EA580C) as the main highlights — amber shelf and product lighting — set against deep navy or charcoal backdrops (around #0B1B3F, #1C1917). Rich and premium; avoid purple, green or teal casts.',
  both: 'Colour scheme (matches the main website — deep navy with royal blue for the institute and amber for the shop): balance royal blue and navy (around #1E40AF, #2563EB, #0B1B3F) with warm golden-amber accents (around #F59E0B, #FCD34D, #EA580C). Clean, bright and welcoming; avoid purple, green or teal casts.',
};

/** Full ready-to-use prompt for a slot. */
export function siteImagePrompt(key) {
  const spec = SITE_IMAGES[key];
  if (!spec) return '';
  return [
    `Purpose: ${spec.section.split(' — ')[0].toLowerCase()} image on the ${spec.page} page. It must instantly communicate: ${spec.focus}`,
    `Scene: ${spec.scene}`,
    `Shape: ${IMAGE_SHAPES[spec.shape].label}.`,
    SUBJECT_FIRST,
    STYLE,
    PALETTES[spec.business] || PALETTES.both,
    SHOWS_PEOPLE.test(spec.scene) && PEOPLE,
    RULES,
  ].filter(Boolean).join('\n\n');
}

export function imagesByPage() {
  return SITE_IMAGE_PAGES.map((item) => ({ ...item, keys: SITE_IMAGE_KEYS.filter((key) => SITE_IMAGES[key].page === item.page) }));
}
