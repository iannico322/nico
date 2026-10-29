import { useEffect, useState } from "react";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import { TableSkeleton } from "./Skeleton";
import Modal from "../../components/ui/modal";
import { userService, AdminUser, UserFormPayload } from "./userService";
import { officeService, Office } from "./officeService";

const ACC_LEVELS = [
  { value: 0, label: "Admin" },
  { value: 1, label: "Manager" },
  { value: 2, label: "Staff" },
  { value: 3, label: "User" },
];

const emptyForm: UserFormPayload = {
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  position: "",
  office: 0,
  acc_lvl: 3,
  is_active: true,
  is_staff: false,
};

const UserPage = () => {
  const [loading, setLoading]   = useState(true);
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [offices, setOffices]   = useState<Office[]>([]);
  const [search, setSearch]     = useState("");
  const [error, setError]       = useState<string | null>(null);

  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<AdminUser | null>(null);
  const [form, setForm]               = useState<UserFormPayload>(emptyForm);
  const [formErrors, setFormErrors]   = useState<Record<string, string>>({});
  const [saving, setSaving]           = useState(false);
  const [openMenuId, setOpenMenuId]   = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userList, officeList] = await Promise.all([
          userService.list(),
          officeService.list(),
        ]);
        setUsers(userList);
        setOffices(officeList);
      } catch (err: unknown) {
        setError(
          axios.isAxiosError(err) && err.response?.status === 403
            ? "You do not have permission to view users."
            : "Failed to load users. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = users.filter(
    (u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const officeName = (id: number | null) =>
    offices.find((o) => o.officeID === id)?.name ?? "—";

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, office: offices[0]?.officeID ?? 0 });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setForm({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: "",
      position: user.position,
      office: user.office ?? 0,
      acc_lvl: user.acc_lvl,
      is_active: user.is_active,
      is_staff: user.is_staff,
    });
    setFormErrors({});
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (user: AdminUser) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this user?",
      text: `${user.first_name} ${user.last_name} will be permanently removed.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    });
    if (!result.isConfirmed) return;

    try {
      await userService.remove(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      Swal.fire({
        icon: "success",
        title: "User deleted",
        timer: 1200,
        showConfirmButton: false,
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail ?? "Failed to delete user."
        : "Failed to delete user.";
      Swal.fire({ icon: "error", title: "Error", text: msg });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    const payload: UserFormPayload = { ...form };
    if (editing && !payload.password) {
      delete payload.password;
    }

    try {
      if (editing) {
        const updated = await userService.update(editing.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === editing.id ? updated : u)));
      } else {
        const created = await userService.create(payload);
        setUsers((prev) => [...prev, created]);
      }
      setModalOpen(false);
      Swal.fire({
        icon: "success",
        title: editing ? "User updated" : "User created",
        timer: 1200,
        showConfirmButton: false,
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      });
    } catch (err: unknown) {
      const data = axios.isAxiosError(err) ? err.response?.data : undefined;
      if (data && typeof data === "object") {
        const mapped: Record<string, string> = {};
        Object.entries(data).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? (val as string[]).join(" ") : String(val);
        });
        setFormErrors(mapped);
      } else {
        setFormErrors({ non_field: "Failed to save user. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Users" subtitle="Manage system users">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:flex-col sm:items-stretch">
        <div className="relative flex-1 max-w-xs sm:max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Table / Skeleton */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className="bg-card border border-border rounded-xl">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border bg-muted/40 rounded-t-xl slg:grid-cols-[2fr_1fr_auto]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide slg:hidden">Office</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</p>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No users found.
            </div>
          ) : (
            filtered.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-0 last:rounded-b-xl items-center hover:bg-accent/40 transition-colors slg:grid-cols-[2fr_1fr_auto] relative"
              >
                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold uppercase">
                    {user.first_name.slice(0, 1)}{user.last_name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                {/* Office */}
                <p className="text-sm text-foreground truncate slg:hidden">{officeName(user.office)}</p>

                {/* Status badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                  user.is_active
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openMenuId === user.id && (
                    <div className="absolute right-0 top-full mt-1 z-10 w-32 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      <button
                        onClick={() => openEdit(user)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer count */}
      {!loading && (
        <p className="text-xs text-muted-foreground mt-3">
          Showing {filtered.length} of {users.length} users
        </p>
      )}

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit User" : "Add User"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formErrors.non_field && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
              <span>{formErrors.non_field}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">First Name</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
              {formErrors.first_name && <p className="text-xs text-destructive">{formErrors.first_name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Last Name</label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
              {formErrors.last_name && <p className="text-xs text-destructive">{formErrors.last_name}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Password {editing && <span className="text-muted-foreground font-normal">(leave blank to keep unchanged)</span>}
            </label>
            <input
              type="password"
              required={!editing}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Position</label>
              <input
                required
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
              {formErrors.position && <p className="text-xs text-destructive">{formErrors.position}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Access Level</label>
              <select
                value={form.acc_lvl}
                onChange={(e) => setForm({ ...form, acc_lvl: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              >
                {ACC_LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Office</label>
            <select
              required
              value={form.office}
              onChange={(e) => setForm({ ...form, office: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            >
              <option value={0} disabled>Select an office</option>
              {offices.map((o) => (
                <option key={o.officeID} value={o.officeID}>{o.name}</option>
              ))}
            </select>
            {formErrors.office && <p className="text-xs text-destructive">{formErrors.office}</p>}
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.is_staff}
                onChange={(e) => setForm({ ...form, is_staff: e.target.checked })}
              />
              Staff
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default UserPage;
