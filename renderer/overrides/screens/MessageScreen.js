/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/MessageScreen.js
 *
 * Support messages as a desktop conversation: the thread fills the page
 * with a composer docked under it (Ctrl+Enter sends), and a side panel with
 * the support contact. On a phone the thread is a collapsible list under the
 * form; on a desktop there is room to show both at once.
 *
 * Same requests and rules as the mobile file: `getTicketsList` on focus,
 * `sendTicketMessage` with the same empty / 5000-character checks and the
 * same alerts.
 *
 * Desktop additions: the thread opens with a welcome from support, and the
 * user's first message is followed by an automatic «sent, we'll review it»
 * reply (both drawn here, not stored on the server). The support card shows
 * the support phone number itself (click copies it) instead of a Call button.
 * The composer has an emoji picker (@desktop/EmojiPicker) that inserts at the caret.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ScreenHeaders from '@components/ScreenHeaders';
import { getTicketsList, sendTicketMessage } from '@services/Api';
import { formatDateTime, showAlert } from '@helpers/Common';

import { Card, DButton, IconButton, Pill, Skeleton, formatNumber, useDir } from '@desktop/ui';
import { elevation, gradients, motion, onDark, palette, radii, surface } from '@desktop/desktopTheme';
import { animate, loop } from '@desktop/globalStyles';
import { contentGutter, contentMaxWidth } from '@desktop/Breakpoints';
import { tip as hoverTip } from '@desktop/tooltip';
import EmojiPicker from '@desktop/EmojiPicker';

const MAX_LENGTH = 5000;

/** Loop support's phone line, shown on the support card. */
const SUPPORT_PHONE = '91693909';

const COPY = {
  fa: {
    thread: 'گفتگو با پشتیبانی',
    threadHint: 'پیام‌های شما و پاسخ‌های تیم لوپ',
    team: 'ارتباط با پشتیبانی',
    teamHint: 'برای دریافت راهنمایی، با تیم پشتیبانی لوپ تماس بگیرید.',
    unread: (n) => `${n} پیام خوانده‌نشده`,
    total: (n) => `${n} پیام`,
    shortcut: 'Ctrl + Enter برای ارسال',
    refresh: 'به‌روزرسانی',
    tips: ['شماره‌ی سفارش را در پیام بنویسید', 'مشکل را با جزئیات توضیح دهید', 'پاسخ‌ها همین‌جا نمایش داده می‌شوند'],
    supportName: 'پشتیبانی لوپ',
    welcome: 'سلام، به پشتیبانی لوپ خوش آمدید. لطفاً موضوع موردنظر خود را با ما در میان بگذارید.',
    received: 'پیام شما با موفقیت ارسال شد. تیم پشتیبانی لوپ در اولین فرصت درخواست شما را بررسی خواهد کرد.',
    copyPhone: 'کپی شماره‌ی تماس',
    copied: 'شماره کپی شد',
  },
  en: {
    thread: 'Conversation with support',
    threadHint: 'Your messages and the Loop team’s replies',
    team: 'Contact support',
    teamHint: 'For guidance, call the Loop support team.',
    unread: (n) => `${n} unread`,
    total: (n) => `${n} messages`,
    shortcut: 'Ctrl + Enter to send',
    refresh: 'Refresh',
    tips: ['Include your order number', 'Describe the problem in detail', 'Replies show up right here'],
    supportName: 'Loop support',
    welcome: 'Hello, welcome to Loop support. Please tell us what you need help with.',
    received: 'Your message was sent successfully. The Loop support team will review your request as soon as possible.',
    copyPhone: 'Copy phone number',
    copied: 'Number copied',
  },
};

const byDate = (a, b) => new Date(a?.created_at).getTime() - new Date(b?.created_at).getTime();

/**
 * The thread as shown: support's welcome first, then the messages, with the
 * automatic reply right after the user's first message.
 */
const withSupportNotes = (messages, copy) => {
  const thread = [{ id: 'loop-welcome', auto: true, message: copy.welcome, role_label: copy.supportName }];
  let replied = false;
  for (const msg of messages) {
    thread.push(msg);
    if (!replied && msg.is_mine) {
      replied = true;
      thread.push({
        id: 'loop-received',
        auto: true,
        message: copy.received,
        role_label: copy.supportName,
        created_at: msg.created_at,
      });
    }
  }
  return thread;
};

export default function MessageScreen() {
  const { t } = useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [focused, setFocused] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  // last caret / selection in the composer, so an emoji lands where the user was typing
  const selectionRef = useRef(null);

  const insertEmoji = (emoji) => {
    const length = messageText.length;
    const sel = selectionRef.current || { start: length, end: length };
    const start = Math.min(sel.start, length);
    const end = Math.min(sel.end, length);
    const caret = start + emoji.length;
    setMessageText(messageText.slice(0, start) + emoji + messageText.slice(end));
    selectionRef.current = { start: caret, end: caret };
    requestAnimationFrame(() => {
      inputRef.current?.focus?.();
      inputRef.current?.setSelectionRange?.(caret, caret);
    });
  };

  const copyPhone = () => {
    try {
      navigator.clipboard?.writeText(SUPPORT_PHONE);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 1600);
    } catch {
      // clipboard is optional
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await getTicketsList();

      if (response.success && response.data) {
        setMessages([...response.data].sort(byDate));
        const unreadAdminMessages = response.data.filter(
          msg => !msg.is_read && !msg.is_mine
        ).length;
        setUnreadCount(unreadAdminMessages);
      }
    } catch (error) {
      console.error(t('Error retrieving messages'), error);
      showAlert(t('Error'), t('Error retrieving messages'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      showAlert(t('Warning'), t('Please enter the message text'));
      return;
    }

    if (messageText.length > MAX_LENGTH) {
      showAlert(t('Warning'), t('Message text should not exceed 5000 characters'));
      return;
    }

    try {
      setSending(true);
      const response = await sendTicketMessage(messageText);

      if (response.success) {
        showAlert(t('Successful'), t('Your message was sent successfully'));
        setMessageText('');
        await fetchMessages();
      }
    } catch (error) {
      showAlert(t('Error'), error.message || t('Error sending message'));
    } finally {
      setSending(false);
    }
  };

  const onKeyPress = (e) => {
    const native = e?.nativeEvent || {};
    if (native.key === 'Enter' && (native.ctrlKey || native.metaKey)) {
      e.preventDefault?.();
      if (!sending) handleSendMessage();
    }
  };

  const over = messageText.length > MAX_LENGTH;

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t('Message')} />
      <View style={[styles.layout, dir.row]}>
        {/* Conversation */}
        <Card padded={false} style={[styles.threadCard, animate('loop-fade-up', '340ms')]}>
          <View style={[styles.threadHeader, dir.row]}>
            <View style={[styles.threadTitleRow, dir.row]}>
              <View style={styles.supportAvatar}>
                <Image source={require('@assets/images/support-nobg.png')} style={styles.supportImage} />
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Text style={[styles.threadTitle, dir.bold, dir.align]}>{copy.thread}</Text>
                <Text style={[styles.threadHint, dir.light, dir.align]}>{copy.threadHint}</Text>
              </View>
            </View>
            <View style={[styles.threadActions, dir.row]}>
              {unreadCount > 0 && <Pill label={copy.unread(formatNumber(unreadCount, dir.lang))} kind="gold" dot />}
              <IconButton icon="refresh" label={copy.refresh} onPress={onRefresh} style={refreshing ? spin : undefined} />
            </View>
          </View>

          <ScrollView
            ref={threadRef}
            style={styles.thread}
            contentContainerStyle={styles.threadContent}
            onContentSizeChange={() => threadRef.current?.scrollToEnd?.({ animated: false })}
          >
            {loading ? (
              [0, 1, 2].map((i) => (
                <View key={i} style={[styles.bubbleRow, i % 2 ? dir.row : { flexDirection: dir.rtl ? 'row' : 'row-reverse' }]}>
                  <Skeleton width={i % 2 ? 320 : 260} height={70} radius={18} />
                </View>
              ))
            ) : (
              withSupportNotes(messages, copy).map((msg, i) => {
                const mine = !!msg.is_mine;
                // the user's own messages sit at the reading end, support's at the start
                const side = mine ? (dir.rtl ? 'flex-start' : 'flex-end') : (dir.rtl ? 'flex-end' : 'flex-start');
                return (
                  <View key={msg.id} style={[styles.bubbleWrap, { alignItems: side }, animate('loop-fade-up', '260ms', `${Math.min(i, 8) * 30}ms`)]}>
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, mine ? (dir.rtl ? styles.tailStartRtl : styles.tailEndLtr) : (dir.rtl ? styles.tailEndRtl : styles.tailStartLtr)]}>
                      <View style={[styles.bubbleHead, dir.row]}>
                        <Ionicons
                          name={mine ? 'person' : 'shield-checkmark'}
                          size={13}
                          color={mine ? onDark.soft : palette.brandBright}
                        />
                        <Text style={[styles.role, dir.bold, mine && styles.roleMine]}>{msg.role_label}</Text>
                        {!msg.is_read && !mine && !msg.auto && <Pill label={t('New')} kind="gold" size="sm" />}
                      </View>
                      <Text style={[styles.messageText, dir.light, dir.align, mine && styles.messageTextMine]} selectable>
                        {msg.message}
                      </Text>
                      <View style={[styles.meta, dir.row]}>
                        {!!msg.created_at && (
                          <Text style={[styles.time, dir.light, mine && styles.timeMine]}>{formatDateTime(msg.created_at)}</Text>
                        )}
                        {mine && (
                          <Ionicons
                            name={msg.is_read ? 'checkmark-done' : 'checkmark'}
                            size={15}
                            color={msg.is_read ? '#7ee2a8' : onDark.muted}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Composer */}
          <View style={styles.composer}>
            <View style={[styles.inputWrap, focused && styles.inputWrapFocused, over && styles.inputWrapError]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, dir.light, dir.align]}
                multiline
                numberOfLines={3}
                placeholder={t('Enter your message here...')}
                placeholderTextColor={surface.faint}
                value={messageText}
                onChangeText={setMessageText}
                onSelectionChange={(e) => {
                  selectionRef.current = e.nativeEvent.selection;
                }}
                onKeyPress={onKeyPress}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                textAlignVertical="top"
                editable={!sending}
              />
              <View style={[styles.composerBar, dir.row]}>
                <View style={[styles.composerTools, dir.row]}>
                  <EmojiPicker onPick={insertEmoji} disabled={sending} />
                  <Text style={[styles.counter, dir.light, over && styles.counterOver]}>
                    {formatNumber(messageText.length, dir.lang)} / {formatNumber(MAX_LENGTH, dir.lang)}
                    {'   ·   '}
                    {copy.shortcut}
                  </Text>
                </View>
                <DButton
                  title={t('Send message to Loop')}
                  icon={dir.rtl ? 'send' : 'send'}
                  onPress={handleSendMessage}
                  loading={sending}
                  disabled={!messageText.trim()}
                  style={dir.rtl ? styles.flipIcon : undefined}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Support panel */}
        <View style={[styles.side, animate('loop-fade-up', '340ms', '80ms')]}>
          <View style={styles.teamCard}>
            <View style={styles.teamStars} pointerEvents="none" />
            <View style={styles.teamAvatar}>
              <Image source={require('@assets/images/support-nobg.png')} style={styles.teamImage} />
            </View>
            <Text style={[styles.teamTitle, dir.bold]}>{copy.team}</Text>
            <Text style={[styles.teamHint, dir.light]}>{copy.teamHint}</Text>
            <View {...hoverTip(copy.copyPhone)}>
              <DButton
                title={phoneCopied ? copy.copied : formatPhone(SUPPORT_PHONE, dir.lang)}
                icon={phoneCopied ? 'checkmark' : 'call'}
                variant="gold"
                block
                onPress={copyPhone}
              />
            </View>
          </View>

          <Card style={styles.tipsCard}>
            <View style={[styles.infoRow, dir.row]}>
              <Ionicons name="information-circle" size={18} color={palette.brandBright} />
              <Text style={[styles.infoText, dir.light, dir.align]}>
                {t('Your messages will be sent to Loop support team and will be answered as soon as possible.')}
              </Text>
            </View>
            {copy.tips.map((tip) => (
              <View key={tip} style={[styles.tip, dir.row]}>
                <View style={styles.tipCheck}>
                  <Ionicons name="checkmark" size={12} color={palette.success} />
                </View>
                <Text style={[styles.tipText, dir.light, dir.align]}>{tip}</Text>
              </View>
            ))}
            <View style={styles.tipDivider} />
            <Text style={[styles.total, dir.light, dir.align]}>{copy.total(formatNumber(messages.length, dir.lang))}</Text>
          </Card>
        </View>
      </View>
    </View>
  );
}

const spin = loop('loop-spin', '800ms');

/** Digits as the UI language writes them, without thousands separators. */
const formatPhone = (phone, lang) => (lang === 'fa' ? phone.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : phone);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  layout: {
    flex: 1,
    minHeight: 0,
    gap: 20,
    paddingHorizontal: contentGutter,
    paddingBottom: 24,
    width: '100%',
    maxWidth: contentMaxWidth + contentGutter * 2,
    alignSelf: 'center',
  },

  threadCard: { flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', boxShadow: elevation.raised },
  threadHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: surface.border,
  },
  threadTitleRow: { alignItems: 'center', gap: 12 },
  supportAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundImage: gradients.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportImage: { width: 34, height: 34, resizeMode: 'contain' },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.success,
    borderWidth: 2,
    borderColor: surface.card,
  },
  threadTitle: { fontSize: 15.5, color: surface.title },
  threadHint: { fontSize: 12, color: surface.faint },
  threadActions: { alignItems: 'center', gap: 8 },

  thread: {
    flex: 1,
    backgroundColor: surface.cardMuted,
    backgroundImage: 'radial-gradient(rgba(0, 43, 84, 0.05) 1px, transparent 1px)',
    backgroundSize: '18px 18px',
  },
  threadContent: { padding: 24, gap: 14, flexGrow: 1 },
  bubbleRow: { gap: 8 },
  bubbleWrap: { width: '100%' },
  bubble: { maxWidth: '72%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, gap: 6 },
  bubbleMine: { backgroundImage: gradients.brand, boxShadow: '0 6px 16px rgba(0, 43, 84, 0.18)' },
  bubbleTheirs: { backgroundColor: surface.card, borderWidth: 1, borderColor: surface.border, boxShadow: elevation.card },
  tailStartRtl: { borderBottomLeftRadius: 6 },
  tailEndLtr: { borderBottomRightRadius: 6 },
  tailEndRtl: { borderBottomRightRadius: 6 },
  tailStartLtr: { borderBottomLeftRadius: 6 },
  bubbleHead: { alignItems: 'center', gap: 6 },
  role: { fontSize: 12, color: palette.brandBright },
  roleMine: { color: onDark.soft },
  messageText: { fontSize: 14, lineHeight: 25, color: surface.title },
  messageTextMine: { color: palette.white },
  meta: { alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  time: { fontSize: 11, color: surface.faint },
  timeMine: { color: onDark.muted },

  composer: { padding: 16, borderTopWidth: 1, borderTopColor: surface.border, backgroundColor: surface.card },
  inputWrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: motion.fast,
  },
  inputWrapFocused: { borderColor: palette.sky, boxShadow: elevation.focus },
  inputWrapError: { borderColor: palette.danger },
  input: {
    minHeight: 84,
    maxHeight: 200,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    fontSize: 14,
    lineHeight: 24,
    color: surface.title,
    outlineStyle: 'none',
  },
  composerBar: { alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 8, paddingHorizontal: 12 },
  composerTools: { alignItems: 'center', gap: 8 },
  counter: { fontSize: 11.5, color: surface.faint },
  counterOver: { color: palette.danger },
  flipIcon: {},

  side: { width: 330, flexShrink: 0, gap: 16 },
  teamCard: {
    borderRadius: radii.xl,
    padding: 24,
    gap: 10,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.floating,
  },
  teamStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  teamAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    boxShadow: '0 0 30px rgba(79, 143, 224, 0.45)',
    marginBottom: 4,
  },
  teamImage: { width: 66, height: 66, resizeMode: 'contain' },
  teamTitle: { fontSize: 16, color: onDark.text, textAlign: 'center' },
  teamHint: { fontSize: 12.5, color: onDark.soft, textAlign: 'center', lineHeight: 21, marginBottom: 6 },
  tipsCard: { gap: 12 },
  infoRow: { gap: 10, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 22, color: surface.muted },
  tip: { alignItems: 'center', gap: 10 },
  tipCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 157, 85, 0.12)',
  },
  tipText: { flex: 1, fontSize: 12.5, color: surface.title },
  tipDivider: { height: 1, backgroundColor: surface.border },
  total: { fontSize: 12, color: surface.faint },
});
