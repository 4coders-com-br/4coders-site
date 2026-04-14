// Little Trader Documentation Viewer

const DOC_CATEGORIES = [
  {
    id: 'getting-started',
    labelPt: 'Começando',
    labelEn: 'Getting Started',
    docs: [
      { file: 'README.md', titlePt: 'README', titleEn: 'README' },
      { file: 'IMPLEMENTATION.md', titlePt: 'Guia de Implementação', titleEn: 'Implementation Guide' }
    ]
  },
  {
    id: 'architecture',
    labelPt: 'Arquitetura',
    labelEn: 'Architecture',
    docs: [
      { file: 'ARCHITECTURE.md', titlePt: 'Arquitetura Geral', titleEn: 'Architecture' },
      { file: 'AUTH_ARCHITECTURE.md', titlePt: 'Arquitetura de Autenticação', titleEn: 'Auth Architecture' },
      { file: 'FRONTEND.md', titlePt: 'Frontend', titleEn: 'Frontend' },
      { file: 'C4_ARCHITECTURE.md', titlePt: 'Diagrama C4', titleEn: 'C4 Diagram' }
    ]
  },
  {
    id: 'strategy',
    labelPt: 'Estratégia & Pesquisa',
    labelEn: 'Strategy & Research',
    docs: [
      { file: 'QUANTITATIVE_ML.md', titlePt: 'ML Quantitativo', titleEn: 'Quantitative ML' },
      { file: 'RESEARCH_AI_TRADING_PAPERS.md', titlePt: 'Pesquisa em Trading com IA', titleEn: 'AI Trading Research' },
      { file: 'STRATEGY_EXECUTION_ENGINE.md', titlePt: 'Motor de Execução de Estratégia', titleEn: 'Strategy Execution Engine' }
    ]
  },
  {
    id: 'implementation',
    labelPt: 'Implementação',
    labelEn: 'Implementation',
    docs: [
      { file: 'IMPLEMENTATION_STATUS.md', titlePt: 'Status', titleEn: 'Status' },
      { file: 'PROJECT_STATUS.md', titlePt: 'Status do Projeto', titleEn: 'Project Status' },
      { file: 'EXECUTOR_PLATFORM.md', titlePt: 'Plataforma Executor', titleEn: 'Executor Platform' }
    ]
  },
  {
    id: 'devops',
    labelPt: 'DevOps & Infraestrutura',
    labelEn: 'DevOps & Infrastructure',
    docs: [
      { file: 'DEVOPS.md', titlePt: 'DevOps', titleEn: 'DevOps' },
      { file: 'CLOUD_MCP_STAGING.md', titlePt: 'Cloud MCP Staging', titleEn: 'Cloud MCP Staging' },
      { file: 'CLOUD_DEPLOY.md', titlePt: 'Cloud Deploy', titleEn: 'Cloud Deploy' },
      { file: 'SRE_OPERATIONS.md', titlePt: 'Operações SRE', titleEn: 'SRE Operations' }
    ]
  },
  {
    id: 'development',
    labelPt: 'Desenvolvimento',
    labelEn: 'Development',
    docs: [
      { file: 'CLAUDE.md', titlePt: 'Guia Claude AI', titleEn: 'Claude AI Guide' },
      { file: 'MCP_DEVELOPMENT.md', titlePt: 'Desenvolvimento MCP', titleEn: 'MCP Development' },
      { file: 'AI_LLM_INTEGRATION.md', titlePt: 'Integração com IA/LLM', titleEn: 'AI/LLM Integration' },
      { file: 'TESTING.md', titlePt: 'Testes', titleEn: 'Testing' }
    ]
  },
  {
    id: 'learning',
    labelPt: 'Aprendizado',
    labelEn: 'Learning',
    docs: [
      { file: 'COURSE.md', titlePt: 'Visão Geral do Curso', titleEn: 'Course Overview' },
      { file: 'COURSE_CURRICULUM.md', titlePt: 'Currículo', titleEn: 'Curriculum' },
      { file: 'DEVELOPER_ONBOARDING_PLAYBOOK.md', titlePt: 'Guia de Onboarding', titleEn: 'Onboarding Guide' },
      { file: 'OPTIONS_STRATEGIES_101.md', titlePt: 'Estratégias de Opções 101', titleEn: 'Options Strategies 101' }
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
      // Fetch from local docs directory
      const docUrl = `docs/${filename}`;
      const response = await fetch(docUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      renderDocument(title, content);
    } catch (error) {
      contentArea.innerHTML = `
        <div class="trader-docs__placeholder">
          <div class="trader-docs__empty-state">
            <p>❌ Error loading document</p>
            <p style="font-size: 13px; margin-top: 8px; color: var(--color-text-muted);">File: <code>${filename}</code></p>
            <p style="font-size: 13px; color: var(--color-text-muted);">${error.message}</p>
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
      try {
        hljs.highlightElement(block);
      } catch (e) {
        // Silently ignore highlighting errors
      }
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
