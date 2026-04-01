# İkra — Claude Code Proje Talimatları

Bu dosya Claude Code'un İkra projesinde nasıl çalışacağını tanımlar.
Her oturumda otomatik olarak okunur. Değişiklik yapmadan önce editör onayı gerekir.

---

## Proje Kimliği

**İkra** — Aylık yayımlanan bağımsız dijital dergi.  
Dört ana alan: Teknoloji · Zihin & Karakter · İslami İlimler · Hukuk  
Dil: Türkçe (birincil) + İngilizce (Claude API ile otomatik çeviri, editör onaylı)

Tam bağlam için: `docs/context.md` dosyasını oku.

---

## Tech Stack

```
Frontend  : Vue 3 + TypeScript + TailwindCSS
Backend   : Node.js + Express + TypeScript
Veritabanı: PostgreSQL + Prisma ORM
Editör    : Tiptap (rich text)
Auth      : JWT + refresh token
Ödeme     : Stripe (1 TL/ay)
Storage   : Cloudflare R2 (presigned URL upload)
Queue     : Bull + Redis
AI Çeviri : Anthropic Claude API
Deploy    : Railway (başlangıç)
```

---

## Proje Yapısı

```
ikra/
├── CLAUDE.md               ← bu dosya
├── docs/
│   ├── context.md          ← tam proje bağlamı (önce bunu oku)
│   ├── db-schema.md        ← Prisma şema detayları
│   ├── ai-translation.md   ← AI çeviri pipeline
│   └── design-system.md   ← UI/UX kararları
├── client/                 ← Vue 3 frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── stores/         ← Pinia
│       └── composables/
└── server/                 ← Node.js + Express backend
    └── src/
        ├── routes/
        ├── controllers/
        ├── middleware/
        ├── jobs/           ← Bull workers
        └── prisma/
```

---

## Geliştirme Kuralları

### Genel
- Tüm kod **TypeScript** ile yazılır, `any` tipi kullanılmaz
- Her yeni özellik için önce editörden **onay alınır**, sonra geliştirilir
- Commit öncesi editör kodu gözden geçirir
- Türkçe karakter desteği her aşamada test edilir (ş, ğ, ı, ö, ü, ç, İ)

### Frontend (Vue 3)
- Composition API kullanılır, Options API kullanılmaz
- State yönetimi için **Pinia** kullanılır
- Stil için yalnızca **TailwindCSS** kullanılır, inline style eklenmez
- Component isimleri PascalCase: `ArticleCard.vue`, `IssueHero.vue`
- Composable isimleri useX formatı: `useAuth.ts`, `useArticle.ts`
- Her sayfada SEO meta tagları bulunur (vue-meta veya useHead)

### Backend (Node.js + Express)
- Route → Controller → Service katman mimarisi zorunludur
- Her route JWT middleware ile korunur (public route'lar hariç)
- Hata yönetimi merkezi `errorHandler` middleware üzerinden yapılır
- Tüm input'lar **Zod** ile validate edilir
- Environment variable'lar `process.env` ile doğrudan erişilmez,
  `config/env.ts` üzerinden tip güvenli okunur

### Veritabanı (PostgreSQL + Prisma)
- Schema değişikliği → migration → editör onayı sırası takip edilir
- Ham SQL sorgusu yazılmaz, Prisma Client kullanılır
- Yeni migration dosyası adı açıklayıcı olur:
  `20240101_add_translation_status_to_articles`
- Seed dosyası her zaman güncel tutulur (`prisma/seed.ts`)

### API Yapısı
```
GET    /api/issues              → tüm sayılar
GET    /api/issues/:id          → sayı detayı
GET    /api/articles            → makaleler (filtreli)
GET    /api/articles/:id        → makale detayı
POST   /api/articles            → yeni makale (author)
PATCH  /api/articles/:id        → güncelle (author/editor)
POST   /api/articles/:id/submit → onaya gönder (author)
POST   /api/articles/:id/approve-tr  → TR onayla (editor)
POST   /api/articles/:id/approve-en  → EN onayla (editor)
POST   /api/reactions           → beğeni ekle/kaldır (subscriber)
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/stripe/webhook      → Stripe webhook (public, imzalı)
```

---

## Kullanıcı Rolleri ve Erişim

```
reader      → kayıtlı, ödeme yapmamış
subscriber  → 1 TL/ay, tüm içeriklere erişir
author      → içerik oluşturur, kendi yazılarını yönetir
editor      → her şeyi görür, onaylar, yayınlar
```

### İçerik Erişim Kuralları
- Giriş yapılmadan: başlık + ilk paragraf (teaser)
- reader: her sayının ilk yazısı ücretsiz
- subscriber: tüm içerikler
- Erişim kontrolü backend middleware'de yapılır, frontend'e güvenilmez

---

## AI Çeviri Pipeline

```
Yazar → "Onaya Gönder"
  ↓
status_tr: pending_review
  ↓
Bull Queue → Claude API → İngilizce çeviri
status_en: pending_translation_review
  ↓
Editör: TR onayla → Türkçe yayına çıkar (published_at_tr)
Editör: EN onayla → EN sekmesi eklenir (published_at_en)
```

**Claude API System Prompt (çeviri):**
```
Sen profesyonel bir Türkçe-İngilizce dergi editörüsün.
Verilen Türkçe makaleyi anlam ve tonu koruyarak editöryal İngilizce'ye çevir.
İçeriğe müdahale etme, yalnızca çevir.
Yanıtını yalnızca çevrilmiş metin olarak ver, açıklama ekleme.
```

Detay: `docs/ai-translation.md`

---

## Tasarım Sistemi

### Tipografi
- Başlıklar: serif font (editöryal kimlik)
- Gövde metin: sans-serif (okunabilirlik)
- Bu kontrast derginin temel kimliği — değiştirilmez

### Renk Paleti
- Ana yüzey: beyaz / açık krem
- Vurgu: koyu zemin + altın — yalnızca header, hero, accent noktalarda
- Detay: `docs/design-system.md`

### UI Prensipleri
- Bol beyaz alan, güçlü tipografi, minimal navigasyon
- Yorum sistemi YOK — yalnızca beğeni/beğenmeme
- Dergi konsepti korunur, sosyal platforma dönüştürülmez

---

## Sık Kullanılan Komutlar

```bash
# Geliştirme
npm run dev              # frontend geliştirme sunucusu
npm run dev:server       # backend geliştirme sunucusu
npm run dev:all          # ikisi birden (concurrently)

# Veritabanı
npx prisma migrate dev   # yeni migration oluştur
npx prisma generate      # Prisma Client yenile
npx prisma studio        # görsel DB yönetimi
npx prisma db seed       # seed verisi yükle

# Test
npm run test             # tüm testler
npm run test:watch       # watch mode
npm run test:e2e         # e2e testler

# Build
npm run build            # production build
npm run build:check      # TypeScript tip kontrolü

# Queue (geliştirmede)
redis-server             # Redis başlat
npm run worker:dev       # Bull worker başlat
```

---

## Ortam Değişkenleri (.env)

```env
# Veritabanı
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Anthropic
ANTHROPIC_API_KEY=

# Redis
REDIS_URL=redis://localhost:6379

# App
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
```

---

## Etik ve Güvenlik — KRİTİK

Bu projedeki tüm kararlar **Diligence Statement** çerçevesinde yürütülür:

> Claude tarafından üretilen her içerik ve teknik karar editör onayından geçer.
> Nihai sorumluluk editöre aittir.

### Zorunlu Kurallar
1. Kritik bir karar (mimari değişiklik, şema değişikliği, API tasarımı)
   alınmadan önce **editöre danışılır ve onay alınır**
2. İslami ilimler içerikleri Ehli Sünnet vel Cemaat çizgisinde ele alınır —
   bu alanda Claude tavsiye verebilir ama karar editörün
3. Siyaset içerikleri hassas alan — bu başlıkta özellikle dikkatli olunur
4. Kullanıcı verisi (email, ödeme bilgisi) hiçbir log'a yazılmaz
5. Stripe webhook'u imza doğrulaması yapılmadan işlenmez
6. R2 presigned URL'leri maksimum 15 dakika geçerli olur

---

## Açık Kararlar (Editör Onayı Bekliyor)

- [ ] Deploy: Railway kalıcı mı, EC2'ye ne zaman geçilir?
- [ ] Cloudflare R2 hesabı açılacak
- [ ] Stripe hesabı açılacak (canlıya geçmeden önce)
- [ ] İlk sayı teması "Seher" — editör kesinleştirecek
- [ ] Hukuk başlığı ilk sayıya dahil mi?
- [ ] Domain adı belirlenmedi

---

*Bu dosya proje sahibi (editör) onayıyla güncellenir.*
*Son güncelleme: Claude ile birlikte hazırlandı — editör onaylı*