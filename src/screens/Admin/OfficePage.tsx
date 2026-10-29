import { useEffect, useState } from "react";
import { Search, Plus, MoreHorizontal, Building2 } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import { TableSkeleton } from "./Skeleton";
import Modal from "../../components/ui/modal";
import { officeService, Office, OfficeFormPayload } from "./officeService";

const emptyForm: OfficeFormPayload = {
  name: "",
  officeMail: "",
  street: "",
  city: "",
  province: "",
  region: "",
};

const OfficePage = () => {
  const [loading, setLoading]   = useState(true);
  const [offices, setOffices]   = useState<Office[]>([]);
  const [search, setSearch]     = useState("");
  const [error, setError]       = useState<string | null>(null);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Office | null>(null);
  const [form, setForm]             = useState<OfficeFormPayload>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving]         = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        setOffices(await officeService.list());
      } catch {
        setError("Failed to load offices. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = offices.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.city.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (office: Office) => {
    setEditing(office);
    setForm({
      name: office.name,
      officeMail: office.officeMail,
      street: office.street,
      city: office.city,
      province: office.province,
      region: office.region,
    });
    setFormErrors({});
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (office: Office) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this office?",
      text: `"${office.name}" will be permanently removed.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    });
    if (!result.isConfirmed) return;

    try {
      await officeService.remove(office.officeID);
      setOffices((prev) => prev.filter((o) => o.officeID !== office.officeID));
      Swal.fire({
        icon: "success",
        title: "Office deleted",
        timer: 1200,
        showConfirmButton: false,
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail ?? "Failed to delete office."
        : "Failed to delete office.";
      Swal.fire({ icon: "error", title: "Error", text: msg });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    try {
      if (editing) {
        const updated = await officeService.update(editing.officeID, form);
        setOffices((prev) => prev.map((o) => (o.officeID === editing.officeID ? updated : o)));
      } else {
        const created = await officeService.create(form);
        setOffices((prev) => [...prev, created]);
      }
      setModalOpen(false);
      Swal.fire({
        icon: "success",
        title: editing ? "Office updated" : "Office created",
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
        setFormErrors({ non_field: "Failed to save office. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Offices" subtitle="Manage office branches">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:flex-col sm:items-stretch">
        <div className="relative flex-1 max-w-xs sm:max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search offices..."
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
          Add Office
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
        <TableSkeleton rows={5} />
      ) : (
        <div className="bg-card border border-border rounded-xl">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_auto] gap-4 px-5 py-3 border-b border-border bg-muted/40 rounded-t-xl slg:grid-cols-[2fr_1fr_auto]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Office</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide slg:hidden">Location</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Users</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</p>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No offices found.
            </div>
          ) : (
            filtered.map((office) => (
              <div
                key={office.officeID}
                className="grid grid-cols-[2fr_1.5fr_1fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-0 last:rounded-b-xl items-center hover:bg-accent/40 transition-colors slg:grid-cols-[2fr_1fr_auto]"
              >
                {/* Office info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-accent flex items-center justify-center text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{office.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{office.officeMail}</p>
                  </div>
                </div>

                {/* Location */}
                <p className="text-sm text-foreground truncate slg:hidden">
                  {office.city}, {office.province}
                </p>

                {/* Users */}
                <p className="text-sm text-foreground">{office.numUsers}</p>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === office.officeID ? null : office.officeID)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openMenuId === office.officeID && (
                    <div className="absolute right-0 top-full mt-1 z-10 w-32 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      <button
                        onClick={() => openEdit(office)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(office)}
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

      {!loading && (
        <p className="text-xs text-muted-foreground mt-3">
          Showing {filtered.length} of {offices.length} offices
        </p>
      )}

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Office" : "Add Office"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formErrors.non_field && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
              <span>{formErrors.non_field}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Office Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Office Email</label>
            <input
              type="email"
              required
              value={form.officeMail}
              onChange={(e) => setForm({ ...form, officeMail: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {formErrors.officeMail && <p className="text-xs text-destructive">{formErrors.officeMail}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Street</label>
            <input
              required
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {formErrors.street && <p className="text-xs text-destructive">{formErrors.street}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">City</label>
              <input
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
              {formErrors.city && <p className="text-xs text-destructive">{formErrors.city}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Province</label>
              <input
                required
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
              {formErrors.province && <p className="text-xs text-destructive">{formErrors.province}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Region</label>
            <input
              required
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {formErrors.region && <p className="text-xs text-destructive">{formErrors.region}</p>}
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
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Office"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default OfficePage;
