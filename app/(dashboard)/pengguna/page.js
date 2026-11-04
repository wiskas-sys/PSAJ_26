import { ManagementPage } from '@/components/management-page';
import { RoleGuard } from '@/components/role-guard';

export default function Page() {
    return (
        <RoleGuard allowRole="owner" fallbackTitle="Kelola Pengguna Khusus Owner">
            <ManagementPage
                title="Pengguna"
                description="Atur akun pengguna (Maksimal 3 Owner, 1 Kasir) dan hak akses sistem."
                addLabel="Tambah Pengguna"
            />
        </RoleGuard>
    );
}
