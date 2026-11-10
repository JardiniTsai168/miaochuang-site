import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowLeft, BarChart3, Check, ChevronRight, Clock3, ExternalLink, Globe2, Image as ImageIcon, Laptop, LayoutTemplate, Link2, Mail, BadgeCheck, Palette, Pencil, QrCode, RefreshCw, RotateCcw, Search, ShieldCheck, Smartphone, Sparkles, Store, Upload } from 'lucide-react'
import { createDemoBusiness } from './data/demoBusiness'
import { getIndustryPalette, normalizePaletteRecommendations, paletteIds, palettes, type PaletteId } from './data/industryPalettes'
import { createIndustryPhotos } from './data/industryPhotos'
import { clearDraft, formatRemainingTime, loadDraft, saveDraft } from './lib/draftStorage'
import { openPreview, renderSite, templateNames } from './lib/renderSite'
import { generateBusiness, validateBrief } from './lib/source'
import { optimizeImage } from './lib/image'
import { createBrandCheckout } from './lib/brandCheckout'
import { getDomainSuggestions } from './lib/domainSuggestions'
import type { AppStage, BrandBrief, BusinessDraft, PreviewViewport, TemplateId } from './types'

type EditorTab = 'template' | 'content' | 'photos'
type StudioView = 'edit' | 'preview'

const templates: Array<{
  id: TemplateId
  name: string
  note: string
  accent: string
}> = [
  {
    id: 'marketing',
    name: 'Marketing',
    note: '官方行銷頁・轉換導向',
    accent: '#171717',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    note: '官方作品集・影像主導',
    accent: '#111111',
  },
  { id: 'blog', name: 'Blog', note: '官方內容誌・故事優先', accent: '#9B3D24' },
  {
    id: 'starter',
    name: 'Starter',
    note: '官方基礎版・清楚實用',
    accent: '#3157D5',
  },
]

const importSteps = ['整理品牌重點', '撰寫網站文案', '搭配產業圖片', '套用官方版型']
const industries = ['美髮', '美容／美甲／美睫', '按摩／SPA', '健身／瑜伽／教練', '攝影／設計／個人工作室', '居家清潔／維修服務', '其他服務業']

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="秒創網站首頁">
      <img src={`${import.meta.env.BASE_URL}lihi-logo-primary.png`} alt="lihi" />
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-name">秒創網站</span>
    </a>
  )
}

function Header({ onReset, studio = false }: { onReset?: () => void; studio?: boolean }) {
  return (
    <header className={`app-header ${studio ? 'is-studio' : ''}`}>
      <Brand />
      {studio ? (
        <button className="text-button" type="button" onClick={onReset}>
          <RotateCcw size={16} aria-hidden="true" /> 重新開始
        </button>
      ) : (
        <div className="header-note">
          <span /> 30 天免費預覽
        </div>
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
    const brief: BrandBrief = {
      industry,
      brandName,
      advantages,
      offerings,
      hours,
    }
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
          <p className="eyebrow hero-eyebrow">
            <Sparkles size={15} aria-hidden="true" /> 給想快速建立品牌網站的你
          </p>
          <div className="hero-copy">
            <h1 id="hero-title">
              <span>說出品牌的優勢，</span>
              <br />
              <em>AI 幫你完成網站。</em>
            </h1>
            <p className="hero-lead">輸入品牌重點，我們會產出網站文案、搭配合適圖片，再讓你從五個版型中挑選與修改。</p>
            <form className="source-form brief-form" onSubmit={submit} noValidate>
              <div className="brief-row">
                <label>
                  產業類型
                  <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                    <option value="">請選擇產業</option>
                    {industries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  品牌／店家名稱
                  <input value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="例如：日光髮所" />
                </label>
              </div>
              <div className="brief-groups">
                <fieldset>
                  <legend>三個優點或優勢</legend>
                  {advantages.map((value, index) => (
                    <label key={index}>
                      <span>{index + 1}</span>
                      <input value={value} onChange={(event) => setAdvantages((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)) as [string, string, string])} placeholder={['最值得被記住的特色', '和別人不同的地方', '顧客選擇你的理由'][index]} />
                    </label>
                  ))}
                </fieldset>
                <fieldset>
                  <legend>
                    主要服務或商品 <small>至少 1 項</small>
                  </legend>
                  {offerings.map((value, index) => (
                    <label key={index}>
                      <span>{index + 1}</span>
                      <input value={value} onChange={(event) => setOfferings((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)) as [string, string, string])} placeholder={['例如：剪髮', '例如：染髮（選填）', '例如：頭皮護理（選填）'][index]} />
                    </label>
                  ))}
                </fieldset>
              </div>
              <label className="hours-field">
                營業時間 <small>選填</small>
                <textarea value={hours} onChange={(event) => setHours(event.target.value)} rows={2} placeholder={'例如：\n週一至週五 10:00–19:00'} />
              </label>
              {error && (
                <p className="field-error" id="source-error">
                  {error}
                </p>
              )}
              <div className="brief-actions">
                <button className="primary-button" type="submit">
                  生成我的網站 <ArrowRight size={18} aria-hidden="true" />
                </button>
                <span>通常在 20 秒內完成</span>
                <button type="button" onClick={onDemo}>
                  先看示範結果
                </button>
              </div>
            </form>
          </div>
          <div className="hero-rail">
            <div className="hero-demo" aria-label="網站生成流程示意">
              <div className="demo-window">
                <div className="window-bar">
                  <span />
                  <span />
                  <span />
                  <small>preview.miaochuang.tw</small>
                </div>
                <div className="demo-site">
                  <div className="demo-image">
                    <span>日光散步珈琲</span>
                  </div>
                  <div className="demo-copy">
                    <span>把午後留給一杯好咖啡</span>
                    <i />
                  </div>
                </div>
              </div>
              <div className="floating-note note-source">
                <Check size={16} /> 文案與圖片已搭配
              </div>
              <div className="floating-note note-time">
                <Clock3 size={16} /> 四套官方版型任你挑
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works" aria-labelledby="how-title">
          <div className="section-intro">
            <p>簡單到不用學</p>
            <h2 id="how-title">三步，讓店家有一個正式網址</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <BadgeCheck aria-hidden="true" />
                <h3>提供品牌重點</h3>
                <p>產業、名稱、三個優勢與主要服務；營業時間選填。</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <Palette aria-hidden="true" />
                <h3>立即生成範例</h3>
                <p>AI 寫文案，系統從授權圖庫搭配適合的網站圖片。</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <Store aria-hidden="true" />
                <h3>確認並建立品牌</h3>
                <p>修改內容後前往購買網域，再建立正式網站。</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="scope-note">
          <p>生成與 30 天預覽免費</p>
          <strong>申請網域，第一年網站服務免費</strong>
          <span>正式收費與網域流程將由 lihi 訂閱機制處理</span>
        </section>
      </main>
      <footer className="app-footer">
        <Brand />
        <p>利害短網址有限公司・Powered by lihi.io</p>
      </footer>
    </div>
  )
}

function Importing({ activeStep }: { activeStep: number }) {
  return (
    <div className="import-screen">
      <Header studio />
      <main className="import-panel" aria-live="polite">
        <div className="import-intro">
          <div className="import-orbit">
            <Store size={34} aria-hidden="true" />
            <span />
            <span />
          </div>
          <div>
            <p className="eyebrow">正在建立你的網站</p>
            <h1>
              正在整理資料，
              <br />
              建立完整的店家故事。
            </h1>
          </div>
        </div>
        <ol>
          {importSteps.map((step, index) => (
            <li key={step} className={index < activeStep ? 'done' : index === activeStep ? 'active' : ''}>
              <span>{index < activeStep ? <Check size={15} /> : index + 1}</span>
              {step}
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
      {multiline ? <textarea id={id} value={value} rows={4} onChange={(event) => onChange(event.target.value)} /> : <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />}
      {hint && <small>{hint}</small>}
    </div>
  )
}

function ContentEditor({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  return (
    <div className="editor-section">
      <div className="editor-heading">
        <div>
          <p>網站內容</p>
          <h2>先確認品牌怎麼被介紹</h2>
        </div>
        <span className="source-badge">AI 生成・可修改</span>
      </div>
      <Field label="品牌／網站名稱" value={draft.name} onChange={(name) => update({ name })} />
      <div className="field-row">
        <Field label="產業類型" value={draft.category} onChange={(category) => update({ category })} />
        <Field label="電話（選填）" value={draft.phone} onChange={(phone) => update({ phone })} />
      </div>
      <Field label="主標題" value={draft.tagline} onChange={(tagline) => update({ tagline })} hint="AI 依照現有資料產生，你可以直接修改。" />
      <Field label="店家介紹" value={draft.description} onChange={(description) => update({ description })} multiline />
      <Field
        label="三個優點／優勢（每行一項）"
        value={draft.services.join('\n')}
        onChange={(value) =>
          update({
            services: value
              .split('\n')
              .map((item) => item.trim())
              .filter(Boolean)
              .slice(0, 3),
          })
        }
        multiline
      />
      <Field
        label="主要服務／商品（每行一項）"
        value={draft.offerings.join('\n')}
        onChange={(value) =>
          update({
            offerings: value
              .split('\n')
              .map((item) => item.trim())
              .filter(Boolean)
              .slice(0, 3),
          })
        }
        multiline
      />
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
  const roleNames = {
    hero: '網站主視覺',
    people: '人物／服務情境',
    service: '服務特色',
    space: '空間氛圍',
    detail: '細節特寫',
  }

  async function replace(id: string, file?: File) {
    if (!file) return
    setError('')
    try {
      const url = await optimizeImage(file)
      update({
        photos: draft.photos.map((photo) =>
          photo.id === id
            ? {
                ...photo,
                url,
                alt: `${draft.name}的${roleNames[photo.role]}`,
                source: 'merchant',
              }
            : photo,
        ),
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '圖片處理失敗。')
    }
  }

  async function replaceLogo(file?: File) {
    if (!file) return
    setError('')
    try {
      update({ logoUrl: await optimizeImage(file) })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Logo 處理失敗。')
    }
  }
  return (
    <div className="editor-section">
      <div className="editor-heading">
        <div>
          <p>網站圖片</p>
          <h2>不喜歡哪張，就換成自己的</h2>
        </div>
        <span className="count-badge">5 個版位</span>
      </div>
      <p className="editor-help">系統先用產業共用圖庫完成網站。點任一張圖片即可替換；上傳後會自動最佳化。</p>
      {error && <p className="field-error">{error}</p>}
      <article className="logo-uploader">
        <div className="logo-preview">
          {draft.logoUrl ? <img src={draft.logoUrl} alt={`${draft.name} Logo`} /> : <strong>{draft.name.slice(0, 2)}</strong>}
        </div>
        <div>
          <strong>品牌 Logo</strong>
          <span>建議使用透明背景 PNG；會出現在導覽列與頁尾。</span>
        </div>
        <label className="logo-upload-button">
          <Upload size={14} /> {draft.logoUrl ? '更換 Logo' : '上傳 Logo'}
          <input type="file" accept="image/*" onChange={(event) => replaceLogo(event.target.files?.[0])} />
        </label>
        {draft.logoUrl && <button className="logo-remove-button" type="button" onClick={() => update({ logoUrl: undefined })}>改用文字</button>}
      </article>
      <div className="photo-picker">
        {draft.photos.map((photo) => (
          <article key={photo.id}>
            <label className="photo-replace">
              <img src={photo.url} alt={photo.alt} />
              <span>
                <Upload size={14} /> 替換圖片
              </span>
              <input type="file" accept="image/*" onChange={(event) => replace(photo.id, event.target.files?.[0])} />
            </label>
          </article>
        ))}
      </div>
    </div>
  )
}

function TemplateSwitcher({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  const previewPhotos = draft.photos.filter((photo) => photo.selected).slice(0, 3)
  const palette = getIndustryPalette(draft.category, draft.paletteKey)
  if (previewPhotos.length === 0 && draft.photos[0]) previewPhotos.push(draft.photos[0])
  return (
    <div className="template-switcher" aria-label="網站版型">
      {templates.map((template) => (
        <button key={template.id} type="button" className={draft.template === template.id ? 'active' : ''} onClick={() => update({ template: template.id, accent: palette.accent })} aria-pressed={draft.template === template.id}>
          <span className={`template-thumb is-${template.id}`} style={{ '--template-accent': palette.accent, '--template-bg': palette.background, '--template-soft': palette.soft, '--template-ink': palette.ink, '--template-muted': palette.muted, '--template-surface': palette.surface } as React.CSSProperties}>
            {previewPhotos.map((photo, index) => (
              <img key={photo.id} className={`thumb-photo-${index + 1}`} src={photo.url} alt="" aria-hidden="true" />
            ))}
            <i />
            <i />
            <i />
          </span>
          <div>
            <strong>{template.name}</strong>
            <small>{template.note}</small>
          </div>
          {draft.template === template.id && <Check size={15} aria-hidden="true" />}
        </button>
      ))}
    </div>
  )
}

function TemplateEditor({ draft, update }: { draft: BusinessDraft; update: (patch: Partial<BusinessDraft>) => void }) {
  const recommendations = normalizePaletteRecommendations(draft.category, draft.paletteRecommendations)
  const palette = getIndustryPalette(draft.category, draft.paletteKey)
  return (
    <div className="editor-section template-editor">
      <div className="editor-heading">
        <div>
          <p>官方網站版型</p>
          <h2>選擇網站的內容結構</h2>
        </div>
        <span className="count-badge">4 選 1</span>
      </div>
      <p className="editor-help">四套皆以 EmDash 官方 Cloudflare template 為基礎；預覽與部署使用同一個 renderer。</p>
      <div className="palette-recommendations" aria-label="AI 推薦色系">
        <div className="palette-recommendations-heading">
          <div><Sparkles size={15} aria-hidden="true" /><strong>AI 推薦 3 組品牌色系</strong></div>
          <span>已套用「{palette.name}」</span>
        </div>
        <div className="palette-options">
          {recommendations.map((id) => {
            const option = palettes[id]
            const selected = palette.id === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={selected ? 'active' : ''}
                aria-pressed={selected}
                aria-label={`${option.name}：${option.mood}`}
                onClick={() => update({ paletteKey: option.id, accent: option.accent })}
              >
                <span className="palette-swatches" aria-hidden="true">
                  {[option.accent, option.soft, option.background].map((color) => <i key={color} style={{ background: color }} />)}
                </span>
                <span><strong>{option.name}</strong><small>{option.mood}</small></span>
                {selected && <Check size={15} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>
      <TemplateSwitcher draft={draft} update={update} />
      <div className="template-detail">
        <span>目前選擇</span>
        <strong>{templateNames[draft.template]}</strong>
        <p>
          {templates.find((template) => template.id === draft.template)?.note}
          。正式部署後會保留相同結構與視覺。
        </p>
      </div>
    </div>
  )
}

function Studio({ draft, mode, onChange, onReset, onLaunch }: { draft: BusinessDraft; mode: 'demo' | 'generated'; onChange: (draft: BusinessDraft) => void; onReset: () => void; onLaunch: () => void }) {
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
  ]

  return (
    <div className="studio-page">
      <Header studio onReset={onReset} />
      <div className="studio-status">
        <div>
          <span className="status-dot" /> {mode === 'demo' ? '草稿自動儲存' : '本次工作階段暫存'}
        </div>
        <span>{mode === 'demo' ? '目前使用示範資料' : 'AI 文案已生成・圖片來自共用授權圖庫'}</span>
        <span>預覽剩餘 {formatRemainingTime(draft.expiresAt)}</span>
      </div>
      <div className="mobile-studio-switch" aria-label="工作區顯示">
        <button type="button" className={studioView === 'edit' ? 'active' : ''} onClick={() => setStudioView('edit')}>
          <Pencil size={16} /> 編輯資料
        </button>
        <button type="button" className={studioView === 'preview' ? 'active' : ''} onClick={() => setStudioView('preview')}>
          <Laptop size={16} /> 查看網站
        </button>
      </div>
      <main className="studio-layout">
        <aside className={`control-panel ${studioView === 'edit' ? 'is-mobile-active' : ''}`}>
          <div className="panel-top">
            <p>步驟 2 / 3</p>
            <h1>設計你的網站</h1>
            <span>先選版型，再確認內容與照片。</span>
          </div>
          <nav className="editor-tabs" aria-label="編輯網站資料">
            {tabs.map((item) => (
              <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="panel-scroll">
            {tab === 'template' && <TemplateEditor draft={draft} update={update} />}
            {tab === 'content' && <ContentEditor draft={draft} update={update} />}
            {tab === 'photos' && <PhotoEditor draft={draft} update={update} />}
          </div>
        </aside>

        <section className={`preview-workspace ${studioView === 'preview' ? 'is-mobile-active' : ''}`} aria-label="網站預覽">
          <div className="preview-toolbar">
            <div>
              <span>即時預覽</span>
              <strong>{templateNames[draft.template]}</strong>
            </div>
            <div className="viewport-switcher" aria-label="預覽尺寸">
              <button type="button" className={viewport === 'desktop' ? 'active' : ''} onClick={() => setViewport('desktop')} aria-label="桌面版預覽">
                <Laptop size={18} />
              </button>
              <button type="button" className={viewport === 'mobile' ? 'active' : ''} onClick={() => setViewport('mobile')} aria-label="手機版預覽">
                <Smartphone size={18} />
              </button>
            </div>
            <button className="text-button" type="button" onClick={() => openPreview(draft)}>
              新分頁預覽 <ExternalLink size={15} />
            </button>
          </div>
          <div className={`preview-stage is-${viewport}`}>
            <div className="browser-shell">
              <div className="browser-bar">
                <span />
                <span />
                <span />
                <small>30 天預覽・{draft.name}</small>
              </div>
              <iframe title={`${draft.name}網站預覽`} srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
            </div>
          </div>
        </section>
      </main>
      <div className="studio-cta">
        <div>
          <strong>內容都確認好了嗎？</strong>
          <span>下一步，部署你的網站讓它上線</span>
        </div>
        <button className="primary-button" type="button" onClick={onLaunch}>
          網站上線 <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

type LaunchChoice = 'public' | 'brand'

const domainBenefits = [
  {
    icon: <ShieldCheck aria-hidden="true" />,
    title: '建立品牌信任',
    text: '專屬網域更容易被記住，也讓顧客更放心點擊與分享。',
  },
  {
    icon: <Mail aria-hidden="true" />,
    title: '保留專業品牌信箱',
    text: '可延伸 hello@你的品牌網域，對外聯繫更一致。',
  },
  {
    icon: <QrCode aria-hidden="true" />,
    title: '串接 QR Code 與短網址',
    text: '同一個品牌網域可延伸到社群、活動與線下素材。',
  },
  {
    icon: <BarChart3 aria-hidden="true" />,
    title: '追蹤行銷成效',
    text: '搭配 lihi 的 A/B 測試與連結追蹤，持續優化轉換。',
  },
]

function Launch({ draft, onBack, onReset, onDomain }: { draft: BusinessDraft; onBack: () => void; onReset: () => void; onDomain: () => void }) {
  const [choice, setChoice] = useState<LaunchChoice>('brand')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function deploy() {
    if (choice === 'brand') {
      onDomain()
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const brandCheckout = await createBrandCheckout(draft, choice)
      window.location.assign(brandCheckout.previewUrl)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '網站上線失敗，請稍後再試。')
      setSubmitting(false)
    }
  }

  return (
    <div className="launch-page">
      <header className="app-header is-studio launch-header">
        <Brand />
        <div className="launch-header-actions">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} aria-hidden="true" /> 回到網站設計
          </button>
          <button className="text-button" type="button" onClick={onReset}>
            <RotateCcw size={16} aria-hidden="true" /> 重新開始
          </button>
        </div>
      </header>
      <main className="launch-main">
        <header className="launch-heading">
          <p className="eyebrow">步驟 3 / 3・網站上線</p>
          <h1>選擇網站上線方式</h1>
        </header>

        <section className="launch-options" aria-label="網站上線方式">
          <button type="button" className={`launch-option ${choice === 'public' ? 'active' : ''}`} onClick={() => setChoice('public')} aria-pressed={choice === 'public'}>
            <span className="launch-option-icon">
              <Globe2 aria-hidden="true" />
            </span>
            <span className="launch-option-copy">
              <small>免費・適合先測試</small>
              <strong>部署到公共網域</strong>
              <ul>
                <li>取得可分享的公開網址</li>
                <li>網站發布後無法再次編輯</li>
                <li>網站自發布日起保留 30 天</li>
              </ul>
            </span>
            <span className="choice-mark">{choice === 'public' && <Check size={16} />}</span>
          </button>
          <button type="button" className={`launch-option is-recommended ${choice === 'brand' ? 'active' : ''}`} onClick={() => setChoice('brand')} aria-pressed={choice === 'brand'}>
            <span className="recommend-badge">推薦</span>
            <span className="launch-option-icon">
              <Link2 aria-hidden="true" />
            </span>
            <span className="launch-option-copy">
              <small>品牌長期經營</small>
              <strong>部署到屬於自己的品牌網域</strong>
              <ul>
                <li>專屬後台，隨時更新網站內容</li>
                <li>開放搜尋收錄，持續增加曝光</li>
                <li>Cloudflare 全球安全網路防護</li>
              </ul>
            </span>
            <span className="choice-mark">{choice === 'brand' && <Check size={16} />}</span>
          </button>
        </section>

        <div className="launch-action">
          <div>
            <strong>{choice === 'brand' ? '申請網域，第一年網站服務免費' : '30 天公共預覽免費'}</strong>
            <span>{choice === 'brand' ? '使用專屬網域，減少詐騙，讓品牌更容易被記住。' : '適合先給夥伴或客戶確認，不會被 Google 收錄。'}</span>
          </div>
          <button className="primary-button" type="button" disabled={submitting} onClick={deploy}>
            {submitting ? '正在準備…' : choice === 'brand' ? '前往選擇品牌網域' : '部署公共網址'} <ChevronRight size={18} />
          </button>
        </div>
        {error && (
          <p className="field-error launch-error" role="alert">
            {error}
          </p>
        )}

        <section className="domain-value" aria-labelledby="domain-value-title">
          <div className="domain-value-heading">
            <p>WHY BRAND DOMAIN</p>
            <h2 id="domain-value-title">網域，是品牌的起點。</h2>
          </div>
          <div className="domain-benefits">
            {domainBenefits.map((benefit, index) => (
              <article key={benefit.title}>
                <span>0{index + 1}</span>
                {benefit.icon}
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function DomainSearch({ draft, onChange, onBack, onReset }: { draft: BusinessDraft | null; onChange: (draft: BusinessDraft) => void; onBack: () => void; onReset: () => void }) {
  const searchParams = new URLSearchParams(window.location.search)
  const isDemo = searchParams.get('demo') === 'domain'
  const [brandName, setBrandName] = useState(draft?.name || searchParams.get('brand')?.trim().slice(0, 80) || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function recommend() {
    if (!brandName.trim()) {
      setError('請先輸入品牌名稱。')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = isDemo
        ? {
            suggestions: ['sunnywalk.com', 'sunnywalk.tw', 'sunnywalkcafe.com'],
            remaining: null,
          }
        : await getDomainSuggestions(brandName.trim())
      setSuggestions(result.suggestions)
      setQuery(result.suggestions[0])
      setRemaining(result.remaining)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '網域推薦失敗。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void recommend()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function continueToLihi(event: React.FormEvent) {
    event.preventDefault()
    if (!query.trim()) {
      setError('請輸入想搜尋的網域名稱。')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (draft) {
        const brandCheckout = await createBrandCheckout(draft, 'brand', query.trim())
        const nextDraft = { ...draft, brandCheckout }
        onChange(nextDraft)
        saveDraft(nextDraft)
        window.location.assign(brandCheckout.checkoutUrl)
      } else {
        const searchUrl = new URL('https://app.lihi.io/admin/search')
        searchUrl.searchParams.set('s', query.trim())
        window.location.assign(searchUrl.toString())
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '無法前往網域搜尋，請稍後再試。')
      setSubmitting(false)
    }
  }

  return (
    <div className="domain-search-page">
      <header className="app-header is-studio launch-header">
        <Brand />
        <div className="launch-header-actions">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> 回到上一步
          </button>
          <button className="text-button" type="button" onClick={onReset}>
            <RotateCcw size={16} /> 重新開始
          </button>
        </div>
      </header>
      <main className="domain-search-main">
        <header className="domain-search-heading">
          <p className="eyebrow">品牌網域・名稱建議</p>
          <h1>找到讓人記得住的品牌網域</h1>
          <p>我們先依品牌名稱提供三個方向；選好後會前往 lihi 確認是否可註冊。</p>
        </header>
        <form className="domain-query" onSubmit={continueToLihi}>
          <label htmlFor="domain-query">搜尋你的品牌網域</label>
          <div>
            <Search aria-hidden="true" />
            <input id="domain-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如 yourbrand.com" autoComplete="off" />
            <button className="primary-button" disabled={submitting}>
              {submitting ? '準備中…' : '前往 lihi 查詢'} <ArrowRight size={17} />
            </button>
          </div>
          <p>實際價格與可註冊狀態，以 lihi 搜尋結果為準。</p>
        </form>
        <section className="name-suggestion" aria-labelledby="suggestion-title">
          <div>
            <p>NAME SUGGESTION</p>
            <h2 id="suggestion-title">你的品牌名稱</h2>
          </div>
          <div className="suggestion-control">
            <input aria-label="品牌名稱" value={brandName} onChange={(event) => setBrandName(event.target.value)} maxLength={80} />
            <button className="secondary-button" type="button" onClick={recommend} disabled={loading}>
              <RefreshCw size={16} /> {loading ? '推薦中…' : '重新推薦'}
            </button>
          </div>
          <p className="suggestion-limit">{remaining === null ? '測試期間不限推薦次數' : `每個網路最多可推薦 5 次・剩餘 ${remaining} 次`}</p>
          <div className="suggestion-list" aria-live="polite">
            {suggestions.map((domain) => (
              <button type="button" key={domain} className={query === domain ? 'active' : ''} onClick={() => setQuery(domain)}>
                <span>{domain}</span>
                <small>選擇這個名稱</small>
              </button>
            ))}
          </div>
        </section>
        {error && (
          <p className="field-error domain-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  )
}

export default function App() {
  const demoStage = useMemo(() => new URLSearchParams(window.location.search).get('demo'), [])
  const routeStep = useMemo(() => new URLSearchParams(window.location.search).get('step'), [])
  const demoTemplate = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('template')
    return templates.some((template) => template.id === value) ? (value as TemplateId) : undefined
  }, [])
  const demoIndustry = useMemo(() => new URLSearchParams(window.location.search).get('industry')?.trim().slice(0, 80), [])
  const demoPalette = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('palette')
    return paletteIds.includes(value as PaletteId) ? value as PaletteId : undefined
  }, [])
  const existing = useMemo(() => {
    if (demoStage === 'landing' || demoStage === 'importing') return null
    if (demoStage === 'studio' || demoStage === 'launch' || demoStage === 'domain') {
      const demo = createDemoBusiness()
      const category = demoIndustry || demo.category
      const paletteRecommendations = normalizePaletteRecommendations(category)
      const palette = getIndustryPalette(category, demoPalette || paletteRecommendations[0])
      return {
        ...demo,
        category,
        photos: demoIndustry ? createIndustryPhotos(category, demo.offerings) : demo.photos,
        template: demoTemplate || demo.template,
        paletteKey: palette.id,
        paletteRecommendations,
        accent: palette.accent,
      }
    }
    return loadDraft()
  }, [demoStage, demoTemplate, demoIndustry, demoPalette])
  const [stage, setStage] = useState<AppStage>(demoStage === 'importing' ? 'importing' : demoStage === 'launch' ? 'launch' : demoStage === 'domain' || routeStep === 'domain' ? 'domain' : existing ? 'studio' : 'landing')
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
    const url = new URL(window.location.href)
    url.searchParams.delete('step')
    url.searchParams.delete('brand')
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  function openDomainSearch() {
    const url = new URL(window.location.href)
    url.searchParams.set('step', 'domain')
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
    setStage('domain')
  }

  function closeDomainSearch() {
    const url = new URL(window.location.href)
    url.searchParams.delete('step')
    url.searchParams.delete('brand')
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
    setStage(draft ? 'launch' : 'landing')
  }

  if (stage === 'importing') return <Importing activeStep={demoStage === 'importing' ? 2 : importStep} />
  if (stage === 'domain') return <DomainSearch draft={draft} onChange={setDraft} onBack={closeDomainSearch} onReset={reset} />
  if (stage === 'launch' && draft) return <Launch draft={draft} onBack={() => setStage('studio')} onReset={reset} onDomain={openDomainSearch} />
  if (stage === 'studio' && draft) return <Studio draft={draft} mode={mode} onChange={setDraft} onReset={reset} onLaunch={() => setStage('launch')} />
  return <Landing onGenerate={startGeneration} onDemo={useDemo} initialError={importError} />
}
