(function () {
  const DATA_FILES = {
    profile: "data/profile.json",
    projects: "data/projects.json",
    skills: "data/skills.json",
    experience: "data/experience.json"
  };

  const qs = (selector, parent = document) => parent.querySelector(selector);

  const escapeHtml = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const isExternalLink = (href) => href && !href.startsWith("#") && !href.startsWith("mailto:");

  const linkAttrs = (href) => (isExternalLink(href) ? ' target="_blank" rel="noreferrer"' : "");

  const listItems = (items, className = "") => {
    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    return items.map((item) => `<li class="${className}">${escapeHtml(item)}</li>`).join("");
  };

  const tags = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    return `<div class="tags">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`;
  };

  const actionLinks = (links, className = "project-actions") => {
    if (!Array.isArray(links) || links.length === 0) {
      return "";
    }

    return `
      <div class="${className}">
        ${links
          .map(
            (link) => `
              <a class="button button-${escapeHtml(link.variant || "secondary")}" href="${escapeHtml(link.href)}"${linkAttrs(link.href)}>
                ${escapeHtml(link.label)}
              </a>
            `
          )
          .join("")}
      </div>
    `;
  };

  const sectionHead = (label, title, text = "") => `
    <div class="section-head">
      <p class="section-label">${escapeHtml(label)}</p>
      <h2>${escapeHtml(title)}</h2>
      ${text ? `<p>${escapeHtml(text)}</p>` : ""}
    </div>
  `;

  const fetchJson = async (path) => {
    const response = await fetch(path, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Не удалось загрузить ${path}`);
    }

    return response.json();
  };

  const loadData = async () => {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => [key, await fetchJson(path)])
    );

    return Object.fromEntries(entries);
  };

  const renderNavigation = (profile) => {
    const nav = qs("[data-nav]");
    const brandText = qs("[data-brand-text]");
    const brandMark = qs("[data-brand-mark]");

    if (brandText) {
      brandText.textContent = profile.brand || "Резюме";
    }

    if (brandMark) {
      brandMark.hidden = true;
      brandMark.textContent = "";
    }

    if (!nav || !Array.isArray(profile.navigation)) {
      return;
    }

    nav.innerHTML = profile.navigation
      .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
      .join("");
  };

  const renderHero = (profile) => {
    const hero = qs('[data-section="hero"]');
    const data = profile.hero || {};
    const focus = profile.currentFocus || {};

    if (!hero) {
      return;
    }

    const actions = Array.isArray(data.actions)
      ? data.actions
          .map(
            (action) => `
              <a class="button button-${escapeHtml(action.variant || "secondary")}" href="${escapeHtml(action.href)}"${linkAttrs(action.href)}>
                ${escapeHtml(action.label)}
              </a>
            `
          )
          .join("")
      : "";

    hero.innerHTML = `
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="hero-role">${escapeHtml(data.subtitle || profile.role || "")}</p>
          <h1>${escapeHtml(data.title || profile.name || "")}</h1>
          ${data.description ? `<p class="hero-description">${escapeHtml(data.description)}</p>` : ""}
          ${actions ? `<div class="hero-actions">${actions}</div>` : ""}
        </div>

        <aside class="focus-card" aria-label="${escapeHtml(focus.title || "Фокус")}">
          <div class="focus-card-top">
            <p>${escapeHtml(focus.title || "Текущий фокус")}</p>
            <span>${escapeHtml(profile.role || "")}</span>
          </div>
          ${
            Array.isArray(focus.items)
              ? `<ul class="focus-list">${listItems(focus.items)}</ul>`
              : ""
          }
          ${focus.note ? `<p class="focus-note">${escapeHtml(focus.note)}</p>` : ""}
        </aside>
      </div>
    `;
  };

  const renderAbout = (profile) => {
    const section = qs('[data-section="about"]');
    const about = profile.about || {};

    if (!section) {
      return;
    }

    const facts = Array.isArray(about.facts)
      ? about.facts
          .map(
            (fact) => `
              <article class="fact-card">
                <strong>${escapeHtml(fact.value)}</strong>
                <span>${escapeHtml(fact.label)}</span>
              </article>
            `
          )
          .join("")
      : "";

    const githubStats = Array.isArray(about.githubStats)
      ? about.githubStats
          .map(
            (stat) => `
              <article class="github-stat-card">
                <div class="github-stat-head">
                  <strong>${escapeHtml(stat.value)} ${escapeHtml(stat.label)}</strong>
                  <span>${escapeHtml(stat.year)}</span>
                </div>
                ${stat.image ? `<img src="${escapeHtml(stat.image)}" alt="GitHub contributions ${escapeHtml(stat.year)}">` : ""}
              </article>
            `
          )
          .join("")
      : "";

    section.innerHTML = `
      <div class="container about-grid">
        ${sectionHead("Обо мне", about.title || "Обо мне")}
        <div class="about-content">
          ${about.text ? `<p>${escapeHtml(about.text)}</p>` : ""}
          ${facts ? `<div class="fact-grid">${facts}</div>` : ""}
          ${githubStats ? `<div class="github-stats">${githubStats}</div>` : ""}
        </div>
      </div>
    `;
  };

  const renderExperience = (items) => {
    const section = qs('[data-section="experience"]');

    if (!section) {
      return;
    }

    const cards = Array.isArray(items)
      ? items
          .map(
            (item) => `
              <article class="experience-card">
                <div class="card-meta">
                  ${item.period ? `<span>${escapeHtml(item.period)}</span>` : ""}
                  ${item.company ? `<span>${escapeHtml(item.company)}</span>` : ""}
                </div>
                <h3>${escapeHtml(item.role || item.company || "")}</h3>
                ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
                ${
                  Array.isArray(item.responsibilities)
                    ? `<ul class="clean-list">${listItems(item.responsibilities)}</ul>`
                    : ""
                }
                ${tags(item.stack)}
              </article>
            `
          )
          .join("")
      : "";

    section.innerHTML = `
      <div class="container">
        ${sectionHead("Опыт", "Коммерческая разработка", "Backend, интеграции с внешними API и поддержка продуктовой инфраструктуры.")}
        <div class="experience-list">${cards}</div>
      </div>
    `;
  };

  const renderProjects = (projects) => {
    const section = qs('[data-section="projects"]');

    if (!section) {
      return;
    }

    const cards = Array.isArray(projects)
      ? projects
          .map(
            (project) => `
              <article class="project-card project-${escapeHtml(project.layout || "secondary")}">
                <div class="card-meta">
                  ${project.type ? `<span>${escapeHtml(project.type)}</span>` : ""}
                </div>
                <h3>${escapeHtml(project.title)}</h3>
                ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ""}
                ${
                  Array.isArray(project.highlights)
                    ? `<ul class="clean-list">${listItems(project.highlights)}</ul>`
                    : ""
                }
                ${actionLinks(project.links)}
                ${tags(project.stack)}
              </article>
            `
          )
          .join("")
      : "";

    section.innerHTML = `
      <div class="container">
        ${sectionHead("Проекты", "Избранные работы", "Коммерческий backend, развивающийся Telegram-продукт и небольшие FastAPI/Django-проекты.")}
        <div class="projects-grid">${cards}</div>
      </div>
    `;
  };

  const renderSkills = (skills) => {
    const section = qs('[data-section="skills"]');

    if (!section) {
      return;
    }

    const groups = Array.isArray(skills)
      ? skills
          .map(
            (group) => `
              <article class="skill-group">
                <h3>${escapeHtml(group.group)}</h3>
                ${tags(group.items)}
              </article>
            `
          )
          .join("")
      : "";

    section.innerHTML = `
      <div class="container">
        ${sectionHead("Навыки", "Технологии", "Компактный стек без инструментов, с которыми пока нет практического опыта.")}
        <div class="skills-grid">${groups}</div>
      </div>
    `;
  };

  const renderContacts = (profile) => {
    const section = qs('[data-section="contacts"]');
    const contacts = profile.contacts || {};

    if (!section) {
      return;
    }

    const links = Array.isArray(contacts.links)
      ? contacts.links
          .map(
            (link) => `
              <a class="contact-link" href="${escapeHtml(link.href)}"${linkAttrs(link.href)}>
                <span>${escapeHtml(link.label)}</span>
                <span>${escapeHtml(link.href.replace(/^mailto:/, ""))}</span>
              </a>
            `
          )
          .join("")
      : "";

    section.innerHTML = `
      <div class="container contact-panel">
        <div>
          <p class="section-label">Контакты</p>
          <h2>${escapeHtml(contacts.title || "Контакты")}</h2>
          ${contacts.description ? `<p>${escapeHtml(contacts.description)}</p>` : ""}
        </div>
        ${links ? `<div class="contact-links">${links}</div>` : ""}
      </div>
    `;
  };

  const setupMenu = () => {
    const button = qs("[data-menu-button]");
    const nav = qs("[data-nav]");

    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      document.body.classList.toggle("menu-open", !isOpen);
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        button.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      }
    });
  };

  const renderFooter = (profile) => {
    const footer = qs("[data-footer]");

    if (footer) {
      footer.textContent = `${profile.footer || profile.fullName || profile.name || ""} ${new Date().getFullYear()}.`;
    }
  };

  const renderError = (error) => {
    const main = qs("#main");
    if (!main) {
      return;
    }

    main.innerHTML = `
      <section class="section error-section">
        <div class="container">
          <div class="error-box">
            <h1>Не удалось загрузить данные</h1>
            <p>${escapeHtml(error.message)}</p>
            <p>Запустите сайт через локальный сервер: <code>python -m http.server 8000</code>.</p>
          </div>
        </div>
      </section>
    `;
  };

  const init = async () => {
    setupMenu();

    try {
      const data = await loadData();
      renderNavigation(data.profile);
      renderHero(data.profile);
      renderAbout(data.profile);
      renderExperience(data.experience);
      renderProjects(data.projects);
      renderSkills(data.skills);
      renderContacts(data.profile);
      renderFooter(data.profile);
    } catch (error) {
      renderError(error);
    }
  };

  init();
})();
