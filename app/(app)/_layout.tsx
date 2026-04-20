import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

const TabIcon = ({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) => (
  <Ionicons
    name={focused ? name : `${name}-outline` as any}
    size={SIZES.iconLg}
    color={focused ? COLORS.primary : COLORS.textMuted}
  />
);

const hidden = {
  tabBarButton: () => null,
  tabBarItemStyle: { display: 'none' as const, width: 0, height: 0 },
};

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: SIZES.tabBarHeight + (Platform.OS === 'ios' ? 20 : 0),
          paddingBottom: Platform.OS === 'ios' ? 20 : SIZES.sm,
          paddingTop: SIZES.xs,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: SIZES.caption, fontWeight: '600' },
      }}
    >
      {/* Visible tabs */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="teams/index"
        options={{
          title: 'Teams',
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects/index"
        options={{
          title: 'Projects',
          tabBarIcon: ({ focused }) => <TabIcon name="folder" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="documents/index"
        options={{
          title: 'Documents',
          tabBarIcon: ({ focused }) => <TabIcon name="document-text" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics/index"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} />,
        }}
      />

      {/* Hidden screens */}
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
