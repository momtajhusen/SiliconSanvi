import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import useThemeStore from '../../stores/themeStore';
import { cn } from '../../lib/utils';

export default function SettingsPage() {
  const { user, login } = useAuth();
  const { theme, setTheme } = useThemeStore();
  const [name, setName] = useState(user?.name || '');

  const saveProfile = (event) => {
    event.preventDefault();
    login({ ...user, name: name.trim() || user.name });
    toast.success('Profile saved');
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Your profile and admin panel preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="mt-3">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How your name appears in the admin panel.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="grid max-w-xl gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="mt-3">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Applies to the admin panel. The public website always stays light.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid max-w-md grid-cols-2 gap-3">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
                      theme === option.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <option.icon className="h-5 w-5" />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
