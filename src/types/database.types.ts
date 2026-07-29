export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Employee {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string | null
  created_at?: string
}

export interface Lead {
  id: string
  name?: string | null
  shop_name?: string | null
  category?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  website?: string | null
  address?: string | null
  rating?: number | null
  source?: string | null
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | string
  assigned_to?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface Contact {
  id: string
  lead_id?: string | null
  client_id?: string | null
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  position?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface Client {
  id: string
  lead_id?: string | null
  name: string
  company?: string | null
  email: string
  phone?: string | null
  address?: string | null
  status: 'active' | 'inactive' | string
  client_secret?: string | null
  created_at?: string
  updated_at?: string
}

export interface MessageReply {
  id: string
  sender_name: string
  sender_email: string
  content: string
  created_at: string
}

export interface Message {
  id: string
  lead_id?: string | null
  contact_id?: string | null
  client_id?: string | null
  type: 'contact' | 'quote' | 'career' | 'portfolio' | 'general' | string
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  content: string
  status: 'unread' | 'read' | 'replied' | 'archived'
  assigned_to?: string | null
  metadata?: Record<string, any> | null
  reply_history?: MessageReply[] | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id?: string | null
  title: string
  description?: string | null
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | string
  budget?: number
  start_date?: string | null
  due_date?: string | null
  created_at?: string
}

export interface Quote {
  id: string
  lead_id?: string | null
  client_id?: string | null
  quote_number?: string | null
  name: string
  email: string
  service?: string | null
  budget_range?: string | null
  details?: string | null
  amount?: number
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | string
  created_at?: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Invoice {
  id: string
  client_id?: string | null
  project_id?: string | null
  invoice_number: string
  amount: number
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | string
  due_date?: string | null
  items?: InvoiceItem[] | null
  created_at?: string
}

export interface ReviewRequest {
  id: string
  client_id: string
  token: string
  client_email: string
  client_name: string
  used: boolean
  expires_at: string
  created_at: string
}

export interface ClientReview {
  id: string
  client_id?: string | null
  review_request_id?: string | null
  name: string
  company?: string | null
  position?: string | null
  service?: string | null
  rating: number
  review: string
  logo_url?: string | null
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
  featured: boolean
  verified: boolean
  created_at: string
  updated_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  status: 'subscribed' | 'unsubscribed' | string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'message' | 'review' | 'quote' | 'lead' | string
  reference_id?: string | null
  read: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee
        Insert: Omit<Employee, 'id' | 'created_at'>
        Update: Partial<Omit<Employee, 'id'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contact, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Message, 'id'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at'>
        Update: Partial<Omit<Project, 'id'>>
      }
      quotes: {
        Row: Quote
        Insert: Omit<Quote, 'id' | 'created_at'>
        Update: Partial<Omit<Quote, 'id'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at'>
        Update: Partial<Omit<Invoice, 'id'>>
      }
      review_requests: {
        Row: ReviewRequest
        Insert: Omit<ReviewRequest, 'id' | 'created_at'>
        Update: Partial<Omit<ReviewRequest, 'id'>>
      }
      client_reviews: {
        Row: ClientReview
        Insert: Omit<ClientReview, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClientReview, 'id'>>
      }
      newsletter_subscribers: {
        Row: NewsletterSubscriber
        Insert: Omit<NewsletterSubscriber, 'id' | 'created_at'>
        Update: Partial<Omit<NewsletterSubscriber, 'id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
