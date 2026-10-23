import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboardTheme } from '@/constants/dashboardTheme';

const hidden = {
  tabBarButton: () => null,
  tabBarItemStyle: { display: 'none' as const, width: 0, height: 0 },
};

// Screens opened from the "More" tab (or from Quick Actions) keep "More" highlighted.
const isUnder = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export default function AppLayout() {
  const theme = useDashboardTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const bar = theme.tabBar;

  const active = {
    // Messages is opened from Home's Quick Actions, so Home stays lit there.
    home: isUnder(pathname, '/dashboard') || isUnder(pathname, '/messages') || pathname === '/',
    projects: isUnder(pathname, '/projects'),
    teams: isUnder(pathname, '/teams'),
    more: ['/more', '/documents', '/analytics', '/account'].some((p) => isUnder(pathname, p)),
  };

  const icon = (name: keyof typeof Ionicons.glyphMap, focusedName: keyof typeof Ionicons.glyphMap, on: boolean) =>
    () => <Ionicons name={on ? focusedName : name} size={22} color={on ? bar.active : bar.inactive} />;

  // Label with the small purple underline the design shows under the active tab.
  const label = (text: string, on: boolean) => () => (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 10, fontWeight: on ? '600' : '400', color: on ? bar.active : bar.inactive }}>
        {text}
      </Text>
      <View
        style={{
          marginTop: 4, width: 22, height: 2, borderRadius: 1,
          backgroundColor: on ? bar.active : 'transparent',
        }}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bar.background,
          borderTopColor: bar.border,
          borderTopWidth: theme.shadow ? 0 : 1,
          ...(theme.shadow
            ? { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 12 }
            : { elevation: 0 }),
          height: 58 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
      }}
    >
      {/* Visible tabs, in the order shown in the design */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Home',
          tabBarIcon: icon('home-outline', 'home', active.home),
          tabBarLabel: label('Home', active.home),
        }}
      />
      <Tabs.Screen
        name="projects/index"
        options={{
          title: 'Projects',
          tabBarIcon: icon('folder-outline', 'folder', active.projects),
          tabBarLabel: label('Projects', active.projects),
        }}
      />
      <Tabs.Screen
        name="teams/index"
        options={{
          title: 'Teams',
          tabBarIcon: icon('people-outline', 'people', active.teams),
          tabBarLabel: label('Teams', active.teams),
        }}
      />
      <Tabs.Screen
        name="more/index"
        options={{
          title: 'More',
          tabBarIcon: icon('ellipsis-horizontal', 'ellipsis-horizontal', active.more),
          tabBarLabel: label('More', active.more),
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="documents/index" options={hidden} />
      <Tabs.Screen name="analytics/index" options={hidden} />
      <Tabs.Screen name="messages/index" options={hidden} />
      <Tabs.Screen name="messages/[chatId]/index" options={hidden} />
      <Tabs.Screen name="account/index" options={hidden} />
      <Tabs.Screen name="projects/create" options={hidden} />
      <Tabs.Screen name="projects/[projectId]/index" options={hidden} />
      <Tabs.Screen name="projects/[projectId]/edit" options={hidden} />
      <Tabs.Screen name="teams/members/[memberId]/index" options={hidden} />
    </Tabs>
  );
}
