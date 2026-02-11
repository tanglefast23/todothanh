"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Key,
  Users,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useOwnerStore } from "@/stores/ownerStore";

export function OwnerManagement() {
  const {
    owners,
    addOwner,
    removeOwner,
    updateOwnerName,
    setOwnerMaster,
    changeOwnerPassword,
    setOwnerPassword,
  } = useOwnerStore();

  // Add owner dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPassword, setNewOwnerPassword] = useState("");
  const [newOwnerConfirmPassword, setNewOwnerConfirmPassword] = useState("");
  const [newOwnerIsMaster, setNewOwnerIsMaster] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Change password dialog state
  const [changePasswordOwner, setChangePasswordOwner] = useState<{ id: string; name: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPasswordChange, setShowNewPasswordChange] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirmOwner, setDeleteConfirmOwner] = useState<{ id: string; name: string } | null>(null);

  // Edit name state
  const [editingOwner, setEditingOwner] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");

  // Promote to admin dialog state (for passwordless users)
  const [promoteOwnerTarget, setPromoteOwnerTarget] = useState<{ id: string; name: string } | null>(null);
  const [promotePassword, setPromotePassword] = useState("");
  const [promoteConfirmPassword, setPromoteConfirmPassword] = useState("");
  const [showPromotePassword, setShowPromotePassword] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const handleAddOwner = useCallback(async () => {
    if (!newOwnerName.trim()) {
      setAddError("Please enter a name");
      return;
    }
    if (!newOwnerPassword) {
      setAddError("Please enter a password");
      return;
    }
    if (newOwnerPassword !== newOwnerConfirmPassword) {
      setAddError("Passwords do not match");
      return;
    }
    if (newOwnerPassword.length < 4) {
      setAddError("Password must be at least 4 characters");
      return;
    }

    await addOwner(newOwnerName.trim(), newOwnerPassword, newOwnerIsMaster);

    // Reset form
    setNewOwnerName("");
    setNewOwnerPassword("");
    setNewOwnerConfirmPassword("");
    setNewOwnerIsMaster(false);
    setShowNewPassword(false);
    setAddError(null);
    setIsAddDialogOpen(false);
  }, [newOwnerName, newOwnerPassword, newOwnerConfirmPassword, newOwnerIsMaster, addOwner]);

  const handleChangePassword = useCallback(async () => {
    if (!changePasswordOwner) return;

    if (!currentPassword) {
      setChangePasswordError("Please enter current password");
      return;
    }
    if (!newPassword) {
      setChangePasswordError("Please enter new password");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      setChangePasswordError("Password must be at least 4 characters");
      return;
    }

    const success = await changeOwnerPassword(changePasswordOwner.id, currentPassword, newPassword);
    if (!success) {
      setChangePasswordError("Current password is incorrect");
      return;
    }

    // Reset form
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCurrentPassword(false);
    setShowNewPasswordChange(false);
    setChangePasswordError(null);
    setChangePasswordOwner(null);
  }, [changePasswordOwner, currentPassword, newPassword, confirmNewPassword, changeOwnerPassword]);

  const handleDeleteOwner = useCallback((id: string) => {
    removeOwner(id);
    setDeleteConfirmOwner(null);
  }, [removeOwner]);

  const handleSaveEditName = useCallback(() => {
    if (editingOwner && editName.trim()) {
      updateOwnerName(editingOwner.id, editName.trim());
    }
    setEditingOwner(null);
    setEditName("");
  }, [editingOwner, editName, updateOwnerName]);

  const handleMasterToggle = useCallback((owner: { id: string; name: string; isMaster?: boolean; passwordHash?: string }) => {
    if (owner.isMaster) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Owner Profiles
        </CardTitle>
        <CardDescription>
          Manage owner profiles and passwords.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Owner List */}
        {owners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No owner profiles yet</p>
            <p className="text-sm">Create an owner profile</p>
          </div>
        ) : (
          <div className="space-y-2">
            {owners.map((owner) => (
              <div
                key={owner.id}
                className="rounded-xl border transition-all duration-200 p-4 bg-muted/20 border-border/50"
              >
                <div className="flex items-center justify-between">
                  {/* Owner Info */}
                  <div className="flex items-center gap-3">
                    {owner.isMaster ? (
                      <ShieldCheck className="h-5 w-5 text-amber-500" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      {editingOwner?.id === owner.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEditName()}
                          onBlur={handleSaveEditName}
                          autoFocus
                          className="h-7 w-40"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{owner.name}</span>
                          {owner.isMaster && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                              Master
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Master Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMasterToggle(owner)}
                        title={owner.isMaster ? "Remove master access" : "Grant master access"}
                        className={cn("h-8 w-8 p-0", owner.isMaster && "text-amber-500")}
                      >
                        {owner.isMaster ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Edit Name */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingOwner({ id: owner.id, name: owner.name });
                          setEditName(owner.name);
                        }}
                        title="Edit name"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Change Password */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChangePasswordOwner({ id: owner.id, name: owner.name })}
                        title="Change password"
                        className="h-8 w-8 p-0"
                      >
                        <Key className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmOwner({ id: owner.id, name: owner.name })}
                        title="Delete owner"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Button>
        </div>

        {/* Add Owner Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setNewOwnerName("");
            setNewOwnerPassword("");
            setNewOwnerConfirmPassword("");
            setNewOwnerIsMaster(false);
            setShowNewPassword(false);
            setAddError(null);
          }
        }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add Owner Profile</DialogTitle>
              <DialogDescription>
                Create a new owner with a password.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="owner-name">Name</Label>
                <Input
                  id="owner-name"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="e.g., Joe, Leonard"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-password">Password</Label>
                <div className="relative">
                  <Input
                    id="owner-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newOwnerPassword}
                    onChange={(e) => setNewOwnerPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-confirm-password">Confirm Password</Label>
                <Input
                  id="owner-confirm-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newOwnerConfirmPassword}
                  onChange={(e) => setNewOwnerConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="owner-master">Master Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Can manage all users and permissions
                  </p>
                </div>
                <Switch
                  id="owner-master"
                  checked={newOwnerIsMaster}
                  onCheckedChange={setNewOwnerIsMaster}
                />
              </div>

              {addError && (
                <p className="text-sm text-destructive">{addError}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOwner}>
                Create Owner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={!!changePasswordOwner} onOpenChange={(open) => {
          if (!open) {
            setChangePasswordOwner(null);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setShowCurrentPassword(false);
            setShowNewPasswordChange(false);
            setChangePasswordError(null);
          }
        }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Change password for {changePasswordOwner?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPasswordChange ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordChange(!showNewPasswordChange)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showNewPasswordChange ? "Hide password" : "Show password"}
                  >
                    {showNewPasswordChange ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type={showNewPasswordChange ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {changePasswordError && (
                <p className="text-sm text-destructive">{changePasswordError}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setChangePasswordOwner(null)}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword}>
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmOwner} onOpenChange={(open) => !open && setDeleteConfirmOwner(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Owner</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{deleteConfirmOwner?.name}&rdquo;?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOwner(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmOwner && handleDeleteOwner(deleteConfirmOwner.id)}
              >
                Delete Owner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

      </CardContent>
    </Card>
  );
}
