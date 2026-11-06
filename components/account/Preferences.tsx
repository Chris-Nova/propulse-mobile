import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { AppSwitch, Card, Gap, Row, SectionTitle, useSettingsTheme } from '@/components/settings/parts';
import { Option, OptionSheet } from '@/components/settings/OptionSheet';
import { setColorSchemePreference, SchemePreference } from '@/utils/appearance';
import {
  DefaultView, TIMEZONES, deviceTimeZone, timeZoneLabel, usePreferences,
} from '@/utils/preferences';

type SheetKey = 'appearance' | 'language' | 'timezone' | 'defaultView' | 'itemsPerPage' | null;

const APPEARANCE: Option<SchemePreference>[] = [
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
];
const LANGUAGES: Option<'en'>[] = [{ value: 'en', label: 'English' }];
const VIEWS: Option<DefaultView>[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'projects', label: 'Projects' },
  { value: 'teams', label: 'Teams' },
  { value: 'messages', label: 'Messages' },
];
const PAGE_SIZES: Option<10 | 20 | 50>[] = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

// Appearance really changes the app. The rest are saved on this device only, because the
// backend has no preferences endpoint yet.
export const Preferences = () => {
  const { theme, light } = useSettingsTheme();
  const [prefs, setPref] = usePreferences();
  const [sheet, setSheet] = useState<SheetKey>(null);
  const close = () => setSheet(null);

  const zone = prefs.timezone || deviceTimeZone() || 'UTC';
  const zoneOptions: Option<string>[] = TIMEZONES.some((t) => t.value === zone)
    ? TIMEZONES
    : [{ value: zone, label: timeZoneLabel(zone) }, ...TIMEZONES];

  return (
    <SettingsShell title="Preferences">
      <Text style={[styles.heading, { color: theme.text }]}>App Preferences</Text>
      <Text style={[styles.sub, { color: theme.muted }]}>Personalise your workspace experience.</Text>

      <Card>
        <Row
          icon="contrast-outline"
          title="Appearance"
          value={light ? 'Light Mode' : 'Dark Mode'}
          onPress={() => setSheet('appearance')}
        />
      </Card>
      <Gap />
      <Card>
        <Row icon="language-outline" title="Language" value="English" onPress={() => setSheet('language')} />
      </Card>
      <Gap />
      <Card>
        <Row icon="globe-outline" title="Time Zone" value={timeZoneLabel(prefs.timezone)} onPress={() => setSheet('timezone')} />
      </Card>

      <SectionTitle>Productivity</SectionTitle>
      <Card>
        <Row
          icon="grid-outline"
          title="Default View"
          value={VIEWS.find((v) => v.value === prefs.defaultView)?.label}
          onPress={() => setSheet('defaultView')}
        />
      </Card>
      <Gap h={6} />
      <Card>
        <Row
          icon="list-outline"
          title="Items per Page"
          value={String(prefs.itemsPerPage)}
          onPress={() => setSheet('itemsPerPage')}
        />
      </Card>

      <SectionTitle>Data & Privacy</SectionTitle>
      <Card>
        <Row
          big
          icon="analytics-outline"
          title="Data Usage"
          subtitle="Help us improve with data usage"
          right={<AppSwitch value={prefs.dataUsage} onValueChange={(v: boolean) => setPref('dataUsage', v)} />}
        />
      </Card>

      <OptionSheet<SchemePreference>
        visible={sheet === 'appearance'}
        title="Appearance"
        options={APPEARANCE}
        selected={light ? 'light' : 'dark'}
        onSelect={(v: SchemePreference) => setColorSchemePreference(v)}
        onClose={close}
      />
      <OptionSheet<'en'>
        visible={sheet === 'language'}
        title="Language"
        options={LANGUAGES}
        selected={prefs.language}
        onSelect={(v: 'en') => setPref('language', v)}
        onClose={close}
        footnote="More languages are coming soon."
      />
      <OptionSheet<string>
        visible={sheet === 'timezone'}
        title="Time Zone"
        options={zoneOptions}
        selected={zone}
        onSelect={(v: string) => setPref('timezone', v)}
        onClose={close}
      />
      <OptionSheet<DefaultView>
        visible={sheet === 'defaultView'}
        title="Default View"
        options={VIEWS}
        selected={prefs.defaultView}
        onSelect={(v: DefaultView) => setPref('defaultView', v)}
        onClose={close}
      />
      <OptionSheet<10 | 20 | 50>
        visible={sheet === 'itemsPerPage'}
        title="Items per Page"
        options={PAGE_SIZES}
        selected={prefs.itemsPerPage}
        onSelect={(v: 10 | 20 | 50) => setPref('itemsPerPage', v)}
        onClose={close}
      />
    </SettingsShell>
  );
};

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 12.5, marginTop: 6, marginBottom: 22 },
});
