document.addEventListener("DOMContentLoaded", () => {
  // Навигация по страницам
  const navLinks = document.querySelectorAll("nav a");
  const pages = document.querySelectorAll(".page");

  function showPage(pageName) {
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById("page-" + pageName).classList.add("active");

    navLinks.forEach(link => {
      link.classList.toggle("active", link.dataset.page === pageName);
    });
  }

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      const page = link.dataset.page;
      showPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // CTA-кнопки на главной
  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => {
      showPage(btn.dataset.goto);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // ---------------- Город и динамическая главная ----------------

  const citySelect = document.getElementById("citySelect");

  const currentCityLabel = document.getElementById("currentCityLabel");
  const homeCityTitle = document.getElementById("homeCityTitle");
  const homeNgoCount = document.getElementById("homeNgoCount");
  const homeNextEventDate = document.getElementById("homeNextEventDate");
  const homeNextEventText = document.getElementById("homeNextEventText");

  // общий фильтр по городу для НКО / событий / новостей
  function applyCityFilter() {
    if (!citySelect) return;

    const city = citySelect.value;
    const cityElements = document.querySelectorAll("[data-city]");

    cityElements.forEach(el => {
      const elCity = el.dataset.city;
      if (city === "all" || elCity === city || elCity === "all") {
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });
  }

  // обновляем главную страницу под выбранный город
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

    // считаем НКО по выбранному городу
    if (homeNgoCount) {
      const ngoCards = document.querySelectorAll("#ngoList .card");
      const ngosForCity = Array.from(ngoCards).filter(card => {
        const cardCity = card.dataset.city;
        return city === "all" || cardCity === city;
      });
      homeNgoCount.textContent = ngosForCity.length;
    }

    // ближайшее событие по городу
    if (homeNextEventDate && homeNextEventText) {
      const eventCards = document.querySelectorAll("#eventList .card");
      const eventsForCity = Array.from(eventCards).filter(card => {
        const cardCity = card.dataset.city;
        return city === "all" || cardCity === city;
      });

      if (eventsForCity.length > 0) {
        const first = eventsForCity[0];
        const titleEl = first.querySelector(".card-title");
        const dateEl = first.querySelector(".event-date");

        homeNextEventDate.textContent = dateEl ? dateEl.textContent : "";
        homeNextEventText.textContent = titleEl ? titleEl.textContent : "";
      } else {
        homeNextEventDate.textContent = "";
        if (city === "all") {
          homeNextEventText.textContent = "Пока нет запланированных событий.";
        } else {
          homeNextEventText.textContent = "В этом городе пока нет запланированных событий.";
        }
      }
    }
  }

  function handleCityChange() {
    applyCityFilter();
    updateHomeByCity();
  }

  if (citySelect) {
    citySelect.addEventListener("change", handleCityChange);
  }

  // первый запуск
  handleCityChange();

  // ---------------- Поиск и фильтрация НКО ----------------

  const ngoSearch = document.getElementById("ngoSearch");
  const ngoCategory = document.getElementById("ngoCategory");

  function applyNgoFilter() {
    const q = (ngoSearch?.value || "").toLowerCase();
    const cat = ngoCategory?.value || "all";

    document.querySelectorAll("#ngoList .card").forEach(card => {
      const title = card.querySelector(".card-title").textContent.toLowerCase();
      const cardCat = card.dataset.category;
      const matchesText = title.includes(q);
      const matchesCat = cat === "all" || cardCat === cat;
      card.style.display = matchesText && matchesCat ? "" : "none";
    });

    // дополнительно учитываем выбранный город
    applyCityFilter();
  }

  if (ngoSearch) ngoSearch.addEventListener("input", applyNgoFilter);
  if (ngoCategory) ngoCategory.addEventListener("change", applyNgoFilter);

  // ---------------- Фильтр базы знаний ----------------

  const kbCategory = document.getElementById("kbCategory");
  if (kbCategory) {
    kbCategory.addEventListener("change", () => {
      const cat = kbCategory.value;
      document.querySelectorAll("#kbList .card").forEach(card => {
        const cardCat = card.dataset.category;
        card.style.display = cat === "all" || cardCat === cat ? "" : "none";
      });
    });
  }

  // ---------------- Фильтр событий по типу ----------------

  const eventType = document.getElementById("eventType");
  if (eventType) {
    eventType.addEventListener("change", () => {
      const type = eventType.value;
      document.querySelectorAll("#eventList .card").forEach(card => {
        const cardType = card.dataset.type;
        card.style.display = type === "all" || cardType === type ? "" : "none";
      });
      applyCityFilter();
    });
  }

  // ---------------- Фильтр новостей по охвату ----------------

  const newsScope = document.getElementById("newsScope");
  if (newsScope) {
    newsScope.addEventListener("change", () => {
      const scope = newsScope.value;
      const currentCity = citySelect ? citySelect.value : "all";

      document.querySelectorAll("#newsList .card").forEach(card => {
        const cardCity = card.dataset.city;
        let show = true;

        if (scope === "city") {
          show = currentCity === "all"
            ? cardCity !== "all"
            : (cardCity === currentCity);
        } else if (scope === "global") {
          show = cardCity === "all";
        } else {
          show = true;
        }

        card.style.display = show ? "" : "none";
      });
    });
  }

  // ---------------- Избранное через localStorage ----------------

  const favoritesKey = "ddr-favorites";

  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem(favoritesKey)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveFavorites(favs) {
    localStorage.setItem(favoritesKey, JSON.stringify(favs));
  }

  function updateFavoriteUI() {
    const favs = loadFavorites();
    document.querySelectorAll(".favorite-toggle").forEach(el => {
      const type = el.dataset.type;
      const id = el.dataset.id;
      const key = `${type}:${id}`;
      el.textContent = favs[key] ? "★" : "☆";
    });
  }

  document.querySelectorAll(".favorite-toggle").forEach(el => {
    el.addEventListener("click", () => {
      const type = el.dataset.type;
      const id = el.dataset.id;
      const key = `${type}:${id}`;
      const favs = loadFavorites();
      favs[key] = !favs[key];
      saveFavorites(favs);
      updateFavoriteUI();
    });
  });

  updateFavoriteUI();

  // ---------------- Заглушки для кнопок "добавить" ----------------

  const addNgoBtn = document.getElementById("addNgoBtn");
  if (addNgoBtn) {
    addNgoBtn.addEventListener("click", () => {
      alert("Здесь будет форма добавления НКО (доступно администратору/представителю НКО).");
    });
  }

  const addKbBtn = document.getElementById("addKbBtn");
  if (addKbBtn) {
    addKbBtn.addEventListener("click", () => {
      alert("Здесь будет форма добавления материала в базу знаний (для администратора).");
    });
  }

  const addEventBtn = document.getElementById("addEventBtn");
  if (addEventBtn) {
    addEventBtn.addEventListener("click", () => {
      alert("Здесь будет форма добавления события с отправкой на модерацию.");
    });
  }

  const addNewsBtn = document.getElementById("addNewsBtn");
  if (addNewsBtn) {
    addNewsBtn.addEventListener("click", () => {
      alert("Здесь будет форма добавления новости (для администратора).");
    });
  }
}); // конец DOMContentLoaded

// ---------------- Прелоадер: скрыть после полной загрузки ----------------

window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    // задержка перед скрытием прелоадера (в миллисекундах)
    setTimeout(() => {
      preloader.classList.add("preloader-hidden");
    }, 1000); // 1000 = 1 сек; можно поставить 1500 или 2000
  }
});

