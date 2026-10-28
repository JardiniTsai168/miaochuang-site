import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  Laptop,
  LayoutTemplate,
  MapPin,
  MessageSquareQuote,
  Palette,
  Pencil,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Sparkles,
  Store,
} from 'lucide-react'
import { createDemoBusiness } from './data/demoBusiness'
import { regenerateCopy } from './lib/copyGenerator'
import { clearDraft, formatRemainingTime, loadDraft, saveDraft } from './lib/draftStorage'
import { openPreview, renderSite, templateNames } from './lib/renderSite'
import { importBusiness, isGoogleBusinessUrl } from './lib/source'
import type { AppStage, BusinessDraft, PreviewViewport, TemplateId } from './types'

type EditorTab = 'template' | 'content' | 'photos' | 'reviews'
type StudioView = 'edit' | 'preview'

const templates: Array<{ id: TemplateId; name: string; note: string; accent: string }> = [
  { id: 'editorial', name: '編輯誌', note: '雜誌封面・影像先行', accent: '#B85D3F' },
  { id: 'vivid', name: '醒目海報', note: '撞色標語・活動感強', accent: '#E65463' },
  { id: 'calm', name: '靜謐藝廊', note: '極簡分割・質感留白', accent: '#607A68' },
  { id: 'compact', name: '手作菜單', note: '資訊格線・服務優先', accent: '#315D68' },
  { id: 'mosaic', name: '影像拼貼', note: '不對稱相冊・故事感', accent: '#8A4D76' },
]

const importSteps = ['確認商家網址', '整理照片與評論', '生成網站文案', '準備三種版型']

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
        <div className="header-note"><span /> 48 小時免費預覽</div>
      )}
    </header>
  )
}

function Landing({ onImport }: { onImport: (url: string) => void }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!isGoogleBusinessUrl(url)) {
      setError('請貼上完整的 Google 地圖商家網址，例如 https://maps.app.goo.gl/...')
      return
    }
    setError('')
    onImport(url)
  }

  function useDemo() {
    const demoUrl = createDemoBusiness().sourceUrl
    setUrl(demoUrl)
    setError('')
    onImport(demoUrl)
  }

  return (
    <div className="landing" id="top">
      <Header />
      <main>
        <section className="hero-app" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={15} aria-hidden="true" /> 給還沒有官網的實體店家</p>
            <h1 id="hero-title"><span>貼上 Google 商家，</span><br /><em>秒變你的品牌網站。</em></h1>
            <p className="hero-lead">照片、評論、營業資訊一次整理。你只要確認內容、挑一個喜歡的版型，就能準備好自己的官方網站。</p>
            <form className="source-form" onSubmit={submit} noValidate>
              <label htmlFor="google-business-url">Google 商家網址</label>
              <div className={`url-control ${error ? 'has-error' : ''}`}>
                <MapPin size={20} aria-hidden="true" />
                <input
                  id="google-business-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  aria-describedby={error ? 'source-error source-help' : 'source-help'}
                  aria-invalid={Boolean(error)}
                />
                <button className="primary-button" type="submit">
                  生成我的網站 <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
              {error && <p className="field-error" id="source-error">{error}</p>}
              <div className="source-help" id="source-help">
                <span>不需要登入・約 1 分鐘完成</span>
                <button type="button" onClick={useDemo}>先看示範結果</button>
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
            <div className="floating-note note-source"><Check size={16} /> 商家資料已整理</div>
            <div className="floating-note note-time"><Clock3 size={16} /> 只花 58 秒</div>
          </div>
        </section>

        <section className="how-it-works" aria-labelledby="how-title">
          <div className="section-intro"><p>簡單到不需要學</p><h2 id="how-title">三步，讓店家有一個正式網址</h2></div>
          <ol>
            <li><span>01</span><div><MapPin aria-hidden="true" /><h3>貼上商家網址</h3><p>自動整理店名、照片、評論與營業資訊。</p></div></li>
            <li><span>02</span><div><Palette aria-hidden="true" /><h3>確認內容與版型</h3><p>補上想說的話，再從三種風格挑一個。</p></div></li>
            <li><span>03</span><div><Store aria-hidden="true" /><h3>選網址，準備發布</h3><p>網站與品牌網址一起準備，不需要碰程式碼。</p></div></li>
          </ol>
        </section>

        <section className="scope-note">
          <p>首年網站託管隨新購網域免費</p>
          <strong>第二年託管 NT$999／年</strong>
          <span>網域續約費另計・付款前清楚顯示</span>
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

function ContentEditor({ draft, update, onRegenerate }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void; onRegenerate: () => void }) {
  const remaining = 3 - draft.regenerationCount
  return (
    <div className="editor-section">
      <div className="editor-heading"><div><p>網站內容</p><h2>先確認店家怎麼被介紹</h2></div><span className="source-badge">Google + 店家補充</span></div>
      <Field label="店家名稱" value={draft.name} onChange={(name) => update({ name })} />
      <div className="field-row">
        <Field label="店家分類" value={draft.category} onChange={(category) => update({ category })} />
        <Field label="電話" value={draft.phone} onChange={(phone) => update({ phone })} />
      </div>
      <Field label="主標題" value={draft.tagline} onChange={(tagline) => update({ tagline })} hint="AI 依照現有資料產生，你可以直接修改。" />
      <Field label="店家介紹" value={draft.description} onChange={(description) => update({ description })} multiline />
      <div className="regenerate-row">
        <button className="secondary-button" type="button" onClick={onRegenerate} disabled={remaining <= 0}>
          <RefreshCw size={16} aria-hidden="true" /> 重新生成文案
        </button>
        <span>{remaining > 0 ? `還可生成 ${remaining} 次` : '已用完 3 次生成額度'}</span>
      </div>
      <Field label="服務／商品（每行一項）" value={draft.services.join('\n')} onChange={(value) => update({ services: value.split('\n').map((item) => item.trim()).filter(Boolean) })} multiline />
      <Field label="地址" value={draft.address} onChange={(address) => update({ address })} />
      <div className="field-row">
        <Field label="LINE 連結" value={draft.lineUrl} onChange={(lineUrl) => update({ lineUrl })} />
        <Field label="Instagram 連結" value={draft.instagramUrl} onChange={(instagramUrl) => update({ instagramUrl })} />
      </div>
      <Field label="短影音連結（選填）" value={draft.videoUrl} onChange={(videoUrl) => update({ videoUrl })} hint="支援 YouTube 嵌入；其他平台會顯示為外部觀看連結。" />
    </div>
  )
}

function PhotoEditor({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  const selected = draft.photos.filter((photo) => photo.selected).length
  function toggle(id: string) {
    const target = draft.photos.find((photo) => photo.id === id)
    if (!target || (!target.selected && selected >= 12)) return
    update({ photos: draft.photos.map((photo) => photo.id === id ? { ...photo, selected: !photo.selected } : photo) })
  }
  return (
    <div className="editor-section">
      <div className="editor-heading"><div><p>店家照片</p><h2>最多選 12 張最能代表店家的照片</h2></div><span className="count-badge">已選 {selected}／上限 12</span></div>
      <p className="editor-help">第一張選取的照片會成為網站主視覺。點擊照片即可顯示或隱藏。</p>
      <div className="photo-picker">
        {draft.photos.map((photo, index) => (
          <button key={photo.id} className={photo.selected ? 'selected' : ''} type="button" onClick={() => toggle(photo.id)} aria-pressed={photo.selected}>
            <img src={photo.url} alt={photo.alt} />
            <span>{photo.selected ? <Check size={14} /> : index + 1}</span>
            {photo.selected && index === draft.photos.findIndex((item) => item.selected) && <em>主視覺</em>}
          </button>
        ))}
      </div>
      <div className="upload-placeholder"><ImageIcon size={21} aria-hidden="true" /><div><strong>自行上傳照片</strong><span>正式串接儲存空間後開放；目前先使用商家來源照片。</span></div></div>
    </div>
  )
}

function ReviewEditor({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  function toggle(id: string) {
    update({ reviews: draft.reviews.map((review) => review.id === id ? { ...review, selected: !review.selected } : review) })
  }
  return (
    <div className="editor-section">
      <div className="editor-heading"><div><p>Google 評論</p><h2>挑選要放上網站的真實評價</h2></div><span className="source-badge">保留原文</span></div>
      <p className="editor-help">評論內容不能修改，只能選擇顯示或隱藏。網站會保留 Google 來源標示。</p>
      <div className="review-picker">
        {draft.reviews.map((review) => (
          <button key={review.id} className={review.selected ? 'selected' : ''} type="button" onClick={() => toggle(review.id)} aria-pressed={review.selected}>
            <span className="check-box">{review.selected && <Check size={14} />}</span>
            <div><div className="review-meta"><strong>{review.author}</strong><span>{'★'.repeat(review.rating)}</span></div><p>{review.text}</p><small>{review.relativeTime}・Google 評論</small></div>
          </button>
        ))}
      </div>
    </div>
  )
}

function TemplateSwitcher({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  const previewPhoto = draft.photos.find((photo) => photo.selected) ?? draft.photos[0]
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
            {previewPhoto && <img src={previewPhoto.url} alt="" aria-hidden="true" />}
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

function Studio({ draft, mode, onChange, onReady, onReset }: { draft: BusinessDraft; mode: 'demo' | 'live'; onChange: (draft: BusinessDraft) => void; onReady: () => void; onReset: () => void }) {
  const [tab, setTab] = useState<EditorTab>('template')
  const [viewport, setViewport] = useState<PreviewViewport>('desktop')
  const [studioView, setStudioView] = useState<StudioView>('edit')
  const html = useMemo(() => renderSite(draft), [draft])

  function update(patch: Partial<BusinessDraft>) {
    onChange({ ...draft, ...patch })
  }

  const tabs: Array<{ id: EditorTab; label: string; icon: React.ReactNode }> = [
    { id: 'template', label: '版型', icon: <LayoutTemplate size={17} /> },
    { id: 'content', label: '內容', icon: <Pencil size={17} /> },
    { id: 'photos', label: '照片', icon: <ImageIcon size={17} /> },
    { id: 'reviews', label: '評論', icon: <MessageSquareQuote size={17} /> },
  ]

  return (
    <div className="studio-page">
      <Header studio onReset={onReset} />
      <div className="studio-status">
        <div><span className="status-dot" /> 草稿自動儲存</div>
        <span>{mode === 'demo' ? '目前使用示範資料' : 'Google 商家資料已匯入'}</span>
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
            {tab === 'content' && <ContentEditor draft={draft} update={update} onRegenerate={() => onChange(regenerateCopy(draft))} />}
            {tab === 'photos' && <PhotoEditor draft={draft} update={update} />}
            {tab === 'reviews' && <ReviewEditor draft={draft} update={update} />}
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
              <div className="browser-bar"><span /><span /><span /><small>48 小時預覽・{draft.name}</small></div>
              <iframe title={`${draft.name}網站預覽`} srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
            </div>
          </div>
        </section>
      </main>
      <div className="studio-cta"><div><strong>內容都確認好了嗎？</strong><span>下一步將選擇品牌網址；本階段先展示交接畫面。</span></div><button className="primary-button" type="button" onClick={onReady}>確認網站，前往選網址 <ChevronRight size={18} /></button></div>
    </div>
  )
}

function Ready({ draft, onBack, onReset }: { draft: BusinessDraft; onBack: () => void; onReset: () => void }) {
  return (
    <div className="ready-page">
      <Header studio onReset={onReset} />
      <main className="ready-layout">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={17} /> 回到網站預覽</button>
        <div className="ready-copy">
          <div className="ready-title-row"><span className="ready-check"><Check size={22} /></span><p className="eyebrow">網站草稿已準備完成</p></div>
          <h1>下一步，替「{draft.name}」選一個正式網址</h1>
          <p>你的內容、照片與「{templateNames[draft.template]}」版型都已儲存。lihiDomain 串接完成後，這裡會直接顯示可購買的網域名稱與價格。</p>
          <div className="ready-actions"><button className="primary-button" type="button" disabled>搜尋可用網域（下一階段串接）</button><button className="secondary-button" type="button" onClick={() => openPreview(draft)}>再次查看網站 <ExternalLink size={15} /></button></div>
        </div>
        <aside className="handoff-card">
          <p>已完成</p>
          <ul><li><Check size={15} /> 商家資料與網站文案</li><li><Check size={15} /> {draft.photos.filter((photo) => photo.selected).length} 張店家照片</li><li><Check size={15} /> {draft.reviews.filter((review) => review.selected).length} 則 Google 評論</li><li><Check size={15} /> {templateNames[draft.template]}版型</li><li><Check size={15} /> 48 小時預覽草稿</li></ul>
          <div><span>待串接</span><strong>lihiDomain 帳號、網域搜尋、結帳與部署</strong></div>
        </aside>
      </main>
    </div>
  )
}

export default function App() {
  const demoStage = useMemo(() => new URLSearchParams(window.location.search).get('demo'), [])
  const existing = useMemo(() => {
    if (demoStage === 'studio' || demoStage === 'ready') return createDemoBusiness()
    return loadDraft()
  }, [demoStage])
  const [stage, setStage] = useState<AppStage>(demoStage === 'ready' ? 'ready' : existing ? 'studio' : 'landing')
  const [draft, setDraft] = useState<BusinessDraft | null>(existing)
  const [mode, setMode] = useState<'demo' | 'live'>('demo')
  const [importStep, setImportStep] = useState(0)

  useEffect(() => {
    if (draft) saveDraft(draft)
  }, [draft])

  async function startImport(sourceUrl: string) {
    setStage('importing')
    setImportStep(0)
    const timer = window.setInterval(() => setImportStep((current) => Math.min(current + 1, importSteps.length - 1)), 520)
    try {
      const result = await importBusiness(sourceUrl)
      await new Promise((resolve) => window.setTimeout(resolve, 1250))
      setDraft(result.draft)
      setMode(result.mode)
      setStage('studio')
    } finally {
      window.clearInterval(timer)
    }
  }

  function reset() {
    clearDraft()
    setDraft(null)
    setStage('landing')
  }

  if (stage === 'importing') return <Importing activeStep={importStep} />
  if (stage === 'studio' && draft) return <Studio draft={draft} mode={mode} onChange={setDraft} onReady={() => setStage('ready')} onReset={reset} />
  if (stage === 'ready' && draft) return <Ready draft={draft} onBack={() => setStage('studio')} onReset={reset} />
  return <Landing onImport={startImport} />
}
