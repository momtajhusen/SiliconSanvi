import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Search, UserPlus, MoreHorizontal, Inbox } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../../components/ui/DropdownMenu';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';

const USERS = [
  { id: 1, name: 'Riya Sharma', email: 'riya@sanvi.dev', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Amit Kumar', email: 'amit@sanvi.dev', role: 'Editor', status: 'Active' },
  { id: 3, name: 'Neha Verma', email: 'neha@sanvi.dev', role: 'Viewer', status: 'Invited' },
  { id: 4, name: 'Rahul Singh', email: 'rahul@sanvi.dev', role: 'Editor', status: 'Active' },
  { id: 5, name: 'Pooja Patel', email: 'pooja@sanvi.dev', role: 'Viewer', status: 'Disabled' },
];

const STATUS_VARIANT = { Active: 'default', Invited: 'secondary', Disabled: 'destructive' };

export default function UsersPage() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return USERS.filter((user) => {
      if (role !== 'All' && user.role !== role) return false;
      return !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    });
  }, [query, role]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage who can access the admin panel.</p>
        </div>
        <Button size="sm" onClick={() => toast.success('Invite sent')}>
          <UserPlus className="h-4 w-4" />
          Invite user
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Search by name or email…"
              iconLeft={<Search className="h-4 w-4" />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={role} onChange={(event) => setRole(event.target.value)} className="sm:w-40">
              <option>All</option>
              <option>Admin</option>
              <option>Editor</option>
              <option>Viewer</option>
            </Select>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={<Inbox className="w-8 h-8 text-muted-foreground" />}
              title="No users found"
              description="Try a different search or role filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar alt={user.name} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu align="end" trigger={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>}>
                        <DropdownMenuItem onClick={() => toast('Edit coming soon')}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success('Password reset sent')}>Reset password</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toast.error(`${user.name} disabled`)}>Disable</DropdownMenuItem>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
