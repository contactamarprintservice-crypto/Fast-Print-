export interface ShopPricing {
  bwSingle: number;      // e.g. ₹2.00
  bwDuplex: number;      // e.g. ₹3.00
  colorSingle: number;   // e.g. ₹10.00
  colorDuplex: number;   // e.g. ₹15.00
  legalRate: number;     // e.g. ₹3.00
  photoGlossyRate: number; // e.g. ₹25.00
}

export interface PrinterInfo {
  name: string;
  driver: string;
  isDefault: boolean;
  status: 'ready' | 'offline' | 'paper_jam' | 'door_open' | 'printing' | 'low_toner';
  queueCount: number;
  supportedPaper: string[];
  supportsColor: boolean;
  supportsDuplex: boolean;
  connectionType: 'usb' | 'network' | 'virtual';
  location?: string;
}

export interface Shop {
  id: string;            // e.g. "sh-om-xerox" or "fps-101"
  name: string;          // e.g. "Om Sai Xerox & Cyber Cafe"
  ownerName: string;     // e.g. "Ramesh Sharma"
  mobile: string;        // e.g. "9823456789"
  email: string;
  address: string;       // e.g. "Shop 4, Opp. Station Road, Andheri West, Mumbai"
  city: string;
  pincode: string;
  logoUrl?: string;
  pricing: ShopPricing;
  pairingCode: string;   // 6-digit code for Windows agent pairing
  agentToken?: string;
  agentConnected: boolean;
  agentLastSeen?: string;
  agentOs?: string;
  defaultPrinter: string;
  printers: PrinterInfo[];
  createdAt: string;
  isActive: boolean;
}

export type DocumentType = 'document' | 'aadhaar_id' | 'photo' | 'bill' | 'other';

export interface PrintSettings {
  copies: number;
  paperSize: 'A4' | 'A5' | 'Legal' | 'Letter';
  colorMode: 'bw' | 'color';
  orientation: 'portrait' | 'landscape' | 'auto';
  duplex: 'single' | 'double';
  pageRange: string;     // e.g. "all" or "1-5, 8"
  selectedPrinter?: string;
}

export interface JobFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  pageCount: number;
  dataUrl?: string;      // Base64 or local preview URL
  previewThumbnail?: string;
}

export type JobStatus = 'pending' | 'approved' | 'printing' | 'completed' | 'rejected' | 'cancelled';

export interface PrintJob {
  id: string;            // e.g. "FPS-7201"
  shopId: string;
  customerName?: string;
  customerMobile?: string;
  docType: DocumentType;
  files: JobFile[];
  settings: PrintSettings;
  status: JobStatus;
  rejectReason?: string;
  totalPages: number;
  estimatedPrice: number;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  printedByAgent?: string;
  purgedAt?: string;
  isPurged?: boolean;
}

export interface AgentStatusReport {
  shopId: string;
  machineName: string;
  osVersion: string;
  agentVersion: string;
  lastHeartbeat: string;
  isOnline: boolean;
  installedPrinters: PrinterInfo[];
  activeJobId?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: 'job_created' | 'job_approved' | 'job_printed' | 'job_rejected' | 'file_purged' | 'agent_paired';
  shopId: string;
  jobId?: string;
  details: string;
}

export interface PlatformConfig {
  maxFileSizeMb: number;
  allowedExtensions: string[];
  autoRetentionMinutes: number;
  enableSoundAlerts: boolean;
  watermarkAadhaarConsent: boolean;
}
