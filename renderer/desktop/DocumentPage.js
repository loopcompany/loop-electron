import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { cleanText } from '@helpers/Common';

import { contentGutter, contentMaxWidth } from './Breakpoints';
import { elevation, gradients, motion, onDark, palette, radii, surface } from './desktopTheme';
import { animate } from './globalStyles';
import { Card, DButton, EmptyState, Skeleton, formatNumber, useDir } from './ui';

const COPY = {
  fa: {
    search: 'جستجو در متن…',
    contents: 'فهرست مطالب',
    expandAll: 'باز کردن همه',
    collapseAll: 'بستن همه',
    count: (n) => `${n} بخش`,
    noResults: 'موردی پیدا نشد',
    noResultsHint: 'عبارت دیگری را امتحان کنید.',
    clear: 'پاک کردن',
    helpTitle: 'پاسخ خود را پیدا نکردید؟',
    helpText: 'تیم پشتیبانی لوپ در ساعات کاری پاسخ‌گوی شماست.',
    helpButton: 'پیام به پشتیبانی',
    refresh: 'به‌روزرسانی',
  },
  en: {
    search: 'Search this page…',
    contents: 'Contents',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    count: (n) => `${n} sections`,
    noResults: 'Nothing found',
    noResultsHint: 'Try another word.',
    clear: 'Clear',
    helpTitle: 'Didn’t find your answer?',
    helpText: 'Loop support is here for you during business hours.',
    helpButton: 'Message support',
    refresh: 'Refresh',
  },
};

/**
 * A reading page made of titled sections (FAQ, terms, privacy policy,
 * warranty): a header with a search box, the sections as numbered
 * disclosure cards, and beside them a clickable table of contents and a way
 * to reach support.
 *
 * The screen keeps its own data and open/closed state (`expanded` map keyed
 * by item id, as the mobile screens use with AccordionItem).
 *
 * @param {object} props
 * @param {string} props.icon
 * @param {string} props.title
 * @param {string} [props.lead]
 * @param {string} [props.meta]          e.g. "last updated …"
 * @param {Array<{id: any, title: string, description?: string, warranties?: Array<{id: any, title: string}>}>} props.items
 * @param {Record<string, boolean>} props.expanded
 * @param {(next: Record<string, boolean>) => void} props.setExpanded
 * @param {boolean} [props.loading]
 * @param {import('react').ReactNode} [props.empty]
 * @param {import('react').ReactNode} [props.footer]
 * @param {() => void} [props.onRefresh]
 * @param {boolean} [props.refreshing]
 * @param {boolean} [props.qa]           render titles as questions
 */
export default function DocumentPage({ icon, title, lead, meta, items, expanded, setExpanded, loading, empty, footer, onRefresh, refreshing, qa }) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const scrollRef = useRef(null);
  const positions = useRef({});
  const columnsY = useRef(0);

  const list = Array.isArray(items) ? items : [];
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      q
        ? list.filter((item) =>
            `${item.title} ${cleanText(item.description || '')} ${(item.warranties || []).map((w) => w.title).join(' ')}`
              .toLowerCase()
              .includes(q)
          )
        : list,
    [list, q]
  );
  const allOpen = list.length > 0 && list.every((item) => expanded[item.id]);

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const setAll = (open) => setExpanded(Object.fromEntries(list.map((item) => [item.id, open])));
  const jumpTo = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: true }));
    const y = positions.current[id];
    if (y != null) scrollRef.current?.scrollTo?.({ y: Math.max(0, columnsY.current + y - 12), animated: true });
  };

  return (
    <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.scrollContent}>
      <View style={styles.page}>
        {/* Header */}
        <View style={[styles.hero, animate('loop-fade-up', '340ms')]}>
          <View style={styles.heroStars} pointerEvents="none" />
          <View style={[styles.heroTop, dir.row]}>
            <View style={styles.heroIcon}>
              <Ionicons name={icon} size={26} color={palette.gold} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.heroTitle, dir.bold, dir.align]}>{title}</Text>
              {!!lead && <Text style={[styles.heroLead, dir.light, dir.align]}>{lead}</Text>}
            </View>
            {!!onRefresh && (
              <DButton title={copy.refresh} icon="refresh" variant="glass" size="sm" loading={refreshing} onPress={onRefresh} />
            )}
          </View>
          {list.length > 0 && (
            <View style={[styles.heroBottom, dir.row]}>
              <View style={[styles.search, dir.row]}>
                <Ionicons name="search" size={18} color={onDark.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={copy.search}
                  placeholderTextColor={onDark.muted}
                  style={[styles.searchInput, dir.light, dir.align]}
                />
                {!!query && (
                  <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel={copy.clear} style={styles.searchClear}>
                    <Ionicons name="close" size={16} color={onDark.soft} />
                  </Pressable>
                )}
              </View>
              <View style={[styles.heroMeta, dir.row]}>
                <Text style={[styles.metaText, dir.light]}>{copy.count(formatNumber(list.length, dir.lang))}</Text>
                {!!meta && (
                  <>
                    <View style={styles.metaDot} />
                    <Text style={[styles.metaText, dir.light]}>{meta}</Text>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        {loading ? (
          <View style={[styles.columns, dir.row]}>
            <View style={styles.main}>
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} style={styles.skeletonCard}>
                  <Skeleton width="55%" height={16} />
                  <Skeleton height={12} style={styles.mt10} />
                  <Skeleton width="80%" height={12} style={styles.mt8} />
                </Card>
              ))}
            </View>
          </View>
        ) : list.length === 0 ? (
          <Card>{empty}</Card>
        ) : (
          <View style={[styles.columns, dir.row]} onLayout={(e) => { columnsY.current = e.nativeEvent.layout.y; }}>
            <View style={styles.main}>
              <View style={[styles.listTools, dir.row]}>
                <Text style={[styles.listCount, dir.light, dir.align]}>
                  {q ? `${formatNumber(visible.length, dir.lang)} / ${formatNumber(list.length, dir.lang)}` : ''}
                </Text>
                <DButton
                  title={allOpen ? copy.collapseAll : copy.expandAll}
                  icon={allOpen ? 'contract-outline' : 'expand-outline'}
                  variant="ghost"
                  size="sm"
                  onPress={() => setAll(!allOpen)}
                />
              </View>

              {visible.length === 0 ? (
                <Card>
                  <EmptyState compact icon="search-outline" title={copy.noResults} message={copy.noResultsHint} />
                </Card>
              ) : (
                visible.map((item, i) => {
                  const open = !!expanded[item.id] || !!q;
                  const number = list.indexOf(item) + 1;
                  return (
                    <View
                      key={item.id}
                      onLayout={(e) => {
                        positions.current[item.id] = e.nativeEvent.layout.y;
                      }}
                      style={[styles.item, open && styles.itemOpen, animate('loop-fade-up', '300ms', `${Math.min(i, 8) * 40}ms`)]}
                    >
                      <Pressable
                        onPress={() => toggle(item.id)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: open }}
                        style={({ hovered }) => [styles.itemHead, dir.row, hovered && styles.itemHeadHover]}
                      >
                        <View style={[styles.number, open && styles.numberOpen]}>
                          {qa ? (
                            <Ionicons name="help" size={16} color={open ? palette.navy900 : palette.brandBright} />
                          ) : (
                            <Text style={[styles.numberText, dir.bold, open && styles.numberTextOpen]}>{formatNumber(number, dir.lang)}</Text>
                          )}
                        </View>
                        <Text style={[styles.itemTitle, dir.bold, dir.align, open && styles.itemTitleOpen]}>{item.title}</Text>
                        <View style={[styles.chevron, open && styles.chevronOpen]}>
                          <Ionicons name="chevron-down" size={17} color={open ? palette.brandBright : surface.faint} />
                        </View>
                      </Pressable>
                      {open && (
                        <View style={[styles.itemBody, animate('loop-fade-in', '200ms')]}>
                          {!!item.description && (
                            <Text style={[styles.itemText, dir.light, dir.align]}>{cleanText(item.description)}</Text>
                          )}
                          {item.warranties?.length > 0 && (
                            <View style={[styles.chips, dir.row]}>
                              {item.warranties.map((warranty) => (
                                <View key={warranty.id} style={[styles.chip, dir.row]}>
                                  <Ionicons name="shield-checkmark" size={14} color={palette.success} />
                                  <Text style={[styles.chipText, dir.bold]}>{warranty.title}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
              {footer}
            </View>

            {/* Contents + help */}
            <View style={styles.side}>
              <Card padded={false} style={styles.toc}>
                <Text style={[styles.tocTitle, dir.bold, dir.align]}>{copy.contents}</Text>
                <ScrollView style={styles.tocList} showsVerticalScrollIndicator={false}>
                  {list.map((item, i) => (
                    <Pressable
                      key={item.id}
                      onPress={() => jumpTo(item.id)}
                      accessibilityRole="link"
                      style={({ hovered }) => [styles.tocItem, dir.row, hovered && styles.tocItemHover, expanded[item.id] && styles.tocItemOpen]}
                    >
                      <Text style={[styles.tocNum, dir.bold]}>{formatNumber(i + 1, dir.lang)}</Text>
                      <Text style={[styles.tocText, dir.light, dir.align, expanded[item.id] && styles.tocTextOpen]} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Card>
              <View style={styles.help}>
                <View style={styles.heroStars} pointerEvents="none" />
                <View style={styles.helpIcon}>
                  <Ionicons name="headset" size={22} color={palette.gold} />
                </View>
                <Text style={[styles.helpTitle, dir.bold]}>{copy.helpTitle}</Text>
                <Text style={[styles.helpText, dir.light]}>{copy.helpText}</Text>
                <DButton title={copy.helpButton} icon="chatbubbles-outline" variant="gold" block onPress={() => navigation.navigate('MessageScreen')} />
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
  scrollContent: { paddingHorizontal: contentGutter, paddingBottom: 32 },
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 18 },

  hero: {
    padding: 24,
    gap: 18,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.floating,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  heroTop: { alignItems: 'center', gap: 16 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  heroTitle: { color: onDark.text, fontSize: 22, lineHeight: 34 },
  heroLead: { color: onDark.soft, fontSize: 13.5, lineHeight: 24 },
  heroBottom: { alignItems: 'center', gap: 16 },
  search: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backdropFilter: 'blur(10px)',
  },
  searchInput: { flex: 1, height: 46, fontSize: 14.5, color: onDark.text, outlineStyle: 'none' },
  searchClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    cursor: 'pointer',
  },
  heroMeta: { alignItems: 'center', gap: 8, flexShrink: 0 },
  metaText: { color: onDark.muted, fontSize: 12 },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: onDark.muted },

  columns: { gap: 18, alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0, gap: 10 },
  skeletonCard: { marginBottom: 2 },
  listTools: { alignItems: 'center', justifyContent: 'space-between', minHeight: 34 },
  listCount: { fontSize: 12, color: surface.faint },

  item: {
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
    overflow: 'hidden',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: motion.base,
  },
  itemOpen: { borderColor: 'rgba(29, 95, 174, 0.28)', boxShadow: elevation.raised },
  itemHead: {
    alignItems: 'center',
    gap: 14,
    minHeight: 62,
    paddingHorizontal: 18,
    paddingVertical: 12,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  itemHeadHover: { backgroundColor: 'rgba(0, 43, 84, 0.025)' },
  number: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 95, 174, 0.09)',
  },
  numberOpen: { backgroundImage: gradients.gold },
  numberText: { fontSize: 13, color: palette.brandBright },
  numberTextOpen: { color: palette.navy900 },
  itemTitle: { flex: 1, fontSize: 14.5, lineHeight: 24, color: surface.title },
  itemTitleOpen: { color: surface.brandText },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.sunken,
    transitionProperty: 'transform',
    transitionDuration: motion.base,
  },
  chevronOpen: { transform: 'rotate(180deg)', backgroundColor: 'rgba(29, 95, 174, 0.1)' },
  itemBody: {
    marginHorizontal: 18,
    marginBottom: 18,
    paddingTop: 14,
    paddingHorizontal: 4,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: surface.border,
  },
  itemText: { fontSize: 14, lineHeight: 29, color: surface.muted },
  chips: { flexWrap: 'wrap', gap: 8 },
  chip: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(31, 157, 85, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(31, 157, 85, 0.2)',
  },
  chipText: { fontSize: 12.5, color: surface.title },

  side: { width: 330, flexShrink: 0, gap: 16, position: 'sticky', top: 0 },
  toc: { overflow: 'hidden' },
  tocTitle: { fontSize: 13, color: surface.faint, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  tocList: { maxHeight: 360, paddingHorizontal: 8, paddingBottom: 8 },
  tocItem: {
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.sm,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  tocItemHover: { backgroundColor: surface.cardMuted },
  tocItemOpen: { backgroundColor: 'rgba(29, 95, 174, 0.06)' },
  tocNum: { width: 22, fontSize: 12, color: palette.brandBright, textAlign: 'center', lineHeight: 21 },
  tocText: { flex: 1, fontSize: 12.5, color: surface.muted, lineHeight: 21 },
  tocTextOpen: { color: surface.title },
  help: {
    alignItems: 'center',
    gap: 8,
    padding: 22,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.raised,
  },
  helpIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 4,
  },
  helpTitle: { color: onDark.text, fontSize: 15, textAlign: 'center' },
  helpText: { color: onDark.soft, fontSize: 12.5, lineHeight: 21, textAlign: 'center', marginBottom: 6 },
});
