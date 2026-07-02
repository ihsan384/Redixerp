import { useState, useEffect } from 'react'
import { Check, ClipboardList, ArrowLeft, ArrowRight, Download, FileText } from 'lucide-react'
import type { Client, RequirementQuestionnaireData } from '@/types'
import { supabase } from '@/lib/supabase'
import { generateQuestionnairePDF } from '../utils/pdfDocsGenerator'
import { toast } from 'sonner'

interface QuestionnaireTabProps {
  client: Client
}

const WEBSA_GOALS = [
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'sales', label: 'Sales / E-commerce' },
  { value: 'portfolio', label: 'Creative Portfolio' },
  { value: 'booking', label: 'Booking System' },
  { value: 'branding', label: 'Corporate Branding' },
  { value: 'others', label: 'Other / Customized' }
]

const DESIGN_STYLES = [
  { value: 'minimal', label: 'Minimalist & Clean' },
  { value: 'luxury', label: 'Luxury & Elegant' },
  { value: 'modern', label: 'Modern & Vibrant' },
  { value: 'corporate', label: 'Corporate & Trusted' },
  { value: 'dark', label: 'Premium Dark Mode' },
  { value: 'light', label: 'Bright & Open Layout' }
]

const FEATURE_OPTIONS = [
  { value: 'booking', label: 'Online Booking System' },
  { value: 'payments', label: 'Payment Gateway Integration' },
  { value: 'login', label: 'Client Login / Portal' },
  { value: 'blog', label: 'Blog / Content Section' },
  { value: 'whatsapp', label: 'WhatsApp / Call Integrations' },
  { value: 'forms', label: 'Custom Contact Forms' },
  { value: 'chat', label: 'Live Chat / AI Bot' },
  { value: 'gallery', label: 'Image Gallery / Portfolio grids' },
  { value: 'testimonials', label: 'Reviews & Testimonials slider' },
  { value: 'newsletter', label: 'Newsletter Signup' },
  { value: 'multi_language', label: 'Multi-lingual Support' },
  { value: 'cms', label: 'CMS (Admin Control Panel)' },
  { value: 'analytics', label: 'Google Analytics & Tracking' }
]

const MARKETING_OPTIONS = [
  { value: 'google_ads', label: 'Google PPC Ads' },
  { value: 'meta_ads', label: 'Meta (FB/Insta) Ads' },
  { value: 'seo', label: 'Search Engine Optimization' },
  { value: 'email_marketing', label: 'Email Marketing Automations' }
]

export function QuestionnaireTab({ client }: QuestionnaireTabProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [qData, setQData] = useState<RequirementQuestionnaireData | null>(null)

  // Step 1: Business Information
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [products, setProducts] = useState('')
  const [services, setServices] = useState('')
  const [targetAudience, setTargetAudience] = useState('')

  // Step 2: Website Goal
  const [websiteGoal, setWebsiteGoal] = useState('lead_generation')

  // Step 3: Design
  const [preferredStyle, setPreferredStyle] = useState('minimal')
  const [brandColors, setBrandColors] = useState('')
  const [referenceWebsites, setReferenceWebsites] = useState('')
  const [fonts, setFonts] = useState('')

  // Step 4: Features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  // Step 5: Content
  const [needCopywriting, setNeedCopywriting] = useState(false)
  const [needLogo, setNeedLogo] = useState(false)
  const [needImages, setNeedImages] = useState(false)
  const [needSeo, setNeedSeo] = useState(false)

  // Step 6: Marketing & Timeline
  const [selectedMarketing, setSelectedMarketing] = useState<string[]>([])
  const [budget, setBudget] = useState('$5,000 - $10,000')
  const [timeline, setTimeline] = useState('4-6 Weeks')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const loadQuestionnaire = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('client_questionnaire')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle()
      
      if (error) throw error
      if (data) {
        setQData(data as RequirementQuestionnaireData)
        
        // Populate inputs
        if (data.step1) {
          setBusinessName(data.step1.business_name || '')
          setIndustry(data.step1.industry || '')
          setProducts(data.step1.products || '')
          setServices(data.step1.services || '')
          setTargetAudience(data.step1.target_audience || '')
        }
        if (data.step2) {
          setWebsiteGoal(data.step2.website_goal || 'lead_generation')
        }
        if (data.step3) {
          setPreferredStyle(data.step3.preferred_style || 'minimal')
          setBrandColors(data.step3.brand_colors || '')
          setReferenceWebsites(data.step3.reference_websites || '')
          setFonts(data.step3.fonts || '')
        }
        if (data.step4) {
          setSelectedFeatures(data.step4.features || [])
        }
        if (data.step5) {
          setNeedCopywriting(!!data.step5.need_copywriting)
          setNeedLogo(!!data.step5.need_logo)
          setNeedImages(!!data.step5.need_images)
          setNeedSeo(!!data.step5.need_seo)
        }
        if (data.step6) {
          setSelectedMarketing(data.step6.marketing || [])
          setBudget(data.step6.budget || '')
          setTimeline(data.step6.timeline || '')
          setAdditionalNotes(data.step6.additional_notes || '')
        }
      } else {
        setQData(null)
        // Reset defaults
        setBusinessName(client.company_name)
        setIndustry(client.industry)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestionnaire()
    setStep(1)
  }, [client.id])

  const handleSave = async (showToast = true) => {
    try {
      setSaving(true)
      const payload: Omit<RequirementQuestionnaireData, 'id' | 'created_at'> & { id?: string } = {
        client_id: client.id,
        step1: {
          business_name: businessName,
          industry,
          products,
          services,
          target_audience: targetAudience
        },
        step2: { website_goal: websiteGoal },
        step3: {
          preferred_style: preferredStyle,
          brand_colors: brandColors,
          reference_websites: referenceWebsites,
          fonts
        },
        step4: { features: selectedFeatures },
        step5: {
          need_copywriting: needCopywriting,
          need_logo: needLogo,
          need_images: needImages,
          need_seo: needSeo
        },
        step6: {
          marketing: selectedMarketing,
          budget,
          timeline,
          additional_notes: additionalNotes
        },
        updated_at: new Date().toISOString()
      }

      if (qData?.id) {
        payload.id = qData.id
        const { error } = await supabase.from('client_questionnaire').update(payload as never).eq('id', qData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('client_questionnaire').insert(payload as never)
        if (error) throw error
      }

      if (showToast) toast.success('Questionnaire saved successfully')
      loadQuestionnaire()
    } catch (e) {
      console.error(e)
      toast.error('Failed to save questionnaire responses')
    } finally {
      setSaving(false)
    }
  }

  const toggleFeature = (val: string) => {
    setSelectedFeatures(prev =>
      prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val]
    )
  }

  const toggleMarketing = (val: string) => {
    setSelectedMarketing(prev =>
      prev.includes(val) ? prev.filter(m => m !== val) : [...prev, val]
    )
  }

  const handleDownload = () => {
    if (!qData) {
      toast.error('Please save questionnaire before downloading PDF')
      return
    }
    generateQuestionnairePDF(client, qData)
    toast.success('Questionnaire PDF generated successfully!')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="panel-card p-6 bg-[#111]/40 border border-white/[0.06] backdrop-blur-md space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Requirement Questionnaire</h3>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">Step {step} of 6</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="btn-secondary h-9 px-4 text-xs font-bold shrink-0"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          {qData && (
            <button
              onClick={handleDownload}
              className="btn-primary h-9 px-4 text-xs font-bold gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> <span>Export responses PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Steps indicators */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            onClick={() => setStep(i)}
            className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
              step === i 
                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                : i < step 
                  ? 'bg-red-950/40' 
                  : 'bg-white/[0.06]'
            }`}
          />
        ))}
      </div>

      {/* Questionnaire Form Content */}
      <div className="py-2 min-h-[220px]">
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Step 1: Business Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Official brand name"
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Industry Segment</label>
                <input
                  type="text"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  placeholder="e.g. Retail, Healthcare, Tech"
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Core Products Sold</label>
              <input
                type="text"
                value={products}
                onChange={e => setProducts(e.target.value)}
                placeholder="Brief list of physical or digital products"
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Services Offered</label>
              <input
                type="text"
                value={services}
                onChange={e => setServices(e.target.value)}
                placeholder="Provided client services descriptions"
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Target Audience demographics</label>
              <textarea
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="Describe your ideal customers (e.g. tech managers, local shoppers)"
                className="w-full h-16 py-2 text-xs"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Step 2: Primary Website Goal</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {WEBSA_GOALS.map(goal => {
                const active = websiteGoal === goal.value
                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => setWebsiteGoal(goal.value)}
                    className={`h-14 flex items-center justify-center text-xs font-bold uppercase tracking-wider border rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                        : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:text-white hover:border-white/12'
                    }`}
                  >
                    {goal.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Step 3: Brand & Design Preferences</h4>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Preferred Visual Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DESIGN_STYLES.map(style => {
                  const active = preferredStyle === style.value
                  return (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setPreferredStyle(style.value)}
                      className={`h-10 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                          : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {style.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Brand Palette Colors</label>
                <input
                  type="text"
                  value={brandColors}
                  onChange={e => setBrandColors(e.target.value)}
                  placeholder="e.g. Hex values or 'Navy, Gold and White'"
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Preferred Typography / Fonts</label>
                <input
                  type="text"
                  value={fonts}
                  onChange={e => setFonts(e.target.value)}
                  placeholder="e.g. Inter, Playfair Display, Outfit"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Reference Inspiration Websites</label>
              <input
                type="text"
                value={referenceWebsites}
                onChange={e => setReferenceWebsites(e.target.value)}
                placeholder="URLs separated by commas (e.g. apple.com, stripe.com)"
                className="w-full"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Step 4: Required Platform Features</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {FEATURE_OPTIONS.map(opt => {
                const checked = selectedFeatures.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleFeature(opt.value)}
                    className={`h-11 flex items-center gap-2.5 px-3.5 border rounded-xl text-left transition-all duration-200 ${
                      checked
                        ? 'bg-red-500/10 border-red-500/40 text-red-400 font-bold'
                        : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0 ${checked ? 'bg-red-500 border-red-500' : 'border-zinc-600'}`}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-[11px] uppercase tracking-wider">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Step 5: Content Creation Assistance</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { checked: needCopywriting, setChecked: setNeedCopywriting, label: 'Website Copywriting Assistance', desc: 'Need help drafting page headings, body, and call-to-actions' },
                { checked: needLogo, setChecked: setNeedLogo, label: 'Brand Logo Design Identity', desc: 'Need professional vector logo design and color guidelines' },
                { checked: needImages, setChecked: setNeedImages, label: 'Images Sourcing & Editing', desc: 'Need licensing for royalty stock pictures and vectors' },
                { checked: needSeo, setChecked: setNeedSeo, label: 'On-Page SEO Configurations', desc: 'Need search-engine optimizations, keywords setup and meta tags' }
              ].map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => opt.setChecked(!opt.checked)}
                  className={`p-4 border rounded-2xl flex flex-col items-start gap-1 text-left transition-all duration-200 ${
                    opt.checked
                      ? 'bg-red-500/10 border-red-500/40 text-red-400 font-bold'
                      : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${opt.checked ? 'bg-red-500 border-red-500' : 'border-zinc-600'}`}>
                      {opt.checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs uppercase tracking-wider">{opt.label}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 font-semibold leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Step 6: Marketing, Budget & Timeline</h4>
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Digital Marketing Channels</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MARKETING_OPTIONS.map(opt => {
                  const checked = selectedMarketing.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleMarketing(opt.value)}
                      className={`h-10 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        checked
                          ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                          : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Estimated Budget Limit</label>
                <input
                  type="text"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. PKR 150,000 - 250,000"
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Delivery Time Expectation</label>
                <input
                  type="text"
                  value={timeline}
                  onChange={e => setTimeline(e.target.value)}
                  placeholder="e.g. 4 Weeks, 3 Months"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Additional Strategic Notes</label>
              <textarea
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="Include custom integration requests, specific requirements"
                className="w-full h-16 py-2 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-white/[0.06] mt-4">
        <button
          onClick={() => setStep(prev => Math.max(1, prev - 1))}
          disabled={step === 1}
          className="btn-secondary h-10 px-4 text-xs font-bold gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        {step < 6 ? (
          <button
            onClick={() => {
              handleSave(false) // Auto-save draft on step change
              setStep(prev => Math.min(6, prev + 1))
            }}
            className="btn-primary h-10 px-5 text-xs font-bold gap-1.5"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={async () => {
              await handleSave(true)
            }}
            disabled={saving}
            className="btn-primary h-10 px-5 text-xs font-bold bg-red-600 hover:bg-red-700 gap-1.5 border-none"
          >
            {saving ? 'Saving...' : 'Finalize & Save Responses'}
          </button>
        )}
      </div>
    </div>
  )
}
