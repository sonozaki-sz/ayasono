describe("shared/utils/prisma", () => {
  it("loads module", async () => {
    const module = await import("@/shared/utils/prisma");
    expect(module).toBeDefined();
  });
});
