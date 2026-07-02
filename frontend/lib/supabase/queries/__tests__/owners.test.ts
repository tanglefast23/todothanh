/**
 * Regression tests for todo_owners sync behavior.
 *
 * Guards the fix for the data-integrity bug where syncOwners deleted every
 * owner row (cascading FK SET NULL / CASCADE across tasks, expenses,
 * tab_history, running_tab and app_permissions) on every owner change and
 * every focus refresh. syncOwners must now be a non-destructive upsert, and
 * deletions must go through deleteOwner.
 */
import { syncOwners, deleteOwner } from "../owners";
import { getSupabaseClient } from "../../client";

jest.mock("../../client", () => ({
  getSupabaseClient: jest.fn(),
}));

type MockClient = {
  upsert: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  from: jest.Mock;
};

function makeClient(): MockClient {
  const client: Partial<MockClient> = {};
  client.upsert = jest.fn().mockResolvedValue({ error: null });
  client.eq = jest.fn().mockResolvedValue({ error: null });
  client.neq = jest.fn().mockResolvedValue({ error: null });
  client.delete = jest.fn().mockReturnValue({ eq: client.eq, neq: client.neq });
  client.from = jest.fn().mockReturnValue(client);
  return client as MockClient;
}

describe("syncOwners", () => {
  it("upserts owners and never deletes rows", async () => {
    const client = makeClient();
    (getSupabaseClient as jest.Mock).mockReturnValue(client);

    await syncOwners([
      { id: "a", name: "Joe", password_hash: "h", is_master: true },
      { id: "b", name: "Thanh", password_hash: "", is_master: false },
    ] as never);

    expect(client.from).toHaveBeenCalledWith("todo_owners");
    expect(client.upsert).toHaveBeenCalledTimes(1);
    expect(client.upsert).toHaveBeenCalledWith(expect.any(Array), { onConflict: "id" });
    // The destructive delete-all path must be gone.
    expect(client.delete).not.toHaveBeenCalled();
  });

  it("does nothing (no delete) when given an empty owner list", async () => {
    const client = makeClient();
    (getSupabaseClient as jest.Mock).mockReturnValue(client);

    await syncOwners([]);

    expect(client.upsert).not.toHaveBeenCalled();
    expect(client.delete).not.toHaveBeenCalled();
  });
});

describe("deleteOwner", () => {
  it("deletes a single owner by id", async () => {
    const client = makeClient();
    (getSupabaseClient as jest.Mock).mockReturnValue(client);

    await deleteOwner("a");

    expect(client.from).toHaveBeenCalledWith("todo_owners");
    expect(client.delete).toHaveBeenCalledTimes(1);
    expect(client.eq).toHaveBeenCalledWith("id", "a");
  });
});
