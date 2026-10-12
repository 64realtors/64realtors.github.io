/**
 * 64 REALTORS - CORE JAVASCRIPT
 * Dynamic rendering from data/site.json, interactive property filters,
 * lightbox gallery, WhatsApp inquiry generation & responsive interactions.
 * Fully compliant: Zero inline styles, zero inline scripts, dynamic path resolution.
 */

'use strict';

// Global state
let siteData = null;
let currentProperties = [];
let currentFilterStatus = 'all';
let currentFilterType = 'all';
let currentSearchQuery = '';
let currentModalProperty = null;
let currentModalImageIndex = 0;
let isFiltersInitialized = false;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initHeader();
  initScrollEffects();
  initBackToTop();
  initModalListeners();
  initEnquiryForm();
  initGlobalDelegation();
});

/**
 * Dynamic Asset & Base Path Resolver for GitHub Pages & Custom Domains
 */
function getAssetPath(relativePath) {
  if (!relativePath) return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('//') || relativePath.startsWith('data:')) {
    return relativePath;
  }
  // Ensure clean relative path for GitHub Pages subfolders
  return relativePath.replace(/^\.?\//, '');
}

/**
 * Fetch and Render Site Content with Dynamic Fallback Paths
 */
async function initApp() {
  const candidatePaths = [
    'data/site.json',
    './data/site.json'
  ];

  let loaded = false;
  for (const path of candidatePaths) {
    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (response.ok) {
        siteData = await response.json();
        loaded = true;
        break;
      }
    } catch (e) {
      // Try next candidate
    }
  }

  if (loaded && siteData) {
    renderAll();
  } else {
    console.warn('Could not load data/site.json directly via fetch.');
    const notice = document.getElementById('dataErrorNotice');
    if (notice) notice.classList.add('show');
  }
}

/**
 * Master Render Function
 */
function renderAll() {
  if (!siteData) return;

  renderSEO();
  renderBrandHeader();
  renderHero();
  renderStats();
  renderAbout();
  renderServices();
  renderProperties();
  renderWhyUs();
  renderTestimonials();
  renderFAQ();
  renderContact();
  renderFooter();
  initScrollObserver();
}

/**
 * SEO & Meta Tags
 */
function renderSEO() {
  const { seo, company, address, contacts } = siteData;
  if (seo) {
    if (seo.title) document.title = seo.title;
    
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta && seo.description) descMeta.setAttribute('content', seo.description);

    const kwMeta = document.querySelector('meta[name="keywords"]');
    if (kwMeta && seo.keywords) kwMeta.setAttribute('content', seo.keywords);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && seo.title) ogTitle.setAttribute('content', seo.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && seo.description) ogDesc.setAttribute('content', seo.description);
  }

  // Update JSON-LD Schema
  const schemaScript = document.getElementById('structured-data-script');
  if (schemaScript && company && address) {
    const primaryPhone = contacts && contacts.length > 0 ? contacts[0].phone : '';
    const logoUrl = company.logo ? (company.website || 'https://64realtors.github.io/') + getAssetPath(company.logo) : 'https://64realtors.github.io/images/logo.png';
    
    const areas = (seo && Array.isArray(seo.areaServed)) 
      ? seo.areaServed.map(a => ({ "@type": "AdministrativeArea", "name": a }))
      : [
          { "@type": "AdministrativeArea", "name": "Gandhinagar" },
          { "@type": "AdministrativeArea", "name": "Kudasan" },
          { "@type": "AdministrativeArea", "name": "Raysan" },
          { "@type": "AdministrativeArea", "name": "Urjanagar" },
          { "@type": "AdministrativeArea", "name": "GIFT City Corridor" },
          { "@type": "AdministrativeArea", "name": "Gujarat" }
        ];

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "RealEstateAgent",
          "@id": (company.website || "https://64realtors.github.io/") + "#organization",
          "name": company.name || "64 Realtors",
          "url": company.website || "https://64realtors.github.io/",
          "logo": logoUrl,
          "image": logoUrl,
          "description": (seo && seo.description) ? seo.description : company.tagline,
          "telephone": primaryPhone,
          "email": company.email || "",
          "priceRange": "₹ 25 Lakh - ₹ 15 Crore",
          "currenciesAccepted": "INR",
          "paymentAccepted": "Cash, Cheque, Bank Transfer",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              "opens": "09:00",
              "closes": "21:00"
            }
          ],
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": (seo && seo.geo) ? seo.geo.latitude : 23.1884,
            "longitude": (seo && seo.geo) ? seo.geo.longitude : 72.6300
          },
          "address": {
            "@type": "PostalAddress",
            "streetAddress": address.lines ? address.lines.join(', ') : '',
            "addressLocality": "Gandhinagar",
            "addressRegion": "Gujarat",
            "postalCode": address.pincode || "382426",
            "addressCountry": "IN"
          },
          "areaServed": areas,
          "hasMap": address.mapLink || "https://maps.app.goo.gl/MHGFwp7sZcdNwyUB8",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": (seo && seo.rating) ? seo.rating.ratingValue : "4.9",
            "reviewCount": (seo && seo.rating) ? seo.rating.reviewCount : "48",
            "bestRating": "5"
          }
        },
        ...(siteData.faq && Array.isArray(siteData.faq) ? [{
          "@type": "FAQPage",
          "@id": (company.website || "https://64realtors.github.io/") + "#faq",
          "mainEntity": siteData.faq.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.a
            }
          }))
        }] : [])
      ]
    };
    schemaScript.textContent = JSON.stringify(schema, null, 2);
  }
}

/**
 * Brand & Header
 */
function renderBrandHeader() {
  const { company, contacts } = siteData;
  if (!company) return;

  const brandName = document.getElementById('headerBrandName');
  const brandTagline = document.getElementById('headerBrandTagline');
  const brandLogo = document.getElementById('headerLogoImg');
  const callBtn = document.getElementById('headerCallBtn');
  const drawerCallBtn = document.getElementById('mobileDrawerCallBtn');

  if (brandName && company.name) brandName.textContent = company.name;
  if (brandTagline && company.tagline) brandTagline.textContent = company.tagline;
  if (brandLogo && company.logo) brandLogo.src = getAssetPath(company.logo);

  if (contacts && contacts.length > 0) {
    const primary = contacts[0];
    const cleanPhone = primary.phone.replace(/[^0-9+]/g, '');
    if (callBtn) callBtn.href = `tel:${cleanPhone}`;
    if (drawerCallBtn) drawerCallBtn.href = `tel:${cleanPhone}`;
  }
}

/**
 * Hero Section
 */
function renderHero() {
  const { hero } = siteData;
  if (!hero) return;

  const titleEl = document.getElementById('heroTitle');
  const subEl = document.getElementById('heroSubtitle');
  const bgImg = document.getElementById('heroBgImg');
  const btnGroup = document.getElementById('heroButtons');

  if (titleEl && hero.title) titleEl.textContent = hero.title;
  if (subEl && hero.subtitle) subEl.textContent = hero.subtitle;
  if (bgImg && hero.image) bgImg.src = getAssetPath(hero.image);

  if (btnGroup && Array.isArray(hero.buttons)) {
    btnGroup.innerHTML = hero.buttons.map((btn, index) => {
      const isPrimary = index === 0;
      const isWhatsApp = btn.link && btn.link.includes('wa.me');
      const btnClass = isPrimary ? 'btn btn-primary' : (isWhatsApp ? 'btn btn-whatsapp' : 'btn btn-secondary');
      
      let iconSvg = '';
      if (isWhatsApp) {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>`;
      }

      return `<a href="${escapeHTML(btn.link)}" class="${btnClass}">
        ${iconSvg}
        <span>${escapeHTML(btn.label)}</span>
      </a>`;
    }).join('');
  }
}

/**
 * Stats Strip
 */
function renderStats() {
  const statsSection = document.getElementById('statsSection');
  const container = document.getElementById('statsContainer');
  const { stats } = siteData;

  if (!stats || !Array.isArray(stats) || stats.length === 0) {
    if (statsSection) statsSection.classList.add('hidden');
    return;
  }

  container.innerHTML = stats.map(st => `
    <div class="stat-card reveal-on-scroll">
      <div class="stat-value">${escapeHTML(st.value)}</div>
      <div class="stat-label">${escapeHTML(st.label)}</div>
    </div>
  `).join('');
}

/**
 * About Section
 */
function renderAbout() {
  const { about, company } = siteData;
  if (!about) return;

  const titleEl = document.getElementById('aboutTitle');
  const paraContainer = document.getElementById('aboutParagraphs');
  const aboutImg = document.getElementById('aboutImg');
  const badgeTitle = document.getElementById('aboutBadgeTitle');

  if (titleEl && about.title) titleEl.textContent = about.title;
  if (badgeTitle && company && company.name) badgeTitle.textContent = company.name;
  if (aboutImg && about.image) aboutImg.src = getAssetPath(about.image);

  if (paraContainer && Array.isArray(about.text)) {
    paraContainer.innerHTML = about.text.map(p => `<p>${escapeHTML(p)}</p>`).join('');
  }
}

/**
 * Services Section
 */
function renderServices() {
  const container = document.getElementById('servicesContainer');
  const { services } = siteData;

  if (!container || !services || !Array.isArray(services)) return;

  const iconMap = {
    buy: `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    sell: `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>`,
    invest: `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>`
  };

  container.innerHTML = services.map(s => {
    const icon = iconMap[s.icon] || iconMap.buy;
    return `
      <div class="service-card reveal-on-scroll">
        <div class="service-icon-box">${icon}</div>
        <h3 class="service-title">${escapeHTML(s.title)}</h3>
        <p class="service-desc">${escapeHTML(s.text)}</p>
      </div>
    `;
  }).join('');
}

/**
 * Properties Section & Filtering
 */
function renderProperties() {
  const container = document.getElementById('propertiesContainer');
  const { properties } = siteData;

  if (!container || !properties || !Array.isArray(properties)) return;

  currentProperties = properties;
  applyPropertyFilters();
  
  if (!isFiltersInitialized) {
    initPropertyFilterEvents();
    isFiltersInitialized = true;
  }
}

function initPropertyFilterEvents() {
  const statusButtons = document.querySelectorAll('#propertyStatusFilters .filter-btn');
  const typeSelect = document.getElementById('propertyTypeFilter');
  const searchInput = document.getElementById('propertySearchInput');

  statusButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      statusButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterStatus = btn.getAttribute('data-filter') || 'all';
      applyPropertyFilters();
    });
  });

  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      currentFilterType = e.target.value;
      applyPropertyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      applyPropertyFilters();
    });
  }

  // Footer Property Type Links
  const footerTypeLinks = document.querySelectorAll('#footerPropertyFilterLinks [data-filter-type]');
  footerTypeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetType = link.getAttribute('data-filter-type');
      if (targetType) {
        filterPropertyType(targetType);
      }
    });
  });
}

function filterPropertyType(type) {
  const typeSelect = document.getElementById('propertyTypeFilter');
  if (typeSelect) {
    typeSelect.value = type;
    currentFilterType = type;
    applyPropertyFilters();
  }
  const propSection = document.getElementById('properties');
  if (propSection) {
    propSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function applyPropertyFilters() {
  const container = document.getElementById('propertiesContainer');
  if (!container) return;

  const filtered = currentProperties.filter(prop => {
    // Status filter
    const statusMatch = (currentFilterStatus === 'all') || 
      (prop.status && prop.status.trim().toLowerCase() === currentFilterStatus.trim().toLowerCase());

    // Type filter
    const typeMatch = (currentFilterType === 'all') || 
      (prop.type && prop.type.trim().toLowerCase() === currentFilterType.trim().toLowerCase());

    // Search query
    const searchMatch = !currentSearchQuery || 
      (prop.title && prop.title.toLowerCase().includes(currentSearchQuery)) ||
      (prop.location && prop.location.toLowerCase().includes(currentSearchQuery)) ||
      (prop.type && prop.type.toLowerCase().includes(currentSearchQuery)) ||
      (prop.status && prop.status.toLowerCase().includes(currentSearchQuery)) ||
      (prop.description && prop.description.toLowerCase().includes(currentSearchQuery));

    return statusMatch && typeMatch && searchMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-properties-full">
        <h3 class="font-serif text-copper">No properties found</h3>
        <p class="empty-properties-desc">Try adjusting your filters or search keywords.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="emptyResetFiltersBtn">Reset All Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('emptyResetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetPropertyFilters);
    }
    return;
  }

  container.innerHTML = filtered.map(prop => createPropertyCardHTML(prop)).join('');
}

function resetPropertyFilters() {
  currentFilterStatus = 'all';
  currentFilterType = 'all';
  currentSearchQuery = '';

  const statusButtons = document.querySelectorAll('#propertyStatusFilters .filter-btn');
  statusButtons.forEach((b, idx) => {
    if (idx === 0) b.classList.add('active');
    else b.classList.remove('active');
  });

  const typeSelect = document.getElementById('propertyTypeFilter');
  if (typeSelect) typeSelect.value = 'all';

  const searchInput = document.getElementById('propertySearchInput');
  if (searchInput) searchInput.value = '';

  applyPropertyFilters();
}

function createPropertyCardHTML(prop) {
  const rawImage = (prop.images && prop.images.length > 0) ? prop.images[0] : 'images/about-luxury.jpg';
  const mainImage = getAssetPath(rawImage);
  
  let statusBadgeClass = 'badge-for-sale';
  if (prop.status === 'For Rent') statusBadgeClass = 'badge-for-rent';
  if (prop.status === 'Sold') statusBadgeClass = 'badge-sold';

  // WhatsApp Enquiry Link
  const broker = getBrokerContact(prop.whatsappContact);
  const waPhone = broker.whatsapp || '919726659963';
  const waMsg = encodeURIComponent(`Hello, I am interested in ${prop.title} (${prop.price}). Please share details.`);
  const waUrl = `https://wa.me/${waPhone}?text=${waMsg}`;

  const bedroomHtml = prop.bedrooms > 0 ? `
    <div class="spec-item">
      <svg class="spec-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
      <span>${prop.bedrooms} BHK</span>
    </div>
  ` : '';

  return `
    <div class="property-card revealed">
      <div class="property-media-wrap">
        <img src="${escapeHTML(mainImage)}" alt="${escapeHTML(prop.title)}" class="property-img" loading="lazy">
        <span class="property-badge-status ${statusBadgeClass}">${escapeHTML(prop.status || 'Available')}</span>
        <span class="property-badge-type">${escapeHTML(prop.type || 'Property')}</span>
      </div>
      <div class="property-body">
        <div class="property-price">${escapeHTML(prop.price)}</div>
        <h3 class="property-title">${escapeHTML(prop.title)}</h3>
        <div class="property-location">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          <span>${escapeHTML(prop.location)}</span>
        </div>
        <div class="property-specs">
          <div class="spec-item">
            <svg class="spec-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5v14h18V5H3zm16 12H5V7h14v10z"/></svg>
            <span>${escapeHTML(prop.area)}</span>
          </div>
          ${bedroomHtml}
        </div>
        <div class="property-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-action="view-details" data-prop-id="${prop.id}">
            View Details
          </button>
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Property Details Modal / Gallery (100% Dynamic Rendering, Zero Inline CSS)
 */
function openPropertyModal(propId) {
  const prop = currentProperties.find(p => p.id === propId);
  if (!prop) return;

  currentModalProperty = prop;
  currentModalImageIndex = 0;

  const modal = document.getElementById('propertyModal');
  const modalWindow = document.getElementById('modalWindow');
  if (!modal || !modalWindow) return;

  const rawImages = (prop.images && prop.images.length > 0) ? prop.images : ['images/about-luxury.jpg'];
  const images = rawImages.map(img => getAssetPath(img));
  const hasMultiple = images.length > 1;

  let statusBadgeClass = 'badge-for-sale';
  if (prop.status === 'For Rent') statusBadgeClass = 'badge-for-rent';
  if (prop.status === 'Sold') statusBadgeClass = 'badge-sold';

  // Generate WhatsApp and Call Buttons for ALL contacts/partners
  const contactsList = (siteData && siteData.contacts && siteData.contacts.length > 0)
    ? siteData.contacts
    : [
        { name: "Dipak Prajapati", phone: "+91 97266 59963", whatsapp: "919726659963" },
        { name: "Suryarajsinh Chauhan", phone: "+91 70960 06464", whatsapp: "917096006464" }
      ];

  const waButtonsHtml = contactsList.map(person => {
    const waPhone = person.whatsapp || person.phone.replace(/[^0-9]/g, '');
    const cleanPhone = person.phone.replace(/[^0-9+]/g, '');
    const waMsg = encodeURIComponent(`Hello ${person.name}, I am interested in ${prop.title} (${prop.price}). Please share details.`);
    const waUrl = `https://wa.me/${waPhone}?text=${waMsg}`;

    return `
      <div class="modal-contact-row">
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-whatsapp modal-btn-wa">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
          <span>WhatsApp (${escapeHTML(person.name)})</span>
        </a>
        <a href="tel:${cleanPhone}" class="btn btn-secondary modal-btn-call">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>Call</span>
        </a>
      </div>
    `;
  }).join('');

  // Bedroom spec conditional
  const bedroomHtml = (prop.bedrooms && prop.bedrooms > 0) ? `
    <div class="modal-spec-cell">
      <span class="label">Bedrooms</span>
      <span class="val">${prop.bedrooms} BHK</span>
    </div>
  ` : '';

  // Render Full Modal HTML dynamically
  modalWindow.innerHTML = `
    <button type="button" class="modal-close-btn" id="modalCloseBtn" aria-label="Close details">&times;</button>
    
    <!-- Image Slider -->
    <div class="modal-slider-wrap">
      <img src="${escapeHTML(images[0])}" alt="${escapeHTML(prop.title)}" class="modal-slider-img" id="modalSliderImg">
      <button type="button" class="slider-nav-btn slider-prev ${hasMultiple ? '' : 'hidden'}" id="modalSliderPrev" aria-label="Previous image">&#10094;</button>
      <button type="button" class="slider-nav-btn slider-next ${hasMultiple ? '' : 'hidden'}" id="modalSliderNext" aria-label="Next image">&#10095;</button>
      <div class="slider-counter" id="modalSliderCounter">1 / ${images.length}</div>
    </div>

    <div class="modal-body">
      <div class="modal-header-row">
        <div>
          <div class="modal-price">${escapeHTML(prop.price)}</div>
          <h3 class="modal-title">${escapeHTML(prop.title)}</h3>
        </div>
        <span class="property-badge-status ${statusBadgeClass}">${escapeHTML(prop.status || 'Available')}</span>
      </div>

      <div class="property-location">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
        <span>${escapeHTML(prop.location)}</span>
      </div>

      <!-- Specs Grid -->
      <div class="modal-specs-grid">
        <div class="modal-spec-cell">
          <span class="label">Property Type</span>
          <span class="val">${escapeHTML(prop.type || 'Property')}</span>
        </div>
        <div class="modal-spec-cell">
          <span class="label">Built-up Area</span>
          <span class="val">${escapeHTML(prop.area || 'N/A')}</span>
        </div>
        ${bedroomHtml}
        <div class="modal-spec-cell">
          <span class="label">Status</span>
          <span class="val">${escapeHTML(prop.status || 'Available')}</span>
        </div>
      </div>

      <!-- Description -->
      <div class="modal-description">
        ${escapeHTML(prop.description || '')}
      </div>

      <!-- Modal Action Buttons (Both Partners) -->
      <div class="modal-contact-section">
        <div class="modal-contact-heading">
          Contact Our Realtors
        </div>
        <div class="modal-contacts-list">
          ${waButtonsHtml}
        </div>
        <div class="modal-share-wrap">
          <button type="button" class="btn btn-secondary btn-sm w-100" id="modalShareBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
            <span>Share Listing Link</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach dynamic buttons
  const closeBtn = document.getElementById('modalCloseBtn');
  const prevBtn = document.getElementById('modalSliderPrev');
  const nextBtn = document.getElementById('modalSliderNext');
  const shareBtn = document.getElementById('modalShareBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const count = images.length;
      currentModalImageIndex = (currentModalImageIndex - 1 + count) % count;
      updateModalImage();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const count = images.length;
      currentModalImageIndex = (currentModalImageIndex + 1) % count;
      updateModalImage();
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: `${prop.title} - 64 Realtors`,
        text: `Check out ${prop.title} (${prop.price}) in Gandhinagar with 64 Realtors`,
        url: window.location.href.split('#')[0] + '#properties'
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          // Dismissed
        }
      } else {
        navigator.clipboard.writeText(shareData.url);
        alert('Property link copied to clipboard!');
      }
    });
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function updateModalImage() {
  if (!currentModalProperty) return;
  const rawImages = currentModalProperty.images && currentModalProperty.images.length > 0
    ? currentModalProperty.images
    : ['images/about-luxury.jpg'];
  const images = rawImages.map(img => getAssetPath(img));

  const imgEl = document.getElementById('modalSliderImg');
  const counterEl = document.getElementById('modalSliderCounter');

  if (imgEl) imgEl.src = images[currentModalImageIndex];
  if (counterEl) counterEl.textContent = `${currentModalImageIndex + 1} / ${images.length}`;
}

function initModalListeners() {
  const modal = document.getElementById('propertyModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') {
      const prevBtn = document.getElementById('modalSliderPrev');
      if (prevBtn) prevBtn.click();
    }
    if (e.key === 'ArrowRight') {
      const nextBtn = document.getElementById('modalSliderNext');
      if (nextBtn) nextBtn.click();
    }
  });
}

function closeModal() {
  const modal = document.getElementById('propertyModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
}

/**
 * Event Delegation for Property Card Buttons
 */
function initGlobalDelegation() {
  document.addEventListener('click', (e) => {
    const detailsBtn = e.target.closest('[data-action="view-details"]');
    if (detailsBtn) {
      e.preventDefault();
      const propId = parseInt(detailsBtn.getAttribute('data-prop-id'), 10);
      if (!isNaN(propId)) {
        openPropertyModal(propId);
      }
    }
  });
}

/**
 * Why Choose Us Section
 */
function renderWhyUs() {
  const container = document.getElementById('whyContainer');
  const { whyChooseUs } = siteData;

  if (!container || !whyChooseUs || !Array.isArray(whyChooseUs)) return;

  container.innerHTML = whyChooseUs.map((item, index) => `
    <div class="why-card reveal-on-scroll">
      <div class="why-number">0${index + 1}</div>
      <h3 class="why-title">${escapeHTML(item.title)}</h3>
      <p class="why-desc">${escapeHTML(item.text)}</p>
    </div>
  `).join('');
}

/**
 * Testimonials Section
 */
function renderTestimonials() {
  const container = document.getElementById('testimonialsContainer');
  const { testimonials } = siteData;

  if (!container || !testimonials || !Array.isArray(testimonials)) return;

  container.innerHTML = testimonials.map(t => {
    const starCount = t.rating || 5;
    const stars = '★'.repeat(starCount) + '☆'.repeat(Math.max(0, 5 - starCount));
    const initials = t.name ? t.name.replace(/[^a-zA-Z ]/g, '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') : '64';

    return `
      <div class="testimonial-card reveal-on-scroll">
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-quote">"${escapeHTML(t.text)}"</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar-fallback">${initials}</div>
          <div>
            <div class="testimonial-name">${escapeHTML(t.name)}</div>
            <div class="testimonial-tag">Verified Review</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * FAQ Accordion Section
 */
function renderFAQ() {
  const container = document.getElementById('faqContainer');
  const { faq } = siteData;

  if (!container || !faq || !Array.isArray(faq)) return;

  container.innerHTML = faq.map((item, idx) => `
    <div class="faq-item reveal-on-scroll ${idx === 0 ? 'active' : ''}">
      <button class="faq-question-btn" type="button" aria-expanded="${idx === 0}">
        <span>${escapeHTML(item.q)}</span>
        <svg class="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
      </button>
      <div class="faq-answer">
        <p>${escapeHTML(item.a)}</p>
      </div>
    </div>
  `).join('');

  // Accordion Toggle
  const faqItems = container.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question-btn').setAttribute('aria-expanded', 'false');
      });
      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/**
 * Contact Section
 */
function renderContact() {
  const { contacts, address, company } = siteData;

  // Realtors / Partners Cards
  const realtorsWrap = document.getElementById('realtorCardsContainer');
  const formBrokerSelect = document.getElementById('formBroker');
  const waPartnersList = document.getElementById('waPartnersList');

  if (Array.isArray(contacts)) {
    if (realtorsWrap) {
      realtorsWrap.innerHTML = contacts.map(person => {
        const initials = person.name.split(' ').map(n => n[0]).join('');
        const cleanPhone = person.phone.replace(/[^0-9+]/g, '');
        const waNumber = person.whatsapp || cleanPhone.replace(/\+/g, '');
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent('Hello ' + person.name + ', I would like to enquire about real estate properties in Gandhinagar.')}`;

        return `
          <div class="realtor-card">
            <div class="realtor-header">
              <div class="realtor-avatar">${initials}</div>
              <div>
                <h3 class="realtor-name">${escapeHTML(person.name)}</h3>
                <div class="realtor-role">${escapeHTML(person.role || 'Partner / Realtor')}</div>
              </div>
            </div>
            <div class="realtor-actions">
              <a href="tel:${cleanPhone}" class="btn btn-secondary btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>Call (${escapeHTML(person.phone)})</span>
              </a>
              <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        `;
      }).join('');
    }

    // Populate enquiry form broker select
    if (formBrokerSelect) {
      formBrokerSelect.innerHTML = contacts.map((person, idx) => `
        <option value="${idx}">${escapeHTML(person.name)} (${escapeHTML(person.phone)})</option>
      `).join('');
    }

    // Populate Floating WhatsApp Popup with BOTH Partners
    if (waPartnersList) {
      waPartnersList.innerHTML = contacts.map(person => {
        const waNumber = person.whatsapp || person.phone.replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent('Hello ' + person.name + ', I would like to inquire about real estate properties in Gandhinagar.')}`;

        return `
          <div class="wa-partner-row">
            <div class="wa-partner-info">
              <span class="wa-partner-name">${escapeHTML(person.name)}</span>
              <span class="wa-partner-phone">${escapeHTML(person.phone)}</span>
            </div>
            <a href="${waUrl}" target="_blank" rel="noopener" class="wa-partner-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              <span>Chat</span>
            </a>
          </div>
        `;
      }).join('');
    }
  }

  // Address text & directions link
  const addrEl = document.getElementById('addressText');
  const dirBtn = document.getElementById('mapDirectionsBtn');
  const emailEl = document.getElementById('emailLink');
  const mapIframe = document.getElementById('mapIframe');

  if (address) {
    if (addrEl && Array.isArray(address.lines)) {
      addrEl.innerHTML = address.lines.map(l => escapeHTML(l)).join('<br>') + (address.pincode ? ` - ${escapeHTML(address.pincode)}` : '');
    }
    if (dirBtn && address.mapLink) {
      dirBtn.href = address.mapLink;
    }
    if (mapIframe && address.mapEmbed) {
      mapIframe.src = address.mapEmbed;
    }
  }

  if (emailEl && company && company.email) {
    emailEl.textContent = company.email;
    emailEl.href = `mailto:${company.email}`;
  }

  // Floating WhatsApp Button Toggle
  initFloatingWhatsApp();
}

/**
 * Floating WhatsApp Popup Toggle
 */
function initFloatingWhatsApp() {
  const waBtn = document.getElementById('floatingWhatsappBtn');
  const waPopup = document.getElementById('waPartnersPopup');
  const waClose = document.getElementById('waPopupClose');

  if (waBtn && waPopup) {
    waBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = waPopup.classList.toggle('active');
      waBtn.setAttribute('aria-expanded', isOpen);
    });

    if (waClose) {
      waClose.addEventListener('click', (e) => {
        e.stopPropagation();
        waPopup.classList.remove('active');
        waBtn.setAttribute('aria-expanded', 'false');
      });
    }

    document.addEventListener('click', (e) => {
      if (!waPopup.contains(e.target) && e.target !== waBtn) {
        waPopup.classList.remove('active');
        waBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/**
 * Enquiry Form Handler (WhatsApp Direct with Chosen Partner)
 */
function initEnquiryForm() {
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('formName').value.trim();
    const phone = document.getElementById('formPhone').value.trim();
    const interest = document.getElementById('formType').value;
    const brokerIdx = parseInt(document.getElementById('formBroker').value, 10) || 0;
    const message = document.getElementById('formMessage').value.trim();

    if (!name || !phone) {
      alert('Please enter your name and phone number.');
      return;
    }

    // Get selected partner WhatsApp number
    let waPhone = '919726659963';
    let brokerName = '64 Realtors';
    if (siteData && siteData.contacts && siteData.contacts[brokerIdx]) {
      waPhone = siteData.contacts[brokerIdx].whatsapp || '919726659963';
      brokerName = siteData.contacts[brokerIdx].name || '64 Realtors';
    }

    const compiledMessage = `Hello ${brokerName},
*New Website Enquiry*
- *Name:* ${name}
- *Phone:* ${phone}
- *Interest:* ${interest}
${message ? `- *Message:* ${message}` : ''}`;

    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(compiledMessage)}`;
    window.open(waUrl, '_blank');
  });
}

/**
 * Footer
 */
function renderFooter() {
  const { company, address, contacts, social } = siteData;

  const brandName = document.getElementById('footerBrandName');
  const brandTagline = document.getElementById('footerBrandTagline');
  const brandLogo = document.getElementById('footerLogoImg');
  const addrLines = document.getElementById('footerAddressLines');
  const phone1 = document.getElementById('footerPhone1');
  const phone2 = document.getElementById('footerPhone2');
  const emailEl = document.getElementById('footerEmail');
  const copyEl = document.getElementById('footerCopyright');
  const socialsContainer = document.getElementById('footerSocials');

  if (brandName && company.name) brandName.textContent = company.name;
  if (brandTagline && company.tagline) brandTagline.textContent = company.tagline;
  if (brandLogo && company.logo) brandLogo.src = getAssetPath(company.logo);

  if (addrLines && address && Array.isArray(address.lines)) {
    addrLines.innerHTML = address.lines.map(l => escapeHTML(l)).join('<br>') + (address.pincode ? ` - ${escapeHTML(address.pincode)}` : '');
  }

  if (contacts && contacts.length > 0) {
    if (phone1) {
      phone1.textContent = `${contacts[0].name}: ${contacts[0].phone}`;
      phone1.href = `tel:${contacts[0].phone.replace(/[^0-9+]/g, '')}`;
    }
    if (phone2 && contacts.length > 1) {
      phone2.textContent = `${contacts[1].name}: ${contacts[1].phone}`;
      phone2.href = `tel:${contacts[1].phone.replace(/[^0-9+]/g, '')}`;
      phone2.classList.remove('hidden');
    } else if (phone2) {
      phone2.classList.add('hidden');
    }
  }

  if (emailEl && company.email) {
    emailEl.textContent = company.email;
    emailEl.href = `mailto:${company.email}`;
  }

  if (copyEl) {
    const dynamicYear = (company && company.year) ? company.year : new Date().getFullYear();
    const companyName = (company && company.name) ? company.name : '64 Realtors';
    copyEl.innerHTML = `&copy; ${dynamicYear} ${escapeHTML(companyName)}. All rights reserved.`;
  }

  // Render Social Links
  if (socialsContainer && social) {
    const icons = {
      instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
      facebook: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>`,
      youtube: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
      linkedin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`
    };

    const validSocials = Object.keys(social).filter(key => social[key] && social[key].trim() !== '');
    socialsContainer.innerHTML = validSocials.map(key => `
      <a href="${escapeHTML(social[key])}" target="_blank" rel="noopener" class="social-icon-link" aria-label="${key}">
        ${icons[key] || ''}
      </a>
    `).join('');
  }
}

/**
 * Header & Mobile Navigation Interactions
 */
function initHeader() {
  const header = document.getElementById('siteHeader');
  const menuBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  // Sticky header background
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile drawer toggle
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      menuBtn.classList.toggle('active', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }
}

/**
 * Scroll Animations & Active Nav Highlight
 */
function initScrollEffects() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-desktop .nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

function initScrollObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
}

/**
 * Back To Top Button
 */
function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Utility Helpers
 */
function getBrokerContact(index) {
  if (siteData && siteData.contacts && siteData.contacts.length > 0) {
    const idx = (typeof index === 'number' && siteData.contacts[index]) ? index : 0;
    return siteData.contacts[idx];
  }
  return { name: 'Realtor', phone: '+91 97266 59963', whatsapp: '919726659963' };
}

function escapeHTML(str) {
  if (typeof str !== 'string') return str || '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
