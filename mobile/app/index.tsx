import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '../src/lib/theme';
import { fetchActiveOrders } from '../src/lib/api';
import { startTelemetryTracking } from '../src/lib/location';

export const FACITY_MOTOBOYS = [
  { id: 'MOTO-01', nome: 'Junior', username: 'junior', iniciais: 'JR' },
  { id: 'MOTO-02', nome: 'Adrian', username: 'adrian', iniciais: 'AD' },
  { id: 'MOTO-03', nome: 'Naldo', username: 'naldo', iniciais: 'NL' },
  { id: 'MOTO-04', nome: 'David', username: 'david', iniciais: 'DV' },
  { id: 'MOTO-05', nome: 'Alvaro', username: 'alvaro', iniciais: 'AL' },
  { id: 'MOTO-06', nome: 'Diego', username: 'diego', iniciais: 'DG' },
  { id: 'MOTO-07', nome: 'Christofer', username: 'christofer', iniciais: 'CH' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [selectedMotoboy, setSelectedMotoboy] = useState(FACITY_MOTOBOYS[0]);
  const [motoboyStatus, setMotoboyStatus] = useState<'DISPONIVEL' | 'EM_ROTA'>('DISPONIVEL');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
    startTelemetryTracking(selectedMotoboy.id);
  }, [selectedMotoboy.id]);

  const loadOrders = async () => {
    setRefreshing(true);
    try {
      const orders = await fetchActiveOrders();
      const myOrders = orders.filter((o: any) => o.motoboy_id === selectedMotoboy.id && o.status === 'EM_ROTA');
      setActiveOrders(myOrders);
      setMotoboyStatus(myOrders.length > 0 ? 'EM_ROTA' : 'DISPONIVEL');
    } catch (e) {
      console.warn('Erro ao carregar pedidos:', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} tintColor={colors.gold} />}
    >
      {/* Seletor Rápido dos 7 Motoboys Reais do Facity (Iago Lanches 2) */}
      <Text style={[typography.caption, { marginBottom: 8 }]}>
        SELECIONE SEU PERFIL FACITY (IAGO LANCHES 2):
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {FACITY_MOTOBOYS.map((mb) => {
          const active = mb.id === selectedMotoboy.id;
          return (
            <TouchableOpacity
              key={mb.id}
              onPress={() => setSelectedMotoboy(mb)}
              style={[
                styles.chipMotoboy,
                active && { backgroundColor: colors.gold, borderColor: colors.goldLight },
              ]}
            >
              <Text style={[styles.chipMotoboyText, active && { color: '#000', fontWeight: '900' }]}>
                🏍️ {mb.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Card de Status do Entregador */}
      <View style={styles.profileCard}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{selectedMotoboy.iniciais}</Text>
          </View>
          <View>
            <Text style={typography.titleMedium}>{selectedMotoboy.nome} ({selectedMotoboy.username})</Text>
            <Text style={typography.caption}>Base: Av. Fernando Osório, 2870 (Três Vendas)</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, motoboyStatus === 'DISPONIVEL' ? styles.dotGreen : styles.dotGold]} />
          <Text style={[typography.badge, { color: motoboyStatus === 'DISPONIVEL' ? colors.success : colors.gold }]}>
            {motoboyStatus === 'DISPONIVEL' ? 'DISPONÍVEL NO BALCÃO' : 'EM ROTA DE ENTREGA'}
          </Text>
        </View>
      </View>

      {/* Resumo Financeiro da Noite (Cobrança por KM Facity) */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={typography.caption}>Taxas por KM (Hoje)</Text>
          <Text style={styles.metricValueGold}>R$ 72,00</Text>
          <Text style={styles.metricSub}>Tabela KM Facity ativa</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={typography.caption}>Dinheiro Retido</Text>
          <Text style={styles.metricValueRed}>R$ 145,00</Text>
          <Text style={styles.metricSub}>Acerto no caixa</Text>
        </View>
      </View>

      {/* Botão de Ação Principal: Bipar Comanda */}
      <TouchableOpacity
        style={styles.scanButton}
        activeOpacity={0.85}
        onPress={() => router.push('/scanner')}
      >
        <View style={styles.scanIconCircle}>
          <Text style={styles.scanIconText}>⚡</Text>
        </View>
        <View style={styles.scanButtonTextContainer}>
          <Text style={styles.scanButtonTitle}>BIPAR COMANDA DO FACITY</Text>
          <Text style={styles.scanButtonSubtitle}>Vincula a {selectedMotoboy.nome} e abre o Google Maps</Text>
        </View>
      </TouchableOpacity>

      {/* Seção de Entregas Ativas */}
      <View style={styles.sectionHeader}>
        <Text style={typography.titleMedium}>Entregas em Andamento ({activeOrders.length})</Text>
      </View>

      {activeOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhuma entrega em rota para {selectedMotoboy.nome}</Text>
          <Text style={typography.body}>
            Bipe o código de barras da comanda na bancada do Iago Lanches 2 para assumir a entrega automaticamente.
          </Text>
        </View>
      ) : (
        activeOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => router.push(`/delivery/${order.id}`)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>PEDIDO #{order.id}</Text>
              <Text style={styles.orderTotal}>R$ {order.valor_total.toFixed(2)}</Text>
            </View>
            <Text style={styles.clientName}>{order.cliente.nome}</Text>
            <Text style={styles.clientAddress}>
              📍 {order.cliente.logradouro}, {order.cliente.numero} - {order.cliente.bairro} (Pelotas)
            </Text>
            <View style={styles.orderFooter}>
              <Text style={styles.paymentInfo}>
                {order.forma_pagamento} • Taxa KM: R$ {(order.taxa_entrega || 0).toFixed(2)}
              </Text>
              <Text style={styles.viewRouteLink}>Ver Rota no Maps ➔</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  content: { padding: 16, paddingBottom: 40 },
  chipMotoboy: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipMotoboyText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  profileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.goldMuted,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.goldLight, fontWeight: '900', fontSize: 16 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: colors.success },
  dotGold: { backgroundColor: colors.gold },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricBox: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValueGold: { fontSize: 20, fontWeight: '900', color: colors.goldLight, marginTop: 4 },
  metricValueRed: { fontSize: 20, fontWeight: '900', color: colors.red, marginTop: 4 },
  metricSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  scanButton: {
    backgroundColor: colors.gold,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  scanIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIconText: { fontSize: 22 },
  scanButtonTextContainer: { flex: 1 },
  scanButtonTitle: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  scanButtonSubtitle: { color: '#27272a', fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionHeader: { marginBottom: 12 },
  emptyCard: {
    backgroundColor: colors.bgCard,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  orderCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.borderGold,
    marginBottom: 12,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { color: colors.goldLight, fontWeight: '900', fontSize: 14 },
  orderTotal: { color: '#fff', fontWeight: '900', fontSize: 15 },
  clientName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  clientAddress: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentInfo: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  viewRouteLink: { color: colors.info, fontSize: 12, fontWeight: '700' },
});
