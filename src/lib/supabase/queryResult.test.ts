import {
  requireSupabaseData,
  requireSupabaseResult,
} from "./queryResult";

describe("requireSupabaseData", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns data when the result succeeds", () => {
    expect(
      requireSupabaseData({ data: "ok", error: null }, "Unable to load")
    ).toBe("ok");
  });

  it("throws the fallback instead of the raw Supabase error", () => {
    expect(() =>
      requireSupabaseData(
        { data: null, error: { message: "violates constraint foo_bar" } },
        "Unable to load"
      )
    ).toThrow("Unable to load");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Supabase request failed",
      "violates constraint foo_bar"
    );
  });

  it("throws the fallback when required data is null", () => {
    expect(() =>
      requireSupabaseData({ data: null, error: null }, "Unable to load")
    ).toThrow("Unable to load");
  });
});

describe("requireSupabaseResult", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("allows nullable successful data", () => {
    expect(
      requireSupabaseResult({ data: null, error: null }, "Unable to load")
    ).toBeNull();
  });

  it("throws the fallback for errors", () => {
    expect(() =>
      requireSupabaseResult(
        { data: null, error: { message: "permission denied for table" } },
        "Unable to load"
      )
    ).toThrow("Unable to load");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Supabase request failed",
      "permission denied for table"
    );
  });
});
