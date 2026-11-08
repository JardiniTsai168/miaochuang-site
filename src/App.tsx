import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  Laptop,
  LayoutTemplate,
  BadgeCheck,
  Palette,
  Pencil,
  RotateCcw,
  Smartphone,
  Sparkles,
  Store,
  Upload,
} from 'lucide-react'
import { createDemoBusiness } from './data/demoBusiness'
import { clearDraft, formatRemainingTime, loadDraft, saveDraft } from './lib/draftStorage'
import { openPreview, renderSite, templateNames } from './lib/renderSite'
import { generateBusiness, validateBrief } from './lib/source'
import { optimizeImage } from './lib/image'
import { createBrandCheckout } from './lib/brandCheckout'
import type { AppStage, BrandBrief, BusinessDraft, PreviewViewport, TemplateId } from './types'

type EditorTab = 'template' | 'content' | 'photos'
type StudioView = 'edit' | 'preview'

const templates: Array<{ id: TemplateId; name: string; note: string; accent: string }> = [
  { id: 'editorial', name: '編輯誌', note: '雜誌封面・影像先行', accent: '#B85D3F' },
  { id: 'vivid', name: '醒目海報', note: '撞色標語・活動感強', accent: '#E65463' },
  { id: 'calm', name: '靜謐藝廊', note: '極簡分割・質感留白', accent: '#607A68' },
  { id: 'compact', name: '手作菜單', note: '資訊格線・服務優先', accent: '#315D68' },
  { id: 'mosaic', name: '影像拼貼', note: '不對稱相冊・故事感', accent: '#8A4D76' },
]

const importSteps = ['整理品牌重點', '撰寫網站文案', '搭配產業圖片', '套用五種版型']
const industries = ['美髮', '美容／美甲／美睫', '按摩／SPA', '健身／瑜伽／教練', '攝影／設計／個人工作室', '居家清潔／維修服務', '其他服務業']

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand" href="#top" aria-label="秒創網站首頁">
      <img src={`${import.meta.env.BASE_URL}lihi-logo-primary.png`} alt="lihi" />
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-name">秒創網站</span>
      {!compact && <span className="brand-tag">by lihiDomain</span>}
    </a>
  )
}

function Header({ onReset, studio = false }: { onReset?: () => void; studio?: boolean }) {
  return (
    <header className={`app-header ${studio ? 'is-studio' : ''}`}>
      <Brand compact={studio} />
      {studio ? (
        <button className="text-button" type="button" onClick={onReset}>
          <RotateCcw size={16} aria-hidden="true" /> 重新開始
        </button>
      ) : (
        <div className="header-note"><span /> 7 天免費預覽</div>
      )}
    </header>
  )
}

function Landing({ onGenerate, onDemo, initialError = '' }: { onGenerate: (brief: BrandBrief) => void; onDemo: () => void; initialError?: string }) {
  const [industry, setIndustry] = useState('')
  const [brandName, setBrandName] = useState('')
  const [advantages, setAdvantages] = useState<[string, string, string]>(['', '', ''])
  const [offerings, setOfferings] = useState<[string, string, string]>(['', '', ''])
  const [hours, setHours] = useState('')
  const [error, setError] = useState(initialError)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const brief: BrandBrief = { industry, brandName, advantages, offerings, hours }
    const validationError = validateBrief(brief)
    if (validationError) return setError(validationError)
    setError('')
    onGenerate(brief)
  }

  return (
    <div className="landing" id="top">
      <Header />
      <main>
        <section className="hero-app" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={15} aria-hidden="true" /> 給想快速建立品牌網站的你</p>
            <h1 id="hero-title"><span>說出品牌的優勢，</span><br /><em>AI 幫你完成網站。</em></h1>
            <p className="hero-lead">輸入品牌重點，我們會產出網站文案、搭配合適圖片，再讓你從五個版型中挑選與修改。</p>
            <form className="source-form brief-form" onSubmit={submit} noValidate>
              <div className="brief-row">
                <label>產業類型<select value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="">請選擇產業</option>{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>品牌／店家名稱<input value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="例如：日光髮所" /></label>
              </div>
              <fieldset><legend>三個優點或優勢</legend>{advantages.map((value, index) => <label key={index}><span>{index + 1}</span><input value={value} onChange={(event) => setAdvantages((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item) as [string, string, string])} placeholder={['最值得被記住的特色', '和別人不同的地方', '顧客選擇你的理由'][index]} /></label>)}</fieldset>
              <fieldset><legend>主要服務或商品 <small>至少 1 項</small></legend>{offerings.map((value, index) => <label key={index}><span>{index + 1}</span><input value={value} onChange={(event) => setOfferings((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item) as [string, string, string])} placeholder={['例如：剪髮', '例如：染髮（選填）', '例如：頭皮護理（選填）'][index]} /></label>)}</fieldset>
              <label className="hours-field">營業時間 <small>選填</small><textarea value={hours} onChange={(event) => setHours(event.target.value)} rows={2} placeholder={'例如：\n週一至週五 10:00–19:00'} /></label>
              {error && <p className="field-error" id="source-error">{error}</p>}
              <div className="brief-actions">
                <button className="primary-button" type="submit">生成我的網站 <ArrowRight size={18} aria-hidden="true" /></button>
                <span>通常在 20 秒內完成</span>
                <button type="button" onClick={onDemo}>先看示範結果</button>
              </div>
            </form>
          </div>
          <div className="hero-demo" aria-label="網站生成流程示意">
            <div className="demo-window">
              <div className="window-bar"><span /><span /><span /><small>preview.miaochuang.tw</small></div>
              <div className="demo-site">
                <div className="demo-image"><span>日光散步珈琲</span></div>
                <div className="demo-copy"><span>把午後留給一杯好咖啡</span><i /></div>
              </div>
            </div>
            <div className="floating-note note-source"><Check size={16} /> 文案與圖片已搭配</div>
            <div className="floating-note note-time"><Clock3 size={16} /> 五套版型任你挑</div>
          </div>
        </section>

        <section className="how-it-works" aria-labelledby="how-title">
          <div className="section-intro"><p>簡單到不需要學</p><h2 id="how-title">三步，讓店家有一個正式網址</h2></div>
          <ol>
            <li><span>01</span><div><BadgeCheck aria-hidden="true" /><h3>提供品牌重點</h3><p>產業、名稱、三個優勢與主要服務；營業時間選填。</p></div></li>
            <li><span>02</span><div><Palette aria-hidden="true" /><h3>立即生成範例</h3><p>AI 寫文案，系統從授權圖庫搭配適合的網站圖片。</p></div></li>
            <li><span>03</span><div><Store aria-hidden="true" /><h3>換版型、改內容</h3><p>需要時換上自己的照片，再分享 7 天預覽網址。</p></div></li>
          </ol>
        </section>

        <section className="scope-note">
          <p>生成與 7 天預覽免費</p>
          <strong>購買網域，第一年網站服務免費</strong>
          <span>正式收費與網域流程將由 lihi 訂閱機制處理</span>
        </section>
      </main>
      <footer className="app-footer"><Brand compact /><p>利害短網址有限公司・Powered by lihiDomain</p></footer>
    </div>
  )
}

function Importing({ activeStep }: { activeStep: number }) {
  return (
    <div className="import-screen">
      <Header studio />
      <main className="import-panel" aria-live="polite">
        <div className="import-orbit"><Store size={34} aria-hidden="true" /><span /><span /></div>
        <p className="eyebrow">正在建立你的網站</p>
        <h1>我們正在把散落的資料，<br />整理成一個完整的店家故事。</h1>
        <ol>
          {importSteps.map((step, index) => (
            <li key={step} className={index < activeStep ? 'done' : index === activeStep ? 'active' : ''}>
              <span>{index < activeStep ? <Check size={15} /> : index + 1}</span>{step}
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}

function Field({ label, value, onChange, multiline = false, hint }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; hint?: string }) {
  const id = `field-${label.replaceAll(/\s/g, '-')}`
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} value={value} rows={4} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      {hint && <small>{hint}</small>}
    </div>
  )
}

function ContentEditor({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  return (
    <div className="editor-section">
      <div className="editor-heading"><div><p>網站內容</p><h2>先確認品牌怎麼被介紹</h2></div><span className="source-badge">AI 生成・可修改</span></div>
      <Field label="品牌／網站名稱" value={draft.name} onChange={(name) => update({ name })} />
      <div className="field-row">
        <Field label="產業類型" value={draft.category} onChange={(category) => update({ category })} />
        <Field label="電話（選填）" value={draft.phone} onChange={(phone) => update({ phone })} />
      </div>
      <Field label="主標題" value={draft.tagline} onChange={(tagline) => update({ tagline })} hint="AI 依照現有資料產生，你可以直接修改。" />
      <Field label="店家介紹" value={draft.description} onChange={(description) => update({ description })} multiline />
      <Field label="三個優點／優勢（每行一項）" value={draft.services.join('\n')} onChange={(value) => update({ services: value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 3) })} multiline />
      <Field label="主要服務／商品（每行一項）" value={draft.offerings.join('\n')} onChange={(value) => update({ offerings: value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 3) })} multiline />
      <Field label="地址（選填）" value={draft.address} onChange={(address) => update({ address })} />
      <div className="field-row">
        <Field label="LINE 連結" value={draft.lineUrl} onChange={(lineUrl) => update({ lineUrl })} />
        <Field label="Instagram 連結" value={draft.instagramUrl} onChange={(instagramUrl) => update({ instagramUrl })} />
      </div>
      <Field label="短影音連結（選填）" value={draft.videoUrl} onChange={(videoUrl) => update({ videoUrl })} hint="支援 YouTube 嵌入；其他平台會顯示為外部觀看連結。" />
    </div>
  )
}

function PhotoEditor({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  const [error, setError] = useState('')
  const roleNames = { hero: '網站主視覺', people: '人物／服務情境', service: '服務特色', space: '空間氛圍', detail: '細節特寫' }

  async function replace(id: string, file?: File) {
    if (!file) return
    setError('')
    try {
      const url = await optimizeImage(file)
      update({ photos: draft.photos.map((photo) => photo.id === id ? { ...photo, url, alt: `${draft.name}的${roleNames[photo.role]}`, source: 'merchant' } : photo) })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '圖片處理失敗。')
    }
  }
  return (
    <div className="editor-section">
      <div className="editor-heading"><div><p>網站圖片</p><h2>不喜歡哪張，就換成自己的</h2></div><span className="count-badge">5 個版位</span></div>
      <p className="editor-help">系統先用產業共用圖庫完成網站。點任一張圖片即可替換；上傳後會自動最佳化。</p>
      <p className="google-source-note">共用圖片只作形象情境，不代表你的真實店面、員工或作品。</p>
      {error && <p className="field-error">{error}</p>}
      <div className="photo-picker">
        {draft.photos.map((photo) => (
          <article key={photo.id}>
            <label className="photo-replace">
              <img src={photo.url} alt={photo.alt} />
              <span><Upload size={14} /> 替換圖片</span>
              <em>{roleNames[photo.role]}</em>
              <input type="file" accept="image/*" onChange={(event) => replace(photo.id, event.target.files?.[0])} />
            </label>
            {photo.sourceUrl && <div className="source-links"><a href={photo.sourceUrl} target="_blank" rel="noreferrer">查看圖片來源 ↗</a></div>}
          </article>
        ))}
      </div>
    </div>
  )
}

function TemplateSwitcher({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  const previewPhotos = draft.photos.filter((photo) => photo.selected).slice(0, 3)
  if (previewPhotos.length === 0 && draft.photos[0]) previewPhotos.push(draft.photos[0])
  return (
    <div className="template-switcher" aria-label="網站版型">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          className={draft.template === template.id ? 'active' : ''}
          onClick={() => update({ template: template.id, accent: template.accent })}
          aria-pressed={draft.template === template.id}
        >
          <span className={`template-thumb is-${template.id}`} style={{ '--template-accent': template.accent } as React.CSSProperties}>
            {previewPhotos.map((photo, index) => <img key={photo.id} className={`thumb-photo-${index + 1}`} src={photo.url} alt="" aria-hidden="true" />)}
            <i /><i /><i />
          </span>
          <div><strong>{template.name}</strong><small>{template.note}</small></div>
          {draft.template === template.id && <Check size={15} aria-hidden="true" />}
        </button>
      ))}
    </div>
  )
}

function TemplateEditor({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  return (
    <div className="editor-section template-editor">
      <div className="editor-heading"><div><p>網站風格</p><h2>先挑一個最像你店裡的版型</h2></div><span className="count-badge">5 選 1</span></div>
      <p className="editor-help">切換後右側會立即更新。內容不會消失，之後也能隨時回來更換。</p>
      <TemplateSwitcher draft={draft} update={update} />
      <div className="template-detail">
        <span>目前選擇</span>
        <strong>{templateNames[draft.template]}</strong>
        <p>{templates.find((template) => template.id === draft.template)?.note}，適合用照片和空間氛圍建立第一印象。</p>
      </div>
    </div>
  )
}

function Studio({ draft, mode, onChange, onReset }: { draft: BusinessDraft; mode: 'demo' | 'generated'; onChange: (draft: BusinessDraft) => void; onReset: () => void }) {
  const [tab, setTab] = useState<EditorTab>('template')
  const [viewport, setViewport] = useState<PreviewViewport>('desktop')
  const [studioView, setStudioView] = useState<StudioView>('edit')
  const [creatingBrand, setCreatingBrand] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const html = useMemo(() => renderSite(draft), [draft])

  function update(patch: Partial<BusinessDraft>) {
    onChange({ ...draft, ...patch })
  }

  async function startBrandCheckout() {
    setCreatingBrand(true)
    setCheckoutError('')
    try {
      const brandCheckout = await createBrandCheckout(draft)
      const nextDraft = { ...draft, brandCheckout }
      onChange(nextDraft)
      saveDraft(nextDraft)
      window.location.assign(brandCheckout.checkoutUrl)
    } catch (reason) {
      setCheckoutError(reason instanceof Error ? reason.message : '品牌建立失敗，請稍後再試。')
      setCreatingBrand(false)
    }
  }

  const tabs: Array<{ id: EditorTab; label: string; icon: React.ReactNode }> = [
    { id: 'template', label: '版型', icon: <LayoutTemplate size={17} /> },
    { id: 'content', label: '內容', icon: <Pencil size={17} /> },
    { id: 'photos', label: '照片', icon: <ImageIcon size={17} /> },
  ]

  return (
    <div className="studio-page">
      <Header studio onReset={onReset} />
      <div className="studio-status">
        <div><span className="status-dot" /> {mode === 'demo' ? '草稿自動儲存' : '本次工作階段暫存'}</div>
        <span>{mode === 'demo' ? '目前使用示範資料' : 'AI 文案已生成・圖片來自共用授權圖庫'}</span>
        <span>預覽剩餘 {formatRemainingTime(draft.expiresAt)}</span>
      </div>
      <div className="mobile-studio-switch" aria-label="工作區顯示">
        <button type="button" className={studioView === 'edit' ? 'active' : ''} onClick={() => setStudioView('edit')}><Pencil size={16} /> 編輯資料</button>
        <button type="button" className={studioView === 'preview' ? 'active' : ''} onClick={() => setStudioView('preview')}><Laptop size={16} /> 查看網站</button>
      </div>
      <main className="studio-layout">
        <aside className={`control-panel ${studioView === 'edit' ? 'is-mobile-active' : ''}`}>
          <div className="panel-top"><p>步驟 2 / 3</p><h1>設計你的網站</h1><span>先選版型，再確認內容與照片。</span></div>
          <nav className="editor-tabs" aria-label="編輯網站資料">
            {tabs.map((item) => <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.icon}{item.label}</button>)}
          </nav>
          <div className="panel-scroll">
            {tab === 'template' && <TemplateEditor draft={draft} update={update} />}
            {tab === 'content' && <ContentEditor draft={draft} update={update} />}
            {tab === 'photos' && <PhotoEditor draft={draft} update={update} />}
          </div>
        </aside>

        <section className={`preview-workspace ${studioView === 'preview' ? 'is-mobile-active' : ''}`} aria-label="網站預覽">
          <div className="preview-toolbar">
            <div><span>即時預覽</span><strong>{templateNames[draft.template]}</strong></div>
            <div className="viewport-switcher" aria-label="預覽尺寸">
              <button type="button" className={viewport === 'desktop' ? 'active' : ''} onClick={() => setViewport('desktop')} aria-label="桌面版預覽"><Laptop size={18} /></button>
              <button type="button" className={viewport === 'mobile' ? 'active' : ''} onClick={() => setViewport('mobile')} aria-label="手機版預覽"><Smartphone size={18} /></button>
            </div>
            <button className="text-button" type="button" onClick={() => openPreview(draft)}>新分頁預覽 <ExternalLink size={15} /></button>
          </div>
          <div className={`preview-stage is-${viewport}`}>
            <div className="browser-shell">
              <div className="browser-bar"><span /><span /><span /><small>7 天預覽・{draft.name}</small></div>
              <iframe title={`${draft.name}網站預覽`} srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
            </div>
          </div>
        </section>
      </main>
      <div className="studio-cta"><div><strong>內容都確認好了嗎？</strong><span>下一步前往 lihi 購買網域；付款完成後，我們會建立專屬網站與 EmDash 後台。</span>{checkoutError && <span className="field-error" role="alert">{checkoutError}</span>}</div><button className="primary-button" type="button" disabled={creatingBrand} onClick={startBrandCheckout}>{creatingBrand ? '準備網域購買…' : '建立品牌'} <ChevronRight size={18} /></button></div>
    </div>
  )
}

export default function App() {
  const demoStage = useMemo(() => new URLSearchParams(window.location.search).get('demo'), [])
  const existing = useMemo(() => {
    if (demoStage === 'studio') return createDemoBusiness()
    return loadDraft()
  }, [demoStage])
  const [stage, setStage] = useState<AppStage>(existing ? 'studio' : 'landing')
  const [draft, setDraft] = useState<BusinessDraft | null>(existing)
  const [mode, setMode] = useState<'demo' | 'generated'>('demo')
  const [importStep, setImportStep] = useState(0)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    if (draft) saveDraft(draft)
  }, [draft])

  async function startGeneration(brief: BrandBrief) {
    setImportError('')
    setStage('importing')
    setImportStep(0)
    try {
      setImportStep(1)
      const result = await generateBusiness(brief)
      setImportStep(3)
      setDraft(result.draft)
      setMode(result.mode)
      setStage('studio')
    } catch (error) {
      setDraft(null)
      setImportError(error instanceof Error ? error.message : '生成網站時發生錯誤，請稍後再試。')
      setStage('landing')
    }
  }

  function useDemo() {
    setDraft(createDemoBusiness())
    setMode('demo')
    setImportError('')
    setStage('studio')
  }

  function reset() {
    clearDraft()
    setDraft(null)
    setImportError('')
    setStage('landing')
  }

  if (stage === 'importing') return <Importing activeStep={importStep} />
  if (stage === 'studio' && draft) return <Studio draft={draft} mode={mode} onChange={setDraft} onReset={reset} />
  return <Landing onGenerate={startGeneration} onDemo={useDemo} initialError={importError} />
}
