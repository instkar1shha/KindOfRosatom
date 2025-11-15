const API_BASE = "/api";


const ROLE_KEY = "ddr-current-role";

const ROLE_LABELS = {
  guest: "Гость",
  volunteer: "Волонтёр",
  ngo: "НКО",
  moderator: "Модератор",
  admin: "Админ Росатома",
};

const ROLE_DESCRIPTIONS = {
  guest: "Просмотр сайта без авторизации.",
  volunteer:
    "Волонтёр: может просматривать портал и добавлять инициативы в избранное.",
  ngo: "Представитель НКО: доступ к управлению своей организацией (в будущем).",
  moderator:
    "Модератор: управляет НКО, событиями, новостями и материалами в своём контуре.",
  admin:
    "Админ Росатома: полный доступ ко всем разделам и настройкам портала.",
};

function getCurrentRole() {
  try {
    const stored = localStorage.getItem(ROLE_KEY);
    if (stored && ROLE_LABELS[stored]) {
      return stored;
    }
  } catch (e) {
    console.warn("Не удалось прочитать роль из localStorage", e);
  }
  return "guest";
}

function setCurrentRole(role) {
  if (!ROLE_LABELS[role]) {
    role = "guest";
  }
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch (e) {
    console.warn("Не удалось сохранить роль в localStorage", e);
  }
}



document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js загружен");


  let currentRole = getCurrentRole();



  const navLinks = document.querySelectorAll("nav a");
  const pages = document.querySelectorAll(".page");

  function showPage(pageName) {
    pages.forEach((p) => p.classList.remove("active"));
    const pageEl = document.getElementById("page-" + pageName);
    if (pageEl) {
      pageEl.classList.add("active");
    }

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.page === pageName);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const page = link.dataset.page;
      if (page) {
        showPage(page);
      }
    });
  });



  async function fetchJSON(path, params = null, options = {}) {
    try {
      let url = API_BASE + path;
      if (params) {
        const usp = new URLSearchParams(params);
        url += "?" + usp.toString();
      }

      const baseHeaders = {
        "Content-Type": "application/json",
        "X-Demo-Role": currentRole || "guest",
      };

      const mergedOptions = {
        ...options,
        headers: {
          ...baseHeaders,
          ...(options.headers || {}),
        },
      };

      const resp = await fetch(url, mergedOptions);
      if (!resp.ok) {
        console.error("Ошибка запроса", url, resp.status);
        return [];
      }
      return await resp.json();
    } catch (e) {
      console.error("Ошибка сети для", path, e);
      return [];
    }
  }

  function formatDateTimeRu(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const datePart = d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} · ${timePart}`;
  }



  const roleSelect = document.getElementById("roleSelect");
  const roleDescEl = document.getElementById("currentRoleDescription");
  const currentRoleLabel = document.getElementById("currentRoleLabel");

  const addNgoBtn = document.getElementById("addNgoBtn");
  const addKbBtn = document.getElementById("addKbBtn");
  const addEventBtn = document.getElementById("addEventBtn");
  const addNewsBtn = document.getElementById("addNewsBtn");


  const favoritesNgoList = document.getElementById("favoritesNgoList");
  const favoritesEventList = document.getElementById("favoritesEventList");
  const favoritesNewsList = document.getElementById("favoritesNewsList");
  const clearAllFavoritesBtn = document.getElementById("clearAllFavoritesBtn");



  const ROLE_TITLES = {
    guest: "гость",
    volunteer: "волонтёр",
    ngo: "представитель НКО",
    moderator: "модератор",
    admin: "администратор Росатома",
  };

  function isAdminOrModerator() {
    return currentRole === "admin" || currentRole === "moderator";
  }

  function canAddEvents() {
    return (
      currentRole === "admin" ||
      currentRole === "moderator" ||
      currentRole === "ngo"
    );
  }

  function updateRoleUI(role) {
    if (roleSelect) {
      roleSelect.value = role;
    }
    if (roleDescEl) {
      roleDescEl.textContent =
        ROLE_DESCRIPTIONS[role] || `Текущая роль: ${ROLE_LABELS[role] || role}`;
    }
    if (currentRoleLabel) {
      const title = ROLE_TITLES[role] || role;
      currentRoleLabel.textContent = title;
    }
  }

  function applyRoleUI() {

    if (addNgoBtn) {
      addNgoBtn.style.display = isAdminOrModerator() ? "" : "none";
    }
    if (addKbBtn) {
      addKbBtn.style.display = isAdminOrModerator() ? "" : "none";
    }
    if (addNewsBtn) {
      addNewsBtn.style.display = isAdminOrModerator() ? "" : "none";
    }
    if (addEventBtn) {
      addEventBtn.style.display = canAddEvents() ? "" : "none";
    }
  }


  updateRoleUI(currentRole);
  applyRoleUI();

  if (roleSelect) {
    roleSelect.addEventListener("change", () => {
      const newRole = roleSelect.value;
      setCurrentRole(newRole);
      currentRole = newRole;
      updateRoleUI(newRole);
      applyRoleUI();
      console.log("Текущая роль:", newRole);
    });
  }


  const citySelect = document.getElementById("citySelect");
  const currentCityLabel = document.getElementById("currentCityLabel");
  const homeCityTitle = document.getElementById("homeCityTitle");
  const homeNgoCount = document.getElementById("homeNgoCount");
  const homeNextEventDate = document.getElementById("homeNextEventDate");
  const homeNextEventText = document.getElementById("homeNextEventText");

  let ngosData = [];
  let eventsData = [];
  let kbData = [];
  let newsData = [];

  function applyCityFilter() {
    if (!citySelect) return;

    const city = citySelect.value;
    const cityElements = document.querySelectorAll("[data-city]");

    cityElements.forEach((el) => {
      const elCity = el.dataset.city;
      if (!elCity || elCity === "all" || city === "all") {
        el.style.display = "";
      } else {
        el.style.display = elCity === city ? "" : "none";
      }
    });
  }

  function updateHomeByCity() {
    if (!citySelect) return;

    const city = citySelect.value;

    if (currentCityLabel && homeCityTitle) {
      if (city === "all") {
        currentCityLabel.textContent = "Все города";
        homeCityTitle.textContent = "Все города";
      } else {
        currentCityLabel.textContent = city;
        homeCityTitle.textContent = city;
      }
    }

    if (homeNgoCount) {
      let count = 0;
      if (ngosData.length > 0) {
        count = ngosData.filter((ngo) => {
          return city === "all" || ngo.city === city;
        }).length;
      } else {
        const ngoCards = document.querySelectorAll("#ngoList .card");
        const ngosForCity = Array.from(ngoCards).filter((card) => {
          const cardCity = card.dataset.city;
          return city === "all" || cardCity === city;
        });
        count = ngosForCity.length;
      }
      homeNgoCount.textContent = String(count);
    }

    if (homeNextEventDate && homeNextEventText) {
      let eventsForCity = [];

      if (eventsData.length > 0) {
        eventsForCity = eventsData.filter((ev) => {
          return city === "all" || ev.city === city;
        });
      } else {
        const eventCards = document.querySelectorAll("#eventList .card");
        eventsForCity = Array.from(eventCards).map((card) => {
          const dateEl = card.querySelector(".event-date");
          return {
            datetime: dateEl ? dateEl.dataset.iso || null : null,
            title: (card.querySelector(".card-title") || {}).textContent || "",
          };
        });
      }

      const now = new Date();
      const futureEvents = eventsForCity
        .map((ev) => ({
          ...ev,
          dt: ev.datetime ? new Date(ev.datetime) : null,
        }))
        .filter((ev) => ev.dt && ev.dt >= now)
        .sort((a, b) => a.dt - b.dt);

      if (futureEvents.length === 0) {
        homeNextEventDate.textContent = "Нет запланированных событий";
        homeNextEventText.textContent =
          "Следите за обновлением календаря событий в вашем городе.";
      } else {
        const nextEv = futureEvents[0];
        homeNextEventDate.textContent = formatDateTimeRu(nextEv.datetime);
        homeNextEventText.textContent = nextEv.title || "Ближайшее событие";
      }
    }
  }

  function handleCityChange() {
    applyCityFilter();
    applyNgoFilter();
    applyEventFilter();
    applyNewsFilterByScope();
    updateHomeByCity();
  }

  if (citySelect) {
    citySelect.addEventListener("change", handleCityChange);
  }


  const ngoSearch = document.getElementById("ngoSearch");
  const ngoCategory = document.getElementById("ngoCategory");
  const ngoList = document.getElementById("ngoList");
  const ngoFormCard = document.getElementById("ngoFormCard");
  const ngoForm = document.getElementById("ngoForm");
  const ngoNameInput = document.getElementById("ngoName");
  const ngoCityInput = document.getElementById("ngoCity");
  const ngoCategoryInput = document.getElementById("ngoCategoryInput");
  const ngoDescriptionInput = document.getElementById("ngoDescription");
  const ngoAddressInput = document.getElementById("ngoAddress");
  const ngoSiteInput = document.getElementById("ngoSite");
  const ngoFormMessage = document.getElementById("ngoFormMessage");
  const cancelNgoFormBtn = document.getElementById("cancelNgoFormBtn");


  function renderNgoList() {
    if (!ngoList) return;
    ngoList.innerHTML = "";

    ngosData.forEach((ngo) => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.city = ngo.city || "all";
      card.dataset.category = ngo.category || "social";

      const categoryTextMap = {
        social: "Социальные инициативы",
        eco: "Экологические инициативы",
        culture: "Культурные инициативы",
        sport: "Спортивные инициативы",
      };

      const catText =
        categoryTextMap[ngo.category] || "Инициативы и проекты";

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <div class="card-title">${ngo.name}</div>
          <div class="badge-city">${ngo.city || "Город не указан"}</div>
          <div class="favorite-toggle" data-type="ngo" data-id="ngo-${ngo.id}">☆</div>
        </div>
        <div class="card-meta">${catText}</div>
        <p>${ngo.description || ""}</p>
        ${
          ngo.address || ngo.site
            ? `<p style="font-size:12px; margin-top:6px;">
                ${ngo.address ? `Адрес: ${ngo.address}<br/>` : ""}
                ${
                  ngo.site
                    ? `Сайт / соцсети: <a href="${ngo.site}" target="_blank" rel="noopener noreferrer">${ngo.site}</a>`
                    : ""
                }
              </p>`
            : ""
        }
      `;
      ngoList.appendChild(card);
    });

    updateFavoriteUI();
    applyNgoFilter();
  }

  function applyNgoFilter() {
    const q = (ngoSearch?.value || "").toLowerCase().trim();
    const cat = ngoCategory?.value || "all";

    if (!ngoList) return;

    ngoList.querySelectorAll(".card").forEach((card) => {
      const titleEl = card.querySelector(".card-title");
      const title = titleEl ? titleEl.textContent.toLowerCase() : "";
      const cardCat = card.dataset.category || "all";

      const matchesText = !q || title.includes(q);
      const matchesCat = cat === "all" || cardCat === cat;

      card.style.display = matchesText && matchesCat ? "" : "none";
    });

    applyCityFilter();
  }

  if (ngoSearch) ngoSearch.addEventListener("input", applyNgoFilter);
  if (ngoCategory) ngoCategory.addEventListener("change", applyNgoFilter);

    async function loadNgosFromApi() {
    ngosData = await fetchJSON("/ngos");
    renderNgoList();
    updateHomeByCity();
    renderFavoritesProfile();
  }



  const kbCategory = document.getElementById("kbCategory");
  const kbList = document.getElementById("kbList");

  function renderKbList() {
    if (!kbList) return;
    kbList.innerHTML = "";

    kbData.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.category = item.category || "training";

      let typeLabel = "Материал";
      if (item.kind === "video") typeLabel = "Видео";
      else if (item.kind === "pdf") typeLabel = "PDF";

      card.innerHTML = `
        <div class="kb-type">${typeLabel}</div>
        <div class="card-title">${item.title}</div>
        <p>${item.description || ""}</p>
        ${
          item.link
            ? `<div style="margin-top:8px;">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size:12px;">Открыть</a>
               </div>`
            : ""
        }
      `;
      kbList.appendChild(card);
    });
  }

  if (kbCategory) {
    kbCategory.addEventListener("change", () => {
      const cat = kbCategory.value;
      if (!kbList) return;
      kbList.querySelectorAll(".card").forEach((card) => {
        const cardCat = card.dataset.category || "all";
        card.style.display = cat === "all" || cardCat === cat ? "" : "none";
      });
    });
  }

  async function loadKbFromApi() {
    kbData = await fetchJSON("/knowledge");
    renderKbList();
  }


  const eventType = document.getElementById("eventType");
  const eventList = document.getElementById("eventList");
  const eventFormCard = document.getElementById("eventFormCard");
  const eventForm = document.getElementById("eventForm");
  const eventCityInput = document.getElementById("eventCity");
  const eventTypeInput = document.getElementById("eventTypeInput");
  const eventDateInput = document.getElementById("eventDate");
  const eventTimeInput = document.getElementById("eventTime");
  const eventTitleInput = document.getElementById("eventTitle");
  const eventOrganizerInput = document.getElementById("eventOrganizer");
  const eventDescriptionInput = document.getElementById("eventDescription");
  const eventFormMessage = document.getElementById("eventFormMessage");
  const cancelEventFormBtn = document.getElementById("cancelEventFormBtn");


  function renderEventList() {
    if (!eventList) return;
    eventList.innerHTML = "";

    eventsData.forEach((ev) => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.city = ev.city || "all";
      card.dataset.type = ev.type || "social";

      const dateText = formatDateTimeRu(ev.datetime);

      card.innerHTML = `
        <div class="event-date" data-iso="${ev.datetime || ""}">${dateText}</div>
        <div class="card-title">${ev.title}</div>
        <div class="card-meta">Организатор: ${ev.organizer || "Не указан"} · ${
        ev.city || "Город не указан"
      }</div>
        <p>${ev.description || ""}</p>
        <div style="margin-top:8px; display:flex; align-items:center; gap:8px;">
          <button class="btn btn-primary" style="font-size:12px;">Записаться</button>
          <div class="favorite-toggle" data-type="event" data-id="event-${ev.id}">☆</div>
        </div>
      `;
      eventList.appendChild(card);
    });

    updateFavoriteUI();
    applyEventFilter();
    applyCityFilter();
    updateHomeByCity();
  }

  function applyEventFilter() {
    if (!eventList) return;
    const type = eventType ? eventType.value : "all";
    eventList.querySelectorAll(".card").forEach((card) => {
      const cardType = card.dataset.type || "all";
      card.style.display = type === "all" || cardType === type ? "" : "none";
    });
    applyCityFilter();
  }

  if (eventType) {
    eventType.addEventListener("change", () => {
      applyEventFilter();
    });
  }

    async function loadEventsFromApi() {
    eventsData = await fetchJSON("/events");
    renderEventList();
    renderFavoritesProfile();
  }



  const newsScope = document.getElementById("newsScope");
  const newsList = document.getElementById("newsList");
  const newsFormCard = document.getElementById("newsFormCard");
  const newsForm = document.getElementById("newsForm");
  const newsCityInput = document.getElementById("newsCity");
  const newsTitleInput = document.getElementById("newsTitle");
  const newsTextInput = document.getElementById("newsText");
  const newsImageUrlInput = document.getElementById("newsImageUrl");
  const newsFileUrlInput = document.getElementById("newsFileUrl");
  const newsFormMessage = document.getElementById("newsFormMessage");
  const cancelNewsFormBtn = document.getElementById("cancelNewsFormBtn");


    function renderNewsList() {
    if (!newsList) return;
    newsList.innerHTML = "";

    newsData.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.city = item.city || "all";

      const cityLabel = item.city === "all" ? "Все города" : item.city;
      const dateText = formatDateTimeRu(item.datetime);

      card.innerHTML = `
        <div class="news-date">${dateText} · ${cityLabel}</div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <div class="card-title">${item.title}</div>
          <div class="favorite-toggle" data-type="news" data-id="news-${item.id}">☆</div>
        </div>
        <p>${item.text || ""}</p>
        ${
          item.imageUrl
            ? `<img src="${item.imageUrl}" alt="" class="news-image" style="margin-top:8px; max-width:100%; border-radius:8px;" />`
            : ""
        }
        ${
          item.fileUrl
            ? `<p style="margin-top:6px; font-size:13px;">
                 <a href="${item.fileUrl}" target="_blank" rel="noopener noreferrer">
                   Открыть прикреплённый документ
                 </a>
               </p>`
            : ""
        }
      `;
      newsList.appendChild(card);
    });

    applyNewsFilterByScope();
    applyCityFilter();
    updateFavoriteUI();
  }


  function applyNewsFilterByScope() {
    if (!newsList || !newsScope) return;
    const scope = newsScope.value;
    const currentCity = citySelect ? citySelect.value : "all";

    newsList.querySelectorAll(".card").forEach((card) => {
      const cardCity = card.dataset.city || "all";
      let show = true;

      if (scope === "city") {
        show =
          currentCity === "all"
            ? cardCity !== "all"
            : cardCity === currentCity || cardCity === "all";
      } else if (scope === "global") {
        show = cardCity === "all";
      } else {
        show = true;
      }

      card.style.display = show ? "" : "none";
    });
  }

  if (newsScope) {
    newsScope.addEventListener("change", () => {
      applyNewsFilterByScope();
    });
  }

    async function loadNewsFromApi() {
    newsData = await fetchJSON("/news");
    renderNewsList();
    renderFavoritesProfile();
  }


  const FAVORITES_KEY = "dobrye_dela_favorites";

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveFavorites(favs) {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    } catch (e) {
      console.warn("Не удалось сохранить избранное", e);
    }
  }

  function updateFavoriteUI() {
    const favs = loadFavorites();
    document.querySelectorAll(".favorite-toggle").forEach((el) => {
      const type = el.dataset.type;
      const id = el.dataset.id;
      const key = `${type}:${id}`;
      const isFav = !!favs[key];
      el.textContent = isFav ? "★" : "☆";
      el.classList.toggle("favorite-active", isFav);
    });
  }



  document.body.addEventListener("click", (e) => {
    const el = e.target.closest(".favorite-toggle");
    if (!el) return;
    const type = el.dataset.type;
    const id = el.dataset.id;
    if (!type || !id) return;

    const key = `${type}:${id}`;
    const favs = loadFavorites();
    favs[key] = !favs[key];
    saveFavorites(favs);
    updateFavoriteUI();
    renderFavoritesProfile();

      if (clearAllFavoritesBtn) {
    clearAllFavoritesBtn.addEventListener("click", () => {
      const confirmed = confirm(
        "Очистить все избранные НКО, события и новости?"
      );
      if (!confirmed) return;

      saveFavorites({});
      updateFavoriteUI();
      renderFavoritesProfile();
    });
  }


      function renderFavoritesProfile() {
    if (!favoritesNgoList || !favoritesEventList || !favoritesNewsList) {
      return;
    }

    const favs = loadFavorites();

    favoritesNgoList.innerHTML = "";
    favoritesEventList.innerHTML = "";
    favoritesNewsList.innerHTML = "";

    let hasNgo = false;
    let hasEvent = false;
    let hasNews = false;

    const ngoById = {};
    ngosData.forEach((ngo) => {
      ngoById[ngo.id] = ngo;
    });

    const eventById = {};
    eventsData.forEach((ev) => {
      eventById[ev.id] = ev;
    });

    const newsById = {};
    newsData.forEach((n) => {
      newsById[n.id] = n;
    });

    Object.entries(favs).forEach(([key, value]) => {
      if (!value) return; 
      const [type, rawId] = key.split(":");
      if (!type || !rawId) return;

      let numericId = null;
      const parts = rawId.split("-");
      if (parts.length === 2) {
        numericId = Number(parts[1]);
      }

      if (!numericId) return;

      if (type === "ngo") {
        const ngo = ngoById[numericId];
        if (!ngo) return;
        hasNgo = true;
        const item = document.createElement("div");
        item.className = "favorite-item";
        item.innerHTML = `
          <div class="favorite-title">${ngo.name}</div>
          <div class="favorite-meta">${ngo.city || "Город не указан"}</div>
        `;
        favoritesNgoList.appendChild(item);
      } else if (type === "event") {
        const ev = eventById[numericId];
        if (!ev) return;
        hasEvent = true;
        const item = document.createElement("div");
        item.className = "favorite-item";
        item.innerHTML = `
          <div class="favorite-title">${ev.title}</div>
          <div class="favorite-meta">
            ${ev.city || "Город не указан"} · ${formatDateTimeRu(ev.datetime)}
          </div>
        `;
        favoritesEventList.appendChild(item);
      } else if (type === "news") {
        const n = newsById[numericId];
        if (!n) return;
        hasNews = true;
        const item = document.createElement("div");
        item.className = "favorite-item";
        item.innerHTML = `
          <div class="favorite-title">${n.title}</div>
          <div class="favorite-meta">${formatDateTimeRu(n.datetime)}</div>
        `;
        favoritesNewsList.appendChild(item);
      }
    });

    if (!hasNgo) {
      favoritesNgoList.innerHTML =
        '<p style="font-size:12px; color:#666;">Пока нет избранных НКО.</p>';
    }
    if (!hasEvent) {
      favoritesEventList.innerHTML =
        '<p style="font-size:12px; color:#666;">Пока нет избранных событий.</p>';
    }
    if (!hasNews) {
      favoritesNewsList.innerHTML =
        '<p style="font-size:12px; color:#666;">Пока нет избранных новостей.</p>';
    }
  }

  });



  async function createNgoViaApi(payload) {
    try {
      const resp = await fetch(API_BASE + "/ngos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-Role": getCurrentRole() || "guest",
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await resp.json();
      } catch (_) {
      }

      if (!resp.ok) {
        const msg =
          (data && data.error) || "Ошибка при сохранении НКО на сервере";
        throw new Error(msg);
      }

      return data;
    } catch (e) {
      console.error("createNgoViaApi error", e);
      throw e;
    }
  }


  async function createNewsViaApi(payload) {
    try {
      const resp = await fetch(API_BASE + "/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-Role": getCurrentRole() || "guest",
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await resp.json();
      } catch (_) {

      }

      if (!resp.ok) {
        const msg =
          (data && data.error) || "Ошибка при сохранении новости на сервере";
        throw new Error(msg);
      }

      return data;
    } catch (e) {
      console.error("createNewsViaApi error", e);
      throw e;
    }
  }



  async function createEventViaApi(payload) {
    try {
      const resp = await fetch(API_BASE + "/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-Role": getCurrentRole() || "guest",
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await resp.json();
      } catch (_) {
      }

      if (!resp.ok) {
        const msg =
          (data && data.error) || "Ошибка при сохранении события на сервере";
        throw new Error(msg);
      }

      return data;
    } catch (e) {
      console.error("createEventViaApi error", e);
      throw e;
    }
  }



    if (addNgoBtn) {
    addNgoBtn.addEventListener("click", () => {
      if (!isAdminOrModerator()) {
        alert("Добавление НКО доступно только администратору и модератору.");
        return;
      }
      if (!ngoFormCard) return;


      if (citySelect && ngoCityInput) {
        const c = citySelect.value;
        if (c && c !== "all") {
          ngoCityInput.value = c;
        }
      }

      if (ngoFormMessage) ngoFormMessage.textContent = "";

      const isHidden =
        !ngoFormCard.style.display || ngoFormCard.style.display === "none";
      ngoFormCard.style.display = isHidden ? "block" : "none";
    });
  }

    if (cancelNgoFormBtn && ngoFormCard) {
    cancelNgoFormBtn.addEventListener("click", () => {
      ngoFormCard.style.display = "none";
      if (ngoForm) ngoForm.reset();
      if (ngoFormMessage) ngoFormMessage.textContent = "";
    });
  }

    if (ngoForm && ngoFormCard) {
    ngoForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!isAdminOrModerator()) {
        if (ngoFormMessage) {
          ngoFormMessage.textContent =
            "Недостаточно прав: добавление НКО доступно только администратору и модератору.";
        }
        return;
      }

      const name = (ngoNameInput?.value || "").trim();
      const city = ngoCityInput?.value || "";
      const category = ngoCategoryInput?.value || "social";
      const description = (ngoDescriptionInput?.value || "").trim();
      const address = (ngoAddressInput?.value || "").trim();
      const site = (ngoSiteInput?.value || "").trim();

      if (!name || !city) {
        if (ngoFormMessage) {
          ngoFormMessage.textContent = "Заполните название НКО и город.";
        }
        return;
      }

      const payload = {
        name,
        city,
        category,
        description,
        address: address || null,
        site: site || null,
      };

      try {
        if (ngoFormMessage) {
          ngoFormMessage.textContent = "Сохраняем НКО...";
        }

        const created = await createNgoViaApi(payload);

        if (created && created.id != null) {
          ngosData.push(created);
        } else {
          ngosData = await fetchJSON("/ngos");
        }

        renderNgoList();

        if (ngoFormMessage) {
          ngoFormMessage.textContent = "НКО успешно добавлено.";
        }

        setTimeout(() => {
          if (ngoForm) ngoForm.reset();
          if (ngoFormMessage) ngoFormMessage.textContent = "";
          ngoFormCard.style.display = "none";
        }, 800);
      } catch (err) {
        console.error(err);
        if (ngoFormMessage) {
          ngoFormMessage.textContent =
            err.message || "Не удалось сохранить НКО.";
        }
      }
    });
  }



  if (addKbBtn) {
    addKbBtn.addEventListener("click", () => {
      if (!isAdminOrModerator()) {
        alert("Добавление материалов базы знаний доступно только модератору/админу.");
        return;
      }
      alert("Здесь будет форма добавления материала (endpoint /api/knowledge).");
    });
  }

  if (addEventBtn) {
    addEventBtn.addEventListener("click", () => {
      if (!canAddEvents()) {
        alert("Добавление событий доступно НКО, модератору и админу.");
        return;
      }
      if (!eventFormCard) return;


      if (citySelect && eventCityInput) {
        const c = citySelect.value;
        if (c && c !== "all") {
          eventCityInput.value = c;
        }
      }
      if (eventType && eventTypeInput) {
        const t = eventType.value;
        if (t && t !== "all") {
          eventTypeInput.value = t;
        }
      }

      if (eventFormMessage) {
        eventFormMessage.textContent = "";
      }


      const isHidden =
        !eventFormCard.style.display || eventFormCard.style.display === "none";
      eventFormCard.style.display = isHidden ? "block" : "none";
    });
  }

    if (cancelEventFormBtn && eventFormCard) {
    cancelEventFormBtn.addEventListener("click", () => {
      eventFormCard.style.display = "none";
      if (eventForm) eventForm.reset();
      if (eventFormMessage) eventFormMessage.textContent = "";
    });
  }

    if (eventForm && eventFormCard) {
    eventForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!canAddEvents()) {
        if (eventFormMessage) {
          eventFormMessage.textContent =
            "Недостаточно прав: добавление событий доступно НКО, модератору и админу.";
        }
        return;
      }

      const city = eventCityInput?.value || "";
      const typeValue = eventTypeInput?.value || "social";
      const date = eventDateInput?.value;
      const time = eventTimeInput?.value;
      const title = (eventTitleInput?.value || "").trim();
      const organizer = (eventOrganizerInput?.value || "").trim();
      const description = (eventDescriptionInput?.value || "").trim();

      if (!city || !date || !time || !title) {
        if (eventFormMessage) {
          eventFormMessage.textContent =
            "Пожалуйста, заполните город, дату, время и название события.";
        }
        return;
      }

      const datetimeIso = new Date(`${date}T${time}:00`).toISOString();

      try {
        if (eventFormMessage) {
          eventFormMessage.textContent = "Сохраняем событие...";
        }

        const created = await createEventViaApi({
          city,
          type: typeValue,
          datetime: datetimeIso,
          title,
          organizer,
          description,
        });


        if (created && created.id != null) {
          eventsData.push(created);
        } else {

          eventsData = await fetchJSON("/events");
        }

        renderEventList();

        if (eventFormMessage) {
          eventFormMessage.textContent = "Событие успешно добавлено.";
        }

        setTimeout(() => {
          if (eventForm) eventForm.reset();
          if (eventFormMessage) eventFormMessage.textContent = "";
          eventFormCard.style.display = "none";
        }, 800);
      } catch (err) {
        console.error(err);
        if (eventFormMessage) {
          eventFormMessage.textContent =
            err.message || "Не удалось сохранить событие.";
        }
      }
    });
  }



    if (addNewsBtn) {
    addNewsBtn.addEventListener("click", () => {
      if (!isAdminOrModerator()) {
        alert("Добавление новостей доступно только модератору и админу.");
        return;
      }
      if (!newsFormCard) return;


      if (citySelect && newsCityInput) {
        const c = citySelect.value;
        if (c && c !== "all") {
          newsCityInput.value = c;
        } else {
          newsCityInput.value = "all";
        }
      }

      if (newsFormMessage) newsFormMessage.textContent = "";

      const isHidden =
        !newsFormCard.style.display || newsFormCard.style.display === "none";
      newsFormCard.style.display = isHidden ? "block" : "none";
    });
  }

    if (cancelNewsFormBtn && newsFormCard) {
    cancelNewsFormBtn.addEventListener("click", () => {
      newsFormCard.style.display = "none";
      if (newsForm) newsForm.reset();
      if (newsFormMessage) newsFormMessage.textContent = "";
    });
  }

  if (newsForm && newsFormCard) {
    newsForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!isAdminOrModerator()) {
        if (newsFormMessage) {
          newsFormMessage.textContent =
            "Недостаточно прав: добавление новостей доступно только модератору и администратору.";
        }
        return;
      }

      const city = newsCityInput?.value || "all";
      const title = (newsTitleInput?.value || "").trim();
      const text = (newsTextInput?.value || "").trim();
      const imageUrl = (newsImageUrlInput?.value || "").trim();
      const fileUrl = (newsFileUrlInput?.value || "").trim();

      if (!title || !text) {
        if (newsFormMessage) {
          newsFormMessage.textContent =
            "Пожалуйста, заполните заголовок и текст новости.";
        }
        return;
      }

      const payload = {
        city: city || "all",
        title,
        text,
        imageUrl: imageUrl || null,
        fileUrl: fileUrl || null,

      };

      try {
        if (newsFormMessage) {
          newsFormMessage.textContent = "Сохраняем новость...";
        }

        const created = await createNewsViaApi(payload);

        if (created && created.id != null) {
          newsData.unshift(created); 
        } else {
          newsData = await fetchJSON("/news");
        }

        renderNewsList();

        if (newsFormMessage) {
          newsFormMessage.textContent = "Новость успешно добавлена.";
        }

        setTimeout(() => {
          if (newsForm) newsForm.reset();
          if (newsFormMessage) newsFormMessage.textContent = "";
          newsFormCard.style.display = "none";
        }, 800);
      } catch (err) {
        console.error(err);
        if (newsFormMessage) {
          newsFormMessage.textContent =
            err.message || "Не удалось сохранить новость.";
        }
      }
    });
  }




  showPage("home");

  loadNgosFromApi();
  loadEventsFromApi();
  loadKbFromApi();
  loadNewsFromApi();

  handleCityChange();
  renderFavoritesProfile();
});

window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add("preloader-hidden");
    }, 1000);
  }
});



