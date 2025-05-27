// Variáveis globais
let certificates = [];
let currentFilter = 'all';
let currentSort = 'date-desc';
let currentView = 'grid';
let editingCertificateId = null;

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados do localStorage
    loadCertificates();
    
    // Inicializar componentes
    initThemeToggle();
    initSidebar();
    initViewToggle();
    initCertificateForm();
    initModals();
    
    // Renderizar certificados
    renderCertificates();
});

// Funções de inicialização
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

function initSidebar() {
    // Inicializar busca
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchCertificates(searchInput.value);
        }
    });
    
    searchBtn.addEventListener('click', () => {
        searchCertificates(searchInput.value);
    });
    
    // Inicializar filtros
    const areaFilters = document.querySelectorAll('#area-filters li');
    
    areaFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            areaFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            currentFilter = filter.dataset.filter;
            renderCertificates();
        });
    });
    
    // Inicializar ordenação
    const sortSelect = document.getElementById('sort-select');
    
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderCertificates();
    });
    
    // Inicializar botões de ação
    const addCertificateBtn = document.getElementById('add-certificate-btn');
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    
    addCertificateBtn.addEventListener('click', () => {
        openCertificateModal();
    });
    
    importBtn.addEventListener('click', () => {
        openImportExportModal('import');
    });
    
    exportBtn.addEventListener('click', () => {
        openImportExportModal('export');
    });
    
    // Adicionar botão de menu para mobile (responsividade)
    const header = document.querySelector('header');
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    menuToggle.style.display = 'none';
    
    header.insertBefore(menuToggle, header.firstChild);
    
    menuToggle.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    });
    
    // Ajustar visibilidade do botão de menu com base no tamanho da tela
    function adjustMenuVisibility() {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'block';
        } else {
            menuToggle.style.display = 'none';
            document.querySelector('.sidebar').classList.remove('active');
        }
    }
    
    window.addEventListener('resize', adjustMenuVisibility);
    adjustMenuVisibility();
}

function initViewToggle() {
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    
    gridViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        document.getElementById('certificates-container').className = 'grid-view';
        currentView = 'grid';
        localStorage.setItem('view', currentView);
    });
    
    listViewBtn.addEventListener('click', () => {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        document.getElementById('certificates-container').className = 'list-view';
        currentView = 'list';
        localStorage.setItem('view', currentView);
    });
    
    // Carregar preferência de visualização
    const savedView = localStorage.getItem('view');
    if (savedView === 'list') {
        listViewBtn.click();
    }
}

function initCertificateForm() {
    const certificateForm = document.getElementById('certificate-form');
    const areaCategory = document.getElementById('area-category');
    const tiSubcategoryGroup = document.getElementById('ti-subcategory-group');
    const otherAreaGroup = document.getElementById('other-area-group');
    const imageInput = document.getElementById('certificate-image');
    const imagePreview = document.getElementById('image-preview');
    
    // Mostrar/ocultar subcategorias com base na área selecionada
    areaCategory.addEventListener('change', () => {
        if (areaCategory.value === 'ti') {
            tiSubcategoryGroup.style.display = 'block';
            otherAreaGroup.style.display = 'none';
        } else if (areaCategory.value === 'outros') {
            tiSubcategoryGroup.style.display = 'none';
            otherAreaGroup.style.display = 'block';
        } else {
            tiSubcategoryGroup.style.display = 'none';
            otherAreaGroup.style.display = 'none';
        }
    });
    
    // Inicializar upload e preview de imagem
    imageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Permitir arrastar e soltar imagens
    imagePreview.addEventListener('dragover', (e) => {
        e.preventDefault();
        imagePreview.style.borderColor = 'var(--primary-color)';
        imagePreview.style.backgroundColor = 'var(--bg-dark)';
    });
    
    imagePreview.addEventListener('dragleave', () => {
        imagePreview.style.borderColor = 'var(--border-color)';
        imagePreview.style.backgroundColor = '';
    });
    
    imagePreview.addEventListener('drop', (e) => {
        e.preventDefault();
        imagePreview.style.borderColor = 'var(--border-color)';
        imagePreview.style.backgroundColor = '';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.match('image.*')) {
            imageInput.files = e.dataTransfer.files;
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Clicar no preview para selecionar arquivo
    imagePreview.addEventListener('click', () => {
        imageInput.click();
    });
    
    // Submeter formulário
    certificateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCertificate();
    });
    
    // Botão cancelar
    document.getElementById('cancel-btn').addEventListener('click', () => {
        closeCertificateModal();
    });
}

function initModals() {
    // Fechar modais ao clicar no X
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Fechar modais ao clicar fora
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    // Inicializar modal de visualização
    document.getElementById('edit-certificate-btn').addEventListener('click', () => {
        const certificateId = document.getElementById('view-certificate-modal').dataset.certificateId;
        closeModal(document.getElementById('view-certificate-modal'));
        openCertificateModal(parseInt(certificateId));
    });
    
    document.getElementById('delete-certificate-btn').addEventListener('click', () => {
        const certificateId = document.getElementById('view-certificate-modal').dataset.certificateId;
        closeModal(document.getElementById('view-certificate-modal'));
        openDeleteConfirmModal(parseInt(certificateId));
    });
    
    // Inicializar modal de confirmação de exclusão
    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        closeModal(document.getElementById('confirm-delete-modal'));
    });
    
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        const certificateId = document.getElementById('confirm-delete-modal').dataset.certificateId;
        deleteCertificate(parseInt(certificateId));
        closeModal(document.getElementById('confirm-delete-modal'));
    });
    
    // Inicializar modal de importação/exportação
    document.getElementById('import-json-file').addEventListener('change', function() {
        const fileName = this.files[0]?.name || '';
        document.getElementById('import-file-name').textContent = fileName;
        document.getElementById('process-import-btn').disabled = !fileName;
    });
    
    document.getElementById('download-json-btn').addEventListener('click', () => {
        exportCertificates();
    });
    
    document.getElementById('process-import-btn').addEventListener('click', () => {
        importCertificates();
    });
}

// Funções de renderização
function renderCertificates() {
    const container = document.getElementById('certificates-container');
    let filteredCertificates = filterCertificates();
    
    // Ordenar certificados
    sortCertificates(filteredCertificates);
    
    // Limpar container
    container.innerHTML = '';
    
    // Mostrar estado vazio se não houver certificados
    if (filteredCertificates.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-certificate"></i>
            <h2>Nenhum certificado encontrado</h2>
            <p>Adicione seu primeiro certificado clicando no botão "Novo Certificado"</p>
        `;
        container.appendChild(emptyState);
        return;
    }
    
    // Renderizar cada certificado
    filteredCertificates.forEach(certificate => {
        const card = createCertificateCard(certificate);
        container.appendChild(card);
    });
}

function createCertificateCard(certificate) {
    const card = document.createElement('div');
    card.className = 'certificate-card';
    card.dataset.id = certificate.id;
    
    // Formatar área
    let areaDisplay = getAreaDisplay(certificate);
    
    // Criar HTML do cartão
    card.innerHTML = `
        <div class="card-image">
            ${certificate.image ? 
                `<img src="${certificate.image}" alt="${certificate.courseName}">` : 
                `<div class="no-image">
                    <i class="fas fa-certificate"></i>
                    <span>Sem imagem</span>
                </div>`
            }
        </div>
        <div class="card-content">
            <h3 class="card-title">${certificate.courseName}</h3>
            <div class="card-issuer">${certificate.issuer}</div>
            <div class="card-date">${formatDate(certificate.issueDate)}</div>
            <div class="card-area">${areaDisplay}</div>
        </div>
    `;
    
    // Adicionar evento de clique para abrir modal de visualização
    card.addEventListener('click', () => {
        openViewCertificateModal(certificate.id);
    });
    
    return card;
}

function getAreaDisplay(certificate) {
    let areaDisplay = '';
    
    switch (certificate.areaCategory) {
        case 'ti':
            if (certificate.tiSubcategory) {
                const subcategories = {
                    'dev-software': 'Desenvolvimento de Software',
                    'analise-sistemas': 'Análise e Engenharia de Sistemas',
                    'banco-dados': 'Banco de Dados',
                    'infra-ti': 'Infraestrutura de TI',
                    'seguranca': 'Segurança da Informação',
                    'gestao-projetos': 'Gestão de Projetos de TI',
                    'cloud': 'Cloud Computing',
                    'ia-ml': 'IA e Machine Learning',
                    'data-science': 'Ciência de Dados',
                    'suporte': 'Suporte Técnico',
                    'iot': 'IoT',
                    'vr-ar': 'VR/AR',
                    'eng-software': 'Engenharia de Software',
                    'arq-software': 'Arquitetura de Software',
                    'automacao': 'Automação e Robótica',
                    'devops': 'DevOps',
                    'ux-ui': 'UX/UI'
                };
                areaDisplay = subcategories[certificate.tiSubcategory] || 'TI';
            } else {
                areaDisplay = 'Tecnologia da Informação';
            }
            break;
        case 'admin':
            areaDisplay = 'Administração e Negócios';
            break;
        case 'educacao':
            areaDisplay = 'Educação';
            break;
        case 'saude':
            areaDisplay = 'Saúde';
            break;
        case 'motorista':
            areaDisplay = 'Motorista';
            break;
        case 'vendas':
            areaDisplay = 'Vendas';
            break;
        case 'outros':
            areaDisplay = certificate.otherArea || 'Outros';
            break;
        default:
            areaDisplay = 'Não categorizado';
    }
    
    return areaDisplay;
}

// Funções de filtragem e ordenação
function filterCertificates() {
    if (currentFilter === 'all') {
        return [...certificates];
    }
    
    return certificates.filter(cert => cert.areaCategory === currentFilter);
}

function sortCertificates(certificatesList) {
    switch (currentSort) {
        case 'date-desc':
            certificatesList.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
            break;
        case 'date-asc':
            certificatesList.sort((a, b) => new Date(a.issueDate) - new Date(b.issueDate));
            break;
        case 'name-asc':
            certificatesList.sort((a, b) => a.courseName.localeCompare(b.courseName));
            break;
        case 'name-desc':
            certificatesList.sort((a, b) => b.courseName.localeCompare(a.courseName));
            break;
        case 'org-asc':
            certificatesList.sort((a, b) => a.issuer.localeCompare(b.issuer));
            break;
        case 'org-desc':
            certificatesList.sort((a, b) => b.issuer.localeCompare(a.issuer));
            break;
    }
}

function searchCertificates(query) {
    if (!query.trim()) {
        // Se a busca estiver vazia, resetar para todos
        document.querySelector('#area-filters li[data-filter="all"]').click();
        return;
    }
    
    const searchQuery = query.toLowerCase().trim();
    
    // Filtrar certificados que correspondem à busca
    const searchResults = certificates.filter(cert => 
        cert.courseName.toLowerCase().includes(searchQuery) ||
        cert.issuer.toLowerCase().includes(searchQuery) ||
        (cert.credentialCode && cert.credentialCode.toLowerCase().includes(searchQuery)) ||
        getAreaDisplay(cert).toLowerCase().includes(searchQuery)
    );
    
    // Renderizar resultados da busca
    const container = document.getElementById('certificates-container');
    container.innerHTML = '';
    
    if (searchResults.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-search"></i>
            <h2>Nenhum resultado encontrado</h2>
            <p>Tente uma busca diferente ou limpe o campo de busca</p>
        `;
        container.appendChild(emptyState);
    } else {
        // Ordenar e renderizar resultados
        sortCertificates(searchResults);
        searchResults.forEach(certificate => {
            const card = createCertificateCard(certificate);
            container.appendChild(card);
        });
    }
}

// Funções de manipulação de certificados
function saveCertificate() {
    const certificateId = document.getElementById('certificate-id').value;
    const courseName = document.getElementById('course-name').value;
    const issuer = document.getElementById('issuer').value;
    const issueDate = document.getElementById('issue-date').value;
    const credentialCode = document.getElementById('credential-code').value;
    const credentialUrl = document.getElementById('credential-url').value;
    const areaCategory = document.getElementById('area-category').value;
    const tiSubcategory = document.getElementById('ti-subcategory').value;
    const otherArea = document.getElementById('other-area').value;
    const notes = document.getElementById('notes').value;
    
    // Validar campos obrigatórios
    if (!courseName || !issuer || !issueDate || !areaCategory) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Obter imagem
    let imageData = null;
    const imagePreview = document.getElementById('image-preview');
    const img = imagePreview.querySelector('img');
    if (img) {
        imageData = img.src;
    }
    
    // Criar ou atualizar certificado
    if (certificateId) {
        // Atualizar certificado existente
        const index = certificates.findIndex(cert => cert.id === parseInt(certificateId));
        if (index !== -1) {
            certificates[index] = {
                ...certificates[index],
                courseName,
                issuer,
                issueDate,
                credentialCode,
                credentialUrl,
                areaCategory,
                tiSubcategory: areaCategory === 'ti' ? tiSubcategory : null,
                otherArea: areaCategory === 'outros' ? otherArea : null,
                notes,
                image: imageData
            };
        }
    } else {
        // Criar novo certificado
        const newCertificate = {
            id: Date.now(),
            courseName,
            issuer,
            issueDate,
            credentialCode,
            credentialUrl,
            areaCategory,
            tiSubcategory: areaCategory === 'ti' ? tiSubcategory : null,
            otherArea: areaCategory === 'outros' ? otherArea : null,
            notes,
            image: imageData,
            createdAt: new Date().toISOString()
        };
        
        certificates.push(newCertificate);
    }
    
    // Salvar e atualizar visualização
    saveCertificates();
    renderCertificates();
    closeCertificateModal();
}

function deleteCertificate(id) {
    const index = certificates.findIndex(cert => cert.id === id);
    if (index !== -1) {
        certificates.splice(index, 1);
        saveCertificates();
        renderCertificates();
    }
}

// Funções de modal
function openCertificateModal(certificateId = null) {
    const modal = document.getElementById('certificate-modal');
    const form = document.getElementById('certificate-form');
    const modalTitle = document.getElementById('modal-title');
    const certificateIdInput = document.getElementById('certificate-id');
    const imagePreview = document.getElementById('image-preview');
    
    // Resetar formulário
    form.reset();
    imagePreview.innerHTML = `
        <i class="fas fa-upload"></i>
        <span>Clique para selecionar ou arraste uma imagem</span>
    `;
    
    // Esconder grupos de subcategorias
    document.getElementById('ti-subcategory-group').style.display = 'none';
    document.getElementById('other-area-group').style.display = 'none';
    
    if (certificateId) {
        // Editar certificado existente
        const certificate = certificates.find(cert => cert.id === certificateId);
        if (certificate) {
            modalTitle.textContent = 'Editar Certificado';
            certificateIdInput.value = certificate.id;
            
            // Preencher campos
            document.getElementById('course-name').value = certificate.courseName;
            document.getElementById('issuer').value = certificate.issuer;
            document.getElementById('issue-date').value = certificate.issueDate;
            document.getElementById('credential-code').value = certificate.credentialCode || '';
            document.getElementById('credential-url').value = certificate.credentialUrl || '';
            document.getElementById('area-category').value = certificate.areaCategory;
            document.getElementById('notes').value = certificate.notes || '';
            
            // Mostrar subcategorias se necessário
            if (certificate.areaCategory === 'ti') {
                document.getElementById('ti-subcategory-group').style.display = 'block';
                document.getElementById('ti-subcategory').value = certificate.tiSubcategory || '';
            } else if (certificate.areaCategory === 'outros') {
                document.getElementById('other-area-group').style.display = 'block';
                document.getElementById('other-area').value = certificate.otherArea || '';
            }
            
            // Mostrar imagem se existir
            if (certificate.image) {
                imagePreview.innerHTML = `<img src="${certificate.image}" alt="Preview">`;
            }
        }
    } else {
        // Novo certificado
        modalTitle.textContent = 'Adicionar Novo Certificado';
        certificateIdInput.value = '';
        
        // Definir data atual como padrão
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('issue-date').value = today;
    }
    
    openModal(modal);
}

function openViewCertificateModal(certificateId) {
    const modal = document.getElementById('view-certificate-modal');
    const certificate = certificates.find(cert => cert.id === certificateId);
    
    if (!certificate) return;
    
    // Preencher dados do certificado
    document.getElementById('view-modal-title').textContent = certificate.courseName;
    document.getElementById('view-course-name').textContent = certificate.courseName;
    document.getElementById('view-issuer').textContent = certificate.issuer;
    document.getElementById('view-issue-date').textContent = formatDate(certificate.issueDate);
    
    // Código da credencial (opcional)
    const codeGroup = document.getElementById('view-code-group');
    if (certificate.credentialCode) {
        codeGroup.style.display = 'flex';
        document.getElementById('view-credential-code').textContent = certificate.credentialCode;
    } else {
        codeGroup.style.display = 'none';
    }
    
    // URL da credencial (opcional)
    const urlGroup = document.getElementById('view-url-group');
    if (certificate.credentialUrl) {
        urlGroup.style.display = 'flex';
        const urlElement = document.getElementById('view-credential-url');
        urlElement.href = certificate.credentialUrl;
        urlElement.textContent = certificate.credentialUrl;
    } else {
        urlGroup.style.display = 'none';
    }
    
    // Área relacionada
    document.getElementById('view-area').textContent = getAreaDisplay(certificate);
    
    // Observações (opcional)
    const notesGroup = document.getElementById('view-notes-group');
    if (certificate.notes) {
        notesGroup.style.display = 'flex';
        document.getElementById('view-notes').textContent = certificate.notes;
    } else {
        notesGroup.style.display = 'none';
    }
    
    // Imagem do certificado
    const imageContainer = document.getElementById('view-certificate-image');
    if (certificate.image) {
        imageContainer.src = certificate.image;
        imageContainer.style.display = 'block';
    } else {
        imageContainer.style.display = 'none';
    }
    
    // Armazenar ID para ações de edição/exclusão
    modal.dataset.certificateId = certificate.id;
    
    openModal(modal);
}

function openDeleteConfirmModal(certificateId) {
    const modal = document.getElementById('confirm-delete-modal');
    modal.dataset.certificateId = certificateId;
    openModal(modal);
}

function openImportExportModal(mode) {
    const modal = document.getElementById('import-export-modal');
    const title = document.getElementById('import-export-title');
    
    if (mode === 'import') {
        title.textContent = 'Importar Dados';
        document.getElementById('export-section').style.display = 'none';
        document.getElementById('import-section').style.display = 'block';
    } else {
        title.textContent = 'Exportar Dados';
        document.getElementById('export-section').style.display = 'block';
        document.getElementById('import-section').style.display = 'none';
    }
    
    openModal(modal);
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeCertificateModal() {
    closeModal(document.getElementById('certificate-modal'));
}

// Funções de importação/exportação
function exportCertificates() {
    const simplifiedData = certificates.map(cert => {
        return {
            "Nome do Curso": cert.courseName,
            "Organização Emissora": cert.issuer,
            "Data de Emissão": cert.issueDate,
            "Código da Credencial": cert.credentialCode || '',
            "URL da Credencial": cert.credentialUrl || '',
            "Área Relacionada": getExportArea(cert),
            "Subcategoria de TI": getTISubcategoryName(cert)
        };
    });

    const dataStr = JSON.stringify(simplifiedData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileName = `certificados_${formatDateForFile(new Date())}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.style.display = 'none';

    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
}

function getExportArea(cert) {
    const categorias = {
        'ti': 'Tecnologia da Informação',
        'admin': 'Administração e Negócios',
        'educacao': 'Educação',
        'saude': 'Saúde',
        'motorista': 'Motorista',
        'vendas': 'Vendas',
        'outros': cert.otherArea || 'Outros'
    };

    return categorias[cert.areaCategory] || 'Área Desconhecida';
}

function getTISubcategoryName(cert) {
    if (cert.areaCategory !== 'ti') return ''; // Só aplica se for da área de TI

    const subcategories = {
        'dev-software': 'Desenvolvimento de Software',
        'analise-sistemas': 'Análise e Engenharia de Sistemas',
        'banco-dados': 'Banco de Dados',
        'infra-ti': 'Infraestrutura de TI',
        'seguranca': 'Segurança da Informação',
        'gestao-projetos': 'Gestão de Projetos de TI',
        'cloud': 'Cloud Computing',
        'ia-ml': 'Inteligência Artificial e Machine Learning',
        'data-science': 'Ciência de Dados',
        'suporte': 'Suporte Técnico e Help Desk',
        'iot': 'IoT',
        'vr-ar': 'VR/AR',
        'eng-software': 'Engenharia de Software',
        'arq-software': 'Arquitetura de Software',
        'automacao': 'Automação e Robótica',
        'devops': 'DevOps',
        'ux-ui': 'UX/UI'
    };

    return subcategories[cert.tiSubcategory] || '';
}


function importCertificates() {
    const fileInput = document.getElementById('import-json-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor, selecione um arquivo para importar.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                // Validar estrutura básica dos dados
                const isValid = importedData.every(item => 
                    item.id && 
                    item.courseName && 
                    item.issuer && 
                    item.issueDate && 
                    item.areaCategory
                );
                
                if (isValid) {
                    certificates = importedData;
                    saveCertificates();
                    renderCertificates();
                    closeModal(document.getElementById('import-export-modal'));
                    alert('Importação concluída com sucesso!');
                } else {
                    alert('O arquivo contém dados em formato inválido.');
                }
            } else {
                alert('O arquivo não contém uma lista de certificados válida.');
            }
        } catch (error) {
            alert('Erro ao processar o arquivo: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Funções de persistência
function loadCertificates() {
    const savedCertificates = localStorage.getItem('certificates');
    if (savedCertificates) {
        certificates = JSON.parse(savedCertificates);
    }
}

function saveCertificates() {
    localStorage.setItem('certificates', JSON.stringify(certificates));
}

// Funções utilitárias
function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function formatDateForFile(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}
