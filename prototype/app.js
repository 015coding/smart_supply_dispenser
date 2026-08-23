/*
  PROTOTYPE — พร้อมปัน
  One light-mode UI concept. In-memory demo state only; no database, auth, API,
  persistence, or real map tiles. The visual flow mirrors PROJECT-SPEC.md.
*/
(function () {
  "use strict";

  var now = new Date();
  var iso = function (daysAgo, hoursAgo) {
    var date = new Date(now.getTime() - (((daysAgo * 24) + hoursAgo) * 60 * 60 * 1000));
    return date.toISOString();
  };

  var state = {
    adminAuth: false,
    sidebarOpen: false,
    publicQuery: "",
    publicStatus: "all",
    publicProvince: "all",
    publicDistrict: "all",
    modal: null,
    toastTimer: null,
    csvPreview: false,
    device: {
      code: "DSP-0001",
      status: "online",
      lastSeen: iso(0, 0),
      firmware: "1.0.0",
      client: "1.0.0",
      planVersion: 3,
      appliedPlanVersion: 3,
      eligibilityVersion: 8,
      appliedEligibilityVersion: 8,
      stockRevision: 41,
      appliedStockRevision: 41,
      reports: 18
    },
    machines: [
      {
        code: "DSP-0001",
        name: "ศูนย์พักพิงคลองสอง",
        province: "ปทุมธานี",
        district: "คลองหลวง",
        address: "ลานอเนกประสงค์หน้าศูนย์พักพิงคลองสอง",
        lat: 14.0692,
        lng: 100.6475,
        contact: "02 000 0001",
        notice: "เปิดรับผู้มีสิทธิ์ตลอด 24 ชั่วโมง",
        lifecycle: "published",
        serviceMode: "normal",
        lastUpdated: iso(0, 1),
        deviceStatus: "online",
        pendingSync: false,
        channels: [
          { number: 1, name: "น้ำดื่ม", unit: "ขวด", count: 24, capacity: 40, threshold: 10, enabled: true },
          { number: 2, name: "อาหารพร้อมทาน", unit: "กล่อง", count: 18, capacity: 30, threshold: 8, enabled: true },
          { number: 3, name: "ชุดปฐมพยาบาล", unit: "ชุด", count: 20, capacity: 30, threshold: 5, enabled: true }
        ]
      },
      {
        code: "DSP-0002",
        name: "โรงเรียนวัดริมคลอง",
        province: "ปทุมธานี",
        district: "ธัญบุรี",
        address: "อาคารอเนกประสงค์ โรงเรียนวัดริมคลอง",
        lat: 13.9977,
        lng: 100.7344,
        contact: "02 000 0002",
        notice: "รอเติมน้ำดื่มและอาหารพร้อมทาน",
        lifecycle: "published",
        serviceMode: "normal",
        lastUpdated: iso(0, 3),
        deviceStatus: "offline",
        pendingSync: true,
        channels: [
          { number: 1, name: "น้ำดื่ม", unit: "ขวด", count: 0, capacity: 40, threshold: 10, enabled: true },
          { number: 2, name: "อาหารพร้อมทาน", unit: "กล่อง", count: 12, capacity: 30, threshold: 8, enabled: true },
          { number: 3, name: "ชุดปฐมพยาบาล", unit: "ชุด", count: 10, capacity: 30, threshold: 5, enabled: true }
        ]
      },
      {
        code: "DSP-0003",
        name: "ชุมชนตลาดเก่า",
        province: "พระนครศรีอยุธยา",
        district: "เสนา",
        address: "ศาลาชุมชนตลาดเก่า ถนนริมแม่น้ำ",
        lat: 14.3278,
        lng: 100.3959,
        contact: "035 000 003",
        notice: "กำลังตรวจสอบมอเตอร์ช่องที่ 2",
        lifecycle: "published",
        serviceMode: "maintenance",
        lastUpdated: iso(0, 5),
        deviceStatus: "offline",
        pendingSync: false,
        channels: [
          { number: 1, name: "น้ำดื่ม", unit: "ขวด", count: 30, capacity: 40, threshold: 10, enabled: true },
          { number: 2, name: "อาหารพร้อมทาน", unit: "กล่อง", count: 24, capacity: 30, threshold: 8, enabled: true },
          { number: 3, name: "ชุดปฐมพยาบาล", unit: "ชุด", count: 22, capacity: 30, threshold: 5, enabled: true }
        ]
      },
      {
        code: "DSP-0004",
        name: "วัดทุ่งเสลี่ยม",
        province: "สุพรรณบุรี",
        district: "เมืองสุพรรณบุรี",
        address: "ศาลาวัดทุ่งเสลี่ยม ใกล้ประตูทิศตะวันออก",
        lat: 14.4742,
        lng: 100.1171,
        contact: "035 000 004",
        notice: "กรุณานำบัตรประชาชนตัวจริงมาด้วย",
        lifecycle: "published",
        serviceMode: "normal",
        lastUpdated: iso(0, 2),
        deviceStatus: "online",
        pendingSync: false,
        channels: [
          { number: 1, name: "น้ำดื่ม", unit: "ขวด", count: 7, capacity: 40, threshold: 10, enabled: true },
          { number: 2, name: "อาหารพร้อมทาน", unit: "กล่อง", count: 9, capacity: 30, threshold: 8, enabled: true },
          { number: 3, name: "ชุดปฐมพยาบาล", unit: "ชุด", count: 8, capacity: 30, threshold: 5, enabled: true }
        ]
      },
      {
        code: "DSP-0005",
        name: "อาคารอาสาริมน้ำ",
        province: "นนทบุรี",
        district: "ปากเกร็ด",
        address: "จุดพักของอาคารอาสาริมน้ำ ชั้น 1",
        lat: 13.9139,
        lng: 100.4988,
        contact: "02 000 0005",
        notice: "ปิดชั่วคราวเพื่อเติมสินค้า",
        lifecycle: "published",
        serviceMode: "paused",
        lastUpdated: iso(1, 1),
        deviceStatus: "offline",
        pendingSync: true,
        channels: [
          { number: 1, name: "น้ำดื่ม", unit: "ขวด", count: 15, capacity: 40, threshold: 10, enabled: true },
          { number: 2, name: "อาหารพร้อมทาน", unit: "กล่อง", count: 14, capacity: 30, threshold: 8, enabled: true },
          { number: 3, name: "ชุดปฐมพยาบาล", unit: "ชุด", count: 12, capacity: 30, threshold: 5, enabled: true }
        ]
      },
      {
        code: "DSP-0006",
        name: "จุดแจกชุมชนบางไทร",
        province: "พระนครศรีอยุธยา",
        district: "บางไทร",
        address: "ลานชุมชนบางไทร",
        lat: 14.2157,
        lng: 100.4874,
        contact: "",
        notice: "",
        lifecycle: "draft",
        serviceMode: "normal",
        lastUpdated: iso(2, 4),
        deviceStatus: "offline",
        pendingSync: false,
        channels: [
          { number: 1, name: "", unit: "ชิ้น", count: 0, capacity: 0, threshold: 0, enabled: true },
          { number: 2, name: "", unit: "ชิ้น", count: 0, capacity: 0, threshold: 0, enabled: true },
          { number: 3, name: "", unit: "ชิ้น", count: 0, capacity: 0, threshold: 0, enabled: true }
        ]
      }
    ],
    recipients: [
      { id: "r1", citizenId: "1103700•••••01", name: "คุณสายฝน ใจดี", active: true, updated: iso(1, 2) },
      { id: "r2", citizenId: "1103700•••••02", name: "คุณสมชาย พูนทรัพย์", active: true, updated: iso(1, 4) },
      { id: "r3", citizenId: "1103700•••••03", name: "คุณอารีย์ รักษ์น้ำ", active: true, updated: iso(2, 1) },
      { id: "r4", citizenId: "1103700•••••04", name: "คุณนที คลองสวย", active: false, updated: iso(3, 5) }
    ],
    alerts: [
      { id: "a1", type: "danger", title: "ศูนย์พักพิงคลองสอง", text: "อาหารพร้อมทานเหลือ 8 กล่อง — ต่ำกว่าจุดแจ้งเตือน", ack: false },
      { id: "a2", type: "warning", title: "โรงเรียนวัดริมคลอง", text: "น้ำดื่มหมด และเครื่องยังไม่ได้ sync ยอดล่าสุด", ack: false },
      { id: "a3", type: "warning", title: "วัดทุ่งเสลี่ยม", text: "สถานะซ่อมบำรุงยังไม่ได้รับทราบ", ack: true }
    ],
    distributions: [
      { date: "18 ส.ค.", count: 5 },
      { date: "19 ส.ค.", count: 8 },
      { date: "20 ส.ค.", count: 12 },
      { date: "21 ส.ค.", count: 9 },
      { date: "22 ส.ค.", count: 16 },
      { date: "23 ส.ค.", count: 11 },
      { date: "วันนี้", count: 7 }
    ],
    activity: [
      { time: iso(0, 1), action: "ปรับยอดสต็อก", entity: "DSP-0001 · อาหารพร้อมทาน", detail: "เพิ่ม 10 กล่อง", actor: "admin" },
      { time: iso(0, 3), action: "รับทราบ alert", entity: "DSP-0003", detail: "สถานะซ่อมบำรุง", actor: "admin" },
      { time: iso(1, 2), action: "นำเข้ารายชื่อ", entity: "Eligibility import", detail: "ผ่าน 18 แถว · ไม่ผ่าน 2 แถว", actor: "admin" },
      { time: iso(2, 1), action: "เผยแพร่เครื่อง", entity: "DSP-0004", detail: "วัดทุ่งเสลี่ยม", actor: "admin" }
    ]
  };

  var root = document.getElementById("app");
  var toast = document.getElementById("toast");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name, size) {
    var paths = {
      search: "<circle cx=\"11\" cy=\"11\" r=\"7\"></circle><path d=\"m20 20-4-4\"></path>",
      map: "<path d=\"M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z\"></path><path d=\"M9 3v15M15 6v15\"></path>",
      pin: "<path d=\"M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z\"></path><circle cx=\"12\" cy=\"10\" r=\"2.5\"></circle>",
      arrow: "<path d=\"M5 12h14M13 6l6 6-6 6\"></path>",
      back: "<path d=\"m15 18-6-6 6-6\"></path>",
      home: "<path d=\"m3 10 9-7 9 7v10H3V10Z\"></path><path d=\"M9 20v-6h6v6\"></path>",
      dashboard: "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"></rect>",
      machine: "<rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2\"></rect><path d=\"M9 6h6M9 18h6\"></path><circle cx=\"12\" cy=\"12\" r=\"1\"></circle>",
      people: "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"></path><circle cx=\"9\" cy=\"7\" r=\"4\"></circle><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"></path>",
      history: "<path d=\"M3 12a9 9 0 1 0 3-6.7\"></path><path d=\"M3 4v6h6M12 7v5l3 2\"></path>",
      logout: "<path d=\"M10 17l5-5-5-5M15 12H3\"></path><path d=\"M21 19V5a2 2 0 0 0-2-2h-6\"></path>",
      plus: "<path d=\"M12 5v14M5 12h14\"></path>",
      edit: "<path d=\"M12 20h9\"></path><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z\"></path>",
      check: "<path d=\"m5 12 4 4L19 6\"></path>",
      warning: "<path d=\"M10.3 3.6 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z\"></path><path d=\"M12 9v4M12 17h.01\"></path>",
      settings: "<path d=\"M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z\"></path><path d=\"m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 11H1.5a2 2 0 1 1 0-4h.2a2 2 0 0 0 1.4-3.4L3 3.5a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.3 1.4V1.2a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.9 9h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.5 2Z\"></path>",
      upload: "<path d=\"M12 16V4M7 9l5-5 5 5\"></path><path d=\"M5 20h14\"></path>",
      external: "<path d=\"M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5\"></path>",
      copy: "<rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path>",
      menu: "<path d=\"M4 6h16M4 12h16M4 18h16\"></path>",
      close: "<path d=\"m6 6 12 12M18 6 6 18\"></path>",
      refresh: "<path d=\"M20 11a8.1 8.1 0 0 0-14.6-4.8L3 9M3 4v5h5M4 13a8.1 8.1 0 0 0 14.6 4.8L21 15M21 20v-5h-5\"></path>",
      lock: "<rect x=\"4\" y=\"10\" width=\"16\" height=\"11\" rx=\"2\"></rect><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"></path>",
      eye: "<path d=\"M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z\"></path><circle cx=\"12\" cy=\"12\" r=\"2\"></circle>",
      dots: "<circle cx=\"5\" cy=\"12\" r=\"1\"></circle><circle cx=\"12\" cy=\"12\" r=\"1\"></circle><circle cx=\"19\" cy=\"12\" r=\"1\"></circle>",
      calendar: "<rect x=\"3\" y=\"4\" width=\"18\" height=\"17\" rx=\"2\"></rect><path d=\"M16 2v4M8 2v4M3 10h18\"></path>",
      clock: "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 7v5l3 2\"></path>",
      file: "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z\"></path><path d=\"M14 2v6h6M8 13h8M8 17h6\"></path>",
      info: "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 11v5M12 8h.01\"></path>"
    };
    return "<svg width=\"" + (size || 18) + "\" height=\"" + (size || 18) + "\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + (paths[name] || paths.info) + "</svg>";
  }

  function dateThai(value) {
    return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) + " น.";
  }

  function timeAgo(value) {
    var diff = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (diff < 60) return diff + " นาทีที่แล้ว";
    if (diff < 1440) return Math.round(diff / 60) + " ชม.ที่แล้ว";
    return Math.round(diff / 1440) + " วันที่แล้ว";
  }

  function getRoute() {
    var raw = (window.location.hash || "#home").slice(1) || "home";
    var parts = raw.split("/");
    return { name: parts[0], id: parts[1] || null };
  }

  function go(route) {
    window.location.hash = route;
    state.sidebarOpen = false;
  }

  function toastMessage(message, type) {
    toast.textContent = message;
    toast.className = "toast show " + (type || "success");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      toast.className = "toast";
    }, 2600);
  }

  function findMachine(code) {
    return state.machines.find(function (machine) { return machine.code === code; });
  }

  function bundleCount(machine) {
    var active = machine.channels.filter(function (channel) { return channel.enabled && channel.name; });
    if (!active.length) return 0;
    return Math.min.apply(null, active.map(function (channel) { return Math.max(0, Number(channel.count) || 0); }));
  }

  function statusMeta(machine) {
    if (machine.lifecycle === "draft") return { key: "draft", label: "ฉบับร่าง" };
    if (machine.serviceMode === "maintenance") return { key: "maintenance", label: "ปิดซ่อมบำรุง" };
    if (machine.serviceMode === "paused") return { key: "paused", label: "ปิดชั่วคราว" };
    if (bundleCount(machine) <= 0) return { key: "out", label: "ของหมด" };
    return { key: "available", label: "พร้อมแจก" };
  }

  function publishedMachines() {
    return state.machines.filter(function (machine) { return machine.lifecycle === "published"; });
  }

  function filteredMachines() {
    var query = state.publicQuery.trim().toLowerCase();
    return publishedMachines().filter(function (machine) {
      var status = statusMeta(machine);
      var matchesQuery = !query || [machine.name, machine.code, machine.address, machine.province, machine.district].join(" ").toLowerCase().indexOf(query) !== -1;
      var matchesStatus = state.publicStatus === "all" || state.publicStatus === status.key;
      var matchesProvince = state.publicProvince === "all" || state.publicProvince === machine.province;
      var matchesDistrict = state.publicDistrict === "all" || state.publicDistrict === machine.district;
      return matchesQuery && matchesStatus && matchesProvince && matchesDistrict;
    }).sort(function (a, b) {
      return Number(statusMeta(b).key === "available") - Number(statusMeta(a).key === "available");
    });
  }

  function renderPublicHeader() {
    return [
      "<header class=\"public-header\">",
      "  <div class=\"container public-header-inner\">",
      "    <button class=\"brand btn-ghost\" data-route=\"home\" aria-label=\"กลับหน้าแรก\">",
      "      <span class=\"brand-mark\">" + icon("machine", 18) + "</span>",
      "      <span class=\"brand-copy\"><span class=\"brand-name\">พร้อมปัน</span><span class=\"brand-tagline\">ค้นหาเครื่องแจกสิ่งของช่วยเหลือ</span></span>",
      "    </button>",
      "    <div class=\"header-links\">",
      "      <button class=\"btn-ghost\" data-route=\"admin-login\">" + icon("lock", 15) + " สำหรับผู้ดูแล</button>",
      "    </div>",
      "  </div>",
      "</header>"
    ].join("");
  }

  function renderBottomNav(active) {
    return [
      "<nav class=\"bottom-nav\" aria-label=\"เมนูหลัก\">",
      "  <button class=\"nav-item " + (active === "home" ? "active" : "") + "\" data-route=\"home\">" + icon("home", 20) + "<span>หน้าแรก</span></button>",
      "  <button class=\"nav-item " + (active === "home" ? "active" : "") + "\" data-action=\"focus-search\">" + icon("search", 20) + "<span>ค้นหา</span></button>",
      "  <button class=\"nav-item\" data-route=\"admin-login\">" + icon("lock", 20) + "<span>ผู้ดูแล</span></button>",
      "</nav>"
    ].join("");
  }

  function renderStatus(status) {
    return "<span class=\"status " + status.key + "\">" + esc(status.label) + "</span>";
  }

  function renderMachineCard(machine) {
    var status = statusMeta(machine);
    return [
      "<article class=\"machine-card\" data-route=\"detail/" + esc(machine.code) + "\" role=\"button\" tabindex=\"0\" aria-label=\"ดูรายละเอียด " + esc(machine.name) + "\">",
      "  <div class=\"machine-card-top\">",
      "    <div class=\"machine-thumb\" aria-hidden=\"true\"></div>",
      "    <div class=\"machine-meta\">",
      "      " + renderStatus(status),
      "      <h3>" + esc(machine.name) + "</h3>",
      "      <span class=\"machine-code\">" + esc(machine.code) + "</span>",
      "    </div>",
      "  </div>",
      "  <div class=\"machine-card-body\">",
      "    <div class=\"machine-location\">" + icon("pin", 14) + "<span>" + esc(machine.province) + " · " + esc(machine.district) + "<br>" + esc(machine.address) + "</span></div>",
      "    <div class=\"machine-card-divider\"></div>",
      "    <div class=\"stock-highlight\"><strong>" + bundleCount(machine) + " ชุด</strong><span>แจกได้อีก</span></div>",
      "    <div class=\"card-foot\"><span class=\"last-updated\">" + icon("clock", 12) + " อัปเดต " + timeAgo(machine.lastUpdated) + "</span><span class=\"text-link\">ดูรายละเอียด " + icon("arrow", 14) + "</span></div>",
      "  </div>",
      "</article>"
    ].join("");
  }

  function renderHome() {
    var machines = filteredMachines();
    var publicList = publishedMachines();
    var available = publicList.filter(function (machine) { return statusMeta(machine).key === "available"; }).length;
    var totalBundles = publicList.reduce(function (sum, machine) { return sum + bundleCount(machine); }, 0);
    var provinces = Array.from(new Set(publicList.map(function (machine) { return machine.province; }))).sort();
    var districts = Array.from(new Set(publicList.map(function (machine) { return machine.district; }))).sort();
    return [
      renderPublicHeader(),
      "<main class=\"page-main\"><div class=\"container\">",
      "  <section class=\"hero\">",
      "    <div class=\"eyebrow\">ข้อมูลสำหรับผู้ประสบภัย</div>",
      "    <div class=\"hero-line\"><div><h1>หาจุดแจกของที่<br><span style=\"color:var(--brand)\">พร้อมช่วยคุณวันนี้</span></h1><p>ดูสถานะเครื่อง จำนวนชุดที่ยังแจกได้ และตำแหน่งที่ตั้งก่อนออกเดินทาง</p></div></div>",
      "  </section>",
      "  <section class=\"search-panel\" aria-label=\"ค้นหาเครื่อง\">",
      "    <form class=\"search-box\" data-form=\"public-search\"><label class=\"sr-only\" for=\"public-search\">ค้นหาชื่อเครื่องหรือที่อยู่</label>" + icon("search", 19) + "<input id=\"public-search\" name=\"query\" value=\"" + esc(state.publicQuery) + "\" placeholder=\"ค้นหาชื่อเครื่อง ที่อยู่ หรือรหัสเครื่อง\" autocomplete=\"off\"><button class=\"btn btn-primary btn-sm\" type=\"submit\">ค้นหา</button></form>",
      "    <div class=\"filter-row\"><label class=\"sr-only\" for=\"province-filter\">จังหวัด</label><select id=\"province-filter\" data-public-filter=\"province\"><option value=\"all\">ทุกจังหวัด</option>" + provinces.map(function (province) { return "<option value=\"" + esc(province) + "\" " + (state.publicProvince === province ? "selected" : "") + ">" + esc(province) + "</option>"; }).join("") + "</select><label class=\"sr-only\" for=\"district-filter\">อำเภอ</label><select id=\"district-filter\" data-public-filter=\"district\"><option value=\"all\">ทุกอำเภอ</option>" + districts.map(function (district) { return "<option value=\"" + esc(district) + "\" " + (state.publicDistrict === district ? "selected" : "") + ">" + esc(district) + "</option>"; }).join("") + "</select><label class=\"sr-only\" for=\"status-filter\">สถานะ</label><select id=\"status-filter\" data-public-filter=\"status\"><option value=\"all\">ทุกสถานะ</option><option value=\"available\" " + (state.publicStatus === "available" ? "selected" : "") + ">พร้อมแจก</option><option value=\"out\" " + (state.publicStatus === "out" ? "selected" : "") + ">ของหมด</option><option value=\"paused\" " + (state.publicStatus === "paused" ? "selected" : "") + ">ปิดชั่วคราว</option><option value=\"maintenance\" " + (state.publicStatus === "maintenance" ? "selected" : "") + ">ปิดซ่อมบำรุง</option></select><button class=\"btn btn-outline\" type=\"button\" data-action=\"reset-filters\">" + icon("refresh", 15) + " ล้างตัวกรอง</button></div>",
      "  </section>",
      "  <section class=\"summary-strip\" aria-label=\"สรุปสถานะ\"><div class=\"summary-item highlight\"><span class=\"summary-value\">" + available + "</span><span class=\"summary-label\">เครื่องพร้อมแจก</span></div><div class=\"summary-item\"><span class=\"summary-value\">" + publicList.length + "</span><span class=\"summary-label\">เครื่องที่เผยแพร่</span></div><div class=\"summary-item\"><span class=\"summary-value\">" + totalBundles + "</span><span class=\"summary-label\">ชุดที่แจกได้รวม</span></div></section>",
      "  <section><div class=\"section-heading\"><div><h2>จุดแจกทั้งหมด</h2><p>เลือกเครื่องเพื่อดูรายละเอียดและแผนที่</p></div><span class=\"count\">" + machines.length + " จุด</span></div><div id=\"public-machine-list\" class=\"machine-grid\">" + (machines.length ? machines.map(renderMachineCard).join("") : "<div class=\"empty-state\" style=\"grid-column:1/-1\"><strong>ยังไม่พบเครื่องที่ตรงกับการค้นหา</strong><p>ลองเปลี่ยนจังหวัด สถานะ หรือคำค้นหา</p></div>") + "</div></section>",
      "</div></main>",
      renderBottomNav("home")
    ].join("");
  }

  function renderMap(machine) {
    return [
      "<div class=\"map-preview\" aria-label=\"แผนที่ตำแหน่ง " + esc(machine.name) + "\"><div class=\"leaflet-map\" data-map=\"true\" data-lat=\"" + esc(machine.lat) + "\" data-lng=\"" + esc(machine.lng) + "\" data-name=\"" + esc(machine.name) + "\"></div><div class=\"map-fallback\" aria-hidden=\"true\">",
      "  <div class=\"map-road\"></div><div class=\"map-road two\"></div>",
      "  <div class=\"map-marker-label\">" + esc(machine.name) + "</div><div class=\"map-marker\"></div></div>",
      "</div>",
      "<div class=\"card-foot\" style=\"margin-top:9px\"><span class=\"map-legend\"><span><i></i> ตำแหน่งเครื่อง</span><span>Leaflet + OpenStreetMap</span></span><a class=\"text-link\" href=\"https://www.openstreetmap.org/?mlat=" + esc(machine.lat) + "&mlon=" + esc(machine.lng) + "#map=17/" + esc(machine.lat) + "/" + esc(machine.lng) + "\" target=\"_blank\" rel=\"noreferrer\">เปิดแผนที่ " + icon("external", 13) + "</a></div>"
    ].join("");
  }

  function mountMaps() {
    if (!document.querySelectorAll || !window.L) return;
    document.querySelectorAll("[data-map]").forEach(function (node) {
      if (node.getAttribute("data-mounted") === "true") return;
      var lat = Number(node.getAttribute("data-lat"));
      var lng = Number(node.getAttribute("data-lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      var map = window.L.map(node, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 16);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
      window.L.marker([lat, lng]).addTo(map).bindPopup(esc(node.getAttribute("data-name") || "จุดแจก")).openPopup();
      node.setAttribute("data-mounted", "true");
      if (node.parentElement) node.parentElement.classList.add("leaflet-ready");
    });
  }

  function paint(html) {
    root.innerHTML = html;
    mountMaps();
  }

  function renderDetail(machine) {
    var status = statusMeta(machine);
    return [
      renderPublicHeader(),
      "<main class=\"page-main\"><div class=\"container\">",
      "  <div class=\"detail-head\"><button class=\"back-button\" data-route=\"home\" aria-label=\"ย้อนกลับ\">" + icon("back", 19) + "</button><div><h1>" + esc(machine.name) + "</h1><p>" + esc(machine.code) + " · เปิดบริการ 24 ชั่วโมงเมื่อพร้อม</p></div></div>",
      "  <div class=\"detail-layout\">",
      "    <section class=\"detail-column\">",
      "      <div class=\"detail-card\"><div class=\"detail-status-row\">" + renderStatus(status) + "<span class=\"last-updated\">" + icon("clock", 12) + " อัปเดต " + dateThai(machine.lastUpdated) + "</span></div><div class=\"detail-stock\"><small>ชุดสิ่งของที่แจกได้</small><strong>" + bundleCount(machine) + " ชุด</strong><span>คำนวณจากรายการที่เหลือน้อยที่สุดในชุด</span></div><div class=\"section-heading\" style=\"margin:0 0 7px\"><div><h2>สิ่งของในเครื่อง</h2></div></div><div class=\"channel-list\">" + machine.channels.filter(function (channel) { return channel.enabled && channel.name; }).map(function (channel) { return "<div class=\"channel-row\"><div class=\"channel-name\"><span class=\"channel-icon\">" + icon("machine", 15) + "</span><div><strong>" + esc(channel.name) + "</strong><small>" + esc(channel.unit) + " · ช่อง " + channel.number + "</small></div></div><div class=\"channel-count\"><strong>" + channel.count + "</strong><small>เหลือ " + esc(channel.unit) + "</small></div></div>"; }).join("") + "</div></div>",
      "      <div class=\"info-card\"><h2 style=\"font-size:15px;margin:0 0 12px\">ข้อมูลสถานที่</h2><div class=\"address-block\"><div class=\"address-line\">" + icon("pin", 17) + "<span>" + esc(machine.address) + "<br>" + esc(machine.district) + " · " + esc(machine.province) + "</span></div>" + (machine.contact ? "<div class=\"address-line\">" + icon("info", 17) + "<span>ติดต่อจุดแจก: " + esc(machine.contact) + "</span></div>" : "") + (machine.notice ? "<div class=\"notice\">" + esc(machine.notice) + "</div>" : "") + "</div><div class=\"detail-actions\"><a class=\"btn btn-primary\" href=\"https://www.openstreetmap.org/?mlat=" + esc(machine.lat) + "&mlon=" + esc(machine.lng) + "#map=17/" + esc(machine.lat) + "/" + esc(machine.lng) + "\" target=\"_blank\" rel=\"noreferrer\">" + icon("map", 16) + " เปิดตำแหน่งในแผนที่</a><button class=\"btn btn-outline\" data-action=\"copy-address\" data-machine=\"" + esc(machine.code) + "\">" + icon("copy", 16) + " คัดลอกที่อยู่</button></div></div>",
      "    </section>",
      "    <section class=\"map-column\"><div class=\"section-heading\" style=\"margin-top:0\"><div><h2>ตำแหน่งเครื่อง</h2><p>พิกัด " + esc(machine.lat) + ", " + esc(machine.lng) + "</p></div></div>" + renderMap(machine) + "</section>",
      "  </div>",
      "</div></main>",
      renderBottomNav("")
    ].join("");
  }

  function adminTopbar() {
    return "<header class=\"admin-topbar\"><div class=\"admin-topbar-left\"><button class=\"menu-toggle\" data-action=\"toggle-sidebar\" aria-label=\"เปิดเมนู\">" + icon("menu", 18) + "</button><button class=\"brand btn-ghost\" data-route=\"admin-dashboard\"><span class=\"brand-mark\">" + icon("machine", 18) + "</span><span class=\"brand-copy\"><span class=\"brand-name\">พร้อมปัน</span><span class=\"brand-tagline\">พื้นที่ผู้ดูแล</span></span></button></div><div class=\"header-links\"><span class=\"device-dot\"><span class=\"sr-only\">ระบบ</span>ระบบทำงานปกติ</span><button class=\"btn-ghost\" data-action=\"logout\">" + icon("logout", 15) + " ออกจากระบบ</button></div></header>";
  }

  function adminSidebar(active) {
    var links = [
      ["dashboard", "Dashboard", "dashboard"],
      ["machines", "เครื่องแจก", "machine"],
      ["recipients", "ผู้มีสิทธิ์", "people"],
      ["activity", "ประวัติการทำรายการ", "history"],
      ["device", "Device API", "settings"]
    ];
    return "<aside class=\"admin-sidebar " + (state.sidebarOpen ? "open" : "") + "\"><div class=\"sidebar-label\">จัดการระบบ</div>" + links.map(function (link) { return "<button class=\"side-link " + (active === link[0] ? "active" : "") + "\" data-route=\"admin-" + link[0] + "\"><span class=\"side-icon\">" + icon(link[2], 17) + "</span><span>" + link[1] + "</span>" + (link[0] === "dashboard" ? "<span class=\"side-badge\">" + state.alerts.filter(function (a) { return !a.ack; }).length + "</span>" : "") + "</button>"; }).join("") + "<div class=\"sidebar-label\" style=\"margin-top:18px\">ตัวอย่าง</div><div class=\"callout\" style=\"margin:5px 4px;font-size:10px\">ข้อมูลในหน้าจอนี้เป็น state จำลองและจะหายเมื่อ refresh</div></aside>";
  }

  function adminShell(active, content) {
    return "<div class=\"admin-layout\">" + adminTopbar() + "<div class=\"admin-shell\">" + adminSidebar(active) + (state.sidebarOpen ? "<div class=\"sidebar-scrim\" data-action=\"toggle-sidebar\"></div>" : "") + "<main class=\"admin-content\"><div class=\"admin-content-inner\">" + content + "</div></main></div>" + (state.modal ? renderModal() : "") + "</div>";
  }

  function adminTitle(title, subtitle, actions) {
    return "<div class=\"admin-page-title\"><div><h1>" + title + "</h1><p>" + subtitle + "</p></div><div class=\"admin-page-title-actions\">" + (actions || "") + "</div></div>";
  }

  function renderDashboard() {
    var machines = publishedMachines();
    var available = machines.filter(function (machine) { return statusMeta(machine).key === "available"; }).length;
    var totalBundles = machines.reduce(function (sum, machine) { return sum + bundleCount(machine); }, 0);
    var unread = state.alerts.filter(function (alert) { return !alert.ack; }).length;
    var max = Math.max.apply(null, state.distributions.map(function (item) { return item.count; }));
    var bars = state.distributions.map(function (item) { var height = Math.max(8, Math.round((item.count / max) * 100)); return "<div class=\"bar-group\" style=\"--h:" + height + "%\"><div class=\"bar\" style=\"height:" + height + "%\"></div><strong>" + item.count + "</strong><small>" + item.date + "</small></div>"; }).join("");
    var tableMachines = machines.slice(0, 5);
    return adminShell("dashboard", adminTitle("สวัสดี, Admin", "ภาพรวมเครื่องแจกและการรับของ · อัปเดตล่าสุด " + timeAgo(state.device.lastSeen), "<button class=\"btn btn-primary\" data-route=\"admin-machine-new\">" + icon("plus", 15) + " สร้างเครื่อง</button>") + "<section class=\"admin-stat-grid\"><div class=\"admin-stat\"><div class=\"admin-stat-top\"><span>เครื่องที่เผยแพร่</span><span class=\"stat-icon\">" + icon("machine", 15) + "</span></div><strong>" + machines.length + "</strong><span class=\"stat-foot\">ทั้งหมดในระบบ " + state.machines.length + " เครื่อง</span></div><div class=\"admin-stat\"><div class=\"admin-stat-top\"><span>พร้อมแจก</span><span class=\"stat-icon\" style=\"color:var(--success);background:var(--success-pale)\">" + icon("check", 15) + "</span></div><strong>" + available + "</strong><span class=\"stat-foot\">จาก " + machines.length + " เครื่องที่เผยแพร่</span></div><div class=\"admin-stat\"><div class=\"admin-stat-top\"><span>ชุดที่แจกได้รวม</span><span class=\"stat-icon\" style=\"color:var(--purple);background:var(--purple-pale)\">" + icon("file", 15) + "</span></div><strong>" + totalBundles + "</strong><span class=\"stat-foot\">คำนวณจากช่องที่เหลือน้อยสุด</span></div><div class=\"admin-stat\"><div class=\"admin-stat-top\"><span>ต้องจัดการ</span><span class=\"stat-icon\" style=\"color:var(--warning);background:var(--warning-pale)\">" + icon("warning", 15) + "</span></div><strong>" + unread + "</strong><span class=\"stat-foot\">alert ที่ยังไม่รับทราบ</span></div></section><section class=\"admin-grid\"><div class=\"panel\"><div class=\"panel-header\"><div><h2>จำนวนผู้รับของ</h2><p>นับเฉพาะผู้ที่รับครบชุดจาก server</p></div><select class=\"field-select\" data-chart-range style=\"padding:7px 30px 7px 8px;border:1px solid var(--line);border-radius:7px;font-size:10px;color:var(--muted);background:#fff\"><option>7 วันล่าสุด</option><option>30 วันล่าสุด</option></select></div><div class=\"panel-body\"><div class=\"chart-wrap\"><div class=\"chart\">" + bars + "</div><div class=\"chart-caption\"><span><strong>" + state.distributions[state.distributions.length - 1].count + "</strong> คนวันนี้</span><span>รวม " + state.distributions.reduce(function (sum, item) { return sum + item.count; }, 0) + " คน · prototype</span></div></div></div></div><div class=\"panel\"><div class=\"panel-header\"><div><h2>แจ้งเตือนที่ต้องจัดการ</h2><p>กดรับทราบได้ แต่จะหายเมื่อแก้สาเหตุ</p></div><span class=\"count\">" + unread + " รายการ</span></div><div class=\"panel-body\"><div class=\"alert-list\">" + state.alerts.map(function (alert) { return "<div class=\"alert-row " + (alert.type === "danger" ? "danger" : "") + "\"><div class=\"alert-copy\"><span class=\"alert-icon\">" + icon(alert.type === "danger" ? "warning" : "info", 15) + "</span><div><strong>" + esc(alert.title) + "</strong><p>" + esc(alert.text) + "</p>" + (alert.ack ? "<span class=\"last-updated\">รับทราบแล้ว</span>" : "") + "</div></div>" + (!alert.ack ? "<button class=\"ack\" data-action=\"ack-alert\" data-id=\"" + alert.id + "\">รับทราบ</button>" : "<span class=\"code-pill\">อ่านแล้ว</span>") + "</div>"; }).join("") + "</div></div></div><div class=\"panel wide-panel\"><div class=\"panel-header\"><div><h2>เครื่องที่เผยแพร่</h2><p>ดูสถานะล่าสุดและการ sync ของแต่ละจุด</p></div><button class=\"btn btn-outline btn-sm\" data-route=\"admin-machines\">ดูทั้งหมด " + icon("arrow", 13) + "</button></div><div class=\"data-table-wrap\"><table class=\"data-table\"><thead><tr><th>เครื่อง</th><th>สถานะบริการ</th><th>ชุดที่เหลือ</th><th>การเชื่อมต่อ</th><th>อัปเดตล่าสุด</th><th></th></tr></thead><tbody>" + tableMachines.map(function (machine) { var s = statusMeta(machine); return "<tr><td><span class=\"table-primary\">" + esc(machine.name) + "</span><span class=\"table-secondary\">" + esc(machine.code) + " · " + esc(machine.province) + "</span></td><td>" + renderStatus(s) + "</td><td><span class=\"table-primary\">" + bundleCount(machine) + " ชุด</span></td><td><span class=\"device-dot " + (machine.deviceStatus === "online" ? "" : "offline") + "\">" + (machine.deviceStatus === "online" ? "ออนไลน์" : "ออฟไลน์") + "</span></td><td><span class=\"table-secondary\">" + timeAgo(machine.lastUpdated) + "</span></td><td class=\"table-actions\"><button class=\"btn btn-ghost btn-sm\" data-route=\"admin-machine-edit/" + machine.code + "\">แก้ไข</button></td></tr>"; }).join("") + "</tbody></table></div></div></section>");
  }

  function renderMachines() {
    var machines = state.machines;
    return adminShell("machines", adminTitle("เครื่องแจก", "สร้าง แก้ไข เผยแพร่ และดู revision การ sync", "<button class=\"btn btn-primary\" data-route=\"admin-machine-new\">" + icon("plus", 15) + " สร้างเครื่อง</button>") + "<div class=\"panel\"><div class=\"panel-header\"><div><h2>เครื่องทั้งหมด</h2><p>" + machines.length + " เครื่อง · published " + publishedMachines().length + " · draft/archived " + (machines.length - publishedMachines().length) + "</p></div><button class=\"btn btn-outline btn-sm\" data-action=\"export-machines\">" + icon("upload", 14) + " Export CSV</button></div><div class=\"data-table-wrap\"><table class=\"data-table\"><thead><tr><th>เครื่อง</th><th>lifecycle</th><th>สถานะบริการ</th><th>ชุดที่แจกได้</th><th>sync</th><th></th></tr></thead><tbody>" + machines.map(function (machine) { var status = statusMeta(machine); return "<tr><td><span class=\"table-primary\">" + esc(machine.name || "ยังไม่มีชื่อ") + "</span><span class=\"table-secondary\">" + esc(machine.code) + " · " + esc(machine.province) + "</span></td><td><span class=\"status " + (machine.lifecycle === "published" ? "available" : "draft") + "\">" + (machine.lifecycle === "published" ? "เผยแพร่" : machine.lifecycle === "archived" ? "เก็บถาวร" : "ฉบับร่าง") + "</span></td><td>" + renderStatus(status) + "</td><td>" + bundleCount(machine) + " ชุด</td><td><span class=\"device-dot " + (machine.deviceStatus === "online" ? "" : "offline") + "\">" + (machine.deviceStatus === "online" ? "online" : "offline") + "</span>" + (machine.pendingSync ? "<span class=\"revision-badge\" style=\"margin-left:6px\">รอ sync</span>" : "") + "</td><td class=\"table-actions\"><button class=\"btn btn-ghost btn-sm\" data-route=\"admin-machine-edit/" + machine.code + "\">แก้ไข</button><button class=\"btn btn-outline btn-sm\" data-action=\"restock\" data-machine=\"" + machine.code + "\">สต็อก</button></td></tr>"; }).join("") + "</tbody></table></div></div>");
  }

  function field(label, name, value, type, extra) {
    return "<div class=\"field\"><label for=\"" + name + "\">" + label + "</label><input id=\"" + name + "\" name=\"" + name + "\" type=\"" + (type || "text") + "\" value=\"" + esc(value) + "\" " + (extra || "") + "></div>";
  }

  function renderMachineForm(machine) {
    var editing = !!machine;
    var data = machine || { name: "", province: "", district: "", address: "", lat: "", lng: "", contact: "", notice: "", lifecycle: "draft", serviceMode: "normal", channels: [{ number: 1, name: "", unit: "ขวด", count: 0, capacity: 0, threshold: 0, enabled: true }, { number: 2, name: "", unit: "กล่อง", count: 0, capacity: 0, threshold: 0, enabled: true }, { number: 3, name: "", unit: "ชุด", count: 0, capacity: 0, threshold: 0, enabled: true }] };
    var channelForms = data.channels.map(function (channel) { return "<div class=\"channel-editor\"><div class=\"channel-editor-head\"><strong>ช่องจ่าย " + channel.number + "</strong><label class=\"switch\"><input type=\"checkbox\" name=\"channel-enabled-" + channel.number + "\" " + (channel.enabled ? "checked" : "") + "><span class=\"switch-track\"></span></label></div><div class=\"channel-grid\">" + field("ชื่อสินค้า", "channel-name-" + channel.number, channel.name, "text", "placeholder=\"เช่น น้ำดื่ม\"") + "<div class=\"field\"><label for=\"channel-unit-" + channel.number + "\">หน่วย</label><select id=\"channel-unit-" + channel.number + "\" name=\"channel-unit-" + channel.number + "\"><option " + (channel.unit === "ขวด" ? "selected" : "") + ">ขวด</option><option " + (channel.unit === "กล่อง" ? "selected" : "") + ">กล่อง</option><option " + (channel.unit === "ชุด" ? "selected" : "") + ">ชุด</option><option " + (channel.unit === "ชิ้น" ? "selected" : "") + ">ชิ้น</option><option " + (channel.unit === "แพ็ก" ? "selected" : "") + ">แพ็ก</option><option " + (channel.unit !== "ขวด" && channel.unit !== "กล่อง" && channel.unit !== "ชุด" && channel.unit !== "ชิ้น" && channel.unit !== "แพ็ก" ? "selected" : "") + ">อื่น ๆ</option></select></div>" + field("ยอดเริ่มต้น", "channel-count-" + channel.number, channel.count, "number", "min=\"0\"") + field("ความจุสูงสุด", "channel-capacity-" + channel.number, channel.capacity, "number", "min=\"0\"") + field("เตือนเมื่อเหลือ", "channel-threshold-" + channel.number, channel.threshold, "number", "min=\"0\"") + "</div></div>"; }).join("");
    return adminShell("machines", adminTitle(editing ? "แก้ไข " + esc(data.code) : "สร้างเครื่องใหม่", editing ? "แก้ไขข้อมูลโดยไม่เปลี่ยนรหัสเครื่อง" : "บันทึกเป็น draft ได้ก่อนเผยแพร่", "<button class=\"btn btn-outline\" data-route=\"admin-machines\">" + icon("back", 14) + " กลับรายการ</button>") + "<form data-form=\"machine\" data-machine-id=\"" + (editing ? esc(data.code) : "") + "\"><div class=\"form-section\"><h2>ข้อมูลจุดแจก</h2><p class=\"section-help\">รหัสเครื่องจะถูกสร้างอัตโนมัติเมื่อบันทึกครั้งแรก · ให้บริการ 24 ชั่วโมงเมื่อพร้อม</p>" + (editing ? "<div class=\"callout\" style=\"margin-bottom:14px\">รหัสเครื่อง <span class=\"code-pill\">" + esc(data.code) + "</span> ใช้เชื่อม ESP32 ในอนาคตและแก้ไม่ได้</div>" : "") + field("ชื่อจุดแจก <span class=\"required\">*</span>", "machine-name", data.name, "text", "required placeholder=\"เช่น ศูนย์พักพิงคลองสอง\"") + "<div class=\"field-grid two\">" + field("จังหวัด <span class=\"required\">*</span>", "machine-province", data.province, "text", "required") + field("อำเภอ <span class=\"required\">*</span>", "machine-district", data.district, "text", "required") + "</div>" + field("ที่อยู่ / จุดสังเกต <span class=\"required\">*</span>", "machine-address", data.address, "text", "required") + "<div class=\"field-grid two\">" + field("Latitude <span class=\"required\">*</span>", "machine-lat", data.lat, "number", "step=\"any\" required") + field("Longitude <span class=\"required\">*</span>", "machine-lng", data.lng, "number", "step=\"any\" required") + "</div><div class=\"map-preview\" style=\"min-height:150px;margin-top:4px\"><div class=\"map-road\"></div><div class=\"map-marker\"></div></div><div class=\"field-grid two\" style=\"margin-top:12px\">" + field("เบอร์ติดต่อ (optional)", "machine-contact", data.contact, "text") + field("รูปเครื่อง (optional)", "machine-photo", "", "file", "accept=\"image/*\"") + "</div>" + field("ประกาศสำหรับประชาชน (optional)", "machine-notice", data.notice, "text", "placeholder=\"เช่น กรุณานำบัตรประชาชนตัวจริงมาด้วย\"") + "</div><div class=\"form-section\"><h2>สถานะการเผยแพร่</h2><div class=\"field-grid two\"><div class=\"field\"><label for=\"machine-lifecycle\">lifecycle</label><select id=\"machine-lifecycle\" name=\"machine-lifecycle\"><option value=\"draft\" " + (data.lifecycle === "draft" ? "selected" : "") + ">ฉบับร่าง</option><option value=\"published\" " + (data.lifecycle === "published" ? "selected" : "") + ">เผยแพร่</option><option value=\"archived\" " + (data.lifecycle === "archived" ? "selected" : "") + ">เก็บถาวร</option></select></div><div class=\"field\"><label for=\"machine-service\">สถานะบริการ</label><select id=\"machine-service\" name=\"machine-service\"><option value=\"normal\" " + (data.serviceMode === "normal" ? "selected" : "") + ">ปกติ</option><option value=\"paused\" " + (data.serviceMode === "paused" ? "selected" : "") + ">ปิดชั่วคราว</option><option value=\"maintenance\" " + (data.serviceMode === "maintenance" ? "selected" : "") + ">ปิดซ่อมบำรุง</option></select></div></div><div class=\"callout\">หากยอดในช่องใดเป็นศูนย์ ระบบคำนวณสถานะ public เป็น <strong>ของหมด</strong> อัตโนมัติ</div></div><div class=\"form-section\"><h2>สิ่งของในเครื่อง</h2><p class=\"section-help\">ทุกช่องที่เปิดใช้งานเป็นส่วนจำเป็นของชุด จำนวนชุดคำนวณจากช่องที่เหลือน้อยที่สุด</p>" + channelForms + "</div><div class=\"form-actions\"><button type=\"button\" class=\"btn btn-outline\" data-route=\"admin-machines\">ยกเลิก</button><button type=\"submit\" class=\"btn btn-primary\">" + icon("check", 15) + " บันทึกเครื่อง</button></div></form>");
  }

  function renderRecipients() {
    var active = state.recipients.filter(function (person) { return person.active; }).length;
    return adminShell("recipients", adminTitle("ผู้มีสิทธิ์รับของ", "จัดการรายชื่อและ import แบบ preview ก่อนยืนยัน", "<button class=\"btn btn-outline\" data-action=\"export-recipients\">" + icon("upload", 14) + " Export CSV</button><button class=\"btn btn-primary\" data-action=\"open-csv\">" + icon("plus", 14) + " นำเข้า CSV</button>") + "<div class=\"callout\" style=\"margin-bottom:14px\">" + icon("info", 14) + " เลขบัตรในตารางถูกปิดบัง ระบบต้นแบบนี้ใช้ข้อมูลจำลองและจะไม่เก็บอะไรหลัง refresh</div><div class=\"panel\"><div class=\"panel-header\"><div><h2>รายชื่อทั้งหมด</h2><p>active " + active + " คน · deactivated " + (state.recipients.length - active) + " คน</p></div><span class=\"code-pill\">Eligibility v" + state.device.eligibilityVersion + "</span></div><div class=\"data-table-wrap\"><table class=\"data-table\"><thead><tr><th>เลขบัตร</th><th>ชื่อ</th><th>สถานะ</th><th>อัปเดตล่าสุด</th><th></th></tr></thead><tbody>" + state.recipients.map(function (person) { return "<tr><td><span class=\"code-pill\">" + esc(person.citizenId) + "</span></td><td><span class=\"table-primary\">" + esc(person.name) + "</span></td><td><span class=\"status " + (person.active ? "available" : "draft") + "\">" + (person.active ? "ใช้งาน" : "ปิดสิทธิ์") + "</span></td><td><span class=\"table-secondary\">" + timeAgo(person.updated) + "</span></td><td class=\"table-actions\"><button class=\"btn btn-ghost btn-sm\" data-action=\"toggle-recipient\" data-id=\"" + person.id + "\">" + (person.active ? "ปิดสิทธิ์" : "เปิดสิทธิ์") + "</button></td></tr>"; }).join("") + "</tbody></table></div></div>");
  }

  function renderActivity() {
    return adminShell("activity", adminTitle("ประวัติการทำรายการ", "บันทึกแบบแก้ไขหรือลบไม่ได้ · เก็บเฉพาะ field ที่เปลี่ยน", "<button class=\"btn btn-outline\" data-action=\"export-activity\">" + icon("upload", 14) + " Export CSV</button>") + "<div class=\"panel\"><div class=\"panel-header\"><div><h2>Activity log</h2><p>" + state.activity.length + " รายการใน prototype</p></div><select style=\"padding:7px 28px 7px 9px;border:1px solid var(--line);border-radius:7px;color:var(--muted);font-size:10px\"><option>ทุกประเภท</option><option>สต็อก</option><option>ผู้มีสิทธิ์</option><option>เครื่อง</option></select></div><div class=\"data-table-wrap\"><table class=\"data-table\"><thead><tr><th>เวลา</th><th>การกระทำ</th><th>ข้อมูล</th><th>ผู้ทำ</th></tr></thead><tbody>" + state.activity.map(function (item) { return "<tr><td><span class=\"table-secondary\">" + dateThai(item.time) + "</span></td><td><span class=\"table-primary\">" + esc(item.action) + "</span></td><td><span class=\"table-primary\">" + esc(item.entity) + "</span><span class=\"table-secondary\">" + esc(item.detail) + "</span></td><td><span class=\"code-pill\">" + esc(item.actor) + "</span></td></tr>"; }).join("") + "</tbody></table></div></div>");
  }

  function renderDevice() {
    var device = state.device;
    var machine = findMachine(device.code);
    var synced = device.appliedPlanVersion === device.planVersion && device.appliedEligibilityVersion === device.eligibilityVersion && device.appliedStockRevision === device.stockRevision;
    return adminShell("device", adminTitle("Device API", "หน้าจำลองการเชื่อมต่อ ESP32 ตาม contract", "<button class=\"btn btn-primary\" data-action=\"sync-device\">" + icon("refresh", 14) + " จำลอง sync</button>") + "<div class=\"admin-grid\"><div class=\"panel\"><div class=\"panel-header\"><div><h2>การเชื่อมต่อ</h2><p>public status จะไม่เปลี่ยนตาม connectivity</p></div><span class=\"device-dot " + (device.status === "online" ? "" : "offline") + "\">" + (device.status === "online" ? "online" : "offline") + "</span></div><div class=\"panel-body\"><div class=\"detail-status-row\"><div><span class=\"table-primary\">" + device.code + "</span><span class=\"table-secondary\">" + (machine ? esc(machine.name) : "ไม่พบเครื่อง") + "</span></div><span class=\"revision-badge " + (synced ? "hidden" : "") + "\">รอ sync revision</span></div><div class=\"address-block\"><div class=\"address-line\">" + icon("clock", 16) + "<span>heartbeat ล่าสุด<br><strong>" + dateThai(device.lastSeen) + "</strong></span></div><div class=\"address-line\">" + icon("settings", 16) + "<span>firmware " + esc(device.firmware) + " · client " + esc(device.client) + "</span></div></div><div class=\"form-actions\" style=\"justify-content:flex-start\"><button class=\"btn btn-secondary btn-sm\" data-action=\"device-report\">" + icon("check", 14) + " จำลอง report แจกสำเร็จ</button><button class=\"btn btn-outline btn-sm\" data-action=\"copy-device-settings\">" + icon("copy", 14) + " คัดลอกค่าตั้ง</button></div></div></div><div class=\"panel\"><div class=\"panel-header\"><div><h2>Revision</h2><p>desired state เทียบกับค่าที่เครื่อง apply แล้ว</p></div></div><div class=\"panel-body\"><div class=\"revision-list\"><div class=\"switch-row\"><label>Plan version</label><span class=\"code-pill\">" + device.appliedPlanVersion + " / " + device.planVersion + "</span></div><div class=\"switch-row\"><label>Eligibility version</label><span class=\"code-pill\">" + device.appliedEligibilityVersion + " / " + device.eligibilityVersion + "</span></div><div class=\"switch-row\"><label>Stock revision</label><span class=\"code-pill\">" + device.appliedStockRevision + " / " + device.stockRevision + "</span></div><div class=\"switch-row\"><label>Shared secret</label><span class=\"code-pill\">••••••••••••••••</span></div></div><div class=\"callout\" style=\"margin-top:14px\">Device API ใช้ HTTPS และ shared secret แยกจาก admin credential · ไม่สั่งมอเตอร์/ประตูจากเว็บ</div></div></div><div class=\"panel wide-panel\"><div class=\"panel-header\"><div><h2>Endpoints ที่ simulator เรียก</h2><p>contract version v1</p></div><span class=\"code-pill\">/api/device/v1</span></div><div class=\"panel-body\"><div class=\"channel-list\"><div class=\"channel-row\"><div class=\"channel-name\"><span class=\"channel-icon\">" + icon("refresh", 15) + "</span><div><strong>POST /sync</strong><small>heartbeat + desired state</small></div></div><span class=\"status available\">พร้อม</span></div><div class=\"channel-row\"><div class=\"channel-name\"><span class=\"channel-icon\">" + icon("people", 15) + "</span><div><strong>GET /eligibility-snapshot</strong><small>stream versioned CSV</small></div></div><span class=\"status available\">พร้อม</span></div><div class=\"channel-row\"><div class=\"channel-name\"><span class=\"channel-icon\">" + icon("check", 15) + "</span><div><strong>POST /authorize</strong><small>ตรวจสิทธิ์ online</small></div></div><span class=\"status available\">พร้อม</span></div><div class=\"channel-row\"><div class=\"channel-name\"><span class=\"channel-icon\">" + icon("upload", 15) + "</span><div><strong>POST /report</strong><small>ผลแจก + stock + error</small></div></div><span class=\"status available\">พร้อม</span></div></div></div></div></div>");
  }

  function renderLogin() {
    return "<main class=\"login-page\"><section class=\"login-card\"><button class=\"brand btn-ghost\" data-route=\"home\"><span class=\"brand-mark\">" + icon("machine", 18) + "</span><span class=\"brand-copy\"><span class=\"brand-name\">พร้อมปัน</span><span class=\"brand-tagline\">พื้นที่ผู้ดูแล</span></span></button><h1>เข้าสู่ระบบ Admin</h1><p>บริหารจุดแจก สต็อก รายชื่อผู้มีสิทธิ์ และดูภาพรวมการเชื่อมต่อเครื่อง</p><form data-form=\"login\"><div class=\"field\"><label for=\"login-username\">Username</label><input id=\"login-username\" name=\"username\" autocomplete=\"username\" placeholder=\"กรอก username\" required></div><div class=\"field\"><label for=\"login-password\">Password</label><input id=\"login-password\" name=\"password\" type=\"password\" autocomplete=\"current-password\" placeholder=\"กรอก password\" required></div><button class=\"btn btn-primary\" style=\"width:100%;margin-top:4px\" type=\"submit\">" + icon("lock", 16) + " เข้าสู่ Dashboard</button></form><div class=\"login-note\">" + icon("info", 14) + " Prototype เท่านั้น: ข้อมูลอยู่ใน memory และจะหายเมื่อ refresh · credential จริงใช้จาก environment variables</div></section></main>";
  }

  function renderModal() {
    if (state.modal === "stock") {
      var machine = findMachine(state.modalMachine);
      return "<div class=\"modal-backdrop open\"><section class=\"modal\"><div class=\"modal-header\"><div><h2>ปรับสต็อก · " + esc(machine ? machine.name : "") + "</h2><p>Prototype จะอัปเดต ledger ใน memory ทันที</p></div><button class=\"close-btn\" data-action=\"close-modal\">" + icon("close", 16) + "</button></div><form data-form=\"stock\"><input type=\"hidden\" name=\"machine\" value=\"" + esc(state.modalMachine) + "\"><div class=\"field\"><label for=\"stock-channel\">ช่องจ่าย</label><select id=\"stock-channel\" name=\"channel\">" + (machine ? machine.channels.map(function (channel) { return "<option value=\"" + channel.number + "\">ช่อง " + channel.number + " · " + esc(channel.name || "ยังไม่ตั้งชื่อ") + " (เหลือ " + channel.count + ")</option>"; }).join("") : "") + "</select></div><div class=\"field\"><label for=\"stock-action\">ประเภท</label><select id=\"stock-action\" name=\"action\"><option value=\"refill\">เติมสินค้า</option><option value=\"adjust\">ปรับยอด</option></select></div><div class=\"field\"><label for=\"stock-amount\">จำนวน</label><input id=\"stock-amount\" name=\"amount\" type=\"number\" min=\"0\" value=\"10\" required></div><div class=\"field\"><label for=\"stock-reason\">เหตุผล</label><textarea id=\"stock-reason\" name=\"reason\" placeholder=\"เช่น เติมของรอบเช้า / ตรวจนับหน้างาน\" required></textarea></div><div class=\"form-actions\"><button type=\"button\" class=\"btn btn-outline\" data-action=\"close-modal\">ยกเลิก</button><button type=\"submit\" class=\"btn btn-primary\">บันทึกสต็อก</button></div></form></section></div>";
    }
    if (state.modal === "csv") {
      return "<div class=\"modal-backdrop open\"><section class=\"modal\"><div class=\"modal-header\"><div><h2>นำเข้ารายชื่อผู้มีสิทธิ์</h2><p>ตรวจ preview ก่อนยืนยัน · citizen_id,name</p></div><button class=\"close-btn\" data-action=\"close-modal\">" + icon("close", 16) + "</button></div><div class=\"callout\" style=\"margin-bottom:14px\">ไฟล์จริงจะถูกตรวจ checksum และแยกแถวผิดออกจากแถวผ่าน ใน prototype กดปุ่มด้านล่างเพื่อจำลองผลลัพธ์</div><div class=\"field\"><label for=\"csv-file\">เลือกไฟล์ CSV</label><input id=\"csv-file\" type=\"file\" accept=\".csv,text/csv\"></div>" + (state.csvPreview ? "<div class=\"panel\" style=\"margin-top:12px\"><div class=\"panel-header\"><div><h2>Preview</h2><p>ผ่าน 3 แถว · ไม่ผ่าน 1 แถว</p></div><span class=\"status available\">พร้อมนำเข้า</span></div><div class=\"panel-body\"><div class=\"channel-list\"><div class=\"channel-row\"><span>1103700•••••05 · คุณมะลิ ใจเย็น</span><span class=\"status available\">ผ่าน</span></div><div class=\"channel-row\"><span>1103700•••••06 · คุณพีท ร่วมแรง</span><span class=\"status available\">ผ่าน</span></div><div class=\"channel-row\"><span>1103700•••••07 · คุณน้ำฝน มั่นคง</span><span class=\"status available\">ผ่าน</span></div><div class=\"channel-row\"><span>123 · แถวทดสอบ</span><span class=\"status out\">เลขไม่ครบ</span></div></div></div></div>" : "") + "<div class=\"form-actions\"><button type=\"button\" class=\"btn btn-outline\" data-action=\"close-modal\">ยกเลิก</button>" + (state.csvPreview ? "<button type=\"button\" class=\"btn btn-primary\" data-action=\"confirm-csv\">นำเข้า 3 แถว</button>" : "<button type=\"button\" class=\"btn btn-secondary\" data-action=\"preview-csv\">ตรวจและแสดง preview</button>") + "</div></section></div>";
    }
    return "";
  }

  function render() {
    var route = getRoute();
    if (route.name === "admin-login") {
      paint(renderLogin());
      return;
    }
    if (route.name === "detail") {
      var detailMachine = findMachine(route.id);
      paint(detailMachine ? renderDetail(detailMachine) : renderHome());
      return;
    }
    if (route.name.indexOf("admin") === 0) {
      if (!state.adminAuth) {
        paint(renderLogin());
        return;
      }
      if (route.name === "admin-dashboard") paint(renderDashboard());
      else if (route.name === "admin-machines") paint(renderMachines());
      else if (route.name === "admin-machine-new") paint(renderMachineForm(null));
      else if (route.name === "admin-machine-edit") paint(renderMachineForm(findMachine(route.id)));
      else if (route.name === "admin-recipients") paint(renderRecipients());
      else if (route.name === "admin-activity") paint(renderActivity());
      else if (route.name === "admin-device") paint(renderDevice());
      else paint(renderDashboard());
      return;
    }
    paint(renderHome());
  }

  function addActivity(action, entity, detail) {
    state.activity.unshift({ time: new Date().toISOString(), action: action, entity: entity, detail: detail, actor: "admin" });
  }

  function saveMachine(form) {
    var formData = new FormData(form);
    var code = form.getAttribute("data-machine-id");
    var machine = code ? findMachine(code) : null;
    var channels = [1, 2, 3].map(function (number) {
      var old = machine ? machine.channels[number - 1] : null;
      return {
        number: number,
        name: formData.get("channel-name-" + number) || "",
        unit: formData.get("channel-unit-" + number) || "ชิ้น",
        count: Math.max(0, Number(formData.get("channel-count-" + number)) || 0),
        capacity: Math.max(0, Number(formData.get("channel-capacity-" + number)) || 0),
        threshold: Math.max(0, Number(formData.get("channel-threshold-" + number)) || 0),
        enabled: formData.get("channel-enabled-" + number) === "on",
        oldCount: old ? old.count : 0
      };
    });
    if (!machine) {
      var next = state.machines.length + 1;
      code = "DSP-" + String(next).padStart(4, "0");
      machine = { code: code, deviceStatus: "offline", pendingSync: false, lastUpdated: new Date().toISOString(), channels: channels };
      state.machines.push(machine);
      addActivity("สร้างเครื่อง", code, "บันทึกข้อมูลเครื่องใหม่");
    } else {
      addActivity("แก้ไขเครื่อง", code, "แก้ไขข้อมูลจุดแจกและช่องจ่าย");
      machine.channels = channels;
      machine.lastUpdated = new Date().toISOString();
    }
    machine.name = formData.get("machine-name") || "ยังไม่มีชื่อ";
    machine.province = formData.get("machine-province") || "";
    machine.district = formData.get("machine-district") || "";
    machine.address = formData.get("machine-address") || "";
    machine.lat = Number(formData.get("machine-lat")) || 0;
    machine.lng = Number(formData.get("machine-lng")) || 0;
    machine.contact = formData.get("machine-contact") || "";
    machine.notice = formData.get("machine-notice") || "";
    machine.lifecycle = formData.get("machine-lifecycle") || "draft";
    machine.serviceMode = formData.get("machine-service") || "normal";
    machine.pendingSync = true;
    toastMessage("บันทึก " + code + " แล้ว · รอ device sync", "success");
    go("admin-machine-edit/" + code);
  }

  function handleSubmit(event) {
    var form = event.target;
    if (!form.matches("form")) return;
    event.preventDefault();
    var type = form.getAttribute("data-form");
    if (type === "login") {
      var data = new FormData(form);
      if (!data.get("username") || !data.get("password")) return;
      state.adminAuth = true;
      toastMessage("เข้าสู่ระบบสำเร็จ (prototype)", "success");
      go("admin-dashboard");
    } else if (type === "public-search") {
      state.publicQuery = new FormData(form).get("query") || "";
      render();
    } else if (type === "machine") {
      saveMachine(form);
    } else if (type === "stock") {
      var dataStock = new FormData(form);
      var machine = findMachine(dataStock.get("machine"));
      var channel = machine && machine.channels[Number(dataStock.get("channel")) - 1];
      if (machine && channel) {
        var amount = Math.max(0, Number(dataStock.get("amount")) || 0);
        var action = dataStock.get("action");
        var before = channel.count;
        channel.count = action === "adjust" ? Math.min(channel.capacity || amount, amount) : Math.min(channel.capacity || amount, channel.count + amount);
        machine.lastUpdated = new Date().toISOString();
        machine.pendingSync = true;
        state.device.stockRevision += 1;
        addActivity(action === "adjust" ? "ปรับยอดสต็อก" : "เติมสินค้า", machine.code + " · " + channel.name, "จาก " + before + " เป็น " + channel.count + " " + channel.unit);
        state.modal = null;
        toastMessage("อัปเดตสต็อกแล้ว · รอเครื่อง sync", "success");
        render();
      }
    }
  }

  function handleClick(event) {
    var target = event.target.closest("[data-route], [data-action]");
    if (!target) return;
    var route = target.getAttribute("data-route");
    var action = target.getAttribute("data-action");
    if (route) {
      go(route);
      render();
      return;
    }
    if (action === "toggle-sidebar") {
      state.sidebarOpen = !state.sidebarOpen;
      render();
    } else if (action === "logout") {
      state.adminAuth = false;
      toastMessage("ออกจากระบบแล้ว", "success");
      go("home");
      render();
    } else if (action === "reset-filters") {
      state.publicQuery = "";
      state.publicStatus = "all";
      state.publicProvince = "all";
      state.publicDistrict = "all";
      render();
    } else if (action === "focus-search") {
      if (getRoute().name !== "home") go("home");
      render();
      setTimeout(function () { var input = document.getElementById("public-search"); if (input) input.focus(); }, 30);
    } else if (action === "copy-address") {
      var copyMachine = findMachine(target.getAttribute("data-machine"));
      var copyText = copyMachine ? copyMachine.address + " " + copyMachine.district + " " + copyMachine.province : "";
      if (navigator.clipboard && copyText) navigator.clipboard.writeText(copyText);
      toastMessage("คัดลอกที่อยู่แล้ว", "success");
    } else if (action === "ack-alert") {
      var alertItem = state.alerts.find(function (item) { return item.id === target.getAttribute("data-id"); });
      if (alertItem) {
        alertItem.ack = true;
        addActivity("รับทราบ alert", alertItem.title, alertItem.text);
        toastMessage("รับทราบ alert แล้ว · สาเหตุยังคงอยู่ในรายการ", "success");
        render();
      }
    } else if (action === "restock") {
      state.modal = "stock";
      state.modalMachine = target.getAttribute("data-machine");
      render();
    } else if (action === "close-modal") {
      state.modal = null;
      state.csvPreview = false;
      render();
    } else if (action === "open-csv") {
      state.modal = "csv";
      state.csvPreview = false;
      render();
    } else if (action === "preview-csv") {
      state.csvPreview = true;
      render();
    } else if (action === "confirm-csv") {
      var newPeople = [
        { id: "r5", citizenId: "1103700•••••05", name: "คุณมะลิ ใจเย็น", active: true, updated: new Date().toISOString() },
        { id: "r6", citizenId: "1103700•••••06", name: "คุณพีท ร่วมแรง", active: true, updated: new Date().toISOString() },
        { id: "r7", citizenId: "1103700•••••07", name: "คุณน้ำฝน มั่นคง", active: true, updated: new Date().toISOString() }
      ];
      state.recipients = state.recipients.concat(newPeople);
      state.device.eligibilityVersion += 1;
      addActivity("นำเข้ารายชื่อ", "Eligibility import", "ผ่าน 3 แถว · ไม่ผ่าน 1 แถว");
      state.modal = null;
      state.csvPreview = false;
      toastMessage("นำเข้า 3 รายชื่อแล้ว · Eligibility v" + state.device.eligibilityVersion, "success");
      render();
    } else if (action === "toggle-recipient") {
      var person = state.recipients.find(function (item) { return item.id === target.getAttribute("data-id"); });
      if (person) {
        person.active = !person.active;
        person.updated = new Date().toISOString();
        state.device.eligibilityVersion += 1;
        addActivity(person.active ? "เปิดสิทธิ์" : "ปิดสิทธิ์", person.name, "Eligibility revision " + state.device.eligibilityVersion);
        toastMessage(person.active ? "เปิดสิทธิ์แล้ว" : "ปิดสิทธิ์แล้ว", "success");
        render();
      }
    } else if (action === "export-machines" || action === "export-recipients" || action === "export-activity") {
      toastMessage("สร้างไฟล์ CSV แล้ว (prototype · download จำลอง)", "success");
    } else if (action === "sync-device") {
      state.device.status = "online";
      state.device.lastSeen = new Date().toISOString();
      state.device.appliedPlanVersion = state.device.planVersion;
      state.device.appliedEligibilityVersion = state.device.eligibilityVersion;
      state.device.appliedStockRevision = state.device.stockRevision;
      var syncMachine = findMachine(state.device.code);
      if (syncMachine) { syncMachine.deviceStatus = "online"; syncMachine.pendingSync = false; syncMachine.lastUpdated = state.device.lastSeen; }
      toastMessage("sync สำเร็จ · revision ตรงกันแล้ว", "success");
      render();
    } else if (action === "device-report") {
      var reportMachine = findMachine(state.device.code);
      if (reportMachine && bundleCount(reportMachine) > 0) {
        reportMachine.channels.forEach(function (channel) { if (channel.enabled && channel.count > 0) channel.count -= 1; });
        reportMachine.lastUpdated = new Date().toISOString();
        state.device.lastSeen = reportMachine.lastUpdated;
        state.device.reports += 1;
        state.distributions[state.distributions.length - 1].count += 1;
        state.device.stockRevision += 1;
        addActivity("รับรายงานแจกสำเร็จ", reportMachine.code, "รายงานจำลอง · stock movement สร้างแล้ว");
        toastMessage("รับ report แจกสำเร็จแล้ว · กราฟและ stock ledger อัปเดต", "success");
      } else {
        toastMessage("เครื่องไม่มีชุดที่พร้อมแจก", "error");
      }
      render();
    } else if (action === "copy-device-settings") {
      if (navigator.clipboard) navigator.clipboard.writeText("API_BASE_URL=https://your-project.vercel.app/api/device/v1\\nDEVICE_CODE=DSP-0001\\nDEVICE_SHARED_SECRET=จาก Vercel env");
      toastMessage("คัดลอกค่าตั้งสำหรับ ESP32 แล้ว", "success");
    }
  }

  function handleChange(event) {
    var target = event.target;
    if (target.matches("[data-public-filter]")) {
      if (target.getAttribute("data-public-filter") === "province") state.publicProvince = target.value;
      if (target.getAttribute("data-public-filter") === "district") state.publicDistrict = target.value;
      if (target.getAttribute("data-public-filter") === "status") state.publicStatus = target.value;
      render();
    }
    if (target.matches("#csv-file")) {
      state.csvPreview = true;
      render();
    }
  }

  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("change", handleChange);
  document.addEventListener("keydown", function (event) {
    var target = event.target;
    if (target && (target.matches("input") || target.matches("textarea") || target.matches("select") || target.isContentEditable)) return;
    if (event.key === "Enter" && target && target.matches("[data-route]")) {
      go(target.getAttribute("data-route"));
      render();
      return;
    }
    if (event.key === "Escape" && state.modal) {
      state.modal = null;
      state.csvPreview = false;
      render();
    }
  });
  window.addEventListener("hashchange", render);
  render();
})();
