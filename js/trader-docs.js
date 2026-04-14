// Little Trader Documentation Viewer

const DOC_CATEGORIES = [
  {
    id: 'getting-started',
    labelPt: 'Começando',
    labelEn: 'Getting Started',
    docs: [
      { file: 'README.md', titlePt: 'README', titleEn: 'README' },
      { file: 'FEATURES.md', titlePt: 'Funcionalidades', titleEn: 'Features' }
    ]
  },
  {
    id: 'architecture',
    labelPt: 'Arquitetura',
    labelEn: 'Architecture',
    docs: [
      { file: 'ARCHITECTURE.md', titlePt: 'Arquitetura Geral', titleEn: 'Architecture' },
      { file: 'AUTH_ARCHITECTURE.md', titlePt: 'Arquitetura de Autenticação', titleEn: 'Auth Architecture' },
      { file: 'FRONTEND.md', titlePt: 'Frontend', titleEn: 'Frontend' }
    ]
  },
  {
    id: 'strategy',
    labelPt: 'Estratégia & Pesquisa',
    labelEn: 'Strategy & Research',
    docs: [
      { file: 'QUANTITATIVE_ML.md', titlePt: 'ML Quantitativo', titleEn: 'Quantitative ML' },
      { file: 'RESEARCH_AI_TRADING_PAPERS.md', titlePt: 'Pesquisa em Trading com IA', titleEn: 'AI Trading Research' }
    ]
  },
  {
    id: 'implementation',
    labelPt: 'Implementação',
    labelEn: 'Implementation',
    docs: [
      { file: 'IMPLEMENTATION.md', titlePt: 'Guia de Implementação', titleEn: 'Implementation Guide' },
      { file: 'IMPLEMENTATION_STATUS.md', titlePt: 'Status', titleEn: 'Status' },
      { file: 'PROJECT_STATUS.md', titlePt: 'Status do Projeto', titleEn: 'Project Status' }
    ]
  },
  {
    id: 'devops',
    labelPt: 'DevOps & Infraestrutura',
    labelEn: 'DevOps & Infrastructure',
    docs: [
      { file: 'DEVOPS.md', titlePt: 'DevOps', titleEn: 'DevOps' },
      { file: 'CLOUD_MCP_STAGING.md', titlePt: 'Cloud MCP Staging', titleEn: 'Cloud MCP Staging' }
    ]
  },
  {
    id: 'development',
    labelPt: 'Desenvolvimento',
    labelEn: 'Development',
    docs: [
      { file: 'MCP_DEVELOPMENT.md', titlePt: 'Desenvolvimento MCP', titleEn: 'MCP Development' },
      { file: 'AI_LLM_INTEGRATION.md', titlePt: 'Integração com IA/LLM', titleEn: 'AI/LLM Integration' },
      { file: 'TESTING.md', titlePt: 'Testes', titleEn: 'Testing' }
    ]
  }
];

// Get current language
function getCurrentLanguage() {
  return document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
}

// Get label in current language
function getLabel(item, type) {
  const lang = getCurrentLanguage();
  const key = lang === 'pt' ? type + 'Pt' : type + 'En';
  return item[key] || item[type + 'En'];
}

// Initialize docs viewer
function initDocsPdfViewer() {
  const categoriesContainer = document.getElementById('docsCategories');
  const contentArea = document.getElementById('docsContent');
  let expandedCategories = {};

  // Initialize all categories as expanded
  DOC_CATEGORIES.forEach(cat => {
    expandedCategories[cat.id] = true;
  });

  function renderCategories() {
    categoriesContainer.innerHTML = '';
    
    DOC_CATEGORIES.forEach(category => {
      const categoryEl = document.createElement('div');
      categoryEl.className = 'trader-category';
      
      const isExpanded = expandedCategories[category.id];
      
      const headerEl = document.createElement('button');
      headerEl.className = 'trader-category__header';
      headerEl.innerHTML = `
        <span class="trader-category__arrow${isExpanded ? ' expanded' : ''}">▶</span>
        <span>${getLabel(category, 'label')}</span>
      `;
      headerEl.onclick = (e) => {
        e.preventDefault();
        expandedCategories[category.id] = !expandedCategories[category.id];
        renderCategories();
      };
      
      categoryEl.appendChild(headerEl);
      
      if (isExpanded) {
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'trader-category__items';
        
        category.docs.forEach(doc => {
          const itemEl = document.createElement('button');
          itemEl.className = 'trader-item';
          itemEl.textContent = getLabel(doc, 'title');
          itemEl.onclick = (e) => {
            e.preventDefault();
            loadDocument(doc.file, getLabel(doc, 'title'));
          };
          itemsContainer.appendChild(itemEl);
        });
        
        categoryEl.appendChild(itemsContainer);
      }
      
      categoriesContainer.appendChild(categoryEl);
    });
  }

  async function loadDocument(filename, title) {
    contentArea.innerHTML = '<div class="trader-docs__loading"></div>';
    
    try {
      // Try to fetch from the little-trader docs directory
      const docUrl = `../little-trader/docs/${filename}`;
      const response = await fetch(docUrl);
      
      if (!response.ok) {
        // If docs/ path fails, try root (for README, FEATURES, etc)
        const rootUrl = `../little-trader/${filename}`;
        const rootResponse = await fetch(rootUrl);
        
        if (!rootResponse.ok) {
          throw new Error('Document not found');
        }
        
        const content = await rootResponse.text();
        renderDocument(title, content);
        return;
      }
      
      const content = await response.text();
      renderDocument(title, content);
    } catch (error) {
      contentArea.innerHTML = `
        <div class="trader-docs__placeholder">
          <div class="trader-docs__empty-state">
            <p>Erro ao carregar documento / Error loading document</p>
            <p style="font-size: 14px; margin-top: 8px; color: var(--color-text-muted);">${error.message}</p>
          </div>
        </div>
      `;
    }
  }

  function renderDocument(title, content) {
    // Parse markdown
    const htmlContent = marked.parse(content);
    
    // Highlight code blocks
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
    
    contentArea.innerHTML = `
      <div class="trader-markdown">
        <h1>${escapeHtml(title)}</h1>
        ${tempDiv.innerHTML}
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Render initial categories
  renderCategories();
  
  // Update labels on language change
  window.addEventListener('languageChanged', () => {
    renderCategories();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDocsPdfViewer);
} else {
  initDocsPdfViewer();
}
