const vacPanelModalHandlerMock = { name: "vac-modal" };
const stickyMessageSetModalHandlerMock = { name: "sticky-message-set-modal" };

vi.mock("@/bot/features/vac/handlers/ui/vacPanelModal", () => ({
  vacPanelModalHandler: vacPanelModalHandlerMock,
}));
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler",
  () => ({
    stickyMessageSetModalHandler: stickyMessageSetModalHandlerMock,
  }),
);

describe("bot/handlers/interactionCreate/ui/modals", () => {
  it("exports modal handlers", async () => {
    const { modalHandlers } =
      await import("@/bot/handlers/interactionCreate/ui/modals");

    expect(modalHandlers).toEqual([
      vacPanelModalHandlerMock,
      stickyMessageSetModalHandlerMock,
    ]);
  });
});
