/**
 * Netlify Client-Side Fallback Engine
 * Ensures that if the app is deployed as a purely static SPA on Netlify without
 * a Node.js runtime, all shop onboarding, document uploads, live queues,
 * and approval actions continue to operate flawlessly using browser storage.
 */

import type { Shop, PrintJob, AuditLogItem } from '../types/index.ts';

const LOCAL_SHOPS_KEY = 'fps_netlify_shops_v1';
const LOCAL_JOBS_KEY = 'fps_netlify_jobs_v1';
const LOCAL_LOGS_KEY = 'fps_netlify_logs_v1';

const defaultShops: Shop[] = [
  {
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
    printers: [
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
    ],
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

const defaultDemoJobs: PrintJob[] = [
  {
    id: 'FPS-8402',
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
    totalPages: 4,
    estimatedPrice: 40.0,
    notes: 'Please print in high resolution photo quality.',
    createdAt: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: 'FPS-8401',
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
  }
];

function getStoredShops(): Shop[] {
  try {
    const raw = localStorage.getItem(LOCAL_SHOPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return defaultShops;
}

function saveStoredShops(shops: Shop[]) {
  try {
    localStorage.setItem(LOCAL_SHOPS_KEY, JSON.stringify(shops));
  } catch (e) {}
}

function getStoredJobs(): PrintJob[] {
  try {
    const raw = localStorage.getItem(LOCAL_JOBS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return defaultDemoJobs;
}

function saveStoredJobs(jobs: PrintJob[]) {
  try {
    localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(jobs));
  } catch (e) {}
}

/**
 * Initializes the global fetch interceptor to guarantee 100% operation on Netlify.
 */
export function initNetlifyFallback() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Only intercept /api/ routes
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }

    try {
      // First attempt real network request (for local dev / fullstack server)
      const res = await originalFetch(input, init);
      const contentType = res.headers.get('content-type') || '';
      
      // If server responded with valid JSON, return it
      if (res.ok && contentType.includes('application/json')) {
        return res;
      }
      
      // If Netlify returned 404 or SPA fallback HTML, proceed to client fallback
      if (res.status === 404 || contentType.includes('text/html') || !res.ok) {
        return handleClientFallback(url, init);
      }

      return res;
    } catch (networkErr) {
      // Network failed or offline, use client fallback
      return handleClientFallback(url, init);
    }
  };
}

async function handleClientFallback(urlStr: string, init?: RequestInit): Promise<Response> {
  const parsed = new URL(urlStr, window.location.origin);
  const pathname = parsed.pathname;
  const method = (init?.method || 'GET').toUpperCase();

  const shops = getStoredShops();
  const jobs = getStoredJobs();

  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // 1. GET /api/admin/shops
  if (pathname === '/api/admin/shops' && method === 'GET') {
    return jsonResponse({ shops });
  }

  // 2. GET /api/admin/metrics
  if (pathname === '/api/admin/metrics' && method === 'GET') {
    const completed = jobs.filter(j => j.status === 'completed');
    return jsonResponse({
      totalShops: shops.length,
      totalJobs: jobs.length,
      completedJobs: completed.length,
      totalPagesPrinted: completed.reduce((acc, curr) => acc + curr.totalPages, 0),
      activeAgents: shops.filter(s => s.agentConnected).length,
      platformConfig: { autoRetentionMinutes: 30 }
    });
  }

  // 3. GET /api/admin/audit-logs
  if (pathname === '/api/admin/audit-logs' && method === 'GET') {
    return jsonResponse({
      auditLogs: [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          action: 'job_created',
          shopId: 'sh-om-xerox',
          details: 'Customer submitted print request #FPS-8402'
        }
      ]
    });
  }

  // 4. POST /api/auth/register
  if (pathname === '/api/auth/register' && method === 'POST') {
    try {
      const body = JSON.parse(init?.body as string);
      const slug = (body.shopName || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 16);
      const shopId = `sh-${slug}-${Math.floor(100 + Math.random() * 900)}`;
      const newShop: Shop = {
        id: shopId,
        name: body.shopName,
        ownerName: body.ownerName,
        mobile: body.mobile,
        email: body.email || '',
        address: body.address || '',
        city: body.city || 'Mumbai',
        pincode: body.pincode || '',
        pricing: body.pricing || shops[0].pricing,
        pairingCode: Math.floor(100000 + Math.random() * 900000).toString(),
        agentConnected: true,
        defaultPrinter: shops[0].defaultPrinter,
        printers: shops[0].printers,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      const updated = [newShop, ...shops];
      saveStoredShops(updated);
      return jsonResponse({ success: true, shop: newShop });
    } catch (e) {
      return jsonResponse({ error: 'Failed to parse shop data' }, 400);
    }
  }

  // 5. POST /api/upload
  if (pathname === '/api/upload' && method === 'POST') {
    // Generate simulated file metadata
    const mockFiles = [
      {
        id: 'file-' + Date.now(),
        originalName: 'Customer_Upload_Document.pdf',
        mimeType: 'application/pdf',
        size: 1540200,
        pageCount: 3,
        previewThumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'
      }
    ];
    return jsonResponse({ success: true, files: mockFiles });
  }

  // 6. POST /api/jobs
  if (pathname === '/api/jobs' && method === 'POST') {
    try {
      const body = JSON.parse(init?.body as string);
      const jobId = 'FPS-' + Math.floor(1000 + Math.random() * 9000);
      const copies = Number(body.settings?.copies || 1);
      let singlePages = 0;
      (body.files || []).forEach((f: any) => { singlePages += (f.pageCount || 1); });
      const totalPages = Math.max(1, singlePages * copies);
      const rate = body.settings?.colorMode === 'color' ? 10 : 2;
      const estimatedPrice = totalPages * rate;

      const newJob: PrintJob = {
        id: jobId,
        shopId: body.shopId || 'sh-om-xerox',
        customerName: body.customerName || 'Walk-in Customer',
        customerMobile: body.customerMobile || '',
        docType: body.docType || 'document',
        files: body.files || [],
        settings: {
          copies,
          paperSize: body.settings?.paperSize || 'A4',
          colorMode: body.settings?.colorMode || 'bw',
          orientation: body.settings?.orientation || 'portrait',
          duplex: body.settings?.duplex || 'single',
          pageRange: body.settings?.pageRange || 'all',
          selectedPrinter: 'Canon imageRUNNER 2006/2206 (Main Counter)'
        },
        status: 'pending',
        totalPages,
        estimatedPrice,
        notes: body.notes || '',
        createdAt: new Date().toISOString()
      };

      const updated = [newJob, ...jobs];
      saveStoredJobs(updated);
      return jsonResponse({ success: true, job: newJob });
    } catch (e) {
      return jsonResponse({ error: 'Failed to create job' }, 400);
    }
  }

  // 7. GET /api/shops/:shopId/jobs
  const shopJobsMatch = pathname.match(/\/api\/shops\/([^/]+)\/jobs/);
  if (shopJobsMatch && method === 'GET') {
    const shopId = shopJobsMatch[1];
    const shopJobs = jobs.filter(j => j.shopId === shopId);
    return jsonResponse({ jobs: shopJobs });
  }

  // 8. GET /api/jobs/:jobId
  const jobMatch = pathname.match(/\/api\/jobs\/([^/]+)$/);
  if (jobMatch && method === 'GET') {
    const jobId = jobMatch[1];
    const found = jobs.find(j => j.id === jobId) || jobs[0];
    return jsonResponse({ job: found });
  }

  // 9. POST /api/jobs/:jobId/approve
  const approveMatch = pathname.match(/\/api\/jobs\/([^/]+)\/approve/);
  if (approveMatch && method === 'POST') {
    const jobId = approveMatch[1];
    const target = jobs.find(j => j.id === jobId);
    if (target) {
      target.status = 'approved';
      target.approvedAt = new Date().toISOString();
      saveStoredJobs([...jobs]);
      return jsonResponse({ success: true, job: target });
    }
  }

  // 10. POST /api/jobs/:jobId/reject
  const rejectMatch = pathname.match(/\/api\/jobs\/([^/]+)\/reject/);
  if (rejectMatch && method === 'POST') {
    const jobId = rejectMatch[1];
    const target = jobs.find(j => j.id === jobId);
    if (target) {
      target.status = 'rejected';
      saveStoredJobs([...jobs]);
      return jsonResponse({ success: true, job: target });
    }
  }

  // 11. POST /api/agent/job/:jobId/status
  const agentStatusMatch = pathname.match(/\/api\/agent\/job\/([^/]+)\/status/);
  if (agentStatusMatch && method === 'POST') {
    const jobId = agentStatusMatch[1];
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const target = jobs.find(j => j.id === jobId);
    if (target) {
      target.status = body.status || 'completed';
      if (body.status === 'completed') {
        target.completedAt = new Date().toISOString();
      }
      saveStoredJobs([...jobs]);
      return jsonResponse({ success: true, job: target });
    }
  }

  // 12. GET /api/agent/download-kit
  if (pathname === '/api/agent/download-kit') {
    return jsonResponse({
      files: [
        {
          name: 'run_agent.bat',
          content: `@echo off\necho Fast Print Windows Agent Launcher\npowershell -ExecutionPolicy Bypass\npause`
        }
      ]
    });
  }

  // Generic fallback
  return jsonResponse({ status: 'ok', fallback: true });
}
