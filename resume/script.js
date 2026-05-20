const LANG_KEY = 'lang';
const DEFAULT_SECTION_EXPANDED = true;
const DEFAULT_DETAILS_EXPANDED = false;
let currentLang = localStorage.getItem(LANG_KEY) || 'en';

const $all = (selector, root = document) => [...root.querySelectorAll(selector)];
const textByLang = (en, zh) => (currentLang === 'en' ? en : zh);
const storageKey = (type, el) => `resume:${type}:${el.dataset.key || ''}`;

function sectionTitle(section) {
    return section.querySelector(':scope > h2[data-lang="en"], .module-title-group h2[data-lang="en"]')?.textContent.trim() || '';
}

function moduleKey(section, index) {
    return sectionTitle(section).toLowerCase().replace(/[^a-z0-9]+/g, '-') || `section-${index}`;
}

function setModuleExpanded(button, expanded) {
    button.setAttribute('aria-expanded', String(expanded));
    button.closest('.module')?.classList.toggle('is-collapsed', !expanded);
}

function setItemExpanded(button, expanded) {
    button.setAttribute('aria-expanded', String(expanded));
    button.closest('.module-item')?.classList.toggle('details-collapsed', !expanded);
}

function updateToggleLabels() {
    $all('.module-toggle').forEach(button => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.querySelector('.toggle-label').textContent = expanded
            ? textByLang('Collapse', '收起')
            : textByLang('Expand', '展开');
        setModuleExpanded(button, expanded);
    });

    $all('.item-toggle').forEach(button => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.querySelector('.item-toggle-label').textContent = expanded
            ? textByLang('Hide details', '收起详情')
            : textByLang('Show details', '展开详情');
        setItemExpanded(button, expanded);
    });
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    $all('[data-lang]').forEach(el => {
        el.style.display = el.dataset.lang === lang ? '' : 'none';
    });
    updateToggleLabels();
}

function wrapSection(section, { staticSection = false } = {}) {
    if (section.dataset.ready === 'true') return;
    section.dataset.ready = 'true';
    if (staticSection) section.classList.add('module-static');

    const headings = $all(':scope > h2', section);
    if (!headings.length) return;

    const header = document.createElement('div');
    header.className = `module-header${staticSection ? ' static-header' : ''}`;

    const titleGroup = document.createElement('div');
    titleGroup.className = 'module-title-group';
    headings.forEach(heading => titleGroup.appendChild(heading));
    header.appendChild(titleGroup);

    if (!staticSection) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'module-toggle';
        toggle.innerHTML = '<span class="toggle-label"></span><i class="fas fa-chevron-down" aria-hidden="true"></i>';
        header.appendChild(toggle);
    }

    const content = document.createElement('div');
    content.className = `module-content${staticSection ? ' static-content' : ''}`;
    while (section.firstChild) content.appendChild(section.firstChild);

    section.append(header, content);
}

function initSections() {
    $all('main > .module').forEach((section, index) => {
        const isStatic = section.matches('.about-section, .contact-section');
        section.dataset.key = moduleKey(section, index);
        wrapSection(section, { staticSection: isStatic });

        const toggle = section.querySelector(':scope > .module-header .module-toggle');
        if (!toggle) return;

        const saved = localStorage.getItem(storageKey('section', section));
        setModuleExpanded(toggle, saved === null ? DEFAULT_SECTION_EXPANDED : saved === 'true');
        toggle.addEventListener('click', event => {
            event.stopPropagation();
            const expanded = toggle.getAttribute('aria-expanded') !== 'true';
            setModuleExpanded(toggle, expanded);
            localStorage.setItem(storageKey('section', section), String(expanded));
            updateToggleLabels();
        });
    });
}


function initImageProtection() {
    const protectedTargets = '.banner, img';

    $all(protectedTargets).forEach(el => {
        el.setAttribute('draggable', 'false');
        el.addEventListener('dragstart', event => event.preventDefault());
        el.addEventListener('contextmenu', event => event.preventDefault());
    });

    document.addEventListener('contextmenu', event => {
        if (event.target.closest(protectedTargets)) event.preventDefault();
    });
}

function initExperienceDetails() {
    const experience = $all('main > .module').find(section => sectionTitle(section) === 'Experience');
    if (!experience) return;

    $all('.module-content > .module-item', experience).forEach((item, index) => {
        const right = item.querySelector('.module-right');
        const details = right && $all(':scope > ul', right);
        if (!details?.length || item.dataset.itemReady === 'true') return;

        item.dataset.itemReady = 'true';
        item.dataset.key = `experience-${index}`;
        item.classList.add('has-item-toggle');

        const detailsWrap = document.createElement('div');
        detailsWrap.className = 'item-details';
        details.forEach(detail => detailsWrap.appendChild(detail));

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'item-toggle';
        toggle.innerHTML = '<span class="item-toggle-label"></span><i class="fas fa-chevron-up" aria-hidden="true"></i>';

        const saved = localStorage.getItem(storageKey('item', item));
        right.append(toggle, detailsWrap);
        setItemExpanded(toggle, saved === null ? DEFAULT_DETAILS_EXPANDED : saved === 'true');

        toggle.addEventListener('click', event => {
            event.stopPropagation();
            const expanded = toggle.getAttribute('aria-expanded') !== 'true';
            setItemExpanded(toggle, expanded);
            localStorage.setItem(storageKey('item', item), String(expanded));
            updateToggleLabels();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initImageProtection();
    initSections();
    initExperienceDetails();

    document.getElementById('lang-toggle')?.addEventListener('click', event => {
        event.preventDefault();
        setLang(currentLang === 'en' ? 'zh' : 'en');
    });

    setLang(currentLang);
});
