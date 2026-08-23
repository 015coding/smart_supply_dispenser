/*
 * พร้อมปัน · Prototype 2
 * A small in-memory demo for the public finder and the admin workspace.
 * Login for this prototype: admin / admin
 */
(function () {
  "use strict";

  var now = new Date();
  var iso = function (daysAgo, hoursAgo) {
    return new Date(now.getTime() - (((daysAgo * 24) + hoursAgo) * 60 * 60 * 1000)).toISOString();
  };

  var state = {
    adminAuth: false,
    sidebarOpen: false,
    publicQuery: "",
    publicStatus: "all",
    publicProvince: "all",
    publicDistrict: "all",
    modal: null,
    modalMachine: null,
    modalError: "",
    formError: "",
    csvPreview: false,
    loginError: "",
    toastTimer: null,
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
      { date: "17 ส.ค.", count: 5 },
      { date: "18 ส.ค.", count: 8 },
      { date: "19 ส.ค.", count: 12 },
      { date: "20 ส.ค.", count: 9 },
      { date: "21 ส.ค.", count: 16 },
      { date: "22 ส.ค.", count: 11 },
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
      pin: "<path d=\"M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z\"></path><circle cx=\"12\" cy=\"10\" r=\"2.5\"></circle>",
      clock: "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 7v5l3 2\"></path>",
      arrow: "<path d=\"M5 12h14M13 6l6 6-6 6\"></path>",
      back: "<path d=\"m15 18-6-6 6-6\"></path>",
      home: "<path d=\"m3 10 9-7 9 7v10H3V10Z\"></path><path d=\"M9 20v-6h6v6\"></path>",
      dashboard: "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"></rect>",
      machine: "<rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2\"></rect><path d=\"M9 6h6M9 18h6\"></path><circle cx=\"12\" cy=\"12\" r=\"1\"></circle>",
      people: "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"></path><circle cx=\"9\" cy=\"7\" r=\"4\"></circle><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"></path>",
      history: "<path d=\"M3 12a9 9 0 1 0 3-6.7\"></path><path d=\"M3 4v6h6M12 7v5l3 2\"></path>",
      settings: "<path d=\"M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z\"></path><path d=\"m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 11H1.5a2 2 0 1 1 0-4h.2a2 2 0 0 0 1.4-3.4L3 3.5a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.3 1.4V1.2a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.9 9h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.5 2Z\"></path>",
      plus: "<path d=\"M12 5v14M5 12h14\"></path>",
      close: "<path d=\"m6 6 12 12M18 6 6 18\"></path>",
      menu: "<path d=\"M4 6h16M4 12h16M4 18h16\"></path>",
      refresh: "<path d=\"M20 11a8.1 8.1 0 0 0-14.6-4.8L3 9M3 4v5h5M4 13a8.1 8.1 0 0 0 14.6 4.8L21 15M21 20v-5h-5\"></path>",
      warning: "<path d=\"M10.3 3.6 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z\"></path><path d=\"M12 9v4M12 17h.01\"></path>",
      check: "<path d=\"m5 12 4 4L19 6\"></path>",
      info: "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 11v5M12 8h.01\"></path>",
      upload: "<path d=\"M12 16V4M7 9l5-5 5 5\"></path><path d=\"M5 20h14\"></path>",
      external: "<path d=\"M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5\"></path>",
      copy: "<rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path>",
      lock: "<rect x=\"4\" y=\"10\" width=\"16\" height=\"11\" rx=\"2\"></rect><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"></path>",
      logout: "<path d=\"M10 17l5-5-5-5M15 12H3\"></path><path d=\"M21 19V5a2 2 0 0 0-2-2h-6\"></path>",
      phone: "<path d=\"M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z\"></path>",
      file: "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z\"></path><path d=\"M14 2v6h6M8 13h8M8 17h6\"></path>",
      eye: "<path d=\"M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z\"></path><circle cx=\"12\" cy=\"12\" r=\"2\"></circle>"
    };
    return "<svg width=\"" + (size || 18) + "\" height=\"" + (size || 18) + "\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">" + (paths[name] || paths.info) + "</svg>";
  }

  function dateThai(value) {
    return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }) + " น.";
  }

  function shortDate(value) {
    return new Date(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
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
    if (window.location.hash === "#" + route) {
      render();
      return;
    }
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
      var searchText = [machine.name, machine.code, machine.address, machine.province, machine.district].join(" ").toLowerCase();
      return (!query || searchText.indexOf(query) !== -1)
        && (state.publicStatus === "all" || state.publicStatus === status.key)
        && (state.publicProvince === "all" || state.publicProvince === machine.province)
        && (state.publicDistrict === "all" || state.publicDistrict === machine.district);
    }).sort(function (a, b) {
      return Number(statusMeta(b).key === "available") - Number(statusMeta(a).key === "available");
    });
  }

  function renderBrand(route) {
    return "<button type=\"button\" class=\"brand\" data-route=\"" + esc(route || "home") + "\" aria-label=\"ไปหน้าแรก พร้อมปัน\"><span class=\"brand-mark\">" + icon("machine", 18) + "</span><span><strong>พร้อมปัน</strong><small>จุดแจกสิ่งของช่วยเหลือ</small></span></button>";
  }

  function renderPublicHeader() {
    return [
      "<header class=\"site-header\">",
      "  <div class=\"container site-header-inner\">",
      "    <div>" + renderBrand("home") + "</div>",
      "    <button type=\"button\" class=\"header-link\" data-route=\"admin-login\">" + icon("lock", 15) + " สำหรับผู้ดูแล</button>",
      "  </div>",
      "</header>"
    ].join("");
  }

  function renderStatus(status) {
    return "<span class=\"status status-" + esc(status.key) + "\"><span class=\"status-dot\"></span>" + esc(status.label) + "</span>";
  }

  function renderMachineCard(machine) {
    var status = statusMeta(machine);
    return [
      "<article class=\"machine-card\">",
      "  <div class=\"machine-card-main\">",
      "    <div class=\"machine-symbol\" aria-hidden=\"true\">" + icon("machine", 24) + "</div>",
      "    <div class=\"machine-card-copy\">",
      "      <div class=\"machine-card-label\"><span class=\"machine-code\">" + esc(machine.code) + "</span>" + renderStatus(status) + "</div>",
      "      <h3 class=\"text-balance\">" + esc(machine.name) + "</h3>",
      "      <p class=\"machine-address text-pretty\">" + icon("pin", 14) + "<span>" + esc(machine.district) + " · " + esc(machine.province) + "<br>" + esc(machine.address) + "</span></p>",
      "    </div>",
      "  </div>",
      "  <div class=\"machine-card-foot\"><div><span class=\"metric-label\">ชุดที่แจกได้</span><strong class=\"metric-number\">" + bundleCount(machine) + " <small>ชุด</small></strong></div><span class=\"last-updated\">" + icon("clock", 13) + " " + timeAgo(machine.lastUpdated) + "</span></div>",
      "  <div class=\"machine-card-action\"><button type=\"button\" class=\"text-button\" data-route=\"detail/" + esc(machine.code) + "\">ดูรายละเอียด " + icon("arrow", 14) + "</button></div>",
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
    var empty = "<div class=\"empty-state\"><span class=\"empty-icon\">" + icon("search", 20) + "</span><strong>ยังไม่พบจุดแจก</strong><p>ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองเพื่อดูทุกจุด</p><button type=\"button\" class=\"btn btn-secondary\" data-action=\"reset-filters\">ล้างตัวกรอง</button></div>";
    return [
      renderPublicHeader(),
      "<main class=\"page-main\"><div class=\"container\">",
      "  <section class=\"public-hero\"><p class=\"eyebrow\">ค้นหาได้ทันที ไม่ต้องเข้าสู่ระบบ</p><h1 class=\"text-balance\">หาจุดแจกที่พร้อมช่วยคุณ</h1><p class=\"hero-copy text-pretty\">เช็กสถานะและจำนวนชุดที่ยังแจกได้ก่อนออกเดินทาง</p></section>",
      "  <section class=\"search-surface\" aria-label=\"ค้นหาและกรองจุดแจก\">",
      "    <form class=\"search-form\" data-form=\"public-search\"><label class=\"sr-only\" for=\"public-search\">ค้นหาชื่อจุดแจก ที่อยู่ หรือรหัสเครื่อง</label><span class=\"search-icon\">" + icon("search", 19) + "</span><input id=\"public-search\" name=\"query\" value=\"" + esc(state.publicQuery) + "\" placeholder=\"ค้นหาชื่อจุดแจก ที่อยู่ หรือรหัสเครื่อง\" autocomplete=\"off\"><button type=\"submit\" class=\"btn btn-primary\">ค้นหา</button></form>",
      "    <div class=\"filter-row\"><div class=\"filter-field\"><label for=\"province-filter\">จังหวัด</label><select id=\"province-filter\" data-public-filter=\"province\"><option value=\"all\">ทุกจังหวัด</option>" + provinces.map(function (province) { return "<option value=\"" + esc(province) + "\" " + (state.publicProvince === province ? "selected" : "") + ">" + esc(province) + "</option>"; }).join("") + "</select></div><div class=\"filter-field\"><label for=\"district-filter\">อำเภอ</label><select id=\"district-filter\" data-public-filter=\"district\"><option value=\"all\">ทุกอำเภอ</option>" + districts.map(function (district) { return "<option value=\"" + esc(district) + "\" " + (state.publicDistrict === district ? "selected" : "") + ">" + esc(district) + "</option>"; }).join("") + "</select></div><div class=\"filter-field\"><label for=\"status-filter\">สถานะ</label><select id=\"status-filter\" data-public-filter=\"status\"><option value=\"all\">ทุกสถานะ</option><option value=\"available\" " + (state.publicStatus === "available" ? "selected" : "") + ">พร้อมแจก</option><option value=\"out\" " + (state.publicStatus === "out" ? "selected" : "") + ">ของหมด</option><option value=\"paused\" " + (state.publicStatus === "paused" ? "selected" : "") + ">ปิดชั่วคราว</option><option value=\"maintenance\" " + (state.publicStatus === "maintenance" ? "selected" : "") + ">ปิดซ่อมบำรุง</option></select></div><button type=\"button\" class=\"filter-reset\" data-action=\"reset-filters\">ล้างตัวกรอง</button></div>",
      "  </section>",
      "  <section class=\"public-summary\" aria-label=\"สรุปจุดแจก\"><div><strong class=\"tabular\">" + machines.length + "</strong><span>จุดที่แสดง</span></div><div><strong class=\"tabular\">" + available + "</strong><span>พร้อมแจก</span></div><div><strong class=\"tabular\">" + totalBundles + "</strong><span>ชุดรวม</span></div></section>",
      "  <section class=\"list-section\"><div class=\"section-heading\"><div><h2>จุดแจกทั้งหมด</h2><p class=\"text-pretty\">เรียงจุดที่พร้อมแจกไว้ก่อน เพื่อให้ตัดสินใจได้เร็วขึ้น</p></div><span class=\"result-count tabular\">" + machines.length + " จุด</span></div><div class=\"machine-grid\">" + (machines.length ? machines.map(renderMachineCard).join("") : empty) + "</div></section>",
      "</div></main>"
    ].join("");
  }

  function renderMap(machine) {
    return [
      "<div class=\"map-preview\" aria-label=\"แผนที่ตำแหน่ง " + esc(machine.name) + "\"><div class=\"leaflet-map\" data-map=\"true\" data-lat=\"" + esc(machine.lat) + "\" data-lng=\"" + esc(machine.lng) + "\" data-name=\"" + esc(machine.name) + "\"></div><div class=\"map-fallback\" aria-hidden=\"true\"><span class=\"map-water\"></span><span class=\"map-block block-a\"></span><span class=\"map-block block-b\"></span><span class=\"map-block block-c\"></span><span class=\"map-road road-a\"></span><span class=\"map-road road-b\"></span><span class=\"map-label\">จุดแจก</span><span class=\"map-marker\"></span></div></div>",
      "<div class=\"map-footer\"><span>แผนที่ OpenStreetMap</span><a class=\"text-button\" href=\"https://www.openstreetmap.org/?mlat=" + esc(machine.lat) + "&mlon=" + esc(machine.lng) + "#map=17/" + esc(machine.lat) + "/" + esc(machine.lng) + "\" target=\"_blank\" rel=\"noreferrer\">เปิดแผนที่ " + icon("external", 13) + "</a></div>"
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
      setTimeout(function () { map.invalidateSize(); }, 0);
    });
  }

  function renderDetail(machine) {
    var status = statusMeta(machine);
    var channels = machine.channels.filter(function (channel) { return channel.enabled && channel.name; });
    return [
      renderPublicHeader(),
      "<main class=\"page-main\"><div class=\"container\">",
      "  <div class=\"detail-back\"><button type=\"button\" class=\"back-button\" data-route=\"home\">" + icon("back", 17) + " กลับรายการจุดแจก</button></div>",
      "  <header class=\"detail-header\"><div><div class=\"machine-code\">" + esc(machine.code) + "</div><h1 class=\"text-balance\">" + esc(machine.name) + "</h1><p class=\"detail-subtitle text-pretty\">" + esc(machine.district) + " · " + esc(machine.province) + " · ให้บริการต่อเนื่องเมื่อพร้อมแจก</p></div><div class=\"detail-header-status\">" + renderStatus(status) + "<span class=\"last-updated\">" + icon("clock", 13) + " อัปเดต " + dateThai(machine.lastUpdated) + "</span></div></header>",
      "  <div class=\"detail-grid\"><div class=\"detail-main\">",
      "    <section class=\"availability-card\"><div><span class=\"eyebrow\">พร้อมแจกตอนนี้</span><strong class=\"availability-number tabular\">" + bundleCount(machine) + " <small>ชุด</small></strong><p class=\"text-pretty\">คำนวณจากรายการที่เหลือน้อยที่สุดในชุด</p></div><span class=\"availability-icon\">" + icon("check", 22) + "</span></section>",
      "    <section class=\"content-panel\"><div class=\"panel-heading\"><div><h2>สิ่งของในชุด</h2><p>จำนวนคงเหลือแยกตามช่องจ่าย</p></div></div><div class=\"supply-list\">" + (channels.length ? channels.map(function (channel) { return "<div class=\"supply-row\"><div class=\"supply-name\"><span class=\"supply-icon\">" + icon("machine", 16) + "</span><div><strong>" + esc(channel.name) + "</strong><small>ช่อง " + channel.number + " · หน่วย " + esc(channel.unit) + "</small></div></div><strong class=\"supply-count tabular\">" + channel.count + " <small>" + esc(channel.unit) + "</small></strong></div>"; }).join("") : "<div class=\"empty-inline\">ยังไม่มีรายการสิ่งของ</div>") + "</div></section>",
      (machine.notice ? "    <aside class=\"notice\"><span class=\"notice-icon\">" + icon("info", 17) + "</span><div><strong>ประกาศจากจุดแจก</strong><p class=\"text-pretty\">" + esc(machine.notice) + "</p></div></aside>" : ""),
      "  </div><aside class=\"detail-aside\"><section class=\"content-panel location-panel\"><div class=\"panel-heading\"><div><h2>ที่ตั้งจุดแจก</h2><p>กดเปิดแผนที่เพื่อดูตำแหน่งภายนอก</p></div></div>" + renderMap(machine) + "<div class=\"location-details\"><p>" + icon("pin", 16) + "<span>" + esc(machine.address) + "<br>" + esc(machine.district) + " · " + esc(machine.province) + "</span></p>" + (machine.contact ? "<p>" + icon("phone", 16) + "<a href=\"tel:" + esc(machine.contact.replace(/\s/g, "")) + "\">" + esc(machine.contact) + "</a></p>" : "") + "</div><button type=\"button\" class=\"btn btn-secondary btn-full\" data-action=\"copy-address\" data-machine=\"" + esc(machine.code) + "\">" + icon("copy", 15) + "คัดลอกที่อยู่</button></section></aside></div>",
      "</div></main>"
    ].join("");
  }

  function adminTopbar() {
    return [
      "<header class=\"admin-topbar\"><div class=\"admin-topbar-left\"><button type=\"button\" class=\"menu-toggle\" data-action=\"toggle-sidebar\" aria-label=\"เปิดเมนูผู้ดูแล\" aria-expanded=\"" + (state.sidebarOpen ? "true" : "false") + "\">" + icon("menu", 19) + "</button><div>" + renderBrand("admin-dashboard") + "</div><span class=\"prototype-badge\">พื้นที่ทดลอง</span></div><div class=\"admin-topbar-actions\"><span class=\"admin-user\">Admin</span><button type=\"button\" class=\"header-link\" data-action=\"logout\">" + icon("logout", 15) + " ออกจากระบบ</button></div></header>"
    ].join("");
  }

  function adminSidebar(active) {
    var unread = state.alerts.filter(function (alert) { return !alert.ack; }).length;
    var links = [
      { key: "dashboard", label: "ภาพรวม", route: "admin-dashboard", icon: "dashboard" },
      { key: "machines", label: "เครื่องแจก", route: "admin-machines", icon: "machine" },
      { key: "recipients", label: "ผู้มีสิทธิ์", route: "admin-recipients", icon: "people" },
      { key: "activity", label: "ประวัติการทำรายการ", route: "admin-activity", icon: "history" },
      { key: "device", label: "การเชื่อมต่อเครื่อง", route: "admin-device", icon: "settings" }
    ];
    return "<aside class=\"admin-sidebar " + (state.sidebarOpen ? "is-open" : "") + "\" aria-label=\"เมนูผู้ดูแล\"><div class=\"sidebar-label\">จัดการระบบ</div><nav>" + links.map(function (link) { return "<button type=\"button\" class=\"side-link " + (active === link.key ? "active" : "") + "\" data-route=\"" + link.route + "\">" + icon(link.icon, 17) + "<span>" + link.label + "</span>" + (link.key === "dashboard" && unread ? "<span class=\"side-count\">" + unread + "</span>" : "") + "</button>"; }).join("") + "</nav><div class=\"sidebar-note\"><span class=\"status-dot status-dot-online\"></span><div><strong>ระบบทำงานปกติ</strong><small>ข้อมูลตัวอย่างในเครื่องนี้</small></div></div></aside>" + (state.sidebarOpen ? "<button type=\"button\" class=\"sidebar-scrim\" data-action=\"toggle-sidebar\" aria-label=\"ปิดเมนู\"></button>" : "");
  }

  function adminShell(active, content) {
    return "<div class=\"admin-app\">" + adminTopbar() + "<div class=\"admin-workspace\">" + adminSidebar(active) + "<main class=\"admin-content\"><div class=\"admin-content-inner\">" + content + "</div></main></div>" + (state.modal ? renderModal() : "") + "</div>";
  }

  function adminTitle(title, subtitle, actions) {
    return "<div class=\"admin-page-title\"><div><p class=\"eyebrow\">พื้นที่ผู้ดูแล</p><h1 class=\"text-balance\">" + title + "</h1><p class=\"page-subtitle text-pretty\">" + subtitle + "</p></div><div class=\"page-actions\">" + (actions || "") + "</div></div>";
  }

  function metricCard(label, value, note, tone) {
    return "<article class=\"metric-card " + (tone || "") + "\"><span class=\"metric-label\">" + label + "</span><strong class=\"metric-number tabular\">" + value + "</strong><span class=\"metric-note\">" + note + "</span></article>";
  }

  function renderAlert(alert) {
    return "<div class=\"alert-row " + (alert.type === "danger" ? "alert-danger" : "") + "\"><span class=\"alert-icon\">" + icon(alert.type === "danger" ? "warning" : "info", 16) + "</span><div class=\"alert-copy\"><strong>" + esc(alert.title) + "</strong><p class=\"text-pretty\">" + esc(alert.text) + "</p>" + (alert.ack ? "<small>รับทราบแล้ว · รอแก้สาเหตุ</small>" : "") + "</div>" + (alert.ack ? "<span class=\"status status-ack\">รับทราบแล้ว</span>" : "<button type=\"button\" class=\"small-button\" data-action=\"ack-alert\" data-id=\"" + esc(alert.id) + "\">รับทราบ</button>") + "</div>";
  }

  function renderDistributionChart() {
    var max = Math.max.apply(null, state.distributions.map(function (item) { return item.count; }));
    return "<div class=\"distribution-chart\" aria-label=\"กราฟจำนวนผู้รับของ 7 วันล่าสุด\">" + state.distributions.map(function (item) { var height = Math.max(10, Math.round((item.count / max) * 112)); return "<div class=\"distribution-column\"><strong class=\"tabular\">" + item.count + "</strong><span class=\"distribution-bar\" style=\"--bar-height:" + height + "px\"></span><small>" + esc(item.date) + "</small></div>"; }).join("") + "</div><div class=\"chart-summary\"><span><strong class=\"tabular\">" + state.distributions[state.distributions.length - 1].count + "</strong> คนวันนี้</span><span>รวม " + state.distributions.reduce(function (sum, item) { return sum + item.count; }, 0) + " คน</span></div>";
  }

  function renderMachineTable(machines, compact) {
    return "<div class=\"table-wrap\"><table class=\"data-table\"><thead><tr><th>เครื่อง</th><th>สถานะบริการ</th><th>ชุดที่เหลือ</th><th>อัปเดต</th><th></th></tr></thead><tbody>" + machines.map(function (machine) { var status = statusMeta(machine); return "<tr><td><strong>" + esc(machine.name || "ยังไม่มีชื่อ") + "</strong><small>" + esc(machine.code) + " · " + esc(machine.province) + "</small></td><td>" + renderStatus(status) + "</td><td class=\"tabular\"><strong>" + bundleCount(machine) + " ชุด</strong></td><td><span class=\"device-state " + (machine.deviceStatus === "online" ? "online" : "offline") + "\">" + (machine.deviceStatus === "online" ? "ออนไลน์" : "ออฟไลน์") + "</span><small>" + timeAgo(machine.lastUpdated) + "</small></td><td class=\"table-actions\"><button type=\"button\" class=\"small-button\" data-route=\"admin-machine-edit/" + esc(machine.code) + "\">" + (compact ? "ดู" : "แก้ไข") + "</button>" + (compact ? "" : "<button type=\"button\" class=\"small-button secondary\" data-action=\"restock\" data-machine=\"" + esc(machine.code) + "\">สต็อก</button>") + "</td></tr>"; }).join("") + "</tbody></table></div>";
  }

  function renderDashboard() {
    var published = publishedMachines();
    var available = published.filter(function (machine) { return statusMeta(machine).key === "available"; }).length;
    var totalBundles = published.reduce(function (sum, machine) { return sum + bundleCount(machine); }, 0);
    var unread = state.alerts.filter(function (alert) { return !alert.ack; }).length;
    var attention = published.filter(function (machine) { return statusMeta(machine).key !== "available"; });
    return adminShell("dashboard", adminTitle("ภาพรวมระบบ", "ดูสิ่งที่ต้องจัดการก่อน แล้วค่อยลงรายละเอียด", "<button type=\"button\" class=\"btn btn-primary\" data-route=\"admin-machine-new\">" + icon("plus", 15) + " สร้างเครื่อง</button>") +
      "<section class=\"metric-grid\">" + metricCard("เครื่องที่เผยแพร่", published.length, "จากทั้งหมด " + state.machines.length + " เครื่อง", "") + metricCard("พร้อมแจก", available, "จากเครื่องที่เผยแพร่", "metric-good") + metricCard("ชุดที่แจกได้รวม", totalBundles, "คำนวณจากช่องที่น้อยที่สุด", "") + metricCard("ต้องจัดการ", unread, "alert ที่ยังไม่รับทราบ", "metric-alert") + "</section>" +
      "<section class=\"admin-grid\"><article class=\"panel priority-panel\"><div class=\"panel-heading\"><div><h2>ต้องจัดการก่อน</h2><p>เรื่องที่อาจกระทบการแจกของ</p></div><span class=\"panel-count tabular\">" + unread + " รายการ</span></div><div class=\"panel-body alert-list\">" + (state.alerts.length ? state.alerts.map(renderAlert).join("") : "<div class=\"empty-inline\">ไม่มี alert ที่ต้องจัดการ</div>") + "</div></article><article class=\"panel\"><div class=\"panel-heading\"><div><h2>จำนวนผู้รับของ</h2><p>นับเฉพาะการรับครบชุด</p></div><span class=\"panel-count\">7 วันล่าสุด</span></div><div class=\"panel-body\">" + renderDistributionChart() + "</div></article></section>" +
      "<section class=\"panel\"><div class=\"panel-heading\"><div><h2>เครื่องที่ควรตรวจสอบ</h2><p>แสดงเครื่องที่ไม่พร้อมแจกก่อน</p></div><button type=\"button\" class=\"text-button\" data-route=\"admin-machines\">ดูเครื่องทั้งหมด " + icon("arrow", 14) + "</button></div>" + (attention.length ? renderMachineTable(attention, false) : "<div class=\"panel-body empty-inline\">ทุกเครื่องพร้อมแจก</div>") + "</section>" +
      "<section class=\"panel\"><div class=\"panel-heading\"><div><h2>กิจกรรมล่าสุด</h2><p>การเปลี่ยนแปลงที่ผู้ดูแลทำในระบบ</p></div><button type=\"button\" class=\"text-button\" data-route=\"admin-activity\">ดูประวัติทั้งหมด " + icon("arrow", 14) + "</button></div><div class=\"activity-list\">" + state.activity.slice(0, 4).map(function (item) { return "<div class=\"activity-row\"><span class=\"activity-mark\"></span><div><strong>" + esc(item.action) + "</strong><p>" + esc(item.entity) + " · " + esc(item.detail) + "</p></div><small>" + timeAgo(item.time) + "</small></div>"; }).join("") + "</div></section>");
  }

  function renderMachines() {
    return adminShell("machines", adminTitle("เครื่องแจก", "จัดการสถานะ สต็อก และการเผยแพร่ของแต่ละจุด", "<button type=\"button\" class=\"btn btn-primary\" data-route=\"admin-machine-new\">" + icon("plus", 15) + " สร้างเครื่อง</button>") +
      "<section class=\"panel\"><div class=\"panel-heading\"><div><h2>เครื่องทั้งหมด</h2><p>เผยแพร่ " + publishedMachines().length + " · ฉบับร่าง/เก็บถาวร " + (state.machines.length - publishedMachines().length) + "</p></div><button type=\"button\" class=\"btn btn-secondary btn-sm\" data-action=\"export-machines\">" + icon("upload", 14) + " Export CSV</button></div>" + renderMachineTable(state.machines, false) + "</section>");
  }

  function field(label, name, value, type, required, hint) {
    return "<div class=\"field\"><label for=\"" + esc(name) + "\">" + label + (required ? " <span class=\"required\">*</span>" : "") + "</label><input id=\"" + esc(name) + "\" name=\"" + esc(name) + "\" type=\"" + (type || "text") + "\" value=\"" + esc(value) + "\" " + (required ? "required" : "") + ">" + (hint ? "<small>" + hint + "</small>" : "") + "</div>";
  }

  function renderMachineForm(machine) {
    var editing = Boolean(machine);
    var source = machine || { code: "สร้างอัตโนมัติ", name: "", province: "", district: "", address: "", lat: "", lng: "", contact: "", notice: "", lifecycle: "draft", serviceMode: "normal", channels: [
      { number: 1, name: "", unit: "ขวด", count: 0, capacity: 0, threshold: 0, enabled: true },
      { number: 2, name: "", unit: "กล่อง", count: 0, capacity: 0, threshold: 0, enabled: true },
      { number: 3, name: "", unit: "ชุด", count: 0, capacity: 0, threshold: 0, enabled: true }
    ] };
    return adminShell("machines", adminTitle(editing ? "แก้ไขเครื่อง" : "สร้างเครื่องใหม่", editing ? source.code + " · แก้ข้อมูลแล้วกดบันทึก" : "บันทึกเป็นฉบับร่างได้ ก่อนเผยแพร่ให้ประชาชน", "<button type=\"button\" class=\"btn btn-secondary\" data-route=\"admin-machines\">ยกเลิก</button>") +
      "<form class=\"editor-form\" data-form=\"machine\" data-code=\"" + (editing ? esc(source.code) : "") + "\"><div class=\"form-section\"><div class=\"form-section-heading\"><div><h2>ข้อมูลจุดแจก</h2><p>ข้อมูลที่ประชาชนจะเห็นบนหน้าแรก</p></div></div><div class=\"field-grid two\">" + field("ชื่อจุดแจก", "machine-name", source.name, "text", true) + field("จังหวัด", "machine-province", source.province, "text", true) + field("อำเภอ", "machine-district", source.district, "text", true) + field("เบอร์ติดต่อ", "machine-contact", source.contact, "tel", false) + "</div>" + field("ที่อยู่", "machine-address", source.address, "text", true) + "<div class=\"field-grid two\">" + field("ละติจูด", "machine-lat", source.lat, "number", true, "ตัวอย่าง 14.0692") + field("ลองจิจูด", "machine-lng", source.lng, "number", true, "ตัวอย่าง 100.6475") + "</div>" + field("ประกาศถึงผู้รับของ", "machine-notice", source.notice, "text", false, "เช่น กรุณานำบัตรประชาชนตัวจริงมาด้วย") + "</div>" +
      "<div class=\"form-section\"><div class=\"form-section-heading\"><div><h2>สถานะการให้บริการ</h2><p>การปิดซ่อมจะแสดงบนหน้า public ทันที</p></div></div><div class=\"field-grid two\"><div class=\"field\"><label for=\"machine-lifecycle\">การเผยแพร่</label><select id=\"machine-lifecycle\" name=\"machine-lifecycle\"><option value=\"draft\" " + (source.lifecycle === "draft" ? "selected" : "") + ">ฉบับร่าง</option><option value=\"published\" " + (source.lifecycle === "published" ? "selected" : "") + ">เผยแพร่</option><option value=\"archived\" " + (source.lifecycle === "archived" ? "selected" : "") + ">เก็บถาวร</option></select></div><div class=\"field\"><label for=\"machine-service\">สถานะบริการ</label><select id=\"machine-service\" name=\"machine-service\"><option value=\"normal\" " + (source.serviceMode === "normal" ? "selected" : "") + ">เปิดตามปกติ</option><option value=\"paused\" " + (source.serviceMode === "paused" ? "selected" : "") + ">ปิดชั่วคราว</option><option value=\"maintenance\" " + (source.serviceMode === "maintenance" ? "selected" : "") + ">ปิดซ่อมบำรุง</option></select></div></div></div>" +
      "<div class=\"form-section\"><div class=\"form-section-heading\"><div><h2>สิ่งของในชุด</h2><p>อย่างน้อยหนึ่งช่องต้องมีชื่อ หน่วย และความจุ</p></div></div>" + source.channels.map(function (channel) { return "<div class=\"channel-editor\"><div class=\"channel-editor-title\"><strong>ช่อง " + channel.number + "</strong><span class=\"machine-code\">ยอดปัจจุบัน " + channel.count + " " + esc(channel.unit) + "</span></div><div class=\"field-grid three\">" + field("ชื่อสิ่งของ", "channel-" + channel.number + "-name", channel.name, "text", false) + "<div class=\"field\"><label for=\"channel-" + channel.number + "-unit\">หน่วย</label><select id=\"channel-" + channel.number + "-unit\" name=\"channel-" + channel.number + "-unit\"><option value=\"ขวด\" " + (channel.unit === "ขวด" ? "selected" : "") + ">ขวด</option><option value=\"กล่อง\" " + (channel.unit === "กล่อง" ? "selected" : "") + ">กล่อง</option><option value=\"ชุด\" " + (channel.unit === "ชุด" ? "selected" : "") + ">ชุด</option><option value=\"ชิ้น\" " + (channel.unit === "ชิ้น" ? "selected" : "") + ">ชิ้น</option></select></div>" + field("ความจุ", "channel-" + channel.number + "-capacity", channel.capacity, "number", false) + "</div></div>"; }).join("") + "</div>" + (state.formError ? "<div class=\"form-error\" role=\"alert\">" + icon("warning", 15) + " " + esc(state.formError) + "</div>" : "") + "<div class=\"form-actions\"><button type=\"button\" class=\"btn btn-secondary\" data-route=\"admin-machines\">ยกเลิก</button><button type=\"submit\" class=\"btn btn-primary\">" + (editing ? "บันทึกการเปลี่ยนแปลง" : "สร้างเครื่อง") + "</button></div></form>");
  }

  function renderRecipients() {
    return adminShell("recipients", adminTitle("ผู้มีสิทธิ์รับของ", "จัดการรายชื่อที่ใช้ตรวจสิทธิ์รายวัน · เลขบัตรแสดงแบบปิดบัง", "<button type=\"button\" class=\"btn btn-primary\" data-action=\"open-csv\">" + icon("upload", 15) + " นำเข้า CSV</button>") +
      "<section class=\"panel\"><div class=\"panel-heading\"><div><h2>รายชื่อในระบบ</h2><p>ทั้งหมด " + state.recipients.length + " คน · ใช้งาน " + state.recipients.filter(function (person) { return person.active; }).length + " คน</p></div><button type=\"button\" class=\"btn btn-secondary btn-sm\" data-action=\"export-recipients\">Export CSV</button></div><div class=\"table-wrap\"><table class=\"data-table recipient-table\"><thead><tr><th>ชื่อ</th><th>เลขบัตร</th><th>สถานะ</th><th>อัปเดต</th><th></th></tr></thead><tbody>" + state.recipients.map(function (person) { return "<tr><td><strong>" + esc(person.name) + "</strong></td><td class=\"code-text\">" + esc(person.citizenId) + "</td><td><span class=\"status " + (person.active ? "status-available" : "status-draft") + "\"><span class=\"status-dot\"></span>" + (person.active ? "ใช้งาน" : "ปิดสิทธิ์") + "</span></td><td>" + shortDate(person.updated) + "</td><td class=\"table-actions\"><button type=\"button\" class=\"small-button\" data-action=\"toggle-recipient\" data-id=\"" + person.id + "\">" + (person.active ? "ปิดสิทธิ์" : "เปิดสิทธิ์") + "</button></td></tr>"; }).join("") + "</tbody></table></div></section>");
  }

  function renderActivity() {
    return adminShell("activity", adminTitle("ประวัติการทำรายการ", "บันทึกที่แก้ไขไม่ได้ของการเปลี่ยนแปลงในระบบ", "<button type=\"button\" class=\"btn btn-secondary\" data-action=\"export-activity\">" + icon("upload", 15) + " Export CSV</button>") +
      "<section class=\"panel\"><div class=\"panel-heading\"><div><h2>รายการล่าสุด</h2><p>แสดงเวลา ผู้ทำรายการ และรายละเอียดที่จำเป็น</p></div><span class=\"panel-count\">" + state.activity.length + " รายการ</span></div><div class=\"activity-list activity-page-list\">" + state.activity.map(function (item) { return "<div class=\"activity-row\"><span class=\"activity-mark\"></span><div><strong>" + esc(item.action) + "</strong><p>" + esc(item.entity) + " · " + esc(item.detail) + "</p><small>ผู้ทำรายการ: " + esc(item.actor) + " · " + dateThai(item.time) + "</small></div><span class=\"activity-date\">" + shortDate(item.time) + "</span></div>"; }).join("") + "</div></section>");
  }

  function renderDevice() {
    var synced = state.device.planVersion === state.device.appliedPlanVersion && state.device.eligibilityVersion === state.device.appliedEligibilityVersion && state.device.stockRevision === state.device.appliedStockRevision;
    return adminShell("device", adminTitle("การเชื่อมต่อเครื่อง", "ดู heartbeat และ revision ที่เครื่องนำไปใช้งานจริง", "<button type=\"button\" class=\"btn btn-primary\" data-action=\"sync-device\">" + icon("refresh", 15) + " จำลอง sync</button>") +
      "<section class=\"device-overview\"><div><span class=\"device-state " + (state.device.status === "online" ? "online" : "offline") + "\">" + (state.device.status === "online" ? "ออนไลน์" : "ออฟไลน์") + "</span><h2>" + esc(state.device.code) + "</h2><p>last seen " + dateThai(state.device.lastSeen) + " · client " + esc(state.device.client) + "</p></div><span class=\"device-icon\">" + icon("machine", 28) + "</span></section>" +
      "<section class=\"admin-grid\"><article class=\"panel\"><div class=\"panel-heading\"><div><h2>สถานะ revision</h2><p>งานที่แก้ใน Admin จะรอจนเครื่อง sync</p></div><span class=\"status " + (synced ? "status-available" : "status-paused") + "\"><span class=\"status-dot\"></span>" + (synced ? "ตรงกัน" : "รอ sync") + "</span></div><div class=\"revision-list\"><div><span>แผนการแจก</span><strong class=\"tabular\">v" + state.device.appliedPlanVersion + " / v" + state.device.planVersion + "</strong></div><div><span>รายชื่อผู้มีสิทธิ์</span><strong class=\"tabular\">v" + state.device.appliedEligibilityVersion + " / v" + state.device.eligibilityVersion + "</strong></div><div><span>สต็อก</span><strong class=\"tabular\">r" + state.device.appliedStockRevision + " / r" + state.device.stockRevision + "</strong></div></div></article><article class=\"panel\"><div class=\"panel-heading\"><div><h2>ทดสอบการทำงาน</h2><p>จำลอง report จากเครื่องหนึ่งรอบ</p></div></div><div class=\"panel-body\"><div class=\"device-test\"><p>รายงานแจกสำเร็จสะสม <strong class=\"tabular\">" + state.device.reports + "</strong> ครั้ง</p><button type=\"button\" class=\"btn btn-secondary\" data-action=\"device-report\">รับ report จำลอง</button></div></div></article></section>" +
      "<section class=\"panel\"><div class=\"panel-heading\"><div><h2>ค่าตั้งสำหรับ ESP32</h2><p>คัดลอกไปใช้ในไฟล์ตั้งค่าได้ · secret ไม่แสดงใน prototype</p></div><button type=\"button\" class=\"btn btn-secondary btn-sm\" data-action=\"copy-device-settings\">" + icon("copy", 14) + " คัดลอก</button></div><div class=\"settings-code\"><code>API_BASE_URL=https://your-project.vercel.app/api/device/v1</code><code>DEVICE_CODE=" + esc(state.device.code) + "</code><code>DEVICE_SHARED_SECRET=จาก Vercel env</code></div></section>");
  }

  function renderLogin() {
    return "<main class=\"login-view\"><section class=\"login-card\"><div class=\"login-brand\">" + renderBrand("home") + "</div><p class=\"eyebrow\">พื้นที่ผู้ดูแล</p><h1 class=\"text-balance\">เข้าสู่ระบบจัดการ</h1><p class=\"login-copy text-pretty\">จัดการเครื่องแจก สต็อก และรายชื่อผู้มีสิทธิ์จากที่เดียว</p>" + (state.loginError ? "<div class=\"form-error\" role=\"alert\">" + icon("warning", 15) + " " + esc(state.loginError) + "</div>" : "") + "<form data-form=\"login\"><div class=\"field\"><label for=\"login-username\">ชื่อผู้ใช้</label><input id=\"login-username\" name=\"username\" autocomplete=\"username\" required></div><div class=\"field\"><label for=\"login-password\">รหัสผ่าน</label><input id=\"login-password\" name=\"password\" type=\"password\" autocomplete=\"current-password\" required></div><button type=\"submit\" class=\"btn btn-primary btn-full\">เข้าสู่ระบบ</button></form><div class=\"login-hint\"><strong>Prototype credential</strong><span>ชื่อผู้ใช้ <code>admin</code> · รหัสผ่าน <code>admin</code></span></div><button type=\"button\" class=\"text-button back-home\" data-route=\"home\">" + icon("back", 14) + " กลับหน้าค้นหาจุดแจก</button></section></main>";
  }

  function renderModal() {
    if (state.modal === "stock") {
      var machine = findMachine(state.modalMachine);
      return "<dialog class=\"modal-dialog\" open aria-labelledby=\"stock-dialog-title\"><div class=\"modal-card\"><div class=\"modal-header\"><div><p class=\"eyebrow\">อัปเดต ledger</p><h2 id=\"stock-dialog-title\">ปรับสต็อก</h2><p>" + esc(machine ? machine.name : "") + "</p></div><button type=\"button\" class=\"icon-button\" data-action=\"close-modal\" aria-label=\"ปิดหน้าต่าง\">" + icon("close", 17) + "</button></div>" + (state.modalError ? "<div class=\"form-error\" role=\"alert\">" + icon("warning", 15) + " " + esc(state.modalError) + "</div>" : "") + "<form data-form=\"stock\"><input type=\"hidden\" name=\"machine\" value=\"" + esc(state.modalMachine) + "\"><div class=\"field\"><label for=\"stock-channel\">ช่องจ่าย</label><select id=\"stock-channel\" name=\"channel\">" + (machine ? machine.channels.map(function (channel) { return "<option value=\"" + channel.number + "\">ช่อง " + channel.number + " · " + esc(channel.name || "ยังไม่ตั้งชื่อ") + " · เหลือ " + channel.count + "</option>"; }).join("") : "") + "</select></div><div class=\"field\"><label for=\"stock-action\">ประเภทการเปลี่ยน</label><select id=\"stock-action\" name=\"action\"><option value=\"refill\">เติมสินค้า</option><option value=\"adjust\">ปรับยอดจากการตรวจนับ</option></select></div><div class=\"field\"><label for=\"stock-amount\">จำนวนใหม่ / จำนวนที่เติม</label><input id=\"stock-amount\" name=\"amount\" type=\"number\" min=\"0\" value=\"10\" required></div><div class=\"field\"><label for=\"stock-reason\">เหตุผล</label><textarea id=\"stock-reason\" name=\"reason\" placeholder=\"เช่น เติมของรอบเช้า / ตรวจนับหน้างาน\" required></textarea></div><div class=\"form-actions\"><button type=\"button\" class=\"btn btn-secondary\" data-action=\"close-modal\">ยกเลิก</button><button type=\"submit\" class=\"btn btn-primary\">บันทึกสต็อก</button></div></form></div></dialog>";
    }
    if (state.modal === "csv") {
      return "<dialog class=\"modal-dialog\" open aria-labelledby=\"csv-dialog-title\"><div class=\"modal-card\"><div class=\"modal-header\"><div><p class=\"eyebrow\">รายชื่อผู้มีสิทธิ์</p><h2 id=\"csv-dialog-title\">นำเข้า CSV</h2><p>ตรวจ preview ก่อนยืนยันทุกครั้ง</p></div><button type=\"button\" class=\"icon-button\" data-action=\"close-modal\" aria-label=\"ปิดหน้าต่าง\">" + icon("close", 17) + "</button></div><div class=\"callout\"><strong>รูปแบบไฟล์</strong><p>citizen_id,name · ระบบจะนำเข้าเฉพาะแถวที่ตรวจผ่าน</p></div><div class=\"field\"><label for=\"csv-file\">เลือกไฟล์ CSV</label><input id=\"csv-file\" type=\"file\" accept=\".csv,text/csv\"><small>Prototype นี้จำลองผลการตรวจเพื่อให้เห็น flow</small></div>" + (state.csvPreview ? "<div class=\"csv-preview\"><div><strong>ผลตรวจไฟล์</strong><span class=\"status status-available\"><span class=\"status-dot\"></span>พร้อมนำเข้า 3 แถว</span></div><p class=\"text-pretty\">ผ่าน 3 แถว · ไม่ผ่าน 1 แถว (เลขไม่ครบ)</p></div>" : "") + "<div class=\"form-actions\"><button type=\"button\" class=\"btn btn-secondary\" data-action=\"close-modal\">ยกเลิก</button>" + (state.csvPreview ? "<button type=\"button\" class=\"btn btn-primary\" data-action=\"confirm-csv\">นำเข้า 3 แถว</button>" : "<button type=\"button\" class=\"btn btn-primary\" data-action=\"preview-csv\">ตรวจและดู preview</button>") + "</div></div></dialog>";
    }
    return "";
  }

  function paint(html) {
    root.innerHTML = html;
    mountMaps();
  }

  function render() {
    var route = getRoute();
    var adminRoutes = ["admin-dashboard", "admin-machines", "admin-machine-new", "admin-machine-edit", "admin-recipients", "admin-activity", "admin-device"];
    if (route.name === "admin-login" && state.adminAuth) {
      go("admin-dashboard");
      return;
    }
    if (adminRoutes.indexOf(route.name) !== -1 && !state.adminAuth) {
      paint(renderLogin());
      return;
    }
    if (route.name === "admin-login") {
      paint(renderLogin());
      return;
    }
    if (route.name === "detail") {
      var machine = findMachine(route.id);
      paint(machine && machine.lifecycle === "published" ? renderDetail(machine) : renderHome());
      return;
    }
    if (route.name === "admin-dashboard") paint(renderDashboard());
    else if (route.name === "admin-machines") paint(renderMachines());
    else if (route.name === "admin-machine-new") paint(renderMachineForm(null));
    else if (route.name === "admin-machine-edit") paint(renderMachineForm(findMachine(route.id)));
    else if (route.name === "admin-recipients") paint(renderRecipients());
    else if (route.name === "admin-activity") paint(renderActivity());
    else if (route.name === "admin-device") paint(renderDevice());
    else paint(renderHome());
  }

  function addActivity(action, entity, detail) {
    state.activity.unshift({ time: new Date().toISOString(), action: action, entity: entity, detail: detail, actor: "admin" });
  }

  function saveMachine(form) {
    var values = new FormData(form);
    var name = String(values.get("machine-name") || "").trim();
    var province = String(values.get("machine-province") || "").trim();
    var district = String(values.get("machine-district") || "").trim();
    var address = String(values.get("machine-address") || "").trim();
    var lat = Number(values.get("machine-lat"));
    var lng = Number(values.get("machine-lng"));
    var old = findMachine(form.getAttribute("data-code")) || { channels: [] };
    var channels = [1, 2, 3].map(function (number) {
      var existing = old.channels.find(function (channel) { return channel.number === number; }) || {};
      return { number: number, name: String(values.get("channel-" + number + "-name") || "").trim(), unit: String(values.get("channel-" + number + "-unit") || "ชิ้น"), count: Number(existing.count) || 0, capacity: Number(values.get("channel-" + number + "-capacity")) || 0, threshold: Number(existing.threshold) || 0, enabled: true };
    });
    var hasSupply = channels.some(function (channel) { return channel.name && channel.capacity > 0; });
    if (!name || !province || !district || !address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      state.formError = "กรอกชื่อ ที่อยู่ จังหวัด อำเภอ และพิกัดให้ครบก่อนบันทึก";
      render();
      return;
    }
    if (!hasSupply) {
      state.formError = "เพิ่มสิ่งของอย่างน้อยหนึ่งช่อง พร้อมระบุความจุมากกว่า 0";
      render();
      return;
    }
    var code = form.getAttribute("data-code");
    var machine = code ? findMachine(code) : null;
    if (machine) {
      machine.name = name;
      machine.province = province;
      machine.district = district;
      machine.address = address;
      machine.lat = lat;
      machine.lng = lng;
      machine.contact = String(values.get("machine-contact") || "").trim();
      machine.notice = String(values.get("machine-notice") || "").trim();
      machine.lifecycle = String(values.get("machine-lifecycle"));
      machine.serviceMode = String(values.get("machine-service"));
      machine.channels = channels;
      machine.lastUpdated = new Date().toISOString();
      machine.pendingSync = true;
      addActivity("แก้ไขเครื่อง", machine.code, "อัปเดตข้อมูลจุดแจก");
      toastMessage("บันทึกการเปลี่ยนแปลงแล้ว", "success");
    } else {
      var newCode = "DSP-" + String(state.machines.length + 1).padStart(4, "0");
      state.machines.push({ code: newCode, name: name, province: province, district: district, address: address, lat: lat, lng: lng, contact: String(values.get("machine-contact") || "").trim(), notice: String(values.get("machine-notice") || "").trim(), lifecycle: String(values.get("machine-lifecycle")), serviceMode: String(values.get("machine-service")), lastUpdated: new Date().toISOString(), deviceStatus: "offline", pendingSync: true, channels: channels });
      addActivity("สร้างเครื่อง", newCode, name);
      toastMessage("สร้างเครื่อง " + newCode + " แล้ว", "success");
    }
    state.formError = "";
    state.device.stockRevision += 1;
    go("admin-machines");
    render();
  }

  function handleSubmit(event) {
    var form = event.target;
    if (!form.matches("form")) return;
    event.preventDefault();
    if (form.getAttribute("data-form") === "public-search") {
      state.publicQuery = String(new FormData(form).get("query") || "").trim();
      render();
      return;
    }
    if (form.getAttribute("data-form") === "login") {
      var values = new FormData(form);
      if (values.get("username") === "admin" && values.get("password") === "admin") {
        state.adminAuth = true;
        state.loginError = "";
        go("admin-dashboard");
        toastMessage("เข้าสู่ระบบสำเร็จ", "success");
      } else {
        state.loginError = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
        render();
      }
      return;
    }
    if (form.getAttribute("data-form") === "machine") {
      saveMachine(form);
      return;
    }
    if (form.getAttribute("data-form") === "stock") {
      var values = new FormData(form);
      var machine = findMachine(values.get("machine"));
      var channel = machine && machine.channels.find(function (item) { return String(item.number) === String(values.get("channel")); });
      var amount = Number(values.get("amount"));
      var action = values.get("action");
      var nextCount = action === "adjust" ? amount : (channel ? channel.count + amount : amount);
      if (!machine || !channel || !Number.isFinite(amount) || amount < 0 || nextCount > channel.capacity) {
        state.modalError = "ยอดต้องอยู่ระหว่าง 0 ถึงความจุของช่องจ่าย";
        render();
        return;
      }
      channel.count = nextCount;
      machine.lastUpdated = new Date().toISOString();
      machine.pendingSync = true;
      state.device.stockRevision += 1;
      addActivity(action === "adjust" ? "ปรับยอดสต็อก" : "เติมสินค้า", machine.code + " · " + (channel.name || "ช่อง " + channel.number), String(values.get("reason") || "อัปเดตสต็อก"));
      state.modal = null;
      state.modalError = "";
      toastMessage("บันทึกสต็อกแล้ว · รอเครื่อง sync", "success");
      render();
    }
  }

  function handleClick(event) {
    var target = event.target.closest ? event.target.closest("[data-route], [data-action]") : null;
    if (!target) return;
    var route = target.getAttribute("data-route");
    var action = target.getAttribute("data-action");
    if (route) {
      event.preventDefault();
      if (route === "admin-machine-new") state.formError = "";
      go(route);
      render();
      return;
    }
    if (action === "toggle-sidebar") {
      state.sidebarOpen = !state.sidebarOpen;
      render();
    } else if (action === "logout") {
      state.adminAuth = false;
      state.sidebarOpen = false;
      go("home");
      toastMessage("ออกจากระบบแล้ว", "success");
      render();
    } else if (action === "reset-filters") {
      state.publicQuery = "";
      state.publicStatus = "all";
      state.publicProvince = "all";
      state.publicDistrict = "all";
      render();
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
        toastMessage("รับทราบแล้ว · alert จะยังอยู่จนกว่าสาเหตุจะหาย", "success");
        render();
      }
    } else if (action === "restock") {
      state.modal = "stock";
      state.modalMachine = target.getAttribute("data-machine");
      state.modalError = "";
      render();
    } else if (action === "close-modal") {
      state.modal = null;
      state.modalError = "";
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
        toastMessage("รับ report แจกสำเร็จแล้ว · stock อัปเดต", "success");
      } else {
        toastMessage("เครื่องไม่มีชุดที่พร้อมแจก", "error");
      }
      render();
    } else if (action === "copy-device-settings") {
      if (navigator.clipboard) navigator.clipboard.writeText("API_BASE_URL=https://your-project.vercel.app/api/device/v1\nDEVICE_CODE=DSP-0001\nDEVICE_SHARED_SECRET=จาก Vercel env");
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
    if (event.key === "Escape" && state.modal) {
      state.modal = null;
      state.modalError = "";
      state.csvPreview = false;
      render();
    }
  });
  window.addEventListener("hashchange", render);
  window.addEventListener("load", mountMaps);
  render();
})();
