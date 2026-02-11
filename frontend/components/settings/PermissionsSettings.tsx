"use client";

import { useState, useCallback } from "react";
import { useOwnerStore } from "@/stores/ownerStore";
import { usePermissionsStore } from "@/stores/permissionsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatorAvatar } from "@/components/tasks/CreatorAvatar";
import { Shield, CheckCircle, Wallet, Trash2, Eye, EyeOff } from "lucide-react";

export function PermissionsSettings() {
  const owners = useOwnerStore((state) => state.owners);
  const setOwnerMaster = useOwnerStore((state) => state.setOwnerMaster);
  const setOwnerPassword = useOwnerStore((state) => state.setOwnerPassword);
  const removeOwner = useOwnerStore((state) => state.removeOwner);
  const getActiveOwnerId = useOwnerStore((state) => state.getActiveOwnerId);
  const isMasterLoggedIn = useOwnerStore((state) => state.isMasterLoggedIn);
  const permissions = usePermissionsStore((state) => state.permissions);
  const setCanApproveExpenses = usePermissionsStore((state) => state.setCanApproveExpenses);
  const initializePermissions = usePermissionsStore((state) => state.initializePermissions);

  // Delete user state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>("");

  // Promote to admin dialog state (for passwordless users)
  const [promoteOwnerTarget, setPromoteOwnerTarget] = useState<{ id: string; name: string } | null>(null);
  const [promotePassword, setPromotePassword] = useState("");
  const [promoteConfirmPassword, setPromoteConfirmPassword] = useState("");
  const [showPromotePassword, setShowPromotePassword] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const currentUserId = getActiveOwnerId();
  const isAdmin = isMasterLoggedIn();

  // Check if there are any admins at all (bootstrap case)
  const hasAnyAdmin = owners.some((owner) => owner.isMaster);

  // Handle delete user
  const handleDeleteClick = (userId: string, userName: string) => {
    setDeleteUserId(userId);
    setDeleteUserName(userName);
  };

  const handleDeleteConfirm = () => {
    if (deleteUserId) {
      removeOwner(deleteUserId);
      setDeleteUserId(null);
      setDeleteUserName("");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteUserId(null);
    setDeleteUserName("");
  };

  // Handle admin toggle - check if password needed when promoting
  const handleAdminToggle = useCallback((owner: { id: string; name: string; isMaster?: boolean; passwordHash?: string }, checked: boolean) => {
    if (!checked) {
      // Demoting from admin - no password needed
      setOwnerMaster(owner.id, false);
    } else {
      // Promoting to admin - check if they need a password
      const hasPassword = owner.passwordHash && owner.passwordHash !== "";
      if (hasPassword) {
        // Already has a password, just promote
        setOwnerMaster(owner.id, true);
      } else {
        // Needs a password - show dialog
        setPromoteOwnerTarget({ id: owner.id, name: owner.name });
        setPromotePassword("");
        setPromoteConfirmPassword("");
        setPromoteError(null);
      }
    }
  }, [setOwnerMaster]);

  const handlePromoteWithPassword = useCallback(async () => {
    if (!promoteOwnerTarget) return;

    if (!promotePassword) {
      setPromoteError("Please enter a password");
      return;
    }
    if (promotePassword !== promoteConfirmPassword) {
      setPromoteError("Passwords do not match");
      return;
    }
    if (promotePassword.length < 4) {
      setPromoteError("Password must be at least 4 characters");
      return;
    }

    // Set the password and make them admin
    await setOwnerPassword(promoteOwnerTarget.id, promotePassword);
    setOwnerMaster(promoteOwnerTarget.id, true);

    // Reset form
    setPromotePassword("");
    setPromoteConfirmPassword("");
    setShowPromotePassword(false);
    setPromoteError(null);
    setPromoteOwnerTarget(null);
  }, [promoteOwnerTarget, promotePassword, promoteConfirmPassword, setOwnerPassword, setOwnerMaster]);

  // Ensure permissions exist for all non-master users
  owners.forEach((owner) => {
    if (!owner.isMaster && !permissions[owner.id]) {
      initializePermissions(owner.id);
    }
  });

  if (owners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Accounts & Permissions</CardTitle>
          <CardDescription>
            No users found. Create an account first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Accounts & Permissions</CardTitle>
        <CardDescription>
          {!hasAnyAdmin ? (
            <span className="text-amber-600">
              No admins exist. Toggle admin privileges on any account to bootstrap.
            </span>
          ) : (
            "View all accounts and configure permissions. Admins have full access to all features."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {owners.map((owner) => {
          const userPerms = permissions[owner.id];
          const isCurrentUser = owner.id === currentUserId;

          return (
            <div key={owner.id} className="space-y-4 pb-4 border-b last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreatorAvatar name={owner.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{owner.name}</span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {owner.isMaster ? (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">User</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {/* Delete button - only for admins, can't delete self or other admins */}
                {isAdmin && !isCurrentUser && !owner.isMaster && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteClick(owner.id, owner.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Permissions summary / controls */}
              <div className="grid gap-3 pl-11">
                {/* Admin toggle - can't remove your own admin status */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`admin-${owner.id}`} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-500" />
                      <span>Admin Privileges</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-normal">
                      Full access to all features, settings, and user management
                    </span>
                  </Label>
                  <Switch
                    id={`admin-${owner.id}`}
                    checked={owner.isMaster}
                    onCheckedChange={(checked) => handleAdminToggle(owner, checked)}
                    disabled={
                      // Can toggle if: (isAdmin AND not self) OR (no admins exist - bootstrap)
                      !(isAdmin && !isCurrentUser) && hasAnyAdmin
                    }
                  />
                </div>

                {/* Show individual permissions for non-admins */}
                {!owner.isMaster && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`complete-${owner.id}`} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Complete Tasks</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-normal">
                          All users can complete tasks
                        </span>
                      </Label>
                      <Badge variant="outline" className="text-green-600">Always On</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`approve-${owner.id}`} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-blue-500" />
                          <span>Approve Expenses</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-normal">
                          Allow this user to approve or reject expense submissions
                        </span>
                      </Label>
                      <Switch
                        id={`approve-${owner.id}`}
                        checked={userPerms?.canApproveExpenses ?? false}
                        onCheckedChange={(checked) => setCanApproveExpenses(owner.id, checked)}
                      />
                    </div>
                  </>
                )}

                {/* Show all permissions enabled for admins */}
                {owner.isMaster && (
                  <div className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-lg">
                    <p className="font-medium text-amber-700 mb-1">Admin Access</p>
                    <ul className="space-y-1 text-amber-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" /> Complete tasks
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" /> Approve expenses
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" /> Initialize running tab
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" /> Manage users & permissions
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={deleteUserId !== null}
        onOpenChange={(open) => !open && handleDeleteCancel()}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteUserName}"? This will permanently remove their account. Any tasks or expenses they created will remain but show them as the creator.`}
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      {/* Promote to Admin Password Dialog */}
      <Dialog open={!!promoteOwnerTarget} onOpenChange={(open) => {
        if (!open) {
          setPromoteOwnerTarget(null);
          setPromotePassword("");
          setPromoteConfirmPassword("");
          setPromoteError(null);
          setShowPromotePassword(false);
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Set Password for {promoteOwnerTarget?.name}</DialogTitle>
            <DialogDescription>
              Admin accounts require a password. Please create a password for this user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="promote-password">Password</Label>
              <div className="relative">
                <Input
                  id="promote-password"
                  type={showPromotePassword ? "text" : "password"}
                  value={promotePassword}
                  onChange={(e) => {
                    setPromotePassword(e.target.value);
                    setPromoteError(null);
                  }}
                  placeholder="Enter password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPromotePassword(!showPromotePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPromotePassword ? "Hide password" : "Show password"}
                >
                  {showPromotePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promote-confirm-password">Confirm Password</Label>
              <Input
                id="promote-confirm-password"
                type={showPromotePassword ? "text" : "password"}
                value={promoteConfirmPassword}
                onChange={(e) => {
                  setPromoteConfirmPassword(e.target.value);
                  setPromoteError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePromoteWithPassword();
                  }
                }}
                placeholder="Confirm password"
              />
            </div>

            {promoteError && (
              <p className="text-sm text-destructive">{promoteError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteOwnerTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handlePromoteWithPassword}>
              Set Password & Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
