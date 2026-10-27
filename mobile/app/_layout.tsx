import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.bgDark} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.bgCard,
          },
          headerTintColor: colors.gold,
          headerTitleStyle: {
            fontWeight: '900',
            fontSize: 16,
          },
          contentStyle: {
            backgroundColor: colors.bgDark,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'IAGO LANCHES 2 • MOTOBOY',
          }}
        />
        <Stack.Screen
          name="scanner"
          options={{
            title: 'BIPAR COMANDA',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="delivery/[id]"
          options={{
            title: 'ROTA ATIVA • PELOTAS',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
