import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDateTime, formatPrice } from '@helpers/Common';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from '@services/WalletApi';
import { describePayment } from '@services/paymentMethods';

import { motion, palette, surface } from './desktopTheme';
import { Pill, Skeleton, formatNumber, useDir } from './ui';

/**
 * Wallet transactions as a table: what, when, status, amount. Shared by the
 * wallet page (latest few) and the transactions page (all of them).
 *
 * The API sends every amount as a positive number; the direction comes from
 * `type` (a charge is money in, an order payment is money out) — the same
 * rule the mobile Wallet screen uses.
 */
export function useTransactionLabels() {
  const { t } = useTranslation();
  const typeLabel = (type) => {
    switch (Number(type)) {
      case TRANSACTION_TYPE.CHARGE:
        return t('Wallet recharge');
      case TRANSACTION_TYPE.ORDER_GATEWAY:
        return t('Online Payment');
      case TRANSACTION_TYPE.ORDER_WALLET:
        return t('Wallet Deduction');
      default:
        return t('Unknown');
    }
  };
  const statusMeta = (status) => {
    switch (Number(status)) {
      case TRANSACTION_STATUS.SUCCESS:
        return { label: t('Successful'), kind: 'success' };
      case TRANSACTION_STATUS.FAILED:
        return { label: t('Failed'), kind: 'danger' };
      case TRANSACTION_STATUS.PENDING:
        return { label: t('Pending'), kind: 'warning' };
      default:
        return { label: t('Unknown'), kind: 'neutral' };
    }
  };
  return { typeLabel, statusMeta };
}

const typeIcon = (type) =>
  ({
    [TRANSACTION_TYPE.CHARGE]: 'arrow-down',
    [TRANSACTION_TYPE.ORDER_GATEWAY]: 'card-outline',
    [TRANSACTION_TYPE.ORDER_WALLET]: 'arrow-up',
  })[Number(type)] || 'swap-vertical';

const COLUMNS = {
  fa: { what: 'شرح تراکنش', when: 'تاریخ و ساعت', status: 'وضعیت', amount: 'مبلغ (تومان)' },
  en: { what: 'Transaction', when: 'Date & time', status: 'Status', amount: 'Amount (Toman)' },
};

export default function TransactionTable({ items, loading, skeletonRows = 4, emptyText, detailed }) {
  const dir = useDir();
  const { t } = useTranslation();
  const { typeLabel, statusMeta } = useTransactionLabels();
  const cols = COLUMNS[dir.rtl ? 'fa' : 'en'];

  const header = (
    <View style={[styles.row, styles.headRow, dir.row]}>
      <Text style={[styles.head, styles.colWhat, dir.bold, dir.align]}>{cols.what}</Text>
      <Text style={[styles.head, styles.colWhen, dir.bold, dir.align]}>{cols.when}</Text>
      <Text style={[styles.head, styles.colStatus, dir.bold, dir.align]}>{cols.status}</Text>
      <Text style={[styles.head, styles.colAmount, dir.bold, { textAlign: dir.rtl ? 'left' : 'right' }]}>{cols.amount}</Text>
    </View>
  );

  if (loading) {
    return (
      <View>
        {header}
        {Array.from({ length: skeletonRows }, (_, i) => (
          <View key={i} style={[styles.row, dir.row]}>
            <View style={[styles.colWhat, styles.what, dir.row]}>
              <Skeleton width={38} height={38} radius={12} />
              <Skeleton width="60%" height={12} />
            </View>
            <View style={styles.colWhen}><Skeleton width="70%" height={12} /></View>
            <View style={styles.colStatus}><Skeleton width={70} height={22} radius={11} /></View>
            <View style={[styles.colAmount, dir.rtl ? styles.alignStart : styles.alignEnd]}><Skeleton width={90} height={14} /></View>
          </View>
        ))}
      </View>
    );
  }

  if (!items?.length) {
    return (
      <View>
        {header}
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={26} color={palette.brandBright} />
          </View>
          <Text style={[styles.emptyText, dir.light]}>{emptyText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {header}
      {items.map((item) => {
        const credit = Number(item?.type) === TRANSACTION_TYPE.CHARGE;
        const status = statusMeta(item?.status);
        return (
          <View key={String(item?.id)} style={[styles.row, styles.dataRow, dir.row]}>
            <View style={[styles.colWhat, styles.what, dir.row]}>
              <View style={[styles.icon, { backgroundColor: credit ? 'rgba(31,157,85,0.11)' : 'rgba(0,43,84,0.07)' }]}>
                <Ionicons name={typeIcon(item?.type)} size={17} color={credit ? palette.success : surface.brandText} />
              </View>
              <View style={styles.whatText}>
                <Text style={[styles.title, dir.bold, dir.align]} numberOfLines={1}>
                  {item?.description || typeLabel(item?.type)}
                </Text>
                <Text style={[styles.sub, dir.light, dir.align]} numberOfLines={1}>
                  {[
                    typeLabel(item?.type),
                    item?.order_id ? `#${item.order_id}` : null,
                    detailed ? describePayment(item)?.label : null,
                    detailed && item?.referenceId ? `${t('Tracking Number:')} ${item.referenceId}` : null,
                  ].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            </View>
            <Text style={[styles.cell, styles.colWhen, dir.light, dir.align]} numberOfLines={1}>
              {formatDateTime(item?.created_at)}
            </Text>
            <View style={styles.colStatus}>
              <Pill label={status.label} kind={status.kind} size="sm" dot />
            </View>
            <Text
              style={[
                styles.amount,
                styles.colAmount,
                dir.bold,
                { textAlign: dir.rtl ? 'left' : 'right', color: credit ? palette.success : surface.title },
              ]}
              numberOfLines={1}
            >
              {credit ? '+' : '−'}
              {dir.rtl ? formatNumber(Number(item?.price), 'fa') : formatPrice(Number(item?.price))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    minHeight: 62,
    borderTopWidth: 1,
    borderTopColor: surface.border,
  },
  headRow: { minHeight: 40, backgroundColor: surface.cardMuted },
  dataRow: { transitionProperty: 'background-color', transitionDuration: motion.fast },
  head: { fontSize: 11.5, color: surface.faint },
  colWhat: { flex: 2.4, minWidth: 0 },
  colWhen: { flex: 1.2, minWidth: 0 },
  colStatus: { flex: 0.9, minWidth: 0 },
  colAmount: { flex: 1, minWidth: 0 },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  what: { alignItems: 'center', gap: 12 },
  whatText: { flex: 1, minWidth: 0, gap: 2 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13.5, color: surface.title },
  sub: { fontSize: 11.5, color: surface.faint },
  cell: { fontSize: 12.5, color: surface.muted },
  amount: { fontSize: 14.5 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 10, borderTopWidth: 1, borderTopColor: surface.border },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 143, 224, 0.1)',
  },
  emptyText: { fontSize: 13, color: surface.faint },
});
