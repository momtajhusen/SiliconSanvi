import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alert';
import { Loader, Skeleton } from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Avatar from '../../components/ui/Avatar';
import Tag from '../../components/ui/Tag';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import KpiCard from '../../components/ui/KpiCard';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../../components/ui/DropdownMenu';
import { toast } from 'react-hot-toast';
import { Package, Search, Inbox, MoreHorizontal, ShoppingCart, TrendingUp, Users } from 'lucide-react';

function Section({ title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function UiShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tags, setTags] = useState(['Design', 'Frontend', 'Backend']);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold">UI Showcase</h1>
        <p className="text-muted-foreground">
          Every shared component in the design system, in one place — the reference for keeping
          the website and admin panel visually consistent.
        </p>
      </div>

      <Section title="Buttons" description="Six variants across four sizes">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Package className="w-4 h-4" /></Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      <Section title="Badges & Tags" description="Status pills and removable tags">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map(tag => (
              <Tag key={tag} onClose={() => setTags(tags.filter(t => t !== tag))}>
                {tag}
              </Tag>
            ))}
            {tags.length === 0 && (
              <Button variant="outline" size="sm" onClick={() => setTags(['Design', 'Frontend', 'Backend'])}>
                Reset tags
              </Button>
            )}
          </div>
        </div>
      </Section>

      <Section title="Form Controls" description="Inputs, selects and text areas used across every form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Text input</label>
            <Input placeholder="Full name" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">With icon</label>
            <Input placeholder="Search users…" iconLeft={<Search className="w-4 h-4" />} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">With error</label>
            <Input placeholder="Email" error="Enter a valid email address" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Select</label>
            <Select defaultValue="Admin">
              <option>Admin</option>
              <option>Editor</option>
              <option>Viewer</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1 block">Textarea</label>
            <Textarea rows={3} placeholder="Write a note…" />
          </div>
        </div>
      </Section>

      <Section title="KPI Cards" description="The stat tile used on every dashboard and list page">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Revenue" value="₹4,20,000" delta={18.4} icon={TrendingUp} />
          <KpiCard label="Users" value={1284} delta={12.5} icon={Users} tone="sky" />
          <KpiCard label="Churn" value="2.1%" delta={-0.8} icon={Package} tone="rose" />
          <KpiCard label="Open Tickets" value={9} icon={ShoppingCart} tone="amber" />
        </div>
      </Section>

      <Section title="Table" description="Standard data table used by every list screen">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">USR-1042</TableCell>
              <TableCell>Riya Sharma</TableCell>
              <TableCell><Badge variant="outline">Admin</Badge></TableCell>
              <TableCell><Badge>Active</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">USR-1041</TableCell>
              <TableCell>Amit Kumar</TableCell>
              <TableCell><Badge variant="outline">Editor</Badge></TableCell>
              <TableCell><Badge variant="outline">Invited</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Tabs" description="Segmented control for switching views within a page">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-muted-foreground pt-2">
              A summary of the workspace and its key numbers.
            </p>
          </TabsContent>
          <TabsContent value="activity">
            <p className="text-sm text-muted-foreground pt-2">
              The latest actions taken by your team.
            </p>
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Alerts" description="Inline messaging in four severities">
        <div className="space-y-3">
          <Alert>
            <AlertTitle>Backup scheduled</AlertTitle>
            <AlertDescription>A full backup runs every night at 2 AM.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Profile saved</AlertTitle>
            <AlertDescription>Your changes are live for every team member.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Storage almost full</AlertTitle>
            <AlertDescription>You have used 90% of your file storage.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>The server returned an error. Please try again.</AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section title="Overlays" description="Modal, drawer, dropdown menu and toast">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
          <DropdownMenu trigger={<Button variant="outline"><MoreHorizontal className="w-4 h-4" /></Button>}>
            <DropdownMenuItem onClick={() => toast.success('User updated')}>Edit User</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast('Password reset sent')}>Reset Password</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.error('User disabled')}>Disable User</DropdownMenuItem>
          </DropdownMenu>
          <Button variant="outline" onClick={() => toast.success('Saved successfully')}>Show Toast</Button>
        </div>
      </Section>

      <Section title="Avatars & Breadcrumbs" description="Identity and navigation primitives">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar fallback="MH" />
            <Avatar alt="Riya Sharma" />
            <Avatar alt="Amit Kumar" />
          </div>
          <Breadcrumbs items={[{ label: 'Users', href: '/users' }, { label: 'Riya Sharma' }]} />
        </div>
      </Section>

      <Section title="Loading & Empty States" description="What every screen shows before data arrives">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Loader size="sm" />
              <Loader />
              <Loader size="lg" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <EmptyState
            icon={<Inbox className="w-8 h-8 text-muted-foreground" />}
            title="No users yet"
            description="Invite your first team member to get started."
            action={<Button variant="outline" size="sm">Invite user</Button>}
          />
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Delete user"
        description="This user will lose access to the admin panel."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setModalOpen(false)}>Delete user</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Riya Sharma will be removed from the workspace. This cannot be undone.
        </p>
      </Modal>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="User USR-1042">
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">Riya Sharma · riya@sanvi.dev</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium">Admin · Active</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last seen</p>
            <p className="font-medium">2 minutes ago</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
