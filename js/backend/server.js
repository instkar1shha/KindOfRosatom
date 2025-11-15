const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  NGO: "ngo",
  VOLUNTEER: "volunteer",
  GUEST: "guest",
};

const PORT = 3000;

// ===== СТАТИКА ДЛЯ ФРОНТА =====
// __dirname = KINDOFROSATOM/js/backend
// publicDir = KINDOFROSATOM
const publicDir = path.join(__dirname, "..", "..");

// Раздаём index.html, js/, styles/ и т.д.
app.use(express.static(publicDir));

// Парсинг JSON + CORS
app.use(cors());
app.use(express.json());

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ===== ВРЕМЕННАЯ "АВТОРИЗАЦИЯ" ПО РОЛЯМ =====

function getRoleFromHeader(req) {
  const header = (req.headers["x-demo-role"] || "").toString().toLowerCase();
  switch (header) {
    case ROLES.ADMIN:
      return ROLES.ADMIN;
    case ROLES.MODERATOR:
      return ROLES.MODERATOR;
    case ROLES.NGO:
      return ROLES.NGO;
    case ROLES.VOLUNTEER:
      return ROLES.VOLUNTEER;
    default:
      return ROLES.GUEST;
  }
}

// демо-пользователь на каждый запрос
app.use((req, res, next) => {
  const role = getRoleFromHeader(req);
  // В реальной жизни здесь будет декодирование токена, поиск пользователя в БД и т.п.
  req.user = {
    id: 1,
    name: "Demo user",
    role,
  };
  next();
});

// Проверка прав
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role || ROLES.GUEST;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Недостаточно прав" });
    }
    next();
  };
}

// ===== "БД" в памяти =====

// НКО
let ngos = [
  {
    id: 1,
    name: "«Чистый Берег»",
    city: "Сосновый Бор",
    category: "eco",
    description:
      "Организация проводит регулярные субботники, акции по раздельному сбору отходов и экологическое просвещение школьников. Волонтёры помогают в организации мероприятий, регистрации участников и информационной поддержке.",
    address: "ул. Центральная, 10",
    site: "https://clean-coast.example",
  },
  {
    id: 2,
    name: "«Тепло рядом»",
    city: "Обнинск",
    category: "social",
    description:
      "Помощь пожилым людям и семьям с детьми: доставка продуктов, сопровождение в поликлинику, мастер-классы.",
    address: null,
    site: null,
  },
];

// База знаний
let knowledgeItems = [
  {
    id: 1,
    category: "training",
    kind: "video",
    title: "Введение в корпоративное волонтёрство",
    description: "Запись вебинара для координаторов и активных волонтёров.",
    link: "https://example.com/webinar",
  },
  {
    id: 2,
    category: "management",
    kind: "pdf",
    title: "Памятка по организации городских мероприятий",
    description:
      "Чек-лист шагов для безопасного и эффективного проведения акций.",
    link: "https://example.com/checklist.pdf",
  },
];

// События
let events = [
  {
    id: 1,
    city: "Сосновый Бор",
    type: "eco",
    datetime: "2025-11-18T10:00:00+03:00",
    title: "Эко-субботник на набережной",
    description:
      "Уборка береговой линии и мастер-класс по раздельному сбору отходов.",
    organizer: "«Чистый Берег»",
  },
  {
    id: 2,
    city: "Обнинск",
    type: "social",
    datetime: "2025-11-25T15:00:00+03:00",
    title: "Волонтёрский визит в дом ветеранов",
    description: "Творческие мастер-классы и концерт для жителей дома ветеранов.",
    organizer: "«Тепло рядом»",
  },
];

// Новости
let news = [
  {
    id: 1,
    city: "all",
    datetime: "2025-11-15T12:00:00+03:00",
    title: "Запуск портала «Добрые дела Росатома»",
    text:
      "Открылся единый портал для НКО, волонтёров и жителей малых городов присутствия Росатома.",
  },
  {
    id: 2,
    city: "Обнинск",
    datetime: "2025-11-10T10:00:00+03:00",
    title: "Обнинские волонтёры выиграли грант",
    text:
      "Проект поддержки одиноких пожилых людей получил финансирование в конкурсе социальных инициатив.",
  },
];

// ===== Вспомогательные функции =====

function getNextId(collection) {
  return collection.length === 0
    ? 1
    : Math.max(...collection.map((item) => item.id)) + 1;
}

// ===== НКО =====

// Просмотр — всем
app.get("/api/ngos", (req, res) => {
  const { city, category, q } = req.query;
  let result = [...ngos];

  if (city && city !== "all") {
    result = result.filter((n) => n.city === city);
  }

  if (category && category !== "all") {
    result = result.filter((n) => n.category === category);
  }

  if (q) {
    const lower = q.toLowerCase();
    result = result.filter((n) => n.name.toLowerCase().includes(lower));
  }

  res.json(result);
});

app.get("/api/ngos/:id", (req, res) => {
  const id = Number(req.params.id);
  const ngo = ngos.find((n) => n.id === id);
  if (!ngo) return res.status(404).json({ error: "NGO not found" });
  res.json(ngo);
});

// Создание НКО — по ТЗ: админ/модератор (заявки НКО можем позже вынести отдельно)
app.post(
  "/api/ngos",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const { name, city, category, description, address, site } = req.body;
    if (!name || !city) {
      return res.status(400).json({ error: "name и city обязательны" });
    }
    const newNgo = {
      id: getNextId(ngos),
      name,
      city,
      category: category || "social",
      description: description || "",
      address: address || null,
      site: site || null,
    };
    ngos.push(newNgo);
    res.status(201).json(newNgo);
  }
);

// Редактирование НКО — админ/модератор (в будущем можно добавить проверку для роли НКО)
app.put(
  "/api/ngos/:id",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const id = Number(req.params.id);
    const ngo = ngos.find((n) => n.id === id);
    if (!ngo) return res.status(404).json({ error: "NGO not found" });

    const { name, city, category, description, address, site } = req.body;

    if (name !== undefined) ngo.name = name;
    if (city !== undefined) ngo.city = city;
    if (category !== undefined) ngo.category = category;
    if (description !== undefined) ngo.description = description;
    if (address !== undefined) ngo.address = address;
    if (site !== undefined) ngo.site = site;

    res.json(ngo);
  }
);

// Удаление НКО — только админ
app.delete("/api/ngos/:id", requireRole(ROLES.ADMIN), (req, res) => {
  const id = Number(req.params.id);
  const initialLen = ngos.length;
  ngos = ngos.filter((n) => n.id !== id);
  if (ngos.length === initialLen) {
    return res.status(404).json({ error: "NGO not found" });
  }
  res.status(204).send();
});

// ===== БАЗА ЗНАНИЙ =====

// Просмотр — всем
app.get("/api/knowledge", (req, res) => {
  const { category } = req.query;
  let result = [...knowledgeItems];
  if (category && category !== "all") {
    result = result.filter((k) => k.category === category);
  }
  res.json(result);
});

app.get("/api/knowledge/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = knowledgeItems.find((k) => k.id === id);
  if (!item) return res.status(404).json({ error: "Knowledge item not found" });
  res.json(item);
});

// Добавление/редактирование/удаление — админ/модератор
app.post(
  "/api/knowledge",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const { category, kind, title, description, link } = req.body;
    if (!title) {
      return res.status(400).json({ error: "title обязателен" });
    }
    const item = {
      id: getNextId(knowledgeItems),
      category: category || "training",
      kind: kind || "other",
      title,
      description: description || "",
      link: link || null,
    };
    knowledgeItems.push(item);
    res.status(201).json(item);
  }
);

app.put(
  "/api/knowledge/:id",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const id = Number(req.params.id);
    const item = knowledgeItems.find((k) => k.id === id);
    if (!item)
      return res.status(404).json({ error: "Knowledge item not found" });

    const { category, kind, title, description, link } = req.body;

    if (category !== undefined) item.category = category;
    if (kind !== undefined) item.kind = kind;
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (link !== undefined) item.link = link;

    res.json(item);
  }
);

app.delete(
  "/api/knowledge/:id",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const id = Number(req.params.id);
    const initialLen = knowledgeItems.length;
    knowledgeItems = knowledgeItems.filter((k) => k.id !== id);
    if (knowledgeItems.length === initialLen) {
      return res.status(404).json({ error: "Knowledge item not found" });
    }
    res.status(204).send();
  }
);

// ===== СОБЫТИЯ =====

// Просмотр — всем
app.get("/api/events", (req, res) => {
  const { city, type, limit } = req.query;
  let result = [...events];

  if (city && city !== "all") {
    result = result.filter((e) => e.city === city);
  }

  if (type && type !== "all") {
    result = result.filter((e) => e.type === type);
  }

  // сортировка по дате
  result.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  const lim = limit ? Number(limit) : null;
  if (lim && lim > 0) {
    result = result.slice(0, lim);
  }

  res.json(result);
});

app.get("/api/events/:id", (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((e) => e.id === id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

// Создание события — админ, модератор, НКО (по ТЗ НКО могут создавать свои события)
app.post(
  "/api/events",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR, ROLES.NGO),
  (req, res) => {
    const { city, type, datetime, title, description, organizer } = req.body;
    if (!city || !title || !datetime) {
      return res
        .status(400)
        .json({ error: "city, title, datetime обязательны" });
    }
    const event = {
      id: getNextId(events),
      city,
      type: type || "social",
      datetime,
      title,
      description: description || "",
      organizer: organizer || "",
    };
    events.push(event);
    res.status(201).json(event);
  }
);

// Редактирование/удаление события — админ, модератор (упрощённо)
app.put(
  "/api/events/:id",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const id = Number(req.params.id);
    const event = events.find((e) => e.id === id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const { city, type, datetime, title, description, organizer } = req.body;

    if (city !== undefined) event.city = city;
    if (type !== undefined) event.type = type;
    if (datetime !== undefined) event.datetime = datetime;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (organizer !== undefined) event.organizer = organizer;

    res.json(event);
  }
);

app.delete(
  "/api/events/:id",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const id = Number(req.params.id);
    const initialLen = events.length;
    events = events.filter((e) => e.id !== id);
    if (events.length === initialLen) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(204).send();
  }
);

// ===== НОВОСТИ =====

// Просмотр — всем
app.get("/api/news", (req, res) => {
  const { city, scope } = req.query;
  let result = [...news];

  if (city && city !== "all") {
    result = result.filter((n) => n.city === city || n.city === "all");
  }

  if (scope === "city") {
    result = result.filter((n) => n.city !== "all");
  } else if (scope === "global") {
    result = result.filter((n) => n.city === "all");
  }

  // новые новости сверху
  result.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  res.json(result);
});

app.get("/api/news/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = news.find((n) => n.id === id);
  if (!item) return res.status(404).json({ error: "News not found" });
  res.json(item);
});

// Создание/редактирование/удаление — админ/модератор
app.post(
  "/api/news",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const { city, title, text, datetime } = req.body;
    if (!title) {
      return res.status(400).json({ error: "title обязателен" });
    }
    const item = {
      id: getNextId(news),
      city: city || "all",
      title,
      text: text || "",
      datetime: datetime || new Date().toISOString(),
    };
    news.push(item);
    res.status(201).json(item);
  }
);

app.put(
  "/api/news/:id",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const id = Number(req.params.id);
    const item = news.find((n) => n.id === id);
    if (!item) return res.status(404).json({ error: "News not found" });

    const { city, title, text, datetime } = req.body;

    if (city !== undefined) item.city = city;
    if (title !== undefined) item.title = title;
    if (text !== undefined) item.text = text;
    if (datetime !== undefined) item.datetime = datetime;

    res.json(item);
  }
);

app.delete(
  "/api/news/:id",
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  (req, res) => {
    const id = Number(req.params.id);
    const initialLen = news.length;
    news = news.filter((n) => n.id !== id);
    if (news.length === initialLen) {
      return res.status(404).json({ error: "News not found" });
    }
    res.status(204).send();
  }
);

// ===== HEALTHCHECK =====

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", role: req.user.role });
});

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
