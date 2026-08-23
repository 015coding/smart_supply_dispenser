import { beforeEach, describe, expect, it } from "vitest";
import { serviceDayFor } from "@/lib/domain/date";
import { store } from "@/lib/server/store";

const validChannels = [
  { number: 1, supplyName: "น้ำดื่ม", unit: "ขวด", capacity: 20, balance: 5, lowStockThreshold: 2, enabled: true },
  { number: 2, supplyName: "อาหารพร้อมทาน", unit: "กล่อง", capacity: 20, balance: 5, lowStockThreshold: 2, enabled: true }
];

async function publishedDispenser() {
  const dispenser = await store.createDispenser({
    name: "ศูนย์พักพิงคลองสอง",
    address: "ลานอเนกประสงค์",
    province: "ปทุมธานี",
    district: "คลองหลวง",
    latitude: 14.0692,
    longitude: 100.6475,
    channels: validChannels
  });
  return store.publishDispenser(dispenser.code);
}

describe("memory application store seams", () => {
  beforeEach(() => store.reset());

  it("keeps incomplete dispensers as drafts until publish validation passes", async () => {
    const draft = await store.createDispenser({ name: "จุดใหม่" });
    await expect(store.publishDispenser(draft.code)).rejects.toMatchObject({ code: "validation_error" });
    await store.updateDispenser(draft.code, {
      address: "อาคารชุมชน",
      province: "ปทุมธานี",
      district: "คลองหลวง",
      latitude: 14.1,
      longitude: 100.6,
      channels: validChannels
    });
    const published = await store.publishDispenser(draft.code);
    expect(published.lifecycle).toBe("published");
    expect(published.plans[0]?.effectiveServiceDay).toBe(serviceDayFor());
  });

  it("updates stock, opens a low-stock alert, and resolves it after refill", async () => {
    const dispenser = await publishedDispenser();
    const movement = await store.createStockMovement(dispenser.code, { channelNumber: 1, type: "adjustment", targetBalance: 2, reason: "ตรวจนับหน้างาน" });
    expect(movement.balanceAfter).toBe(2);
    expect((await store.listAlerts()).some((alert) => alert.type === "low_stock")).toBe(true);
    await store.createStockMovement(dispenser.code, { channelNumber: 1, type: "refill", amount: 10 });
    expect((await store.listAlerts()).some((alert) => alert.type === "low_stock")).toBe(false);
    expect((await store.getDeviceState(dispenser.code)).stockPendingSync).toBe(true);
  });

  it("enforces recipient privacy and report idempotency through the device seam", async () => {
    const dispenser = await publishedDispenser();
    const recipient = await store.createRecipient({ citizenId: "1101700201601", name: "คุณสายฝน" });
    const serviceDay = serviceDayFor();
    await expect(store.authorizeDevice(dispenser.code, { citizenId: "1101700201602", serviceDay, localTime: "2026-08-23T15:30:00" })).resolves.toMatchObject({ allowed: false, reason: "not_found" });
    await expect(store.authorizeDevice(dispenser.code, { citizenId: "1101700201601", serviceDay, localTime: "2026-08-23T15:30:00" })).resolves.toMatchObject({ allowed: true, reason: "eligible" });

    const first = await store.recordDeviceReport(dispenser.code, {
      reportId: 18,
      serviceDay,
      localTime: "2026-08-23T15:31:05",
      citizenId: "1101700201601",
      outcome: "complete",
      channels: [{ number: 1, result: "success", countAfter: 4 }, { number: 2, result: "success", countAfter: 4 }],
      errors: []
    });
    const duplicate = await store.recordDeviceReport(dispenser.code, {
      reportId: 18,
      serviceDay,
      localTime: "2026-08-23T15:31:05",
      citizenId: "1101700201601",
      outcome: "complete",
      channels: [{ number: 1, result: "success", countAfter: 4 }, { number: 2, result: "success", countAfter: 4 }],
      errors: []
    });
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.stockRevision).toBe(first.stockRevision);
    expect(recipient.citizenIdCiphertext).not.toContain("1101700201601");
    await expect(store.authorizeDevice(dispenser.code, { citizenId: "1101700201601", serviceDay, localTime: "2026-08-23T15:32:00" })).resolves.toMatchObject({ allowed: false, reason: "already_received" });
  });

  it("previews and commits only valid CSV rows idempotently", async () => {
    const preview = await store.previewEligibilityImport("citizen_id,name\n1101700201601,คุณสายฝน\n123,ข้อมูลไม่ครบ\n");
    expect(preview.validCount).toBe(1);
    expect(preview.invalidCount).toBe(1);
    const committed = await store.commitEligibilityImport(String(preview.id));
    expect(committed.committedCount).toBe(1);
    const repeated = await store.commitEligibilityImport(String(preview.id));
    expect(repeated.committedCount).toBe(1);
    const recipients = await store.listRecipients({});
    expect(recipients.pagination.total).toBe(1);
    expect(await store.getRecipient(String(recipients.items[0]?.id))).toMatchObject({ name: "คุณสายฝน" });
  });

  it("includes recipient names in the device eligibility snapshot", async () => {
    const dispenser = await publishedDispenser();
    await store.createRecipient({ citizenId: "1101700201601", name: "คุณสายฝน" });
    const snapshot = await store.eligibilitySnapshot(dispenser.code, 1);
    expect(snapshot.body).toContain("citizen_id,name");
    expect(snapshot.body).toContain("1101700201601,คุณสายฝน");
  });

  it("counts each accepted device report once on the dashboard received day", async () => {
    const dispenser = await publishedDispenser();
    const report = {
      reportId: 7,
      serviceDay: "2020-01-01",
      localTime: "2020-01-01T00:00:00+07:00",
      citizenId: "0000000000001",
      outcome: "failed" as const,
      channels: [],
      errors: ["test report"]
    };
    await store.recordDeviceReport(dispenser.code, report);
    await store.recordDeviceReport(dispenser.code, report);

    const dashboard = await store.dashboard({ range: "7d" }) as { deviceReportChart: Array<{ serviceDay: string; reportCount: number }> };
    expect(dashboard.deviceReportChart.reduce((total, item) => total + item.reportCount, 0)).toBe(1);
    expect(dashboard.deviceReportChart.find((item) => item.serviceDay === serviceDayFor())?.reportCount).toBe(1);
  });
});
