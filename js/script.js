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
    });
  });

  // Фильтрация по городу
  const citySelect = document.getElementById("citySelect");

  function applyCityFilter() {
    const currentCity = citySelect.value;
    const cityElements = document.querySelectorAll("[data-city]");
    cityElements.forEach(el => {
      const elCity = el.dataset.city;
      if (currentCity === "all" || elCity === currentCity || elCity === "all") {
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });
  }

  citySelect.addEventListener("change", applyCityFilter);
  applyCityFilter();

  // Поиск и фильтрация НКО
  const ngoSearch = document.getElementById("ngoSearch");
  const ngoCategory = document.getElementById("ngoCategory");

  function applyNgoFilter() {
    const q = ngoSearch.value.toLowerCase();
    const cat = ngoCategory.value;
    document.querySelectorAll("#ngoList .card").forEach(card => {
      const title = card.querySelector(".card-title").textContent.toLowerCase();
      const cardCat = card.dataset.category;
      const matchesText = title.includes(q);
      const matchesCat = cat === "all" || cardCat === cat;
      card.style.display = matchesText && matchesCat ? "" : "none";
    });
    applyCityFilter(); // ещё раз применим ограничение по городу
  }

  ngoSearch.addEventListener("input", applyNgoFilter);
  ngoCategory.addEventListener("change", applyNgoFilter);

  // Фильтр базы знаний
  const kbCategory = document.getElementById("kbCategory");
  kbCategory.addEventListener("change", () => {
    const cat = kbCategory.value;
    document.querySelectorAll("#kbList .card").forEach(card => {
      const cardCat = card.dataset.category;
      card.style.display = cat === "all" || cardCat === cat ? "" : "none";
    });
  });

  // Фильтр событий по типу
  const eventType = document.getElementById("eventType");
  eventType.addEventListener("change", () => {
    const type = eventType.value;
    document.querySelectorAll("#eventList .card").forEach(card => {
      const cardType = card.dataset.type;
      card.style.display = type === "all" || cardType === type ? "" : "none";
    });
    applyCityFilter();
  });

  // Фильтр новостей по охвату
  const newsScope = document.getElementById("newsScope");
  newsScope.addEventListener("change", () => {
    const scope = newsScope.value;
    const currentCity = citySelect.value;
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

  // Избранное через localStorage (очень простая реализация)
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

  // Кнопки "добавить" — пока просто алерты-заглушки
  document.getElementById("addNgoBtn").addEventListener("click", () => {
    alert("Здесь будет форма добавления НКО (доступно администратору/представителю НКО).");
  });
  document.getElementById("addKbBtn").addEventListener("click", () => {
    alert("Здесь будет форма добавления материала в базу знаний (для администратора).");
  });
  document.getElementById("addEventBtn").addEventListener("click", () => {
    alert("Здесь будет форма добавления события с отправкой на модерацию.");
  });
  document.getElementById("addNewsBtn").addEventListener("click", () => {
    alert("Здесь будет форма добавления новости (для администратора).");
  

const citySelect = document.getElementById("citySelect");

  const currentCityLabel = document.getElementById("currentCityLabel");
  const homeCityTitle = document.getElementById("homeCityTitle");
  const homeNgoCount = document.getElementById("homeNgoCount");
  const homeNextEventDate = document.getElementById("homeNextEventDate");
  const homeNextEventText = document.getElementById("homeNextEventText");

  function applyCityFilter() {
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

  function updateHomeByCity() {
    const city = citySelect.value;

    if (city === "all") {
      currentCityLabel.textContent = "Все города";
      homeCityTitle.textContent = "Все города";
    } else {
      currentCityLabel.textContent = city;
      homeCityTitle.textContent = city;
    }

    const ngoCards = document.querySelectorAll("#ngoList .card");
    const ngosForCity = Array.from(ngoCards).filter(card => {
      const cardCity = card.dataset.city;
      return city === "all" || cardCity === city;
    });
    homeNgoCount.textContent = ngosForCity.length;

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

  function handleCityChange() {
    applyCityFilter();
    updateHomeByCity();
  }
  
  if (citySelect) {
    citySelect.addEventListener("change", handleCityChange);
    applyCityFilter();
    updateHomeByCity();
  }



});