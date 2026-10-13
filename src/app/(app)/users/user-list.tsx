"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE } from "@/lib/page-size";
import { Plus, Trash2, Shield, User } from "lucide-react";
import { createUser, deleteUser, updateUserRole } from "./actions";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

const OFFLINE = "We couldn't reach the server. The user wasn't created; check your connection and try again.";

type Role = "ADMIN" | "STAFF";

const roleLabels: Record<Role, string> = { ADMIN: "Admin", STAFF: "Staff" };

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface UserListProps {
  users: UserData[];
  total: number;
  pages: number;
  currentPage: number;
  /** The signed-in admin; their own row can't be deleted or demoted. */
  currentUserId: string;
}

export function UserList({ users, total, pages, currentPage, currentUserId }: UserListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<{ message: string; field?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [roleChange, setRoleChange] = useState<{ user: UserData; role: Role } | null>(null);
  const { addToast } = useToast();

  function openCreate() {
    setFormError(null);
    setShowCreateDialog(true);
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    const form = e.currentTarget;

    setIsLoading(true);
    setFormError(null);
    try {
      const result = await createUser(new FormData(form));
      if (result.error) {
        setFormError({ message: result.error, field: result.field });
        if (result.field) (form.elements.namedItem(result.field) as HTMLElement | null)?.focus();
        return;
      }
      addToast("User created successfully", "success");
      setShowCreateDialog(false);
    } catch {
      setFormError({ message: OFFLINE });
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmDelete(): Promise<string | null> {
    if (!deleteTarget) return null;
    const result = await deleteUser(deleteTarget.id);
    if (result.error) return result.error;
    addToast(`${deleteTarget.name} deleted`, "success");
    return null;
  }

  async function confirmRoleChange(): Promise<string | null> {
    if (!roleChange) return null;
    const result = await updateUserRole(roleChange.user.id, roleChange.role);
    if (result.error) return result.error;
    addToast(`${roleChange.user.name} is now ${roleLabels[roleChange.role]}`, "success");
    return null;
  }

  const errorFor = (field: string) => (formError?.field === field ? "user-error" : undefined);

  const renderControls = (user: UserData, isSelf: boolean) => (
    <div className="flex items-center justify-end gap-2">
      {/* Controlled: the value only changes once the confirmation succeeds */}
      <Select
        aria-label={`Role for ${user.name}`}
        value={user.role}
        disabled={isSelf}
        title={isSelf ? "You can't change your own role" : undefined}
        onChange={(e) => setRoleChange({ user, role: e.target.value as Role })}
        className="w-28"
      >
        <option value="ADMIN">Admin</option>
        <option value="STAFF">Staff</option>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${user.name}`}
        title={isSelf ? "You can't delete your own account" : "Delete"}
        disabled={isSelf}
        className="text-destructive hover:text-destructive"
        onClick={() => setDeleteTarget(user)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );

  const roleBadge = (user: UserData) => (
    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="shrink-0">
      {user.role === "ADMIN" ? (
        <Shield className="h-3 w-3 mr-1" aria-hidden />
      ) : (
        <User className="h-3 w-3 mr-1" aria-hidden />
      )}
      {roleLabels[user.role as Role] ?? user.role}
    </Badge>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Team Members</CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {/* md and up: table */}
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="max-w-[16rem] break-words font-medium">
                      {user.name}
                      {isSelf && <span className="font-normal text-muted-foreground"> (you)</span>}
                    </TableCell>
                    <TableCell className="max-w-[16rem] break-all text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {roleBadge(user)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderControls(user, isSelf)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>

          {/* Below md: one stacked row per person, so the role and delete controls stay within reach */}
          <ul className="divide-y divide-border md:hidden">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <li key={user.id} className="space-y-3 py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">
                        {user.name}
                        {isSelf && <span className="font-normal text-muted-foreground"> (you)</span>}
                      </p>
                      <p className="break-all text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
                    </div>
                    {roleBadge(user)}
                  </div>
                  {renderControls(user, isSelf)}
                </li>
              );
            })}
          </ul>

          <Pagination
            basePath="/users"
            currentPage={currentPage}
            pages={pages}
            total={total}
            pageSize={PAGE_SIZE}
            className="border-t pt-3 mt-1"
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !isLoading && setShowCreateDialog(open)}>
        <DialogContent onClose={() => !isLoading && setShowCreateDialog(false)}>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                name="name"
                required
                autoFocus
                autoComplete="off"
                maxLength={120}
                placeholder="John Doe"
                aria-invalid={formError?.field === "name" ? true : undefined}
                aria-describedby={errorFor("name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                maxLength={254}
                placeholder="john@example.com"
                aria-invalid={formError?.field === "email" ? true : undefined}
                aria-describedby={errorFor("email")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                placeholder="Min. 6 characters"
                aria-invalid={formError?.field === "password" ? true : undefined}
                aria-describedby={errorFor("password")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select id="user-role" name="role" defaultValue="STAFF">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <p className="text-xs text-muted-foreground">Admins can also manage users.</p>
            </div>
            {formError && (
              <p id="user-error" role="alert" className="text-sm text-destructive">
                {formError.message}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete user"
        description={
          <>
            Delete <span className="font-medium text-foreground">{deleteTarget?.name}</span> (
            {deleteTarget?.email})? They will no longer be able to sign in. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        destructive
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={!!roleChange}
        onOpenChange={(open) => !open && setRoleChange(null)}
        title="Change role"
        description={
          roleChange && (
            <>
              Make <span className="font-medium text-foreground">{roleChange.user.name}</span>{" "}
              {roleChange.role === "ADMIN"
                ? "an admin? They will be able to add, remove and change the role of users."
                : "staff? They will lose access to user management."}
            </>
          )
        }
        confirmLabel={roleChange ? `Make ${roleLabels[roleChange.role]}` : "Confirm"}
        pendingLabel="Saving..."
        onConfirm={confirmRoleChange}
      />
    </>
  );
}
