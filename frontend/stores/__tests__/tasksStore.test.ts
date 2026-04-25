import type { Task } from "@/types/tasks";
import { useTasksStore } from "../tasksStore";
import { deleteTask as deleteTaskFromSupabase } from "@/lib/supabase/queries/tasks";

jest.mock("@/lib/supabase/queries/tasks", () => ({
  upsertTasks: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
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

describe("tasks store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTasksStore.setState({ tasks: [completedTask] });
  });

  it("keeps a deleted task removed when Supabase delete succeeds", async () => {
    jest.mocked(deleteTaskFromSupabase).mockResolvedValue(undefined);

    useTasksStore.getState().deleteTask(completedTask.id);

    expect(useTasksStore.getState().tasks).toEqual([]);

    await Promise.resolve();
    await Promise.resolve();

    expect(useTasksStore.getState().tasks).toEqual([]);
  });
});
