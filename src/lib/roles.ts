// M49 — Administrator Panel & RBAC.
//
// Tidak ada endpoint GET /api/roles, jadi 8 kode role RBAC baku (lihat
// RoleSeeder.php backend) di-hardcode di sini untuk dropdown create/edit user.
// PENTING: role_id yang dikirim ke POST/PATCH /users HARUS berupa id numerik
// asli (kolom roles.id), bukan kode string ini — dan roles.id di-generate
// updateOrCreate() per kode (autoincrement, nilainya berbeda-beda tiap
// environment/reseed, jadi TIDAK BISA di-hardcode di sini juga). Halaman
// admin/users meresolusi code -> id secara runtime dari objek `role` yang
// sudah ter-eager-load di setiap AdminUser (GET /users) serta dari role milik
// pengguna yang sedang login (selalu tersedia minimal untuk kode 'admin').
export const ROLE_OPTIONS: { code: string; label: string }[] = [
  { code: "project_manager", label: "Project Manager" },
  { code: "data_acq_officer", label: "Data Acquisition Officer" },
  { code: "terminologist", label: "Terminologist" },
  { code: "pharmacist", label: "Pharmacist Reviewer" },
  { code: "senior_reviewer", label: "Senior Reviewer" },
  { code: "fhir_engineer", label: "FHIR Engineer" },
  { code: "admin", label: "Administrator" },
  { code: "arbiter", label: "Clinical Arbitrator" },
];

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((role) => [role.code, role.label]),
);
