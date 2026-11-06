import React, { useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import {
  AppSwitch, Card, IconName, Row, SectionTitle, useSettingsTheme,
} from '@/components/settings/parts';
import { Option, OptionSheet } from '@/components/settings/OptionSheet';
import { NotifFrequency, Prefs, usePreferences } from '@/utils/preferences';

const TYPES: { key: keyof Prefs; icon: IconName; title: string; subtitle: string }[] = [
  { key: 'notifProjectUpdates', icon: 'folder-outline', title: 'Project Updates', subtitle: 'New activity in your projects' },
  { key: 'notifMentions', icon: 'at-outline', title: 'Mentions', subtitle: 'When someone mentions you' },
  { key: 'notifMessages', icon: 'chatbubble-outline', title: 'Messages', subtitle: 'New messages and DMs' },
  { key: 'notifReminders', icon: 'alarm-outline', title: 'Reminders', subtitle: 'Deadline and upcoming tasks' },
  { key: 'notifProductUpdates', icon: 'megaphone-outline', title: 'Product Updates', subtitle: 'New features and updates' },
];

const FREQUENCIES: Option<NotifFrequency>[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'hourly', label: 'Hourly digest' },
  { value: 'daily', label: 'Daily digest' },
];

// Saved on this device only: the backend has no notification-settings endpoint yet.
export const Notifications = () => {
  const { theme } = useSettingsTheme();
  const [prefs, setPref] = usePreferences();
  const [sheet, setSheet] = useState(false);
  const on = prefs.notificationsEnabled;

  return (
    <SettingsShell title="Notifications">
      <Card style={{ backgroundColor: theme.field, borderColor: theme.fieldBorder }}>
        <Row
          big
          icon="notifications-outline"
          title="Enable Notifications"
          subtitle="Get notified about updates and activities"
          right={<AppSwitch value={on} onValueChange={(v: boolean) => setPref('notificationsEnabled', v)} />}
        />
      </Card>

      <SectionTitle>Notification Types</SectionTitle>
      <Card>
        {TYPES.map((t, i) => (
          <Row
            key={t.key}
            icon={t.icon}
            title={t.title}
            subtitle={t.subtitle}
            divider={i > 0}
            dim={!on}
            right={
              <AppSwitch
                value={prefs[t.key] as boolean}
                disabled={!on}
                onValueChange={(v: boolean) => setPref(t.key, v as never)}
              />
            }
          />
        ))}
      </Card>

      <SectionTitle>Notification Frequency</SectionTitle>
      <Card>
        <Row
          icon="time-outline"
          title={FREQUENCIES.find((f) => f.value === prefs.notifFrequency)?.label.replace(' digest', '') ?? 'Instant'}
          onPress={() => setSheet(true)}
          dim={!on}
        />
      </Card>

      <OptionSheet<NotifFrequency>
        visible={sheet}
        title="Notification Frequency"
        options={FREQUENCIES}
        selected={prefs.notifFrequency}
        onSelect={(v: NotifFrequency) => setPref('notifFrequency', v)}
        onClose={() => setSheet(false)}
      />
    </SettingsShell>
  );
};
