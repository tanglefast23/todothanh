import type { Task } from "@/types/tasks";
import { performInitialLoad } from "@/lib/supabase/sync/initialLoad";
import { useOwnerStore } from "@/stores/ownerStore";
import { usePermissionsStore } from "@/stores/permissionsStore";
import { useRunningTabStore } from "@/stores/runningTabStore";
import { useScheduledEventsStore } from "@/stores/scheduledEventsStore";
import { useTagsStore } from "@/stores/tagsStore";
import { useTasksStore } from "../tasksStore";
import {
  deleteTask as deleteTaskFromSupabase,
  fetchAllTasks,
  upsertTasks,
} from "@/lib/supabase/queries/tasks";

jest.mock("@/lib/supabase/queries/tasks", () => ({
  fetchAllTasks: jest.fn(),
  upsertTasks: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

jest.mock("@/lib/supabase/queries/tags", () => ({
  fetchTags: jest.fn(),
  syncTags: jest.fn(),
}));

jest.mock("@/lib/supabase/queries/owners", () => ({
  fetchOwners: jest.fn(),
  syncOwners: jest.fn(),
}));

jest.mock("@/lib/supabase/queries/permissions", () => ({
  fetchAllPermissions: jest.fn(),
  upsertPermissions: jest.fn(),
}));

jest.mock("@/lib/supabase/queries/runningTab", () => ({
  fetchRunningTab: jest.fn(),
  upsertTab: jest.fn(),
}));

jest.mock("@/lib/supabase/queries/expenses", () => ({
  fetchAllExpenses: jest.fn(),
  upsertExpenses: jest.fn(),
}));

jest.mock("@/lib/supabase/queries/tabHistory", () => ({
  fetchRecentTabHistory: jest.fn(),
  upsertHistory: jest.fn(),
}));

jest.mock("@/lib/supabase/queries/scheduled-events", () => ({
  fetchAllScheduledEvents: jest.fn(),
  upsertScheduledEvents: jest.fn(),
}));

jest.mock("@/lib/supabase/queries/storage", () => ({
  deleteAttachment: jest.fn(),
}));

const completedTask: Task = {
  id: "task-1",
  title: "Float cigarettes",
  priority: "urgent",
  createdBy: "owner-1",
  createdAt: "2026-04-01T00:00:00.000Z",
  completedBy: "owner-1",
  completedAt: "2026-04-02T00:00:00.000Z",
  status: "completed",
  attachmentUrl: null,
  updatedAt: "2026-04-02T00:00:00.000Z",
};

const cloudTask: Task = {
  ...completedTask,
  id: "task-2",
  title: "mua gao",
};

describe("tasks store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    useTasksStore.setState({ tasks: [completedTask] });
    useTagsStore.setState({ tags: [] });
    useOwnerStore.setState({ owners: [] });
    usePermissionsStore.setState({ permissions: {} });
    useRunningTabStore.setState({ tab: null, expenses: [], history: [] });
    useScheduledEventsStore.setState({ events: [] });

    jest.mocked(upsertTasks).mockResolvedValue(undefined);

    jest
      .mocked(jest.requireMock("@/lib/supabase/queries/tags").fetchTags)
      .mockResolvedValue([]);
    jest
      .mocked(jest.requireMock("@/lib/supabase/queries/owners").fetchOwners)
      .mockResolvedValue([]);
    jest
      .mocked(jest.requireMock("@/lib/supabase/queries/permissions").fetchAllPermissions)
      .mockResolvedValue([]);
    jest
      .mocked(jest.requireMock("@/lib/supabase/queries/runningTab").fetchRunningTab)
      .mockResolvedValue(null);
    jest
      .mocked(jest.requireMock("@/lib/supabase/queries/expenses").fetchAllExpenses)
      .mockResolvedValue([]);
    jest
      .mocked(jest.requireMock("@/lib/supabase/queries/tabHistory").fetchRecentTabHistory)
      .mockResolvedValue([]);
    jest
      .mocked(jest.requireMock("@/lib/supabase/queries/scheduled-events").fetchAllScheduledEvents)
      .mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps a deleted task removed when Supabase delete succeeds", async () => {
    jest.mocked(deleteTaskFromSupabase).mockResolvedValue(undefined);

    useTasksStore.getState().deleteTask(completedTask.id);

    expect(useTasksStore.getState().tasks).toEqual([]);

    await Promise.resolve();
    await Promise.resolve();

    expect(useTasksStore.getState().tasks).toEqual([]);
  });

  it("uses fetched cloud tasks instead of re-pushing stale local-only tasks", async () => {
    jest.mocked(fetchAllTasks).mockResolvedValue([cloudTask]);

    await performInitialLoad();

    expect(useTasksStore.getState().tasks).toEqual([cloudTask]);
    expect(upsertTasks).not.toHaveBeenCalled();
  });
});
