import type {
  Lead,
  Call,
  Activity,
  Revenue,
  Expense,
  Employee,
  Client,
  ClientNote,
  ClientFile,
  ClientTimelineEvent,
  RequirementQuestionnaireData
} from '@/types'

// Setup initial data if not present
const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'demo-user-001', name: 'Ihsan', email: 'ihsan@redix.media', role: 'admin', created_at: new Date().toISOString() }
]

const INITIAL_LEADS: Lead[] = []
const INITIAL_CALLS: Call[] = []
const INITIAL_ACTIVITIES: Activity[] = []
const INITIAL_REVENUE: Revenue[] = []
const INITIAL_EXPENSES: Expense[] = []

// Initial Client Data for Demo purpose
const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-demo-001',
    name: 'Sarah Connor',
    company_name: 'Cyberdyne Systems',
    logo_url: '',
    contact_person: 'Sarah Connor',
    email: 'sarah@cyberdyne.com',
    phone: '+1-555-0199',
    whatsapp: '+15550199',
    address: '1984 Resistance Way, Los Angeles, CA',
    gst_number: 'GST-US-9812A',
    website: 'https://cyberdyne-systems.com',
    social_links: { linkedin: 'https://linkedin.com/company/cyberdyne' },
    industry: 'Robotics',
    status: 'active_project',
    project_progress: 45,
    total_project_value: 350000,
    advance_paid: 150000,
    created_at: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cli-demo-002',
    name: 'Tony Stark',
    company_name: 'Stark Industries',
    logo_url: '',
    contact_person: 'Pepper Potts',
    email: 'pepper@stark.com',
    phone: '+1-212-0000',
    whatsapp: '+12120000',
    address: '10880 Malibu Point, Malibu, CA',
    gst_number: 'GST-IN-88992',
    website: 'https://starkindustries.com',
    social_links: { linkedin: 'https://linkedin.com/company/stark-industries', twitter: 'https://twitter.com/ironman' },
    industry: 'Defense & Energy',
    status: 'proposal_sent',
    project_progress: 10,
    total_project_value: 750000,
    advance_paid: 0,
    created_at: new Date(Date.now() - 10*24*60*60*1000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

const INITIAL_CLIENT_NOTES: ClientNote[] = [
  {
    id: 'note-demo-1',
    client_id: 'cli-demo-001',
    category: 'meeting',
    title: 'Initial Discovery Call',
    content: 'Discussed website migration from legacy PHP to modern Next.js + Tailwind. Main requirement is super-fast load speed and interactive components.',
    created_by: 'Ihsan',
    created_at: new Date(Date.now() - 28*24*60*60*1000).toISOString()
  }
]

const INITIAL_CLIENT_FILES: ClientFile[] = []

const INITIAL_CLIENT_TIMELINE: ClientTimelineEvent[] = [
  {
    id: 'time-demo-1',
    client_id: 'cli-demo-001',
    title: 'Requirement Received',
    description: 'Onboarding questionnaire completed by client.',
    status: 'completed',
    created_at: new Date(Date.now() - 29*24*60*60*1000).toISOString()
  },
  {
    id: 'time-demo-2',
    client_id: 'cli-demo-001',
    title: 'Research',
    description: 'Analyzed competitor sites in the robotics and automation space.',
    status: 'completed',
    created_at: new Date(Date.now() - 25*24*60*60*1000).toISOString()
  },
  {
    id: 'time-demo-3',
    client_id: 'cli-demo-001',
    title: 'Wireframe',
    description: 'Figma layout wireframe finalized and approved.',
    status: 'completed',
    created_at: new Date(Date.now() - 20*24*60*60*1000).toISOString()
  },
  {
    id: 'time-demo-4',
    client_id: 'cli-demo-001',
    title: 'Design',
    description: 'Completed mockups. Client signed off on brand layout.',
    status: 'completed',
    created_at: new Date(Date.now() - 15*24*60*60*1000).toISOString()
  },
  {
    id: 'time-demo-5',
    client_id: 'cli-demo-001',
    title: 'Development',
    description: 'Next.js components and Tailwind pages implementation.',
    status: 'in_progress',
    created_at: new Date(Date.now() - 10*24*60*60*1000).toISOString()
  }
]

const INITIAL_CLIENT_QUESTIONNAIRE: RequirementQuestionnaireData[] = [
  {
    id: 'q-demo-001',
    client_id: 'cli-demo-001',
    step1: {
      business_name: 'Cyberdyne Systems',
      industry: 'Artificial Intelligence & Robotics',
      products: 'Neural Network Processors, CPU microchips',
      services: 'Hardware design, automation consulting',
      target_audience: 'Enterprise manufacturing businesses, research labs'
    },
    step2: {
      website_goal: 'branding'
    },
    step3: {
      preferred_style: 'luxury',
      brand_colors: 'Metallic silver, cybernetic blue, crimson red',
      reference_websites: 'tesla.com, spacex.com',
      fonts: 'Orbitron, Inter'
    },
    step4: {
      features: ['forms', 'gallery', 'analytics']
    },
    step5: {
      need_copywriting: true,
      need_logo: false,
      need_images: true,
      need_seo: true
    },
    step6: {
      marketing: ['seo'],
      budget: '$15,000 - $35,000',
      timeline: '6 weeks',
      additional_notes: 'Must ensure military-grade hosting configurations.'
    },
    created_at: new Date(Date.now() - 29*24*60*60*1000).toISOString(),
    updated_at: new Date(Date.now() - 29*24*60*60*1000).toISOString()
  }
]

function getStorageItem<T>(key: string, initialData: T): T {
  const item = localStorage.getItem(key)
  if (!item) {
    localStorage.setItem(key, JSON.stringify(initialData))
    return initialData
  }
  try {
    return JSON.parse(item)
  } catch (e) {
    return initialData
  }
}

function setStorageItem<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const Storage = {
  getEmployees: () => getStorageItem<Employee[]>('redix_employees', INITIAL_EMPLOYEES),
  getLeads: () => getStorageItem<Lead[]>('redix_leads', INITIAL_LEADS),
  getCalls: () => getStorageItem<Call[]>('redix_calls', INITIAL_CALLS),
  getActivities: () => getStorageItem<Activity[]>('redix_activities', INITIAL_ACTIVITIES),
  getRevenue: () => getStorageItem<Revenue[]>('redix_revenue', INITIAL_REVENUE),
  getExpenses: () => getStorageItem<Expense[]>('redix_expenses', INITIAL_EXPENSES),
  
  getClients: () => getStorageItem<Client[]>('redix_clients', INITIAL_CLIENTS),
  getClientNotes: () => getStorageItem<ClientNote[]>('redix_client_notes', INITIAL_CLIENT_NOTES),
  getClientFiles: () => getStorageItem<ClientFile[]>('redix_client_files', INITIAL_CLIENT_FILES),
  getClientTimeline: () => getStorageItem<ClientTimelineEvent[]>('redix_client_timeline', INITIAL_CLIENT_TIMELINE),
  getClientQuestionnaire: () => getStorageItem<RequirementQuestionnaireData[]>('redix_client_questionnaire', INITIAL_CLIENT_QUESTIONNAIRE),

  getMessages: () => getStorageItem<any[]>('redix_messages', []),
  getContacts: () => getStorageItem<any[]>('redix_contacts', []),
  getProjects: () => getStorageItem<any[]>('redix_projects', []),
  getQuotes: () => getStorageItem<any[]>('redix_quotes', []),
  getInvoices: () => getStorageItem<any[]>('redix_invoices', []),
  getClientReviews: () => getStorageItem<any[]>('redix_client_reviews', []),
  getReviewRequests: () => getStorageItem<any[]>('redix_review_requests', []),
  getNewsletterSubscribers: () => getStorageItem<any[]>('redix_newsletter_subscribers', []),
  getNotifications: () => getStorageItem<any[]>('redix_notifications', []),

  saveLeads: (leads: Lead[]) => setStorageItem('redix_leads', leads),
  saveCalls: (calls: Call[]) => setStorageItem('redix_calls', calls),
  saveActivities: (activities: Activity[]) => setStorageItem('redix_activities', activities),
  saveRevenue: (revenue: Revenue[]) => setStorageItem('redix_revenue', revenue),
  saveExpenses: (expenses: Expense[]) => setStorageItem('redix_expenses', expenses),
  saveEmployees: (employees: Employee[]) => setStorageItem('redix_employees', employees),

  saveClients: (clients: Client[]) => setStorageItem('redix_clients', clients),
  saveClientNotes: (notes: ClientNote[]) => setStorageItem('redix_client_notes', notes),
  saveClientFiles: (files: ClientFile[]) => setStorageItem('redix_client_files', files),
  saveClientTimeline: (timeline: ClientTimelineEvent[]) => setStorageItem('redix_client_timeline', timeline),
  saveClientQuestionnaire: (q: RequirementQuestionnaireData[]) => setStorageItem('redix_client_questionnaire', q),

  saveMessages: (messages: any[]) => setStorageItem('redix_messages', messages),
  saveContacts: (contacts: any[]) => setStorageItem('redix_contacts', contacts),
  saveProjects: (projects: any[]) => setStorageItem('redix_projects', projects),
  saveQuotes: (quotes: any[]) => setStorageItem('redix_quotes', quotes),
  saveInvoices: (invoices: any[]) => setStorageItem('redix_invoices', invoices),
  saveClientReviews: (reviews: any[]) => setStorageItem('redix_client_reviews', reviews),
  saveReviewRequests: (requests: any[]) => setStorageItem('redix_review_requests', requests),
  saveNewsletterSubscribers: (subscribers: any[]) => setStorageItem('redix_newsletter_subscribers', subscribers),
  saveNotifications: (notifications: any[]) => setStorageItem('redix_notifications', notifications)
}

