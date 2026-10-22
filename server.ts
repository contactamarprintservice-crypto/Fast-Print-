import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import type { Shop, PrintJob, AgentStatusReport, AuditLogItem, PlatformConfig, PrinterInfo } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Upload directory setup
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.dat';
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype.includes('pdf')) {
      cb(null, true);
    } else {
      cb(new Error(`File format ${ext} is not supported. Please upload PDF, JPG, or PNG.`));
    }
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initial Seed Printers
const defaultPrinters: PrinterInfo[] = [
  {
    name: 'Canon imageRUNNER 2006/2206 (Main Counter)',
    driver: 'Canon UFR II Laser Multi-function Driver',
    isDefault: true,
    status: 'ready',
    queueCount: 0,
    supportedPaper: ['A4', 'A5', 'Legal'],
    supportsColor: false,
    supportsDuplex: true,
    connectionType: 'usb',
    location: 'Counter 1'
  },
  {
    name: 'HP LaserJet Pro MFP M428fdw',
    driver: 'HP PCL-6 Universal Driver',
    isDefault: false,
    status: 'ready',
    queueCount: 0,
    supportedPaper: ['A4', 'Legal', 'Letter'],
    supportsColor: false,
    supportsDuplex: true,
    connectionType: 'network',
    location: 'Back Desk'
  },
  {
    name: 'Epson EcoTank L8050 Photo Series',
    driver: 'Epson ESC/P Standard V4',
    isDefault: false,
    status: 'ready',
    queueCount: 0,
    supportedPaper: ['A4', 'A5', 'Letter'],
    supportsColor: true,
    supportsDuplex: false,
    connectionType: 'usb',
    location: 'Photo Counter'
  }
];

// In-Memory Database
const shops: Record<string, Shop> = {
  'sh-om-xerox': {
    id: 'sh-om-xerox',
    name: 'Om Sai Xerox & Cyber Cafe',
    ownerName: 'Ramesh Sharma',
    mobile: '9820123456',
    email: 'contact.amarprintservice@gmail.com',
    address: 'Shop No. 4, Station Road, Opp. Platform 1, Andheri West',
    city: 'Mumbai',
    pincode: '400058',
    pricing: {
      bwSingle: 2.0,
      bwDuplex: 3.0,
      colorSingle: 10.0,
      colorDuplex: 15.0,
      legalRate: 3.0,
      photoGlossyRate: 25.0
    },
    pairingCode: '829415',
    agentConnected: true,
    agentLastSeen: new Date().toISOString(),
    agentOs: 'Windows 11 Pro 64-bit (Build 22631)',
    defaultPrinter: 'Canon imageRUNNER 2006/2206 (Main Counter)',
    printers: [...defaultPrinters],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    isActive: true
  },
  'sh-balaji-print': {
    id: 'sh-balaji-print',
    name: 'Shree Balaji Digital Print Center',
    ownerName: 'Suresh Patel',
    mobile: '9811882233',
    email: 'balaji.prints@example.com',
    address: 'G-12, Near Metro Gate 3, Connaught Place',
    city: 'New Delhi',
    pincode: '110001',
    pricing: {
      bwSingle: 2.5,
      bwDuplex: 3.5,
      colorSingle: 12.0,
      colorDuplex: 18.0,
      legalRate: 3.5,
      photoGlossyRate: 30.0
    },
    pairingCode: '492018',
    agentConnected: false,
    agentLastSeen: new Date(Date.now() - 3600000).toISOString(),
    agentOs: 'Windows 10 Pro 64-bit',
    defaultPrinter: 'HP LaserJet Pro MFP M428fdw',
    printers: [...defaultPrinters],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    isActive: true
  }
};

const jobs: Record<string, PrintJob> = {};
const auditLogs: AuditLogItem[] = [];

// Platform settings
const platformConfig: PlatformConfig = {
  maxFileSizeMb: 50,
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  autoRetentionMinutes: 30,
  enableSoundAlerts: true,
  watermarkAadhaarConsent: true
};

// Seed initial demo jobs for Om Sai Xerox
const seedDemoJob = () => {
  const sampleJobId = 'FPS-8402';
  jobs[sampleJobId] = {
    id: sampleJobId,
    shopId: 'sh-om-xerox',
    customerName: 'Priya Verma',
    customerMobile: '9876543210',
    docType: 'aadhaar_id',
    files: [
      {
        id: 'file-demo-1',
        originalName: 'Aadhaar_Card_Front_Back.pdf',
        mimeType: 'application/pdf',
        size: 1420500,
        pageCount: 2,
        previewThumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80'
      }
    ],
    settings: {
      copies: 2,
      paperSize: 'A4',
      colorMode: 'color',
      orientation: 'portrait',
      duplex: 'single',
      pageRange: 'all',
      selectedPrinter: 'Canon imageRUNNER 2006/2206 (Main Counter)'
    },
    status: 'pending',
    totalPages: 2,
    estimatedPrice: 40.0,
    notes: 'Please print in high resolution photo quality.',
    createdAt: new Date(Date.now() - 120000).toISOString()
  };

  const sampleJobId2 = 'FPS-8401';
  jobs[sampleJobId2] = {
    id: sampleJobId2,
    shopId: 'sh-om-xerox',
    customerName: 'Ankit Gupta',
    customerMobile: '9822334455',
    docType: 'document',
    files: [
      {
        id: 'file-demo-2',
        originalName: 'College_Project_Final_Report.pdf',
        mimeType: 'application/pdf',
        size: 3200400,
        pageCount: 14,
        previewThumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'
      }
    ],
    settings: {
      copies: 1,
      paperSize: 'A4',
      colorMode: 'bw',
      orientation: 'portrait',
      duplex: 'double',
      pageRange: 'all',
      selectedPrinter: 'Canon imageRUNNER 2006/2206 (Main Counter)'
    },
    status: 'completed',
    totalPages: 14,
    estimatedPrice: 28.0,
    notes: 'Double sided B&W print',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    approvedAt: new Date(Date.now() - 840000).toISOString(),
    completedAt: new Date(Date.now() - 780000).toISOString(),
    printedByAgent: 'Canon imageRUNNER 2006/2206 (Main Counter)'
  };
};
seedDemoJob();

// SSE Connected Clients (by shopId)
const sseClients: Record<string, express.Response[]> = {};

function notifyShop(shopId: string, event: string, data: any) {
  const clients = sseClients[shopId] || [];
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => {
    try {
      res.write(payload);
    } catch (e) {
      // client dropped
    }
  });
}

function logAudit(action: AuditLogItem['action'], shopId: string, details: string, jobId?: string) {
  const entry: AuditLogItem = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    action,
    shopId,
    jobId,
    details
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 500) auditLogs.pop();
}

// ======================== API ROUTES ========================

// 1. SSE Endpoint for Shop Dashboard real-time alerts
app.get('/api/events/:shopId', (req, res) => {
  const { shopId } = req.params;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });

  res.write(': connected\n\n');

  if (!sseClients[shopId]) {
    sseClients[shopId] = [];
  }
  sseClients[shopId].push(res);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    if (sseClients[shopId]) {
      sseClients[shopId] = sseClients[shopId].filter(client => client !== res);
    }
  });
});

// 2. Shop Registration & Auth
app.post('/api/auth/register', (req, res) => {
  const { shopName, ownerName, mobile, email, address, city, pincode, pricing } = req.body;
  if (!shopName || !ownerName || !mobile) {
    return res.status(400).json({ error: 'Shop name, owner name, and mobile number are required.' });
  }

  // Generate unique shop ID
  const cleanSlug = shopName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 16);
  const shopId = `sh-${cleanSlug}-${Math.floor(100 + Math.random() * 900)}`;
  const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newShop: Shop = {
    id: shopId,
    name: shopName,
    ownerName,
    mobile,
    email: email || '',
    address: address || '',
    city: city || 'Local Area',
    pincode: pincode || '',
    pricing: pricing || {
      bwSingle: 2.0,
      bwDuplex: 3.0,
      colorSingle: 10.0,
      colorDuplex: 15.0,
      legalRate: 3.0,
      photoGlossyRate: 25.0
    },
    pairingCode,
    agentConnected: false,
    defaultPrinter: defaultPrinters[0].name,
    printers: [...defaultPrinters],
    createdAt: new Date().toISOString(),
    isActive: true
  };

  shops[shopId] = newShop;
  logAudit('job_created', shopId, `Shop registered: ${shopName} by ${ownerName} (${mobile})`);

  res.json({ success: true, shop: newShop });
});

// 3. Shop Login / Fetch
app.post('/api/auth/login', (req, res) => {
  const { mobileOrShopId } = req.body;
  const target = (mobileOrShopId || '').trim().toLowerCase();

  const foundShop = Object.values(shops).find(
    s => s.id.toLowerCase() === target || s.mobile === target || s.email.toLowerCase() === target
  );

  if (foundShop) {
    res.json({ success: true, shop: foundShop });
  } else {
    // Return default shop if none found for easy demonstration
    const fallback = shops['sh-om-xerox'];
    res.json({ success: true, shop: fallback, isDefaultFallback: true });
  }
});

// 4. Public Shop Info (for customer upload page)
app.get('/api/shops/:shopId', (req, res) => {
  const shop = shops[req.params.shopId];
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  // Public details only (strip sensitive keys)
  res.json({
    id: shop.id,
    name: shop.name,
    ownerName: shop.ownerName,
    mobile: shop.mobile,
    address: shop.address,
    city: shop.city,
    pricing: shop.pricing,
    agentConnected: shop.agentConnected,
    defaultPrinter: shop.defaultPrinter,
    printers: shop.printers.map(p => ({ name: p.name, status: p.status, supportsColor: p.supportsColor })),
    isActive: shop.isActive
  });
});

// 5. Update Shop Pricing & Settings
app.put('/api/shops/:shopId/pricing', (req, res) => {
  const shop = shops[req.params.shopId];
  if (!shop) return res.status(404).json({ error: 'Shop not found' });

  shop.pricing = { ...shop.pricing, ...req.body.pricing };
  if (req.body.defaultPrinter) shop.defaultPrinter = req.body.defaultPrinter;
  if (req.body.name) shop.name = req.body.name;
  if (req.body.address) shop.address = req.body.address;

  res.json({ success: true, shop });
});

// 6. Customer File Upload (Multipart Form)
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  const uploadedFiles = (req.files as Express.Multer.File[]) || [];
  if (uploadedFiles.length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }

  const processedFiles = uploadedFiles.map(file => {
    const isPdf = file.mimetype.includes('pdf');
    // Approximate page count: 1 page for image, or estimate for PDF by file size/header
    const estPages = isPdf ? Math.max(1, Math.ceil(file.size / (180 * 1024))) : 1;

    return {
      id: path.parse(file.filename).name,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      pageCount: estPages,
      storagePath: file.path,
      previewUrl: `/api/files/preview/${file.filename}`
    };
  });

  res.json({ success: true, files: processedFiles });
});

// 7. Submit Print Job
app.post('/api/jobs', (req, res) => {
  const { shopId, customerName, customerMobile, docType, files, settings, notes } = req.body;
  
  const shop = shops[shopId];
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  const jobId = 'FPS-' + Math.floor(1000 + Math.random() * 9000);
  
  // Calculate total pages
  let totalSinglePages = 0;
  (files || []).forEach((f: any) => {
    totalSinglePages += (f.pageCount || 1);
  });
  const copies = Math.max(1, parseInt(settings?.copies || '1', 10));
  const totalBillablePages = totalSinglePages * copies;

  // Calculate pricing accurately
  const isColor = settings?.colorMode === 'color';
  const isDuplex = settings?.duplex === 'double';
  const isPhoto = docType === 'photo';

  let ratePerPage = shop.pricing.bwSingle;
  if (isPhoto) {
    ratePerPage = shop.pricing.photoGlossyRate;
  } else if (isColor) {
    ratePerPage = isDuplex ? shop.pricing.colorDuplex : shop.pricing.colorSingle;
  } else {
    ratePerPage = isDuplex ? shop.pricing.bwDuplex : shop.pricing.bwSingle;
  }

  const estimatedPrice = Math.round(totalBillablePages * ratePerPage);

  const newJob: PrintJob = {
    id: jobId,
    shopId,
    customerName: customerName || 'Walk-in Customer',
    customerMobile: customerMobile || '',
    docType: docType || 'document',
    files: files || [],
    settings: {
      copies,
      paperSize: settings?.paperSize || 'A4',
      colorMode: settings?.colorMode || 'bw',
      orientation: settings?.orientation || 'portrait',
      duplex: settings?.duplex || 'single',
      pageRange: settings?.pageRange || 'all',
      selectedPrinter: settings?.selectedPrinter || shop.defaultPrinter
    },
    status: 'pending',
    totalPages: totalBillablePages,
    estimatedPrice,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  jobs[jobId] = newJob;

  logAudit('job_created', shopId, `Customer submitted job #${jobId} (${totalBillablePages} pages, ₹${estimatedPrice})`, jobId);

  // Send real-time SSE notification to the Shop Owner's browser
  notifyShop(shopId, 'new_job', {
    job: newJob,
    soundAlert: true,
    message: `New print request from ${newJob.customerName} (₹${estimatedPrice})`
  });

  res.json({ success: true, job: newJob });
});

// 8. Get Jobs for Shop
app.get('/api/shops/:shopId/jobs', (req, res) => {
  const { shopId } = req.params;
  const shopJobs = Object.values(jobs)
    .filter(j => j.shopId === shopId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ jobs: shopJobs });
});

// 9. Get Single Job Status (for Customer Live Tracking)
app.get('/api/jobs/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ job });
});

// 10. Owner Approves Job: Accept & Print
// Strict rule: No document may print without explicit shop-owner approval!
app.post('/api/jobs/:jobId/approve', (req, res) => {
  const { jobId } = req.params;
  const { updatedSettings } = req.body;
  const job = jobs[jobId];

  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'pending') {
    return res.status(400).json({ error: `Job is already ${job.status}. Cannot approve again.` });
  }

  // Allow owner to tune settings (printer, copies, color) before approving
  if (updatedSettings) {
    job.settings = { ...job.settings, ...updatedSettings };
  }

  job.status = 'approved';
  job.approvedAt = new Date().toISOString();

  logAudit('job_approved', job.shopId, `Owner approved job #${job.id} for printing on ${job.settings.selectedPrinter}`, jobId);

  // Notify live UI via SSE
  notifyShop(job.shopId, 'job_approved', {
    jobId,
    status: 'approved',
    job
  });

  res.json({ success: true, job });
});

// 11. Owner Rejects Job
app.post('/api/jobs/:jobId/reject', (req, res) => {
  const { jobId } = req.params;
  const { reason } = req.body;
  const job = jobs[jobId];

  if (!job) return res.status(404).json({ error: 'Job not found' });

  job.status = 'rejected';
  job.rejectReason = reason || 'Declined by shop owner (unsupported format or unreadable document)';

  logAudit('job_rejected', job.shopId, `Owner rejected job #${job.id}: ${job.rejectReason}`, jobId);

  // Notify customer status and dashboard
  notifyShop(job.shopId, 'job_rejected', {
    jobId,
    status: 'rejected',
    reason: job.rejectReason
  });

  res.json({ success: true, job });
});

// 12. Document file preview / download
app.get('/api/files/preview/:filename', (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File has been purged or does not exist.' });
  }
});

// 13. Download authorised job file for Print Agent
app.get('/api/jobs/:jobId/file/:fileId', (req, res) => {
  const { jobId, fileId } = req.params;
  const job = jobs[jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const targetFile = job.files.find(f => f.id === fileId);
  if (!targetFile) return res.status(404).json({ error: 'File metadata not found' });

  // Locate file in storage
  const matchingFiles = fs.readdirSync(UPLOADS_DIR).filter(fn => fn.includes(fileId));
  if (matchingFiles.length > 0) {
    const fullPath = path.join(UPLOADS_DIR, matchingFiles[0]);
    res.download(fullPath, targetFile.originalName);
  } else {
    // Generate inline mock printable response if file was demo
    res.setHeader('Content-Type', targetFile.mimeType || 'application/pdf');
    res.send(Buffer.from(`%PDF-1.4\n% Fast Print Service Authorised Print Job: ${jobId}\n`));
  }
});

// 14. Purge Document Files (Privacy & Aadhaar compliance)
app.post('/api/jobs/:jobId/purge', (req, res) => {
  const { jobId } = req.params;
  const job = jobs[jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });

  // Delete actual files from disk
  job.files.forEach(file => {
    try {
      const matches = fs.readdirSync(UPLOADS_DIR).filter(fn => fn.includes(file.id));
      matches.forEach(m => {
        fs.unlinkSync(path.join(UPLOADS_DIR, m));
      });
    } catch (e) {
      // ignore
    }
  });

  job.isPurged = true;
  job.purgedAt = new Date().toISOString();

  logAudit('file_purged', job.shopId, `Customer document files for job #${job.id} were permanently scrubbed.`, jobId);

  notifyShop(job.shopId, 'job_purged', { jobId });
  res.json({ success: true, message: 'Files purged successfully.' });
});

// ======================== WINDOWS AGENT ENDPOINTS ========================

// 15. Agent Pairing
app.post('/api/agent/pair', (req, res) => {
  const { shopId, pairingCode, machineName, osVersion, agentVersion } = req.body;
  const shop = shops[shopId];

  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop ID not found' });
  }

  if (shop.pairingCode !== pairingCode) {
    return res.status(401).json({ success: false, message: 'Invalid 6-digit Pairing Code' });
  }

  const token = `agent-token-${shopId}-${Date.now()}`;
  shop.agentToken = token;
  shop.agentConnected = true;
  shop.agentLastSeen = new Date().toISOString();
  shop.agentOs = osVersion || 'Windows 11 (Auto-detected)';

  logAudit('agent_paired', shopId, `Windows Print Agent paired from workstation: ${machineName || 'DESKTOP-PRINT-PC'} (${osVersion})`);

  notifyShop(shopId, 'agent_connected', {
    status: 'online',
    machineName,
    osVersion,
    agentVersion
  });

  res.json({
    success: true,
    token,
    shopName: shop.name,
    message: 'Workstation paired successfully with Fast Print Service.'
  });
});

// 16. Agent Heartbeat & Real Printer Detection
app.post('/api/agent/heartbeat', (req, res) => {
  const { shopId, machineName, osVersion, installedPrinters, defaultPrinter } = req.body;
  const shop = shops[shopId];
  if (!shop) return res.status(404).json({ error: 'Shop not found' });

  shop.agentConnected = true;
  shop.agentLastSeen = new Date().toISOString();
  if (osVersion) shop.agentOs = osVersion;
  if (Array.isArray(installedPrinters) && installedPrinters.length > 0) {
    shop.printers = installedPrinters;
  }
  if (defaultPrinter) {
    shop.defaultPrinter = defaultPrinter;
  }

  notifyShop(shopId, 'agent_heartbeat', {
    machineName,
    osVersion,
    printers: shop.printers,
    defaultPrinter: shop.defaultPrinter,
    agentLastSeen: shop.agentLastSeen
  });

  res.json({ status: 'ok' });
});

// 17. Agent Long Poll for Approved Jobs
app.get('/api/agent/poll', (req, res) => {
  const shopId = (req.query.shopId as string) || (req.headers['x-shop-id'] as string);
  if (!shopId) return res.status(400).json({ error: 'Shop ID required' });

  // Find oldest approved job waiting to print
  const pendingJob = Object.values(jobs).find(
    j => j.shopId === shopId && j.status === 'approved'
  );

  if (pendingJob) {
    return res.json({
      hasJob: true,
      job: pendingJob
    });
  }

  res.json({ hasJob: false });
});

// 18. Agent Updates Job Spooling / Printing Status
app.post('/api/agent/job/:jobId/status', (req, res) => {
  const { jobId } = req.params;
  const { status, message, printerName } = req.body;
  const job = jobs[jobId];

  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (status === 'printing') {
    job.status = 'printing';
  } else if (status === 'completed') {
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.printedByAgent = printerName || job.settings.selectedPrinter;
    logAudit('job_printed', job.shopId, `Job #${job.id} successfully printed on ${job.printedByAgent}`, jobId);
  } else if (status === 'error') {
    job.status = 'approved'; // Revert to approved so owner can retry or re-route printer
    logAudit('job_rejected', job.shopId, `Printer spool error on #${job.id}: ${message}`, jobId);
  }

  notifyShop(job.shopId, 'job_status_change', {
    jobId,
    status: job.status,
    message,
    job
  });

  res.json({ success: true, job });
});

// 19. Download Windows Print Agent Package (ZIP/Script generation)
app.get('/api/agent/download-kit', (req, res) => {
  const shopId = (req.query.shopId as string) || 'sh-om-xerox';
  const shop = shops[shopId] || shops['sh-om-xerox'];

  // Read native files from /agent folder
  const psPath = path.join(__dirname, 'agent', 'fast_print_agent.ps1');
  const batPath = path.join(__dirname, 'agent', 'run_agent.bat');
  const pyPath = path.join(__dirname, 'agent', 'fast_print_agent.py');
  const readmePath = path.join(__dirname, 'agent', 'README_WINDOWS.md');

  let psContent = fs.existsSync(psPath) ? fs.readFileSync(psPath, 'utf8') : '';
  let batContent = fs.existsSync(batPath) ? fs.readFileSync(batPath, 'utf8') : '';
  let pyContent = fs.existsSync(pyPath) ? fs.readFileSync(pyPath, 'utf8') : '';
  let readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';

  // Inject current shop ID and pairing code into launcher
  batContent = batContent
    .replace('default: sh-om-xerox', `default: ${shop.id}`)
    .replace('set SHOP_ID=sh-om-xerox', `set SHOP_ID=${shop.id}`)
    .replace('default: 829415', `default: ${shop.pairingCode}`)
    .replace('set PAIR_CODE=829415', `set PAIR_CODE=${shop.pairingCode}`);

  const packageJson = {
    shopId: shop.id,
    shopName: shop.name,
    pairingCode: shop.pairingCode,
    files: [
      { name: 'run_agent.bat', content: batContent },
      { name: 'fast_print_agent.ps1', content: psContent },
      { name: 'fast_print_agent.py', content: pyContent },
      { name: 'README_WINDOWS.md', content: readmeContent }
    ]
  };

  res.json(packageJson);
});

// ======================== SUPER ADMIN ENDPOINTS ========================

app.get('/api/admin/metrics', (_req, res) => {
  const allJobs = Object.values(jobs);
  const totalShops = Object.keys(shops).length;
  const totalJobs = allJobs.length;
  const completedJobs = allJobs.filter(j => j.status === 'completed').length;
  const totalPagesPrinted = allJobs
    .filter(j => j.status === 'completed')
    .reduce((acc, curr) => acc + curr.totalPages, 0);

  const activeAgents = Object.values(shops).filter(s => s.agentConnected).length;

  res.json({
    totalShops,
    totalJobs,
    completedJobs,
    totalPagesPrinted,
    activeAgents,
    platformConfig
  });
});

app.get('/api/admin/shops', (_req, res) => {
  res.json({ shops: Object.values(shops) });
});

app.post('/api/admin/shops/:shopId/toggle', (req, res) => {
  const shop = shops[req.params.shopId];
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  shop.isActive = !shop.isActive;
  res.json({ success: true, isActive: shop.isActive });
});

app.post('/api/admin/config', (req, res) => {
  Object.assign(platformConfig, req.body);
  res.json({ success: true, platformConfig });
});

app.get('/api/admin/audit-logs', (_req, res) => {
  res.json({ auditLogs });
});

// Auto-retention cleaner: sweeps every 60s
setInterval(() => {
  const retentionMs = platformConfig.autoRetentionMinutes * 60 * 1000;
  const now = Date.now();

  Object.values(jobs).forEach(job => {
    if (!job.isPurged && (job.status === 'completed' || job.status === 'rejected')) {
      const finishTime = job.completedAt || job.approvedAt || job.createdAt;
      if (now - new Date(finishTime).getTime() > retentionMs) {
        // Purge files
        job.files.forEach(file => {
          try {
            const matches = fs.readdirSync(UPLOADS_DIR).filter(fn => fn.includes(file.id));
            matches.forEach(m => fs.unlinkSync(path.join(UPLOADS_DIR, m)));
          } catch (e) {}
        });
        job.isPurged = true;
        job.purgedAt = new Date().toISOString();
        logAudit('file_purged', job.shopId, `Auto-retention policy purged files for #${job.id}`, job.id);
        notifyShop(job.shopId, 'job_purged', { jobId: job.id });
      }
    }
  });
}, 60000);

// ======================== VITE / STATIC INTEGRATION ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[FAST PRINT SERVICE] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
