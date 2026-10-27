import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { colors, typography } from '../src/lib/theme';
import { beepDispatch } from '../src/lib/api';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Motoboy logado
  const motoboyId = 'MOTO-01';

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permissionText}>O Iago Lanches 2 precisa de acesso à câmera para bipar as comandas.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
          <Text style={styles.actionBtnText}>CONCEDER PERMISSÃO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // Dispara o Bip atômico no backend FastAPI
      const result = await beepDispatch(data, motoboyId);
      
      Alert.alert(
        'BIP CONFIRMADO! 🛵',
        `Pedido #${result.pedido.id} associado com sucesso!\nCliente: ${result.pedido.cliente.nome}\nBairro: ${result.pedido.cliente.bairro}`,
        [
          {
            text: 'ABRIR ROTA',
            onPress: () => router.replace(`/delivery/${result.pedido.id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('FALHA NO BIP', error.message || 'Código de barras inválido ou já despachado.', [
        {
          text: 'Tentar Novamente',
          onPress: () => setScanned(false),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['code128', 'qr', 'ean13', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Retículo e Laser de Leitura */}
      <View style={styles.overlay}>
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <View style={styles.laserLine} />
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>APONTE PARA A COMANDA IMPRESSA</Text>
          <Text style={styles.instructionSubtitle}>
            Posicione o código de barras ou QR Code no centro da mira
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Despachando pedido no sistema...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>VOLTAR AO INÍCIO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 280,
    height: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    justifyContent: 'center',
  },
  corner: { width: 20, height: 20, position: 'absolute', borderColor: colors.gold, borderWidth: 3 },
  tl: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
  laserLine: {
    height: 2,
    backgroundColor: colors.red,
    shadowColor: '#ff0033',
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  instructionBox: {
    marginTop: 30,
    backgroundColor: 'rgba(16, 16, 20, 0.85)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  instructionTitle: { color: colors.goldLight, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  instructionSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  loadingBox: {
    position: 'absolute',
    backgroundColor: colors.bgCard,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cancelBtn: {
    position: 'absolute',
    bottom: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  permissionText: { color: '#fff', textAlign: 'center', marginBottom: 20, fontSize: 14 },
  actionBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  actionBtnText: { color: '#000', fontWeight: '900' },
});
