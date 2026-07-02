/**
 * Supabase queries for todo_owners table
 * NOTE: This TODO app uses a SEPARATE todo_owners table from the investment tracker's owners table
 * This allows both apps to share the same Supabase database with independent user lists
 */
import { getSupabaseClient } from "../client";
import type { Database } from "@/types/database";

// Use todo_owners table for this TODO app
type Owner = Database["public"]["Tables"]["todo_owners"]["Row"];
type OwnerInsert = Database["public"]["Tables"]["todo_owners"]["Insert"];
type OwnerUpdate = Database["public"]["Tables"]["todo_owners"]["Update"];

export async function fetchOwners(): Promise<Owner[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("todo_owners")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching todo_owners:", error);
    throw error;
  }

  return (data as Owner[]) || [];
}

export async function createOwner(owner: OwnerInsert): Promise<Owner> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("todo_owners")
    .insert(owner as never)
    .select()
    .single();

  if (error) {
    console.error("Error creating todo_owner:", error);
    throw error;
  }

  return data as Owner;
}

export async function updateOwner(id: string, updates: OwnerUpdate): Promise<Owner> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("todo_owners")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating todo_owner:", error);
    throw error;
  }

  return data as Owner;
}

export async function deleteOwner(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("todo_owners")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting todo_owner:", error);
    throw error;
  }
}

// Bulk sync: upsert all todo_owners (NON-destructive, by id).
//
// This used to delete-all-then-reinsert, which fired on every owner change
// AND on every focus refresh (the pull re-triggers this push). Deleting owner
// rows cascades the FK rules from migration 007 — ON DELETE SET NULL on
// tasks/expenses/tab_history/running_tab created_by/approved_by/etc., and
// ON DELETE CASCADE on app_permissions — silently wiping all attribution and
// every permission grant. Upsert-by-id preserves those rows. Deletions are
// propagated separately via deleteOwner() from the store.
export async function syncOwners(owners: OwnerInsert[]): Promise<void> {
  if (owners.length === 0) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("todo_owners")
    .upsert(owners as never, { onConflict: "id" });

  if (error) {
    console.error("Error upserting todo_owners:", error);
    throw error;
  }
}
