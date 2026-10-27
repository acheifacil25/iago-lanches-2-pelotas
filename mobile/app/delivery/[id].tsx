import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography } from '../../src/lib/theme';
import { fetchActiveOrders } from '../../src/lib/api';

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const orders = await fetchActiveOrders();
      const found = orders.find((o: any) => o.id === id);
      setOrder(found);
    } catch (e) {
      console.warn('Erro ao carregar detalhes:', e);
    }
  };

  const openGoogleMaps = () => {
    if (!order) return;
    const { logradouro, numero, bairro, cidade, coordenadas } = order.cliente;
    
    // Deep link do Google Maps com coordenadas ou endereço de Pelotas
    const dest = coordenadas
      ? `${coordenadas.latitude},${coordenadas.longitude}`
      : encodeURIComponent(`${logradouro}, ${numero}, ${bairro}, ${cidade} - RS`);

    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=two-wheeler`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o Google Maps.');
    });
  };

  const callCustomer = () => {
    if (order?.cliente?.telefone) {
      Linking.openURL(`tel:${order.cliente.telefone}`);
    }
  };

  const confirmDelivery = () => {
    Alert.alert(
      'FINALIZAR ENTREGA',
      `Confirma a entrega do pedido #${id} para o cliente ${order?.cliente?.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'SIM, ENTREGUE!',
          onPress: () => {
            Alert.alert('SUCESSO! 🍔', 'Entrega concluída com sucesso! Taxa creditada no seu caixa.');
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!order) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Carregando dados da rota em Pelotas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header do Pedido */}
      <View style={styles.badgeHeader}>
        <Text style={styles.orderBadge}>PEDIDO #{order.id}</Text>
        <Text style={styles.bairroBadge}>Bairro: {order.cliente.bairro}</Text>
      </View>

      {/* Card Principal do Cliente */}
      <View style={styles.card}>
        <Text style={typography.caption}>DESTINATÁRIO</Text>
        <Text style={styles.clientName}>{order.cliente.nome}</Text>
        
        <View style={styles.divider} />

        <Text style={typography.caption}>ENDEREÇO DE ENTREGA EM PELOTAS</Text>
        <Text style={styles.addressText}>
          {order.cliente.logradouro}, {order.cliente.numero}
        </Text>
        <Text style={styles.bairroText}>
          {order.cliente.bairro} • Pelotas - RS
        </Text>
        {order.cliente.complemento && (
          <Text style={styles.complementText}>Complemento: {order.cliente.complemento}</Text>
        )}

        {/* Botão de Ligar para o Cliente */}
        <TouchableOpacity style={styles.callButton} onPress={callCustomer}>
          <Text style={styles.callButtonText}>📞 Ligar para o Cliente ({order.cliente.telefone})</Text>
        </TouchableOpacity>
      </View>

      {/* Botão Gigante do Google Maps */}
      <TouchableOpacity style={styles.mapsButton} onPress={openGoogleMaps} activeOpacity={0.85}>
        <Text style={styles.mapsButtonIcon}>🗺️</Text>
        <View>
          <Text style={styles.mapsButtonTitle}>INICIAR NAVEGAÇÃO NO GOOGLE MAPS</Text>
          <Text style={styles.mapsButtonSubtitle}>Traçar rota direta a partir da Fernando Osório</Text>
        </View>
      </TouchableOpacity>

      {/* Detalhes Financeiros */}
      <View style={styles.card}>
        <Text style={typography.caption}>VALOR A COBRAR DO CLIENTE</Text>
        <View style={styles.financeRow}>
          <Text style={styles.financeLabel}>Total do Pedido:</Text>
          <Text style={styles.financeTotal}>R$ {order.valor_total.toFixed(2)}</Text>
        </View>

        <View style={styles.financeRow}>
          <Text style={styles.financeLabel}>Forma de Pagamento:</Text>
          <Text style={styles.financeValue}>{order.forma_pagamento}</Text>
        </View>

        {order.troco_para && (
          <View style={styles.trocoBox}>
            <Text style={styles.trocoText}>⚠️ LEVAR TROCO PARA: R$ {order.troco_para.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.financeRow}>
          <Text style={styles.financeLabel}>Sua Taxa de Entrega:</Text>
          <Text style={styles.taxaValue}>+ R$ {order.taxa_entrega.toFixed(2)}</Text>
        </View>
      </View>

      {/* Botão de Finalizar Entrega */}
      <TouchableOpacity style={styles.completeButton} onPress={confirmDelivery} activeOpacity={0.85}>
        <Text style={styles.completeButtonText}>✓ FINALIZAR E CONFIRMAR ENTREGA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  badgeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderBadge: {
    backgroundColor: colors.goldMuted,
    color: colors.goldLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontWeight: '900',
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  bairroBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    color: colors.info,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  clientName: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  addressText: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 },
  bairroText: { color: colors.goldLight, fontSize: 13, fontWeight: '600', marginTop: 2 },
  complementText: { color: colors.textMuted, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  callButton: {
    marginTop: 14,
    backgroundColor: colors.bgElevated,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  callButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  mapsButton: {
    backgroundColor: '#1a472a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#2e7d32',
    marginBottom: 16,
  },
  mapsButtonIcon: { fontSize: 26 },
  mapsButtonTitle: { color: '#4caf50', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  mapsButtonSubtitle: { color: '#a5d6a7', fontSize: 11, marginTop: 2 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  financeLabel: { color: colors.textSecondary, fontSize: 13 },
  financeTotal: { color: '#fff', fontSize: 20, fontWeight: '900' },
  financeValue: { color: colors.goldLight, fontSize: 14, fontWeight: '700' },
  taxaValue: { color: colors.success, fontSize: 16, fontWeight: '900' },
  trocoBox: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    borderWidth: 1,
    borderColor: colors.borderRed,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  trocoText: { color: colors.red, fontWeight: '800', fontSize: 12 },
  completeButton: {
    backgroundColor: colors.red,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#c1121f',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  completeButtonText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
});
